import Link from 'next/link';
import { FiGithub, FiTwitter, FiLinkedin, FiMail, FiServer } from 'react-icons/fi';

export default function Footer() {
  const footerLinks = {
    product: [
      { name: 'Fonctionnalités', href: '#features' },
      { name: 'Contrôle', href: '#security' },
      { name: 'Tarifs', href: '#pricing' },
      { name: 'Mises à jour', href: '#changelog' },
    ],
    resources: [
      { name: 'Documentation', href: '#documentation' },
      { name: 'API Cursor', href: '#api-reference' },
      { name: 'Guides', href: '#guides' },
      { name: 'FAQ', href: '#faqs' },
    ],
    company: [
      { name: 'À propos', href: '#about' },
      { name: 'Blog', href: '#blog' },
      { name: 'Carrières', href: '#careers' },
      { name: 'Contact', href: '#contact' },
    ],
    legal: [
      { name: 'Politique de confidentialité', href: '#privacy' },
      { name: 'Conditions d\'utilisation', href: '#terms' },
      { name: 'Politique des cookies', href: '#cookies' },
    ],
  };

  const socialLinks = [
    { name: 'GitHub', icon: <FiGithub />, href: '#github' },
    { name: 'Twitter', icon: <FiTwitter />, href: '#twitter' },
    { name: 'LinkedIn', icon: <FiLinkedin />, href: '#linkedin' },
    { name: 'Email', icon: <FiMail />, href: 'mailto:info@cursorproxy.com' },
  ];

  return (
    <footer className="bg-dark-light border-t border-dark-lighter">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          <div className="md:col-span-2">
            <Link href="/">
              <div className="flex items-center space-x-2 mb-6">
                <span className="text-primary text-3xl">
                  <FiServer className="inline" />
                </span>
                <span className="text-xl font-bold">Cursor<span className="text-primary">Proxy</span></span>
              </div>
            </Link>
            
            <p className="text-gray-400 mb-6 max-w-md">
              Cursor Proxy intercepte les communications de Cursor (api2.cursor.sh) et vous permet
              de surveiller les entrées/sorties réseau et de gérer efficacement votre environnement.
            </p>
            
            <div className="flex space-x-4">
              {socialLinks.map((link, index) => (
                <Link 
                  key={index} 
                  href={link.href}
                  className="w-10 h-10 rounded-full bg-dark flex items-center justify-center text-gray-400 hover:text-primary hover:bg-dark-lighter transition-colors"
                  aria-label={link.name}
                >
                  {link.icon}
                </Link>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Produit</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <Link href={link.href} className="text-gray-400 hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Ressources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link, index) => (
                <li key={index}>
                  <Link href={link.href} className="text-gray-400 hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Entreprise</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <Link href={link.href} className="text-gray-400 hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="border-t border-dark-lighter mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Cursor Proxy. Tous droits réservés.
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center">
            {footerLinks.legal.map((link, index) => (
              <Link key={index} href={link.href} className="text-gray-500 hover:text-primary transition-colors">
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
} 