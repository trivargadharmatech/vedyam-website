import React from 'react';

const ChariotScene = () => {
  return (
    <div className="chariot-scene-container">
      {/* Deep Sky Background */}
      <div className="epic-starry-bg"></div>

      {/* Clouds Layer - Positioned below the chariot */}
      <div className="svg-clouds-container">
        <div className="clouds-layer clouds-slow">
          <svg viewBox="0 0 1000 200" className="cloud-svg">
            <path d="M50 150 Q 80 120 120 150 Q 150 110 200 150 Q 230 130 260 150 L 50 150 Z" fill="rgba(255,255,255,0.1)"/>
            <path d="M350 160 Q 380 130 420 160 Q 450 120 500 160 Q 530 140 560 160 L 350 160 Z" fill="rgba(255,255,255,0.05)"/>
            <path d="M700 140 Q 730 110 770 140 Q 800 100 850 140 Q 880 120 910 140 L 700 140 Z" fill="rgba(255,255,255,0.08)"/>
          </svg>
        </div>
        <div className="clouds-layer clouds-fast">
          <svg viewBox="0 0 1000 200" className="cloud-svg">
            <path d="M100 180 Q 130 150 170 180 Q 200 140 250 180 Q 280 160 310 180 L 100 180 Z" fill="rgba(255,255,255,0.15)"/>
            <path d="M600 170 Q 630 140 670 170 Q 700 130 750 170 Q 780 150 810 170 L 600 170 Z" fill="rgba(255,255,255,0.12)"/>
          </svg>
        </div>
      </div>

      {/* Isolated SVG Chariot moving left to right */}
      <div className="isolated-chariot-wrapper">
        <svg viewBox="0 0 800 400" className="chariot-svg">
          <defs>
            <linearGradient id="goldGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="magicAura" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
            <linearGradient id="silverArmor" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Horse silhouettes */}
          <g className="horses" fill="url(#goldGlow)" filter="url(#glow)">
            <path d="M 450 250 Q 500 200 550 220 Q 600 180 620 220 L 650 260 L 600 280 L 550 280 L 450 300 Z" />
            <path d="M 470 240 Q 520 190 570 210 Q 620 170 640 210 L 670 250 L 620 270 L 570 270 L 470 290 Z" opacity="0.6"/>
            {/* Reins attached to Krishna's hand */}
            <path d="M 360 190 Q 450 230 500 210" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" className="reins-anim" />
          </g>

          {/* Chariot Body */}
          <g className="chariot-body" fill="url(#goldGlow)" filter="url(#glow)">
            <path d="M 150 200 L 350 200 L 380 280 L 150 280 Z" />
            <path d="M 180 200 L 180 80" stroke="url(#goldGlow)" strokeWidth="6" />
            <path d="M 180 80 L 260 100 L 180 120 Z" fill="#ef4444" />
          </g>

          {/* Krishna Figure (Light Blue with Gold Armor) */}
          <g className="krishna-figure" fill="#38bdf8">
            <circle cx="320" cy="150" r="15" />
            <path d="M 320 165 C 340 180, 340 200, 320 220 L 290 220 C 290 190, 310 170, 320 165 Z" fill="url(#goldGlow)"/>
            {/* Articulated Arm pulling reins */}
            <g className="krishna-arm">
              <path d="M 320 175 L 360 190" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" />
            </g>
            {/* Crown/Feather */}
            <path d="M 320 135 L 310 120 L 330 120 Z" fill="#0ea5e9" />
          </g>

          {/* Arjuna Figure (Silver Armor) */}
          <g className="arjuna-figure" fill="#94a3b8">
            <circle cx="220" cy="120" r="16" />
            <path d="M 220 136 C 240 160, 240 200, 220 220 L 190 220 C 190 180, 210 150, 220 136 Z" fill="url(#silverArmor)"/>
            {/* Quiver on back */}
            <path d="M 195 140 L 180 180 L 190 185 L 205 145 Z" fill="#b45309" />
            <path d="M 185 130 L 195 140 L 205 130" stroke="#fff" strokeWidth="2" fill="none" />
            
            {/* Bow (Front Arm) */}
            <g className="arjuna-front-arm">
              <path d="M 220 145 L 270 145" stroke="url(#silverArmor)" strokeWidth="6" strokeLinecap="round" />
              <path d="M 270 80 Q 320 145 270 210" fill="none" stroke="url(#goldGlow)" strokeWidth="4" />
            </g>

            {/* Articulated Back Arm (Reaching, pulling string, shooting) */}
            <g className="arjuna-back-arm">
              <path d="M 220 145 L 250 145" stroke="url(#silverArmor)" strokeWidth="6" strokeLinecap="round" className="arm-segment" />
              {/* Animated Arrow being loaded and shot */}
              <path d="M 200 145 L 270 145" stroke="#fff" strokeWidth="2" className="loaded-arrow" />
              {/* Animated Bow String */}
              <path d="M 270 80 L 250 145 L 270 210" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" className="bow-string" />
            </g>
          </g>

          {/* Rotating Wheels using bulletproof native SVG animation to prevent orbit bugs */}
          <g transform="translate(200, 280)">
            <g className="wheel-static">
              <circle cx="0" cy="0" r="40" fill="none" stroke="url(#goldGlow)" strokeWidth="8" />
              <line x1="-40" y1="0" x2="40" y2="0" stroke="url(#goldGlow)" strokeWidth="4" />
              <line x1="0" y1="-40" x2="0" y2="40" stroke="url(#goldGlow)" strokeWidth="4" />
              <line x1="-28" y1="-28" x2="28" y2="28" stroke="url(#goldGlow)" strokeWidth="4" />
              <line x1="-28" y1="28" x2="28" y2="-28" stroke="url(#goldGlow)" strokeWidth="4" />
              <circle cx="0" cy="0" r="10" fill="url(#goldGlow)" />
              <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="1.5s" repeatCount="indefinite" />
            </g>
          </g>

          <g transform="translate(330, 280)">
            <g className="wheel-static">
              <circle cx="0" cy="0" r="40" fill="none" stroke="url(#goldGlow)" strokeWidth="8" />
              <line x1="-40" y1="0" x2="40" y2="0" stroke="url(#goldGlow)" strokeWidth="4" />
              <line x1="0" y1="-40" x2="0" y2="40" stroke="url(#goldGlow)" strokeWidth="4" />
              <line x1="-28" y1="-28" x2="28" y2="28" stroke="url(#goldGlow)" strokeWidth="4" />
              <line x1="-28" y1="28" x2="28" y2="-28" stroke="url(#goldGlow)" strokeWidth="4" />
              <circle cx="0" cy="0" r="10" fill="url(#goldGlow)" />
              <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="1.5s" repeatCount="indefinite" />
            </g>
          </g>

        </svg>
      </div>

      {/* SVG Arrows flying across screen */}
      <div className="svg-arrows-container">
        <div className="flying-arrow arrow-1"></div>
        <div className="flying-arrow arrow-2"></div>
      </div>
    </div>
  );
};

export default ChariotScene;
