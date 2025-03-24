import React, { useState } from 'react';
import { VscCopy } from 'react-icons/vsc';

/**
 * Composant pour afficher des objets JSON de manière interactive
 * @param {Object|Array} data - Les données JSON à afficher
 * @returns {JSX.Element} - Le composant d'affichage JSON
 */
const JsonViewer = ({ data }) => {
    // Si les données sont nulles ou undefined, afficher un message
    if (data === null || data === undefined) {
        return <span className="text-gray-400">null</span>;
    }
    
    // Si les données ne sont ni un objet ni un tableau, les afficher directement
    if (typeof data !== 'object') {
        return renderValue(data);
    }
    
    // Prétraiter les données pour les afficher correctement
    const processedData = preprocessData(data);
    
    // Afficher l'objet avec le composant récursif
    return (
        <div className="json-viewer-container">
            <div className="json-viewer-header">
                <button 
                    onClick={() => copyToClipboard(processedData)}
                    className="json-copy-btn"
                    title="Copier tout"
                >
                    <VscCopy size={14} /> Copier tout
                </button>
            </div>
            <JsonViewerRecursive data={processedData} depth={0} isRoot={true} />
        </div>
    );
};

/**
 * Prétraite les données JSON pour améliorer l'affichage
 * Gère notamment les cas spéciaux comme Claude 3.7 Sonnet
 * @param {Object|Array} data - Les données à prétraiter
 * @returns {Object|Array} - Les données prétraitées
 */
const preprocessData = (data) => {
    // Si ce n'est pas un objet ou si c'est null, renvoyer tel quel
    if (typeof data !== 'object' || data === null) {
        return data;
    }
    
    // Si c'est un tableau, prétraiter chaque élément
    if (Array.isArray(data)) {
        return data.map(item => preprocessData(item));
    }
    
    // Cas spécial: contenu avec une propriété "content" à traiter
    if (data.content && typeof data.content === 'string') {
        // Tenter de parse le contenu s'il ressemble à du JSON
        try {
            const contentStr = data.content.trim();
            if ((contentStr.startsWith('{') && contentStr.endsWith('}')) ||
                (contentStr.startsWith('[') && contentStr.endsWith(']'))) {
                const parsedContent = JSON.parse(contentStr);
                return { ...data, parsedContent };
            }
        } catch (e) {
            // Ignorer les erreurs de parsing
        }
    }
    
    // Pour un objet standard, prétraiter chaque propriété
    const result = {};
    for (const [key, value] of Object.entries(data)) {
        result[key] = preprocessData(value);
    }
    
    return result;
};

/**
 * Fonction pour copier une valeur dans le presse-papiers
 * @param {any} value - La valeur à copier
 */
const copyToClipboard = (value) => {
    let textToCopy;
    
    if (typeof value === 'object' && value !== null) {
        textToCopy = JSON.stringify(value, null, 2);
    } else {
        textToCopy = String(value);
    }
    
    navigator.clipboard.writeText(textToCopy).then(
        () => console.log('Valeur copiée:', textToCopy),
        (err) => console.error('Erreur lors de la copie:', err)
    );
};

/**
 * Composant récursif pour afficher des objets JSON sans repliage
 * @param {Object|Array} data - Les données JSON à afficher
 * @param {number} depth - La profondeur actuelle dans l'objet
 * @param {boolean} isRoot - Indique si c'est le nœud racine
 * @returns {JSX.Element} - Le composant d'affichage JSON récursif
 */
const JsonViewerRecursive = ({ data, depth, isRoot = false }) => {
    // Déterminer si c'est un tableau ou un objet
    const isArray = Array.isArray(data);
    
    // Obtenir les entrées de l'objet ou du tableau
    const entries = isArray 
        ? data.map((item, index) => [index, item])
        : Object.entries(data);
    
    // Si l'objet est vide, afficher une version simplifiée
    if (entries.length === 0) {
        return (
            <span className="text-gray-400">{isArray ? '[]' : '{}'}</span>
        );
    }
    
    return (
        <div className="json-viewer">
            <div className="flex items-start">
                <span className="text-gray-300">
                    {isArray ? '[' : '{'}
                </span>
            </div>
            
            <div className="pl-4 border-l border-dark-lighter">
                {entries.map(([key, value], index) => (
                    <div key={key} className="flex flex-wrap py-1">
                        <div className="mr-1 key-container">
                            <span className={isArray ? "text-blue-400" : "text-green-400"}>
                                {isArray ? key : `"${key}"`}
                            </span>
                            <span className="text-gray-400">: </span>
                        </div>
                        
                        <div className="flex-1 min-w-0 value-container">
                            {typeof value === 'object' && value !== null ? (
                                <JsonViewerRecursive 
                                    data={value} 
                                    depth={depth + 1} 
                                />
                            ) : (
                                <div className="flex items-center">
                                    <span className="value-display">
                                        {renderValue(value)}
                                    </span>
                                </div>
                            )}
                        </div>
                        
                        {index < entries.length - 1 && (
                            <span className="text-gray-400">,</span>
                        )}
                    </div>
                ))}
            </div>
            
            <div>
                <span className="text-gray-300">{isArray ? ']' : '}'}</span>
            </div>
        </div>
    );
};

/**
 * Affiche une valeur primitive avec coloration syntaxique
 * @param {any} value - La valeur à afficher
 * @returns {JSX.Element} - L'élément formaté
 */
const renderValue = (value) => {
    // Coloration syntaxique en fonction du type
    if (value === null) {
        return <span className="text-gray-500">null</span>;
    }
    
    if (value === undefined) {
        return <span className="text-gray-500">undefined</span>;
    }
    
    if (typeof value === 'boolean') {
        return <span className="text-yellow-400">{value.toString()}</span>;
    }
    
    if (typeof value === 'number') {
        return <span className="text-blue-400">{value}</span>;
    }
    
    if (typeof value === 'string') {
        // Afficher les chaînes complètes sans tronquer
        return <span className="text-green-400">"{value}"</span>;
    }
    
    // Fallback pour les types non reconnus
    return <span className="text-pink-400">{String(value)}</span>;
};

export default JsonViewer;
