'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ClientOnly from '../components/ClientOnly';

export default function DocumentationSection() {
  // Utiliser un état local pour stocker les icônes
  const [icons, setIcons] = useState({
    FiBook: null,
    FiFileText: null,
    FiCode: null,
    FiHelpCircle: null,
    FiExternalLink: null
  });

  // Charger les icônes côté client uniquement
  useEffect(() => {
    const loadIcons = async () => {
      try {
        const { FiBook, FiFileText, FiCode, FiHelpCircle, FiExternalLink } = await import('react-icons/fi');
        setIcons({
          FiBook: FiBook,
          FiFileText: FiFileText,
          FiCode: FiCode,
          FiHelpCircle: FiHelpCircle,
          FiExternalLink: FiExternalLink
        });
      } catch (error) {
        console.error("Erreur lors du chargement des icônes:", error);
      }
    };
    loadIcons();
  }, []);

  const docLinks = [
    {
      iconKey: 'FiFileText',
      fallbackIcon: "📄",
      title: "Guide Utilisateur",
      description: "Documentation complète pour utiliser toutes les fonctionnalités de Cursor Proxy",
      link: "#user-guides"
    },
    {
      iconKey: 'FiCode',
      fallbackIcon: "💻",
      title: "API Cursor",
      description: "Détails techniques sur les communications entre Cursor et api2.cursor.sh",
      link: "#api-reference"
    },
    {
      iconKey: 'FiHelpCircle',
      fallbackIcon: "❓",
      title: "FAQ",
      description: "Réponses aux questions fréquentes sur la surveillance et la gestion de Cursor",
      link: "#faqs"
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
    <section id="documentation" className="section bg-dark-light">
      <div className="container">
        <ClientOnly>
          <div className="text-center mb-16">
            <div className="inline-flex items-center mb-4">
              <span className="text-primary mr-2 text-2xl">
                {icons.FiBook ? <icons.FiBook size={24} /> : "📚"}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold">
                <span className="text-primary">Documentation</span> & Ressources
              </h2>
            </div>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Explorez notre documentation complète pour tirer le meilleur parti de Cursor Proxy
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {docLinks.map((item, index) => (
              <div
                key={index}
                className="card card-hover bg-dark/50 backdrop-blur-sm flex flex-col justify-between"
              >
                <div>
                  <div className="text-primary text-2xl mb-4">{renderIcon(item)}</div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-400 mb-6">{item.description}</p>
                </div>
                <Link href={item.link} className="flex items-center text-primary hover:text-primary-light">
                  Voir Documentation {icons.FiExternalLink ? <icons.FiExternalLink className="ml-2" /> : <span className="ml-2">↗️</span>}
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-16 p-8 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-semibold mb-2">Besoin d'Assistance Technique ?</h3>
                <p className="text-gray-300">
                  Notre équipe d'experts est prête à vous aider pour toute question sur Cursor Proxy
                </p>
              </div>
              <Link href="#support" className="btn-primary whitespace-nowrap">
                Contacter Support
              </Link>
            </div>
          </div>
        </ClientOnly>
      </div>
    </section>
  );
} 