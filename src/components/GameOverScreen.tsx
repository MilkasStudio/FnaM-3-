/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { sound } from './SoundManager';
import { RotateCcw, ShoppingCart, Home, Skull } from 'lucide-react';

interface GameOverScreenProps {
  night: number;
  timeString: string;
  hoursSurvived: number;
  onRetry: () => void;
  onOpenShop: () => void;
  onBackToMenu: () => void;
}

export default function GameOverScreen({
  night,
  timeString,
  hoursSurvived,
  onRetry,
  onOpenShop,
  onBackToMenu
}: GameOverScreenProps) {
  const [flicker, setFlicker] = useState(true);

  // Partial salary compensation formula
  const compensation = 10 + hoursSurvived * 15;

  useEffect(() => {
    // Play low creepy drone when game over starts
    sound.playMenuAmbient();

    const interval = setInterval(() => {
      setFlicker(prev => !prev);
    }, 200);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div 
      id="gameover-container"
      className="relative flex flex-col items-center justify-center min-h-screen w-full bg-neutral-950 text-white font-sans p-6 overflow-hidden select-none"
    >
      {/* Red ambient light overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.12)_0%,#000_100%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.04)_1.5px,transparent_1.5px)] bg-[size:100%_4px] pointer-events-none" />

      {/* 1. SCARY HEADER */}
      <div className="flex flex-col items-center text-center mb-8 z-10 animate-[pulse_2s_infinite]">
        <div className="p-4 bg-red-950/40 border border-red-800 rounded-full mb-4 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
          <Skull className="w-10 h-10 text-red-500" />
        </div>
        <h1 
          id="gameover-title"
          className="text-4xl md:text-5xl font-extrabold uppercase font-mono tracking-wider text-red-600 select-none"
          style={{
            textShadow: flicker ? '3px 0px 0px #000, -2px 0px 0px #7f1d1d' : 'none'
          }}
        >
          ГРА ЗАКІНЧЕНА
        </h1>
        <p className="text-xs text-neutral-500 font-mono mt-2 tracking-widest uppercase">
          [ МІЛКА ЗНАЙШЛА ВАС ]
        </p>
      </div>

      {/* 2. STATS & REWARDS BOARD */}
      <div 
        id="gameover-stats-card"
        className="w-full max-w-md bg-neutral-900 border border-neutral-800/80 rounded-xl p-5 shadow-2xl z-10 mb-8"
      >
        <h3 className="text-xs font-bold text-neutral-400 font-mono tracking-wider uppercase mb-3 border-b border-neutral-800 pb-1.5 text-center">
          ЗВІТ СЛУЖБИ БЕЗПЕКИ
        </h3>

        <div className="flex flex-col gap-2.5 text-sm font-mono my-4">
          <div className="flex justify-between border-b border-neutral-800/40 pb-1">
            <span className="text-neutral-500">Остання зміна:</span>
            <span className="text-neutral-200">Ніч {night}</span>
          </div>
          <div className="flex justify-between border-b border-neutral-800/40 pb-1">
            <span className="text-neutral-500">Час смерті:</span>
            <span className="text-red-400 font-bold">{timeString}</span>
          </div>
          <div className="flex justify-between border-b border-neutral-800/40 pb-1">
            <span className="text-neutral-500">Вдалося вижити:</span>
            <span className="text-neutral-200">{hoursSurvived} год.</span>
          </div>
        </div>

        {/* Consolation compensation message */}
        <div className="mt-4 p-3.5 bg-amber-950/20 border border-amber-900/40 rounded-lg flex items-center justify-between font-mono">
          <div className="flex flex-col">
            <span className="text-[10px] text-amber-500 font-bold uppercase">КОМПЕНСАЦІЯ:</span>
            <span className="text-[10px] text-neutral-400">Часткова виплата за зміну</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 font-bold text-lg">+{compensation}</span>
            <span className="text-amber-500 text-[10px] font-bold">🪙 Мілка-Коінів</span>
          </div>
        </div>
      </div>

      {/* 3. ACTIONS GRID */}
      <div id="gameover-actions" className="w-full max-w-sm flex flex-col gap-3 z-10">
        
        {/* Retry Button */}
        <button
          id="btn-gameover-retry"
          onClick={() => { sound.playClick(); onRetry(); }}
          className="w-full py-3 px-4 bg-red-700 hover:bg-red-600 border border-red-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2.5 shadow-[0_4px_15px_rgba(239,68,68,0.2)] hover:scale-[1.01] transition-all cursor-pointer"
        >
          <RotateCcw className="w-4.5 h-4.5" />
          <span>СПРОБУВАТИ ЗНОВУ</span>
        </button>

        {/* Direct Shop button */}
        <button
          id="btn-gameover-shop"
          onClick={() => { sound.playClick(); onOpenShop(); }}
          className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 font-semibold text-sm rounded-xl flex items-center justify-center gap-2.5 hover:text-white hover:scale-[1.01] transition-all cursor-pointer"
        >
          <ShoppingCart className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
          <span>ОБЛАДНАТИСЬ В МАГАЗИНІ</span>
        </button>

        {/* Back to main menu */}
        <button
          id="btn-gameover-menu"
          onClick={() => { sound.playClick(); onBackToMenu(); }}
          className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-medium text-sm rounded-xl flex items-center justify-center gap-2.5 hover:text-white hover:scale-[1.01] transition-all cursor-pointer"
        >
          <Home className="w-4.5 h-4.5 text-neutral-500" />
          <span>ПОВЕРНУТИСЬ ДО МЕНЮ</span>
        </button>

      </div>
    </div>
  );
}
