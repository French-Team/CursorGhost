import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiMenu, FiX, FiLock, FiServer, FiGithub } from 'react-icons/fi';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    // Observer pour détecter la section visible
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5
    };

    const observerCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveLink(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    // Observer toutes les sections
    const sections = document.querySelectorAll('section[id]');
    sections.forEach(section => {
      observer.observe(section);
    });

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      sections.forEach(section => {
        observer.unobserve(section);
      });
    };
  }, []);

  // Fonction pour déterminer si un lien est actif
  const isActive = (href) => {
    const id = href.replace('#', '');
    return activeLink === id;
  };

  return (
    <nav 
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-dark-light/90 backdrop-blur-md shadow-lg' 
          : 'bg-transparent'
      }`}
    >
      <div className="container py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center space-x-2 cursor-pointer">
            <span className="text-primary text-3xl">
              <FiServer className="inline" />
            </span>
            <span className="text-xl font-bold">Cursor<span className="text-primary">Ghost</span></span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <div className="flex space-x-6">
            <Link 
              href="#features" 
              className={`navbar-link ${isActive('features') ? 'text-primary' : ''}`}
            >
              Fonctionnalités
            </Link>
            <Link 
              href="#security" 
              className={`navbar-link ${isActive('security') ? 'text-primary' : ''}`}
            >
              Contrôle
            </Link>
          </div>
          
          <div className="flex space-x-3">
            <Link href="#login" className="btn-outline">
              Connexion
            </Link>
            <Link href="https://github.com" target="_blank" rel="noopener noreferrer" className="btn-primary flex items-center">
              <FiGithub className="mr-2" /> GitHub
            </Link>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-200 hover:text-white focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      <div 
        className={`md:hidden absolute w-full bg-dark-light shadow-lg transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 py-4 opacity-100' : 'max-h-0 py-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="container flex flex-col space-y-4">
          <Link 
            href="#features" 
            className={`navbar-link ${isActive('features') ? 'text-primary' : ''}`} 
            onClick={() => setIsOpen(false)}
          >
            Fonctionnalités
          </Link>
          <Link 
            href="#security" 
            className={`navbar-link ${isActive('security') ? 'text-primary' : ''}`} 
            onClick={() => setIsOpen(false)}
          >
            Contrôle
          </Link>
          
          <div className="flex flex-col space-y-3 pt-4 border-t border-dark-lighter">
            <Link href="#login" className="btn-outline text-center" onClick={() => setIsOpen(false)}>
              Connexion
            </Link>
            <Link 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-primary flex items-center justify-center" 
              onClick={() => setIsOpen(false)}
            >
              <FiGithub className="mr-2" /> GitHub
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 