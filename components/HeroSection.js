import { useState, useEffect } from 'react';
import { FiShield, FiArrowRight } from 'react-icons/fi';
import Link from 'next/link';
import LuminousCircles from './LuminousCircles';
// Optionnel : importer les animations du fantôme si nous voulons les initialiser ici
// import { initGhostAnimations } from './animation_ghost';

// Composant pour envelopper les éléments qui ne doivent être rendus que côté client
function ClientOnly({ children, ...delegated }) {
  const [hasMounted, setHasMounted] = useState(false);
  
  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  if (!hasMounted) {
    return null;
  }
  
  return <div {...delegated}>{children}</div>;
}

export default function HeroSection() {
  // Optionnel : initialiser les animations du fantôme après le montage
  /*
  useEffect(() => {
    // Initialiser les animations seulement côté client
    if (typeof window !== 'undefined') {
      initGhostAnimations();
    }
  }, []);
  */

  return (
    <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/10 rounded-full filter blur-3xl"></div>
      </div>
      
      <div className="container relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <ClientOnly>
            <div className="text-center md:text-left">
              <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-primary mb-6">
                <FiShield className="mr-2" /> Solution Sécurisée de Gestion Réseau
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Contrôle <span className="text-primary">Réseau</span> Professionnel à Portée de Main
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 max-w-lg mx-auto md:mx-0">
                CursorProxy fournit des outils puissants pour intercepter, surveiller et contrôler les communications entre Cursor et api2.cursor.sh.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
                <Link href="#features" className="btn-primary flex items-center w-full sm:w-auto justify-center">
                  Explorer les Fonctionnalités <FiArrowRight className="ml-2" />
                </Link>
                <Link href="#documentation" className="btn-outline w-full sm:w-auto text-center">
                  Documentation
                </Link>
              </div>
            </div>
          </ClientOnly>
          
          <ClientOnly className="relative h-72 md:h-96">
            <div className="relative h-full flex items-center justify-center">
              {/* Cercles lumineux au lieu du fantôme */}
              <LuminousCircles size={230} />
            </div>
          </ClientOnly>
        </div>
      </div>
    </section>
  );
} 