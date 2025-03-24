import { useState, useEffect } from 'react';

// Composant pour envelopper les éléments qui ne doivent être rendus que côté client
export default function ClientOnly({ children }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return null;
  }
  
  return typeof children === 'function' ? children() : children;
} 