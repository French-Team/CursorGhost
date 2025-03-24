import React, { memo } from 'react';
import { 
    FiArrowUp, 
    FiArrowDown, 
    FiClock, 
    FiInfo, 
    FiCheckCircle, 
    FiAlertCircle, 
    FiXCircle,
    FiLink,
    FiServer,
    FiDatabase,
    FiRefreshCw
} from 'react-icons/fi';

/**
 * Composant pour afficher les détails d'une requête
 * @param {Object} log - Les données du log à afficher
 * @param {boolean} isLoading - Indique si la requête est en cours de chargement
 * @returns {JSX.Element} - Le composant de carte de requête
 */
const RequestCard = ({ log, isLoading = false }) => {
    // Si pas de log, afficher un message ou un état de chargement
    if (!log) {
        return (
            <div className="h-full flex items-center justify-center text-gray-500 bg-dark-light/40 backdrop-blur-sm rounded-lg border border-dark-lighter fixed-size-card">
                <div className="text-center p-6 bg-dark/30 backdrop-blur-sm rounded-lg border border-dark-lighter">
                    {isLoading ? (
                        <>
                            <div className="flex justify-center mb-4">
                                <FiRefreshCw size={30} className="animate-spin opacity-40" />
                            </div>
                            <p>En attente de requêtes...</p>
                        </>
                    ) : (
                        <>
                            <FiInfo size={40} className="mx-auto mb-4 opacity-30" />
                            <p>Aucune requête à afficher</p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // Déterminer si c'est une requête entrante ou sortante
    const isIncoming = log.direction && log.direction.includes('Réception');
    
    // Déterminer l'état de la requête (erreur, succès, ou repos)
    const hasError = log.status && (log.status.includes('Erreur client') || log.status.includes('Erreur serveur'));
    const isSuccess = log.status && log.status.includes('Succès');
    
    // Couleurs et icônes en fonction de l'état de la requête
    let directionColor, glowColor, textColor, bgColor, borderColor;
    
    if (hasError) {
        // Rouge pour les erreurs (envoi ou réception)
        directionColor = "rgb(239, 68, 68)";
        glowColor = "rgba(239, 68, 68, 0.9)";
        textColor = "text-red-400";
        bgColor = "bg-red-500/30";
        borderColor = "border-red-500";
    } else if (isIncoming && isSuccess) {
        // Vert pour les requêtes reçues avec succès - plus lumineux
        directionColor = "rgb(34, 197, 94)";
        glowColor = "rgba(34, 197, 94, 0.9)";
        textColor = "text-green-400";
        bgColor = "bg-green-500/30";
        borderColor = "border-green-500";
    } else {
        // Couleur sombre par défaut (repos)
        directionColor = "rgb(30, 41, 59)";
        glowColor = "rgba(30, 41, 59, 0.7)";
        textColor = "text-slate-400";
        bgColor = "bg-slate-500/10";
        borderColor = "border-slate-500";
    }
    
    const DirectionIcon = isIncoming ? FiArrowDown : FiArrowUp;
    
    // Animation spéciale basée sur le type et l'état
    let specialAnimation = '';
    
    if (hasError) {
        specialAnimation = 'animate-arrow-pulse-red';
    } else if (isIncoming && isSuccess) {
        specialAnimation = 'animate-arrow-pulse-green';
    } else if (log.type && log.type.includes('Complétion')) {
        specialAnimation = 'animate-arrow-pulse-blue';
    } else if (log.type && log.type.includes('Chat')) {
        specialAnimation = 'animate-arrow-pulse-purple';
    } else if (log.type && log.type.includes('Profil')) {
        specialAnimation = 'animate-arrow-pulse-yellow';
    } else {
        specialAnimation = 'animate-arrow-pulse-slate';
    }

    // Déterminer l'icône de statut et la couleur
    let StatusIcon = FiInfo;
    let statusColor = "text-gray-400";
    
    if (log.status && log.status.includes('Succès')) {
        StatusIcon = FiCheckCircle;
        statusColor = "text-green-400";
    } else if (log.status && log.status.includes('Redirection')) {
        StatusIcon = FiAlertCircle;
        statusColor = "text-blue-400";
    } else if (log.status && log.status.includes('Erreur client')) {
        StatusIcon = FiXCircle;
        statusColor = "text-yellow-400";
    } else if (log.status && log.status.includes('Erreur serveur')) {
        StatusIcon = FiXCircle;
        statusColor = "text-red-400";
    }

    // Déterminer l'icône de type de requête
    let TypeIcon = FiInfo;
    if (log.type && log.type.includes('Complétion')) {
        TypeIcon = FiDatabase;
    } else if (log.type && log.type.includes('Chat')) {
        TypeIcon = FiServer;
    } else if (log.type && log.type.includes('Modèles')) {
        TypeIcon = FiDatabase;
    } else if (log.type && log.type.includes('Espace')) {
        TypeIcon = FiServer;
    } else if (log.type && log.type.includes('Analyse')) {
        TypeIcon = FiDatabase;
    }

    return (
        <div className={`h-full bg-dark-light/40 backdrop-blur-sm rounded-lg border-l-4 border-r-4 ${borderColor} flex flex-col fixed-size-card gpu-accelerated ${
            hasError ? 'card-pulse-error' : 
            (isIncoming && isSuccess) ? 'card-pulse-success' : ''
        }`}>
            {/* Effet de bordure brillante pour les états spéciaux */}
            {(hasError || (isIncoming && isSuccess)) && (
                <div className={`absolute inset-0 rounded-lg z-0 ${
                    hasError ? 'border-glow-error' : 'border-glow-success'
                }`}></div>
            )}
            
            {/* En-tête avec type de requête et heure */}
            <div className={`${bgColor} p-2 rounded-t-lg flex items-center justify-between backdrop-blur-sm fixed-size-header relative z-10`}>
                <div className="flex items-center">
                    <div className="relative mr-2 direction-icon-container" style={{
                        boxShadow: `0 0 10px ${glowColor}, 0 0 5px ${glowColor} inset`,
                        backgroundColor: hasError ? 'rgba(0, 0, 0, 0.5)' : 
                                       (isIncoming && isSuccess) ? 'rgba(0, 0, 0, 0.5)' : 
                                       'rgba(0, 0, 0, 0.4)',
                    }}>
                        <div className={`absolute -inset-1 rounded-full ${
                            hasError ? 'bg-red-500/50' : 
                            (isIncoming && isSuccess) ? 'bg-green-500/50' : 
                            'bg-slate-500/30'
                        } blur-sm`}></div>
                        <div className={`absolute -inset-1.5 rounded-full ${
                            hasError ? 'bg-red-500/40' : 
                            (isIncoming && isSuccess) ? 'bg-green-500/40' : 
                            'bg-slate-500/20'
                        } blur-md animate-pulse-slow`}></div>
                        <DirectionIcon 
                            style={{
                                color: directionColor,
                                filter: `drop-shadow(0 0 5px ${glowColor})`,
                            }} 
                            className={`direction-icon relative z-10 ${specialAnimation}`} 
                            size={16} 
                        />
                    </div>
                    <span className="font-semibold text-white ml-1">{log.type || 'Requête'}</span>
                    <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${textColor} bg-black/30`}>
                        {log.method}
                    </span>
                </div>
                <div className="flex items-center">
                    <TypeIcon className="text-gray-400 mr-1" size={12} />
                    <FiClock className="text-gray-400 mr-1" size={12} />
                    <span className="text-xs text-gray-400">{log.time}</span>
                </div>
            </div>

            {/* Corps de la carte avec hauteurs fixes */}
            <div className="p-3 flex-grow flex flex-col fixed-size-body">
                {/* URL complète en haut */}
                <div className="mb-3 fixed-size-url">
                    <div className="text-xs text-gray-400 mb-1 flex items-center">
                        <FiLink className="mr-1" size={10} />
                        URL:
                    </div>
                    <div className="font-mono text-xs bg-dark/60 p-2 rounded overflow-x-auto text-blue-300 max-h-16 border border-dark-lighter">
                        {log.url}
                    </div>
                </div>
                
                {/* Description avec hauteur fixe */}
                <div className="mb-3 text-sm text-gray-300 text-center bg-dark/40 backdrop-blur-sm p-3 rounded flex-grow flex items-center justify-center border border-dark-lighter fixed-size-description">
                    {log.explanation}
                </div>
                
                {/* Informations techniques avec hauteur fixe */}
                <div className="grid grid-cols-2 gap-2 text-xs mt-auto fixed-size-details">
                <div className=" bg-dark/60 backdrop-blur-sm p-2 rounded col-span-2 border border-dark-lighter flex gap-2 items-center">
                        <span className="text-gray-400">ID:</span> 
                        <span className="text-gray-300 ml-1 font-mono">{log.id.split('-')[0]}</span>
                    </div>
                    <div className="bg-dark/60 backdrop-blur-sm p-2 rounded border border-dark-lighter flex gap-2 items-center">
                        <span className="text-gray-400">Taille:</span> 
                        <span className="text-gray-300 ml-1">{log.size}</span>
                    </div>
                    <div className="bg-dark/60 backdrop-blur-sm p-2 rounded border border-dark-lighter flex gap-2 items-center justify-center">
                        <span className="text-gray-400">Statut:</span> 
                        <span className={`ml-1 flex items-center ${statusColor}`}>
                            <StatusIcon size={12} className="mr-1" />
                            {log.status}
                        </span>
                    </div>
                    
                </div>
            </div>
            <style jsx>{`
                .fixed-size-card {
                    transform: translateZ(0);
                    will-change: contents;
                    backface-visibility: hidden;
                    transition: none !important;
                    contain: strict;
                }
                
                .fixed-size-header {
                    height: 40px;
                    contain: strict;
                }
                
                .fixed-size-body {
                    height: calc(100% - 40px);
                    contain: content;
                }
                
                .fixed-size-url {
                    height: 60px;
                    contain: strict;
                }
                
                .fixed-size-description {
                    height: 120px;
                    contain: strict;
                }
                
                .fixed-size-details {
                    height: auto;
                    min-height: 100px;
                    contain: strict;
                }
                
                .gpu-accelerated {
                    transform: translate3d(0, 0, 0);
                    -webkit-transform: translate3d(0, 0, 0);
                }
                
                .direction-icon {
                    filter: drop-shadow(0 0 3px currentColor);
                }
                
                .direction-icon-container {
                    width: 22px;
                    height: 22px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background: rgba(0, 0, 0, 0.4);
                    padding: 3px;
                }
                
                @keyframes pulse-slow {
                    0% { opacity: 0.4; }
                    50% { opacity: 0.8; }
                    100% { opacity: 0.4; }
                }
                
                .animate-pulse-slow {
                    animation: pulse-slow 1.5s infinite ease-in-out;
                }
                
                @keyframes arrow-pulse-blue {
                    0% { transform: scale(1); filter: brightness(1.2) drop-shadow(0 0 5px rgb(59, 130, 246)); }
                    50% { transform: scale(1.3); filter: brightness(1.6) drop-shadow(0 0 8px rgb(59, 130, 246)); }
                    100% { transform: scale(1); filter: brightness(1.2) drop-shadow(0 0 5px rgb(59, 130, 246)); }
                }
                
                .animate-arrow-pulse-blue {
                    animation: arrow-pulse-blue 1s infinite ease-in-out;
                }
                
                @keyframes arrow-pulse-purple {
                    0% { transform: scale(1); filter: brightness(1.2) drop-shadow(0 0 5px rgb(168, 85, 247)); }
                    50% { transform: scale(1.3); filter: brightness(1.6) drop-shadow(0 0 8px rgb(168, 85, 247)); }
                    100% { transform: scale(1); filter: brightness(1.2) drop-shadow(0 0 5px rgb(168, 85, 247)); }
                }
                
                .animate-arrow-pulse-purple {
                    animation: arrow-pulse-purple 1s infinite ease-in-out;
                }
                
                @keyframes arrow-pulse-yellow {
                    0% { transform: scale(1); filter: brightness(1.2) drop-shadow(0 0 5px rgb(234, 179, 8)); }
                    50% { transform: scale(1.3); filter: brightness(1.6) drop-shadow(0 0 8px rgb(234, 179, 8)); }
                    100% { transform: scale(1); filter: brightness(1.2) drop-shadow(0 0 5px rgb(234, 179, 8)); }
                }
                
                .animate-arrow-pulse-yellow {
                    animation: arrow-pulse-yellow 1s infinite ease-in-out;
                }
                
                @keyframes arrow-pulse-slate {
                    0% { transform: scale(1); filter: brightness(1.2) drop-shadow(0 0 5px rgb(100, 116, 139)); }
                    50% { transform: scale(1.3); filter: brightness(1.6) drop-shadow(0 0 8px rgb(100, 116, 139)); }
                    100% { transform: scale(1); filter: brightness(1.2) drop-shadow(0 0 5px rgb(100, 116, 139)); }
                }
                
                .animate-arrow-pulse-slate {
                    animation: arrow-pulse-slate 1s infinite ease-in-out;
                }
                
                @keyframes arrow-pulse-green {
                    0% { transform: scale(1); filter: brightness(1.3) drop-shadow(0 0 6px rgb(34, 197, 94)); }
                    50% { transform: scale(1.4); filter: brightness(1.8) drop-shadow(0 0 10px rgb(34, 197, 94)); }
                    100% { transform: scale(1); filter: brightness(1.3) drop-shadow(0 0 6px rgb(34, 197, 94)); }
                }
                
                .animate-arrow-pulse-green {
                    animation: arrow-pulse-green 0.8s infinite ease-in-out;
                }
                
                @keyframes arrow-pulse-red {
                    0% { transform: scale(1); filter: brightness(1.3) drop-shadow(0 0 6px rgb(239, 68, 68)); }
                    50% { transform: scale(1.4); filter: brightness(1.8) drop-shadow(0 0 10px rgb(239, 68, 68)); }
                    100% { transform: scale(1); filter: brightness(1.3) drop-shadow(0 0 6px rgb(239, 68, 68)); }
                }
                
                .animate-arrow-pulse-red {
                    animation: arrow-pulse-red 0.8s infinite ease-in-out;
                }
                
                @keyframes card-pulse-success {
                    0% { box-shadow: 0 0 5px rgba(34, 197, 94, 0.3); }
                    50% { box-shadow: 0 0 15px rgba(34, 197, 94, 0.6); }
                    100% { box-shadow: 0 0 5px rgba(34, 197, 94, 0.3); }
                }
                
                .card-pulse-success {
                    animation: card-pulse-success 1.5s infinite ease-in-out;
                }
                
                @keyframes card-pulse-error {
                    0% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.3); }
                    50% { box-shadow: 0 0 15px rgba(239, 68, 68, 0.6); }
                    100% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.3); }
                }
                
                .card-pulse-error {
                    animation: card-pulse-error 1.5s infinite ease-in-out;
                    position: relative;
                }
                
                @keyframes border-glow-success {
                    0% { box-shadow: 0 0 5px rgba(34, 197, 94, 0.5), inset 0 0 3px rgba(34, 197, 94, 0.3); }
                    50% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.8), inset 0 0 8px rgba(34, 197, 94, 0.5); }
                    100% { box-shadow: 0 0 5px rgba(34, 197, 94, 0.5), inset 0 0 3px rgba(34, 197, 94, 0.3); }
                }
                
                .border-glow-success {
                    animation: border-glow-success 1.5s infinite ease-in-out;
                    border: 1px solid rgba(34, 197, 94, 0.5);
                    pointer-events: none;
                }
                
                @keyframes border-glow-error {
                    0% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.5), inset 0 0 3px rgba(239, 68, 68, 0.3); }
                    50% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.8), inset 0 0 8px rgba(239, 68, 68, 0.5); }
                    100% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.5), inset 0 0 3px rgba(239, 68, 68, 0.3); }
                }
                
                .border-glow-error {
                    animation: border-glow-error 1.5s infinite ease-in-out;
                    border: 1px solid rgba(239, 68, 68, 0.5);
                    pointer-events: none;
                }
            `}</style>
        </div>
    );
};

// Utiliser React.memo avec une comparaison stricte pour éviter les re-rendus inutiles
const areEqual = (prevProps, nextProps) => {
    // Si les deux logs sont null, ils sont égaux
    if (!prevProps.log && !nextProps.log) return true;
    
    // Si l'un est null et l'autre non, ils sont différents
    if (!prevProps.log || !nextProps.log) return false;
    
    // Comparer uniquement les IDs pour une performance maximale
    return prevProps.log.id === nextProps.log.id;
};

export default memo(RequestCard, areEqual); 