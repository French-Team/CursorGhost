import React, { useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';

/**
 * Bouton pour réinitialiser les compteurs et les logs
 * @param {Function} onReset - Fonction appelée après la réinitialisation
 * @returns {JSX.Element} - Le composant de bouton de réinitialisation
 */
const ResetButton = ({ onReset }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleReset = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            const response = await fetch('http://localhost:7778/reset');
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Appeler la fonction de callback avec les données
            if (onReset) {
                onReset(data);
            }
        } catch (error) {
            console.error('Erreur lors de la réinitialisation:', error);
            setError(error.message);
            
            // Appeler la fonction de callback avec l'erreur
            if (onReset) {
                onReset({ error: error.message });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleReset}
            disabled={isLoading}
            className={`
                px-3 py-2 rounded-lg 
                ${isLoading ? 'bg-gray-700' : 'bg-primary hover:bg-primary-dark'} 
                text-white text-sm font-medium
                transition-colors duration-200
                flex items-center
            `}
        >
            {isLoading ? (
                <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Réinitialisation...
                </>
            ) : (
                <>
                    <FiRefreshCw className="mr-2" size={14} />
                    Réinitialiser
                </>
            )}
        </button>
    );
};

export default ResetButton; 