/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameSave, SoundConfig, CustomNightConfig } from '../types';
import { sound } from './SoundManager';
import { Play, RotateCcw, ShoppingCart, Settings, Volume2, VolumeX, Eye, ShieldAlert, Heart, BookOpen, X, ChevronRight, Info, Globe, Phone, Sliders, Sparkles, Award } from 'lucide-react';
import { Language, getTranslation, getFormattedTranslation, TRANSLATIONS } from '../translations';
import milkaNormalImage from '../assets/images/milka_normal_1789325952070.jpg';
import shellyNormalImage from '../assets/images/shelly_normal_1789325998843.jpg';

interface MainMenuProps {
  gameSave: GameSave;
  soundConfig: SoundConfig;
  onStartNight: (nightNum: number) => void;
  onStartCustomNight: (config: CustomNightConfig) => void;
  onOpenShop: () => void;
  onUpdateSoundConfig: (cfg: SoundConfig) => void;
  onResetSave: () => void;
  language: Language;
  onUpdateLanguage: (lang: Language) => void;
}

export default function MainMenu({
  gameSave,
  soundConfig,
  onStartNight,
  onStartCustomNight,
  onOpenShop,
  onUpdateSoundConfig,
  onResetSave,
  language,
  onUpdateLanguage
}: MainMenuProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [staticOpacity, setStaticOpacity] = useState(0.04);
  const [glitchTitle, setGlitchTitle] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<'milka' | 'garik' | 'shelly' | 'entity_4'>('milka');

  // Custom Night configuration states
  const [showCustomNight, setShowCustomNight] = useState(false);
  const [customMilkaLevel, setCustomMilkaLevel] = useState(10);
  const [customShellyLevel, setCustomShellyLevel] = useState(10);
  const [customGarikLevel, setCustomGarikLevel] = useState(10);
  const [customEntity_4Level, setCustomEntity_4Level] = useState(5);
  const [perkFreeLamp, setPerkFreeLamp] = useState(false);
  const [perkInfiniteFlashlight, setPerkInfiniteFlashlight] = useState(false);
  const [perkDoublePower, setPerkDoublePower] = useState(false);
  const [perkMoreTreats, setPerkMoreTreats] = useState(false);
  const [perkRadarActive, setPerkRadarActive] = useState(false);

  // Play menu ambient music
  useEffect(() => {
    sound.playMenuAmbient();
    
    // Static and title glitch intervals
    const staticInterval = setInterval(() => {
      setStaticOpacity(0.02 + Math.random() * 0.05);
    }, 120);

    const titleInterval = setInterval(() => {
      setGlitchTitle(true);
      setTimeout(() => setGlitchTitle(false), 150);
    }, 4500);

    return () => {
      clearInterval(staticInterval);
      clearInterval(titleInterval);
    };
  }, []);

  const handleVolumeChange = (type: 'sfx' | 'music', val: number) => {
    const updated = {
      ...soundConfig,
      [type === 'sfx' ? 'sfxVolume' : 'musicVolume']: val
    };
    onUpdateSoundConfig(updated);
    sound.setVolumes(updated.sfxVolume, updated.musicVolume);
    if (type === 'sfx') {
      sound.playClick();
    }
  };

  const handleToggleJumpscare = () => {
    sound.playClick();
    onUpdateSoundConfig({
      ...soundConfig,
      jumpscaresEnabled: !soundConfig.jumpscaresEnabled
    });
  };

  const handleTogglePhoneCalls = () => {
    sound.playClick();
    onUpdateSoundConfig({
      ...soundConfig,
      phoneCallsEnabled: !soundConfig.phoneCallsEnabled
    });
  };

  const startNewGame = () => {
    sound.playClick();
    sound.stopMenuAmbient();
    onStartNight(1); // Start from Night 1
  };

  const startContinueGame = () => {
    sound.playClick();
    sound.stopMenuAmbient();
    const maxNights = gameSave.unlockedTwelveNights ? 12 : 5;
    const targetNight = Math.min(maxNights, gameSave.unlockedNight);
    onStartNight(targetNight);
  };

  const handleResetSaveClick = () => {
    sound.playClick();
    if (showResetConfirm) {
      onResetSave();
      setShowResetConfirm(false);
    } else {
      setShowResetConfirm(true);
    }
  };

  return (
    <div 
      id="main-menu-container"
      className="relative flex flex-col items-center justify-between min-h-screen w-full bg-neutral-950 text-white font-sans p-6 overflow-hidden select-none"
    >
      {/* 1. CRT SCANLINES AND STATIC EFFECTS OVERLAYS */}
      <div 
        className="absolute inset-0 pointer-events-none z-10 bg-white" 
        style={{ opacity: staticOpacity, mixBlendMode: 'overlay' }} 
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#000_100%)] pointer-events-none z-10" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0.06)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

      {/* 2. GAME LOGO & GRAPHICS */}
      <div id="menu-branding-layout" className="w-full max-w-4xl flex flex-col md:flex-row items-center justify-around mt-12 md:mt-20 z-10 gap-8">
        
        {/* Left Side: Title */}
        <div className="flex flex-col text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-1.5 mb-2 text-neutral-500 font-mono tracking-widest text-xs uppercase">
            <span>{getTranslation(language, 'subtitle')}</span>
          </div>
          
          <div className="flex flex-col items-center md:items-start justify-center md:justify-start">
            <h1 
              id="menu-game-title"
              className={`text-5xl md:text-6xl font-extrabold tracking-wider uppercase font-sans ${
                glitchTitle 
                  ? 'text-red-500 line-through scale-x-105 skew-x-3 translate-x-1 font-mono' 
                  : 'text-neutral-100'
              } transition-all duration-75 pb-6 md:pb-8`}
              style={{
                textShadow: glitchTitle 
                  ? '3px 0px 0px #06b6d4, -3px 0px 0px #f43f5e' 
                  : '2px 2px 4px rgba(0,0,0,0.8)'
              }}
            >
              {(() => {
                const titleText = getTranslation(language, 'gameTitle');
                const words = titleText.split(" ");
                return words.map((word, idx) => {
                  const isPreposition = ['з', 'с', 'with'].includes(word.toLowerCase());
                  if (isPreposition) {
                    return (
                      <span key={idx} className="relative inline-block mx-1">
                        <span className="relative z-10">{word}</span>
                        {/* Highly stylized sequel "2" placed directly under the preposition 'з'/'с'/'with' */}
                        <span 
                          id="menu-sequel-badge"
                          className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 md:mt-3 text-5xl md:text-6xl font-black select-none transition-all duration-100 ${
                            glitchTitle
                              ? 'text-lime-400 rotate-12 scale-110 opacity-100'
                              : 'text-red-600 -rotate-12 opacity-95 animate-pulse'
                          }`}
                          style={{
                            textShadow: glitchTitle
                              ? '4px 0px 0px rgba(239, 68, 68, 0.95), -4px 0px 0px rgba(34, 197, 94, 0.95)'
                              : '0 0 25px rgba(220, 38, 38, 0.9), 3px 3px 5px rgba(0, 0, 0, 0.95)',
                            fontFamily: '"Impact", "Arial Black", sans-serif'
                          }}
                        >
                          2
                        </span>
                      </span>
                    );
                  }
                  return <span key={idx}>{word}{idx < words.length - 1 ? ' ' : ''}</span>;
                });
              })()}
            </h1>
          </div>

          <p className="text-neutral-400 font-mono text-sm mt-3 max-w-md leading-relaxed">
            {getTranslation(language, 'gameDesc')}
          </p>

          <div className="flex items-center gap-4 mt-6 justify-center md:justify-start">
            <div className="text-xs font-semibold px-3 py-1 bg-neutral-900 border border-neutral-800 text-neutral-400 rounded-full">
              {getFormattedTranslation(language, 'bestShift', { night: gameSave.unlockedNight })}
            </div>
            <div className="text-xs font-semibold px-3 py-1 bg-amber-950/40 border border-amber-900/60 text-amber-400 rounded-full">
              {getFormattedTranslation(language, 'balanceLabel', { coins: gameSave.coins })}
            </div>
          </div>
        </div>

        {/* Right Side: Portrait of Milka (Flickers between normal calico and glowing creepy silhouette) */}
        <div id="milka-portrait-frame" className="relative w-56 h-56 md:w-64 md:h-64 rounded-2xl border-2 border-neutral-800 overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)] bg-neutral-900 flex items-center justify-center">
          {/* Normal cat picture */}
          <img 
            id="portrait-img-normal"
            src={milkaNormalImage}
            alt="Milka Cat" 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover select-none pointer-events-none"
            style={{
              filter: glitchTitle ? 'grayscale(100%) invert(100%)' : 'brightness(0.85) contrast(1.15)',
              opacity: glitchTitle ? 0.15 : 0.95
            }}
          />

          {/* Glowing Eyes overlay when title glitches */}
          {glitchTitle && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/90">
              <div className="flex gap-14">
                <div className="w-5 h-5 rounded-full bg-lime-400 shadow-[0_0_20px_#84cc16]" />
                <div className="w-5 h-5 rounded-full bg-lime-400 shadow-[0_0_20px_#84cc16]" />
              </div>
            </div>
          )}

          {/* VHS Rec sticker */}
          <div className="absolute top-3 left-3 bg-red-600 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase animate-pulse tracking-wide text-white flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span>REC</span>
          </div>
        </div>

      </div>

      {/* 3. CORE ACTION BUTTONS */}
      <div id="menu-actions" className="w-full max-w-sm flex flex-col gap-3.5 my-8 z-10">
        
        {/* Continue game */}
        <button
          id="btn-menu-continue"
          onClick={startContinueGame}
          className="w-full py-3 px-4 bg-red-700/85 hover:bg-red-600 border border-red-600 text-white rounded-lg font-bold text-sm flex items-center justify-between shadow-[0_4px_15px_rgba(220,38,38,0.2)] hover:scale-[1.01] transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Play className="w-4.5 h-4.5" />
            <span>{getTranslation(language, 'btnContinue')}</span>
          </div>
          <span className="text-xs font-mono bg-black/30 px-2 py-0.5 rounded text-neutral-300">
            {getFormattedTranslation(language, 'nightLabel', { night: Math.min(gameSave.unlockedTwelveNights ? 12 : 5, gameSave.unlockedNight) })}
          </span>
        </button>

        {/* Start new game */}
        <button
          id="btn-menu-newgame"
          onClick={startNewGame}
          className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 rounded-lg font-semibold text-sm flex items-center gap-2.5 hover:text-white hover:scale-[1.01] transition-all cursor-pointer"
        >
          <RotateCcw className="w-4.5 h-4.5 text-neutral-500" />
          <span>{getTranslation(language, 'btnNewGame')}</span>
        </button>

        {/* Open upgrade shop */}
        <button
          id="btn-menu-shop"
          onClick={() => { sound.playClick(); onOpenShop(); }}
          className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 rounded-lg font-semibold text-sm flex items-center gap-2.5 hover:text-white hover:scale-[1.01] transition-all cursor-pointer"
        >
          <ShoppingCart className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
          <span>{getTranslation(language, 'btnUpgradeShop')}</span>
        </button>

        {/* Toggle Information / Characters list */}
        <button
          id="btn-menu-info"
          onClick={() => { sound.playClick(); setShowInfo(!showInfo); setShowSettings(false); setShowCustomNight(false); setShowAchievements(false); }}
          className={`w-full py-3 px-4 border rounded-lg font-semibold text-sm flex items-center gap-2.5 hover:scale-[1.01] transition-all cursor-pointer ${
            showInfo 
              ? 'bg-rose-950 border-rose-800 text-rose-300' 
              : 'bg-neutral-900 border-neutral-800 text-neutral-200 hover:bg-neutral-800 hover:text-white'
          }`}
        >
          <BookOpen className="w-4.5 h-4.5 text-rose-400" />
          <span>{getTranslation(language, 'btnInfoCharacters')}</span>
        </button>

        {/* Toggle options tray */}
        <button
          id="btn-menu-settings"
          onClick={() => { sound.playClick(); setShowSettings(!showSettings); setShowInfo(false); setShowCustomNight(false); setShowAchievements(false); }}
          className={`w-full py-3 px-4 border rounded-lg font-semibold text-sm flex items-center gap-2.5 hover:scale-[1.01] transition-all cursor-pointer ${
            showSettings 
              ? 'bg-sky-950 border-sky-800 text-sky-300' 
              : 'bg-neutral-900 border-neutral-800 text-neutral-200 hover:bg-neutral-800 hover:text-white'
          }`}
        >
          <Settings className={`w-4.5 h-4.5 ${showSettings ? 'rotate-45' : ''} transition-all`} />
          <span>{getTranslation(language, 'btnSettings')}</span>
        </button>

        {/* Achievements list button */}
        <button
          id="btn-menu-achievements"
          onClick={() => { 
            sound.playClick(); 
            setShowAchievements(!showAchievements); 
            setShowInfo(false); 
            setShowSettings(false); 
            setShowCustomNight(false); 
          }}
          className={`w-full py-3 px-4 border rounded-lg font-semibold text-sm flex items-center gap-2.5 hover:scale-[1.01] transition-all cursor-pointer ${
            showAchievements 
              ? 'bg-amber-950 border-amber-800 text-amber-300' 
              : 'bg-neutral-900 border-neutral-800 text-neutral-200 hover:bg-neutral-800 hover:text-white'
          }`}
        >
          <Award className="w-4.5 h-4.5 text-amber-500" />
          <span>{getTranslation(language, 'btnAchievements')}</span>
        </button>

        {/* Custom Night */}
        {(gameSave.unlockedNight >= 6 || gameSave.unlockedTwelveNights) && (
          <button
            id="btn-menu-customnight"
            onClick={() => {
              sound.playClick();
              setShowCustomNight(!showCustomNight);
              setShowSettings(false);
              setShowInfo(false);
              setShowAchievements(false);
            }}
            className={`w-full py-3 px-4 border rounded-lg font-bold text-sm flex items-center gap-2.5 hover:scale-[1.01] transition-all cursor-pointer ${
              showCustomNight
                ? 'bg-amber-950 border-amber-600 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'bg-gradient-to-r from-amber-950/50 to-neutral-900/90 border-amber-900/60 text-amber-400 hover:scale-[1.01]'
            }`}
          >
            <Sliders className="w-4.5 h-4.5 text-amber-400 animate-pulse" />
            <span>{getTranslation(language, 'customNightTitle')}</span>
          </button>
        )}

      </div>

      {/* 4. SETTINGS DRAWER OVERLAY */}
      {showSettings && (
        <div id="settings-drawer" className="w-full max-w-md bg-neutral-900/90 border border-neutral-800 p-5 rounded-xl flex flex-col gap-4 z-20 shadow-2xl backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <h3 className="text-sm font-bold tracking-wider text-neutral-400 uppercase border-b border-neutral-800 pb-2">{getTranslation(language, 'settingsPanelTitle')}</h3>
          
          {/* Sound FX volume */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-300 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-neutral-400" />
                {getTranslation(language, 'sfxVolumeLabel')}
              </span>
              <span className="text-neutral-400 font-mono">{Math.round(soundConfig.sfxVolume * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05"
              value={soundConfig.sfxVolume}
              onChange={(e) => handleVolumeChange('sfx', parseFloat(e.target.value))}
              className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
          </div>

          {/* Music/Drone volume */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-300 flex items-center gap-1.5">
                <VolumeX className="w-4 h-4 text-neutral-400" />
                {getTranslation(language, 'musicVolumeLabel')}
              </span>
              <span className="text-neutral-400 font-mono">{Math.round(soundConfig.musicVolume * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05"
              value={soundConfig.musicVolume}
              onChange={(e) => handleVolumeChange('music', parseFloat(e.target.value))}
              className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
          </div>

          {/* Jumpscares Mode Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60">
            <div className="flex flex-col">
              <span className="text-xs text-neutral-200 font-semibold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-yellow-500" />
                {getTranslation(language, 'jumpscaresLabel')}
              </span>
              <span className="text-[10px] text-neutral-500">{getTranslation(language, 'jumpscaresDesc')}</span>
            </div>
            <button
              onClick={handleToggleJumpscare}
              className={`w-14 h-7 rounded-full transition-all duration-300 p-0.5 cursor-pointer relative ${
                soundConfig.jumpscaresEnabled ? 'bg-red-600' : 'bg-neutral-800'
              }`}
            >
              <div 
                className={`w-6 h-6 rounded-full bg-white shadow transition-all duration-300 transform flex items-center justify-center ${
                  soundConfig.jumpscaresEnabled ? 'translate-x-7' : 'translate-x-0'
                }`}
              >
                <span className="text-[10px]">{soundConfig.jumpscaresEnabled ? '🔴' : '⚪'}</span>
              </div>
            </button>
          </div>

          {/* Owner Phone Calls Mode Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60">
            <div className="flex flex-col max-w-[70%]">
              <span className="text-xs text-neutral-200 font-semibold flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-500 animate-pulse" />
                {getTranslation(language, 'phoneCallsLabel')}
              </span>
              <span className="text-[10px] text-neutral-400">{getTranslation(language, 'phoneCallsDesc')}</span>
            </div>
            <button
              onClick={handleTogglePhoneCalls}
              className={`w-14 h-7 rounded-full transition-all duration-300 p-0.5 cursor-pointer relative ${
                soundConfig.phoneCallsEnabled ? 'bg-emerald-600' : 'bg-neutral-800'
              }`}
            >
              <div 
                className={`w-6 h-6 rounded-full bg-white shadow transition-all duration-300 transform flex items-center justify-center ${
                  soundConfig.phoneCallsEnabled ? 'translate-x-7' : 'translate-x-0'
                }`}
              >
                <span className="text-[10px]">{soundConfig.phoneCallsEnabled ? '📞' : '🔇'}</span>
              </div>
            </button>
          </div>

          {/* Language Selector */}
          <div className="flex flex-col gap-2 pt-2 border-t border-neutral-800/60">
            <span className="text-xs text-neutral-300 flex items-center gap-1.5 font-semibold">
              <Globe className="w-4 h-4 text-neutral-400" />
              {getTranslation(language, 'languageSelectLabel')}
            </span>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {(['en', 'uk', 'ru'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    sound.playClick();
                    onUpdateLanguage(lang);
                  }}
                  className={`py-1.5 rounded-lg font-mono text-[11px] font-bold border transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                    language === lang
                      ? 'bg-red-600 border-red-500 text-white shadow-[0_0_12px_rgba(220,38,38,0.4)]'
                      : 'bg-neutral-850 border-neutral-700/50 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                  }`}
                >
                  <span>
                    {lang === 'en' ? '🇬🇧' : lang === 'uk' ? '🇺🇦' : '🇷🇺'}
                  </span>
                  <span>
                    {lang.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Wipe Local Saves */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60">
            <span className="text-xs text-neutral-400 font-medium">{getTranslation(language, 'resetSaveLabel')}</span>
            <button
              id="btn-reset-save"
              onClick={handleResetSaveClick}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                showResetConfirm 
                  ? 'bg-red-600 text-white animate-pulse' 
                  : 'bg-neutral-850 hover:bg-neutral-800 text-red-400 hover:text-red-300'
              }`}
            >
              {showResetConfirm ? getTranslation(language, 'btnResetConfirm') : getTranslation(language, 'btnResetWipe')}
            </button>
          </div>
        </div>
      )}

      {/* 4.2 ACHIEVEMENTS DRAWER OVERLAY */}
      {showAchievements && (
        <div id="achievements-drawer" className="w-full max-w-md bg-neutral-900/90 border border-neutral-800 p-5 rounded-xl flex flex-col gap-4 z-20 shadow-2xl backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
            <h3 className="text-sm font-bold tracking-wider text-amber-400 uppercase flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              {getTranslation(language, 'achievementsTitle')}
            </h3>
            <button 
              onClick={() => { sound.playClick(); setShowAchievements(false); }}
              className="text-neutral-500 hover:text-neutral-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-neutral-400 -mt-2 leading-relaxed">{getTranslation(language, 'achievementsSub')}</p>

          {/* Completion Progress Bar */}
          {(() => {
            const unlockedList = gameSave.unlockedAchievements || [];
            const totalCount = 6;
            const unlockedCount = Math.min(totalCount, unlockedList.length);
            const percent = Math.round((unlockedCount / totalCount) * 100);
            return (
              <div className="bg-neutral-950/40 p-3 rounded-lg border border-neutral-800 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-neutral-400">{getFormattedTranslation(language, 'unlockedPercent', { percent })}</span>
                  <span className="text-amber-400 font-bold">{unlockedCount} / {totalCount}</span>
                </div>
                <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-amber-600 to-yellow-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })()}

          {/* Achievements Scrollable Area */}
          <div className="flex flex-col gap-3.5 max-h-[320px] overflow-y-auto pr-1">
            {[
              { id: 'first_night', icon: '🌟', titleKey: 'ach_first_night_title', descKey: 'ach_first_night_desc' },
              { id: 'no_flashlight', icon: '👁️', titleKey: 'ach_no_flashlight_title', descKey: 'ach_no_flashlight_desc' },
              { id: 'frugal', icon: '🔋', titleKey: 'ach_frugal_title', descKey: 'ach_frugal_desc' },
              { id: 'treat_master', icon: '🥩', titleKey: 'ach_treat_master_title', descKey: 'ach_treat_master_desc' },
              { id: 'no_doors', icon: '🚪', titleKey: 'ach_no_doors_title', descKey: 'ach_no_doors_desc' },
              { id: 'toy_found', icon: '🧶', titleKey: 'ach_toy_found_title', descKey: 'ach_toy_found_desc' },
            ].map((ach) => {
              const isUnlocked = (gameSave.unlockedAchievements || []).includes(ach.id);
              return (
                <div 
                  key={ach.id}
                  className={`p-3 rounded-lg border transition-all flex gap-3 ${
                    isUnlocked 
                      ? 'bg-amber-950/20 border-amber-800/60 shadow-[inset_0_0_10px_rgba(245,158,11,0.05)]' 
                      : 'bg-neutral-950/20 border-neutral-850/60 opacity-60'
                  }`}
                >
                  <div className={`text-2xl p-2 rounded-lg flex items-center justify-center select-none ${
                    isUnlocked ? 'bg-amber-950/40' : 'bg-neutral-900/40'
                  }`}>
                    {ach.icon}
                  </div>
                  <div className="flex flex-col gap-0.5 justify-center flex-1">
                    <div className="flex items-center justify-between gap-1.5 font-sans">
                      <span className={`text-xs font-bold leading-none ${isUnlocked ? 'text-neutral-100' : 'text-neutral-400 line-through'}`}>
                        {getTranslation(language, ach.titleKey as any)}
                      </span>
                      {isUnlocked ? (
                        <span className="text-[10px] text-amber-400 font-extrabold uppercase bg-amber-950/60 px-1.5 py-0.5 rounded tracking-wider border border-amber-900/40 leading-none">
                          ✓ ACTIVE
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-500 font-extrabold uppercase bg-neutral-900/60 px-1.5 py-0.5 rounded tracking-wider border border-neutral-850/40 leading-none">
                          🔒 LOCKED
                        </span>
                      )}
                    </div>
                    <p className={`text-[10px] leading-normal font-sans ${isUnlocked ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      {getTranslation(language, ach.descKey as any)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4.1 CUSTOM NIGHT OVERLAY */}
      {showCustomNight && (
        <div id="custom-night-panel" className="w-full max-w-xl bg-neutral-950/95 border border-amber-900/60 p-5 rounded-2xl flex flex-col gap-5 z-20 shadow-[0_0_40px_rgba(245,158,11,0.15)] backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-500 animate-pulse" />
              <div>
                <h3 className="text-md font-extrabold tracking-wider text-amber-400 uppercase">{getTranslation(language, 'customNightTitle')}</h3>
                <p className="text-[10px] text-neutral-400 font-mono uppercase">{getTranslation(language, 'customNightSub')}</p>
              </div>
            </div>
            <button 
              id="btn-close-custom-night"
              onClick={() => { sound.playClick(); setShowCustomNight(false); }}
              className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Aggression Levels Adjustment (Sliders) */}
          <div className="flex flex-col gap-4">
            {/* Milka Slider */}
            <div className="bg-neutral-900/60 border border-neutral-900 p-3 rounded-xl flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🐱</span>
                  <span className="text-xs font-bold text-neutral-200">{getTranslation(language, 'milkaAiLabel')}</span>
                </div>
                <span className="font-mono text-sm font-extrabold text-green-400 bg-green-950/40 px-2.5 py-0.5 rounded border border-green-900/50">{customMilkaLevel}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="20" 
                step="1"
                value={customMilkaLevel}
                onChange={(e) => {
                  sound.playClick();
                  setCustomMilkaLevel(parseInt(e.target.value));
                }}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
              <div className="flex justify-between text-[9px] text-neutral-500 font-mono font-bold">
                <span>EASY (0)</span>
                <span>NORMAL (10)</span>
                <span>NIGHTMARE (20)</span>
              </div>
            </div>

            {/* Shelly Slider */}
            <div className="bg-neutral-900/60 border border-neutral-900 p-3 rounded-xl flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🐈</span>
                  <span className="text-xs font-bold text-neutral-200">{getTranslation(language, 'shellyAiLabel')}</span>
                </div>
                <span className="font-mono text-sm font-extrabold text-amber-400 bg-amber-950/40 px-2.5 py-0.5 rounded border border-amber-900/50">{customShellyLevel}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="20" 
                step="1"
                value={customShellyLevel}
                onChange={(e) => {
                  sound.playClick();
                  setCustomShellyLevel(parseInt(e.target.value));
                }}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[9px] text-neutral-500 font-mono font-bold">
                <span>PASSED OUT (0)</span>
                <span>ACTIVE (10)</span>
                <span>HYPERACTIVE (20)</span>
              </div>
            </div>

            {/* Garik Slider */}
            <div className="bg-neutral-900/60 border border-neutral-900 p-3 rounded-xl flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🐕</span>
                  <span className="text-xs font-bold text-neutral-200">{getTranslation(language, 'garikAiLabel')}</span>
                </div>
                <span className="font-mono text-sm font-extrabold text-sky-400 bg-sky-950/40 px-2.5 py-0.5 rounded border border-sky-900/50">{customGarikLevel}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="20" 
                step="1"
                value={customGarikLevel}
                onChange={(e) => {
                  sound.playClick();
                  setCustomGarikLevel(parseInt(e.target.value));
                }}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <div className="flex justify-between text-[9px] text-neutral-500 font-mono font-bold">
                <span>STAY STREET (0)</span>
                <span>HUNGRY (10)</span>
                <span>RAVENOUS (20)</span>
              </div>
            </div>

            {/* Entity 4 Slider */}
            <div className="bg-neutral-900/60 border border-neutral-900 p-3 rounded-xl flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💀</span>
                  <span className="text-xs font-bold text-neutral-200">{getTranslation(language, 'entity_4AiLabel')}</span>
                </div>
                <span className="font-mono text-sm font-extrabold text-red-500 bg-red-950/40 px-2.5 py-0.5 rounded border border-red-900/50">{customEntity_4Level}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="20" 
                step="1"
                value={customEntity_4Level}
                onChange={(e) => {
                  sound.playClick();
                  setCustomEntity_4Level(parseInt(e.target.value));
                }}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
              <div className="flex justify-between text-[9px] text-neutral-500 font-mono font-bold">
                <span>DORMANT (0)</span>
                <span>GLITCHY (10)</span>
                <span>JUDGMENT (20)</span>
              </div>
            </div>
          </div>

          {/* Goodies & Modifiers Selector */}
          <div className="flex flex-col gap-3 border-t border-neutral-900 pt-3">
            <h4 className="text-xs font-extrabold tracking-widest text-amber-500/90 flex items-center gap-1.5 uppercase font-mono mb-1">
              <Sparkles className="w-4 h-4" />
              {getTranslation(language, 'perksTitle')}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {/* Perk 1: Free Desk Lamp */}
              <button
                type="button"
                onClick={() => { sound.playClick(); setPerkFreeLamp(!perkFreeLamp); }}
                className={`p-2.5 rounded-xl border text-left transition duration-200 flex flex-col gap-1 cursor-pointer ${
                  perkFreeLamp 
                    ? 'bg-amber-950/30 border-amber-500/80 text-amber-200 shadow-[0_2px_10px_rgba(245,158,11,0.1)]' 
                    : 'bg-neutral-900/40 border-neutral-800/80 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <span className="text-xs font-bold uppercase flex items-center gap-1.5">
                  💡 {getTranslation(language, 'freeLampLabel')}
                </span>
                <span className="text-[9px] text-neutral-500 leading-normal">{getTranslation(language, 'freeLampDesc')}</span>
              </button>

              {/* Perk 2: Infinite Flashlight */}
              <button
                type="button"
                onClick={() => { sound.playClick(); setPerkInfiniteFlashlight(!perkInfiniteFlashlight); }}
                className={`p-2.5 rounded-xl border text-left transition duration-200 flex flex-col gap-1 cursor-pointer ${
                  perkInfiniteFlashlight 
                    ? 'bg-amber-950/30 border-amber-500/80 text-amber-200 shadow-[0_2px_10px_rgba(245,158,11,0.1)]' 
                    : 'bg-neutral-900/40 border-neutral-800/80 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <span className="text-xs font-bold uppercase flex items-center gap-1.5">
                  🔦 {getTranslation(language, 'infiniteFlashlightLabel')}
                </span>
                <span className="text-[9px] text-neutral-500 leading-normal">{getTranslation(language, 'infiniteFlashlightDesc')}</span>
              </button>

              {/* Perk 3: Double Power */}
              <button
                type="button"
                onClick={() => { sound.playClick(); setPerkDoublePower(!perkDoublePower); }}
                className={`p-2.5 rounded-xl border text-left transition duration-200 flex flex-col gap-1 cursor-pointer ${
                  perkDoublePower 
                    ? 'bg-amber-950/30 border-amber-500/80 text-amber-200 shadow-[0_2px_10px_rgba(245,158,11,0.1)]' 
                    : 'bg-neutral-900/40 border-neutral-800/80 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <span className="text-xs font-bold uppercase flex items-center gap-1.5">
                  ⚡ {getTranslation(language, 'doublePowerLabel')}
                </span>
                <span className="text-[9px] text-neutral-500 leading-normal">{getTranslation(language, 'doublePowerDesc')}</span>
              </button>

              {/* Perk 4: More Treats */}
              <button
                type="button"
                onClick={() => { sound.playClick(); setPerkMoreTreats(!perkMoreTreats); }}
                className={`p-2.5 rounded-xl border text-left transition duration-200 flex flex-col gap-1 cursor-pointer ${
                  perkMoreTreats 
                    ? 'bg-amber-950/30 border-amber-500/80 text-amber-200 shadow-[0_2px_10px_rgba(245,158,11,0.1)]' 
                    : 'bg-neutral-900/40 border-neutral-800/80 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <span className="text-xs font-bold uppercase flex items-center gap-1.5">
                  🍣 {getTranslation(language, 'moreTreatsLabel')}
                </span>
                <span className="text-[9px] text-neutral-500 leading-normal">{getTranslation(language, 'moreTreatsDesc')}</span>
              </button>

              {/* Perk 5: Radar Active */}
              <button
                type="button"
                onClick={() => { sound.playClick(); setPerkRadarActive(!perkRadarActive); }}
                className={`p-2.5 rounded-xl border text-left transition duration-200 flex flex-col gap-1 cursor-pointer ${
                  perkRadarActive 
                    ? 'bg-amber-950/30 border-amber-500/80 text-amber-200 shadow-[0_2px_10px_rgba(245,158,11,0.1)]' 
                    : 'bg-neutral-900/40 border-neutral-800/80 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <span className="text-xs font-bold uppercase flex items-center gap-1.5">
                  📡 {getTranslation(language, 'radarActiveLabel')}
                </span>
                <span className="text-[9px] text-neutral-500 leading-normal">{getTranslation(language, 'radarActiveDesc')}</span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onStartCustomNight({
                active: true,
                milkaLevel: customMilkaLevel,
                shellyLevel: customShellyLevel,
                garikLevel: customGarikLevel,
                entity_4Level: customEntity_4Level,
                freeLamp: perkFreeLamp,
                infiniteFlashlight: perkInfiniteFlashlight,
                doublePower: perkDoublePower,
                moreTreats: perkMoreTreats,
                radarActive: perkRadarActive
              });
            }}
            className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-neutral-950 font-extrabold text-sm rounded-xl transition duration-200 cursor-pointer shadow-[0_4px_20px_rgba(245,158,11,0.3)] hover:scale-[1.01] uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-neutral-950" />
            <span>{getTranslation(language, 'btnStartCustomNight')}</span>
          </button>
        </div>
      )}

      {/* 4.5 DETAILED CHARACTER INFORMATION OVERLAY */}
      {showInfo && (
        <div 
          id="character-info-panel" 
          className="w-full max-w-2xl bg-neutral-900/95 border border-rose-900/40 p-6 rounded-2xl flex flex-col gap-5 z-20 shadow-[0_0_35px_rgba(244,63,94,0.15)] backdrop-blur-md animate-[fadeIn_0.25s_ease-out]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-rose-500 animate-pulse" />
              <div>
                <h3 className="text-md font-bold tracking-wider text-rose-400 uppercase">{getTranslation(language, 'databaseTitle')}</h3>
                <p className="text-[10px] text-neutral-400 font-mono">{getTranslation(language, 'databaseSub')}</p>
              </div>
            </div>
            <button 
              id="btn-close-info"
              onClick={() => { sound.playClick(); setShowInfo(false); }}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Character Selector Tabs */}
          <div className="flex grid grid-cols-4 gap-1.5">
            {[
              { id: 'milka', label: `🐱 ${getTranslation(language, 'milkaTitle')}`, color: 'border-green-600/40 text-green-400 hover:bg-green-950/20', activeColor: 'bg-green-950/40 border-green-500 text-green-300' },
              { id: 'garik', label: `🐕 ${getTranslation(language, 'garikTitle')}`, color: 'border-sky-600/40 text-sky-400 hover:bg-sky-950/20', activeColor: 'bg-sky-950/40 border-sky-500 text-sky-300' },
              { id: 'shelly', label: `🐈 ${getTranslation(language, 'shellyTitle')}`, color: 'border-amber-600/40 text-amber-400 hover:bg-amber-950/20', activeColor: 'bg-amber-950/40 border-amber-500 text-amber-300' },
              { id: 'entity_4', label: `💀 ${getTranslation(language, 'entity_4Title')}`, color: 'border-red-600/40 text-red-500 hover:bg-red-950/20', activeColor: 'bg-red-950/40 border-red-500 text-red-400' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { sound.playClick(); setSelectedCharacter(tab.id as any); }}
                className={`py-2 px-1 rounded-lg text-[10px] font-bold border tracking-tight transition-all cursor-pointer ${
                  selectedCharacter === tab.id ? tab.activeColor : `bg-neutral-900 ${tab.color}`
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Interactive Profile Area */}
          <div className="bg-neutral-950/70 border border-neutral-800/80 rounded-xl p-4 md:p-5 flex flex-col md:flex-row gap-5 items-center md:items-stretch">
            
            {/* Visual Avatar Container */}
            <div className="w-36 h-36 flex-shrink-0 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex items-center justify-center relative shadow-inner">
              {selectedCharacter === 'milka' && (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <img 
                    src={milkaNormalImage} 
                    alt="Milka" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                  <span className="absolute bottom-1 text-[10px] text-green-400 font-mono uppercase tracking-widest font-bold bg-black/60 px-1.5 py-0.5 rounded">MILKA_A_01</span>
                  <div className="absolute top-2 left-2 flex gap-1 items-center bg-black/60 px-1.5 py-0.5 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[8px] text-red-500 font-mono font-bold">{getTranslation(language, 'charActive')}</span>
                  </div>
                </div>
              )}

              {selectedCharacter === 'garik' && (
                <div className="flex flex-col items-center">
                  {/* Garik Icon / Vector */}
                  <div className="w-16 h-16 rounded-full bg-neutral-800 border-2 border-sky-500 flex items-center justify-center relative overflow-hidden shadow-[0_0_15px_rgba(14,165,233,0.2)]">
                    {/* Dog floppy ears */}
                    <div className="absolute top-1 left-0 w-3 h-8 bg-neutral-600 rounded-full" />
                    <div className="absolute top-1 right-0 w-3 h-8 bg-neutral-600 rounded-full" />
                    {/* Head */}
                    <div className="absolute inset-2 bg-neutral-700 rounded-full border border-neutral-600" />
                    {/* Glowing blue eyes */}
                    <div className="absolute top-6 left-5 w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_5px_#0ea5e9]" />
                    <div className="absolute top-6 right-5 w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_5px_#0ea5e9]" />
                    {/* Nose/Muzzle */}
                    <div className="absolute bottom-2 left-6 w-4 h-3 bg-neutral-900 rounded-full" />
                  </div>
                  <span className="text-[10px] text-sky-400 font-mono mt-3 uppercase tracking-widest font-bold">GARIK_D_02</span>
                  <div className="absolute top-2 left-2 flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[8px] text-amber-500 font-mono font-bold">{getTranslation(language, 'charProwling')}</span>
                  </div>
                </div>
              )}

              {selectedCharacter === 'shelly' && (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <img 
                    src={shellyNormalImage} 
                    alt="Shelly" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                  <span className="absolute bottom-1 text-[10px] text-amber-400 font-mono uppercase tracking-widest font-bold bg-black/60 px-1.5 py-0.5 rounded">SHELLY_K_03</span>
                  <div className="absolute top-2 left-2 flex gap-1 items-center bg-black/60 px-1.5 py-0.5 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[8px] text-green-500 font-mono font-bold">{getTranslation(language, 'charSleeping')}</span>
                  </div>
                </div>
              )}

              {selectedCharacter === 'entity_4' && (
                <div className="flex flex-col items-center">
                  {/* Entity 4 Icon / Vector */}
                  <div className="w-16 h-16 rounded-full bg-black border-2 border-red-600 flex items-center justify-center relative overflow-hidden shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse">
                    {/* Shadow glitchy ears */}
                    <div className="absolute top-0 left-2 w-4 h-4 bg-neutral-950 rotate-45 -translate-y-1 rounded-sm" />
                    <div className="absolute top-0 right-2 w-4 h-4 bg-neutral-950 -rotate-45 -translate-y-1 rounded-sm" />
                    {/* Base head silhouette */}
                    <div className="absolute inset-2 bg-neutral-950 rounded-full border border-red-900" />
                    {/* Glowing blood-red eyes */}
                    <div className="absolute top-6 left-4 w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_#ef4444] animate-ping" />
                    <div className="absolute top-6 left-4 w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_#ef4444]" />
                    <div className="absolute top-6 right-4 w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_#ef4444] animate-ping" />
                    <div className="absolute top-6 right-4 w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_#ef4444]" />
                    {/* Glitch lines inside head */}
                    <div className="absolute top-9 left-[15px] w-8 h-0.5 bg-red-500/40 animate-bounce" />
                  </div>
                  <span className="text-[10px] text-red-500 font-mono mt-3 uppercase tracking-widest font-bold">ENTITY_4</span>
                  <div className="absolute top-2 left-2 flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                    <span className="text-[8px] text-red-500 font-mono font-bold">???</span>
                  </div>
                </div>
              )}
            </div>

            {/* Information Texts */}
            <div className="flex-1 flex flex-col justify-between text-left">
              {selectedCharacter === 'milka' && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-lg font-bold text-green-400">{getTranslation(language, 'milkaTitle')}</h4>
                    <span className="text-[9px] font-mono px-2 py-0.5 bg-green-950/50 border border-green-800/40 text-green-300 rounded">{getTranslation(language, 'milkaRole')}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-y border-neutral-900 py-2 my-1 text-[11px] font-mono text-neutral-400">
                    <div>{getTranslation(language, 'milkaDiff')}</div>
                    <div>{getTranslation(language, 'milkaLoc')}</div>
                  </div>

                  <p className="text-[12px] text-neutral-300 leading-relaxed">
                    {getTranslation(language, 'milkaDesc')}
                  </p>

                  <div className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800/60 mt-1">
                    <h5 className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-1">{getTranslation(language, 'milkaTacticsHeader')}</h5>
                    <ul className="text-[11px] text-neutral-400 space-y-1 list-disc pl-3">
                      {(TRANSLATIONS[language]?.milkaTactics || TRANSLATIONS['en'].milkaTactics).map((t: string, idx: number) => (
                        <li key={idx} dangerouslySetInnerHTML={{ __html: t }} />
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {selectedCharacter === 'garik' && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-lg font-bold text-sky-400">{getTranslation(language, 'garikTitle')}</h4>
                    <span className="text-[9px] font-mono px-2 py-0.5 bg-sky-950/50 border border-sky-800/40 text-sky-300 rounded">{getTranslation(language, 'garikRole')}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-y border-neutral-900 py-2 my-1 text-[11px] font-mono text-neutral-400">
                    <div>{getTranslation(language, 'garikDiff')}</div>
                    <div>{getTranslation(language, 'garikLoc')}</div>
                  </div>

                  <p className="text-[12px] text-neutral-300 leading-relaxed">
                    {getTranslation(language, 'garikDesc')}
                  </p>

                  <div className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800/60 mt-1">
                    <h5 className="text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-1">{getTranslation(language, 'garikTacticsHeader')}</h5>
                    <ul className="text-[11px] text-neutral-400 space-y-1 list-disc pl-3">
                      {(TRANSLATIONS[language]?.garikTactics || TRANSLATIONS['en'].garikTactics).map((t: string, idx: number) => (
                        <li key={idx} dangerouslySetInnerHTML={{ __html: t }} />
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {selectedCharacter === 'shelly' && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-lg font-bold text-amber-400">{getTranslation(language, 'shellyTitle')}</h4>
                    <span className="text-[9px] font-mono px-2 py-0.5 bg-amber-950/50 border border-amber-800/40 text-amber-300 rounded">{getTranslation(language, 'shellyRole')}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-y border-neutral-900 py-2 my-1 text-[11px] font-mono text-neutral-400">
                    <div>{getTranslation(language, 'shellyDiff')}</div>
                    <div>{getTranslation(language, 'shellyLoc')}</div>
                  </div>

                  <p className="text-[12px] text-neutral-300 leading-relaxed">
                    {getTranslation(language, 'shellyDesc')}
                  </p>

                  <div className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800/60 mt-1">
                    <h5 className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">{getTranslation(language, 'shellyTacticsHeader')}</h5>
                    <ul className="text-[11px] text-neutral-400 space-y-1 list-disc pl-3">
                      {(TRANSLATIONS[language]?.shellyTactics || TRANSLATIONS['en'].shellyTactics).map((t: string, idx: number) => (
                        <li key={idx} dangerouslySetInnerHTML={{ __html: t }} />
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {selectedCharacter === 'entity_4' && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-lg font-bold text-red-500">{getTranslation(language, 'entity_4Title')}</h4>
                    <span className="text-[9px] font-mono px-2 py-0.5 bg-red-950/50 border border-red-800/40 text-red-400 rounded">{getTranslation(language, 'entity_4Role')}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-y border-neutral-900 py-2 my-1 text-[11px] font-mono text-neutral-400">
                    <div>{getTranslation(language, 'entity_4Diff')}</div>
                    <div>{getTranslation(language, 'entity_4Loc')}</div>
                  </div>

                  <p className="text-[12px] text-red-400/95 font-mono italic font-bold leading-relaxed">
                    "{getTranslation(language, 'entity_4Desc')}"
                  </p>

                  <div className="bg-red-950/30 p-2.5 rounded-lg border border-red-900/40 mt-1">
                    <h5 className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1">{getTranslation(language, 'entity_4TacticsHeader')}</h5>
                    <ul className="text-[11px] text-neutral-400 space-y-1 list-disc pl-3">
                      {(TRANSLATIONS[language]?.entity_4Tactics || TRANSLATIONS['en'].entity_4Tactics).map((t: string, idx: number) => (
                        <li key={idx} className="text-red-300" dangerouslySetInnerHTML={{ __html: t }} />
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Footer inside Info */}
          <div className="text-[10px] text-neutral-500 font-mono text-center border-t border-neutral-850 pt-2">
            {getTranslation(language, 'footerInfoNote')}
          </div>

        </div>
      )}

      {/* 5. FOOTER */}
      <div id="menu-footer" className="w-full max-w-4xl border-t border-neutral-900 pt-4 flex flex-col md:flex-row items-center justify-between text-[10px] text-neutral-600 font-mono z-10 gap-2">
        <div className="flex items-center gap-1 text-center md:text-left">
          <span>{getTranslation(language, 'credits')}</span>
          <Heart className="w-3 h-3 text-red-500 inline fill-red-500" />
        </div>
        <span>{getTranslation(language, 'rightsReserved')}</span>
      </div>
    </div>
  );
}
