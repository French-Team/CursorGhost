import React, { useState, useEffect } from 'react';
import { VscCopy, VscFold, VscFoldDown, VscRefresh, VscJson, VscCode, VscSymbolParameter, VscWarning, VscLinkExternal } from 'react-icons/vsc';
import JsonViewer from './JsonViewer';

/**
 * Composant pour afficher le contenu d'une requête ou d'une réponse
 * @param {Object} content - Le contenu à afficher
 * @param {string} title - Le titre de la carte (optionnel, utilisé à la place de type si fourni)
 * @param {string} type - Le type de contenu ('request' ou 'response') (pour compatibilité)
 * @param {boolean} isLoading - Indique si le contenu est en cours de chargement (pour compatibilité)
 * @returns {JSX.Element} - Le composant de carte de contenu
 */
const ContentCard = ({ content, title, type, isLoading }) => {
    const [showRaw, setShowRaw] = useState(false);
    const [expandedHeaders, setExpandedHeaders] = useState(false);
    const [expandedInfo, setExpandedInfo] = useState(false);
    const [isClaudeRequest, setIsClaudeRequest] = useState(false);

    // Déterminer le titre à afficher (priorité au paramètre title)
    const displayTitle = title || (type === 'request' ? 'Requête Client' : 'Réponse Serveur');

    // Détecter si c'est une requête Claude
    useEffect(() => {
        if (content && content.url) {
            const isClaudeUrl = content.url.includes('anthropic.com') || 
                               content.url.includes('claude') || 
                               content.url.includes('sonnet');
            setIsClaudeRequest(isClaudeUrl);
        }
    }, [content]);

    // Si pas de contenu, afficher un message indiquant qu'aucun contenu n'est disponible
    if (!content) {
        return (
            <div className="content-card">
                <div className="card-header">
                    <h3>{displayTitle}</h3>
                </div>
                <div className="card-body empty">
                    <p>{isLoading ? 'Chargement en cours...' : 'Aucun contenu disponible'}</p>
                </div>
            </div>
        );
    }

    const { timestamp, method, url, formattedBody, headers, status, size } = content;

    // Vérifier si le corps contient réellement des données
    const hasActualBody = formattedBody && 
                          formattedBody.content && 
                          !(
                              // Éviter d'afficher des objets vides ou des chaînes vides comme corps
                              (typeof formattedBody.content === 'object' && Object.keys(formattedBody.content).length === 0) ||
                              (typeof formattedBody.content === 'string' && formattedBody.content.trim() === '')
                          );

    // Formatage de la date
    const date = new Date(timestamp);
    const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

    // Organiser les en-têtes par catégories
    const categorizeHeaders = (headers) => {
        const categories = {
            authentication: ['authorization', 'proxy-authorization', 'x-api-key', 'api-key'],
            content: ['content-type', 'content-length', 'content-encoding', 'content-language'],
            caching: ['cache-control', 'expires', 'pragma', 'etag', 'last-modified'],
            cors: ['access-control-allow-origin', 'access-control-allow-methods', 'access-control-allow-headers'],
            other: []
        };
        
        const categorizedHeaders = {
            authentication: {},
            content: {},
            caching: {},
            cors: {},
            other: {}
        };
        
        Object.entries(headers).forEach(([key, value]) => {
            const lowerKey = key.toLowerCase();
            let assigned = false;
            
            for (const [category, keyList] of Object.entries(categories)) {
                if (keyList.some(k => lowerKey.includes(k))) {
                    categorizedHeaders[category][key] = value;
                    assigned = true;
                    break;
                }
            }
            
            if (!assigned) {
                categorizedHeaders.other[key] = value;
            }
        });
        
        return categorizedHeaders;
    };

    const categorizedHeaders = categorizeHeaders(headers || {});

    // Fonction pour copier une valeur dans le presse-papiers
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(
            () => console.log('Valeur copiée: ' + text),
            (err) => console.error('Erreur lors de la copie: ', err)
        );
    };

    // Rendu des en-têtes par catégorie
    const renderHeadersByCategory = () => {
        return Object.entries(categorizedHeaders).map(([category, headerGroup]) => {
            const headerEntries = Object.entries(headerGroup);
            if (headerEntries.length === 0) return null;
            
            const categoryNames = {
                authentication: 'Authentification',
                content: 'Contenu',
                caching: 'Mise en cache',
                cors: 'CORS',
                other: 'Autres'
            };
            
            return (
                <div key={category} className="header-category">
                    <h5 className="header-category-title">{categoryNames[category]} ({headerEntries.length})</h5>
                    <div className="header-category-content">
                        {headerEntries.map(([key, value]) => (
                            <div key={key} className="header-item">
                                <div className="header-key-container">
                                    <span className="header-key">{key}</span>
                                    <button 
                                        className="copy-button" 
                                        onClick={() => copyToClipboard(value)}
                                        title="Copier la valeur"
                                    >
                                        <VscCopy size={14} />
                                    </button>
                                </div>
                                <span className="header-value">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }).filter(Boolean);
    };

    // Total des en-têtes
    const totalHeaders = Object.keys(headers || {}).length;

    // URL raccourcie pour l'affichage
    const displayUrl = url ? (url.length > 50 ? url.substring(0, 50) + '...' : url) : '';
    
    // Préparation des données pour JsonViewer
    const prepareDataForJsonViewer = () => {
        // Si pas de corps formaté ou contenu vide, retourner null (aucun contenu à afficher)
        if (!hasActualBody) return null;
        
        if (formattedBody.type === 'json') {
            const content = formattedBody.content;
            
            // Cas spécial pour les requêtes Claude
            if (isClaudeRequest && content) {
                // Si c'est une requête Claude typique avec messages
                if (content.messages || content.model || content.max_tokens) {
                    return content;
                }
                
                // Vérifier si le contenu est une chaîne qui pourrait être du JSON
                if (typeof content === 'string' && content.trim()) {
                    if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
                        try {
                            return JSON.parse(content);
                        } catch (e) {
                            // Si l'analyse échoue, retourner tel quel
                            return content;
                        }
                    }
                    return content; // Retourner le contenu brut si ce n'est pas du JSON
                }
            }
            
            // Si le contenu est un objet vide, retourner null (aucun contenu réel)
            if (typeof content === 'object' && !Array.isArray(content) && Object.keys(content).length === 0) {
                return null;
            }
            
            return content;
        } else if (formattedBody.type === 'text' && formattedBody.content) {
            // Pour le texte, vérifier s'il ressemble à du JSON
            const content = formattedBody.content;
            if (typeof content === 'string' && content.trim()) {
                const trimmedContent = content.trim();
                if ((trimmedContent.startsWith('{') && trimmedContent.endsWith('}')) || 
                    (trimmedContent.startsWith('[') && trimmedContent.endsWith(']'))) {
                    try {
                        return JSON.parse(trimmedContent);
                    } catch (e) {
                        // Si ce n'est pas du JSON valide, retourner comme texte
                        return { content: trimmedContent };
                    }
                }
                return { content: trimmedContent };
            }
            return null;
        }
        
        // Pour tout autre type, retourner null s'il n'y a pas de contenu réel
        return formattedBody.content ? { content: formattedBody.content } : null;
    };
    
    return (
        <div className={`content-card ${type ? `content-${type}` : ''}`}>
            <div className="card-header">
                <h3>{displayTitle}</h3>
                <div className="content-controls">
                    <button
                        className={`btn ${showRaw ? 'btn-active' : ''}`}
                        onClick={() => setShowRaw(!showRaw)}
                        title={showRaw ? "Afficher formaté" : "Afficher brut"}
                    >
                        {showRaw ? <VscJson size={16} /> : <VscCode size={16} />}
                        <span className="btn-text">{showRaw ? 'Formaté' : 'Brut'}</span>
                    </button>
                </div>
            </div>

            {/* URL toujours visible */}
            {url && (
                <div className="url-display-section">
                    <div className="url-container">
                        <div className={`method-badge ${method?.toLowerCase() || 'get'}`}>{method}</div>
                        <div className="url-display-compact" title={url}>
                            {displayUrl}
                            <button 
                                className="copy-button url-copy-button" 
                                onClick={() => copyToClipboard(url)}
                                title="Copier l'URL"
                            >
                                <VscCopy size={12} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Autres informations repliables */}
            <div className={`info-section ${expandedInfo ? 'expanded' : 'collapsed'}`}>
                <div className="info-section-header" onClick={() => setExpandedInfo(!expandedInfo)}>
                    <h4>Informations</h4>
                    <button className="toggle-button">
                        {expandedInfo ? <VscFoldDown /> : <VscFold />}
                    </button>
                </div>
                
                {expandedInfo && (
                    <div className="info-section-content">
                        <div className="info-row">
                            <span className="info-label">Date:</span>
                            <span className="info-value">{formattedDate}</span>
                        </div>
                        {status > 0 && (
                            <div className="info-row">
                                <span className="info-label">Status:</span>
                                <span className={`info-value status-badge status-${Math.floor(status/100)}xx`}>{status}</span>
                            </div>
                        )}
                        {size > 0 && (
                            <div className="info-row">
                                <span className="info-label">Taille:</span>
                                <span className="info-value">{size} octets</span>
                            </div>
                        )}
                        {isClaudeRequest && (
                            <div className="info-row">
                                <span className="info-label">API:</span>
                                <span className="info-value claude-badge">Claude AI</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {headers && totalHeaders > 0 && (
                <div className={`info-section ${expandedHeaders ? 'expanded' : 'collapsed'}`}>
                    <div className="info-section-header" onClick={() => setExpandedHeaders(!expandedHeaders)}>
                        <h4>En-têtes ({totalHeaders})</h4>
                        <button className="toggle-button">
                            {expandedHeaders ? <VscFoldDown /> : <VscFold />}
                        </button>
                    </div>
                    {expandedHeaders && (
                        <div className="info-section-content">
                            {renderHeadersByCategory()}
                        </div>
                    )}
                </div>
            )}

            {/* Section Corps - Toujours visible */}
            <div className="body-section">
                <div className="body-section-header">
                    <h4>Corps</h4>
                </div>
                {hasActualBody ? (
                    <div className={`body-content ${isClaudeRequest ? 'claude-content' : ''}`}>
                        {showRaw ? (
                            <pre className="raw-json">
                                {typeof formattedBody.content === 'string' 
                                    ? formattedBody.content 
                                    : JSON.stringify(formattedBody.content, null, 2)}
                            </pre>
                        ) : (
                            <JsonViewer data={prepareDataForJsonViewer()} />
                        )}
                    </div>
                ) : (
                    <div className="info-section-content">
                        <p className="empty-body-message">Aucun corps de requête disponible</p>
                        <p className="empty-body-hint">Les données ont peut-être été omises par le serveur ou sont vides</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContentCard; 