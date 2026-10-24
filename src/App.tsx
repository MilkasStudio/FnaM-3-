/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GameSave, GameState, Upgrades, SoundConfig, RoomId, CameraInterference, CustomNightConfig } from './types';
import { sound } from './components/SoundManager';
import MainMenu from './components/MainMenu';
import IntroCutscene from './components/IntroCutscene';
import Shop from './components/Shop';
import Office, { getRoomPan } from './components/Office';
import Jumpscare from './components/Jumpscare';
import VictoryScreen from './components/VictoryScreen';
import GameOverScreen from './components/GameOverScreen';
import { ShieldAlert, Volume2, HelpCircle } from 'lucide-react';
import { Language, getTranslation } from './translations';

const MILKA_CONNECTIONS: Record<RoomId, RoomId[]> = {
  STREET: ['VERANDA', 'GARDEN', 'GARAGE'],
  VERANDA: ['STREET', 'KITCHEN_2', 'CORRIDOR'],
  KITCHEN_2: ['VERANDA', 'LIVING_2'],
  LIVING_2: ['KITCHEN_2', 'BEDROOM_3'],
  BEDROOM_3: ['LIVING_2', 'ATTIC'],
  CORRIDOR: ['VERANDA', 'KITCHEN', 'LIVING'],
  KITCHEN: ['CORRIDOR', 'TOILET', 'RIGHT_DOOR'],
  TOILET: ['KITCHEN'],
  LIVING: ['CORRIDOR', 'PLAYER_ROOM', 'HALL', 'LEFT_DOOR'],
  PLAYER_ROOM: ['LIVING'],
  HALL: ['LIVING'],
  LEFT_DOOR: ['LIVING'],
  RIGHT_DOOR: ['KITCHEN'],
  ATTIC: ['BEDROOM_3'],
  GARDEN: ['STREET'],
  GARAGE: ['STREET'],
  OFFICE: []
};

function findShortestPath(start: RoomId, target: RoomId): RoomId[] | null {
  if (start === target) return [start];
  const queue: RoomId[][] = [[start]];
  const visited = new Set<RoomId>([start]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const last = path[path.length - 1];
    const neighbors = MILKA_CONNECTIONS[last] || [];

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        const newPath = [...path, neighbor];
        if (neighbor === target) {
          return newPath;
        }
        visited.add(neighbor);
        queue.push(newPath);
      }
    }
  }
  return null;
}

const INITIAL_UPGRADES: Upgrades = {
  batteryCap: 1,
  doorEfficiency: 1,
  flashlightPower: 1,
  cameraStability: 1,
  treatsCount: 3, // Start with 3 treats by default so players can use the food mechanic right away!
  pateCount: 1,   // Start with 1 pate by default!
  lampBatteries: 1, // Start with 1 lamp battery by default!
  generatorSpeed: 1 // Start at Level 1 (0.5 power/sec, each level +0.5/sec up to Level 5 max 2.5/sec)
};

const INITIAL_SAVE: GameSave = {
  unlockedNight: 1,
  coins: 150, // Start with 150 coins so players can purchase more items right away!
  upgrades: INITIAL_UPGRADES,
  unlockedTwelveNights: false
};

const INITIAL_SOUND: SoundConfig = {
  musicVolume: 0.45,
  sfxVolume: 0.55,
  jumpscaresEnabled: true,
  phoneCallsEnabled: true
};

const DEFAULT_CUSTOM_NIGHT: CustomNightConfig = {
  active: false,
  milkaLevel: 10,
  shellyLevel: 10,
  garikLevel: 10,
  freeLamp: false,
  infiniteFlashlight: false,
  doublePower: false,
  moreTreats: false,
  radarActive: false
};

export default function App() {
  // Language state
  const [language, setLanguage] = useState<Language>('en');

  // Save state
  const [gameSave, setGameSave] = useState<GameSave>(INITIAL_SAVE);
  const [soundConfig, setSoundConfig] = useState<SoundConfig>(INITIAL_SOUND);
  const [gameState, setGameState] = useState<GameState>('MENU');
  
  // Custom Night state
  const [customNightConfig, setCustomNightConfig] = useState<CustomNightConfig>(DEFAULT_CUSTOM_NIGHT);

  // Gameplay state
  const [currentNight, setCurrentNight] = useState<number>(1);
  const [time, setTime] = useState<number>(0); // 0 (12 AM) to 6 (6 AM)
  const [secondsInHour, setSecondsInHour] = useState<number>(0);
  const [power, setPower] = useState<number>(100);
  const [battery, setBattery] = useState<number>(100);
  
  const [isLeftDoorClosed, setIsLeftDoorClosed] = useState<boolean>(false);
  const [isRightDoorClosed, setIsRightDoorClosed] = useState<boolean>(false);
  const [useFlashlight, setUseFlashlight] = useState<boolean>(false);
  const [leftLight, setLeftLight] = useState<boolean>(false);
  const [rightLight, setRightLight] = useState<boolean>(false);
  const [isMonitorOpen, setIsMonitorOpen] = useState<boolean>(false);
  const [activeCam, setActiveCam] = useState<RoomId>('KITCHEN_2');

  // New features state
  const [isLampOn, setIsLampOn] = useState<boolean>(false);
  const [isLampBatteryActive, setIsLampBatteryActive] = useState<boolean>(false);
  const [activePate, setActivePate] = useState<Record<RoomId, number>>({
    KITCHEN_2: 0, LIVING_2: 0, BEDROOM_3: 0, VERANDA: 0, CORRIDOR: 0, TOILET: 0, KITCHEN: 0, LIVING: 0, PLAYER_ROOM: 0, HALL: 0, STREET: 0, OFFICE: 0, LEFT_DOOR: 0, RIGHT_DOOR: 0
  });
  const [garikPosition, setGarikPosition] = useState<RoomId | 'STREET'>('STREET');
  const [shellyPosition, setShellyPosition] = useState<RoomId | 'STREET'>('STREET');
  const [milkaAngerLevel, setMilkaAngerLevel] = useState<number>(1.0);
  
  // Runtime food quantities
  const [runtimeTreatsCount, setRuntimeTreatsCount] = useState<number>(0);
  const [runtimePateCount, setRuntimePateCount] = useState<number>(0);
  
  // Active traps/treats countdown
  const [activeTreats, setActiveTreats] = useState<Record<RoomId, number>>({
    KITCHEN_2: 0, LIVING_2: 0, BEDROOM_3: 0, VERANDA: 0, CORRIDOR: 0, TOILET: 0, KITCHEN: 0, LIVING: 0, PLAYER_ROOM: 0, HALL: 0, STREET: 0, OFFICE: 0, LEFT_DOOR: 0, RIGHT_DOOR: 0
  });

  // Milka's state
  const [milkaPosition, setMilkaPosition] = useState<RoomId>('BEDROOM_3');
  const [milkaState, setMilkaState] = useState<number>(0); // 0: Sleeping/Away, 1: Sitting, 2: Staring, 3: In lens
  const [camInterference, setCamInterference] = useState<CameraInterference>({ active: false, intensity: 0 });

  // Blackout triggers
  const [isBlackoutActive, setIsBlackoutActive] = useState<boolean>(false);
  const [blackoutTimer, setBlackoutTimer] = useState<number>(0);

  // Time stats for gameover screen
  const [hoursSurvived, setHoursSurvived] = useState<number>(0);
  const [timeString, setTimeString] = useState<string>("12 AM");

  // Jumpscare tracking
  const [jumpscareAttacker, setJumpscareAttacker] = useState<'milka' | 'garik' | 'shelly'>('milka');

  // Mask and Pantry states
  const [isMaskOn, setIsMaskOn] = useState<boolean>(false);
  const [isPantryOpen, setIsPantryOpen] = useState<boolean>(false);

  // Secret Entity 4 (Broken Milka)
  const [isEntity_4Present, setIsEntity_4Present] = useState<boolean>(false);
  const [entity_4Timer, setEntity_4Timer] = useState<number>(0);
  const entity_4PresentRef = useRef<boolean>(false);

  // Keep references for tickers
  const stateRef = useRef<GameState>(gameState);
  const milkaPosRef = useRef<RoomId>(milkaPosition);
  const leftDoorRef = useRef<boolean>(isLeftDoorClosed);
  const rightDoorRef = useRef<boolean>(isRightDoorClosed);
  const leftLightRef = useRef<boolean>(leftLight);
  const rightLightRef = useRef<boolean>(rightLight);
  const flashlightRef = useRef<boolean>(useFlashlight);
  const monitorRef = useRef<boolean>(isMonitorOpen);
  const activeCamRef = useRef<RoomId>(activeCam);
  const treatsRef = useRef<Record<RoomId, number>>(activeTreats);
  const powerRef = useRef<number>(power);
  const batteryRef = useRef<number>(battery);
  const blackoutRef = useRef<boolean>(isBlackoutActive);

  // Mask and Pantry refs
  const maskOnRef = useRef<boolean>(isMaskOn);
  const pantryOpenRef = useRef<boolean>(isPantryOpen);

  // New refs
  const lampRef = useRef<boolean>(isLampOn);
  const lampBatteryActiveRef = useRef<boolean>(isLampBatteryActive);
  const pateRef = useRef<Record<RoomId, number>>(activePate);
  const garikPosRef = useRef<RoomId | 'STREET'>(garikPosition);
  const shellyPosRef = useRef<RoomId | 'STREET'>(shellyPosition);
  const milkaAngerRef = useRef<number>(milkaAngerLevel);
  const milkaHistoryRef = useRef<RoomId[]>([]);
  const milkaStayCountRef = useRef<number>(0);

  // Achievements tracking refs
  const flashlightUsedThisNightRef = useRef<boolean>(false);
  const leftDoorClosedThisNightRef = useRef<boolean>(false);
  const rightDoorClosedThisNightRef = useRef<boolean>(false);
  const foodDroppedThisNightRef = useRef<number>(0);

  // Sync refs
  useEffect(() => { stateRef.current = gameState; }, [gameState]);
  useEffect(() => { milkaPosRef.current = milkaPosition; }, [milkaPosition]);
  useEffect(() => { leftDoorRef.current = isLeftDoorClosed; }, [isLeftDoorClosed]);
  useEffect(() => { rightDoorRef.current = isRightDoorClosed; }, [isRightDoorClosed]);
  useEffect(() => { leftLightRef.current = leftLight; }, [leftLight]);
  useEffect(() => { rightLightRef.current = rightLight; }, [rightLight]);
  useEffect(() => { flashlightRef.current = useFlashlight; }, [useFlashlight]);
  useEffect(() => { monitorRef.current = isMonitorOpen; }, [isMonitorOpen]);
  useEffect(() => { activeCamRef.current = activeCam; }, [activeCam]);
  useEffect(() => { treatsRef.current = activeTreats; }, [activeTreats]);
  useEffect(() => { powerRef.current = power; }, [power]);
  useEffect(() => { batteryRef.current = battery; }, [battery]);
  useEffect(() => { blackoutRef.current = isBlackoutActive; }, [isBlackoutActive]);

  useEffect(() => { lampRef.current = isLampOn; }, [isLampOn]);
  useEffect(() => { lampBatteryActiveRef.current = isLampBatteryActive; }, [isLampBatteryActive]);
  useEffect(() => { pateRef.current = activePate; }, [activePate]);
  useEffect(() => { garikPosRef.current = garikPosition; }, [garikPosition]);
  useEffect(() => { shellyPosRef.current = shellyPosition; }, [shellyPosition]);
  useEffect(() => { milkaAngerRef.current = milkaAngerLevel; }, [milkaAngerLevel]);
  useEffect(() => { maskOnRef.current = isMaskOn; }, [isMaskOn]);
  useEffect(() => { pantryOpenRef.current = isPantryOpen; }, [isPantryOpen]);
  useEffect(() => { entity_4PresentRef.current = isEntity_4Present; }, [isEntity_4Present]);

  // Load game save on mount
  useEffect(() => {
    let savedNight: string | null = null;
    let savedCoins: string | null = null;
    let savedUpgrades: string | null = null;
    let savedSound: string | null = null;
    let savedTwelveNights: string | null = null;
    let savedLanguage: string | null = null;

    try {
      savedNight = localStorage.getItem('milka_unlocked_night');
      savedCoins = localStorage.getItem('milka_coins');
      savedUpgrades = localStorage.getItem('milka_upgrades');
      savedSound = localStorage.getItem('milka_sound_config');
      savedTwelveNights = localStorage.getItem('milka_unlocked_twelve_nights');
      savedLanguage = localStorage.getItem('milka_language');
    } catch (e) {
      console.warn('localStorage is not accessible in this context:', e);
    }

    if (savedLanguage === 'en' || savedLanguage === 'uk' || savedLanguage === 'ru') {
      setLanguage(savedLanguage as Language);
    } else {
      setLanguage('en'); // Default to English as requested
    }

    const saveObj: GameSave = { ...INITIAL_SAVE };
    if (savedNight) saveObj.unlockedNight = parseInt(savedNight);
    if (savedCoins) saveObj.coins = parseInt(savedCoins);
    if (savedTwelveNights) saveObj.unlockedTwelveNights = savedTwelveNights === 'true';
    if (savedUpgrades) {
      try {
        saveObj.upgrades = { ...INITIAL_UPGRADES, ...JSON.parse(savedUpgrades) };
      } catch (e) {}
    }

    const soundObj: SoundConfig = { ...INITIAL_SOUND };
    if (savedSound) {
      try {
        const parsed = JSON.parse(savedSound);
        soundObj.musicVolume = parsed.musicVolume ?? INITIAL_SOUND.musicVolume;
        soundObj.sfxVolume = parsed.sfxVolume ?? INITIAL_SOUND.sfxVolume;
        soundObj.jumpscaresEnabled = parsed.jumpscaresEnabled ?? INITIAL_SOUND.jumpscaresEnabled;
      } catch (e) {}
    }

    setGameSave(saveObj);
    setSoundConfig(soundObj);
    
    // Set sound manager volumes
    sound.setVolumes(soundObj.sfxVolume, soundObj.musicVolume);
  }, []);

  // Save game save changes helper
  const saveGame = (updatedSave: GameSave) => {
    setGameSave(updatedSave);
    try {
      localStorage.setItem('milka_unlocked_night', updatedSave.unlockedNight.toString());
      localStorage.setItem('milka_coins', updatedSave.coins.toString());
      localStorage.setItem('milka_upgrades', JSON.stringify(updatedSave.upgrades));
      localStorage.setItem('milka_unlocked_twelve_nights', (updatedSave.unlockedTwelveNights || false).toString());
    } catch (e) {
      console.warn('Could not save game data to localStorage:', e);
    }
  };

  const handleUpdateLanguage = (lang: Language) => {
    setLanguage(lang);
    try {
      localStorage.setItem('milka_language', lang);
    } catch (e) {
      console.warn('Could not save language to localStorage:', e);
    }
  };

  const handleUpdateSoundConfig = (updatedSound: SoundConfig) => {
    setSoundConfig(updatedSound);
    try {
      localStorage.setItem('milka_sound_config', JSON.stringify(updatedSound));
    } catch (e) {
      console.warn('Could not save sound config to localStorage:', e);
    }
  };

  const handleResetSave = () => {
    setGameSave(INITIAL_SAVE);
    setSoundConfig(INITIAL_SOUND);
    setLanguage('en');
    sound.setVolumes(INITIAL_SOUND.sfxVolume, INITIAL_SOUND.musicVolume);
    try {
      localStorage.removeItem('milka_unlocked_night');
      localStorage.removeItem('milka_coins');
      localStorage.removeItem('milka_upgrades');
      localStorage.removeItem('milka_sound_config');
      localStorage.removeItem('milka_unlocked_twelve_nights');
      localStorage.removeItem('milka_language');
    } catch (e) {
      console.warn('Could not reset localStorage data:', e);
    }
  };

  const handlePurchase = (updatedUpgrades: Upgrades, updatedCoins: number) => {
    const updated = {
      ...gameSave,
      upgrades: updatedUpgrades,
      coins: updatedCoins
    };
    saveGame(updated);
  };

  // Start a specific night
  const handleStartNight = (nightNum: number, customConfig?: CustomNightConfig) => {
    const config = customConfig || DEFAULT_CUSTOM_NIGHT;
    setCustomNightConfig(config);

    // Reset achievement trackers
    flashlightUsedThisNightRef.current = false;
    leftDoorClosedThisNightRef.current = false;
    rightDoorClosedThisNightRef.current = false;
    foodDroppedThisNightRef.current = 0;

    setCurrentNight(nightNum);
    setTime(0); // 12 AM
    setTimeString("12 AM");
    setSecondsInHour(0);
    setPower(config.doublePower ? 200 : 100);
    setBattery(100);
    setIsLeftDoorClosed(false);
    setIsRightDoorClosed(false);
    setUseFlashlight(false);
    setLeftLight(false);
    setRightLight(false);
    setIsMonitorOpen(false);
    setIsBlackoutActive(false);
    setBlackoutTimer(0);
    setHoursSurvived(0);

    // Set initial food quantities (guarantee at least 2 treats and 1 pate as a baseline so players never run dry)
    let initialTreats = Math.max(2, gameSave.upgrades.treatsCount);
    let initialPate = Math.max(1, gameSave.upgrades.pateCount);
    if (config.moreTreats) {
      initialTreats += 5;
      initialPate += 5;
    }
    setRuntimeTreatsCount(initialTreats);
    setRuntimePateCount(initialPate);

    // Reset new features
    setIsLampOn(false);
    
    // Spend lamp battery if available for this night (if not custom night)
    if (!config.active && gameSave.upgrades.lampBatteries && gameSave.upgrades.lampBatteries > 0) {
      setIsLampBatteryActive(true);
      const updatedUpgrades = {
        ...gameSave.upgrades,
        lampBatteries: gameSave.upgrades.lampBatteries - 1
      };
      saveGame({
        ...gameSave,
        upgrades: updatedUpgrades
      });
    } else {
      setIsLampBatteryActive(false);
    }

    setGarikPosition('STREET');
    setShellyPosition('STREET');
    setMilkaAngerLevel(1.0);
    setActivePate({
      KITCHEN_2: 0, LIVING_2: 0, BEDROOM_3: 0, VERANDA: 0, CORRIDOR: 0, TOILET: 0, KITCHEN: 0, LIVING: 0, PLAYER_ROOM: 0, HALL: 0, STREET: 0, OFFICE: 0, LEFT_DOOR: 0, RIGHT_DOOR: 0
    });

    // Initial Milka Position (any of the bottom rooms: KITCHEN_2, LIVING_2, BEDROOM_3, VERANDA, KITCHEN)
    const bottomRooms: RoomId[] = ['KITCHEN_2', 'LIVING_2', 'BEDROOM_3', 'VERANDA', 'KITCHEN'];
    const initialPos: RoomId = bottomRooms[Math.floor(Math.random() * bottomRooms.length)];
    setMilkaPosition(initialPos);
    setMilkaState(1); // sitting
    milkaHistoryRef.current = [initialPos];
    milkaStayCountRef.current = 0;

    // Reset treats
    setActiveTreats({
      KITCHEN_2: 0, LIVING_2: 0, BEDROOM_3: 0, VERANDA: 0, CORRIDOR: 0, TOILET: 0, KITCHEN: 0, LIVING: 0, PLAYER_ROOM: 0, HALL: 0, STREET: 0, OFFICE: 0, LEFT_DOOR: 0, RIGHT_DOOR: 0
    });

    // Go to loading screen
    setGameState('NIGHT_START');
  };

  // Transition from loading screen to actual game after 3 seconds
  useEffect(() => {
    if (gameState === 'NIGHT_START') {
      sound.playOfficeAmbient();
      const timer = setTimeout(() => {
        setGameState('GAME');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  const handleStartCustomNight = (config: CustomNightConfig) => {
    handleStartNight(13, config);
  };

  // Drop treat in camera view
  const handleDropTreat = (roomId: RoomId) => {
    if (runtimeTreatsCount <= 0) return;

    // Decrement treats inventory
    setRuntimeTreatsCount(prev => Math.max(0, prev - 1));
    foodDroppedThisNightRef.current += 1;

    if (!customNightConfig.active) {
      const updatedUpgrades = {
        ...gameSave.upgrades,
        treatsCount: Math.max(0, gameSave.upgrades.treatsCount - 1)
      };
      saveGame({
        ...gameSave,
        upgrades: updatedUpgrades
      });
    }

    // Activate treat countdown in room (25 seconds)
    setActiveTreats(prev => ({
      ...prev,
      [roomId]: 25
    }));
  };

  // Drop pâté in camera view
  const handleDropPate = (roomId: RoomId) => {
    if (runtimePateCount <= 0) return;

    // Decrement pate inventory
    setRuntimePateCount(prev => Math.max(0, prev - 1));
    foodDroppedThisNightRef.current += 1;

    if (!customNightConfig.active) {
      const updatedUpgrades = {
        ...gameSave.upgrades,
        pateCount: Math.max(0, gameSave.upgrades.pateCount - 1)
      };
      saveGame({
        ...gameSave,
        upgrades: updatedUpgrades
      });
    }

    // Activate pate countdown in room (40 seconds - pacifies Milka for longer!)
    setActivePate(prev => ({
      ...prev,
      [roomId]: 40
    }));
  };

  // Trigger camera flash to scare Garik
  const handleCameraFlash = (roomId: RoomId) => {
    if (garikPosRef.current === roomId) {
      setGarikPosition('STREET');
      sound.playDogWhimper(getRoomPan(roomId));
    }
    setPower(prev => Math.max(0, prev - 2));
  };

  // MAIN SECONDS TICKER (Runs when gameState === 'GAME')
  useEffect(() => {
    if (gameState !== 'GAME') return;

    let movementChecksCount = 0;
    let garikMovementCheckCount = 0;
    let shellyMovementCheckCount = 0;
    let entity_4MovementCheckCount = 0;
    let doorWaitTime = 0;
    let officeHideTime = 0;

    const interval = setInterval(() => {
      if (stateRef.current !== 'GAME') return;

      // Track achievements conditions
      if (flashlightRef.current) {
        flashlightUsedThisNightRef.current = true;
      }
      if (leftDoorRef.current) {
        leftDoorClosedThisNightRef.current = true;
      }
      if (rightDoorRef.current) {
        rightDoorClosedThisNightRef.current = true;
      }

      // 1. GENERATOR POWER DRAIN / CHARGE CALCULATION
      if (powerRef.current > 0 || pantryOpenRef.current) {
        if (pantryOpenRef.current) {
          // Recharging backup generator in the pantry!
          const chargeSpeed = 0.5 * (gameSave.upgrades.generatorSpeed || 1); // Starts at 0.5, max level 5 is 2.5 per second
          const maxCapacity = gameSave.upgrades.batteryCap > 1 ? 100 + (gameSave.upgrades.batteryCap - 1) * 25 : 100;
          const limit = customNightConfig.doublePower ? maxCapacity * 2 : maxCapacity;
          const newPower = Math.min(limit, powerRef.current + chargeSpeed);
          setPower(newPower);
        } else {
          let drain = 0.25; // base ambient clock/vent drain (increased from 0.05 for intense gameplay balance)

          if (leftDoorRef.current) {
            // Upgrade decreases door drain by 15% per level
            const doorFactor = 1 - (gameSave.upgrades.doorEfficiency - 1) * 0.15;
            drain += 0.75 * doorFactor; // increased from 0.38 for better balance
          }
          if (rightDoorRef.current) {
            const doorFactor = 1 - (gameSave.upgrades.doorEfficiency - 1) * 0.15;
            drain += 0.75 * doorFactor; // increased from 0.38 for better balance
          }
          if (leftLightRef.current || rightLightRef.current) {
            drain += 0.30; // lights drain (increased from 0.16)
          }
          if (monitorRef.current) {
            drain += 0.25; // monitor power drain (increased from 0.12)
          }
          if (flashlightRef.current && batteryRef.current > 0) {
            drain += 0.35; // flashlight uses power too! (increased from 0.18)
          }
          if (lampRef.current) {
            if (!lampBatteryActiveRef.current && !customNightConfig.freeLamp) {
              drain += 0.95; // desk lamp drains power very fast (increased from 0.85% per second)!
            }
          }

          const newPower = Math.max(0, powerRef.current - drain);
          setPower(newPower);

          // Blackout trigger
          if (newPower <= 0) {
            sound.stopOfficeAmbient();
            setIsLeftDoorClosed(false);
            setIsRightDoorClosed(false);
            setLeftLight(false);
            setRightLight(false);
            setIsMonitorOpen(false);
            setUseFlashlight(false);
            setIsLampOn(false); // desk lamp turns off too!
            setIsMaskOn(false); // take off mask during blackout
            setIsBlackoutActive(true);
            setBlackoutTimer(12); // 12 seconds of blackout music box before screamer
            return;
          }
        }
      }

      // 2. BLACKOUT TICKER
      if (blackoutRef.current) {
        setBlackoutTimer(prev => {
          if (prev <= 1) {
            // Trigger jumpscare
            clearInterval(interval);
            setJumpscareAttacker('milka');
            setGameState('JUMPSCARE');
            return 0;
          }
          // play click or light flickers
          if (prev === 6) {
            sound.playMeow(0.5); // scary distorted meow
          }
          return prev - 1;
        });
        return; // skip rest of AI during blackout
      }

      // 3. FLASHLIGHT BATTERY DRAIN CALCULATION
      if (flashlightRef.current && batteryRef.current > 0 && !customNightConfig.infiniteFlashlight) {
        // Upgrade increases battery duration (+20% capacity, meaning slower drain rate)
        const batteryDrainFactor = 2.0 / (1 + (gameSave.upgrades.batteryCap - 1) * 0.25);
        const newBattery = Math.max(0, batteryRef.current - batteryDrainFactor);
        setBattery(newBattery);

        if (newBattery <= 0) {
          setUseFlashlight(false);
          sound.playClick(); // metallic snap out
        }
      }

      // 4. IN-GAME CLOCK HOURS SURVIVAL TICKER
      setSecondsInHour(sec => {
        if (sec >= 59) {
          // Hour passes!
          setTime(h => {
            const nextHour = h + 1;
            setHoursSurvived(nextHour);
            
            if (nextHour >= 6) {
              // 6 AM! VICTORY FOR THE NIGHT!
              clearInterval(interval);
              sound.stopOfficeAmbient();
              
              // Give survival salary based on night
              const maxNightsAllowed = gameSave.unlockedTwelveNights ? 12 : 5;
              const coinsPayout = currentNight === maxNightsAllowed ? 2500 : currentNight === 5 ? 1000 : currentNight * 120;
              const nextUnlocked = Math.max(gameSave.unlockedNight, Math.min(maxNightsAllowed, currentNight + 1));
              
              let currentUnlockedList = [...(gameSave.unlockedAchievements || [])];
              
              // Evaluate achievements
              // 1. first_night
              if (currentNight === 1 && !currentUnlockedList.includes('first_night')) {
                currentUnlockedList.push('first_night');
              }
              // 2. no_flashlight
              if (!flashlightUsedThisNightRef.current && !currentUnlockedList.includes('no_flashlight')) {
                currentUnlockedList.push('no_flashlight');
              }
              // 3. frugal
              if (powerRef.current >= 50 && !currentUnlockedList.includes('frugal')) {
                currentUnlockedList.push('frugal');
              }
              // 4. treat_master
              if (foodDroppedThisNightRef.current >= 5 && !currentUnlockedList.includes('treat_master')) {
                currentUnlockedList.push('treat_master');
              }
              // 5. no_doors
              if (!leftDoorClosedThisNightRef.current && !rightDoorClosedThisNightRef.current && !currentUnlockedList.includes('no_doors')) {
                currentUnlockedList.push('no_doors');
              }
              
              const isBeatingNight5 = currentNight === 5;
              const nextTwelveNights = gameSave.unlockedTwelveNights || isBeatingNight5;
              const finalUnlockedNight = isBeatingNight5 ? 6 : nextUnlocked;
              
              saveGame({
                ...gameSave,
                coins: gameSave.coins + coinsPayout,
                unlockedNight: finalUnlockedNight,
                unlockedTwelveNights: nextTwelveNights,
                unlockedAchievements: currentUnlockedList
              });

              setGameState('VICTORY');
              return 6;
            }

            const strings = ["12 AM", "01 AM", "02 AM", "03 AM", "04 AM", "05 AM", "06 AM"];
            setTimeString(strings[nextHour]);
            return nextHour;
          });
          return 0;
        }
        return sec + 1;
      });

      // 5. DECREMENT ACTIVE ROOM TREATS TIMER
      setActiveTreats(prev => {
        const copy = { ...prev };
        let updated = false;
        Object.keys(copy).forEach((k) => {
          const room = k as RoomId;
          if (copy[room] > 0) {
            copy[room] = copy[room] - 1;
            updated = true;
          }
        });
        return updated ? copy : prev;
      });

      // Decrement active room pate timer
      setActivePate(prev => {
        const copy = { ...prev };
        let updated = false;
        Object.keys(copy).forEach((k) => {
          const room = k as RoomId;
          if (copy[room] > 0) {
            copy[room] = copy[room] - 1;
            updated = true;
          }
        });
        return updated ? copy : prev;
      });

      // 6. MILKA MOVEMENT & AI AI LOGIC
      // Check if Milka is currently eating a treat or pate dropped in her room
      const currentTreatTimer = treatsRef.current[milkaPosRef.current];
      const currentPateTimer = pateRef.current[milkaPosRef.current];
      if (currentTreatTimer > 0 || currentPateTimer > 0) {
        // She is happily eating and pacified! Make her cameraState "sitting" or "staring"
        setMilkaState(1);
        return; // skip AI checks
      }

      movementChecksCount++;
      // Every 6 seconds (faster on higher nights, say 7 - currentNight seconds), Milka attempts to move!
      // If she is angry (stolen food), her AI checks fire much faster!
      let baseInterval = Math.max(2, 7 - currentNight);
      let aggression = currentNight === 5 ? 20 : (currentNight * 4 + 1);

      if (customNightConfig.active) {
        if (customNightConfig.milkaLevel === 0) {
          // Milka is disabled / completely inactive!
          return;
        }
        baseInterval = Math.max(2, 7 - Math.round(customNightConfig.milkaLevel / 4));
        aggression = customNightConfig.milkaLevel;
      }

      const aiIntervalSeconds = Math.max(1, Math.round(baseInterval / milkaAngerRef.current));
      
      if (movementChecksCount >= aiIntervalSeconds) {
        movementChecksCount = 0;

        // Roll AI success (Aggression out of 20)
        // Milka becomes much more aggressive (her success chance increases) based on anger level!
        aggression = Math.min(20, aggression * milkaAngerRef.current);
        const roll = Math.random() * 20;

        if (roll <= aggression) {
          // AI movement check SUCCESS!
          const currentPos = milkaPosRef.current;
          let nextPos: RoomId = currentPos;

          // 1. Smell Food Sensor: Check if any rooms in the house contain active treats or pate, and pathfind to the closest one
          const neighbors = MILKA_CONNECTIONS[currentPos] || [];
          let foodRoom: RoomId | null = null;
          let shortestPathLen = Infinity;
          const houseRooms: RoomId[] = ['KITCHEN_2', 'LIVING_2', 'BEDROOM_3', 'VERANDA', 'CORRIDOR', 'TOILET', 'KITCHEN', 'LIVING', 'PLAYER_ROOM', 'HALL'];
          for (const r of houseRooms) {
            if ((treatsRef.current[r] || 0) > 0 || (pateRef.current[r] || 0) > 0) {
              const path = findShortestPath(currentPos, r);
              if (path && path.length < shortestPathLen) {
                shortestPathLen = path.length;
                foodRoom = r;
              }
            }
          }

          if (foodRoom && Math.random() < 0.85) {
            const path = findShortestPath(currentPos, foodRoom);
            if (path && path.length > 1) {
              nextPos = path[1];
            }
          } else {
            // 2. Flashlight Attraction: flashlight is active, drawing her curiosity step-by-step to the doors
            const isFlashlightOn = flashlightRef.current && batteryRef.current > 0;
            if (isFlashlightOn && Math.random() < 0.70) {
              const pathLeft = findShortestPath(currentPos, 'LEFT_DOOR');
              const pathRight = findShortestPath(currentPos, 'RIGHT_DOOR');
              let chosenPath = null;
              if (pathLeft && pathRight) {
                chosenPath = pathLeft.length < pathRight.length ? pathLeft : pathRight;
              } else {
                chosenPath = pathLeft || pathRight;
              }
              if (chosenPath && chosenPath.length > 1) {
                nextPos = chosenPath[1];
              }
            }
          }

          // 3. Standard / Reactive pathfinding if nextPos was not overridden by Food or Flashlight
          if (nextPos === currentPos) {
            // Camera watch shyness: If player is watching the current camera, Milka feels stared at
            const isPlayerWatching = monitorRef.current && activeCamRef.current === currentPos;
            
            if (currentPos === 'LEFT_DOOR') {
              if (leftDoorRef.current) {
                // Blocked! She scratches, gets frustrated and retreats
                sound.playScratch(-0.75);
                nextPos = 'LIVING';
              } else {
                doorWaitTime++;
                const delayThreshold = leftLightRef.current ? 7 : 4;
                if (doorWaitTime >= delayThreshold) {
                  nextPos = 'OFFICE';
                  doorWaitTime = 0;
                }
              }
            } else if (currentPos === 'RIGHT_DOOR') {
              if (rightDoorRef.current) {
                sound.playScratch(0.75);
                nextPos = 'KITCHEN';
              } else {
                doorWaitTime++;
                const delayThreshold = rightLightRef.current ? 7 : 4;
                if (doorWaitTime >= delayThreshold) {
                  nextPos = 'OFFICE';
                  doorWaitTime = 0;
                }
              }
            } else if (neighbors.length > 0) {
              // Memory penalty: try to avoid rooms recently visited (last 2 rooms in history)
              const history = milkaHistoryRef.current;
              let filteredOptions = neighbors.filter(r => !history.slice(-2).includes(r));
              
              // Camera watch avoidance: avoid moving to the room the player is currently viewing
              if (isPlayerWatching) {
                filteredOptions = filteredOptions.filter(r => r !== activeCamRef.current);
              }
              
              const finalOptions = filteredOptions.length > 0 ? filteredOptions : neighbors;
              nextPos = finalOptions[Math.floor(Math.random() * finalOptions.length)];
            }
          }

          // 4. Memory update and anti-stuck
          if (nextPos !== currentPos) {
            milkaStayCountRef.current = 0;
            const newHistory = [...milkaHistoryRef.current, nextPos].slice(-4);
            milkaHistoryRef.current = newHistory;
          } else {
            // She stayed in the same room
            milkaStayCountRef.current += 1;
            // Anti-stuck trigger: if she is stuck for 2 checks, force movement to another neighbor
            if (milkaStayCountRef.current >= 2 && currentPos !== 'LEFT_DOOR' && currentPos !== 'RIGHT_DOOR') {
              const stuckNeighbors = neighbors.filter(r => r !== currentPos);
              if (stuckNeighbors.length > 0) {
                nextPos = stuckNeighbors[Math.floor(Math.random() * stuckNeighbors.length)];
                milkaStayCountRef.current = 0;
                const newHistory = [...milkaHistoryRef.current, nextPos].slice(-4);
                milkaHistoryRef.current = newHistory;
              }
            }
          }

          // Apply state movement
          if (nextPos !== currentPos) {
            // Trigger camera signal booster calculations (upgrades reduce static intensity)
            const stabilityFactor = Math.max(0.2, 1 - (gameSave.upgrades.cameraStability - 1) * 0.18);
            
            setCamInterference({ active: true, intensity: 1 });
            const nextPan = getRoomPan(nextPos);
            sound.playCameraInterference(nextPan);
            sound.playFootsteps(nextPan);

            // Clear static after short delay
            setTimeout(() => {
              setCamInterference({ active: false, intensity: 0 });
            }, 1000 * stabilityFactor);

            setMilkaPosition(nextPos);
            // Randomize cat camera behavior: 1 (sitting), 2 (staring directly), 3 (close up blocks camera)
            const randomState = Math.random() > 0.65 ? (Math.random() > 0.6 ? 3 : 2) : 1;
            setMilkaState(randomState);

            // If she goes back, clear door wait timer
            if (nextPos !== 'LEFT_DOOR' && nextPos !== 'RIGHT_DOOR') {
              doorWaitTime = 0;
            }
          }
        }
      }      // 6.5 GARIK AI LOGIC (Dog)
      if (customNightConfig.active && customNightConfig.garikLevel === 0) {
        // Garik is completely disabled / inactive!
      } else {
        garikMovementCheckCount++;
        if (garikMovementCheckCount >= 7) { // moves/checks every 7 seconds
          garikMovementCheckCount = 0;
          const gPos = garikPosRef.current;

          if (gPos === 'STREET') {
            // Garik spawns on any night. Chance increases with nights (Night 1: 15%, Night 5: 75%)
            let spawnChance = 0.15 + currentNight * 0.12;
            if (customNightConfig.active) {
              spawnChance = 0.05 + customNightConfig.garikLevel * 0.0425;
            }
            if (Math.random() < spawnChance) {
              setGarikPosition('VERANDA'); // Enters through Veranda
              const vPan = getRoomPan('VERANDA');
              sound.playDogFootsteps(vPan);
              sound.playSniff(vPan);
            }
          } else {
            // In the house! Scan rooms for active treats or pate
            let foodRoom: RoomId | null = null;
            let shortestPathLen = Infinity;
            const houseRooms: RoomId[] = ['KITCHEN_2', 'LIVING_2', 'BEDROOM_3', 'VERANDA', 'CORRIDOR', 'TOILET', 'KITCHEN', 'LIVING', 'PLAYER_ROOM', 'HALL'];
            for (const r of houseRooms) {
              if ((treatsRef.current[r] || 0) > 0 || (pateRef.current[r] || 0) > 0) {
                const path = findShortestPath(gPos, r);
                if (path && path.length < shortestPathLen) {
                  shortestPathLen = path.length;
                  foodRoom = r;
                }
              }
            }

            if (foodRoom) {
              // Dog smells food! Pathfind straight to it
              if (gPos === foodRoom) {
                // Garik eats the food!
                sound.playEat(getRoomPan(foodRoom));
                if (treatsRef.current[foodRoom] > 0) {
                  // Stole Milka's food! Milka gets mad.
                  setActiveTreats(prev => ({ ...prev, [foodRoom!]: 0 }));
                  setMilkaAngerLevel(prev => Math.min(2.5, prev + 0.35));
                }
                if (pateRef.current[foodRoom] > 0) {
                  // Stole the pâté! Milka gets furious!
                  setActivePate(prev => ({ ...prev, [foodRoom!]: 0 }));
                  setMilkaAngerLevel(prev => Math.min(2.5, prev + 0.5));
                }
              } else {
                // Pathfind step-by-step along the shortest path
                const path = findShortestPath(gPos, foodRoom);
                if (path && path.length > 1) {
                  const nextGPos = path[1];
                  setGarikPosition(nextGPos);
                  const nextGPan = getRoomPan(nextGPos);
                  sound.playDogFootsteps(nextGPan);
                  sound.playSniff(nextGPan);
                }
              }
            } else {
              // No food. Wander around randomly to direct neighbors
              const roll = Math.random();
              let wanderThreshold = 0.45;
              if (customNightConfig.active) {
                wanderThreshold = 0.2 + (customNightConfig.garikLevel / 20) * 0.5;
              }
              if (roll < wanderThreshold) {
                const neighbors = MILKA_CONNECTIONS[gPos] || [];
                if (neighbors.length > 0) {
                  const nextGPos = neighbors[Math.floor(Math.random() * neighbors.length)];
                  
                  if (nextGPos !== gPos) {
                    setGarikPosition(nextGPos);
                    const nextGPan = getRoomPan(nextGPos);
                    sound.playDogFootsteps(nextGPan);
                    if (nextGPos === 'LEFT_DOOR' || nextGPos === 'RIGHT_DOOR') {
                      sound.playSniff(nextGPan);
                      sound.playRustle(nextGPan);
                    }
                  }
                }
              } else if (roll < 0.7) {
                sound.playSniff(getRoomPan(gPos));
              }
            }

            // Check door arrival
            const activeGPos = garikPosRef.current;
            if (activeGPos === 'LEFT_DOOR') {
              if (leftDoorRef.current) {
                // Blocked! He scratches and retreats
                sound.playScratch(-0.75);
                setGarikPosition('LIVING');
              } else {
                // He enters and kills us immediately!
                clearInterval(interval);
                setJumpscareAttacker('garik');
                setGameState('JUMPSCARE');
              }
            } else if (activeGPos === 'RIGHT_DOOR') {
              if (rightDoorRef.current) {
                sound.playScratch(0.75);
                setGarikPosition('KITCHEN');
              } else {
                // He enters and kills us immediately!
                clearInterval(interval);
                setJumpscareAttacker('garik');
                setGameState('JUMPSCARE');
              }
            }
          }
        }
      }

      // 6.6 SHELLY AI LOGIC (Cat)
      if (customNightConfig.active && customNightConfig.shellyLevel === 0) {
        // Shelly is completely inactive
      } else {
        shellyMovementCheckCount++;
        let shellyLevel = currentNight;
        if (customNightConfig.active) {
          shellyLevel = customNightConfig.shellyLevel;
        }
        
        let shellyInterval = Math.max(4, 9 - Math.round(shellyLevel / 3.5));
        if (shellyMovementCheckCount >= shellyInterval) {
          shellyMovementCheckCount = 0;
          const sPos = shellyPosRef.current;

          if (sPos === 'STREET') {
            // Shelly spawns from the Street/Guest House. Chance increases with levels
            let spawnChance = 0.10 + shellyLevel * 0.12;
            if (Math.random() < spawnChance) {
              setShellyPosition('CORRIDOR');
              const cPan = getRoomPan('CORRIDOR');
              sound.playFootsteps(cPan);
            }
          } else if (sPos !== 'OFFICE') {
            // In the house! Shelly wants to sneak into the Office through doors
            const pathLeft = findShortestPath(sPos, 'LEFT_DOOR');
            const pathRight = findShortestPath(sPos, 'RIGHT_DOOR');
            let targetDoor: RoomId = 'LEFT_DOOR';
            if (pathLeft && pathRight) {
              targetDoor = pathLeft.length < pathRight.length ? 'LEFT_DOOR' : 'RIGHT_DOOR';
            }

            const path = findShortestPath(sPos, targetDoor);
            if (path && path.length > 1 && Math.random() < 0.85) {
              // Pathfind closer to the door
              const nextSPos = path[1];
              setShellyPosition(nextSPos);
              const pan = getRoomPan(nextSPos);
              sound.playFootsteps(pan);
            } else {
              // Wander randomly to a neighbor
              const neighbors = MILKA_CONNECTIONS[sPos] || [];
              if (neighbors.length > 0) {
                const nextSPos = neighbors[Math.floor(Math.random() * neighbors.length)];
                setShellyPosition(nextSPos);
                const pan = getRoomPan(nextSPos);
                sound.playFootsteps(pan);
              }
            }

            // Door Arrival Check immediately after step
            const activeSPos = shellyPosRef.current;
            if (activeSPos === 'LEFT_DOOR') {
              if (leftDoorRef.current) {
                // Blocked! She scratches and retreats
                sound.playScratch(-0.75);
                setShellyPosition('BEDROOM_3');
              } else {
                // Slip inside!
                setShellyPosition('OFFICE');
                sound.playCatHiss();
              }
            } else if (activeSPos === 'RIGHT_DOOR') {
              if (rightDoorRef.current) {
                // Blocked! She scratches and retreats
                sound.playScratch(0.75);
                setShellyPosition('KITCHEN');
              } else {
                // Slip inside!
                setShellyPosition('OFFICE');
                sound.playCatHiss();
              }
            }
          }
        }
      }

      // 7. SURVIVAL OFFICE HIDE-OUT TICKER
      // If Milka made it into the Office, she is sitting under your desk!
      if (milkaPosRef.current === 'OFFICE') {
        officeHideTime++;

        // If the player opens their monitor, OR if 3.5 seconds pass, they get jumped!
        const reactionLimit = Math.max(1.8, 4.5 - currentNight * 0.6); // faster jumpscare on higher nights
        
        if (monitorRef.current || officeHideTime >= reactionLimit || flashlightRef.current) {
          clearInterval(interval);
          setJumpscareAttacker('milka');
          setGameState('JUMPSCARE');
        }
      }

      // 8. ENTITY_4 (BROKEN MILKA) TICKER & SPAWN LOGIC
      if (entity_4PresentRef.current) {
        setEntity_4Timer(prev => {
          const nextVal = prev - 1;
          // If the player has the mask ON, she glitches out and disappears!
          if (maskOnRef.current) {
            setIsEntity_4Present(false);
            sound.playCameraInterference(0);
            return 0;
          }
          if (nextVal <= 0) {
            // Out of time! Corrupt jumpscare attacks!
            clearInterval(interval);
            setJumpscareAttacker('entity_4');
            setGameState('JUMPSCARE');
            return 0;
          }
          return nextVal;
        });
      } else {
        // Roll for spawning every 10 seconds
        entity_4MovementCheckCount++;
        if (entity_4MovementCheckCount >= 10) {
          entity_4MovementCheckCount = 0;
          
          let entity_4Active = false;
          let level = 0;
          
          if (customNightConfig && customNightConfig.active) {
            if (customNightConfig.entity_4Level && customNightConfig.entity_4Level > 0) {
              entity_4Active = true;
              level = customNightConfig.entity_4Level;
            }
          } else if (currentNight >= 6) {
            entity_4Active = true;
            level = currentNight;
          }

          if (entity_4Active) {
            const spawnChance = (level / 20) * 0.18; // Max 18% chance every 10 seconds
            if (Math.random() < spawnChance) {
              setIsEntity_4Present(true);
              setEntity_4Timer(3); // 3 seconds to react!
              sound.playCameraInterference(0);
              sound.playMeow(0.12, 0); // distorted creepy giant low meow
              sound.playCatHiss(0);
            }
          }
        }
      }

    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, currentNight, gameSave]);

  // Handle retry from game over screen
  const handleRetry = () => {
    // Record current stats
    const compensation = 10 + hoursSurvived * 15;
    saveGame({
      ...gameSave,
      coins: gameSave.coins + compensation
    });
    handleStartNight(currentNight);
  };

  // Switchboard render
  const renderCurrentState = () => {
    switch (gameState) {
      case 'MENU':
        return (
          <MainMenu
            gameSave={gameSave}
            soundConfig={soundConfig}
            onStartNight={handleStartNight}
            onStartCustomNight={handleStartCustomNight}
            onOpenShop={() => setGameState('SHOP')}
            onUpdateSoundConfig={handleUpdateSoundConfig}
            onResetSave={handleResetSave}
            language={language}
            onUpdateLanguage={handleUpdateLanguage}
          />
        );
      case 'INTRO':
        return (
          <IntroCutscene
            onComplete={() => {
              setGameState('MENU');
            }}
          />
        );
      case 'NIGHT_START':
        return (
          <div 
            id="night-start-card"
            className="flex flex-col items-center justify-center min-h-screen w-full bg-black font-mono select-none"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,#000_100%)] pointer-events-none z-10" />
            <div className="text-neutral-500 text-sm tracking-widest mb-2 animate-pulse uppercase">ЧЕРГУВАННЯ РОЗПОЧАТО</div>
            <h1 className="text-6xl font-extrabold text-neutral-100 mb-4 animate-[pulse_0.8s_infinite] tracking-wider uppercase">
              {currentNight === 5 ? 'НІЧ 5: ФІНАЛ' : `НІЧ ${currentNight}`}
            </h1>
            <div className="text-emerald-500 font-bold tracking-widest text-lg animate-pulse">12:00 AM</div>
            <div className="text-neutral-600 text-[10px] uppercase mt-12 max-w-xs text-center leading-relaxed">
              * Забезпечте повне підключення до камер спостереження та зачиняйте броньовані двері. Удачі.
            </div>
          </div>
        );
      case 'GAME':
        return (
          <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
            {/* Embedded helpful instruction rail */}
            <div className="w-full max-w-[1000px] flex items-center justify-between text-[11px] font-mono text-neutral-500 mb-2 border-b border-neutral-900 pb-2 select-none">
              <span className="flex items-center gap-1.5 uppercase">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                Чергування: Ніч {currentNight} • Порада: Закривайте двері заздалегідь!
              </span>
              <div className="flex gap-4">
                <span>[A / D] Закрити Двері</span>
                <span>[Q / E] Перевірити Світло</span>
                <span>[Space] Ліхтарик</span>
              </div>
            </div>

            <Office
              night={currentNight}
              timeString={timeString}
              power={power}
              battery={battery}
              upgrades={{
                ...gameSave.upgrades,
                treatsCount: runtimeTreatsCount,
                pateCount: runtimePateCount
              }}
              milkaPosition={milkaPosition}
              milkaState={milkaState}
              activeTreats={activeTreats}
              onCloseLeftDoor={setIsLeftDoorClosed}
              onCloseRightDoor={setIsRightDoorClosed}
              onDropTreat={handleDropTreat}
              onJumpscare={(attacker) => { setJumpscareAttacker(attacker || 'milka'); setGameState('JUMPSCARE'); }}
              isLeftDoorClosed={isLeftDoorClosed}
              isRightDoorClosed={isRightDoorClosed}
              useFlashlight={useFlashlight}
              setUseFlashlight={setUseFlashlight}
              leftLight={leftLight}
              setLeftLight={setLeftLight}
              rightLight={rightLight}
              setRightLight={setRightLight}
              camInterference={camInterference}
              onToggleMonitor={setIsMonitorOpen}
              isMonitorOpen={isMonitorOpen}
              isLampOn={isLampOn}
              setIsLampOn={setIsLampOn}
              onDropPate={handleDropPate}
              activePate={activePate}
              garikPosition={garikPosition}
              milkaAngerLevel={milkaAngerLevel}
              onCameraFlash={handleCameraFlash}
              isLampBatteryActive={isLampBatteryActive}
              unlockedTwelveNights={gameSave.unlockedTwelveNights}
              activeCam={activeCam}
              setActiveCam={setActiveCam}
              soundConfig={soundConfig}
              language={language}
              customNightConfig={customNightConfig}
              shellyPosition={shellyPosition}
              setShellyPosition={setShellyPosition}
              isMaskOn={isMaskOn}
              setIsMaskOn={setIsMaskOn}
              isPantryOpen={isPantryOpen}
              setIsPantryOpen={setIsPantryOpen}
              isEntity_4Present={isEntity_4Present}
            />
          </div>
        );
      case 'JUMPSCARE':
        return (
          <Jumpscare
            attacker={jumpscareAttacker}
            onComplete={() => {
              setGameState('GAMEOVER');
            }}
          />
        );
      case 'GAMEOVER':
        return (
          <GameOverScreen
            night={currentNight}
            timeString={timeString}
            hoursSurvived={hoursSurvived}
            onRetry={handleRetry}
            onOpenShop={() => setGameState('SHOP')}
            onBackToMenu={() => {
              // Add consolation coins first before exit!
              const compensation = 10 + hoursSurvived * 15;
              saveGame({
                ...gameSave,
                coins: gameSave.coins + compensation
              });
              setGameState('MENU');
            }}
          />
        );
      case 'VICTORY':
        return (
          <VictoryScreen
            night={currentNight}
            onNextNight={() => handleStartNight(currentNight + 1)}
            onBackToMenu={() => setGameState('MENU')}
            unlockedTwelveNights={gameSave.unlockedTwelveNights}
          />
        );
      case 'SHOP':
        return (
          <Shop
            coins={gameSave.coins}
            upgrades={gameSave.upgrades}
            onPurchase={handlePurchase}
            onBack={() => setGameState('MENU')}
          />
        );
      default:
        return <div>Unknown state</div>;
    }
  };

  return (
    <div id="milka-game-root" className="min-h-screen bg-black text-white selection:bg-red-900 select-none">
      {renderCurrentState()}
    </div>
  );
}
