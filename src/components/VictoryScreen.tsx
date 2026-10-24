/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { sound } from './SoundManager';
import { PartyPopper, ArrowRight, Home, CalendarCheck2, Moon, Sparkles } from 'lucide-react';
import milkaNormalImage from '../assets/images/milka_normal_1789325952070.jpg';

interface VictoryScreenProps {
  night: number;
  onNextNight: () => void;
  onBackToMenu: () => void;
  unlockedTwelveNights?: boolean;
}

export default function VictoryScreen({ night, onNextNight, onBackToMenu, unlockedTwelveNights }: VictoryScreenProps) {
  const [showSixAM, setShowSixAM] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showEndingAnimation, setShowEndingAnimation] = useState(false);
  const [endingStep, setEndingStep] = useState(0);

  const coinReward = night === 5 ? 1000 : night === 12 ? 2500 : night * 120;

  useEffect(() => {
    // Play 6:00 AM bells and cheering
    sound.playWinChime();

    // 6 AM flashing intro
    const timer1 = setTimeout(() => {
      setShowSixAM(true);
    }, 100);

    // Fade in stats after 3 seconds
    const timer2 = setTimeout(() => {
      setShowStats(true);
    }, 3200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Control ending animation steps sequentially
  useEffect(() => {
    if (showEndingAnimation) {
      // Play walking sound effects
      sound.playFootsteps();
      const t1 = setTimeout(() => setEndingStep(1), 1800);
      const t2 = setTimeout(() => {
        sound.playFootsteps(0.5);
        setEndingStep(2);
      }, 4000);
      const t3 = setTimeout(() => setEndingStep(3), 6500);
      const t4 = setTimeout(() => {
        sound.playPurrSuccess(0);
        setEndingStep(4);
      }, 9000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [showEndingAnimation]);

  if (showEndingAnimation) {
    return (
      <div 
        id="ending-animation-container"
        className="fixed inset-0 bg-neutral-950 flex flex-col items-center justify-center z-50 text-white font-mono p-6 overflow-hidden select-none"
      >
        {/* Twinkling Star background */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full animate-ping" />
          <div className="absolute top-1/4 left-1/3 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-teal-200 rounded-full animate-ping" />
          <div className="absolute bottom-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-pulse" />
          <div className="absolute bottom-1/3 right-1/3 w-1.5 h-1.5 bg-indigo-300 rounded-full animate-ping" />
          <div className="absolute top-12 right-20 w-1 h-1 bg-white rounded-full animate-pulse" />
          <div className="absolute bottom-12 left-16 w-1 h-1 bg-white rounded-full animate-pulse" />
        </div>

        {/* Cinematic half-moon and starry effects */}
        {endingStep >= 3 && (
          <div className="absolute top-16 md:top-24 flex flex-col items-center justify-center gap-2 animate-[fadeIn_1.5s_ease-out]">
            <div className="relative">
              <Moon className="w-24 h-24 text-amber-100/90 drop-shadow-[0_0_35px_rgba(253,224,71,0.4)] animate-[pulse_3s_infinite]" />
              <Sparkles className="w-6 h-6 text-yellow-300 absolute -top-2 -right-2 animate-bounce" />
            </div>
          </div>
        )}

        {/* Narrative steps */}
        <div className="max-w-xl text-center space-y-6 z-10 px-4">
          {endingStep >= 1 && (
            <p className="text-neutral-400 text-sm md:text-base tracking-wide leading-relaxed animate-[fadeIn_1.2s_ease-out]">
              Ви тихо відчиняєте важкі вхідні двері та виходите на подвір'я...
            </p>
          )}

          {endingStep >= 2 && (
            <p className="text-neutral-300 text-sm md:text-base tracking-wide leading-relaxed animate-[fadeIn_1.2s_ease-out]">
              Нічна свіжість миттєво наповнює ваші легені. Все навколо нарешті затихло...
            </p>
          )}

          {endingStep >= 3 && (
            <p className="text-neutral-100 text-sm md:text-base tracking-wide font-semibold leading-relaxed animate-[fadeIn_1.5s_ease-out]">
              На небі мирно світять зорі, а Мілка спокійно спить на підвіконні кімнати. Кошмар закінчився.
            </p>
          )}

          {/* Grand Date Display */}
          {endingStep >= 4 && (
            <div className="pt-10 flex flex-col items-center gap-8 animate-[fadeIn_2s_ease-out]">
              <div 
                id="good-ending-date"
                className="text-6xl md:text-8xl font-extrabold tracking-widest text-emerald-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.6)] font-sans"
              >
                5 лип.
              </div>
              
              <button
                id="btn-ending-menu"
                onClick={() => {
                  sound.playClick();
                  onBackToMenu();
                }}
                className="py-3.5 px-8 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 hover:text-white rounded-xl font-bold text-sm shadow-[0_0_15px_rgba(0,0,0,0.6)] cursor-pointer hover:scale-[1.02] transition-all duration-300"
              >
                ПОВЕРНУТИСЬ В ГОЛОВНЕ МЕНЮ
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const isFinalNight = night === (unlockedTwelveNights ? 12 : 5);

  return (
    <div 
      id="victory-container"
      className="relative flex flex-col items-center justify-center min-h-screen w-full bg-neutral-950 text-white font-sans p-6 overflow-hidden select-none"
    >
      {/* Background static glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.06)_0%,#000_100%)] pointer-events-none" />

      {/* 1. FLICKERING 6:00 AM TEXT */}
      {!showStats && (
        <div className="flex flex-col items-center justify-center h-full animate-pulse">
          <div className="font-mono text-neutral-500 tracking-wider text-xl mb-1">5:59 AM</div>
          <div 
            id="six-am-text"
            className="font-mono text-7xl md:text-8xl font-extrabold text-emerald-400 tracking-widest shadow-emerald-950 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)] animate-[flicker_1.5s_infinite]"
          >
            06:00 AM
          </div>
          <div className="text-emerald-500 font-mono text-xs mt-4 uppercase tracking-widest animate-pulse">
            ★ НІЧ ПЕРЕЖИТО ★
          </div>
        </div>
      )}

      {/* 2. STATS AND CERTIFICATE CARD */}
      {showStats && (
        <div 
          id="victory-stats-card"
          className="w-full max-w-2xl bg-neutral-900 border-2 border-emerald-800 p-6 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.12)] flex flex-col items-center justify-between z-10 animate-[fadeIn_0.5s_ease-out]"
        >
          {/* Certificate header */}
          <div className="flex items-center gap-3 border-b border-neutral-800 pb-4 w-full justify-center">
            <CalendarCheck2 className="w-8 h-8 text-emerald-400 animate-bounce" />
            <div className="text-center">
              <h2 className="text-xl font-bold tracking-tight text-neutral-100 uppercase">СВІДОЦТВО ВИЖИВАННЯ</h2>
              <p className="text-[10px] text-neutral-500 font-mono">ЧЕРГУВАННЯ УСПІШНО ЗАВЕРШЕНО</p>
            </div>
          </div>

          {/* Newspaper / Cute cat view */}
          <div className="flex flex-col md:flex-row items-center gap-6 my-6 w-full">
            <div className="w-36 h-36 rounded-xl border border-neutral-800 overflow-hidden bg-neutral-950 flex-shrink-0">
              <img 
                src={milkaNormalImage}
                alt="Happy Milka" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover filter brightness-95"
              />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider bg-emerald-950/40 border border-emerald-900 px-2 py-0.5 rounded">
                Успішно: {isFinalNight ? `Фінальна Ніч ${night}` : `Ніч ${night}`}
              </span>
              <p className="text-neutral-300 text-sm mt-3 leading-relaxed">
                {isFinalNight 
                  ? `Чудова робота! Ви зуміли протриматись усі ${night} ночей разом із Мілкою. Вона нарешті втомилась бути дивною, солодко позіхнула і заснула на своїй лежанці у вітальні. Тепер ви у повній безпеці!`
                  : "Мілка втомилась бігати по кімнатах, поїла сухого корму та солодко заснула на подушці у спальні. Ви пережили цю ніч, але попереду на вас чекають ще складніші випробування!"
                }
              </p>
            </div>
          </div>

          {/* Money reward details */}
          <div className="w-full bg-neutral-950/80 border border-neutral-800/60 p-4 rounded-xl flex items-center justify-between font-mono mb-6">
            <div className="flex flex-col">
              <span className="text-neutral-500 text-xs">ЗАРОБІТНА ПЛАТА:</span>
              <span className="text-neutral-200 text-sm font-semibold">Нараховано за зміну</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold text-2xl">+{coinReward}</span>
              <span className="text-amber-500 text-xs font-bold">🪙 Мілка-Коінів</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            {!isFinalNight ? (
              <button
                id="btn-victory-next"
                onClick={() => { sound.playClick(); onNextNight(); }}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(16,185,129,0.25)] hover:scale-[1.01] transition-all duration-200 cursor-pointer"
              >
                <span>Наступна зміна (Ніч {night + 1})</span>
                <ArrowRight className="w-4.5 h-4.5" />
              </button>
            ) : (
              <button
                id="btn-victory-menu"
                onClick={() => {
                  sound.playClick();
                  if (night === 12) {
                    setShowEndingAnimation(true);
                  } else {
                    onBackToMenu();
                  }
                }}
                className="flex-1 py-3 px-4 bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(202,138,4,0.25)] hover:scale-[1.01] transition-all duration-200 cursor-pointer"
              >
                <PartyPopper className="w-4.5 h-4.5 text-yellow-100" />
                <span>{night === 12 ? 'ПЕРЕГЛЯНУТИ КІНЕЦЬ' : 'ГОЛОВНЕ МЕНЮ (ПЕРЕМОГА!)'}</span>
              </button>
            )}
            
            <button
              id="btn-victory-back"
              onClick={() => { sound.playClick(); onBackToMenu(); }}
              className="py-3 px-5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:scale-[1.01] transition-all duration-200 cursor-pointer"
            >
              <Home className="w-4.5 h-4.5 text-neutral-500" />
              <span>До меню</span>
            </button>
          </div>
        </div>
      )}

      {/* Embedded flickering keyframes for retro aesthetics */}
      <style>{`
        @keyframes flicker {
          0%, 100% { opacity: 0.95; }
          45% { opacity: 0.90; }
          50% { opacity: 0.30; }
          55% { opacity: 0.95; }
          85% { opacity: 0.95; }
          90% { opacity: 0.20; }
          95% { opacity: 0.95; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
