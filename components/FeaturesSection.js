'use client';

import React, { useState, useEffect } from 'react';
import ClientOnly from '../components/ClientOnly';
import Link from 'next/link';

export default function FeaturesSection() {
  // Utiliser un état local pour stocker les icônes
  const [icons, setIcons] = useState({
    FiWifi: null,
    FiHash: null,
    FiTrash2: null,
    FiServer: null
  });

  // Charger les icônes côté client uniquement
  useEffect(() => {
    const loadIcons = async () => {
      try {
        const { FiWifi, FiHash, FiTrash2, FiServer } = await import('react-icons/fi');
        setIcons({
          FiWifi: FiWifi,
          FiHash: FiHash,
          FiTrash2: FiTrash2,
          FiServer: FiServer
        });
      } catch (error) {
        console.error("Erreur lors du chargement des icônes:", error);
      }
    };
    loadIcons();
  }, []);

  // Données des fonctionnalités
  const features = [
    {
      iconKey: 'FiServer',
      fallbackIcon: "📡",
      title: "Surveillance Réseau",
      description: "Visualisez en temps réel les flux de données entre votre machine et api2.cursor.sh. Notre tableau de bord interactif affiche clairement les connexions entrantes (vert) et sortantes (rouge), avec des compteurs de requêtes, graphiques d'activité et détails complets sur chaque communication.",
    },
    {
      iconKey: 'FiWifi',
      fallbackIcon: "🌐",
      title: "Informations Réseau",
      description: "Afficher les informations réseau détaillées incluant carte réseau, ports utilisés, DNS et adresses IP.",
    },
    {
      iconKey: 'FiHash',
      fallbackIcon: "🔑",
      title: "Gestion MachineGUID",
      description: "Afficher et modifier l'identifiant unique de votre machine (MachineGUID) utilisé par Cursor.",
    },
    {
      iconKey: 'FiTrash2',
      fallbackIcon: "🗑️",
      title: "Nettoyage Storage",
      description: "Supprimer facilement le fichier storage.json du dossier globalStorage de Cursor pour réinitialiser l'application.",
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

  return (
    <section id="features" className="section py-20">
      <div className="container">
        <ClientOnly>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Fonctionnalités <span className="text-primary">Principales</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Cursor Proxy offre des outils essentiels pour intercepter et analyser les communications de Cursor
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                id={feature.title.toLowerCase().replace(/\s+/g, '-')}
                className="card card-hover"
              >
                <div className="w-12 h-12 mb-6 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  {renderIcon(feature)}
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  {feature.title === "Surveillance Réseau" ? (
                    <Link href="#network-monitor" className="hover:text-primary transition-colors">
                      {feature.title}
                    </Link>
                  ) : (
                    feature.title
                  )}
                </h3>
                <p className="text-gray-400">{feature.description}</p>
                {feature.title === "Surveillance Réseau" && (
                  <div className="mt-4">
                    <Link 
                      href="#network-monitor" 
                      className="inline-flex items-center text-primary hover:text-primary-light transition-colors"
                    >
                      Voir le tableau de bord
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ClientOnly>
      </div>
    </section>
  );
} 