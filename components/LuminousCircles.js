import { useEffect, useRef, useState } from 'react';
import styles from '../styles/luminous-circles.module.css';

// Composant pour les particules lumineuses
const LuminousParticles = ({ color, count = 5 }) => {
  // Générer des positions et délais aléatoires pour les particules
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.random() * 3 + 2,
    delay: Math.random() * 5,
    duration: Math.random() * 5 + 10,
    posX: Math.random() * 120 - 60,
    posY: Math.random() * 120 - 60,
  }));

  return (
    <>
      {particles.map(particle => (
        <div
          key={particle.id}
          className={styles.luminousParticle}
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: color,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            left: `calc(50% + ${particle.posX}px)`,
            top: `calc(50% + ${particle.posY}px)`,
          }}
        />
      ))}
    </>
  );
};

// Composant principal pour les cercles lumineux
export const LuminousCircles = ({ className = "", size = 250 }) => {
  const containerRef = useRef(null);
  const [colorPhase, setColorPhase] = useState(0);
  
  // Couleurs de base pour les 3 cercles (qui changeront progressivement)
  const getCircleColors = (phase) => {
    // Utilisation de HSL pour une transition de couleurs fluide
    return [
      `hsl(${(phase) % 360}, 80%, 65%)`,          // Premier cercle
      `hsl(${(phase + 120) % 360}, 80%, 65%)`,    // Deuxième cercle (décalé de 120°)
      `hsl(${(phase + 240) % 360}, 80%, 65%)`,    // Troisième cercle (décalé de 240°)
    ];
  };

  // Animation des couleurs
  useEffect(() => {
    const colorAnimationInterval = setInterval(() => {
      setColorPhase(prev => (prev + 1) % 360);
    }, 100); // Changement lent des couleurs
    
    return () => clearInterval(colorAnimationInterval);
  }, []);

  // Obtenir les couleurs actuelles
  const colors = getCircleColors(colorPhase);

  // Tailles calculées en fonction de la taille globale
  const circleSize = size * 0.45; // Assez grand pour se croiser

  return (
    <div 
      ref={containerRef}
      className={`${styles.luminousCirclesContainer} ${className}`} 
      style={{
        width: size,
        height: size,
        position: 'relative'
      }}
    >
      {/* Premier cercle - rotation horaire */}
      <div 
        className={`${styles.luminousCircle} ${styles.circle1}`}
        style={{
          width: circleSize,
          height: circleSize,
          backgroundColor: colors[0]
        }}
      />
      
      {/* Deuxième cercle - rotation anti-horaire */}
      <div 
        className={`${styles.luminousCircle} ${styles.circle2}`}
        style={{
          width: circleSize,
          height: circleSize,
          backgroundColor: colors[1]
        }}
      />
      
      {/* Troisième cercle - rotation horaire plus lente */}
      <div 
        className={`${styles.luminousCircle} ${styles.circle3}`}
        style={{
          width: circleSize,
          height: circleSize,
          backgroundColor: colors[2]
        }}
      />
      
      {/* Particules lumineuses qui suivent chaque cercle */}
      <div className={`${styles.particleContainer} ${styles.particleContainer1}`}>
        <LuminousParticles color={colors[0]} count={6} />
      </div>
      
      <div className={`${styles.particleContainer} ${styles.particleContainer2}`}>
        <LuminousParticles color={colors[1]} count={6} />
      </div>
      
      <div className={`${styles.particleContainer} ${styles.particleContainer3}`}>
        <LuminousParticles color={colors[2]} count={6} />
      </div>
      
      {/* Effet de brillance au centre */}
      <div className={styles.luminousCenterGlow} />
      
      {/* Lignes de connexion dynamiques entre les cercles */}
      <div className={`${styles.luminousConnection} ${styles.connection12}`}></div>
      <div className={`${styles.luminousConnection} ${styles.connection23}`}></div>
      <div className={`${styles.luminousConnection} ${styles.connection31}`}></div>
    </div>
  );
};

export default LuminousCircles; 