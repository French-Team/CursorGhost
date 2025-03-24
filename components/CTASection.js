'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ClientOnly from '../components/ClientOnly';

export default function CTASection() {
  // Utiliser un état local pour stocker les icônes
  const [icons, setIcons] = useState({
    FiShield: null,
    FiArrowRight: null
  });

  // Charger les icônes côté client uniquement
  useEffect(() => {
    const loadIcons = async () => {
      try {
        const { FiShield, FiArrowRight } = await import('react-icons/fi');
        setIcons({
          FiShield: FiShield,
          FiArrowRight: FiArrowRight
        });
      } catch (error) {
        console.error("Erreur lors du chargement des icônes:", error);
      }
    };
    loadIcons();
  }, []);

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark to-dark-light z-0">
        {/* Simplified grid pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="h-full w-full" style={{ 
            backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>
      </div>
      
      <div className="container relative z-10">
        <ClientOnly>
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-primary mb-6">
              <span className="mr-2">
                {icons.FiShield ? <icons.FiShield size={20} /> : "🛡️"}
              </span> 
              Intercepter les communications de Cursor
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Accédez au potentiel complet de <span className="text-primary">Cursor Proxy</span> dès maintenant
            </h2>
            
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Rejoignez les utilisateurs qui font confiance à Cursor Proxy pour intercepter et gérer les communications avec api2.cursor.sh
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="#signup" className="btn-primary flex items-center px-8 py-3 text-lg">
                Commencer {icons.FiArrowRight ? <icons.FiArrowRight className="ml-2" /> : <span className="ml-2">➡️</span>}
              </Link>
              <Link href="#demo" className="btn-outline px-8 py-3 text-lg">
                Demander une démo
              </Link>
            </div>
            
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="bg-dark-light/50 backdrop-blur-sm p-4 rounded-lg">
                <div className="text-3xl font-bold text-primary mb-1">100%</div>
                <div className="text-gray-400">Visibilité réseau</div>
              </div>
              <div className="bg-dark-light/50 backdrop-blur-sm p-4 rounded-lg">
                <div className="text-3xl font-bold text-primary mb-1">E/S</div>
                <div className="text-gray-400">Surveillance complète</div>
              </div>
              <div className="bg-dark-light/50 backdrop-blur-sm p-4 rounded-lg">
                <div className="text-3xl font-bold text-primary mb-1">GUID</div>
                <div className="text-gray-400">Gestion facilitée</div>
              </div>
            </div>
          </div>
        </ClientOnly>
      </div>
    </section>
  );
} 