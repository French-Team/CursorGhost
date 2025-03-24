import Head from 'next/head';
import dynamic from 'next/dynamic';

// Importer les composants avec dynamic import pour éviter les problèmes de SSR
const Navbar = dynamic(() => import('./Navbar.js'), { ssr: false });
const Footer = dynamic(() => import('./Footer.js'), { ssr: false });

export default function Layout({ children }) {
  return (
    <>
      <Head>
        <title>Cursor Proxy - Intercepter les communications de Cursor</title>
        <meta name="description" content="Cursor Proxy permet de surveiller les entrées/sorties réseau, afficher les infos réseau, gérer le machineGUID, et supprimer storage.json." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
} 