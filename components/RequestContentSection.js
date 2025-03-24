'use client';

import React, { useState, useEffect, useRef } from 'react';
import ClientOnly from './ClientOnly';
import { VscCode, VscJson, VscRefresh, VscSymbolParameter, VscRequestChanges } from 'react-icons/vsc';
import ContentCard from './request-content/ContentCard';

/**
 * Composant pour afficher le contenu complet des requêtes
 * Ce composant est complémentaire au NetworkMonitorSection et se concentre 
 * sur l'affichage du contenu des requêtes plutôt que sur leurs métadonnées
 */
export default function RequestContentSection() {
    // État pour stocker le contenu des requêtes
    const [requestContent, setRequestContent] = useState(null);
    const [responseContent, setResponseContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Références pour le stockage en mémoire tampon et les requêtes actuelles
    const requestBufferRef = useRef([]);
    const responseBufferRef = useRef([]);
    const bufferSizeLimit = 1024 * 1024; // Environ 1Mo
    const currentBufferSizeRef = useRef(0);
    
    // État pour mémoriser les dernières requêtes/réponses même sans correspondance
    const [bufferedRequests, setBufferedRequests] = useState([]);
    const [bufferedResponses, setBufferedResponses] = useState([]);
    
    // Référence pour le polling
    const pollingTimeoutRef = useRef(null);
    
    // Nouvel état pour la gestion des segments (chunks)
    const [chunkedData, setChunkedData] = useState({
        currentChunk: 0,
        totalChunks: 1,
        receivedChunks: [],
        assembledData: null,
        isLoading: false
    });
    
    /**
     * Récupère un segment spécifique des logs
     * @param {number} chunkIndex - Index du segment à récupérer
     * @param {boolean} silent - Ne pas afficher les erreurs non critiques
     * @param {string} chunkId - Identifiant du jeu de chunks (optionnel)
     * @returns {Promise<Object>} - Les données du segment
     */
    const fetchLogChunk = async (chunkIndex, silent = false, chunkId = null) => {
        try {
            // Construire l'URL avec l'index du segment et éventuellement l'ID du chunk
            let url = `http://localhost:7778/logs?limit=10&bodies=true&chunk=${chunkIndex}`;
            
            // Si un ID de chunk est fourni, l'ajouter à l'URL
            if (chunkId) {
                url += `&chunkId=${chunkId}`;
            }
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Erreur lors de la récupération du segment ${chunkIndex}: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            if (!silent) {
                console.error(`Erreur lors de la récupération du segment ${chunkIndex}:`, error);
                setError(`Erreur lors de la récupération du segment ${chunkIndex}: ${error.message}`);
            }
            return null;
        }
    };
    
    /**
     * Collecte tous les segments d'un ensemble de données
     * @param {Object} firstChunk - Le premier segment récupéré
     */
    const collectAllChunks = async (firstChunk) => {
        try {
            // Vérifier si c'est un format chunked
            if (!firstChunk.chunked) {
                // Ce n'est pas un ensemble segmenté, retourner directement
                return {
                    success: true,
                    assembledData: firstChunk,
                    fromSingleChunk: true
                };
            }
            
            // Extraire les informations de segmentation
            const { totalChunks, currentChunk, chunkId } = firstChunk;
            
            console.log(`Données segmentées détectées: segment ${currentChunk + 1}/${totalChunks} (ID: ${chunkId})`);
            
            // Initialiser le tableau pour stocker tous les segments
            const allChunks = new Array(totalChunks).fill(null);
            allChunks[currentChunk] = firstChunk.data;
            
            // Mettre à jour l'état pour montrer le progrès
            setChunkedData(prev => ({
                ...prev,
                currentChunk: currentChunk,
                totalChunks: totalChunks,
                receivedChunks: allChunks,
                isLoading: true
            }));
            
            // Récupérer tous les autres segments
            const fetchPromises = [];
            for (let i = 0; i < totalChunks; i++) {
                if (i !== currentChunk) {
                    fetchPromises.push(fetchLogChunk(i, true, chunkId));
                }
            }
            
            // Attendre que tous les segments soient récupérés
            const results = await Promise.all(fetchPromises);
            
            // Remplir le tableau avec les résultats
            for (let i = 0; i < results.length; i++) {
                const result = results[i];
                if (result && result.chunked) {
                    const idx = result.currentChunk;
                    allChunks[idx] = result.data;
                }
            }
            
            // Vérifier si tous les segments ont été récupérés
            if (allChunks.some(chunk => chunk === null)) {
                throw new Error("Certains segments n'ont pas pu être récupérés");
            }
            
            // Assembler les données
            const assembledData = assembleChunks(allChunks);
            
            // Mettre à jour l'état
            setChunkedData(prev => ({
                ...prev,
                receivedChunks: allChunks,
                assembledData: assembledData,
                isLoading: false
            }));
            
            return {
                success: true,
                assembledData: assembledData,
                fromSingleChunk: false
            };
        } catch (error) {
            console.error("Erreur lors de la collecte des segments:", error);
            setChunkedData(prev => ({
                ...prev,
                isLoading: false
            }));
            
            return {
                success: false,
                error: error
            };
        }
    };
    
    /**
     * Version améliorée de la fonction d'assemblage des chunks
     * @param {Array} chunks - Tableau de segments à assembler
     * @returns {Object} - Objet assemblé
     */
    const assembleChunks = (chunks) => {
        if (!chunks || chunks.length === 0) {
            return null;
        }
        
        // Si un seul segment, le retourner directement
        if (chunks.length === 1) {
            return chunks[0];
        }
        
        // Vérifier si les chunks contiennent des logs ou sont directement des logs
        const firstChunk = chunks[0];
        const hasLogs = firstChunk && typeof firstChunk === 'object' && Array.isArray(firstChunk.logs);
        
        if (hasLogs) {
            // Assembler les métadonnées et les logs
            const metadata = { ...firstChunk };
            delete metadata.logs;
            
            // Assembler tous les logs dans un seul tableau
            const allLogs = chunks.reduce((acc, chunk) => {
                if (chunk && chunk.logs && Array.isArray(chunk.logs)) {
                    return [...acc, ...chunk.logs];
                }
                return acc;
            }, []);
            
            // Retourner l'objet assemblé
            return {
                ...metadata,
                logs: allLogs
            };
        } else if (Array.isArray(firstChunk)) {
            // Si les chunks sont directement des tableaux, les concaténer
            return chunks.reduce((acc, chunk) => {
                if (Array.isArray(chunk)) {
                    return [...acc, ...chunk];
                }
                return acc;
            }, []);
        } else {
            // Si les chunks sont des objets sans structure "logs", les fusionner
            // Note: cela suppose que les objets ont des propriétés distinctes
            return chunks.reduce((acc, chunk) => {
                if (chunk && typeof chunk === 'object') {
                    return { ...acc, ...chunk };
                }
                return acc;
            }, {});
        }
    };
    
    /**
     * Récupère le contenu des requêtes
     * @param {boolean} force - Force la mise à jour même s'il n'y a pas de nouvelles requêtes
     * @param {boolean} silent - Ne pas afficher les erreurs non critiques
     */
    const fetchRequestContent = async (force = false, silent = false) => {
        try {
            setLoading(true);
            
            // Récupérer les vraies requêtes depuis l'API
            try {
                // Récupérer le premier segment des logs
                const firstChunk = await fetchLogChunk(0);
                
                if (!firstChunk) {
                    if (!silent) {
                        console.log('Aucun log disponible');
                    }
                    setLoading(false);
                    scheduleNextPolling();
                    return;
                }
                
                // Collecter tous les segments si nécessaire
                const { success, assembledData, fromSingleChunk } = await collectAllChunks(firstChunk);
                
                if (!success || !assembledData) {
                    throw new Error("Impossible d'assembler les données");
                }
                
                const logsData = assembledData;
                
                // Si le serveur a renvoyé une erreur, l'afficher mais continuer
                if (logsData.error) {
                    console.warn(`Avertissement du serveur proxy: ${logsData.error}`);
                    setError(`Note: ${logsData.error}. Les données peuvent être incomplètes.`);
                }
                
                // Vérifier si nous avons des logs (nouvelle structure avec pagination)
                const logs = logsData.logs || logsData;
                
                if (!logs || logs.length === 0) {
                    if (!silent) {
                        console.log('Aucun log disponible');
                    }
                    setLoading(false);
                    scheduleNextPolling();
                    return;
                }
                
                // Debug: afficher les URLs disponibles
                console.log('URLs disponibles dans les logs:', logs.map(log => log.url));
                
                // Filtrer les logs pour ne garder que ceux qui concernent les API Cursor
                const cursorLogs = logs.filter(log => 
                    log.url && 
                    (log.url.includes('api2.cursor.sh') || log.url.includes('api.cursor.sh')) &&
                    !log.url.includes('/stats') && 
                    !log.url.includes('/logs') &&
                    !log.url.includes('/reset')
                );
                
                // Debug: afficher les logs filtrés
                console.log('Logs après filtrage:', cursorLogs.length, 'sur', logs.length);
                if (cursorLogs.length > 0) {
                    console.log('Premier log filtré:', cursorLogs[0].url);
                }
                
                if (cursorLogs.length === 0) {
                    if (!silent) {
                        console.log('Aucun log Cursor disponible');
                    }
                    setLoading(false);
                    scheduleNextPolling();
                    return;
                }
                
                // Trouver la dernière requête et la dernière réponse
                const outgoingLogs = cursorLogs.filter(log => log.direction === 'outgoing');
                const incomingLogs = cursorLogs.filter(log => log.direction === 'incoming');
                
                // Trier par timestamp (plus récent d'abord)
                const sortedOutgoing = [...outgoingLogs].sort((a, b) => b.timestamp - a.timestamp);
                const sortedIncoming = [...incomingLogs].sort((a, b) => b.timestamp - a.timestamp);
                
                // Si nous avons des requêtes sortantes
                if (sortedOutgoing.length > 0) {
                    const latestRequest = sortedOutgoing[0];
                    
                    // Extraire le corps avec plus de sécurité
                    let requestBody;
                    
                    if (latestRequest.bodyOmitted) {
                        // Corps omis par le serveur
                        requestBody = { 
                            truncated: true, 
                            message: "Corps omis par le serveur pour des raisons de performance",
                            note: "Le serveur proxy a simplifié cette requête pour éviter des erreurs."
                        };
                    } else {
                        // Vérifier si le corps existe et le traiter en fonction de son type
                        const rawBody = latestRequest.body;
                        
                        if (rawBody === undefined || rawBody === null) {
                            requestBody = {};
                            console.log("Corps de requête absent ou null");
                        } else if (typeof rawBody === 'string' && rawBody.trim() === '') {
                            requestBody = {};
                            console.log("Corps de requête vide (chaîne vide)");
                        } else {
                            requestBody = rawBody;
                            console.log("Corps de requête détecté:", 
                                typeof requestBody === 'object' ? 
                                `Object with ${Object.keys(requestBody).length} keys` : 
                                typeof requestBody);
                        }
                    }
                    
                    const requestContent = {
                        id: `req-${latestRequest.timestamp}`,
                        timestamp: latestRequest.timestamp,
                        method: latestRequest.method || 'GET',
                        url: latestRequest.url,
                        headers: latestRequest.headersOmitted ? {} : (latestRequest.headers || {}),
                        body: requestBody,
                        size: latestRequest.size || 0,
                        simplified: latestRequest.bodyOmitted || latestRequest.headersOmitted
                    };
                    
                    // Ajouter la requête au buffer et mettre à jour l'affichage
                    addToBuffer(requestContent, 'request');
                    setRequestContent(formatContent(requestContent));
                    
                    // Si nous n'avons que des requêtes sortantes, charger une réponse depuis le buffer
                    if (bufferedResponses.length > 0) {
                        setResponseContent(formatContent(bufferedResponses[0].content));
                    }
                }
                
                // Si nous avons des réponses entrantes
                if (sortedIncoming.length > 0) {
                    const latestResponse = sortedIncoming[0];
                    
                    // Extraction sécurisée du corps
                    let responseBody;
                    
                    if (latestResponse.bodyOmitted) {
                        // Corps omis par le serveur
                        responseBody = { 
                            truncated: true, 
                            message: "Corps omis par le serveur pour des raisons de performance",
                            note: "Le serveur proxy a simplifié cette réponse pour éviter des erreurs."
                        };
                    } else {
                        // Vérifier si le corps existe et le traiter en fonction de son type
                        const rawBody = latestResponse.body;
                        
                        if (rawBody === undefined || rawBody === null) {
                            responseBody = {};
                            console.log("Corps de réponse absent ou null");
                        } else if (typeof rawBody === 'string' && rawBody.trim() === '') {
                            responseBody = {};
                            console.log("Corps de réponse vide (chaîne vide)");
                        } else {
                            responseBody = rawBody;
                            console.log("Corps de réponse détecté:", 
                                typeof responseBody === 'object' ? 
                                `Object with ${Object.keys(responseBody).length} keys` : 
                                typeof responseBody);
                        }
                    }
                    
                    const responseContent = {
                        id: `res-${latestResponse.timestamp}`,
                        timestamp: latestResponse.timestamp,
                        status: latestResponse.status || 200,
                        method: 'RESPONSE',
                        url: latestResponse.url,
                        headers: latestResponse.headersOmitted ? {} : (latestResponse.headers || {}),
                        body: responseBody,
                        size: latestResponse.size || 0,
                        simplified: latestResponse.bodyOmitted || latestResponse.headersOmitted
                    };
                    
                    // Ajouter la réponse au buffer et mettre à jour l'affichage
                    addToBuffer(responseContent, 'response');
                    setResponseContent(formatContent(responseContent));
                    
                    // Si nous n'avons que des réponses entrantes, charger une requête depuis le buffer
                    if (bufferedRequests.length > 0) {
                        setRequestContent(formatContent(bufferedRequests[0].content));
                    }
                }
                
                setLoading(false);
                setError(null);
                
            } catch (apiError) {
                console.error('Erreur API:', apiError);
                
                // Remplacer les données simulées par un message d'erreur clair
                if (process.env.NODE_ENV === 'development') {
                    console.log('Mode démo: Pas de données simulées - lancement du serveur proxy requis');
                    
                    setError('Le serveur proxy n\'est pas disponible. Veuillez lancer le serveur proxy avec la commande: npm run clean');
                    
                    setLoading(false);
                } else {
                    throw apiError;
                }
            }
            
            // Planifier le prochain polling
            scheduleNextPolling();
        } catch (error) {
            if (!silent) {
                console.error('Erreur lors de la récupération du contenu:', error);
                setError(error.message);
            }
            
            setLoading(false);
            scheduleNextPolling();
        }
    };
    
    /**
     * Ajoute une requête ou une réponse au buffer
     * @param {Object} content - Le contenu à ajouter
     * @param {string} type - Le type de contenu ('request' ou 'response')
     */
    const addToBuffer = (content, type) => {
        const buffer = type === 'request' ? requestBufferRef.current : responseBufferRef.current;
        
        // Estimer la taille du contenu
        const contentSize = estimateSize(content);
        
        // Ajouter le contenu au début du buffer
        buffer.unshift({
            content,
            timestamp: Date.now(),
            size: contentSize
        });
        
        // Mettre à jour la taille totale du buffer
        currentBufferSizeRef.current += contentSize;
        
        // Supprimer les anciens éléments si la taille dépasse la limite
        while (currentBufferSizeRef.current > bufferSizeLimit && buffer.length > 1) {
            const removed = buffer.pop();
            currentBufferSizeRef.current -= removed.size;
        }
        
        // Mettre à jour les buffers d'état pour un accès depuis le composant
        if (type === 'request') {
            setBufferedRequests([...buffer]);
        } else {
            setBufferedResponses([...buffer]);
        }
        
        // Enregistrer dans le fichier local si nécessaire
        saveToFile(content, type);
    };
    
    /**
     * Estime la taille d'un objet en octets
     * @param {Object} obj - L'objet à mesurer
     * @returns {number} - La taille estimée en octets
     */
    const estimateSize = (obj) => {
        const jsonString = JSON.stringify(obj);
        return new TextEncoder().encode(jsonString).length;
    };
    
    /**
     * Enregistre le contenu dans un fichier
     * @param {Object} content - Le contenu à sauvegarder
     * @param {string} type - Le type de contenu ('request' ou 'response')
     */
    const saveToFile = async (content, type) => {
        // Cette fonction sera implémentée côté serveur
        // Pour le moment, simulons juste un log
        console.log(`Sauvegarde du contenu de type '${type}' pour référence future`);
    };
    
    /**
     * Formate le contenu pour l'affichage
     * @param {Object} content - Le contenu à formater
     * @returns {Object} - Le contenu formaté
     */
    const formatContent = (content) => {
        // Si le contenu est null ou undefined, retourner null
        if (!content) return null;
        
        // Si le contenu est déjà formaté, le retourner tel quel
        if (content.formatted) return content;
        
        // Extraire les informations essentielles
        const {
            id,
            timestamp,
            method,
            url,
            body,
            headers,
            status,
            size,
            simplified
        } = content;
        
        // Log pour le débogage - voir ce que nous recevons exactement
        console.log("Contenu à formater:", {
            type: typeof body,
            isArray: Array.isArray(body),
            isNull: body === null,
            keys: body && typeof body === 'object' ? Object.keys(body).join(', ') : 'N/A'
        });
        
        // Si le corps est marqué comme simplifié par le serveur, ajouter une indication
        let formattedBody = null;
        
        // Si le corps indique une troncation serveur, le formater spécialement
        if (body && body.truncated && body.message) {
            formattedBody = {
                type: 'json',
                content: {
                    _truncated: true,
                    _note: body.note,
                    message: body.message,
                    _simplified: true
                }
            };
        } else if (body === null || body === undefined) {
            // Corps explicitement null ou undefined
            formattedBody = {
                type: 'empty',
                content: null
            };
        } else if (body && typeof body === 'object' && Object.keys(body).length === 0) {
            // Objet vide
            formattedBody = {
                type: 'json',
                content: {}
            };
        } else {
            // Dans tous les autres cas, essayer de formater normalement
            formattedBody = formatBody(body);
            
            // Vérification supplémentaire si formatBody a échoué
            if (!formattedBody || (formattedBody.type === 'text' && !formattedBody.content)) {
                console.warn("Le formatage du corps a produit un résultat incomplet:", formattedBody);
                formattedBody = {
                    type: 'text',
                    content: JSON.stringify(body, null, 2) || "[Corps non affichable]"
                };
            }
        }
        
        // Créer un objet avec le contenu formaté
        return {
            id: id || `req-${Date.now()}`,
            timestamp: timestamp || Date.now(),
            method: method || 'UNKNOWN',
            url: url || '',
            formattedBody: formattedBody,
            headers: headers || {},
            status: status || 0,
            size: size || 0,
            simplified: simplified || false,
            formatted: true
        };
    };
    
    /**
     * Formate le corps de la requête pour l'affichage
     * @param {any} body - Le corps à formater
     * @returns {Object} - Le corps formaté
     */
    const formatBody = (body) => {
        if (!body) return { type: 'empty', content: null };
        
        try {
            // Afficher ce que nous essayons de formater pour le débogage
            console.log("Formatage du corps de type:", typeof body);
            
            // Si c'est déjà un type formaté
            if (body.type === 'json' && body.content) {
                return body; // Déjà au bon format
            }
            
            // Si le corps est une chaîne qui ressemble à du JSON
            if (typeof body === 'string') {
                const trimmedBody = body.trim();
                
                if (trimmedBody === '') {
                    return { type: 'empty', content: null };
                }
                
                // Détecter si c'est une requête Claude (contient des mots-clés spécifiques)
                const isClaudeRequest = 
                    trimmedBody.includes('"model"') && 
                    (trimmedBody.includes('"messages"') || 
                     trimmedBody.includes('"max_tokens"') || 
                     trimmedBody.includes('"anthropic"') ||
                     trimmedBody.includes('"claude"') ||
                     trimmedBody.includes('"sonnet"'));
                
                // Si c'est potentiellement du JSON, essayer de le parser
                if ((trimmedBody.startsWith('{') && trimmedBody.endsWith('}')) || 
                    (trimmedBody.startsWith('[') && trimmedBody.endsWith(']'))) {
                    try {
                        const parsedJson = JSON.parse(trimmedBody);
                        
                        // Ne plus ajouter de marqueur spécial pour les requêtes Claude
                        // Traiter comme un JSON normal
                        return { type: 'json', content: parsedJson };
                    } catch (e) {
                        console.warn("Erreur lors du parsing JSON:", e);
                        // Si le parsing échoue, traiter comme du texte
                        return { type: 'text', content: trimmedBody };
                    }
                }
                
                // Si ce n'est pas du JSON, c'est du texte
                return { type: 'text', content: trimmedBody };
            }
            
            // Si le corps est déjà un objet
            if (typeof body === 'object' && body !== null) {
                // Vérifier si l'objet a une forme spéciale indiquant un format déjà traité
                if (body._truncated || body._simplified) {
                    return {
                        type: 'json',
                        content: body
                    };
                }
                
                // Détecter si c'est une requête Claude
                const isClaudeRequest = 
                    body.model && 
                    (body.messages || 
                     body.max_tokens || 
                     (typeof body.model === 'string' && 
                      (body.model.includes('claude') || 
                       body.model.includes('anthropic'))));
                
                // Ne plus ajouter de marqueur spécial pour les requêtes Claude
                // Traiter comme un objet JSON normal
                
                // Gérer spécifiquement Buffer
                if (body.type === 'Buffer' && Array.isArray(body.data)) {
                    try {
                        // Convertir le buffer en chaîne
                        const bufferStr = String.fromCharCode.apply(null, body.data);
                        
                        // Vérifier si c'est du JSON
                        try {
                            const parsed = JSON.parse(bufferStr);
                            return {
                                type: 'json',
                                content: parsed
                            };
                        } catch (jsonError) {
                            // Sinon c'est juste du texte
                            return {
                                type: 'text',
                                content: bufferStr
                            };
                        }
                    } catch (bufferError) {
                        console.log("Erreur lors de la conversion du buffer:", bufferError);
                        // En cas d'erreur, traiter comme un objet standard
                        return {
                            type: 'json',
                            content: body
                        };
                    }
                }
                
                // Si c'est un ArrayBuffer ou une vue typée
                if (body instanceof ArrayBuffer || 
                    (body.buffer && body.buffer instanceof ArrayBuffer)) {
                    try {
                        // Convertir en UTF-8
                        const decoder = new TextDecoder('utf-8');
                        const text = decoder.decode(body instanceof ArrayBuffer ? body : body.buffer);
                        
                        // Essayer de parser comme JSON
                        try {
                            const parsed = JSON.parse(text);
                            return {
                                type: 'json',
                                content: parsed
                            };
                        } catch (jsonError) {
                            // Sinon c'est juste du texte
                            return {
                                type: 'text',
                                content: text
                            };
                        }
                    } catch (e) {
                        console.log("Erreur lors de la conversion de l'ArrayBuffer:", e);
                        return {
                            type: 'binary',
                            content: "Données binaires non affichables"
                        };
                    }
                }
                
                // Pour les autres objets, les convertir en JSON
                return {
                    type: 'json',
                    content: body
                };
            }
            
            // Pour les autres types (number, boolean, etc.)
            return {
                type: 'text',
                content: String(body)
            };
        } catch (e) {
            console.error("Erreur lors du formatage du corps:", e);
            return {
                type: 'error',
                content: "Erreur lors du formatage du corps: " + e.message
            };
        }
    };
    
    /**
     * Formate la date pour l'affichage
     * @param {number} timestamp - Le timestamp à formater
     * @returns {string} - La date formatée
     */
    const formatDate = (timestamp) => {
        if (!timestamp) return 'Date inconnue';
        
        const date = new Date(timestamp);
        return date.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };
    
    /**
     * Filtre les en-têtes pour ne conserver que les essentielles
     * Cette fonction est maintenue pour la compatibilité mais renvoie maintenant les en-têtes complètes
     * @param {Object} headers - Les en-têtes à filtrer
     * @returns {Object} - Les en-têtes filtrées (toutes les en-têtes dans notre cas)
     */
    const filterEssentialHeaders = (headers) => {
        // Pour la compatibilité, nous retournons maintenant toutes les en-têtes
        if (!headers || typeof headers !== 'object') return {};
        return { ...headers };
    };
    
    /**
     * Planifie le prochain polling
     */
    const scheduleNextPolling = () => {
        if (pollingTimeoutRef.current) {
            clearTimeout(pollingTimeoutRef.current);
        }
        
        // Polling toutes les 1-2 secondes
        const interval = Math.floor(Math.random() * 1000) + 1000;
        
        pollingTimeoutRef.current = setTimeout(() => {
            fetchRequestContent(false, true);
        }, interval);
    };
    
    /**
     * Rafraîchit manuellement les données
     */
    const handleRefresh = () => {
        fetchRequestContent(true);
    };
    
    /**
     * Tente de trouver une réponse qui correspond à une requête
     * @param {Array} incomingLogs - Liste des logs entrants
     * @param {Object} request - La requête pour laquelle chercher une réponse
     * @returns {Object|null} - La réponse correspondante ou null
     */
    const findMatchingResponse = (incomingLogs, request) => {
        if (!request || !request.url || !incomingLogs || incomingLogs.length === 0) {
            return null;
        }

        // Obtenir l'URL de base sans les paramètres
        const requestBaseUrl = request.url.split('?')[0];
        
        // Chercher les réponses avec la même URL de base
        const potentialMatches = incomingLogs.filter(log => {
            if (!log.url) return false;
            const logBaseUrl = log.url.split('?')[0];
            return logBaseUrl === requestBaseUrl;
        });
        
        if (potentialMatches.length === 0) {
            return null;
        }
        
        // Trouver la réponse la plus proche dans le temps (après la requête)
        return potentialMatches.reduce((closest, current) => {
            if (!closest) return current;
            
            const closestTimeDiff = closest.timestamp - request.timestamp;
            const currentTimeDiff = current.timestamp - request.timestamp;
            
            // Préférer les réponses qui viennent après la requête
            if (closestTimeDiff < 0 && currentTimeDiff > 0) {
                return current;
            }
            
            if (closestTimeDiff > 0 && currentTimeDiff > 0) {
                return (currentTimeDiff < closestTimeDiff) ? current : closest;
            }
            
            // Si toutes les réponses sont avant la requête (situation anormale),
            // prendre la plus proche
            return (Math.abs(currentTimeDiff) < Math.abs(closestTimeDiff)) ? current : closest;
        }, null);
    };
    
    // Initialiser le composant
    useEffect(() => {
        fetchRequestContent(true);
        
        return () => {
            if (pollingTimeoutRef.current) {
                clearTimeout(pollingTimeoutRef.current);
            }
        };
    }, []);
    
    return (
        <>
            {/* Section de contenu des requêtes avec ID d'ancrage */}
            <section id="request-viewer" className="py-8 relative scroll-mt-24">
                <div className="container mx-auto">
                    <h2 className="text-2xl font-bold mb-6 flex items-center">
                        <VscJson className="mr-2 text-primary" />
                        Inspecteur de Contenu des Requêtes
                        
                        <button 
                            onClick={handleRefresh} 
                            className="ml-4 p-2 rounded-full hover:bg-primary/20 transition-colors"
                            title="Rafraîchir"
                        >
                            <VscRefresh className={loading ? "animate-spin" : ""} />
                        </button>
                    </h2>
                    
                    <p className="text-gray-400 mb-6">
                        Examinez en détail le contenu des requêtes entre Cursor et l'API. Cette vue complémentaire au moniteur réseau vous permet d'analyser les données échangées.
                    </p>
                    
                    <div className="rc-container">
                        <div className="rc-border"></div>
                        <div className="rc-background"></div>
                        
                        <div className="rc-glow-effect top-0 right-0"></div>
                        <div className="rc-glow-effect bottom-0 left-0"></div>
                        
                        <div className="rc-content">
                            <ClientOnly>
                                {() => (
                                    <div className="p-6 h-full flex flex-col">
                                        {error ? (
                                            <div className="notification notification-error">
                                                <p>{error}</p>
                                                <p className="mt-2 text-sm">
                                                    Assurez-vous que le serveur proxy est démarré avec la commande: <code>npm run clean</code>
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[600px] h-auto">
                                                <div className="request-content-panel">
                                                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                                                        <VscRequestChanges className="mr-2 text-primary" />
                                                        Requête Client
                                                    </h3>
                                                    <ContentCard 
                                                        content={requestContent} 
                                                        title="Requête Client"
                                                        type="request" 
                                                        isLoading={loading}
                                                    />
                                                </div>
                                                
                                                <div className="response-content-panel">
                                                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                                                        <VscSymbolParameter className="mr-2 text-primary" />
                                                        Réponse Serveur
                                                    </h3>
                                                    <ContentCard 
                                                        content={responseContent} 
                                                        title="Réponse Serveur"
                                                        type="response"
                                                        isLoading={loading}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </ClientOnly>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
} 