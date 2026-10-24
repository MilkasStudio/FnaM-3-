/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { sound } from './SoundManager';
import { Eye, ChevronRight } from 'lucide-react';

interface IntroCutsceneProps {
  onComplete: () => void;
}

export default function IntroCutscene({ onComplete }: IntroCutsceneProps) {
  const storyLines = [
    "ЩОДЕННИК: 23 червня 2026 року...",
    "Батьки поїхали у відпустку на 5 днів. Я залишився зовсім один у цьому великому будинку.",
    "Єдине, що вони залишили — це нашу триколірну кішку Мілку (білу, руду та чорну).",
    "Вдень вона виглядає милою та звичайною. Гріється на сонечку та муркоче...",
    "Але щойно годинник б'є північ — усе змінюється.",
    "Вона починає дивно бродити кімнатами. Її очі світяться у темряві яскраво-зеленим вогнем.",
    "Вона хоче пробратися до моєї кімнати. Я бачу її силует на камерах спостереження...",
    "Батько встановив у моїй спальні важкі металеві двері, але вони живляться від резервного генератора.",
    "Мені потрібно стежити за Мілкою через монітор, світити ліхтариком у темряву та зачиняти двері, щоб вижити.",
    "Якщо вона зайде всередину... мені кінець.",
    "Треба протриматися 5 ночей. З 12 години ночі до 6 ранку..."
  ];

  const [currentLineIdx, setCurrentLineIdx] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [charIdx, setCharIdx] = useState(0);

  // Skip click
  const handleSkip = () => {
    sound.playClick();
    onComplete();
  };

  // Typewriter effect
  useEffect(() => {
    if (currentLineIdx >= storyLines.length) {
      onComplete();
      return;
    }

    const currentLine = storyLines[currentLineIdx];
    
    if (charIdx < currentLine.length) {
      const charTimer = setTimeout(() => {
        setDisplayText(prev => prev + currentLine[charIdx]);
        setCharIdx(prev => prev + 1);
        
        // Soft clicking noise for keyboard typewriter keys
        if (charIdx % 3 === 0) {
          sound.playClick();
        }
      }, 30);
      
      return () => clearTimeout(charTimer);
    }
  }, [charIdx, currentLineIdx]);

  const handleNextLine = () => {
    sound.playClick();
    const currentLine = storyLines[currentLineIdx];
    
    if (charIdx < currentLine.length) {
      // If still typing, complete the line instantly
      setDisplayText(currentLine);
      setCharIdx(currentLine.length);
    } else {
      // Go to next line
      setDisplayText("");
      setCharIdx(0);
      setCurrentLineIdx(prev => prev + 1);
    }
  };

  return (
    <div 
      id="intro-cutscene-container"
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between p-6 md:p-12 select-none font-mono"
    >
      {/* Phosphor terminal green tint scanline overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.02)_1px,transparent_1px)] bg-[size:100%_3px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,#000_100%)] pointer-events-none" />

      {/* Header index */}
      <div id="intro-hud" className="w-full max-w-3xl flex items-center justify-between text-[11px] text-emerald-600/60 border-b border-emerald-950/40 pb-3 mt-4">
        <span className="flex items-center gap-1.5 uppercase">
          <Eye className="w-3.5 h-3.5 animate-pulse" />
          ВІДТВОРЕННЯ: СЮЖЕТНИЙ ЗАПИС
        </span>
        <span>КРОК {currentLineIdx + 1} / {storyLines.length}</span>
      </div>

      {/* Primary visual body */}
      <div 
        id="intro-text-canvas"
        onClick={handleNextLine}
        className="w-full max-w-3xl flex-1 flex flex-col items-start justify-center cursor-pointer min-h-[250px] p-6 rounded-lg border border-emerald-950/20 bg-neutral-950/40 my-6"
      >
        <p className="text-emerald-400 text-lg md:text-xl leading-relaxed text-left font-mono whitespace-pre-wrap">
          {displayText}
          <span className="inline-block w-2.5 h-5 bg-emerald-400 ml-1.5 animate-pulse" />
        </p>

        {charIdx >= storyLines[currentLineIdx]?.length && (
          <span className="text-[10px] text-emerald-600/40 mt-8 uppercase tracking-widest animate-pulse self-end font-mono">
            [ Клікніть, щоб продовжити ]
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div id="intro-actions" className="w-full max-w-3xl flex items-center justify-between border-t border-emerald-950/40 pt-4 mb-4">
        <button
          id="btn-intro-skip"
          onClick={handleSkip}
          className="px-4 py-2 border border-neutral-800 hover:border-neutral-700 bg-neutral-900 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white cursor-pointer transition duration-200"
        >
          ПРОПУСТИТИ СЮЖЕТ
        </button>

        <button
          id="btn-intro-next"
          onClick={handleNextLine}
          className="px-4 py-2 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition duration-200 border border-emerald-800"
        >
          <span>ДАЛІ</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
