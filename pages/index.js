import Layout from '../components/Layout.js';
import dynamic from 'next/dynamic';

// Charger les composants côté client uniquement
const HeroSection = dynamic(() => import('../components/HeroSection.js'), {
  ssr: false,
  loading: () => <div className="py-20 text-center">Chargement...</div>
});

const FeaturesSection = dynamic(() => import('../components/FeaturesSection.js'), {
  ssr: false,
});

const NetworkMonitorSection = dynamic(() => import('../components/NetworkMonitorSection.js'), {
  ssr: false,
});

const SecuritySection = dynamic(() => import('../components/SecuritySection.js'), {
  ssr: false,
});

const DocumentationSection = dynamic(() => import('../components/DocumentationSection.js'), {
  ssr: false,
});

const CTASection = dynamic(() => import('../components/CTASection.js'), {
  ssr: false,
});

export default function Home() {
  return (
    <Layout>
      <HeroSection />
      <FeaturesSection />
      <NetworkMonitorSection />
      <SecuritySection />
      <DocumentationSection />
      <CTASection />
    </Layout>
  );
}