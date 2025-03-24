'use client';

import React, { useState, useEffect, useRef } from 'react';
import ClientOnly from '../components/ClientOnly';
import RequestCard from './network/RequestCard';
import ResetButton from './network/ResetButton';
import { FiActivity, FiArrowUp, FiArrowDown, FiRefreshCw } from 'react-icons/fi';

// Fonction pour supprimer les erreurs de console liées aux ports de message
// Cette fonction est exécutée une seule fois au chargement du composant
const suppressConsoleErrors = () => {
    // Sauvegarder la fonction console.error originale
    const originalConsoleError = console.error;
    
    // Remplacer console.error par une fonction qui filtre certaines erreurs
    console.error = function(message, ...args) {
        // Ignorer les erreurs liées aux ports de message et aux connexions
        if (typeof message === 'string' && 
            (message.includes('message port closed') || 
             message.includes('Receiving end does not exist'))) {
            return;
        }
        
        // Appeler la fonction originale pour les autres erreurs
        originalConsoleError.apply(console, [message, ...args]);
    };
    
    // Retourner une fonction pour restaurer console.error
    return () => {
        console.error = originalConsoleError;
    };
};

export default function NetworkMonitorSection() {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({ incoming: 0, outgoing: 0 });
    const [loading, setLoading] = useState(true);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState(null);
    const [latestOutgoing, setLatestOutgoing] = useState(null);
    const [latestIncoming, setLatestIncoming] = useState(null);
    const [lastDirection, setLastDirection] = useState(null); // 'incoming' ou 'outgoing'
    const [lastRequestType, setLastRequestType] = useState(null); // type de la dernière requête
    const [directionPulse, setDirectionPulse] = useState(false); // état pour l'animation de pulsation de la direction
    const [typePulse, setTypePulse] = useState(false); // état pour l'animation de pulsation du type
    const prevStatsRef = useRef({ incoming: 0, outgoing: 0 });
    const [resetNotification, setResetNotification] = useState(false);
    
    // Références pour les timeouts
    const resetTimeoutRef = useRef(null);
    const pollingTimeoutRef = useRef(null);
    const prevLogsRef = useRef([]);
    const prevLatestOutgoingRef = useRef(null);
    const prevLatestIncomingRef = useRef(null);
    const lastPollTimeRef = useRef(Date.now());
    const hasNewRequestsRef = useRef(false);
    const initialLoadDoneRef = useRef(false);

    /**
     * Récupère les données des logs et met à jour l'état
     * @param {boolean} force - Forcer la mise à jour même s'il n'y a pas de nouvelles requêtes
     * @param {boolean} silent - Ne pas afficher les erreurs non critiques
     */
    const fetchData = async (force = false, silent = false) => {
        try {
            if (!initialLoadDoneRef.current) {
                setLoading(true);
                setInitialLoading(true);
            }
            
            const [logsResponse, statsResponse] = await Promise.all([
                fetch('http://localhost:7778/logs'),
                fetch('http://localhost:7778/stats')
            ]);

            if (!logsResponse.ok || !statsResponse.ok) {
                throw new Error('Erreur lors de la récupération des données');
            }

            const logs = await logsResponse.json();
            const stats = await statsResponse.json();

            const hasNewRequests = 
                stats.incoming !== prevStatsRef.current.incoming || 
                stats.outgoing !== prevStatsRef.current.outgoing;
            
            hasNewRequestsRef.current = hasNewRequests;
            
            if (hasNewRequests) {
                setStats(stats);
                prevStatsRef.current = stats;
            }
            
            if (!hasNewRequests && !force) {
                lastPollTimeRef.current = Date.now();
                
                scheduleNextPolling();
                return;
            }

            const filteredLogs = logs.filter(log => 
                log.url && 
                (
                    log.url.includes('api2.cursor.sh') || 
                    log.url.includes('/api/v1/') ||
                    (log.method === 'RESPONSE' && log.direction === 'incoming')
                ) && 
                !log.url.includes('/stats') && 
                !log.url.includes('/logs')
            );
            
            const formattedLogs = filteredLogs.map(log => formatLogForCard(log));
            
            const outgoingLogs = formattedLogs.filter(log => 
                (log.method !== 'RESPONSE' && log.direction.includes('Envoi')) || 
                (log.rawLog && log.rawLog.direction === 'outgoing')
            );
            
            const incomingLogs = formattedLogs.filter(log => 
                (log.method === 'RESPONSE' && log.direction.includes('Réception')) || 
                (log.rawLog && log.rawLog.direction === 'incoming')
            );
            
            outgoingLogs.sort((a, b) => new Date(b.rawLog.timestamp) - new Date(a.rawLog.timestamp));
            incomingLogs.sort((a, b) => new Date(b.rawLog.timestamp) - new Date(a.rawLog.timestamp));
            
            const newLatestOutgoing = outgoingLogs.length > 0 ? outgoingLogs[0] : null;
            const newLatestIncoming = incomingLogs.length > 0 ? incomingLogs[0] : null;
            
            const outgoingChanged = newLatestOutgoing && 
                (!prevLatestOutgoingRef.current || 
                 newLatestOutgoing.id !== prevLatestOutgoingRef.current.id);
                 
            const incomingChanged = newLatestIncoming && 
                (!prevLatestIncomingRef.current || 
                 newLatestIncoming.id !== prevLatestIncomingRef.current.id);
            
            if (outgoingChanged) {
                setLatestOutgoing(newLatestOutgoing);
                prevLatestOutgoingRef.current = newLatestOutgoing;
                setLastDirection('outgoing');
                setLastRequestType(newLatestOutgoing.type);
                setDirectionPulse(prev => !prev);
                setTypePulse(prev => !prev);
            }

            if (incomingChanged) {
                setLatestIncoming(newLatestIncoming);
                prevLatestIncomingRef.current = newLatestIncoming;
                setLastDirection('incoming');
                setLastRequestType(newLatestIncoming.type);
                setDirectionPulse(prev => !prev);
                setTypePulse(prev => !prev);
            }
            
            if (filteredLogs.length !== prevLogsRef.current.length ||
                JSON.stringify(filteredLogs.map(log => log.id)) !== 
                JSON.stringify(prevLogsRef.current.map(log => log.id))) {
                setLogs(filteredLogs);
                prevLogsRef.current = filteredLogs;
            }
            
            setError(null);
            setLoading(false);
            setInitialLoading(false);
            
            initialLoadDoneRef.current = true;
            
            lastPollTimeRef.current = Date.now();
            
            scheduleNextPolling();
        } catch (error) {
            if (!silent) {
                console.error('Erreur réseau:', error.message);
            }
            
            if (!silent) {
                setError(error.message);
                setLoading(false);
                setInitialLoading(false);
            }
            
            scheduleNextPolling();
        }
    };

    /**
     * Planifie le prochain polling en fonction de l'activité récente
     */
    const scheduleNextPolling = () => {
        if (pollingTimeoutRef.current) {
            clearTimeout(pollingTimeoutRef.current);
        }
        
        let interval;
        
        if (hasNewRequestsRef.current) {
            interval = 1000;
        } else {
            const timeSinceLastPoll = Date.now() - lastPollTimeRef.current;
            
            if (timeSinceLastPoll < 5000) {
                interval = 2000;
            } else if (timeSinceLastPoll < 30000) {
                interval = 5000;
            } else {
                interval = 10000;
            }
        }
        
        pollingTimeoutRef.current = setTimeout(() => fetchData(false, true), interval);
    };

    // Fonction pour gérer la réinitialisation
    const handleReset = (data) => {
        if (data && data.error) {
            setError(`Erreur lors de la réinitialisation: ${data.error}`);
            setTimeout(() => {
                setError(null);
            }, 5000);
            return;
        }
        
        setStats(data.stats);
        
        prevStatsRef.current = data.stats;
        
        setLogs([]);
        prevLogsRef.current = [];
        setLatestOutgoing(null);
        prevLatestOutgoingRef.current = null;
        setLatestIncoming(null);
        prevLatestIncomingRef.current = null;
        
        setTimeout(() => {
            fetchData(true);
        }, 500);
        
        setResetNotification(true);
        
        if (resetTimeoutRef.current) {
            clearTimeout(resetTimeoutRef.current);
        }
        
        resetTimeoutRef.current = setTimeout(() => {
            setResetNotification(false);
            resetTimeoutRef.current = null;
        }, 3000);
    };

    useEffect(() => {
        const restoreConsole = suppressConsoleErrors();
        
        fetchData(true);
        
        return () => {
            if (pollingTimeoutRef.current) {
                clearTimeout(pollingTimeoutRef.current);
            }
            
            if (resetTimeoutRef.current) {
                clearTimeout(resetTimeoutRef.current);
            }
            
            restoreConsole();
        };
    }, []);

    // Fonction pour obtenir la couleur en fonction de la direction
    const getDirectionColor = (direction) => {
        if (!direction) return 'bg-gray-400';
        return direction === 'incoming' ? 'bg-green-500' : 'bg-red-500';
    };

    // Fonction pour obtenir la couleur en fonction du type de requête
    const getTypeColor = (type) => {
        if (!type) return 'bg-gray-400';
        if (type.includes('Complétion')) return 'bg-blue-500';
        if (type.includes('Chat')) return 'bg-purple-500';
        if (type.includes('Profil') || type.includes('utilisateur')) return 'bg-yellow-500';
        if (type.includes('Paramètres')) return 'bg-indigo-500';
        if (type.includes('Modèles')) return 'bg-teal-500';
        if (type.includes('Espace')) return 'bg-pink-500';
        if (type.includes('Analyse')) return 'bg-orange-500';
        return 'bg-gray-400';
    };

    /**
     * Formate un log pour l'affichage dans une carte
     * @param {Object} log - Le log à formater
     * @returns {Object} - Le log formaté
     */
    const formatLogForCard = (log) => {
        if (!log) return null;

        const date = new Date(log.timestamp).toLocaleTimeString();
        const direction = log.direction === 'incoming' ? '⬇️ Réception' : '⬆️ Envoi';
        const size = log.size ? `${parseInt(log.size).toLocaleString()} octets` : 'N/A';
        
        let requestType = '';
        let explanation = '';
        
        if (log.url.includes('/completions')) {
            requestType = 'Complétion IA';
            explanation = log.method === 'POST' 
                ? 'Envoi d\'une demande de complétion à l\'IA pour générer du code ou du texte' 
                : 'Récupération des suggestions générées par l\'IA';
        } else if (log.url.includes('/chat')) {
            requestType = 'Chat IA';
            explanation = log.method === 'POST' 
                ? 'Envoi d\'un message au chat IA pour obtenir une réponse' 
                : 'Récupération des réponses du chat IA à votre question';
        } else if (log.url.includes('/user')) {
            requestType = 'Profil utilisateur';
            explanation = 'Accès aux informations du profil utilisateur et préférences';
        } else if (log.url.includes('/settings')) {
            requestType = 'Paramètres';
            explanation = 'Modification ou récupération des paramètres de l\'application';
        } else if (log.url.includes('/models')) {
            requestType = 'Modèles IA';
            explanation = 'Récupération de la liste des modèles IA disponibles et leurs capacités';
        } else if (log.url.includes('/workspace')) {
            requestType = 'Espace de travail';
            explanation = 'Synchronisation de l\'espace de travail avec le serveur pour le contexte IA';
        } else if (log.url.includes('/analysis')) {
            requestType = 'Analyse de code';
            explanation = 'Analyse du code par l\'IA pour fournir des suggestions et améliorations';
        } else {
            if (log.method === 'RESPONSE') {
                requestType = 'Réponse';
                explanation = 'Réception des données depuis le serveur';
            } else {
                requestType = 'Autre';
                explanation = `Communication avec l'API Cursor`;
            }
        }
        
        let statusText = '';
        if (log.status >= 200 && log.status < 300) {
            statusText = '✅ Succès';
        } else if (log.status >= 300 && log.status < 400) {
            statusText = '⚠️ Redirection';
        } else if (log.status >= 400 && log.status < 500) {
            statusText = '❌ Erreur client';
        } else if (log.status >= 500) {
            statusText = '🔥 Erreur serveur';
        }
        
        return {
            id: `${log.timestamp}-${log.method}-${log.url.substring(0, 10)}`,
            time: date,
            direction: direction,
            method: log.method,
            url: log.url,
            status: `${log.status} ${statusText}`,
            size: size,
            type: requestType,
            explanation: explanation,
            rawLog: log
        };
    };

    return (
        <section id="network-monitor" className="py-8">
            <div className="container mx-auto">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <FiActivity className="mr-2" size={24} />
                    Monitoring Réseau
                    <div className="ml-3 flex items-center">
                        {/* Barre d'indicateurs avec dimensions fixes */}
                        <div className="relative h-[20px] w-[200px] rounded-[4px] bg-slate-800 border border-slate-700/50">
                            {/* Effet métallique */}
                            <div className="absolute inset-0 rounded-[4px] bg-gradient-to-b from-slate-700/50 to-transparent pointer-events-none"></div>
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-600/30 to-transparent"></div>
                            
                            {/* Container principal avec 2 éléments */}
                            <div className="relative h-full px-4 flex items-center justify-between">
                                {/* Container voyant 1 + texte */}
                                <div className="flex items-center space-x-2 w-[85px]">
                                    {/* Voyant incrusté avec dimensions fixes */}
                                    <div className="relative w-3.5 h-3.5 rounded-full bg-slate-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
                                        <div 
                                            key={`direction-${directionPulse}`}
                                            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full ${lastDirection ? getDirectionColor(lastDirection) : 'bg-gray-400'} shadow-glow transition-colors duration-300`}
                                        ></div>
                                    </div>
                                    {/* Texte avec largeur fixe */}
                                    <span className="text-[9px] text-cyan-100/90 font-medium w-[65px] truncate">
                                        {lastDirection === 'incoming' ? 'Entrée' : lastDirection === 'outgoing' ? 'Sortie' : '--'}
                                    </span>
                                </div>

                                {/* Container voyant 2 + texte */}
                                <div className="flex items-center space-x-2 w-[85px]">
                                    {/* Voyant incrusté avec dimensions fixes */}
                                    <div className="relative w-3.5 h-3.5 rounded-full bg-slate-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
                                        <div 
                                            key={`type-${typePulse}`}
                                            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full ${lastRequestType ? getTypeColor(lastRequestType) : 'bg-gray-400'} shadow-glow transition-colors duration-300`}
                                        ></div>
                                    </div>
                                    {/* Texte avec largeur fixe */}
                                    <span className="text-[9px] text-cyan-100/90 font-medium w-[65px] truncate">
                                        {lastRequestType || '--'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </h2>
                
                <div className="h-[650px] relative rounded-lg mb-8 overflow-hidden network-monitor-container">
                    <div className="absolute inset-0 rounded-lg border-l-8 border-r-8 border-primary/60 shadow-[0_0_20px_rgba(6,182,212,0.4)] z-10 pointer-events-none"></div>
                    
                    <div className="absolute inset-0 bg-gradient-to-br from-dark-light via-dark to-dark-light opacity-90 z-0"></div>
                    
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
                    
                    <div className="absolute inset-0 z-20 overflow-auto">
                        <ClientOnly>
                            {() => (
                                <div className="p-6 h-full flex flex-col">
                                    {resetNotification && (
                                        <div className="mb-4 p-3 bg-green-500/20 text-green-400 rounded-md text-center flex items-center justify-center backdrop-blur-sm">
                                            <FiRefreshCw className="mr-2" />
                                            Compteurs et logs réinitialisés avec succès
                                        </div>
                                    )}
                                    
                                    <div className="flex flex-wrap items-center justify-between mb-6 bg-dark-light/50 backdrop-blur-sm p-4 rounded-lg border border-dark-lighter h-[100px]">
                                        <div className="flex space-x-4">
                                            <div className="bg-dark/60 rounded-lg p-3 flex items-center border border-dark-lighter">
                                                <div className="bg-red-500/20 rounded-full p-2 mr-2">
                                                    <FiArrowUp className="text-red-400" size={16} />
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-400">Requêtes sortantes</div>
                                                    <div className="text-white font-semibold flex items-center">
                                                        {stats.outgoing}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="bg-dark/60 rounded-lg p-3 flex items-center border border-dark-lighter">
                                                <div className="bg-green-500/20 rounded-full p-2 mr-2">
                                                    <FiArrowDown className="text-green-400" size={16} />
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-400">Requêtes entrantes</div>
                                                    <div className="text-white font-semibold flex items-center">
                                                        {stats.incoming}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <ResetButton onReset={handleReset} />
                                    </div>

                                    <div className="flex-grow h-[450px]">
                                        {initialLoading ? (
                                            <div className="bg-dark/50 backdrop-blur-sm p-6 rounded-lg text-center h-full flex items-center justify-center border border-dark-lighter">
                                                <div>
                                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
                                                    <p className="mt-4 text-gray-400">Chargement initial des données réseau...</p>
                                                </div>
                                            </div>
                                        ) : error ? (
                                            <div className="bg-dark/50 backdrop-blur-sm p-4 rounded-lg border border-dark-lighter h-full flex items-center justify-center">
                                                <div className="bg-red-900/30 text-red-400 p-3 rounded-lg">
                                                    <p>{error}</p>
                                                    <p className="mt-2 text-sm">
                                                        Assurez-vous que le serveur proxy est démarré avec la commande: <code>npm run proxy</code>
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                                                <div className="h-full relative card-container-fixed overflow-hidden boy-card" key="outgoing-card-container">
                                                    <RequestCard 
                                                        log={latestOutgoing}
                                                        key={latestOutgoing ? latestOutgoing.id : 'no-outgoing'}
                                                        isLoading={!latestOutgoing}
                                                    />
                                                </div>
                                                
                                                <div className="h-full relative card-container-fixed overflow-hidden girl-card" key="incoming-card-container">
                                                    <RequestCard 
                                                        log={latestIncoming}
                                                        key={latestIncoming ? latestIncoming.id : 'no-incoming'}
                                                        isLoading={!latestIncoming}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </ClientOnly>
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                .network-monitor-container {
                    box-shadow: 0 0 30px rgba(6, 182, 212, 0.2);
                    will-change: contents;
                    contain: layout;
                }
                
                @keyframes borderGlow {
                    0% {
                        box-shadow: 0 0 15px rgba(6, 182, 212, 0.3);
                    }
                    50% {
                        box-shadow: 0 0 30px rgba(6, 182, 212, 0.6);
                    }
                    100% {
                        box-shadow: 0 0 15px rgba(6, 182, 212, 0.3);
                    }
                }
                
                .shadow-glow {
                    box-shadow: 0 0 5px currentColor;
                }
                
                .indicator-pulse {
                    animation: indicator-pulse 0.5s ease-out;
                    position: relative;
                }
                
                .indicator-panel {
                    box-shadow: 
                        inset 0 1px 1px rgba(0, 0, 0, 0.4),
                        0 1px 1px rgba(255, 255, 255, 0.1);
                    overflow: hidden;
                }
                
                .led-inset {
                    /* Effet de trou pour accueillir la LED */
                    border: 1px solid rgba(30, 30, 30, 0.9);
                    box-shadow: 
                        inset 0 0 1px rgba(0, 0, 0, 0.7),
                        0 0 1px rgba(255, 255, 255, 0.1);
                }
                
                .led-glow {
                    box-shadow: 0 0 3px 1px currentColor;
                    position: relative;
                }
                
                .led-glow::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    border-radius: inherit;
                    box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.6);
                    opacity: 0.7;
                }
                
                .screw-head::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 60%;
                    height: 1px;
                    background-color: rgba(0, 0, 0, 0.6);
                    transform: translate(-50%, -50%) rotate(45deg);
                }
                
                .screw-head::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 60%;
                    height: 1px;
                    background-color: rgba(0, 0, 0, 0.6);
                    transform: translate(-50%, -50%) rotate(-45deg);
                }
                
                @keyframes indicator-pulse {
                    0% { transform: scale(1); opacity: 0.7; }
                    30% { transform: scale(1.3); opacity: 1; }
                    100% { transform: scale(1); opacity: 0.7; }
                }
                
                .network-monitor-container::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 0.5rem;
                    padding: 3px;
                    background: linear-gradient(90deg, rgba(6, 182, 212, 0.7), transparent, rgba(6, 182, 212, 0.7));
                    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    animation: borderGlow 4s ease-in-out infinite;
                    pointer-events: none;
                    z-index: 11;
                }
                
                .card-container-fixed {
                    transform: translateZ(0);
                    backface-visibility: hidden;
                    perspective: 1000px;
                    contain: strict;
                }
                
                .card-container :global(.h-full) {
                    backdrop-filter: blur(4px);
                    -webkit-backdrop-filter: blur(4px);
                    background-color: rgba(30, 41, 59, 0.4) !important;
                    border-left-width: 4px !important;
                    border-right-width: 4px !important;
                    transform: translateZ(0);
                    will-change: contents;
                }
                
                .boy-card :global(.h-full) {
                    border-left-color: rgba(8, 145, 178, 0.9) !important;
                    border-right-color: rgba(8, 145, 178, 0.9) !important;
                    box-shadow: 0 0 15px rgba(8, 145, 178, 0.3) !important;
                }
                
                .girl-card :global(.h-full) {
                    border-left-color: rgba(34, 211, 238, 0.9) !important;
                    border-right-color: rgba(34, 211, 238, 0.9) !important;
                    box-shadow: 0 0 15px rgba(34, 211, 238, 0.3) !important;
                }
                
                /* Suppression des styles qui écrasent les couleurs des flèches et arrière-plans */
                /* Ces styles sont maintenant gérés dans RequestCard.js en fonction de l'état */
                
                /* Styles pour les conteneurs, mais pas pour les flèches ou arrière-plans */
                .boy-card :global(.fixed-size-card) {
                    border-color: rgba(8, 145, 178, 0.9) !important;
                }
                
                .girl-card :global(.fixed-size-card) {
                    border-color: rgba(34, 211, 238, 0.9) !important;
                }
                
                /* Styles pour les éléments qui ne sont pas des flèches ou des indicateurs d'état */
                .boy-card :global(.text-gray-400),
                .girl-card :global(.text-gray-400) {
                    color: rgba(148, 163, 184, 1) !important;
                }
            `}</style>
        </section>
    );
}