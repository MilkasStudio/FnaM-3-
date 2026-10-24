/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RoomId = 
  | 'KITCHEN_2' 
  | 'LIVING_2' 
  | 'BEDROOM_3' 
  | 'VERANDA' 
  | 'CORRIDOR' 
  | 'TOILET' 
  | 'KITCHEN' 
  | 'LIVING' 
  | 'PLAYER_ROOM' 
  | 'HALL' 
  | 'STREET' 
  | 'ATTIC' 
  | 'GARDEN' 
  | 'GARAGE' 
  | 'OFFICE' 
  | 'LEFT_DOOR' 
  | 'RIGHT_DOOR';

export interface Room {
  id: RoomId;
  name: string;
  description: string;
  cameraName: string;
}

export type GameState = 
  | 'MENU' 
  | 'INTRO' 
  | 'NIGHT_START' 
  | 'GAME' 
  | 'JUMPSCARE' 
  | 'GAMEOVER' 
  | 'VICTORY' 
  | 'SHOP';

export interface Upgrades {
  batteryCap: number; // Level 1 to 5
  doorEfficiency: number; // Level 1 to 5
  flashlightPower: number; // Level 1 to 5
  cameraStability: number; // Level 1 to 5
  treatsCount: number; // Current quantity of cat food/treats
  pateCount: number; // Current quantity of pâté
  lampBatteries: number; // Current quantity of lamp batteries
  generatorSpeed: number; // Level 1 to 5
}

export interface GameSave {
  unlockedNight: number;
  coins: number;
  upgrades: Upgrades;
  unlockedTwelveNights?: boolean;
  unlockedAchievements?: string[];
}

export interface SoundConfig {
  musicVolume: number;
  sfxVolume: number;
  jumpscaresEnabled: boolean;
  phoneCallsEnabled: boolean;
}

export interface CameraInterference {
  active: boolean;
  intensity: number; // 0 to 1
}

export interface GameEvent {
  id: string;
  text: string;
  type: 'meow' | 'blackout' | 'whisper' | 'flicker' | 'camera_error';
  timeRemaining: number;
}

export interface CustomNightConfig {
  active: boolean;
  milkaLevel: number; // 0-20
  shellyLevel: number; // 0-20
  garikLevel: number; // 0-20
  entity_4Level?: number; // 0-20
  freeLamp: boolean; // unlimited lamp battery, no drain
  infiniteFlashlight: boolean; // flashlight doesn't drain battery
  doublePower: boolean; // start with 200% power
  moreTreats: boolean; // start with extra treats and pate (+5 of each)
  radarActive: boolean; // show Milka's position on HUD
}
