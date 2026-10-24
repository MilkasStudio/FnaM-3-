/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Upgrades } from '../types';
import { sound } from './SoundManager';
import { ShoppingBag, Battery, Shield, Radio, FlameKindling, ChevronLeft, Sparkles, BatteryCharging, Lightbulb, Zap } from 'lucide-react';

interface ShopProps {
  coins: number;
  upgrades: Upgrades;
  onPurchase: (updatedUpgrades: Upgrades, updatedCoins: number) => void;
  onBack: () => void;
}

export default function Shop({ coins, upgrades, onPurchase, onBack }: ShopProps) {
  
  const getUpgradeCost = (key: keyof Upgrades, currentLevel: number) => {
    if (key === 'treatsCount') {
      return 50; // Flat price per treat
    }
    if (key === 'pateCount') {
      return 65; // Flat price per pâté
    }
    if (key === 'lampBatteries') {
      return 400; // High price per lamp battery as requested ("вона доволі дорога")
    }
    return currentLevel * 100; // Level 1->2: 100, 2->3: 200, 3->4: 300, etc.
  };

  const buyUpgrade = (key: keyof Upgrades) => {
    sound.playClick();
    const currentLevel = upgrades[key] || 0;
    const cost = getUpgradeCost(key, currentLevel);

    if (coins < cost) {
      // Not enough money
      return;
    }

    if (key !== 'treatsCount' && key !== 'pateCount' && key !== 'lampBatteries' && currentLevel >= 5) {
      // Already max level
      return;
    }

    if (key === 'treatsCount' && currentLevel >= 5) {
      // Max 5 treats
      return;
    }

    if (key === 'pateCount' && currentLevel >= 5) {
      // Max 5 pâtés
      return;
    }

    if (key === 'lampBatteries' && currentLevel >= 5) {
      // Max 5 lamp batteries
      return;
    }

    const updatedUpgrades = {
      ...upgrades,
      [key]: currentLevel + 1
    };

    onPurchase(updatedUpgrades, coins - cost);
  };

  return (
    <div 
      id="shop-container"
      className="relative flex flex-col items-center justify-between min-h-screen w-full bg-neutral-950 text-white font-sans p-6 overflow-y-auto"
      style={{
        backgroundImage: 'radial-gradient(circle at center, #171717 0%, #0a0a0a 100%)'
      }}
    >
      {/* Background grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0.08)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Header */}
      <div id="shop-header" className="w-full max-w-4xl flex items-center justify-between border-b border-neutral-800 pb-4 mt-4 z-10">
        <button 
          id="btn-back-to-menu"
          onClick={() => { sound.playClick(); onBack(); }}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-white transition duration-200 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>До меню</span>
        </button>
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-amber-500 animate-pulse" />
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            МАГАЗИН ПОКРАЩЕНЬ
          </h1>
        </div>
        <div id="shop-coins" className="flex items-center gap-2 bg-amber-950/40 border border-amber-800 px-4 py-2 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.1)]">
          <span className="text-amber-400 font-mono font-bold text-lg">{coins}</span>
          <span className="text-amber-500 text-sm font-semibold">🪙 Мілка-Коіни</span>
        </div>
      </div>

      {/* Main Upgrades Grid */}
      <div id="upgrades-list" className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 my-8 z-10">
        
        {/* Flashlight Battery */}
        <div id="card-upgrade-battery" className="flex flex-col justify-between p-5 bg-neutral-900/80 border border-neutral-800 rounded-xl hover:border-amber-900/60 hover:shadow-[0_0_20px_rgba(245,158,11,0.05)] transition-all duration-300">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-950/40 border border-blue-900/60 rounded-lg">
                  <Battery className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-neutral-200">Батарея ліхтарика</h3>
                  <p className="text-xs text-blue-400 font-mono">Рівень {upgrades.batteryCap} / 5</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-neutral-400 mb-4 leading-relaxed">
              Збільшує максимальний заряд батареї ліхтарика на 25% за кожне покращення. Дозволяє довше підсвічувати темні кутки та лякати Мілку.
            </p>
            {/* Level indicators */}
            <div className="flex gap-1.5 mb-5">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <div 
                  key={lvl}
                  className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                    lvl <= upgrades.batteryCap 
                      ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' 
                      : 'bg-neutral-800'
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            id="btn-buy-battery"
            disabled={upgrades.batteryCap >= 5 || coins < getUpgradeCost('batteryCap', upgrades.batteryCap)}
            onClick={() => buyUpgrade('batteryCap')}
            className={`w-full py-3 px-4 rounded-lg flex items-center justify-between font-bold text-sm transition-all duration-200 cursor-pointer ${
              upgrades.batteryCap >= 5 
                ? 'bg-neutral-800 text-neutral-500 border border-neutral-700/30 cursor-not-allowed'
                : coins >= getUpgradeCost('batteryCap', upgrades.batteryCap)
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:scale-[1.01]'
                  : 'bg-neutral-800 text-neutral-400 border border-neutral-700/50 hover:bg-neutral-800/80'
            }`}
          >
            <span>{upgrades.batteryCap >= 5 ? 'МАКСИМАЛЬНИЙ РІВЕНЬ' : 'ПОКРАЩИТИ'}</span>
            {upgrades.batteryCap < 5 && (
              <span className="font-mono text-amber-400">{getUpgradeCost('batteryCap', upgrades.batteryCap)} 🪙</span>
            )}
          </button>
        </div>

        {/* Power-Saving Doors */}
        <div id="card-upgrade-doors" className="flex flex-col justify-between p-5 bg-neutral-900/80 border border-neutral-800 rounded-xl hover:border-amber-900/60 hover:shadow-[0_0_20px_rgba(245,158,11,0.05)] transition-all duration-300">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-950/40 border border-emerald-900/60 rounded-lg">
                  <Shield className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-neutral-200">Енергоефективність дверей</h3>
                  <p className="text-xs text-emerald-400 font-mono">Рівень {upgrades.doorEfficiency} / 5</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-neutral-400 mb-4 leading-relaxed">
              Модернізація електронних замків дверей. Кожен рівень зменшує споживання електроенергії закритими дверима на 15%.
            </p>
            {/* Level indicators */}
            <div className="flex gap-1.5 mb-5">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <div 
                  key={lvl}
                  className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                    lvl <= upgrades.doorEfficiency 
                      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                      : 'bg-neutral-800'
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            id="btn-buy-doors"
            disabled={upgrades.doorEfficiency >= 5 || coins < getUpgradeCost('doorEfficiency', upgrades.doorEfficiency)}
            onClick={() => buyUpgrade('doorEfficiency')}
            className={`w-full py-3 px-4 rounded-lg flex items-center justify-between font-bold text-sm transition-all duration-200 cursor-pointer ${
              upgrades.doorEfficiency >= 5 
                ? 'bg-neutral-800 text-neutral-500 border border-neutral-700/30 cursor-not-allowed'
                : coins >= getUpgradeCost('doorEfficiency', upgrades.doorEfficiency)
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)] hover:scale-[1.01]'
                  : 'bg-neutral-800 text-neutral-400 border border-neutral-700/50 hover:bg-neutral-800/80'
            }`}
          >
            <span>{upgrades.doorEfficiency >= 5 ? 'МАКСИМАЛЬНИЙ РІВЕНЬ' : 'ПОКРАЩИТИ'}</span>
            {upgrades.doorEfficiency < 5 && (
              <span className="font-mono text-amber-400">{getUpgradeCost('doorEfficiency', upgrades.doorEfficiency)} 🪙</span>
            )}
          </button>
        </div>

        {/* Backup Generator Speed */}
        <div id="card-upgrade-generator" className="flex flex-col justify-between p-5 bg-neutral-900/80 border border-neutral-800 rounded-xl hover:border-amber-900/60 hover:shadow-[0_0_20px_rgba(245,158,11,0.05)] transition-all duration-300">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-950/40 border border-amber-900/60 rounded-lg">
                  <Zap className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-neutral-200 font-sans">Генератор у кладовій</h3>
                  <p className="text-xs text-amber-400 font-mono">Рівень {upgrades.generatorSpeed || 1} / 5</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-neutral-400 mb-4 leading-relaxed font-sans">
              Модернізація обмотки та ручного приводу генератора в кладовій. Кожен рівень збільшує швидкість заряджання електроенергії на +0.5% за секунду (починаючи з 0.5% до 2.5% за сек).
            </p>
            {/* Level indicators */}
            <div className="flex gap-1.5 mb-5">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <div 
                  key={lvl}
                  className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                    lvl <= (upgrades.generatorSpeed || 1) 
                      ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' 
                      : 'bg-neutral-800'
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            id="btn-buy-generator"
            disabled={(upgrades.generatorSpeed || 1) >= 5 || coins < getUpgradeCost('generatorSpeed', upgrades.generatorSpeed || 1)}
            onClick={() => buyUpgrade('generatorSpeed')}
            className={`w-full py-3 px-4 rounded-lg flex items-center justify-between font-bold text-sm transition-all duration-200 cursor-pointer font-sans ${
              (upgrades.generatorSpeed || 1) >= 5 
                ? 'bg-neutral-800 text-neutral-500 border border-neutral-700/30 cursor-not-allowed'
                : coins >= getUpgradeCost('generatorSpeed', upgrades.generatorSpeed || 1)
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_4px_12px_rgba(245,158,11,0.25)] hover:scale-[1.01]'
                  : 'bg-neutral-800 text-neutral-400 border border-neutral-700/50 hover:bg-neutral-800/80'
            }`}
          >
            <span>{(upgrades.generatorSpeed || 1) >= 5 ? 'МАКСИМАЛЬНИЙ РІВЕНЬ' : 'ПОКРАЩИТИ'}</span>
            {(upgrades.generatorSpeed || 1) < 5 && (
              <span className="font-mono text-amber-400">{getUpgradeCost('generatorSpeed', upgrades.generatorSpeed || 1)} 🪙</span>
            )}
          </button>
        </div>

        {/* Camera Signal Booster */}
        <div id="card-upgrade-cameras" className="flex flex-col justify-between p-5 bg-neutral-900/80 border border-neutral-800 rounded-xl hover:border-amber-900/60 hover:shadow-[0_0_20px_rgba(245,158,11,0.05)] transition-all duration-300">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-950/40 border border-purple-900/60 rounded-lg">
                  <Radio className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-neutral-200">Стабілізатор камер</h3>
                  <p className="text-xs text-purple-400 font-mono">Рівень {upgrades.cameraStability} / 5</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-neutral-400 mb-4 leading-relaxed">
              Покращує стабільність сигналу камер. Скорочує тривалість перешкод та перешкоджає швидкому виходу камер з ладу під час руху кішки на 15% за рівень.
            </p>
            {/* Level indicators */}
            <div className="flex gap-1.5 mb-5">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <div 
                  key={lvl}
                  className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                    lvl <= upgrades.cameraStability 
                      ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' 
                      : 'bg-neutral-800'
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            id="btn-buy-cameras"
            disabled={upgrades.cameraStability >= 5 || coins < getUpgradeCost('cameraStability', upgrades.cameraStability)}
            onClick={() => buyUpgrade('cameraStability')}
            className={`w-full py-3 px-4 rounded-lg flex items-center justify-between font-bold text-sm transition-all duration-200 cursor-pointer ${
              upgrades.cameraStability >= 5 
                ? 'bg-neutral-800 text-neutral-500 border border-neutral-700/30 cursor-not-allowed'
                : coins >= getUpgradeCost('cameraStability', upgrades.cameraStability)
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_4px_12px_rgba(168,85,247,0.25)] hover:scale-[1.01]'
                  : 'bg-neutral-800 text-neutral-400 border border-neutral-700/50 hover:bg-neutral-800/80'
            }`}
          >
            <span>{upgrades.cameraStability >= 5 ? 'МАКСИМАЛЬНИЙ РІВЕНЬ' : 'ПОКРАЩИТИ'}</span>
            {upgrades.cameraStability < 5 && (
              <span className="font-mono text-amber-400">{getUpgradeCost('cameraStability', upgrades.cameraStability)} 🪙</span>
            )}
          </button>
        </div>

        {/* Milka's Favorite Treats */}
        <div id="card-upgrade-treats" className="flex flex-col justify-between p-5 bg-neutral-900/80 border border-neutral-800 rounded-xl hover:border-amber-900/60 hover:shadow-[0_0_20px_rgba(245,158,11,0.05)] transition-all duration-300">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-950/40 border border-amber-900/60 rounded-lg">
                  <FlameKindling className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-neutral-200">Корм для Мілки</h3>
                  <p className="text-xs text-amber-400 font-mono">Придбано: {upgrades.treatsCount} / 5</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-neutral-400 mb-4 leading-relaxed">
              Надзвичайно смачні ласощі з лососем. Ви можете кинути корм у будь-яку кімнату через екран камер спостереження. Це привабить Мілку і затримає її там надовго, поки вона їсть!
            </p>
            {/* Treats quantity indicators */}
            <div className="flex gap-2 mb-5">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div 
                  key={idx}
                  className={`w-6 h-6 rounded-full flex items-center justify-center border font-bold text-xs transition-all duration-300 ${
                    idx <= upgrades.treatsCount 
                      ? 'bg-amber-600/30 text-amber-400 border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]' 
                      : 'bg-neutral-800 text-neutral-600 border-neutral-700/30'
                  }`}
                >
                  🥩
                </div>
              ))}
            </div>
          </div>

          <button
            id="btn-buy-treats"
            disabled={upgrades.treatsCount >= 5 || coins < getUpgradeCost('treatsCount', upgrades.treatsCount)}
            onClick={() => buyUpgrade('treatsCount')}
            className={`w-full py-3 px-4 rounded-lg flex items-center justify-between font-bold text-sm transition-all duration-200 cursor-pointer ${
              upgrades.treatsCount >= 5 
                ? 'bg-neutral-800 text-neutral-500 border border-neutral-700/30 cursor-not-allowed'
                : coins >= getUpgradeCost('treatsCount', upgrades.treatsCount)
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_4px_12px_rgba(245,158,11,0.25)] hover:scale-[1.01]'
                  : 'bg-neutral-800 text-neutral-400 border border-neutral-700/50 hover:bg-neutral-800/80'
            }`}
          >
            <span>{upgrades.treatsCount >= 5 ? 'МАКСИМАЛЬНО (5 шт.)' : 'КУПИТИ (1 шт.)'}</span>
            {upgrades.treatsCount < 5 && (
              <span className="font-mono text-amber-400">{getUpgradeCost('treatsCount', upgrades.treatsCount)} 🪙</span>
            )}
          </button>
        </div>

        {/* Milka's Pacifying Pâté */}
        <div id="card-upgrade-pate" className="flex flex-col justify-between p-5 bg-neutral-900/80 border border-neutral-800 rounded-xl hover:border-amber-900/60 hover:shadow-[0_0_20px_rgba(245,158,11,0.05)] transition-all duration-300">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-950/40 border border-orange-900/60 rounded-lg">
                  <Sparkles className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-neutral-200">Ніжний Паштет</h3>
                  <p className="text-xs text-orange-400 font-mono">Придбано: {upgrades.pateCount || 0} / 5</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-neutral-400 mb-4 leading-relaxed">
              Особливий паштет, що повністю умиротворює Мілку на тривалий час (40 сек)! Але стережіться: собака Гарік теж чує запах і може прийти та з'їсти його першим, розлютивши цим Мілку!
            </p>
            {/* Pâté quantity indicators */}
            <div className="flex gap-2 mb-5">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div 
                  key={idx}
                  className={`w-6 h-6 rounded-full flex items-center justify-center border font-bold text-xs transition-all duration-300 ${
                    idx <= (upgrades.pateCount || 0)
                      ? 'bg-orange-600/30 text-orange-400 border-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.3)]' 
                      : 'bg-neutral-800 text-neutral-600 border-neutral-700/30'
                  }`}
                >
                  🥫
                </div>
              ))}
            </div>
          </div>

          <button
            id="btn-buy-pate"
            disabled={(upgrades.pateCount || 0) >= 5 || coins < getUpgradeCost('pateCount', upgrades.pateCount || 0)}
            onClick={() => buyUpgrade('pateCount')}
            className={`w-full py-3 px-4 rounded-lg flex items-center justify-between font-bold text-sm transition-all duration-200 cursor-pointer ${
              (upgrades.pateCount || 0) >= 5 
                ? 'bg-neutral-800 text-neutral-500 border border-neutral-700/30 cursor-not-allowed'
                : coins >= getUpgradeCost('pateCount', upgrades.pateCount || 0)
                  ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-[0_4px_12px_rgba(249,115,22,0.25)] hover:scale-[1.01]'
                  : 'bg-neutral-800 text-neutral-400 border border-neutral-700/50 hover:bg-neutral-800/80'
            }`}
          >
            <span>{(upgrades.pateCount || 0) >= 5 ? 'МАКСИМАЛЬНО (5 шт.)' : 'КУПИТИ (1 шт.)'}</span>
            {(upgrades.pateCount || 0) < 5 && (
              <span className="font-mono text-amber-400">{getUpgradeCost('pateCount', upgrades.pateCount || 0)} 🪙</span>
            )}
          </button>
        </div>

        {/* Lamp Battery */}
        <div id="card-upgrade-lamp-battery" className="flex flex-col justify-between p-5 bg-neutral-900/80 border border-neutral-800 rounded-xl hover:border-amber-900/60 hover:shadow-[0_0_20px_rgba(245,158,11,0.05)] transition-all duration-300">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-950/40 border border-yellow-900/60 rounded-lg">
                  <BatteryCharging className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-neutral-200">Батарейка для лампи</h3>
                  <p className="text-xs text-yellow-400 font-mono">Придбано: {upgrades.lampBatteries || 0} / 5</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-neutral-400 mb-4 leading-relaxed">
              Потужна автономна батарейка. Дозволяє настільній лампі в Офісі працювати цілу ніч без споживання загальної електроенергії! Витрачається 1 шт. на ніч.
            </p>
            {/* Lamp Battery quantity indicators */}
            <div className="flex gap-2 mb-5">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div 
                  key={idx}
                  className={`w-6 h-6 rounded-full flex items-center justify-center border font-bold text-xs transition-all duration-300 ${
                    idx <= (upgrades.lampBatteries || 0)
                      ? 'bg-yellow-600/30 text-yellow-400 border-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.3)]' 
                      : 'bg-neutral-800 text-neutral-600 border-neutral-700/30'
                  }`}
                >
                  🔋
                </div>
              ))}
            </div>
          </div>

          <button
            id="btn-buy-lamp-battery"
            disabled={(upgrades.lampBatteries || 0) >= 5 || coins < getUpgradeCost('lampBatteries', upgrades.lampBatteries || 0)}
            onClick={() => buyUpgrade('lampBatteries')}
            className={`w-full py-3 px-4 rounded-lg flex items-center justify-between font-bold text-sm transition-all duration-200 cursor-pointer ${
              (upgrades.lampBatteries || 0) >= 5 
                ? 'bg-neutral-800 text-neutral-500 border border-neutral-700/30 cursor-not-allowed'
                : coins >= getUpgradeCost('lampBatteries', upgrades.lampBatteries || 0)
                  ? 'bg-yellow-500 hover:bg-yellow-400 text-neutral-950 shadow-[0_4px_12px_rgba(234,179,8,0.25)] hover:scale-[1.01]'
                  : 'bg-neutral-800 text-neutral-400 border border-neutral-700/50 hover:bg-neutral-800/80'
            }`}
          >
            <span>{(upgrades.lampBatteries || 0) >= 5 ? 'МАКСИМАЛЬНО (5 шт.)' : 'КУПИТИ (1 шт.)'}</span>
            {(upgrades.lampBatteries || 0) < 5 && (
              <span className="font-mono text-neutral-950 bg-amber-400 px-2 py-0.5 rounded">{getUpgradeCost('lampBatteries', upgrades.lampBatteries || 0)} 🪙</span>
            )}
          </button>
        </div>

      </div>

      {/* Footer hint */}
      <p id="shop-hint" className="text-xs text-neutral-500 text-center mb-4 max-w-lg leading-relaxed z-10">
        * Порада: Проходження кожної наступної ночі приносить велику суму монет. Також монети нараховуються за кожну годину, яку ви зуміли вижити під час невдалої спроби! Купуйте смаколики перед кожною складною ніччю.
      </p>
    </div>
  );
}
