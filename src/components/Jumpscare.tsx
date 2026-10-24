/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { sound } from './SoundManager';
import garikJumpscare from '../assets/images/garik_jumpscare_1782562279954.jpg';
import shellyJumpscare from '../assets/images/shelly_jumpscare_1789325988227.jpg';
import milkaJumpscare from '../assets/images/milka_jumpscare_1789325978023.jpg';

interface JumpscareProps {
  onComplete: () => void;
  attacker?: 'milka' | 'garik' | 'shelly' | 'entity_4';
}

export default function Jumpscare({ onComplete, attacker = 'milka' }: JumpscareProps) {
  const [flickerRed, setFlickerRed] = useState(false);

  useEffect(() => {
    // Play horrifying procedural robotic cat screech
    sound.playJumpscare();

    // High frequency flashing
    const interval = setInterval(() => {
      setFlickerRed(prev => !prev);
    }, 45);

    // After 2.5 seconds, transition to Game Over screen
    const timer = setTimeout(() => {
      onComplete();
    }, 2400);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  const imageSrc = attacker === 'garik' 
    ? garikJumpscare 
    : attacker === 'shelly'
      ? shellyJumpscare
      : milkaJumpscare;

  const isEntity_4 = attacker === 'entity_4';

  return (
    <div 
      id="jumpscare-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black select-none cursor-none"
    >
      {/* Intense color strobe flashing */}
      <div 
        className={`absolute inset-0 transition-colors duration-75 pointer-events-none ${
          flickerRed ? 'bg-red-950/75' : 'bg-neutral-900/65'
        }`} 
      />

      {/* Extreme shaking frame container */}
      <div 
        className="relative w-full h-full max-w-4xl flex items-center justify-center animate-[shake_0.1s_infinite]"
        style={{
          animationName: 'shake',
          animationDuration: '0.08s',
          animationIterationCount: 'infinite'
        }}
      >
        <img 
          id="jumpscare-cat-face"
          src={imageSrc}
          alt="SCREAMER!" 
          referrerPolicy="no-referrer"
          className="w-full h-full md:w-[95%] md:h-[95%] object-cover scale-[1.12] rounded shadow-[0_0_80px_rgba(239,68,68,0.7)] border-4 border-red-600 animate-[pulse_0.1s_infinite]"
          style={isEntity_4 ? { filter: 'invert(1) sepia(1) saturate(8) hue-rotate(310deg) contrast(3)' } : undefined}
        />

        {/* Glitch CRT grid lines overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_2px,transparent_2px)] bg-[size:100%_6px] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(239,68,68,0.12)_1px,transparent_1px)] bg-[size:4px_100%] pointer-events-none" />
      </div>

      {/* Full screen static distortion block */}
      <div className="absolute inset-0 bg-white/5 pointer-events-none mix-blend-overlay animate-pulse" />

      {/* Shake Keyframe injections */}
      <style>{`
        @keyframes shake {
          0% { transform: translate(4px, 4px) rotate(0deg); }
          10% { transform: translate(-3px, -5px) rotate(-1deg); }
          20% { transform: translate(-8px, 0px) rotate(1deg); }
          30% { transform: translate(0px, 4px) rotate(0deg); }
          40% { transform: translate(3px, -3px) rotate(1deg); }
          50% { transform: translate(-3px, 5px) rotate(-1deg); }
          60% { transform: translate(-8px, 3px) rotate(0deg); }
          71% { transform: translate(5px, 3px) rotate(1deg); }
          80% { transform: translate(-2px, -3px) rotate(-1deg); }
          90% { transform: translate(4px, 5px) rotate(0deg); }
          100% { transform: translate(1px, -4px) rotate(-1deg); }
        }
      `}</style>
    </div>
  );
}
