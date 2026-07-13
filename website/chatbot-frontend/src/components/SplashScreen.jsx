import React, { useEffect, useState } from 'react';
import './SplashScreen.css';
import tilakLogo from '../assets/new_vedyam_logo.jpg';

const SplashScreen = ({ onComplete }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Start exit transition at 3.5s
    const exitTimer = setTimeout(() => {
      const isMobile = window.innerWidth <= 768;
      const targetId = isMobile ? 'mobile-target-logo' : 'desktop-target-logo';
      const targetLogo = document.getElementById(targetId);
      const flyingLogo = document.getElementById('flying-logo-wrapper');
      
      if (flyingLogo && targetLogo) {
        const flyRect = flyingLogo.getBoundingClientRect();
        const targetRect = targetLogo.getBoundingClientRect();
        
        const flyCenterX = flyRect.left + flyRect.width / 2;
        const flyCenterY = flyRect.top + flyRect.height / 2;
        
        const targetCenterX = targetRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top + targetRect.height / 2;
        
        const deltaX = targetCenterX - flyCenterX;
        const deltaY = targetCenterY - flyCenterY;
        
        const scale = targetRect.width / flyRect.width;
        
        flyingLogo.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scale})`;
      }
      
      setIsExiting(true);
    }, 3500);

    // Complete at 4.5s
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 4500);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  // Generate 80 random particles
  const particles = Array.from({ length: 80 }).map((_, i) => {
    const angle = Math.random() * 360;
    const distance = 80 + Math.random() * 160;
    const delay = Math.random() * 2;
    const duration = 2.5 + Math.random() * 2;
    const size = 1.5 + Math.random() * 3;
    
    return { id: i, angle, distance, delay, duration, size };
  });

  return (
    <div className={`splash-container ${isExiting ? 'exit' : ''}`}>
      <div className="splash-background"></div>
      
      <div className="splash-content">
        <div className="logo-wrapper" id="flying-logo-wrapper">
          <div className="halo-glow"></div>
          <div className="empty-state-icon" style={{ margin: '0 auto 24px', width: '120px', height: '120px' }}>
            <img src={tilakLogo} alt="ISKCON Tilak" className="sidebar-logo" />
          </div>
          
          <div className="particles-container">
            {particles.map((p) => (
              <div 
                key={p.id} 
                className="particle"
                style={{
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  '--angle': `${p.angle}deg`,
                  '--distance': `${p.distance}px`,
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration}s`
                }}
              ></div>
            ))}
          </div>
        </div>
        
        <h1 className="splash-title serif" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #b2e6e3 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: '"Cormorant Garamond", serif' }}>
          Vedyam
        </h1>
      </div>
    </div>
  );
};

export default SplashScreen;
