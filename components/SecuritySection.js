'use client';

import React, { useState, useEffect } from 'react';
import ClientOnly from '../components/ClientOnly';
import Link from 'next/link';

// Composant pour la visualisation en temps réel du monitoring réseau
const NetworkMonitoringLive = () => {
  const [networkData, setNetworkData] = useState({
    logs: [],
    stats: { incoming: 0, outgoing: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [animateIncoming, setAnimateIncoming] = useState(false);
  const [animateOutgoing, setAnimateOutgoing] = useState(false);

  // Fonction pour récupérer les données réseau
  const fetchNetworkData = async () => {
    try {
      // Récupérer les logs
      const logsResponse = await fetch('http://localhost:7778/logs');
      const logs = await logsResponse.json();
      
      // Trier les logs du plus récent au plus ancien
      logs.sort((a, b) => b.timestamp - a.timestamp);
      
      // Récupérer les statistiques
      const statsResponse = await fetch('http://localhost:7778/stats');
      const stats = await statsResponse.json();
      
      // Vérifier si le nombre de requêtes a changé pour déclencher les animations
      if (stats.incoming > networkData.stats.incoming) {
        setAnimateIncoming(true);
        setTimeout(() => setAnimateIncoming(false), 500);
      }
      
      if (stats.outgoing > networkData.stats.outgoing) {
        setAnimateOutgoing(true);
        setTimeout(() => setAnimateOutgoing(false), 500);
      }
      
      setNetworkData({ logs, stats });
      setIsLoading(false);
    } catch (err) {
      console.error('Erreur lors de la récupération des données réseau:', err);
      setError("Impossible de se connecter au serveur proxy. Assurez-vous qu'il est en cours d'execution sur le port 7778.");
      setIsLoading(false);
    }
  };

  // Mettre en place le polling pour récupérer les données toutes les 2 secondes
  useEffect(() => {
    fetchNetworkData();
    
    const interval = setInterval(() => {
      fetchNetworkData();
    }, 2000);
    
    // Nettoyer l'intervalle lors du démontage du composant
    return () => clearInterval(interval);
  }, []);

  // Formater l'heure pour l'affichage
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  // Déterminer la classe CSS pour le statut
  const getStatusClass = (status) => {
    if (status >= 200 && status < 300) return 'status-success';
    if (status >= 400 && status < 500) return 'status-error';
    return 'status-warning';
  };

  // Générer les barres pour le graphique d'activité
  const generateActivityBars = () => {
    // Utiliser les 5 dernières requêtes pour générer des hauteurs de barres
    const heights = networkData.logs.slice(0, 5).map((log, index) => 
      Math.max(20, Math.min(80, 30 + (index * 10)))
    );
    
    // Si moins de 5 requêtes, compléter avec des valeurs par défaut
    while (heights.length < 5) {
      heights.push(20);
    }
    
    return heights.map((height, index) => (
      <div 
        key={index}
        className="bg-gray-300 dark:bg-gray-700"
        style={{ 
          height: `${height}px`, 
          width: '8px',
          borderRadius: '2px'
        }}
      />
    ));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-8">
      <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
        Monitoring Réseau en Temps Réel
      </h3>
      
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement des données réseau...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg">
          <p>{error}</p>
          <p className="mt-2 text-sm">
            Assurez-vous que le serveur proxy est démarré avec la commande: <code>npm run proxy</code>
          </p>
        </div>
      ) : (
        <>
          {/* Diagramme de flux */}
          <div className="flex justify-between items-center mb-6 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg relative">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-2">
                <span className="text-sm font-medium">Votre Machine</span>
              </div>
            </div>
            
            <div className="flex-1 mx-4 flex flex-col items-center">
              {/* Flèche sortante (rouge) */}
              <div className={`w-full h-6 mb-2 ${animateOutgoing ? 'pulse-animation' : ''} flow-left`}>
                <div className="bg-red-500/20 h-full rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-red-700 dark:text-red-400">
                    {networkData.stats.outgoing} requêtes sortantes
                  </span>
                </div>
              </div>
              
              {/* Flèche entrante (verte) */}
              <div className={`w-full h-6 ${animateIncoming ? 'pulse-animation' : ''} flow-right`}>
                <div className="bg-green-500/20 h-full rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">
                    {networkData.stats.incoming} requêtes entrantes
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-2">
                <span className="text-sm font-medium">api2.cursor.sh</span>
              </div>
            </div>
          </div>
          
          {/* Statistiques et graphique d'activité */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-medium mb-3 text-gray-700 dark:text-gray-300">Statistiques en temps réel</h4>
              <div className="flex justify-between">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${animateIncoming ? 'pulse-animation' : ''} text-green-600 dark:text-green-400`}>
                    {networkData.stats.incoming}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Entrantes</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${animateOutgoing ? 'pulse-animation' : ''} text-red-600 dark:text-red-400`}>
                    {networkData.stats.outgoing}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Sortantes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {networkData.stats.incoming + networkData.stats.outgoing}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-medium mb-3 text-gray-700 dark:text-gray-300">Activité (5 dernières minutes)</h4>
              <div className="flex items-end justify-between h-20 px-2">
                {generateActivityBars()}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>5m</span>
                <span>4m</span>
                <span>3m</span>
                <span>2m</span>
                <span>1m</span>
              </div>
            </div>
          </div>
          
          {/* Tableau des dernières requêtes */}
          <div className="overflow-x-auto">
            <h4 className="font-medium mb-3 text-gray-700 dark:text-gray-300">Dernières requêtes</h4>
            <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-900">
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Heure</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Endpoint</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Taille</th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {networkData.logs.slice(0, 5).map((log, index) => (
                  <tr key={`${log.timestamp}-${log.method}-${log.url.substring(0, 10)}`} className={`${index === 0 ? 'new-request' : ''}`}>
                    <td className="py-2 px-4 text-sm text-gray-700 dark:text-gray-300">{formatTime(log.timestamp)}</td>
                    <td className="py-2 px-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${log.method === 'GET' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'}`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-sm text-gray-700 dark:text-gray-300 font-mono">
                      {log.url.length > 30 ? log.url.substring(0, 30) + '...' : log.url}
                    </td>
                    <td className="py-2 px-4 text-sm text-gray-700 dark:text-gray-300">{log.size || '-'}</td>
                    <td className="py-2 px-4 text-sm">
                      <span className={`${getStatusClass(log.status)}`}>
                        {log.status} {log.status >= 200 && log.status < 300 ? 'OK' : log.status >= 400 && log.status < 500 ? 'Erreur' : 'Avertissement'}
                      </span>
                    </td>
                  </tr>
                ))}
                {networkData.logs.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-4 text-center text-gray-500 dark:text-gray-400">
                      Aucune requête interceptée pour le moment
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

const SecuritySection = () => {
  // Utiliser un état local pour stocker les icônes
  const [icons, setIcons] = useState({
    FiShield: null,
    FiLock: null,
    FiEye: null,
    FiKey: null
  });

  // Charger les icônes côté client uniquement
  useEffect(() => {
    const loadIcons = async () => {
      try {
        const { FiShield, FiLock, FiEye, FiKey } = await import('react-icons/fi');
        setIcons({
          FiShield: FiShield,
          FiLock: FiLock,
          FiEye: FiEye,
          FiKey: FiKey
        });
      } catch (error) {
        console.error("Erreur lors du chargement des icônes:", error);
      }
    };
    loadIcons();
  }, []);

  const securityFeatures = [
    {
      iconKey: 'FiLock',
      fallbackIcon: "🔒",
      title: "Interception Sécurisée",
      description: "Toutes les communications entre Cursor et api2.cursor.sh sont interceptées de manière sécurisée"
    },
    {
      iconKey: 'FiEye',
      fallbackIcon: "👁️",
      title: "Visibilité Totale",
      description: "Accédez à toutes les informations échangées et surveillez les requêtes en temps réel"
    },
    {
      iconKey: 'FiKey',
      fallbackIcon: "🔑",
      title: "Contrôle Total",
      description: "Modifiez facilement l'identifiant machine pour personnaliser votre environnement Cursor"
    },
    {
      iconKey: 'FiShield',
      fallbackIcon: "🛡️",
      title: "Gestion des Données",
      description: "Nettoyez les données stockées par Cursor pour assurer votre vie privée"
    }
  ];

  // Fonction de rendu d'icône avec solution de repli
  const renderIcon = (feature) => {
    const Icon = icons[feature.iconKey];
    if (Icon) {
      return <Icon size={24} />;
    }
    return <span className="text-2xl">{feature.fallbackIcon}</span>;
  };

  // Hexagon grid pattern for background (version simplifiée)
  const hexGridPattern = Array.from({ length: 10 }, (_, i) => (
    <div 
      key={i} 
      className="absolute hexagon border border-primary/10 bg-dark-light/50"
      style={{
        width: '50px',
        height: '50px',
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        transform: 'translate(-50%, -50%)',
        opacity: 0.3,
      }}
    />
  ));

  return (
    <section id="security" className="section relative overflow-hidden">
      {/* Hexagonal Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        {hexGridPattern}
      </div>
      
      <div className="container relative z-10">
        <ClientOnly>
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2">
              <div className="w-16 h-16 mb-6 bg-primary/10 rounded-lg flex items-center justify-center text-primary text-3xl">
                {icons.FiShield ? <icons.FiShield size={32} /> : <span>🛡️</span>}
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Contrôle <span className="text-primary">Complet</span>
              </h2>
              
              <p className="text-xl text-gray-300 mb-8">
                Cursor Proxy vous donne un contrôle total sur les communications de votre application Cursor,
                vous permettant de surveiller et gérer toutes les interactions réseau.
              </p>
              
              <div className="bg-dark-light/60 backdrop-blur-sm border border-dark-lighter rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <span className="w-5 h-5 mr-2 text-primary">
                    {icons.FiKey ? <icons.FiKey size={20} /> : <span>🔑</span>}
                  </span>
                  Pourquoi Surveiller Cursor ?
                </h3>
                <p className="text-gray-400">
                  Comprendre et contrôler les communications de Cursor vous permet d'optimiser votre expérience,
                  de personnaliser l'identifiant de votre machine et de gérer efficacement les données stockées
                  par l'application.
                </p>
              </div>
            </div>
            
            <div className="lg:w-1/2 grid grid-cols-1 md:grid-cols-2 gap-6">
              {securityFeatures.map((feature, index) => (
                <div
                  key={index}
                  id={feature.title.toLowerCase().replace(/\s+/g, '-')}
                  className="card card-hover bg-dark-light/60 backdrop-blur-sm"
                >
                  <div className="text-primary text-2xl mb-4">{renderIcon(feature)}</div>
                  <h3 className="text-lg font-semibold mb-2">
                    {feature.title === "Interception Sécurisée" ? (
                      <Link href="#network-monitoring-live" className="hover:text-primary transition-colors">
                        {feature.title}
                      </Link>
                    ) : (
                      feature.title
                    )}
                  </h3>
                  <p className="text-gray-400">{feature.description}</p>
                  {feature.title === "Interception Sécurisée" && (
                    <div className="mt-4">
                      <Link 
                        href="#network-monitoring-live" 
                        className="inline-flex items-center text-primary hover:text-primary-light transition-colors"
                      >
                        Voir le monitoring en temps réel
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                        </svg>
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Ajouter la section de visualisation réseau */}
          <div id="network-monitoring-live" className="mt-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">
              Visualisation <span className="text-primary">Réseau</span> en Temps Réel
            </h2>
            <NetworkMonitoringLive />
          </div>
        </ClientOnly>
      </div>
    </section>
  );
};

export default SecuritySection; 