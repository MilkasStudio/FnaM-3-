/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { RoomId, Upgrades, CameraInterference, SoundConfig, CustomNightConfig } from '../types';
import { sound } from './SoundManager';
import { Power, Eye, EyeOff, Radio, ShieldAlert, Zap, Heart, Phone, PhoneOff } from 'lucide-react';
import { Language, getTranslation } from '../translations';
import milkaCreepyImage from '../assets/images/milka_creepy_1789325964123.jpg';
import milkaNormalImage from '../assets/images/milka_normal_1789325952070.jpg';
import shellyNormalImage from '../assets/images/shelly_normal_1789325998843.jpg';

export const getRoomPan = (rid: RoomId | 'STREET' | 'OFFICE'): number => {
  switch (rid) {
    case 'LIVING':
    case 'LIVING_2':
    case 'HALL':
    case 'BEDROOM_3':
    case 'LEFT_DOOR':
      return -0.75;
    case 'KITCHEN':
    case 'KITCHEN_2':
    case 'VERANDA':
    case 'TOILET':
    case 'RIGHT_DOOR':
      return 0.75;
    default:
      return 0; // center
  }
};

interface OfficeProps {
  night: number;
  timeString: string;
  power: number;
  battery: number;
  upgrades: Upgrades;
  milkaPosition: RoomId;
  milkaState: number; // 0: normal, 1: looking away, 2: staring, 3: block
  activeTreats: Record<RoomId, number>; // room -> timer
  onCloseLeftDoor: (closed: boolean) => void;
  onCloseRightDoor: (closed: boolean) => void;
  onDropTreat: (roomId: RoomId) => void;
  onJumpscare: (attacker?: 'milka' | 'garik' | 'shelly') => void;
  isLeftDoorClosed: boolean;
  isRightDoorClosed: boolean;
  useFlashlight: boolean;
  setUseFlashlight: (active: boolean) => void;
  leftLight: boolean;
  setLeftLight: (active: boolean) => void;
  rightLight: boolean;
  setRightLight: (active: boolean) => void;
  camInterference: CameraInterference;
  onToggleMonitor: (open: boolean) => void;
  isMonitorOpen: boolean;
  isLampOn: boolean;
  setIsLampOn: (active: boolean) => void;
  onDropPate: (roomId: RoomId) => void;
  activePate: Record<RoomId, number>;
  garikPosition: RoomId | 'STREET';
  milkaAngerLevel: number;
  onCameraFlash: (roomId: RoomId) => void;
  isLampBatteryActive: boolean;
  unlockedTwelveNights?: boolean;
  activeCam?: RoomId;
  setActiveCam?: (roomId: RoomId) => void;
  soundConfig: SoundConfig;
  language: Language;
  customNightConfig?: CustomNightConfig;
  shellyPosition?: RoomId;
  setShellyPosition?: (roomId: RoomId) => void;
  isMaskOn: boolean;
  setIsMaskOn: (active: boolean) => void;
  isPantryOpen: boolean;
  setIsPantryOpen: (active: boolean) => void;
  isEntity_4Present?: boolean;
}

const OWNER_CALL_SCRIPTS: Record<'en' | 'uk' | 'ru', Record<number, string[]>> = {
  en: {
    1: [
      "Hello? Hello! Uh, welcome to your first night in our house! I'm the owner.",
      "My family went on vacation, so thank you so much for watching the place.",
      "First, let's talk about our cat, Milka. She... gets a bit weird after midnight.",
      "Her eyes glow bright green, and she starts wandering through the rooms.",
      "If you see her at the Left Door, turn on the light and close it immediately!",
      "Oh, and keep an eye on your backup generator. Power is limited. Good luck!"
    ],
    2: [
      "Hey there! Glad you made it to Night 2.",
      "Today, our dog Garik might show up. He is always extremely hungry!",
      "He sneaks in from the street to search for treats or pâté in the corridors.",
      "If he eats food from any room, Milka gets absolutely furious and aggressive!",
      "If you hear sniffing at your doors, lock them right away.",
      "If he gets inside your office, he will steal treats directly from your inventory!"
    ],
    3: [
      "Hello again! You're doing great.",
      "Let's talk about Shelly. She's my second cat, sleeping right on the floor to your left.",
      "She doesn't wander around, but she gets stressed and starts waking up.",
      "When she wakes up, pan fully to the left, click and hold the 'PET' button.",
      "Keep her calm! If she gets too stressed, she'll scratch your screen and block your view!",
      "It doesn't kill you, but the scratches make it very hard to see the cameras."
    ],
    4: [
      "Hey! Night 4 already. Things are getting pretty intense.",
      "Remember, you can toss treats and pâté using the camera monitor to distract Milka.",
      "Pâté pacifies her for a long time, but remember that Garik can smell it too!",
      "If Garik runs to eat her pâté first, she will get very angry.",
      "Also, keep an eye on your desk lamp battery. It can save you some power.",
      "You are doing awesome. Almost there!"
    ],
    5: [
      "This is the final night! The final stretch!",
      "Milka is extremely aggressive tonight, she won't slow down at all.",
      "You need to use everything you've learned. Stay alert!",
      "Keep doors closed when they approach, pet Shelly regularly, and use treats wisely.",
      "Don't let Garik steal your supplies or ruin your night.",
      "I'm coming home tomorrow. Survive until 6 AM and you're free!"
    ]
  },
  uk: {
    1: [
      "Алло? Алло! О, привіт! Вітаю з першою ніччю у нашому будинку. Я господар.",
      "Ми з родиною поїхали у відпустку, тож дуже дякую, що доглядаєш за домом.",
      "Давай коротко про нашу кішку Мілку. Вона... стає дивною після опівночі.",
      "Її очі світяться зеленим, і вона починає блукати кімнатами.",
      "Якщо побачиш її силует біля Лівих Дверей — увімкни світло і зачини їх!",
      "О, і стеж за генератором. Електроенергія обмежена. Удачі!"
    ],
    2: [
      "Привіт! Радий, що ти протримався до другої ночі.",
      "Сьогодні може прийти наш пес Гарік. Він завжди надзвичайно голодний!",
      "Він забігає з вулиці у пошуках ласощів або паштету в коридорах.",
      "Якщо він з'їсть їжу в якійсь кімнаті, Мілка дуже розлютиться і стане агресивнішою!",
      "Якщо почуєш шурхіт чи сопіння біля дверей — негайно зачиняй їх.",
      "Якщо він пролізе в офіс, то вкраде запаси смаколиків прямо з твоїх кишень!"
    ],
    3: [
      "Привіт знову! Ти чудово справляєшся.",
      "Давай поговоримо про Шеллі. Це моя друга кішечка, вона спить на підлозі зліва від тебе.",
      "Вона не ходить будинком, але іноді лякається і починає прокидатися.",
      "Коли вона почне прокидатися, повернися повністю ліворуч і затисни кнопку «ПОГЛАДИТИ».",
      "Заспокой її! Якщо вона розхвилюється, то сильно подряпає твій екран пазурами!",
      "Це не вб'є тебе, але через глибокі подряпини буде дуже важко бачити камери."
    ],
    4: [
      "Привіт! Уже четверта ніч. Стає гаряче і напружено.",
      "Пам'ятай, що ти можеш кидати ласощі та паштет через камери, щоб відволікти Мілку.",
      "Паштет заспокоює її надовго, але пам'ятай, що Гарік теж чує запах!",
      "Якщо Гарік з'їсть її паштет першим, Мілка сильно розлютиться.",
      "Також стеж за батарейкою настільної лампи. Вона економить твою енергію.",
      "Ти чудово тримаєшся. Майже фініш!"
    ],
    5: [
      "Це фінальна п'ята ніч! Останній ривок!",
      "Мілка сьогодні надзвичайно агресивна, вона взагалі не збирається зупинятися.",
      "Тобі потрібно використовувати все, чого ти навчився. Будь уважним!",
      "Вчасно зачиняй двері, заспокоюй Шеллі, розумно використовуй корм і паштет.",
      "Не дай Гаріку вкрасти твої припаси або зіпсувати ніч.",
      "Я повертаюся вже завтра. Виживи до 6 ранку і ти вільний!"
    ]
  },
  ru: {
    1: [
      "Алло? Алло! О, привет! Поздравляю с первой ночью в нашем доме. Я хозяин.",
      "Мы уехали в отпуск всей семьей, так что спасибо, что приглядываешь за домом.",
      "Давай вкратце о нашей кошке Милке. Она... становится странной после полуночи.",
      "Её глаза светятся зеленым, и она начинает бродить по комнатам.",
      "Если увидишь её силуэт у Левой Двери — включи свет и закрой её немедленно!",
      "О, и следи за генератором. Запас энергии ограничен. Удачи!"
    ],
    2: [
      "Привет! Рад, что ты продержался до второй ночи.",
      "Сегодня может прийти наш пес Гарик. Он всегда очень голодный!",
      "Он забегает с улицы в поисках лакомств или паштета в коридорах.",
      "Если он съест еду в какой-то комнате, Милка сильно разозлится и станет агрессивнее!",
      "Если услышишь сопение у дверей — закрывай их как можно быстрее.",
      "Если он пролезет в офис, то украдет запасы вкусняшек прямо из твоих карманов!"
    ],
    3: [
      "Привет снова! Ты отлично справляешься.",
      "Давай поговорим о Шелли. Это моя вторая кошечка, она спит на полу слева от тебя.",
      "Она не бродит по дому, но иногда пугается и начинает просыпаться.",
      "Когда она начнет просыпаться, повернись полностью налево и зажми кнопку «ПОГЛАДИТЬ».",
      "Успокой её! Если она разволнуется, то сильно поцарапает твой экран когтями!",
      "Это не убивает тебя, но из-за глубоких царапин будет очень трудно видеть камеры."
    ],
    4: [
      "Привет! Уже четвертая ночь. Становится жарко и напряженно.",
      "Помни, что ты можешь бросать лакомства и паштет через камеры, чтобы отвлечь Милку.",
      "Паштет успокаивает её надолго, но помни, что Гарик тоже чует этот запах!",
      "Если Гарик съест её паштет первым, Милка сильно разозлится.",
      "Также следи за батарейкой настольной лампы. Она экономит твою энергию.",
      "Ты отлично держишься. Почти финиш!"
    ],
    5: [
      "Это финальная пятая ночь! Последний рывок!",
      "Милка сегодня чрезвычайно агрессивна, она вообще не собирается останавливаться.",
      "Тебе нужно использовать всё, чему ты научился. Будь начеку!",
      "Вовремя закрывай двери, успокаивай Шелли, разумно используй корм и паштет.",
      "Не дай Гарику украсть твои припасы или испортить тебе ночь.",
      "Я возвращаюсь уже завтра. Выживи до 6 утра и ты свободен!"
    ]
  }
};

const BONUS_SCRIPTS: Record<'en' | 'uk' | 'ru', string[]> = {
  en: [
    "Hello? Wow, you are still here?! This is a bonus challenge night!",
    "The pets are completely wild tonight. Stay extremely focused.",
    "Monitor all security cameras, and use your food supplies very carefully.",
    "You are a true survival expert now. Show them what you've got!"
  ],
  uk: [
    "Алло? Ого, ти все ще тут?! Це додаткова ніч випробувань!",
    "Тварини сьогодні абсолютно скажені. Будь максимально зосередженим.",
    "Стеж за всіма камерами спостереження та дуже економно використовуй припаси.",
    "Ти вже справжній профі з виживання. Покажи їм на що здатний!"
  ],
  ru: [
    "Алло? Ого, ты всё еще тут?! Это дополнительная ночь испытаний!",
    "Животные сегодня абсолютно бешеные. Будь максимально сосредоточенным.",
    "Следи за всеми камерами слежения и очень экономно используй припасы.",
    "Ты уже настоящий профи выживания. Покажи им на что способен!"
  ]
};

function playSynthesizedRing(audioCtx: AudioContext) {
  try {
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc2.frequency.setValueAtTime(450, audioCtx.currentTime);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    gainNode.gain.setValueAtTime(0.0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime + 1.2);
    gainNode.gain.linearRampToValueAtTime(0.0, audioCtx.currentTime + 1.4);

    osc1.start();
    osc2.start();

    setTimeout(() => {
      try {
        osc1.stop();
        osc2.stop();
        osc1.disconnect();
        osc2.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    }, 1500);
  } catch (err) {}
}

function startStaticHum(audioCtx: AudioContext): { stop: () => void } {
  try {
    const osc = audioCtx.createOscillator();
    const noiseOsc = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, audioCtx.currentTime);

    noiseOsc.type = 'triangle';
    noiseOsc.frequency.setValueAtTime(350, audioCtx.currentTime);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, audioCtx.currentTime);
    filter.Q.setValueAtTime(2.0, audioCtx.currentTime);

    osc.connect(filter);
    noiseOsc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    gain.gain.setValueAtTime(0.012, audioCtx.currentTime);

    osc.start();
    noiseOsc.start();

    return {
      stop: () => {
        try {
          osc.stop();
          noiseOsc.stop();
          osc.disconnect();
          noiseOsc.disconnect();
          filter.disconnect();
          gain.disconnect();
        } catch (e) {}
      }
    };
  } catch (err) {
    return { stop: () => {} };
  }
}

function playTypingChirp(audioCtx: AudioContext) {
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(550 + Math.random() * 300, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.002, audioCtx.currentTime + 0.01);
    gain.gain.setValueAtTime(0.002, audioCtx.currentTime + 0.02);
    gain.gain.linearRampToValueAtTime(0.0, audioCtx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    setTimeout(() => {
      try {
        osc.stop();
        osc.disconnect();
        gain.disconnect();
      } catch (e) {}
    }, 80);
  } catch (err) {}
}

function speakSentence(text: string, voiceLang: 'en' | 'uk' | 'ru', onEnd: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onEnd();
    return;
  }

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    let langCode = 'en-US';
    if (voiceLang === 'uk') langCode = 'uk-UA';
    if (voiceLang === 'ru') langCode = 'ru-RU';

    utterance.lang = langCode;

    const matchingVoice = voices.find(v => v.lang.startsWith(langCode));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.pitch = 0.9;
    utterance.rate = 0.95;

    utterance.onend = () => {
      onEnd();
    };

    utterance.onerror = () => {
      onEnd();
    };

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    onEnd();
  }
}

export default function Office({
  night,
  timeString,
  power,
  battery,
  upgrades,
  milkaPosition,
  milkaState,
  activeTreats,
  onCloseLeftDoor,
  onCloseRightDoor,
  onDropTreat,
  onJumpscare,
  isLeftDoorClosed,
  isRightDoorClosed,
  useFlashlight,
  setUseFlashlight,
  leftLight,
  setLeftLight,
  rightLight,
  setRightLight,
  camInterference,
  onToggleMonitor,
  isMonitorOpen,
  isLampOn,
  setIsLampOn,
  onDropPate,
  activePate,
  garikPosition,
  milkaAngerLevel,
  onCameraFlash,
  isLampBatteryActive,
  unlockedTwelveNights,
  activeCam: propActiveCam,
  setActiveCam: propSetActiveCam,
  soundConfig,
  language,
  customNightConfig,
  shellyPosition,
  setShellyPosition,
  isMaskOn,
  setIsMaskOn,
  isPantryOpen,
  setIsPantryOpen,
  isEntity_4Present = false
}: OfficeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const monitorCanvasRef = useRef<HTMLCanvasElement>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const leftDoorProgressRef = useRef<number>(isLeftDoorClosed ? 1 : 0);
  const rightDoorProgressRef = useRef<number>(isRightDoorClosed ? 1 : 0);
  const shakeRef = useRef<number>(0);
  
  interface DustParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
  }
  const particlesRef = useRef<DustParticle[]>([]);
  
  const [mouseX, setMouseX] = useState<number>(400);
  const [mouseY, setMouseY] = useState<number>(300);
  
  const [internalActiveCam, setInternalActiveCam] = useState<RoomId>('KITCHEN_2');
  const activeCam = propActiveCam || internalActiveCam;
  const setActiveCam = propSetActiveCam || setInternalActiveCam;

  const [lastNoiseToggle, setLastNoiseToggle] = useState(0);
  const [staticOffset, setStaticOffset] = useState(0);

  const flashIntensityRef = useRef(0);
  const lastToggleTimeRef = useRef<number>(0);
  const [isFlashCooldown, setIsFlashCooldown] = useState(false);
  const [flashCooldownTime, setFlashCooldownTime] = useState(0);

  // Shelly (New Character) States
  const [shellyState, setShellyState] = useState<'SLEEPING' | 'WAKING_UP'>('SLEEPING');
  const [shellyTimer, setShellyTimer] = useState<number>(0); // countdown in seconds when waking up
  const [petProgress, setPetProgress] = useState<number>(0);
  const [isPetting, setIsPetting] = useState<boolean>(false);
  const [scratchIntensity, setScratchIntensity] = useState<number>(0); // 0 (clean) to 1 (scratched)

  // Phone Call (Owner Call) states
  const [callState, setCallState] = useState<'RINGING' | 'ACTIVE' | 'NONE'>('NONE');
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0);
  const [typedText, setTypedText] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Phone Ringing and Mute lifecycle
  useEffect(() => {
    if (!soundConfig.phoneCallsEnabled) {
      setCallState('NONE');
      return;
    }

    setCallState('RINGING');
    setIsMuted(false);
    setCurrentLineIndex(0);
    setTypedText('');

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();

    let ringInterval: NodeJS.Timeout;
    let ringCount = 0;
    
    playSynthesizedRing(audioCtx);
    ringCount++;

    ringInterval = setInterval(() => {
      ringCount++;
      if (ringCount > 3) {
        clearInterval(ringInterval);
        setCallState('ACTIVE');
      } else {
        playSynthesizedRing(audioCtx);
      }
    }, 2500);

    return () => {
      clearInterval(ringInterval);
      try {
        audioCtx.close().catch(() => {});
      } catch (e) {}
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [night, soundConfig.phoneCallsEnabled]);

  // Active call dialogue progression
  useEffect(() => {
    if (callState !== 'ACTIVE' || isMuted) {
      return;
    }

    const scriptsForLang = OWNER_CALL_SCRIPTS[language] || OWNER_CALL_SCRIPTS['en'];
    let scriptLines = scriptsForLang[night] || BONUS_SCRIPTS[language] || BONUS_SCRIPTS['en'];

    if (currentLineIndex >= scriptLines.length) {
      setCallState('NONE');
      return;
    }

    const currentLine = scriptLines[currentLineIndex];

    setTypedText('');
    let charIndex = 0;
    let typeInterval: NodeJS.Timeout;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const localAudioCtx = AudioContextClass ? new AudioContextClass() : null;
    let staticHumObj: { stop: () => void } | null = null;

    if (localAudioCtx) {
      staticHumObj = startStaticHum(localAudioCtx);
    }

    typeInterval = setInterval(() => {
      if (charIndex < currentLine.length) {
        setTypedText(prev => prev + currentLine.charAt(charIndex));
        charIndex++;

        if (localAudioCtx && Math.random() < 0.45) {
          playTypingChirp(localAudioCtx);
        }
      } else {
        clearInterval(typeInterval);
      }
    }, 35);

    let backupTimeout: NodeJS.Timeout;
    
    speakSentence(currentLine, language, () => {
      setTimeout(() => {
        setCurrentLineIndex(prev => prev + 1);
      }, 1200);
    });

    const speakDuration = Math.max(5000, currentLine.length * 65 + 3500);
    backupTimeout = setTimeout(() => {
      if (typeof window !== 'undefined' && !window.speechSynthesis.speaking) {
        setCurrentLineIndex(prev => prev + 1);
      }
    }, speakDuration);

    return () => {
      clearInterval(typeInterval);
      clearTimeout(backupTimeout);
      if (staticHumObj) {
        staticHumObj.stop();
      }
      if (localAudioCtx) {
        localAudioCtx.close().catch(() => {});
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [callState, currentLineIndex, isMuted, language, night]);

  const petTimerRef = useRef<NodeJS.Timeout | null>(null);
  const purrSoundIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startPetting = () => {
    if (shellyState !== 'WAKING_UP') return;
    setIsPetting(true);
    sound.playPurr();
    
    // Play a repeating purr sound every 600ms while petting
    purrSoundIntervalRef.current = setInterval(() => {
      sound.playPurr();
    }, 600);

    const tickMs = 100;
    // 3 seconds = 30 ticks of 100ms
    const increment = 100 / 30;

    petTimerRef.current = setInterval(() => {
      setPetProgress(prev => {
        const next = prev + increment;
        if (next >= 100) {
          // SUCCESS!
          if (petTimerRef.current) clearInterval(petTimerRef.current);
          if (purrSoundIntervalRef.current) clearInterval(purrSoundIntervalRef.current);
          
          setIsPetting(false);
          setShellyState('SLEEPING');
          setPetProgress(0);
          sound.playPurrSuccess();
          return 0;
        }
        return next;
      });
    }, tickMs);
  };

  const stopPetting = () => {
    setIsPetting(false);
    if (petTimerRef.current) {
      clearInterval(petTimerRef.current);
      petTimerRef.current = null;
    }
    if (purrSoundIntervalRef.current) {
      clearInterval(purrSoundIntervalRef.current);
      purrSoundIntervalRef.current = null;
    }
    setPetProgress(0);
  };

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (petTimerRef.current) clearInterval(petTimerRef.current);
      if (purrSoundIntervalRef.current) clearInterval(purrSoundIntervalRef.current);
    };
  }, []);

  // Shelly's autonomous simulation tick (Runs every second)
  useEffect(() => {
    const interval = setInterval(() => {
      if (shellyPosition !== 'OFFICE') {
        setShellyState('SLEEPING');
        setShellyTimer(0);
        return;
      }

      setShellyState(currentState => {
        if (currentState === 'SLEEPING') {
          // If she just entered the Office, wake her up automatically!
          setShellyTimer(Math.max(8, 20 - night * 2));
          return 'WAKING_UP';
        } else if (currentState === 'WAKING_UP') {
          if (!isPetting) {
            setShellyTimer(prev => {
              if (prev <= 1) {
                if (isMaskOn) {
                  // Confused by the Milka mask, Shelly meows and retreats back to the street!
                  sound.playMeow();
                  setShellyState('SLEEPING');
                  if (setShellyPosition) {
                    setShellyPosition('STREET');
                  }
                  return 0;
                } else {
                  // No mask! ATTACK! Shelly jumpscares and kills the player!
                  sound.playCatHiss();
                  onJumpscare('shelly');
                  return 0;
                }
              }
              return prev - 1;
            });
          }
        }
        return currentState;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [night, isPetting, shellyPosition, setShellyPosition, isMaskOn, onJumpscare]);

  // Decay scratch marks overlay over time
  useEffect(() => {
    const interval = setInterval(() => {
      setScratchIntensity(prev => {
        if (prev > 0) {
          // Slow recovery rate: ~10 seconds to fully clear up
          return Math.max(0, prev - 0.015);
        }
        return 0;
      });
    }, 150);
    return () => clearInterval(interval);
  }, []);

  // Load generated images
  const creepyImgRef = useRef<HTMLImageElement | null>(null);
  const normalImgRef = useRef<HTMLImageElement | null>(null);
  const shellyImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const creepy = new Image();
    creepy.onload = () => { creepyImgRef.current = creepy; };
    creepy.src = milkaCreepyImage;

    const normal = new Image();
    normal.onload = () => { normalImgRef.current = normal; };
    normal.src = milkaNormalImage;

    const shellyImg = new Image();
    shellyImg.onload = () => { shellyImgRef.current = shellyImg; };
    shellyImg.src = shellyNormalImage;
  }, []);

  // Monitor toggle with hover protection cooldown
  const toggleMonitor = () => {
    const now = Date.now();
    if (now - lastToggleTimeRef.current < 450) {
      return; // prevent fast hover jitter
    }
    lastToggleTimeRef.current = now;
    sound.playCameraSwitch();
    onToggleMonitor(!isMonitorOpen);
  };

  // Keyboard controls: space for flashlight, letters for doors/lights
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPantryOpen) {
        if (e.key === 'Escape' || e.key === 'p' || e.key === 'P' || e.key === 'з' || e.key === 'З') {
          setIsPantryOpen(false);
          sound.playClick();
        }
        return;
      }

      if (isMonitorOpen) {
        if (e.key === 'Control' || e.key === 'c' || e.key === 'С' || e.key === 'с') {
          toggleMonitor();
        }
        return;
      }

      // Toggle Milka's Mask on [M]
      if (e.key === 'm' || e.key === 'M' || e.key === 'ь' || e.key === 'Ь') {
        if (power > 0) {
          const newMaskState = !isMaskOn;
          setIsMaskOn(newMaskState);
          sound.playClick();
          if (newMaskState) {
            setUseFlashlight(false);
            setLeftLight(false);
            setRightLight(false);
          }
        }
        return;
      }

      // Toggle Pantry on [P]
      if (e.key === 'p' || e.key === 'P' || e.key === 'з' || e.key === 'З') {
        if (power > 0 && !isMaskOn && !isMonitorOpen) {
          setIsPantryOpen(true);
          sound.playClick();
          setUseFlashlight(false);
          setLeftLight(false);
          setRightLight(false);
        }
        return;
      }

      if (isMaskOn) return; // ignore all other actions if wearing the mask!

      if (e.code === 'Space') {
        e.preventDefault();
        if (battery > 0 && power > 0) {
          setUseFlashlight(true);
        }
      }
      if (e.key === 'a' || e.key === 'A' || e.key === 'ф' || e.key === 'Ф') {
        sound.playDoorToggle(!isLeftDoorClosed, -0.75);
        onCloseLeftDoor(!isLeftDoorClosed);
      }
      if (e.key === 'd' || e.key === 'D' || e.key === 'в' || e.key === 'В') {
        sound.playDoorToggle(!isRightDoorClosed, 0.75);
        onCloseRightDoor(!isRightDoorClosed);
      }
      if (e.key === 'q' || e.key === 'Q' || e.key === 'й' || e.key === 'Й') {
        if (power > 0) {
          sound.playClick(-0.75);
          setLeftLight(!leftLight);
          setRightLight(false);
        }
      }
      if (e.key === 'e' || e.key === 'E' || e.key === 'у' || e.key === 'У') {
        if (power > 0) {
          sound.playClick(0.75);
          setRightLight(!rightLight);
          setLeftLight(false);
        }
      }
      if (e.key === 'l' || e.key === 'L' || e.key === 'д' || e.key === 'Д') {
        if (power > 0) {
          sound.playLampToggle();
          setIsLampOn(!isLampOn);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setUseFlashlight(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isMonitorOpen, isLeftDoorClosed, isRightDoorClosed, leftLight, rightLight, power, battery, isMaskOn, isPantryOpen, setIsMaskOn, setUseFlashlight, setLeftLight, setRightLight]);

  // Track mouse panning in office
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMouseX(e.clientX - rect.left);
    setMouseY(e.clientY - rect.top);
  };

  // Noise loop for CRT monitor static
  useEffect(() => {
    const interval = setInterval(() => {
      setStaticOffset(prev => (prev + 1) % 10);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // OFFICE CANVAS RENDER LOOP
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isMonitorOpen) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimensions
    const cw = 1400; // virtual canvas width
    const ch = 600;  // virtual canvas height
    
    // Calculate scroll offset based on mouse position
    // Center point is cw/2, container width is typically 1000px
    const containerW = containerRef.current?.getBoundingClientRect().width || 1000;
    const maxScroll = cw - containerW;
    const ratio = mouseX / containerW;
    const scrollX = Math.max(0, Math.min(maxScroll, ratio * maxScroll));

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, cw, ch);

      // Camera ambient bobbing/breathing effect (gently sways the scene)
      const breathX = Math.sin(Date.now() / 1600) * 2.2;
      const breathY = Math.cos(Date.now() / 1900) * 1.6;
      
      // Decay screen shake
      shakeRef.current *= 0.88;
      if (shakeRef.current < 0.1) {
        shakeRef.current = 0;
      }
      
      const camShakeX = shakeRef.current > 0 ? (Math.random() - 0.5) * shakeRef.current : 0;
      const camShakeY = shakeRef.current > 0 ? (Math.random() - 0.5) * shakeRef.current : 0;

      ctx.save();
      ctx.translate(breathX + camShakeX, breathY + camShakeY);

      // 1. Draw Checkerboard Floor (3D perspective lines)
      ctx.fillStyle = '#111';
      ctx.fillRect(0, ch / 2, cw, ch / 2);

      ctx.fillStyle = '#222';
      const floorYStart = ch / 2;
      const totalFloorRows = 12;
      
      for (let i = 0; i < totalFloorRows; i++) {
        const y1 = floorYStart + (ch / 2) * Math.pow(i / totalFloorRows, 2.2);
        const y2 = floorYStart + (ch / 2) * Math.pow((i + 1) / totalFloorRows, 2.2);
        const h = y2 - y1;
        
        if (i % 2 === 0) {
          ctx.fillStyle = '#181818';
        } else {
          ctx.fillStyle = '#0f0f0f';
        }
        ctx.fillRect(0, y1, cw, h);

        // Perspective grid tiles (checkerboard segments)
        const colsCount = 20;
        for (let j = 0; j < colsCount; j++) {
          if ((i + j) % 2 === 0) {
            ctx.fillStyle = '#1f1f1f';
            
            ctx.beginPath();
            // Projecting grid boundaries
            const getX = (colIdx: number, rowY: number) => {
              const centerVal = cw / 2;
              const distanceFromCenter = (colIdx - colsCount / 2) * (cw / colsCount);
              const perspectiveFactor = (rowY - floorYStart) / (ch / 2);
              return centerVal + distanceFromCenter * perspectiveFactor;
            };

            ctx.moveTo(getX(j, y1), y1);
            ctx.lineTo(getX(j + 1, y1), y1);
            ctx.lineTo(getX(j + 1, y2), y2);
            ctx.lineTo(getX(j, y2), y2);
            ctx.closePath();
            ctx.fill();
          }
        }
      }

      // 2. Draw Walls & Ceiling perspective
      // Back wall is a rectangle in the center
      const bwW = 750;
      const bwH = 300;
      const bwX = (cw - bwW) / 2;
      const bwY = 100;

      // Draw Ceiling
      ctx.fillStyle = '#080808';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(cw, 0);
      ctx.lineTo(bwX + bwW, bwY);
      ctx.lineTo(bwX, bwY);
      ctx.closePath();
      ctx.fill();

      // Ceiling details (vent pipe)
      ctx.fillStyle = '#151515';
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cw / 2 - 40, 0);
      ctx.lineTo(cw / 2 - 25, bwY);
      ctx.lineTo(cw / 2 + 25, bwY);
      ctx.lineTo(cw / 2 + 40, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw Back Wall
      ctx.fillStyle = '#171717';
      ctx.fillRect(bwX, bwY, bwW, bwH);
      
      // Horizontal wall plank lines
      ctx.strokeStyle = '#0c0c0c';
      ctx.lineWidth = 1;
      for (let y = bwY + 20; y < bwY + bwH; y += 25) {
        ctx.beginPath();
        ctx.moveTo(bwX, y);
        ctx.lineTo(bwX + bwW, y);
        ctx.stroke();
      }

      // Left Wall (Perspective triangle)
      ctx.fillStyle = '#121212';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(bwX, bwY);
      ctx.lineTo(bwX, bwY + bwH);
      ctx.lineTo(0, ch);
      ctx.closePath();
      ctx.fill();

      // Right Wall (Perspective triangle)
      ctx.fillStyle = '#121212';
      ctx.beginPath();
      ctx.moveTo(cw, 0);
      ctx.lineTo(bwX + bwW, bwY);
      ctx.lineTo(bwX + bwW, bwY + bwH);
      ctx.lineTo(cw, ch);
      ctx.closePath();
      ctx.fill();

      // 3. Draw Left and Right Doorways (Open slots)
      // 3. Draw Ventilation Shaft and Right Doorway (Open slots)
      const doorW = 120;
      const doorH = 320;
      
      // Ventilation Shaft Dimensions (at the back)
      const ventW = 120;
      const ventH = 120;
      const ventX = bwX + 110; // offset inside the back wall
      const ventY = bwY + bwH - ventH - 10; // sitting just above the floor
      
      // Keep lDoorX/Y mapped for compatibility
      const lDoorX = ventX;
      const lDoorY = ventY;

      // Right Doorway
      const rDoorX = bwX + bwW - 40;
      const rDoorY = bwY + 20;

      // --- Draw Solid Left Wall & Retro Poster ---
      // Poster backing (in perspective)
      ctx.fillStyle = '#1e293b'; // slate poster backing
      ctx.beginPath();
      ctx.moveTo(bwX - 220, bwY + 60);
      ctx.lineTo(bwX - 100, bwY + 80);
      ctx.lineTo(bwX - 100, bwY + 220);
      ctx.lineTo(bwX - 220, bwY + 240);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Poster inner paper
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(bwX - 210, bwY + 70);
      ctx.lineTo(bwX - 110, bwY + 85);
      ctx.lineTo(bwX - 110, bwY + 215);
      ctx.lineTo(bwX - 210, bwY + 230);
      ctx.closePath();
      ctx.fill();

      // Poster text & design "CELEBRATE & SURVIVE!"
      ctx.fillStyle = '#dc2626'; // bold red
      ctx.font = 'bold 11px "Space Grotesk", sans-serif';
      ctx.save();
      // slant text slightly for perspective
      ctx.translate(bwX - 160, bwY + 110);
      ctx.rotate(0.08);
      ctx.textAlign = 'center';
      ctx.fillText('CELEBRATE', 0, 0);
      ctx.fillStyle = '#2563eb'; // blue
      ctx.fillText('MILKA & CO!', 0, 16);
      ctx.restore();

      // Draw cute cat face drawing on the poster
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(bwX - 160, bwY + 170, 16, 0, Math.PI * 2);
      ctx.fill();
      // cat ears
      ctx.beginPath();
      ctx.moveTo(bwX - 176, bwY + 165);
      ctx.lineTo(bwX - 182, bwY + 148);
      ctx.lineTo(bwX - 168, bwY + 160);
      ctx.moveTo(bwX - 144, bwY + 165);
      ctx.lineTo(bwX - 138, bwY + 148);
      ctx.lineTo(bwX - 152, bwY + 160);
      ctx.closePath();
      ctx.fill();
      // cat eyes
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(bwX - 166, bwY + 168, 2.5, 0, Math.PI * 2);
      ctx.arc(bwX - 154, bwY + 168, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // --- Draw Ventilation Shaft on Back Wall ---
      // Background inside vent
      ctx.fillStyle = leftLight ? '#2a2a22' : '#030303'; // lit or pitch black
      ctx.fillRect(ventX, ventY, ventW, ventH);

      // Tunnel grid perspective details (gives depth to the duct)
      ctx.strokeStyle = leftLight ? '#45453b' : '#0f0f0f';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(ventX + 15, ventY + 15, ventW - 30, ventH - 30);
      ctx.beginPath();
      ctx.moveTo(ventX, ventY); ctx.lineTo(ventX + 15, ventY + 15);
      ctx.moveTo(ventX + ventW, ventY); ctx.lineTo(ventX + ventW - 15, ventY + 15);
      ctx.moveTo(ventX, ventY + ventH); ctx.lineTo(ventX + 15, ventY + ventH - 15);
      ctx.moveTo(ventX + ventW, ventY + ventH); ctx.lineTo(ventX + ventW - 15, ventY + ventH - 15);
      ctx.stroke();

      // Horizontal metal bars/grate in front of the vent (only clearly lit when light is on)
      ctx.strokeStyle = leftLight ? '#555' : 'rgba(20, 20, 20, 0.4)';
      ctx.lineWidth = 3;
      for (let gy_bar = ventY + 15; gy_bar < ventY + ventH; gy_bar += 22) {
        ctx.beginPath();
        ctx.moveTo(ventX, gy_bar);
        ctx.lineTo(ventX + ventW, gy_bar);
        ctx.stroke();
      }

      // --- Draw Animatronics inside Ventilation ---
      if (milkaPosition === 'LEFT_DOOR') {
        if (leftLight) {
          // Draw Milka squeezing/crouching inside the vent!
          const mx = ventX + ventW / 2;
          const my = ventY + ventH / 2 + 10;
          ctx.fillStyle = '#171717'; // dark grey feline head
          ctx.beginPath();
          ctx.arc(mx, my, 28, 0, Math.PI * 2);
          ctx.fill();
          
          // Feline ears
          ctx.fillStyle = '#171717';
          ctx.beginPath();
          ctx.moveTo(mx - 22, my - 12);
          ctx.lineTo(mx - 28, my - 44);
          ctx.lineTo(mx - 6, my - 24);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(mx + 22, my - 12);
          ctx.lineTo(mx + 28, my - 44);
          ctx.lineTo(mx + 6, my - 24);
          ctx.fill();

          // Green glowing eyes
          ctx.fillStyle = '#a3e635';
          ctx.shadowColor = '#84cc16';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(mx - 10, my - 2, 5, 0, Math.PI * 2);
          ctx.arc(mx + 10, my - 2, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Cute pink nose
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.moveTo(mx - 3, my + 5);
          ctx.lineTo(mx + 3, my + 5);
          ctx.lineTo(mx, my + 9);
          ctx.closePath();
          ctx.fill();
        } else {
          // Only glowing green eyes in the dark vent
          ctx.fillStyle = '#a3e635';
          ctx.shadowColor = '#84cc16';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(ventX + ventW / 2 - 10, ventY + ventH / 2, 4.5, 0, Math.PI * 2);
          ctx.arc(ventX + ventW / 2 + 10, ventY + ventH / 2, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      if (garikPosition === 'LEFT_DOOR') {
        if (leftLight) {
          // Draw Garik (dog) squeezing inside the vent!
          const gx = ventX + ventW / 2;
          const gy = ventY + ventH / 2 + 12;
          ctx.fillStyle = '#1c1917'; // dog body
          ctx.beginPath();
          ctx.arc(gx, gy, 26, 0, Math.PI * 2);
          ctx.fill();

          // Drooping dog ears
          ctx.fillStyle = '#b45309';
          ctx.beginPath();
          ctx.ellipse(gx - 20, gy - 6, 6, 16, Math.PI / 6, 0, Math.PI * 2);
          ctx.ellipse(gx + 20, gy - 6, 6, 16, -Math.PI / 6, 0, Math.PI * 2);
          ctx.fill();

          // Amber eyes
          ctx.fillStyle = '#f97316';
          ctx.shadowColor = '#ea580c';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(gx - 8, gy - 3, 4, 0, Math.PI * 2);
          ctx.arc(gx + 8, gy - 3, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Dog muzzle
          ctx.fillStyle = '#b45309';
          ctx.beginPath();
          ctx.ellipse(gx, gy + 5, 8, 10, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#09090b';
          ctx.beginPath();
          ctx.arc(gx, gy + 8, 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Only glowing amber dog eyes in the dark vent
          ctx.fillStyle = '#f97316';
          ctx.shadowColor = '#ea580c';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(ventX + ventW / 2 - 8, ventY + ventH / 2, 4, 0, Math.PI * 2);
          ctx.arc(ventX + ventW / 2 + 8, ventY + ventH / 2, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Draw outer ventilation metal border framing
      ctx.strokeStyle = '#4b5563'; // cool grey border
      ctx.lineWidth = 5;
      ctx.strokeRect(ventX, ventY, ventW, ventH);
      
      // Industrial bolts at 4 corners
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(ventX - 4, ventY - 4, 8, 8);
      ctx.fillRect(ventX + ventW - 4, ventY - 4, 8, 8);
      ctx.fillRect(ventX - 4, ventY + ventH - 4, 8, 8);
      ctx.fillRect(ventX + ventW - 4, ventY + ventH - 4, 8, 8);

      // Right Hallway
      if (rightLight) {
        ctx.fillStyle = '#3a3a30';
        ctx.fillRect(rDoorX, rDoorY, doorW, doorH);
        
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rDoorX + doorW - 15, rDoorY);
        ctx.lineTo(rDoorX + doorW - 15, rDoorY + doorH);
        ctx.stroke();

        // If Milka is at Right Door and light is ON, show her scary silhouette!
        if (milkaPosition === 'RIGHT_DOOR') {
          ctx.fillStyle = '#080808';
          // Body
          ctx.beginPath();
          ctx.ellipse(rDoorX + 60, rDoorY + 220, 35, 50, 0, 0, Math.PI * 2);
          ctx.fill();
          // Head
          ctx.beginPath();
          ctx.arc(rDoorX + 60, rDoorY + 160, 24, 0, Math.PI * 2);
          ctx.fill();
          // Ears
          ctx.beginPath();
          ctx.moveTo(rDoorX + 42, rDoorY + 148);
          ctx.lineTo(rDoorX + 38, rDoorY + 118);
          ctx.lineTo(rDoorX + 54, rDoorY + 140);
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(rDoorX + 78, rDoorY + 148);
          ctx.lineTo(rDoorX + 82, rDoorY + 118);
          ctx.lineTo(rDoorX + 66, rDoorY + 140);
          ctx.fill();

          // Glowing reflective yellow eyes!
          ctx.fillStyle = '#d9f99d';
          ctx.shadowColor = '#84cc16';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(rDoorX + 51, rDoorY + 158, 4, 0, Math.PI * 2);
          ctx.arc(rDoorX + 69, rDoorY + 158, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // If Garik is at Right Door and light is ON, show him!
        if (garikPosition === 'RIGHT_DOOR') {
          const gx = rDoorX + 60;
          const gy = rDoorY + 195;

          // 1. Body
          ctx.fillStyle = '#1c1917'; // Black-brown base
          ctx.beginPath();
          ctx.ellipse(gx, gy + 52, 38, 44, 0, 0, Math.PI * 2);
          ctx.fill();

          // Tan highlights on shoulders
          ctx.fillStyle = '#b45309';
          ctx.beginPath();
          ctx.ellipse(gx - 26, gy + 55, 12, 18, Math.PI / 4, 0, Math.PI * 2);
          ctx.ellipse(gx + 26, gy + 55, 12, 18, -Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();

          // White belly/chest (Білий пузік!)
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.ellipse(gx, gy + 60, 20, 28, 0, 0, Math.PI * 2);
          ctx.fill();

          // Paws
          ctx.fillStyle = '#b45309'; // Left Paw
          ctx.beginPath();
          ctx.ellipse(gx - 18, gy + 92, 11, 9, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(gx - 22, gy + 88); ctx.lineTo(gx - 22, gy + 98);
          ctx.moveTo(gx - 14, gy + 88); ctx.lineTo(gx - 14, gy + 98);
          ctx.stroke();

          ctx.fillStyle = '#f8fafc'; // White tipped right paw
          ctx.beginPath();
          ctx.ellipse(gx + 18, gy + 92, 11, 9, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(gx + 14, gy + 88); ctx.lineTo(gx + 14, gy + 98);
          ctx.moveTo(gx + 22, gy + 88); ctx.lineTo(gx + 22, gy + 98);
          ctx.stroke();

          // 2. Red Collar with Golden Tag
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(gx, gy + 20, 20, 0, Math.PI);
          ctx.stroke();
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(gx, gy + 32, 4, 0, Math.PI * 2);
          ctx.fill();

          // 3. Dog Head
          ctx.fillStyle = '#1c1917';
          ctx.beginPath();
          ctx.arc(gx, gy, 21, 0, Math.PI * 2);
          ctx.fill();

          // Tan eyebrows
          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.ellipse(gx - 8, gy - 11, 4.5, 2.5, 0, 0, Math.PI * 2);
          ctx.ellipse(gx + 8, gy - 11, 4.5, 2.5, 0, 0, Math.PI * 2);
          ctx.fill();

          // Cute floppy drooping ears
          ctx.fillStyle = '#171717'; // Left ear inner
          ctx.beginPath();
          ctx.ellipse(gx - 18, gy, 7, 18, Math.PI / 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#b45309'; // Left ear outer
          ctx.beginPath();
          ctx.ellipse(gx - 20, gy, 5, 15, Math.PI / 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#171717'; // Right ear inner
          ctx.beginPath();
          ctx.ellipse(gx + 18, gy, 7, 18, -Math.PI / 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1c1917'; // Right ear outer
          ctx.beginPath();
          ctx.ellipse(gx + 20, gy, 5, 15, -Math.PI / 5, 0, Math.PI * 2);
          ctx.fill();

          // 4. Muzzle & Wet Nose
          ctx.fillStyle = '#b45309';
          ctx.beginPath();
          ctx.ellipse(gx, gy + 6, 11, 14, 0, 0, Math.PI * 2);
          ctx.fill();

          // Little pink tongue poking out!
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.ellipse(gx, gy + 14, 4, 6, 0, 0, Math.PI * 2);
          ctx.fill();

          // Nose tip
          ctx.fillStyle = '#09090b';
          ctx.beginPath();
          ctx.arc(gx, gy + 11, 4, 0, Math.PI * 2);
          ctx.fill();

          // 5. Glowing Amber reflective dog eyes
          ctx.fillStyle = '#f97316';
          ctx.shadowColor = '#ea580c';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(gx - 8, gy - 3, 3, 0, Math.PI * 2);
          ctx.arc(gx + 8, gy - 3, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0; // reset
        }
      } else {
        ctx.fillStyle = '#030303';
        ctx.fillRect(rDoorX, rDoorY, doorW, doorH);

        // If Milka is at Right Door and light is OFF, show only glowing green dots in the dark!
        if (milkaPosition === 'RIGHT_DOOR') {
          ctx.fillStyle = '#a3e635';
          ctx.shadowColor = '#84cc16';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(rDoorX + 52, rDoorY + 158, 3.5, 0, Math.PI * 2);
          ctx.arc(rDoorX + 68, rDoorY + 158, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // If Garik is at Right Door and light is OFF, show only glowing amber eyes!
        if (garikPosition === 'RIGHT_DOOR') {
          ctx.fillStyle = '#f97316';
          ctx.shadowColor = '#ea580c';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(rDoorX + 53, rDoorY + 172, 3, 0, Math.PI * 2);
          ctx.arc(rDoorX + 67, rDoorY + 172, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Calculate doors animated heights
      const targetLeft = isLeftDoorClosed ? 1 : 0;
      const prevLeftProgress = leftDoorProgressRef.current;
      leftDoorProgressRef.current += (targetLeft - leftDoorProgressRef.current) * 0.22; // Snappier heavy close
      if (Math.abs(leftDoorProgressRef.current - targetLeft) < 0.001) {
        leftDoorProgressRef.current = targetLeft;
      }

      // Slam trigger Left door
      if (prevLeftProgress < 0.99 && leftDoorProgressRef.current >= 0.99 && isLeftDoorClosed) {
        shakeRef.current = 10;
        sound.playDoorSlam(-0.7); // Low-frequency slam sound left
        // Spawn puff dust particles at bottom of left doorway
        for (let p = 0; p < 15; p++) {
          particlesRef.current.push({
            x: lDoorX + Math.random() * doorW,
            y: lDoorY + doorH - 4,
            vx: (Math.random() - 0.5) * 4,
            vy: -Math.random() * 1.5 - 0.5,
            life: 1.0,
            maxLife: 20 + Math.random() * 15,
            size: 2.5 + Math.random() * 3.5,
            color: Math.random() > 0.5 ? 'rgba(120, 110, 100, 0.3)' : 'rgba(80, 80, 80, 0.2)'
          });
        }
      }

      const targetRight = isRightDoorClosed ? 1 : 0;
      const prevRightProgress = rightDoorProgressRef.current;
      rightDoorProgressRef.current += (targetRight - rightDoorProgressRef.current) * 0.22;
      if (Math.abs(rightDoorProgressRef.current - targetRight) < 0.001) {
        rightDoorProgressRef.current = targetRight;
      }

      // Slam trigger Right door
      if (prevRightProgress < 0.99 && rightDoorProgressRef.current >= 0.99 && isRightDoorClosed) {
        shakeRef.current = 10;
        sound.playDoorSlam(0.7); // Low-frequency slam sound right
        // Spawn puff dust particles at bottom of right doorway
        for (let p = 0; p < 15; p++) {
          particlesRef.current.push({
            x: rDoorX + Math.random() * doorW,
            y: rDoorY + doorH - 4,
            vx: (Math.random() - 0.5) * 4,
            vy: -Math.random() * 1.5 - 0.5,
            life: 1.0,
            maxLife: 20 + Math.random() * 15,
            size: 2.5 + Math.random() * 3.5,
            color: Math.random() > 0.5 ? 'rgba(120, 110, 100, 0.3)' : 'rgba(80, 80, 80, 0.2)'
          });
        }
      }

      // Update and draw slam/ambient particles
      if (particlesRef.current.length > 0) {
        ctx.save();
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.03; // gravity drift down
          p.life -= 1 / p.maxLife;

          if (p.life <= 0) {
            particlesRef.current.splice(i, 1);
            continue;
          }

          // draw soft particle circle
          ctx.fillStyle = p.color.replace('0.3', (0.3 * p.life).toString()).replace('0.2', (0.2 * p.life).toString());
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.4 + p.life * 0.6), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Draw sliding steel security doors with clipping region and windows!
      
      // LEFT VENT SHUTTER (at the back)
      if (leftDoorProgressRef.current > 0.001) {
        ctx.save();
        
        // Clip to the ventilation shaft's bounding rect
        ctx.beginPath();
        ctx.rect(ventX, ventY, ventW, ventH);
        ctx.clip();
        
        // Calculate animated position
        const yOffset = -ventH * (1 - leftDoorProgressRef.current);
        const animVentY = ventY + yOffset;
        
        // Draw metallic shutter body
        ctx.fillStyle = '#2d2d30'; // steel grey
        ctx.fillRect(ventX, animVentY, ventW, ventH);
        
        // Draw steel horizontal ribs
        ctx.strokeStyle = '#1e1e20';
        ctx.lineWidth = 3;
        for (let ry = animVentY + 12; ry < animVentY + ventH; ry += 16) {
          ctx.beginPath();
          ctx.moveTo(ventX, ry);
          ctx.lineTo(ventX + ventW, ry);
          ctx.stroke();
        }
        
        // Caution warning diagonal stripes at the bottom edge of the shutter
        ctx.fillStyle = '#eab308'; // yellow
        const stripeH = 12;
        const stripeY = animVentY + ventH - 12;
        ctx.fillRect(ventX, stripeY, ventW, stripeH);
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        for (let sx = ventX - 10; sx < ventX + ventW; sx += 16) {
          ctx.moveTo(sx, stripeY);
          ctx.lineTo(sx + 8, stripeY);
          ctx.lineTo(sx + 16, stripeY + stripeH);
          ctx.lineTo(sx + 8, stripeY + stripeH);
          ctx.closePath();
          ctx.fill();
        }
        
        // Draw thick outer framing
        ctx.strokeStyle = '#151518';
        ctx.lineWidth = 4;
        ctx.strokeRect(ventX, animVentY, ventW, ventH);
        
        ctx.restore();
      }

      // RIGHT DOOR
      if (rightDoorProgressRef.current > 0.001) {
        ctx.save();
        
        // Clip to right doorway
        ctx.beginPath();
        ctx.rect(rDoorX, rDoorY, doorW, doorH);
        ctx.clip();
        
        const yOffset = -doorH * (1 - rightDoorProgressRef.current);
        const animRDoorY = rDoorY + yOffset;
        
        const winX = rDoorX + 30;
        const winY = animRDoorY + 60;
        const winW = doorW - 60;
        const winH = 100;

        // Draw shutter around the window (top, bottom, left side, right side strips)
        ctx.fillStyle = '#262626';
        ctx.fillRect(rDoorX, animRDoorY, doorW, 60); // top part
        ctx.fillRect(rDoorX, animRDoorY + 160, doorW, doorH - 160); // bottom part
        ctx.fillRect(rDoorX, animRDoorY + 60, 30, 100); // left strip
        ctx.fillRect(rDoorX + doorW - 30, animRDoorY + 60, 30, 100); // right strip
        
        // draw steel ribs, skipping the window area
        ctx.strokeStyle = '#171717';
        ctx.lineWidth = 4;
        for (let dy = animRDoorY + 20; dy < animRDoorY + doorH; dy += 24) {
          if (dy >= winY && dy <= winY + winH) continue;
          ctx.beginPath();
          ctx.moveTo(rDoorX, dy);
          ctx.lineTo(rDoorX + doorW, dy);
          ctx.stroke();
        }

        // --- DRAW WINDOW GLASS AND CONTENT ---
        // A black backing for the window pane
        ctx.fillStyle = '#050505';
        ctx.fillRect(winX, winY, winW, winH);

        // Draw Garik peering through the closed/moving door's window!
        if (garikPosition === 'RIGHT_DOOR') {
          // Dark Silhouette of Garik's head
          ctx.fillStyle = '#090909';
          ctx.beginPath();
          ctx.arc(winX + winW / 2, winY + winH / 2 + 15, 20, 0, Math.PI * 2);
          ctx.fill();
          
          // Snout silhouette
          ctx.ellipse(winX + winW / 2, winY + winH / 2 + 20, 10, 12, 0, 0, Math.PI * 2);
          ctx.fill();

          // Drooping ears
          ctx.ellipse(winX + winW / 2 - 16, winY + winH / 2 + 12, 6, 14, Math.PI / 6, 0, Math.PI * 2);
          ctx.ellipse(winX + winW / 2 + 16, winY + winH / 2 + 12, 6, 14, -Math.PI / 6, 0, Math.PI * 2);
          ctx.fill();

          // Glowing reflective amber eyes (Always visible!)
          ctx.fillStyle = '#f97316';
          ctx.shadowColor = '#ea580c';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(winX + winW / 2 - 7, winY + winH / 2 + 11, 3, 0, Math.PI * 2);
          ctx.arc(winX + winW / 2 + 7, winY + winH / 2 + 11, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Draw Milka peering through the closed/moving door's window!
        if (milkaPosition === 'RIGHT_DOOR') {
          // Dark Silhouette of Milka's head (higher up / more alert than Garik)
          ctx.fillStyle = '#080808';
          ctx.beginPath();
          ctx.arc(winX + winW / 2, winY + winH / 2 + 10, 18, 0, Math.PI * 2); // feline head
          ctx.fill();

          // Ears
          ctx.beginPath();
          ctx.moveTo(winX + winW / 2 - 16, winY + winH / 2);
          ctx.lineTo(winX + winW / 2 - 20, winY + winH / 2 - 16);
          ctx.lineTo(winX + winW / 2 - 6, winY + winH / 2 - 6);
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(winX + winW / 2 + 16, winY + winH / 2);
          ctx.lineTo(winX + winW / 2 + 20, winY + winH / 2 - 16);
          ctx.lineTo(winX + winW / 2 + 6, winY + winH / 2 - 6);
          ctx.fill();

          // Cat body silhouette
          ctx.beginPath();
          ctx.ellipse(winX + winW / 2, winY + winH / 2 + 50, 26, 35, 0, 0, Math.PI * 2);
          ctx.fill();

          // Glowing reflective yellow-green eyes (Always visible!)
          ctx.fillStyle = '#d9f99d';
          ctx.shadowColor = '#84cc16';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(winX + winW / 2 - 6, winY + winH / 2 + 8, 3.5, 0, Math.PI * 2);
          ctx.arc(winX + winW / 2 + 6, winY + winH / 2 + 8, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Draw glass tint / light glow inside the window
        if (rightLight) {
          // Warm bright yellow glow inside the window
          const winGlow = ctx.createRadialGradient(
            winX + winW / 2, winY + winH / 2, 5,
            winX + winW / 2, winY + winH / 2, 60
          );
          winGlow.addColorStop(0, 'rgba(254, 240, 138, 0.75)');
          winGlow.addColorStop(1, 'rgba(234, 179, 8, 0.2)');
          ctx.fillStyle = winGlow;
          ctx.fillRect(winX, winY, winW, winH);
        } else {
          // Dark ambient cyan tint when unlit
          ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
          ctx.fillRect(winX, winY, winW, winH);
        }

        // Draw diagonal glass glare reflections on the window
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(winX + 10, winY + winH - 10);
        ctx.lineTo(winX + winW - 10, winY + 10);
        ctx.moveTo(winX + 25, winY + winH - 10);
        ctx.lineTo(winX + winW - 10, winY + 25);
        ctx.stroke();

        // Draw Window frame
        ctx.strokeStyle = '#404040';
        ctx.lineWidth = 4;
        ctx.strokeRect(winX, winY, winW, winH);
        
        // Caution stripes at bottom
        ctx.fillStyle = '#eab308';
        const stripeH = 15;
        const stripeY = animRDoorY + doorH - 30;
        ctx.fillRect(rDoorX, stripeY, doorW, stripeH);
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        for (let sx = rDoorX; sx < rDoorX + doorW; sx += 20) {
          ctx.moveTo(sx, stripeY);
          ctx.lineTo(sx + 10, stripeY);
          ctx.lineTo(sx + 20, stripeY + stripeH);
          ctx.lineTo(sx + 10, stripeY + stripeH);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();

        // --- VOLUMETRIC LIGHT BEAM SHINING THROUGH THE WINDOW INTO THE ROOM! ---
        if (rightLight) {
          ctx.save();
          const beamGrad = ctx.createLinearGradient(
            winX + winW / 2, winY,
            winX + winW / 2 - 100, winY + winH + 160
          );
          beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
          beamGrad.addColorStop(0.5, 'rgba(254, 240, 138, 0.12)');
          beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
          
          ctx.fillStyle = beamGrad;
          ctx.beginPath();
          ctx.moveTo(winX, winY);
          ctx.lineTo(winX + winW, winY);
          ctx.lineTo(winX + winW + 50, winY + winH + 180);
          ctx.lineTo(winX - 140, winY + winH + 180);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }

      // ==========================================
      // DRAW SHELLY (THE KITTEN ON THE LEFT FLOOR)
      // ==========================================
      if (shellyPosition === 'OFFICE') {
        const shellyX = 125;
        const shellyY = 515;

        // Draw Shelly herself (always restless/alert)
        ctx.save();
        
        // She is shivering/trembling slightly
        const shakeX = Math.sin(Date.now() / 40) * 1.2;
        const shakeY = Math.cos(Date.now() / 40) * 0.8;
        
        ctx.translate(shellyX + shakeX, shellyY + shakeY);

        // DRAW WAKING UP SHELLY (Tense body, twitching ears, glowing restless eyes, alert tail)
        // Tail standing up or twitching
        ctx.fillStyle = '#262626';
        ctx.beginPath();
        const tailTwitch = Math.sin(Date.now() / 60) * 5;
        ctx.moveTo(-15, 4);
        ctx.quadraticCurveTo(-25, -15 + tailTwitch, -20 + tailTwitch, -25);
        ctx.lineTo(-17 + tailTwitch, -25);
        ctx.quadraticCurveTo(-22, -15 + tailTwitch, -12, 6);
        ctx.closePath();
        ctx.fill();

        // Main body (tense)
        ctx.fillStyle = '#171717';
        ctx.beginPath();
        ctx.ellipse(0, 0, 26, 17, 0, 0, Math.PI * 2);
        ctx.fill();

        // Paw standing up
        ctx.fillStyle = '#ffffff'; // white socks
        ctx.beginPath();
        ctx.ellipse(10, 12, 5, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head raised high
        ctx.fillStyle = '#171717';
        ctx.beginPath();
        ctx.arc(15, -12, 12, 0, Math.PI * 2);
        ctx.fill();

        // RESTLESS GLOWING AMBER EYES (glowing slit or circles)
        ctx.fillStyle = '#fbbf24'; // Glowing Amber
        ctx.shadowColor = '#ea580c';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        // Left eye
        ctx.arc(10, -12, 2.5, 0, Math.PI * 2);
        // Right eye
        ctx.arc(19, -12, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset

        // Small black slits inside glowing eyes
        ctx.fillStyle = '#000000';
        ctx.fillRect(9.5, -14, 1, 4);
        ctx.fillRect(18.5, -14, 1, 4);

        // Angry/nervous mouth
        ctx.strokeStyle = '#fda4af';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(12, -7);
        ctx.lineTo(15, -9);
        ctx.lineTo(18, -7);
        ctx.stroke();

        // Nose
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.arc(15, -9, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Alert twitching ears (pointy, moving slightly)
        const earAngleL = Math.sin(Date.now() / 60) * 0.1;
        const earAngleR = Math.cos(Date.now() / 60) * 0.1;

        ctx.fillStyle = '#171717';
        ctx.beginPath();
        ctx.moveTo(7, -20);
        ctx.lineTo(3 + earAngleL * 15, -30);
        ctx.lineTo(14, -22);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(16, -22);
        ctx.lineTo(21 + earAngleR * 15, -30);
        ctx.lineTo(24, -19);
        ctx.fill();

        // Inner pink ears
        ctx.fillStyle = '#fda4af';
        ctx.beginPath();
        ctx.moveTo(8, -21);
        ctx.lineTo(5 + earAngleL * 15, -28);
        ctx.lineTo(13, -22);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(17, -22);
        ctx.lineTo(20 + earAngleR * 15, -28);
        ctx.lineTo(23, -20);
        ctx.fill();

        ctx.restore();

        // Flashing exclamation mark above her head
        const flashExcl = Math.floor(Date.now() / 250) % 2 === 0;
        if (flashExcl) {
          ctx.fillStyle = '#ef4444'; // Red alert exclamation mark
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('!', shellyX + 15, shellyY - 30);
          ctx.textAlign = 'left'; // reset
          
          // Small caution ring around her
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(shellyX, shellyY + 10, 58 + Math.sin(Date.now() / 100) * 3, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // 4. Draw Central Security Desk
      const deskW = 550;
      const deskH = 120;
      const deskX = cw / 2 - deskW / 2;
      const deskY = ch - deskH - 20;

      // Desk base/shadow underneath
      ctx.fillStyle = '#050505';
      ctx.fillRect(deskX - 20, deskY + deskH, deskW + 40, 25);

      // Desk wooden texture
      ctx.fillStyle = '#404040'; // grey security control desk
      ctx.fillRect(deskX, deskY, deskW, deskH);
      
      // Blue neon line on desk rim for retro flare
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(deskX, deskY);
      ctx.lineTo(deskX + deskW, deskY);
      ctx.stroke();

      // Draw Desktop props: Mug, monitors, and papers!
      // Papers
      ctx.fillStyle = '#d4d4d4';
      ctx.fillRect(deskX + 60, deskY - 15, 45, 15);
      ctx.strokeStyle = '#737373';
      ctx.strokeRect(deskX + 60, deskY - 15, 45, 15);
      
      ctx.fillStyle = '#a3a3a3';
      ctx.fillRect(deskX + 80, deskY - 10, 35, 10);
      
      // Mug
      ctx.fillStyle = '#dc2626'; // Red Mug
      ctx.fillRect(deskX + 160, deskY - 20, 18, 20);
      // Mug handle
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(deskX + 158, deskY - 10, 6, Math.PI / 2, (3 * Math.PI) / 2);
      ctx.stroke();

      // Big office fan blowing center
      const fanX = deskX + 280;
      const fanY = deskY - 38;
      ctx.fillStyle = '#222';
      ctx.fillRect(fanX - 8, fanY + 20, 16, 25); // base
      ctx.beginPath();
      ctx.arc(fanX, fanY, 26, 0, Math.PI * 2); // grill
      ctx.fillStyle = '#1e1e1e';
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Fan blades (fast rotation in memory!)
      const fanAngle = (Date.now() / 35) % (Math.PI * 2);
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 5;
      for (let b = 0; b < 4; b++) {
        ctx.beginPath();
        ctx.moveTo(fanX, fanY);
        const bx = fanX + Math.cos(fanAngle + (b * Math.PI) / 2) * 22;
        const by = fanY + Math.sin(fanAngle + (b * Math.PI) / 2) * 22;
        ctx.lineTo(bx, by);
        ctx.stroke();
      }
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(fanX, fanY, 6, 0, Math.PI * 2);
      ctx.fill();

      // --- SECURITY MONITOR ON THE DESK (FNAF Style!) ---
      const monitorX = deskX + 210;
      const monitorY = deskY - 35;
      const monitorW = 75;
      const monitorH = 50;
      
      // Stand
      ctx.fillStyle = '#171717';
      ctx.fillRect(monitorX + 25, monitorY + 50, 25, 10);
      ctx.fillRect(monitorX + 15, monitorY + 58, 45, 5);
      
      // Case
      ctx.fillStyle = '#262626';
      ctx.fillRect(monitorX, monitorY, monitorW, monitorH);
      ctx.strokeStyle = '#171717';
      ctx.lineWidth = 3;
      ctx.strokeRect(monitorX, monitorY, monitorW, monitorH);
      
      // Screen inside
      ctx.fillStyle = '#050505';
      ctx.fillRect(monitorX + 5, monitorY + 5, monitorW - 10, monitorH - 10);
      
      // Screen contents (flickering green matrix scanlines or active status)
      if (power > 0) {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.12)'; // green tint
        ctx.fillRect(monitorX + 5, monitorY + 5, monitorW - 10, monitorH - 10);
        
        // Scanlines
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.18)';
        ctx.lineWidth = 1;
        const lineOffset = (Date.now() / 80) % 6;
        for (let sy = monitorY + 5 + lineOffset; sy < monitorY + monitorH - 5; sy += 6) {
          ctx.beginPath();
          ctx.moveTo(monitorX + 5, sy);
          ctx.lineTo(monitorX + monitorW - 5, sy);
          ctx.stroke();
        }
        
        // Small active radar wave or blinking "OK" text
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        const blinkSec = Math.floor(Date.now() / 600) % 2;
        ctx.fillText(blinkSec === 0 ? 'SYSTEM OK' : 'SYS_STBY', monitorX + monitorW / 2, monitorY + monitorH / 2 + 3);
        
        // Tiny radar sweep line moving left to right
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const sweepX = monitorX + 5 + (Date.now() / 25) % (monitorW - 10);
        ctx.moveTo(sweepX, monitorY + 5);
        ctx.lineTo(sweepX, monitorY + monitorH - 5);
        ctx.stroke();
        ctx.textAlign = 'left'; // reset
      }

      // DESK LAMP PROP
      const lampX = deskX + 380;
      const lampY = deskY;
      
      // Draw lamp stand
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(lampX, lampY);
      ctx.lineTo(lampX, lampY - 40);
      ctx.lineTo(lampX - 15, lampY - 45);
      ctx.stroke();
      
      // Draw lamp base
      ctx.fillStyle = '#171717';
      ctx.fillRect(lampX - 12, lampY - 4, 24, 5);
      
      // Draw lamp shade
      ctx.fillStyle = isLampOn ? '#fbbf24' : '#4b5563'; // bright orange/amber when ON, grey when OFF
      ctx.beginPath();
      ctx.arc(lampX - 15, lampY - 45, 12, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      
      // Draw glow cone if lamp is ON
      if (isLampOn) {
        const lampConeGrad = ctx.createLinearGradient(lampX - 15, lampY - 45, lampX - 25, ch);
        lampConeGrad.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
        lampConeGrad.addColorStop(0.5, 'rgba(251, 191, 36, 0.12)');
        lampConeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = lampConeGrad;
        ctx.beginPath();
        ctx.moveTo(lampX - 15, lampY - 45);
        ctx.lineTo(lampX - 140, ch);
        ctx.lineTo(lampX + 80, ch);
        ctx.closePath();
        ctx.fill();
      }

      const isMouseOverLamp = 
        Math.abs((mouseX + scrollX) - lampX) < 25 && 
        Math.abs(mouseY - (lampY - 20)) < 40;
      
      if (isMouseOverLamp && containerRef.current?.style) {
        containerRef.current.style.cursor = 'pointer';
      }

      // MILKA IN THE ROOM (SCARY UNDER THE DESK EVENT)
      // If MilkaPosition is OFFICE, she is sitting right under the desk, grinning in shadows!
      if (milkaPosition === 'OFFICE' && !isMonitorOpen) {
        // Draw creeping cat under desk
        ctx.fillStyle = '#050505';
        ctx.fillRect(deskX + 80, deskY + 20, 80, 80);

        // Creepy big glowing yellow-green eyes under the desk
        ctx.fillStyle = '#bef264';
        ctx.shadowColor = '#84cc16';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(deskX + 110, deskY + 50, 6, 0, Math.PI * 2);
        ctx.arc(deskX + 130, deskY + 50, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 5. POSTER ON THE WALL (Decorative calico cat portrait)
      const posterX = bwX + 50;
      const posterY = bwY + 30;
      ctx.fillStyle = '#444'; // frame
      ctx.fillRect(posterX, posterY, 70, 90);
      ctx.fillStyle = '#e5e5e5'; // paper
      ctx.fillRect(posterX + 4, posterY + 4, 62, 82);
      
      if (normalImgRef.current) {
        ctx.drawImage(normalImgRef.current, posterX + 6, posterY + 6, 58, 60);
      } else {
        // Fallback cat drawing
        ctx.fillStyle = '#ea580c'; // ginger
        ctx.beginPath();
        ctx.arc(posterX + 35, posterY + 40, 18, 0, Math.PI * 2);
        ctx.fill();
      }
      // "MILKA" text below poster
      ctx.fillStyle = '#000';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CELEBRATE!', posterX + 35, posterY + 80);

      // 6. POWER OUTAGE BLACKOUT OVERLAY
      // If power is 0%, we override standard lighting and make it totally black with ONLY Milka blinking eyes
      if (power <= 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.99)';
        ctx.fillRect(0, 0, cw, ch);

        // Draw Milka's blinking face in the left doorway
        const blinkCycle = Math.floor(Date.now() / 400) % 2;
        if (blinkCycle === 0) {
          ctx.fillStyle = '#a3e635'; // glowing eyes
          ctx.shadowColor = '#84cc16';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(lDoorX + 51, lDoorY + 158, 4, 0, Math.PI * 2);
          ctx.arc(lDoorX + 69, lDoorY + 158, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      } 
      // 7. STANDARD FLASHLIGHT & DOOR LIGHT OVERLAY SOLVER
      else {
        // Horizontal scroll transformation
        // Since we scrolled the camera viewport, the mouse position in canvas coordinates is mouseX + scrollX
        const lightX = mouseX + scrollX;
        const lightY = mouseY;

        // Base dark room overlay intensity
        const darknessIntensity = isLampOn ? 0.35 : (useFlashlight ? 0.96 : 0.985);

        // We use a temporary offscreen canvas to build the complex light mask with multiple light holes
        if (!tempCanvasRef.current) {
          tempCanvasRef.current = document.createElement('canvas');
        }
        const tempCanvas = tempCanvasRef.current;
        tempCanvas.width = cw;
        tempCanvas.height = ch;
        const tempCtx = tempCanvas.getContext('2d');

        if (tempCtx) {
          // Clear temporary canvas
          tempCtx.clearRect(0, 0, cw, ch);

          // 1. Fill temporary canvas with the base darkness
          tempCtx.fillStyle = `rgba(0, 0, 0, ${darknessIntensity})`;
          tempCtx.fillRect(0, 0, cw, ch);

          // 2. Set composite operation to punch holes out of the darkness mask
          tempCtx.globalCompositeOperation = 'destination-out';

          // Hole A: Flashlight
          if (useFlashlight) {
            const flashRadius = 140 + upgrades.flashlightPower * 30;
            const flashGrad = tempCtx.createRadialGradient(
              lightX, lightY, 10,
              lightX, lightY, flashRadius
            );
            flashGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)'); // 100% cutout
            flashGrad.addColorStop(0.3, 'rgba(0, 0, 0, 0.85)');
            flashGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.2)');
            flashGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            tempCtx.fillStyle = flashGrad;
            tempCtx.beginPath();
            tempCtx.arc(lightX, lightY, flashRadius, 0, Math.PI * 2);
            tempCtx.fill();
          }

          // Hole B: Left Ventilation Light Glow
          if (leftLight) {
            const lLightX = ventX + ventW / 2;
            const lLightY = ventY + ventH / 2;
            const leftGlowRadius = 180;
            const leftGlowGrad = tempCtx.createRadialGradient(
              lLightX, lLightY, 15,
              lLightX, lLightY, leftGlowRadius
            );
            leftGlowGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)'); // fully bright cutout
            leftGlowGrad.addColorStop(0.4, 'rgba(0, 0, 0, 0.75)');
            leftGlowGrad.addColorStop(0.8, 'rgba(0, 0, 0, 0.15)');
            leftGlowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            tempCtx.fillStyle = leftGlowGrad;
            tempCtx.beginPath();
            tempCtx.arc(lLightX, lLightY, leftGlowRadius, 0, Math.PI * 2);
            tempCtx.fill();
          }

          // Hole C: Right Door Light Glow
          if (rightLight) {
            const rLightX = rDoorX + doorW / 2;
            const rLightY = rDoorY + doorH / 2;
            const rightGlowRadius = 260;
            const rightGlowGrad = tempCtx.createRadialGradient(
              rLightX, rLightY, 20,
              rLightX, rLightY, rightGlowRadius
            );
            rightGlowGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)'); // fully bright cutout
            rightGlowGrad.addColorStop(0.4, 'rgba(0, 0, 0, 0.75)');
            rightGlowGrad.addColorStop(0.8, 'rgba(0, 0, 0, 0.15)');
            rightGlowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            tempCtx.fillStyle = rightGlowGrad;
            tempCtx.beginPath();
            tempCtx.arc(rLightX, rLightY, rightGlowRadius, 0, Math.PI * 2);
            tempCtx.fill();
          }

          // Hole E: Right Door Window Glow
          if (rightDoorProgressRef.current > 0.01) {
            const rWinX = rDoorX + doorW / 2;
            const rWinY = rDoorY - doorH * (1 - rightDoorProgressRef.current) + 110;
            const winGlowRadius = 65;
            const winGlowGrad = tempCtx.createRadialGradient(
              rWinX, rWinY, 5,
              rWinX, rWinY, winGlowRadius
            );
            const cutoutOpacity = rightLight ? 1.0 : 0.45;
            winGlowGrad.addColorStop(0, `rgba(0, 0, 0, ${cutoutOpacity})`);
            winGlowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            tempCtx.fillStyle = winGlowGrad;
            tempCtx.beginPath();
            tempCtx.arc(rWinX, rWinY, winGlowRadius, 0, Math.PI * 2);
            tempCtx.fill();
          }

          // Hole F: Ventilation Shaft Open - Animatronic glowing eyes
          if (leftDoorProgressRef.current < 0.5) {
            if (milkaPosition === 'LEFT_DOOR' || garikPosition === 'LEFT_DOOR') {
              const eyeX = ventX + ventW / 2;
              const eyeY = ventY + ventH / 2;
              const eyeGlowRadius = 35;
              const eyeGlowGrad = tempCtx.createRadialGradient(
                eyeX, eyeY, 2,
                eyeX, eyeY, eyeGlowRadius
              );
              eyeGlowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
              eyeGlowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

              tempCtx.fillStyle = eyeGlowGrad;
              tempCtx.beginPath();
              tempCtx.arc(eyeX, eyeY, eyeGlowRadius, 0, Math.PI * 2);
              tempCtx.fill();
            }
          }

          // Hole G: Right Doorway Open - Animatronic glowing eyes
          if (rightDoorProgressRef.current < 0.5) {
            if (milkaPosition === 'RIGHT_DOOR' || garikPosition === 'RIGHT_DOOR') {
              const eyeX = rDoorX + 60;
              const eyeY = rDoorY + 165;
              const eyeGlowRadius = 35;
              const eyeGlowGrad = tempCtx.createRadialGradient(
                eyeX, eyeY, 2,
                eyeX, eyeY, eyeGlowRadius
              );
              eyeGlowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
              eyeGlowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

              tempCtx.fillStyle = eyeGlowGrad;
              tempCtx.beginPath();
              tempCtx.arc(eyeX, eyeY, eyeGlowRadius, 0, Math.PI * 2);
              tempCtx.fill();
            }
          }

          // Hole H: Left & Right Wall Buttons (Always slightly visible so player can operate them in the dark)
          const lBtnX_coord = bwX - 110;
          const lBtnY_coord = bwY + 100;
          const rBtnX_coord = bwX + bwW + 90;
          const rBtnY_coord = bwY + 100;

          const btnGlowGradL = tempCtx.createRadialGradient(lBtnX_coord + 10, lBtnY_coord + 25, 5, lBtnX_coord + 10, lBtnY_coord + 25, 45);
          btnGlowGradL.addColorStop(0, 'rgba(0, 0, 0, 0.65)'); // 65% cutout to see buttons in the dark
          btnGlowGradL.addColorStop(1, 'rgba(0, 0, 0, 0)');
          tempCtx.fillStyle = btnGlowGradL;
          tempCtx.beginPath();
          tempCtx.arc(lBtnX_coord + 10, lBtnY_coord + 25, 45, 0, Math.PI * 2);
          tempCtx.fill();

          const btnGlowGradR = tempCtx.createRadialGradient(rBtnX_coord + 10, rBtnY_coord + 25, 5, rBtnX_coord + 10, rBtnY_coord + 25, 45);
          btnGlowGradR.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
          btnGlowGradR.addColorStop(1, 'rgba(0, 0, 0, 0)');
          tempCtx.fillStyle = btnGlowGradR;
          tempCtx.beginPath();
          tempCtx.arc(rBtnX_coord + 10, rBtnY_coord + 25, 45, 0, Math.PI * 2);
          tempCtx.fill();

          // Restore composite operation of tempCtx just in case
          tempCtx.globalCompositeOperation = 'source-over';
        }

        // 3. Draw the constructed darkness mask onto the main canvas
        ctx.save();
        ctx.drawImage(tempCanvas, 0, 0);

        // 4. Add warm ambiance over the scene
        if (isLampOn) {
          ctx.fillStyle = 'rgba(251, 191, 36, 0.08)';
          ctx.fillRect(0, 0, cw, ch);
        }

        // Draw soft golden light cone spill on top of the dark mask to give real volume to the door light
        if (leftLight) {
          const lLightX = lDoorX + doorW / 2;
          const lLightY = lDoorY + doorH / 2;
          const leftSpill = ctx.createRadialGradient(lLightX, lLightY, 40, lLightX, lLightY, 260);
          leftSpill.addColorStop(0, 'rgba(254, 240, 138, 0.16)');
          leftSpill.addColorStop(0.5, 'rgba(254, 240, 138, 0.05)');
          leftSpill.addColorStop(1, 'rgba(254, 240, 138, 0)');
          ctx.fillStyle = leftSpill;
          ctx.beginPath();
          ctx.arc(lLightX, lLightY, 260, 0, Math.PI * 2);
          ctx.fill();
        }

        if (rightLight) {
          const rLightX = rDoorX + doorW / 2;
          const rLightY = rDoorY + doorH / 2;
          const rightSpill = ctx.createRadialGradient(rLightX, rLightY, 40, rLightX, rLightY, 260);
          rightSpill.addColorStop(0, 'rgba(254, 240, 138, 0.16)');
          rightSpill.addColorStop(0.5, 'rgba(254, 240, 138, 0.05)');
          rightSpill.addColorStop(1, 'rgba(254, 240, 138, 0)');
          ctx.fillStyle = rightSpill;
          ctx.beginPath();
          ctx.arc(rLightX, rLightY, 260, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        // Flashlight beam ring (soft yellow highlight around light cone)
        if (useFlashlight) {
          ctx.strokeStyle = 'rgba(254, 240, 138, 0.08)';
          ctx.lineWidth = 15;
          ctx.beginPath();
          ctx.arc(lightX, lightY, 140 + upgrades.flashlightPower * 30, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // 8. DOOR BUTTON STATUS LEDS (Drawn on the static door frames)
      // Left buttons (x coordinate just left of Back Wall)
      const lBtnX = bwX - 110;
      const lBtnY = bwY + 100;
      ctx.fillStyle = '#1e1e1e';
      ctx.fillRect(lBtnX, lBtnY, 20, 50);
      ctx.strokeStyle = '#333';
      ctx.strokeRect(lBtnX, lBtnY, 20, 50);

      // Draw actual 3D button shapes on Left Panel
      // Light button (top)
      const lLightPressed = leftLight;
      ctx.fillStyle = lLightPressed ? '#3b82f6' : '#1e3a8a'; // Blue button for light
      ctx.fillRect(lBtnX + 3, lBtnY + 5 + (lLightPressed ? 1 : 0), 14, 16);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(lBtnX + 3, lBtnY + 5 + (lLightPressed ? 1 : 0), 14, 16);
      
      // Door button (bottom)
      const lDoorPressed = isLeftDoorClosed;
      ctx.fillStyle = lDoorPressed ? '#ef4444' : '#7f1d1d'; // Red button for door
      ctx.fillRect(lBtnX + 3, lBtnY + 28 + (lDoorPressed ? 1 : 0), 14, 16);
      ctx.strokeRect(lBtnX + 3, lBtnY + 28 + (lDoorPressed ? 1 : 0), 14, 16);

      // Light LED
      ctx.fillStyle = leftLight ? '#60a5fa' : '#1d4ed8'; // blue glowing LED
      ctx.beginPath();
      ctx.arc(lBtnX + 10, lBtnY + 13, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Door LED
      ctx.fillStyle = leftDoorProgressRef.current > 0.99 ? '#22c55e' : (isLeftDoorClosed ? '#eab308' : '#52525b'); // green when fully closed, yellow when moving, grey when open
      ctx.beginPath();
      ctx.arc(lBtnX + 10, lBtnY + 36, 3, 0, Math.PI * 2);
      ctx.fill();

      // Right buttons
      const rBtnX = bwX + bwW + 90;
      const rBtnY = bwY + 100;
      ctx.fillStyle = '#1e1e1e';
      ctx.fillRect(rBtnX, rBtnY, 20, 50);
      ctx.strokeStyle = '#333';
      ctx.strokeRect(rBtnX, rBtnY, 20, 50);

      // Light button (top)
      const rLightPressed = rightLight;
      ctx.fillStyle = rLightPressed ? '#3b82f6' : '#1e3a8a';
      ctx.fillRect(rBtnX + 3, rBtnY + 5 + (rLightPressed ? 1 : 0), 14, 16);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(rBtnX + 3, rBtnY + 5 + (rLightPressed ? 1 : 0), 14, 16);
      
      // Door button (bottom)
      const rDoorPressed = isRightDoorClosed;
      ctx.fillStyle = rDoorPressed ? '#ef4444' : '#7f1d1d';
      ctx.fillRect(rBtnX + 3, rBtnY + 28 + (rDoorPressed ? 1 : 0), 14, 16);
      ctx.strokeRect(rBtnX + 3, rBtnY + 28 + (rDoorPressed ? 1 : 0), 14, 16);

      // Light LED
      ctx.fillStyle = rightLight ? '#60a5fa' : '#1d4ed8';
      ctx.beginPath();
      ctx.arc(rBtnX + 10, rBtnY + 13, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Door LED
      ctx.fillStyle = rightDoorProgressRef.current > 0.99 ? '#22c55e' : (isRightDoorClosed ? '#eab308' : '#52525b');
      ctx.beginPath();
      ctx.arc(rBtnX + 10, rBtnY + 36, 3, 0, Math.PI * 2);
      ctx.fill();

      // Restore camera bobbing/breathing effect
      ctx.restore();

      // Trigger redraw
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [mouseX, mouseY, isMonitorOpen, leftLight, rightLight, isLeftDoorClosed, isRightDoorClosed, milkaPosition, useFlashlight, power, battery, upgrades, isLampOn, garikPosition, shellyState, shellyTimer, isLampBatteryActive]);

  // Click Easter Egg
  const handleOfficeClick = () => {
    if (isMonitorOpen) return;
    
    // Check if clicking desk lamp
    const containerW = containerRef.current?.getBoundingClientRect().width || 1000;
    const maxScroll = 1400 - containerW;
    const scrollX = (mouseX / containerW) * maxScroll;
    const targetX = mouseX + scrollX;

    const deskX = 1400 / 2 - 550 / 2; // 425
    const deskY = 600 - 120 - 20; // 460


    // Click Desk Lamp
    const lampX = deskX + 380;
    const lampY = deskY;
    const isOverLamp = Math.abs(targetX - lampX) < 25 && Math.abs(mouseY - (lampY - 20)) < 40;
    if (isOverLamp && power > 0) {
      sound.playLampToggle();
      setIsLampOn(!isLampOn);
      return;
    }
  };

  // CAMERA MONITOR OVERLAY CANVAS LOOP
  useEffect(() => {
    const canvas = monitorCanvasRef.current;
    if (!canvas || !isMonitorOpen) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const cw = 800;
    const ch = 520;

    const render = () => {
      ctx.clearRect(0, 0, cw, ch);

      // 1. Render room background based on activeCam
      ctx.fillStyle = '#0f0f0f';
      ctx.fillRect(0, 0, cw, ch);

      // Draw basic geometric perspective lines to represent room
      ctx.strokeStyle = 'rgba(40, 40, 40, 0.7)';
      ctx.lineWidth = 1.5;
      
      // Wall outline
      ctx.strokeRect(100, 80, cw - 200, ch - 180);
      
      // Corners
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(100, 80);
      ctx.moveTo(cw, 0); ctx.lineTo(cw - 100, 80);
      ctx.moveTo(0, ch); ctx.lineTo(100, ch - 100);
      ctx.moveTo(cw, ch); ctx.lineTo(cw - 100, ch - 100);
      ctx.stroke();

      // Specific room assets
      if (activeCam === 'KITCHEN_2') {
        // Kitchen counter and cabinets
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(100, ch - 180, cw - 200, 100);
        ctx.fillStyle = '#292524';
        ctx.fillRect(150, ch - 180, 120, 80); // oven/stove
        ctx.fillStyle = '#3f3f46';
        ctx.fillRect(170, ch - 170, 80, 10); // stovetop
      } else if (activeCam === 'LIVING_2') {
        // Armchair and fireplace
        ctx.fillStyle = '#171717';
        ctx.fillRect(150, ch - 200, 100, 100); // armchair
        ctx.fillStyle = '#1e1b4b'; // fireplace
        ctx.fillRect(450, ch - 220, 140, 120);
        ctx.fillStyle = '#f97316'; // orange glow
        ctx.fillRect(490, ch - 150, 60, 40);
      } else if (activeCam === 'BEDROOM_3') {
        // Bunk bed silhouette
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(120, ch - 240, 160, 160); // bunk bed frame
        ctx.fillStyle = '#262626';
        ctx.fillRect(130, ch - 150, 140, 50); // lower bed
        ctx.fillRect(130, ch - 230, 140, 50); // upper bed
      } else if (activeCam === 'VERANDA') {
        // Large glass windows panels
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 4;
        for (let wx = 120; wx < cw - 120; wx += 120) {
          ctx.strokeRect(wx, 100, 80, 140);
        }
        // moon/street glow from veranda
        ctx.fillStyle = 'rgba(14, 165, 233, 0.05)';
        ctx.fillRect(100, 80, cw - 200, ch - 180);
      } else if (activeCam === 'CORRIDOR') {
        // Central hallway perspective
        ctx.strokeStyle = 'rgba(100,100,100,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cw/2 - 120, 150);
        ctx.lineTo(cw/2 - 120, ch - 150);
        ctx.moveTo(cw/2 + 120, 150);
        ctx.lineTo(cw/2 + 120, ch - 150);
        ctx.stroke();
      } else if (activeCam === 'TOILET') {
        // Toilet bowl outline and sink
        ctx.fillStyle = '#27272a';
        ctx.fillRect(200, ch - 180, 80, 100); // toilet bowl base
        ctx.fillRect(180, ch - 240, 100, 60); // tank
        ctx.fillStyle = '#18181b';
        ctx.fillRect(450, ch - 190, 100, 90); // sink cabinet
      } else if (activeCam === 'KITCHEN') {
        // Refrigerator and table
        ctx.fillStyle = '#27272a';
        ctx.fillRect(150, 120, 100, ch - 220); // Fridge
        ctx.strokeStyle = '#52525b';
        ctx.strokeRect(150, 120, 100, ch - 220);
        ctx.fillStyle = '#18181b';
        ctx.fillRect(400, ch - 200, 200, 100); // table
      } else if (activeCam === 'LIVING') {
        // TV set showing static and sofa
        ctx.fillStyle = '#111';
        ctx.fillRect(500, ch - 240, 160, 120); // TV
        ctx.strokeStyle = '#333';
        ctx.strokeRect(500, ch - 240, 160, 120);
        ctx.fillStyle = Math.random() > 0.5 ? '#a1a1aa' : '#52525b';
        ctx.fillRect(510, ch - 230, 140, 100);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(120, ch - 180, 220, 80); // Sofa
      } else if (activeCam === 'PLAYER_ROOM') {
        // Desk, empty gaming chair, glowing monitor
        ctx.fillStyle = '#18181b';
        ctx.fillRect(250, ch - 170, 300, 90); // table
        ctx.fillStyle = '#0f172a'; // PC monitor case
        ctx.fillRect(350, ch - 250, 100, 70);
        ctx.fillStyle = '#0284c7'; // bright sky blue screen glow (no player)
        ctx.fillRect(355, ch - 245, 90, 55);
        ctx.fillStyle = '#09090b'; // empty chair silhouette
        ctx.fillRect(160, ch - 190, 60, 110);
      } else if (activeCam === 'HALL') {
        // Large wardrobe cabinet and grand piano/rug
        ctx.fillStyle = '#171717';
        ctx.fillRect(120, 120, 120, ch - 200); // wardrobe
        ctx.fillStyle = '#18181b';
        ctx.fillRect(400, ch - 180, 240, 100); // grand piano silhouette
      } else if (activeCam === 'STREET') {
        // Fence and trees under the moon
        ctx.fillStyle = 'rgba(10, 10, 15, 0.8)';
        ctx.fillRect(100, 80, cw - 200, ch - 180);
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 3;
        // Draw some fence bars
        for (let fx = 120; fx < cw - 120; fx += 30) {
          ctx.beginPath();
          ctx.moveTo(fx, ch - 180);
          ctx.lineTo(fx, ch - 100);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(cw / 2 + 100, 130, 25, 0, Math.PI * 2); // Moon
        ctx.fillStyle = '#e2e8f0';
        ctx.shadowColor = '#cbd5e1';
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (activeCam === 'ATTIC') {
        // Attic pitched roof rafters and spiderweb
        ctx.fillStyle = '#181310';
        ctx.fillRect(100, 80, cw - 200, ch - 180);
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 6;
        // pitched roof rafters
        ctx.beginPath();
        ctx.moveTo(100, 80); ctx.lineTo(cw / 2, 140); ctx.lineTo(cw - 100, 80);
        ctx.stroke();
        // hanging old lightbulb
        ctx.strokeStyle = '#8d6e63';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cw / 2, 140);
        ctx.lineTo(cw / 2, 220);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cw / 2, 226, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#fff9c4';
        ctx.fill();
      } else if (activeCam === 'GARDEN') {
        // Garden foliage, night trees and bushes
        ctx.fillStyle = '#051b11';
        ctx.fillRect(100, 80, cw - 200, ch - 180);
        // glowing fireflies
        ctx.fillStyle = 'rgba(163, 230, 53, 0.7)';
        for (let i = 0; i < 12; i++) {
          const fx = 150 + (i * 37) % 450;
          const fy = 120 + (i * 29) % 200;
          ctx.beginPath();
          ctx.arc(fx, fy, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (activeCam === 'GARAGE') {
        // Garage workstation and a covered car silhouette
        ctx.fillStyle = '#212529';
        ctx.fillRect(100, 80, cw - 200, ch - 180);
        ctx.fillStyle = '#343a40';
        ctx.fillRect(150, ch - 220, 180, 120); // Workbench table
        ctx.fillStyle = '#495057';
        ctx.fillRect(400, ch - 170, 240, 70); // covered sports car silhouette
      }

      // 2. DRAW MILKA IN THE CAMERA IF SHE IS HERE
      if (milkaPosition === activeCam) {
        const cx = cw / 2;
        const cy = ch / 2 + 50;

        if (camInterference.active) {
          // Do not draw cat, she causes static blip
        } else if (creepyImgRef.current && milkaState >= 2) {
          // Render generated creepy image in a frame
          ctx.save();
          // Draw image centered
          const iw = 220;
          const ih = 165;
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2;
          ctx.strokeRect(cx - iw / 2 - 1, cy - ih / 2 - 1, iw + 2, ih + 2);
          ctx.drawImage(creepyImgRef.current, cx - iw / 2, cy - ih / 2, iw, ih);
          ctx.restore();
        } else if (normalImgRef.current) {
          // Render actual normal photo of Milka
          ctx.save();
          const iw = 220;
          const ih = 165;
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2;
          ctx.strokeRect(cx - iw / 2 - 1, cy - ih / 2 - 1, iw + 2, ih + 2);
          ctx.drawImage(normalImgRef.current, cx - iw / 2, cy - ih / 2, iw, ih);
          ctx.restore();
        } else {
          // Draw procedural detailed calico cat!
          // 1. Sleek Tail (Sways gently over time)
          const tailAngle = Math.sin(Date.now() / 250) * 0.15;
          ctx.save();
          ctx.translate(cx + 25, cy + 90);
          ctx.rotate(tailAngle);
          // Tail shadow / body
          ctx.strokeStyle = '#0c0a09'; // dark base
          ctx.lineWidth = 10;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(30, -10, 20, -60);
          ctx.stroke();
          // Orange tip on the tail for calico detail
          ctx.strokeStyle = '#ea580c';
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.moveTo(15, -40);
          ctx.lineTo(20, -60);
          ctx.stroke();
          ctx.restore();

          // 2. Main Body
          ctx.fillStyle = '#0c0a09'; // dark base coat
          ctx.beginPath();
          ctx.ellipse(cx, cy + 60, 42, 60, 0, 0, Math.PI * 2);
          ctx.fill();

          // 3. Calico Body patches (Orange & White patches)
          // Orange shoulder patch
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.ellipse(cx - 20, cy + 45, 18, 25, Math.PI / 6, 0, Math.PI * 2);
          ctx.fill();

          // White belly & chest (nice soft round belly patch)
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.ellipse(cx, cy + 65, 24, 35, 0, 0, Math.PI * 2);
          ctx.fill();

          // Fluffy white chest bib
          ctx.beginPath();
          ctx.ellipse(cx, cy + 30, 18, 20, 0, 0, Math.PI * 2);
          ctx.fill();

          // Orange patch on chest
          ctx.fillStyle = '#ea580c';
          ctx.beginPath();
          ctx.ellipse(cx + 15, cy + 40, 10, 15, -Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();

          // 4. Paws (Left and right paws in front)
          // Left paw
          ctx.fillStyle = '#f8fafc'; // White paws!
          ctx.beginPath();
          ctx.ellipse(cx - 18, cy + 110, 10, 8, 0, 0, Math.PI * 2);
          ctx.fill();
          // Paw lines (toes)
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(cx - 21, cy + 106); ctx.lineTo(cx - 21, cy + 116);
          ctx.moveTo(cx - 15, cy + 106); ctx.lineTo(cx - 15, cy + 116);
          ctx.stroke();

          // Right paw
          ctx.fillStyle = '#ea580c'; // Orange right paw!
          ctx.beginPath();
          ctx.ellipse(cx + 18, cy + 110, 10, 8, 0, 0, Math.PI * 2);
          ctx.fill();
          // Paw lines
          ctx.strokeStyle = '#c2410c';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(cx + 15, cy + 106); ctx.lineTo(cx + 15, cy + 116);
          ctx.moveTo(cx + 21, cy + 106); ctx.lineTo(cx + 21, cy + 116);
          ctx.stroke();

          // 5. Head
          ctx.fillStyle = '#0c0a09'; // dark head base
          ctx.beginPath();
          ctx.arc(cx, cy - 5, 28, 0, Math.PI * 2);
          ctx.fill();

          // Left Ear
          ctx.fillStyle = '#0c0a09';
          ctx.beginPath();
          ctx.moveTo(cx - 22, cy - 18);
          ctx.lineTo(cx - 28, cy - 52);
          ctx.lineTo(cx - 6, cy - 23);
          ctx.closePath();
          ctx.fill();
          // Left Ear inner pink
          ctx.fillStyle = '#fda4af';
          ctx.beginPath();
          ctx.moveTo(cx - 19, cy - 20);
          ctx.lineTo(cx - 24, cy - 45);
          ctx.lineTo(cx - 9, cy - 23);
          ctx.closePath();
          ctx.fill();

          // Right Ear (Orange calico detail!)
          ctx.fillStyle = '#ea580c';
          ctx.beginPath();
          ctx.moveTo(cx + 6, cy - 23);
          ctx.lineTo(cx + 28, cy - 52);
          ctx.lineTo(cx + 22, cy - 18);
          ctx.closePath();
          ctx.fill();
          // Right Ear inner pink
          ctx.fillStyle = '#fda4af';
          ctx.beginPath();
          ctx.moveTo(cx + 9, cy - 23);
          ctx.lineTo(cx + 24, cy - 45);
          ctx.lineTo(cx + 19, cy - 20);
          ctx.closePath();
          ctx.fill();

          // Head Orange patch (under right ear/eye)
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.ellipse(cx + 12, cy - 5, 14, 18, Math.PI / 12, 0, Math.PI * 2);
          ctx.fill();

          // 6. Cute Muzzle, Whiskers & Nose
          // White muzzle cheeks
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.ellipse(cx - 6, cy + 6, 9, 7, 0, 0, Math.PI * 2);
          ctx.ellipse(cx + 6, cy + 6, 9, 7, 0, 0, Math.PI * 2);
          ctx.fill();

          // Pink little nose
          ctx.fillStyle = '#f472b6';
          ctx.beginPath();
          ctx.moveTo(cx, cy + 2);
          ctx.lineTo(cx - 3, cy - 1);
          ctx.lineTo(cx + 3, cy - 1);
          ctx.closePath();
          ctx.fill();

          // Whiskers (Left and Right)
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.lineWidth = 1;
          // Left whiskers
          ctx.beginPath();
          ctx.moveTo(cx - 10, cy + 6); ctx.lineTo(cx - 35, cy + 3);
          ctx.moveTo(cx - 10, cy + 7); ctx.lineTo(cx - 38, cy + 9);
          ctx.moveTo(cx - 10, cy + 8); ctx.lineTo(cx - 34, cy + 14);
          // Right whiskers
          ctx.moveTo(cx + 10, cy + 6); ctx.lineTo(cx + 35, cy + 3);
          ctx.moveTo(cx + 10, cy + 7); ctx.lineTo(cx + 38, cy + 9);
          ctx.moveTo(cx + 10, cy + 8); ctx.lineTo(cx + 34, cy + 14);
          ctx.stroke();

          // Purple Collar with a beautiful gold Bell
          ctx.strokeStyle = '#8b5cf6'; // Violet collar
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(cx, cy + 22, 22, 0.1 * Math.PI, 0.9 * Math.PI);
          ctx.stroke();

          // Gold bell
          ctx.fillStyle = '#fbbf24'; // gold
          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(cx, cy + 40, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // 7. Glow reflective eyes (only if staring directly or close up)
          ctx.fillStyle = '#bef264';
          ctx.shadowColor = '#84cc16';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(cx - 11, cy - 6, 5.5, 0, Math.PI * 2);
          ctx.arc(cx + 11, cy - 6, 5.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0; // reset

          // Pupil slits inside eyes for realism
          ctx.fillStyle = '#09090b';
          ctx.beginPath();
          ctx.ellipse(cx - 11, cy - 6, 1.2, 5, 0, 0, Math.PI * 2);
          ctx.ellipse(cx + 11, cy - 6, 1.2, 5, 0, 0, Math.PI * 2);
          ctx.fill();

          // Cute tiny white eye shine highlights
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(cx - 13, cy - 8, 1.2, 0, Math.PI * 2);
          ctx.arc(cx + 9, cy - 8, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Lens block warning if Milka is extremely close (State 3)
        if (milkaState === 3) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fillRect(0, 0, cw, ch);
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 16px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('🔴 УВАГА: СИГНАЛ ПЕРЕШКОДЖЕНО ОБ\'ЄКТОМ ПЕРЕД ОБ\'ЄКТИВОМ', cw / 2, ch / 2 - 100);
        }
      }

      // 2b. DRAW GARIK IN THE CAMERA IF HE IS HERE
      if (garikPosition === activeCam && !camInterference.active) {
        const gx = cw / 2 - 120; // offset from Milka at center
        const gy = ch / 2 + 30;

        // Draw highly detailed procedural dog Garik!
        // Color Palette:
        // - Black/Dark Charcoal: #1c1917
        // - Warm Tan/Brown: #b45309 or #854d0e
        // - Belly/Chest (White): #fafafa or #f8fafc

        // 1. Wagging Tail (animation based on Date.now())
        const dogTailWag = Math.sin(Date.now() / 150) * 0.3;
        ctx.save();
        ctx.translate(gx - 25, gy + 80);
        ctx.rotate(dogTailWag);
        // Black/Brown wagging tail
        ctx.strokeStyle = '#1c1917';
        ctx.lineWidth = 11;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-25, 10, -40, -10);
        ctx.stroke();
        // Tan highlight on tail tip
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(-25, 3);
        ctx.lineTo(-40, -10);
        ctx.stroke();
        ctx.restore();

        // 2. Body
        // Base dark coat
        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.ellipse(gx, gy + 52, 38, 44, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tan highlights/spots on the shoulders/sides
        ctx.fillStyle = '#b45309'; // warm tan
        ctx.beginPath();
        ctx.ellipse(gx - 26, gy + 55, 12, 18, Math.PI / 4, 0, Math.PI * 2);
        ctx.ellipse(gx + 26, gy + 55, 12, 18, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // White belly/chest (Білий пузік!)
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.ellipse(gx, gy + 60, 20, 28, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3. Paws (Big detailed dog paws in front)
        // Left Paw
        ctx.fillStyle = '#b45309'; // tan paw
        ctx.beginPath();
        ctx.ellipse(gx - 18, gy + 92, 11, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        // Paw pads/lines
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(gx - 22, gy + 88); ctx.lineTo(gx - 22, gy + 98);
        ctx.moveTo(gx - 14, gy + 88); ctx.lineTo(gx - 14, gy + 98);
        ctx.stroke();

        // Right Paw (maybe white tipped paw!)
        ctx.fillStyle = '#f8fafc'; // white tipped right paw
        ctx.beginPath();
        ctx.ellipse(gx + 18, gy + 92, 11, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        // Paw lines
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(gx + 14, gy + 88); ctx.lineTo(gx + 14, gy + 98);
        ctx.moveTo(gx + 22, gy + 88); ctx.lineTo(gx + 22, gy + 98);
        ctx.stroke();

        // 4. Red Collar with Golden Tag
        ctx.strokeStyle = '#ef4444'; // Red
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.arc(gx, gy + 20, 20, 0, Math.PI);
        ctx.stroke();
        // Gold Tag
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(gx, gy + 32, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // 5. Dog Head
        ctx.fillStyle = '#1c1917'; // black-brown head
        ctx.beginPath();
        ctx.arc(gx, gy, 21, 0, Math.PI * 2);
        ctx.fill();

        // Tan spots (eyebrows) above eyes (classic Rottweiler look)
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.ellipse(gx - 8, gy - 11, 4.5, 2.5, 0, 0, Math.PI * 2);
        ctx.ellipse(gx + 8, gy - 11, 4.5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cute floppy drooping ears
        // Left drooping ear (shaded)
        ctx.fillStyle = '#171717'; // darker inner
        ctx.beginPath();
        ctx.ellipse(gx - 18, gy, 7, 18, Math.PI / 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#b45309'; // tan ear flap outline/back
        ctx.beginPath();
        ctx.ellipse(gx - 20, gy, 5, 15, Math.PI / 5, 0, Math.PI * 2);
        ctx.fill();

        // Right drooping ear
        ctx.fillStyle = '#171717';
        ctx.beginPath();
        ctx.ellipse(gx + 18, gy, 7, 18, -Math.PI / 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1c1917'; // dark right ear
        ctx.beginPath();
        ctx.ellipse(gx + 20, gy, 5, 15, -Math.PI / 5, 0, Math.PI * 2);
        ctx.fill();

        // 6. Muzzle & Wet Nose
        ctx.fillStyle = '#b45309'; // brown snout
        ctx.beginPath();
        ctx.ellipse(gx, gy + 6, 11, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Little pink tongue poking out! (Cute detail)
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.ellipse(gx, gy + 14, 4, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nose tip
        ctx.fillStyle = '#09090b';
        ctx.beginPath();
        ctx.arc(gx, gy + 11, 4, 0, Math.PI * 2);
        ctx.fill();

        // 7. Glowing Amber reflective dog eyes
        ctx.fillStyle = '#f97316';
        ctx.shadowColor = '#ea580c';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(gx - 7, gy - 2, 3.5, 0, Math.PI * 2);
        ctx.arc(gx + 7, gy - 2, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset

        // Eye highlights (shiny white dots)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(gx - 8.5, gy - 3.5, 1, 0, Math.PI * 2);
        ctx.arc(gx + 5.5, gy - 3.5, 1, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2c. DRAW SHELLY IN THE CAMERA IF SHE IS HERE
      if (shellyPosition === activeCam && !camInterference.active) {
        const sx = cw / 2 + 120; // offset from Milka to the right
        const sy = ch / 2 + 40;

        ctx.save();
        // 1. Tail (standing up alert, with slightly twitching tip)
        const tailTwitch = Math.sin(Date.now() / 120) * 0.15;
        ctx.strokeStyle = '#171717';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx + 15, sy + 60);
        ctx.quadraticCurveTo(sx + 35, sy + 30 + tailTwitch * 40, sx + 25 + tailTwitch * 15, sy - 10);
        ctx.stroke();

        // 2. Body (sitting upright)
        ctx.fillStyle = '#171717';
        ctx.beginPath();
        ctx.ellipse(sx, sy + 40, 25, 32, 0, 0, Math.PI * 2);
        ctx.fill();

        // White chest patch
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(sx, sy + 30, 10, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3. Head
        ctx.fillStyle = '#171717';
        ctx.beginPath();
        ctx.arc(sx, sy, 18, 0, Math.PI * 2);
        ctx.fill();

        // Pointy Ears
        ctx.fillStyle = '#171717';
        ctx.beginPath();
        ctx.moveTo(sx - 15, sy - 10);
        ctx.lineTo(sx - 20, sy - 28);
        ctx.lineTo(sx - 5, sy - 16);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(sx + 15, sy - 10);
        ctx.lineTo(sx + 20, sy - 28);
        ctx.lineTo(sx + 5, sy - 16);
        ctx.fill();

        // Inner pink ears
        ctx.fillStyle = '#fda4af';
        ctx.beginPath();
        ctx.moveTo(sx - 13, sy - 11);
        ctx.lineTo(sx - 17, sy - 24);
        ctx.lineTo(sx - 7, sy - 15);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(sx + 13, sy - 11);
        ctx.lineTo(sx + 17, sy - 24);
        ctx.lineTo(sx + 7, sy - 15);
        ctx.fill();

        // Glowing Amber Eyes (gold/yellow eyes)
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#ea580c';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(sx - 7, sy - 3, 3, 0, Math.PI * 2);
        ctx.arc(sx + 7, sy - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset

        // Pupil slits
        ctx.fillStyle = '#000000';
        ctx.fillRect(sx - 7.5, -5 + sy, 1, 4);
        ctx.fillRect(sx + 6.5, -5 + sy, 1, 4);

        // Pink nose and cute muzzle
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.arc(sx, sy + 2, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // White sock front paws
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(sx - 10, sy + 68, 6, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(sx + 10, sy + 68, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // 3. DRAW TREAT / FOOD IN THE CAMERA
      if (activeTreats[activeCam] > 0) {
        const tx = cw / 2 - 150;
        const ty = ch / 2 + 100;
        
        // Draw food bowl
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.ellipse(tx, ty, 20, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(tx - 20, ty - 8, 40, 8);
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath();
        ctx.ellipse(tx, ty - 8, 20, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // fish skeleton inside
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(tx - 10, ty - 8);
        ctx.lineTo(tx + 10, ty - 8);
        // ribs
        ctx.moveTo(tx - 5, ty - 12); ctx.lineTo(tx - 5, ty - 4);
        ctx.moveTo(tx, ty - 12); ctx.lineTo(tx, ty - 4);
        ctx.moveTo(tx + 5, ty - 12); ctx.lineTo(tx + 5, ty - 4);
        ctx.stroke();

        // Treat Timer text
        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`🥩 ЛАСОЩІ: ${activeTreats[activeCam]}с`, tx, ty + 22);
      }

      // Draw Pâté bowl if active in camera
      if (activePate[activeCam] > 0) {
        const px = cw / 2 + 150;
        const py = ch / 2 + 100;
        
        // Draw Pate Can
        ctx.fillStyle = '#f97316'; // orange can
        ctx.beginPath();
        ctx.ellipse(px, py, 20, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(px - 20, py - 8, 40, 8);
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.ellipse(px, py - 8, 20, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // white label pattern
        ctx.fillStyle = '#ffedd5';
        ctx.beginPath();
        ctx.ellipse(px, py - 8, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pate Timer text
        ctx.fillStyle = '#f97316';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`🥫 ПАШТЕТ: ${activePate[activeCam]}с`, px, py + 22);
      }

      // 4. DRAW SCANLINES & NOISE INTERFERENCE EFFECT
      const interferenceIntensity = camInterference.active ? 0.95 : 0.08;
      
      // Moving CRT Scanlines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let y = staticOffset; y < ch; y += 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cw, y);
        ctx.stroke();
      }

      // Random Snow / Static noise dots
      ctx.fillStyle = `rgba(255, 255, 255, ${interferenceIntensity})`;
      const noiseDots = camInterference.active ? 8000 : 250;
      for (let n = 0; n < noiseDots; n++) {
        const nx = Math.random() * cw;
        const ny = Math.random() * ch;
        const nw = Math.random() * 2 + 1;
        ctx.fillRect(nx, ny, nw, nw);
      }

      // Glitch bar
      if (Math.random() > 0.8) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.25})`;
        ctx.fillRect(0, Math.random() * ch, cw, Math.random() * 25);
      }

      // "LIVE" indicator
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(40, 40, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('LIVE', 55, 45);

      // Camera label
      ctx.fillText(getCameraLabel(activeCam), 40, 75);

      // 5. CAMERA FLASH BLINDING EFFECT OVERLAY
      if (flashIntensityRef.current > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensityRef.current})`;
        ctx.fillRect(0, 0, cw, ch);
        flashIntensityRef.current = Math.max(0, flashIntensityRef.current - 0.05); // fade out over 20 frames (approx 0.3 seconds)
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [isMonitorOpen, activeCam, milkaPosition, milkaState, activeTreats, activePate, camInterference, garikPosition]);

  // Click handler on blueprint map
  const selectCamera = (roomId: RoomId) => {
    sound.playCameraSwitch(getRoomPan(roomId));
    setActiveCam(roomId);
  };

  const getCameraLabel = (rid: RoomId) => {
    switch (rid) {
      case 'KITCHEN_2': return getTranslation(language, 'roomKitchen2');
      case 'LIVING_2': return getTranslation(language, 'roomLiving2');
      case 'BEDROOM_3': return getTranslation(language, 'roomBedroom3');
      case 'VERANDA': return getTranslation(language, 'roomVeranda');
      case 'CORRIDOR': return getTranslation(language, 'roomCorridor');
      case 'TOILET': return getTranslation(language, 'roomToilet');
      case 'KITCHEN': return getTranslation(language, 'roomKitchen');
      case 'LIVING': return getTranslation(language, 'roomLiving');
      case 'PLAYER_ROOM': return getTranslation(language, 'roomPlayerRoom');
      case 'HALL': return getTranslation(language, 'roomHall');
      case 'STREET': return getTranslation(language, 'roomStreet');
      case 'ATTIC': return getTranslation(language, 'roomAttic');
      case 'GARDEN': return getTranslation(language, 'roomGarden');
      case 'GARAGE': return getTranslation(language, 'roomGarage');
      default: return '';
    }
  };

  const handleDropTreatClick = () => {
    if (upgrades.treatsCount <= 0) return;
    if (activeTreats[activeCam] > 0) return; // already has treats
    
    sound.playClick();
    onDropTreat(activeCam);
  };

  useEffect(() => {
    if (!isFlashCooldown) return;
    const interval = setInterval(() => {
      setFlashCooldownTime(prev => {
        if (prev <= 1) {
          setIsFlashCooldown(false);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isFlashCooldown]);

  const handleCameraFlashClick = () => {
    if (power <= 0 || isFlashCooldown || camInterference.active) return;
    
    sound.playCameraFlash();
    flashIntensityRef.current = 1.0;
    onCameraFlash(activeCam);
    
    setIsFlashCooldown(true);
    setFlashCooldownTime(5); // 5 seconds cooldown
  };

  const containerW = containerRef.current?.getBoundingClientRect().width || 1000;
  const maxScroll = 1400 - containerW;
  const scrollX = (mouseX / containerW) * maxScroll;
  const isLookingAtShelly = scrollX < 180;

  return (
    <div 
      id="game-viewport-container"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onClick={handleOfficeClick}
      className="relative w-full max-w-[1000px] h-[600px] overflow-hidden select-none bg-black rounded-lg border border-neutral-900 shadow-2xl mx-auto"
    >
      {/* 1. PANNING OFFICE BACKGROUND CANVAS */}
      {!isMonitorOpen && (
        <canvas
          id="office-canvas"
          ref={canvasRef}
          width={1400}
          height={600}
          className="absolute top-0 left-0 h-full cursor-crosshair transition-transform duration-75 ease-out"
          style={{
            transform: `translateX(-${(mouseX / (containerRef.current?.getBoundingClientRect().width || 1000)) * (1400 - (containerRef.current?.getBoundingClientRect().width || 1000))}px)`
          }}
        />
      )}

      {/* 2. SECURITY OFFICE INTERACTIVE BUTTONS LAYER */}
      {!isMonitorOpen && power > 0 && (
        <div 
          id="office-hardware-controls"
          className="absolute inset-0 pointer-events-none"
          style={{
            width: '1400px',
            transform: `translateX(-${(mouseX / (containerRef.current?.getBoundingClientRect().width || 1000)) * (1400 - (containerRef.current?.getBoundingClientRect().width || 1000))}px)`
          }}
        >
          {/* Shelly's Pet Button (Only visible if waking up and looking left) */}
          {shellyState === 'WAKING_UP' && isLookingAtShelly && (
            <div 
              id="shelly-pet-control-zone"
              className="absolute left-[50px] top-[385px] w-[150px] flex flex-col items-center gap-2 pointer-events-auto z-25"
            >
              {/* Petting instruction / feedback */}
              <div className="bg-black/90 text-[10px] text-amber-400 font-mono py-1 px-2 rounded border border-amber-500/40 animate-pulse text-center select-none shadow-md">
                {isPetting ? 'ГЛАДИТЬ ШЕЛЛІ...' : 'ШЕЛЛІ ПРОКИДАЄТЬСЯ!'}
              </div>
              
              <button
                id="btn-pet-shelly"
                onMouseDown={startPetting}
                onMouseUp={stopPetting}
                onMouseLeave={stopPetting}
                onTouchStart={startPetting}
                onTouchEnd={stopPetting}
                className={`relative w-32 h-10 rounded-full font-bold text-[11px] cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.35)] border-2 flex items-center justify-center gap-1.5 select-none transition-all duration-150 ${
                  isPetting 
                    ? 'bg-amber-500 text-black border-amber-400 scale-95' 
                    : 'bg-neutral-900 text-amber-400 border-amber-500 hover:bg-neutral-800 hover:text-amber-300'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 fill-current ${isPetting ? 'animate-ping' : ''}`} />
                ПОГЛАДИТИ
              </button>

              {/* Pet Progress Bar */}
              <div className="w-24 h-2 bg-neutral-950 rounded-full border border-neutral-800 overflow-hidden">
                <div 
                  className="h-full bg-amber-500 transition-all duration-75 ease-out"
                  style={{ width: `${petProgress}%` }}
                />
              </div>

              {/* Danger Timer */}
              <div className="text-[10px] text-red-500 font-mono tracking-wider font-semibold">
                ЧАСУ: {shellyTimer}с
              </div>
            </div>
          )}

          {/* Left Ventilation Shutter & Light Control switches */}
          <div className="absolute left-[220px] top-[200px] w-12 h-36 flex flex-col gap-4 pointer-events-auto z-20">
            <button
              id="btn-door-left"
              onClick={() => {
                sound.playDoorToggle(!isLeftDoorClosed, -0.75);
                onCloseLeftDoor(!isLeftDoorClosed);
              }}
              className={`w-12 h-12 rounded-lg border font-bold text-[10px] cursor-pointer shadow-lg flex items-center justify-center transition ${
                isLeftDoorClosed 
                  ? 'bg-orange-600 border-orange-500 text-white animate-pulse' 
                  : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700 hover:text-white'
              }`}
            >
              ВЕНТ.
            </button>
            <button
              id="btn-light-left"
              onClick={() => {
                sound.playClick(-0.75);
                setLeftLight(!leftLight);
                setRightLight(false);
              }}
              className={`w-12 h-12 rounded-lg border font-bold text-xs cursor-pointer shadow-lg flex items-center justify-center transition ${
                leftLight 
                  ? 'bg-yellow-500 border-yellow-400 text-black font-extrabold' 
                  : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700 hover:text-white'
              }`}
            >
              СВІТЛО
            </button>
          </div>

          {/* Right Door & Light Shutter Control switches */}
          <div className="absolute right-[170px] top-[200px] w-12 h-36 flex flex-col gap-4 pointer-events-auto z-20">
            <button
              id="btn-door-right"
              onClick={() => {
                sound.playDoorToggle(!isRightDoorClosed, 0.75);
                onCloseRightDoor(!isRightDoorClosed);
              }}
              className={`w-12 h-12 rounded-lg border font-bold text-xs cursor-pointer shadow-lg flex items-center justify-center transition ${
                isRightDoorClosed 
                  ? 'bg-red-600 border-red-500 text-white animate-pulse' 
                  : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700 hover:text-white'
              }`}
            >
              ДВЕРІ
            </button>
            <button
              id="btn-light-right"
              onClick={() => {
                sound.playClick(0.75);
                setRightLight(!rightLight);
                setLeftLight(false);
              }}
              className={`w-12 h-12 rounded-lg border font-bold text-xs cursor-pointer shadow-lg flex items-center justify-center transition ${
                rightLight 
                  ? 'bg-yellow-500 border-yellow-400 text-black font-extrabold' 
                  : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700 hover:text-white'
              }`}
            >
              СВІТЛО
            </button>
          </div>
        </div>
      )}

      {/* 3. FLASHLIGHT, MASK & PANTRY HUD TRIGGER BUTTONS */}
      {!isMonitorOpen && power > 0 && (
        <div id="touch-controls-hud" className="absolute bottom-4 left-4 flex gap-2.5 z-30 pointer-events-auto">
          {/* Flashlight button */}
          {battery > 0 && (
            <button
              onMouseDown={() => { if (!isMaskOn && !isPantryOpen) setUseFlashlight(true); }}
              onMouseUp={() => setUseFlashlight(false)}
              onTouchStart={() => { if (!isMaskOn && !isPantryOpen) setUseFlashlight(true); }}
              onTouchEnd={() => setUseFlashlight(false)}
              disabled={isMaskOn || isPantryOpen}
              className={`px-4 py-2.5 rounded-md border font-bold text-xs cursor-pointer select-none transition ${
                useFlashlight 
                  ? 'bg-yellow-500 border-yellow-400 text-black' 
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
              }`}
            >
              {getTranslation(language, 'flashlightTouchLabel')}
            </button>
          )}

          {/* Milka Mask button */}
          <button
            onClick={() => {
              if (isPantryOpen) return;
              const newMask = !isMaskOn;
              setIsMaskOn(newMask);
              sound.playClick();
              if (newMask) {
                if (isMonitorOpen) onToggleMonitor(false);
                setUseFlashlight(false);
                setLeftLight(false);
                setRightLight(false);
              }
            }}
            disabled={isPantryOpen}
            className={`px-4 py-2.5 rounded-md border font-bold text-xs cursor-pointer select-none transition ${
              isMaskOn 
                ? 'bg-emerald-600 border-emerald-500 text-white animate-pulse' 
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
            }`}
          >
            {getTranslation(language, 'maskButtonLabel')}
          </button>

          {/* Pantry transition button (TOGGLE) */}
          <button
            onClick={() => {
              if (isMaskOn || isMonitorOpen) return;
              const newPantryState = !isPantryOpen;
              setIsPantryOpen(newPantryState);
              sound.playClick();
              // Turn off lights
              if (newPantryState) {
                setUseFlashlight(false);
                setLeftLight(false);
                setRightLight(false);
              }
            }}
            disabled={isMaskOn || isMonitorOpen}
            className={`px-4 py-2.5 rounded-md border font-bold text-xs cursor-pointer select-none transition ${
              isPantryOpen 
                ? 'bg-orange-600 border-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)] animate-pulse' 
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
            }`}
          >
            {getTranslation(language, 'pantryButtonLabel')}
          </button>
        </div>
      )}

      {/* 4. SECURITY CAMERAS MONITOR INTERFACE */}
      {isMonitorOpen && (
        <div id="camera-monitor-overlay" className="absolute inset-0 bg-neutral-950 flex flex-col md:flex-row z-40 p-4 font-mono">
          {/* Main Camera view feed */}
          <div className="relative flex-1 bg-black rounded border border-neutral-800 overflow-hidden h-[340px] md:h-full">
            <canvas
              ref={monitorCanvasRef}
              width={800}
              height={520}
              className="w-full h-full object-cover"
            />

            {/* Display active camera room details */}
            <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5 z-50">
              <div className="bg-neutral-900/80 border border-neutral-700 px-3 py-1.5 rounded text-xs text-neutral-300">
                {getCameraLabel(activeCam)}
              </div>
              {customNightConfig?.radarActive && (
                <div className="bg-red-950/85 border border-red-700 px-3 py-1.5 rounded text-xs text-red-300 font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(239,68,68,0.25)] animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-[ping_1s_infinite]" />
                  <span>RADAR: {getCameraLabel(milkaPosition)}</span>
                </div>
              )}
            </div>

            {/* Feed interference message */}
            {camInterference.active && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-neutral-300 animate-pulse gap-2">
                <Radio className="w-10 h-10 text-amber-500" />
                <span className="font-bold text-sm tracking-wider">ПЕРЕШКОДИ СИГНАЛУ... ПЕРЕЗАВАНТАЖЕННЯ</span>
              </div>
            )}


            {/* Drop Food Action inside the active room */}
            <div className="absolute bottom-4 left-4 flex gap-2 z-50">
              <button
                id="btn-drop-treat"
                disabled={upgrades.treatsCount <= 0 || activeTreats[activeCam] > 0 || activePate[activeCam] > 0 || camInterference.active}
                onClick={handleDropTreatClick}
                className={`px-3 py-1.5 rounded border font-bold text-[10px] flex items-center gap-1.5 transition cursor-pointer ${
                  upgrades.treatsCount <= 0 || activeTreats[activeCam] > 0 || activePate[activeCam] > 0 || camInterference.active
                    ? 'bg-neutral-900/60 border-neutral-800 text-neutral-600 cursor-not-allowed'
                    : 'bg-amber-600 border-amber-500 text-white hover:bg-amber-500 shadow-[0_2px_8px_rgba(245,158,11,0.2)]'
                }`}
              >
                <span>🥩 КОРМ</span>
                <span className="bg-neutral-950/40 text-amber-300 border border-amber-500/20 px-1 py-0.5 rounded text-[9px]">
                  {upgrades.treatsCount} шт.
                </span>
              </button>

              <button
                id="btn-drop-pate"
                disabled={(upgrades.pateCount || 0) <= 0 || activeTreats[activeCam] > 0 || activePate[activeCam] > 0 || camInterference.active}
                onClick={() => {
                  if ((upgrades.pateCount || 0) <= 0) return;
                  sound.playClick();
                  onDropPate(activeCam);
                }}
                className={`px-3 py-1.5 rounded border font-bold text-[10px] flex items-center gap-1.5 transition cursor-pointer ${
                  (upgrades.pateCount || 0) <= 0 || activeTreats[activeCam] > 0 || activePate[activeCam] > 0 || camInterference.active
                    ? 'bg-neutral-900/60 border-neutral-800 text-neutral-600 cursor-not-allowed'
                    : 'bg-orange-600 border-orange-500 text-white hover:bg-orange-500 shadow-[0_2px_8px_rgba(249,115,22,0.2)]'
                }`}
              >
                <span>🥫 ПАШТЕТ</span>
                <span className="bg-neutral-950/40 text-orange-300 border border-orange-500/20 px-1 py-0.5 rounded text-[9px]">
                  {upgrades.pateCount || 0} шт.
                </span>
              </button>

              <button
                id="btn-camera-flash"
                disabled={power <= 0 || isFlashCooldown || camInterference.active}
                onClick={handleCameraFlashClick}
                className={`px-3 py-1.5 rounded border font-bold text-[10px] flex items-center gap-1.5 transition cursor-pointer ${
                  power <= 0 || isFlashCooldown || camInterference.active
                    ? 'bg-neutral-900/60 border-neutral-800 text-neutral-600 cursor-not-allowed'
                    : 'bg-blue-600 border-blue-500 text-white hover:bg-blue-500 shadow-[0_2px_8px_rgba(59,130,246,0.2)]'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-blue-300" />
                <span>⚡ СПАЛАХ</span>
                {isFlashCooldown && (
                  <span className="text-neutral-400 text-[9px] font-mono">
                    ({flashCooldownTime}с)
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Map Blueprint Control Panel & Rooms */}
          <div className="w-full md:w-[320px] bg-neutral-950 md:border-l border-neutral-900 p-4 flex flex-col justify-between h-auto md:h-full overflow-y-auto">
            <div>
              <h2 className="text-sm font-bold text-neutral-400 mb-4 border-b border-neutral-800 pb-2">КАРТА БУДИНКУ</h2>
              
              {/* House Blueprint map schematic */}
              <div className="relative w-full h-[320px] border border-neutral-850 bg-neutral-950/80 rounded p-2 overflow-hidden select-none">
                {/* Simulated blueprint connections */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 320 320">
                  {/* Grid Lines background */}
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#0ea5e9" strokeWidth="0.5" opacity="0.15" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* Walls of the house - styled like a cyan blueprint */}
                  <g stroke="#0ea5e9" strokeWidth="1.5" fill="none" opacity="0.5">
                    {/* Office (Top Left) */}
                    <rect x="25" y="20" width="80" height="45" rx="3" />
                    {/* Pantry / Кладова (Below Office) */}
                    <rect x="25" y="80" width="80" height="35" rx="3" />
                    {/* Antechamber / Передпокій (Below Pantry) */}
                    <rect x="25" y="130" width="80" height="45" rx="3" />
                    
                    {/* Top Right Building (Guest House) */}
                    <rect x="150" y="20" width="145" height="120" rx="4" />

                    {/* Main Corridor Pathway outlines */}
                    <path d="M 105,42 L 145,100 L 145,210 L 25,210 Z" />

                    {/* Bottom Section Block */}
                    <rect x="15" y="225" width="290" height="85" rx="4" strokeWidth="2" />
                    {/* Bottom 5 Room Cells */}
                    <rect x="25" y="255" width="45" height="45" rx="2" />
                    <rect x="80" y="255" width="45" height="45" rx="2" />
                    <rect x="135" y="255" width="45" height="45" rx="2" />
                    <rect x="190" y="255" width="45" height="45" rx="2" />
                    <rect x="245" y="255" width="45" height="45" rx="2" />

                    {/* Door indicators (dashed red lines for Office access) */}
                    <line x1="65" y1="65" x2="65" y2="80" strokeDasharray="3,3" stroke="#ef4444" strokeWidth="2" />
                    <line x1="105" y1="42" x2="118" y2="42" strokeDasharray="3,3" stroke="#ef4444" strokeWidth="2" />
                  </g>

                  {/* Cyan Glow Connection Paths (animate-pulse) */}
                  <g stroke="#06b6d4" strokeWidth="1.2" fill="none" opacity="0.35" className="animate-pulse">
                    {/* STREET to CORRIDOR */}
                    <line x1="220" y1="140" x2="145" y2="170" />
                    {/* CORRIDOR to HALL */}
                    <line x1="110" y1="170" x2="65" y2="155" />
                    {/* HALL to TOILET (Кладова) */}
                    <line x1="65" y1="130" x2="65" y2="115" />
                    {/* TOILET to LEFT_DOOR */}
                    <line x1="65" y1="80" x2="65" y2="65" stroke="#ef4444" strokeWidth="1.5" />
                    {/* CORRIDOR to RIGHT_DOOR */}
                    <line x1="105" y1="42" x2="118" y2="42" stroke="#ef4444" strokeWidth="1.5" />
                  </g>
                </svg>

                {/* Rooms selection buttons positioned to match house plan */}
                {/* CAM 1 - Bottom Left (Склад зліва) */}
                <button
                  onClick={() => selectCamera('KITCHEN_2')}
                  className={`absolute text-[8px] font-bold py-0.5 px-0.5 transition cursor-pointer text-center rounded border leading-tight ${
                    activeCam === 'KITCHEN_2' 
                      ? 'bg-sky-950 border-sky-500 text-sky-300 shadow-[0_0_8px_rgba(14,165,233,0.35)]' 
                      : 'bg-neutral-900/90 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                  style={{ top: '80%', left: '8%', width: '14%', height: '14%' }}
                >
                  CAM 1<div className="text-[6px] font-medium opacity-80 truncate">Склад L</div>
                </button>

                {/* CAM 3 - Bottom Mid-Left (Серверна) */}
                <button
                  onClick={() => selectCamera('BEDROOM_3')}
                  className={`absolute text-[8px] font-bold py-0.5 px-0.5 transition cursor-pointer text-center rounded border leading-tight ${
                    activeCam === 'BEDROOM_3' 
                      ? 'bg-sky-950 border-sky-500 text-sky-300 shadow-[0_0_8px_rgba(14,165,233,0.35)]' 
                      : 'bg-neutral-900/90 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                  style={{ top: '80%', left: '25%', width: '14%', height: '14%' }}
                >
                  CAM 3<div className="text-[6px] font-medium opacity-80 truncate">Серверна</div>
                </button>

                {/* CAM 2 - Bottom Mid (Кабінет) */}
                <button
                  onClick={() => selectCamera('LIVING_2')}
                  className={`absolute text-[8px] font-bold py-0.5 px-0.5 transition cursor-pointer text-center rounded border leading-tight ${
                    activeCam === 'LIVING_2' 
                      ? 'bg-sky-950 border-sky-500 text-sky-300 shadow-[0_0_8px_rgba(14,165,233,0.35)]' 
                      : 'bg-neutral-900/90 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                  style={{ top: '80%', left: '42%', width: '14%', height: '14%' }}
                >
                  CAM 2<div className="text-[6px] font-medium opacity-80 truncate">Кабінет</div>
                </button>

                {/* CAM 4 - Bottom Mid-Right (Електрощитова) */}
                <button
                  onClick={() => selectCamera('VERANDA')}
                  className={`absolute text-[8px] font-bold py-0.5 px-0.5 transition cursor-pointer text-center rounded border leading-tight ${
                    activeCam === 'VERANDA' 
                      ? 'bg-sky-950 border-sky-500 text-sky-300 shadow-[0_0_8px_rgba(14,165,233,0.35)]' 
                      : 'bg-neutral-900/90 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                  style={{ top: '80%', left: '59%', width: '14%', height: '14%' }}
                >
                  CAM 4<div className="text-[6px] font-medium opacity-80 truncate">Електро</div>
                </button>

                {/* CAM 7 - Bottom Right (Склад справа) */}
                <button
                  onClick={() => selectCamera('KITCHEN')}
                  className={`absolute text-[8px] font-bold py-0.5 px-0.5 transition cursor-pointer text-center rounded border leading-tight ${
                    activeCam === 'KITCHEN' 
                      ? 'bg-sky-950 border-sky-500 text-sky-300 shadow-[0_0_8px_rgba(14,165,233,0.35)]' 
                      : 'bg-neutral-900/90 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                  style={{ top: '80%', left: '76%', width: '14%', height: '14%' }}
                >
                  CAM 7<div className="text-[6px] font-medium opacity-80 truncate">Склад R</div>
                </button>

                {/* CAM 8 - Bottom Corridor Pathway */}
                <button
                  onClick={() => selectCamera('LIVING')}
                  className={`absolute text-[8px] font-bold py-0.5 px-0.5 transition cursor-pointer text-center rounded border leading-tight ${
                    activeCam === 'LIVING' 
                      ? 'bg-sky-950 border-sky-500 text-sky-300 shadow-[0_0_8px_rgba(14,165,233,0.35)]' 
                      : 'bg-neutral-900/90 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                  style={{ top: '61%', left: '10%', width: '36%', height: '10%' }}
                >
                  CAM 8<div className="text-[6px] font-medium opacity-80 truncate">Нижній коридор</div>
                </button>

                {/* CAM 9 - Bottom Passage Pathway */}
                <button
                  onClick={() => selectCamera('PLAYER_ROOM')}
                  className={`absolute text-[8px] font-bold py-0.5 px-0.5 transition cursor-pointer text-center rounded border leading-tight ${
                    activeCam === 'PLAYER_ROOM' 
                      ? 'bg-sky-950 border-sky-500 text-sky-300 shadow-[0_0_8px_rgba(14,165,233,0.35)]' 
                      : 'bg-neutral-900/90 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                  style={{ top: '61%', left: '50%', width: '36%', height: '10%' }}
                >
                  CAM 9<div className="text-[6px] font-medium opacity-80 truncate">Нижній прохід</div>
                </button>

                {/* CAM 5 - Main Corridor (Коридор) */}
                <button
                  onClick={() => selectCamera('CORRIDOR')}
                  className={`absolute text-[8px] font-bold py-0.5 px-0.5 transition cursor-pointer text-center rounded border leading-tight ${
                    activeCam === 'CORRIDOR' 
                      ? 'bg-sky-950 border-sky-500 text-sky-300 shadow-[0_0_8px_rgba(14,165,233,0.35)]' 
                      : 'bg-neutral-900/90 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                  style={{ top: '44%', left: '38%', width: '22%', height: '12%' }}
                >
                  CAM 5<div className="text-[6px] font-medium opacity-80 truncate">Коридор</div>
                </button>

                {/* CAM 10 - Antechamber (Передпокій) */}
                <button
                  onClick={() => selectCamera('HALL')}
                  className={`absolute text-[8px] font-bold py-0.5 px-0.5 transition cursor-pointer text-center rounded border leading-tight ${
                    activeCam === 'HALL' 
                      ? 'bg-sky-950 border-sky-500 text-sky-300 shadow-[0_0_8px_rgba(14,165,233,0.35)]' 
                      : 'bg-neutral-900/90 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                  style={{ top: '44%', left: '10%', width: '23%', height: '12%' }}
                >
                  CAM 10<div className="text-[6px] font-medium opacity-80 truncate">Передпокій</div>
                </button>

                {/* CAM 6 - Pantry Room (Кладова) */}
                <button
                  onClick={() => selectCamera('TOILET')}
                  className={`absolute text-[8px] font-bold py-0.5 px-0.5 transition cursor-pointer text-center rounded border leading-tight ${
                    activeCam === 'TOILET' 
                      ? 'bg-sky-950 border-sky-500 text-sky-300 shadow-[0_0_8px_rgba(14,165,233,0.35)]' 
                      : 'bg-neutral-900/90 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                  style={{ top: '28%', left: '10%', width: '23%', height: '10%' }}
                >
                  CAM 6<div className="text-[6px] font-medium opacity-80 truncate">Кладова</div>
                </button>

                {/* CAM 11 - Guest House (Гостьовий будинок) */}
                <button
                  onClick={() => selectCamera('STREET')}
                  className={`absolute text-[8px] font-bold py-0.5 px-0.5 transition cursor-pointer text-center rounded border leading-tight ${
                    activeCam === 'STREET' 
                      ? 'bg-sky-950 border-sky-500 text-sky-300 shadow-[0_0_8px_rgba(14,165,233,0.35)]' 
                      : 'bg-neutral-900/90 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                  style={{ top: '12%', left: '50%', width: '40%', height: '14%' }}
                >
                  CAM 11<div className="text-[6px] font-medium opacity-80 truncate">Гостьовий буд.</div>
                </button>

                {/* CAM 12 - Attic (Горище) */}
                <button
                  onClick={() => selectCamera('ATTIC')}
                  className={`absolute text-[8px] font-bold py-0.5 px-0.5 transition cursor-pointer text-center rounded border leading-tight ${
                    activeCam === 'ATTIC' 
                      ? 'bg-sky-950 border-sky-500 text-sky-300 shadow-[0_0_8px_rgba(14,165,233,0.35)]' 
                      : 'bg-neutral-900/90 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                  style={{ top: '28%', left: '65%', width: '25%', height: '10%' }}
                >
                  CAM 12<div className="text-[6px] font-medium opacity-80 truncate">Горище</div>
                </button>

                {/* CAM 13 - Garden (Сад) */}
                <button
                  onClick={() => selectCamera('GARDEN')}
                  className={`absolute text-[8px] font-bold py-0.5 px-0.5 transition cursor-pointer text-center rounded border leading-tight ${
                    activeCam === 'GARDEN' 
                      ? 'bg-sky-950 border-sky-500 text-sky-300 shadow-[0_0_8px_rgba(14,165,233,0.35)]' 
                      : 'bg-neutral-900/90 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                  style={{ top: '12%', left: '10%', width: '16%', height: '12%' }}
                >
                  CAM 13<div className="text-[6px] font-medium opacity-80 truncate">Сад</div>
                </button>

                {/* CAM 14 - Garage (Гараж) */}
                <button
                  onClick={() => selectCamera('GARAGE')}
                  className={`absolute text-[8px] font-bold py-0.5 px-0.5 transition cursor-pointer text-center rounded border leading-tight ${
                    activeCam === 'GARAGE' 
                      ? 'bg-sky-950 border-sky-500 text-sky-300 shadow-[0_0_8px_rgba(14,165,233,0.35)]' 
                      : 'bg-neutral-900/90 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                  style={{ top: '12%', left: '29%', width: '16%', height: '12%' }}
                >
                  CAM 14<div className="text-[6px] font-medium opacity-80 truncate">Гараж</div>
                </button>

                {/* Player Office Label Reference */}
                <div className="absolute text-[8px] font-bold text-neutral-500 border border-neutral-800/40 bg-neutral-950/40 px-1 py-0.5 rounded text-center select-none flex flex-col justify-center items-center" style={{ top: '1%', left: '10%', width: '35%', height: '8%' }}>
                  📍 ОФІС
                </div>
              </div>
            </div>

            {/* Hint overlay */}
            <div className="text-[10px] text-neutral-500 leading-relaxed border-t border-neutral-900 pt-4 hidden md:block">
              * Смаколики з лососем затримують кішку у відповідній кімнаті на тривалий час. Купуйте їх в магазині перед зміною.
            </div>
          </div>
        </div>
      )}

      {/* 5. CAMERA TOGGLE SWITCH BUTTON (At the bottom of the office screen, FNAF style!) */}
      {power > 0 && (
        <div 
          id="btn-monitor-toggle-region"
          onClick={toggleMonitor}
          onMouseEnter={toggleMonitor}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-10 bg-neutral-900/80 hover:bg-sky-950 border-t border-x border-neutral-700/60 rounded-t-xl cursor-pointer flex items-center justify-center gap-2 group transition duration-200 z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.5)]"
        >
          <div className="w-[120px] h-1.5 bg-neutral-700 group-hover:bg-sky-500 rounded-full transition-all duration-200" />
          <span className="text-[10px] font-bold text-neutral-400 group-hover:text-sky-300 tracking-wider">МОНІТОР [Ctrl]</span>
        </div>
      )}

      {/* 6. STATIC CRT HUD GRAPHICS OVERLAY */}
      <div id="crt-hud-overlay" className="absolute top-4 left-4 flex flex-col gap-2 font-mono text-xs z-30 pointer-events-none">
        {/* Current Time Clock */}
        <div className="flex items-baseline gap-1.5 bg-black/60 border border-neutral-800/80 px-3 py-1.5 rounded backdrop-blur-sm shadow-[0_4px_10px_rgba(0,0,0,0.4)]">
          <span className="text-neutral-400 text-[10px] tracking-wide">ЧАС:</span>
          <span className="text-neutral-100 font-bold text-lg tracking-wider animate-pulse">{timeString}</span>
        </div>

        {/* Current Night */}
        <div className="bg-black/60 border border-neutral-800/80 px-3 py-1 rounded backdrop-blur-sm w-fit">
          <span className="text-neutral-400 text-[10px]">НІЧ:</span>
          <span className="text-red-500 font-bold ml-1">
            {night === (unlockedTwelveNights ? 12 : 5) ? `${night} (ФІНАЛ)` : night}
          </span>
        </div>

        {/* Garik Warning Indicator */}
        {garikPosition !== 'STREET' && (
          <div className="bg-amber-950/80 border border-amber-600/50 px-3 py-1.5 rounded backdrop-blur-sm text-[10px] text-amber-300 font-bold flex items-center gap-1.5 animate-pulse w-fit">
            <span>🐕 ГАРІК В БУДИНКУ!</span>
          </div>
        )}

        {/* Milka Anger Level Warning */}
        {milkaAngerLevel > 1.05 && (
          <div className="bg-red-950/80 border border-red-600/50 px-3 py-1.5 rounded backdrop-blur-sm text-[10px] text-red-400 font-bold flex items-center gap-1.5 animate-[pulse_0.6s_infinite] w-fit">
            <span>😾 ЛЮТЬ МІЛКИ: x{(milkaAngerLevel).toFixed(1)}</span>
          </div>
        )}

        {/* Flashlight battery */}
        <div className="flex flex-col gap-1 bg-black/60 border border-neutral-800/80 px-3 py-1.5 rounded backdrop-blur-sm w-[150px]">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-neutral-400">ЛІХТАРИК:</span>
            <span className={`font-bold ${battery > 20 ? 'text-blue-400' : 'text-red-500 animate-pulse'}`}>{Math.ceil(battery)}%</span>
          </div>
          <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
            <div 
              className={`h-full rounded-full transition-all duration-200 ${battery > 20 ? 'bg-blue-500' : 'bg-red-600'}`}
              style={{ width: `${battery}%` }}
            />
          </div>
        </div>
      </div>

      {/* 12. RETRO OWNER CALL FLOATING HUD */}
      {callState !== 'NONE' && (
        <div 
          id="owner-call-hud" 
          className="absolute top-4 right-4 flex flex-col items-end gap-2.5 font-mono z-40 max-w-sm w-80 md:w-96 select-none animate-[fadeIn_0.3s_ease-out]"
        >
          {/* Ringing / Active Status Widget */}
          <div className="w-full bg-neutral-950/95 border border-neutral-800/80 rounded-lg p-3 shadow-[0_8px_24px_rgba(0,0,0,0.85)] backdrop-blur-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Flashing ringing/call icon */}
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors duration-300 ${
                  callState === 'RINGING' 
                    ? 'bg-amber-950/40 border-amber-600/60 text-amber-500 animate-bounce' 
                    : 'bg-emerald-950/40 border-emerald-600/60 text-emerald-400 animate-pulse'
                }`}
              >
                <Phone className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                  {callState === 'RINGING' ? 'INCOMING CALL' : 'ACTIVE CALL'}
                </span>
                <span className="text-xs font-extrabold text-neutral-100 uppercase tracking-wide">
                  {language === 'uk' ? 'Власник Будинку' : language === 'ru' ? 'Хозяин Дома' : 'House Owner'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-1.5">
              {callState === 'RINGING' && (
                <button
                  onClick={() => {
                    sound.playClick();
                    setCallState('ACTIVE');
                  }}
                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 border border-emerald-600 hover:border-emerald-500 rounded text-[10px] font-extrabold text-white transition-all cursor-pointer shadow-[0_2px_8px_rgba(16,185,129,0.3)]"
                >
                  {language === 'uk' ? 'ВІДПОВІСТИ' : language === 'ru' ? 'ОТВЕТИТЬ' : 'ANSWER'}
                </button>
              )}
              
              <button
                onClick={() => {
                  sound.playClick();
                  setIsMuted(true);
                  setCallState('NONE');
                }}
                className="p-1.5 bg-red-800 hover:bg-red-700 border border-red-700 hover:border-red-600 rounded text-white transition-all cursor-pointer shadow-[0_2px_8px_rgba(239,68,68,0.3)] flex items-center justify-center gap-1"
                title="Mute / Hang Up"
              >
                <PhoneOff className="w-4 h-4" />
                <span className="text-[9px] font-bold">{language === 'uk' ? 'СКИНУТИ' : language === 'ru' ? 'СБРОСИТЬ' : 'MUTE'}</span>
              </button>
            </div>
          </div>

          {/* Scrolling Transcript/Subtitles Sub-Panel */}
          {callState === 'ACTIVE' && typedText && (
            <div className="w-full bg-black/90 border border-emerald-900/60 rounded-lg p-3 shadow-lg backdrop-blur-sm flex flex-col gap-1 border-l-4 border-l-emerald-500 animate-[fadeIn_0.2s_ease-out]">
              <div className="flex items-center justify-between text-[8px] font-bold text-emerald-500/80 tracking-widest uppercase border-b border-emerald-950 pb-1 mb-1">
                <span>📻 RADIO TRANSCRIBER</span>
                <span className="animate-pulse">● REC</span>
              </div>
              <p className="text-xs text-emerald-400 font-mono leading-relaxed select-text select-none">
                {typedText}
                <span className="w-1.5 h-3 bg-emerald-400 inline-block ml-0.5 animate-pulse" />
              </p>
            </div>
          )}
        </div>
      )}

      {/* Power meter overlay (Bottom Left) */}
      <div id="power-hud-overlay" className="absolute bottom-4 left-4 flex flex-col gap-1 bg-black/70 border border-neutral-800/80 px-3 py-1.5 rounded backdrop-blur-sm font-mono text-xs z-30 pointer-events-none w-[170px]">
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-neutral-400 flex items-center gap-1">
            <Power className="w-3.5 h-3.5 text-emerald-500" />
            ЕНЕРГІЯ:
          </span>
          <span className={`font-bold ${power > 25 ? 'text-emerald-400' : 'text-red-500 animate-pulse'}`}>{Math.ceil(power)}%</span>
        </div>
        <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
          <div 
            className={`h-full rounded-full transition-all duration-200 ${power > 25 ? 'bg-emerald-500' : 'bg-red-600'}`}
            style={{ width: `${power}%` }}
          />
        </div>

        {/* Usage meters (FNAF style green/yellow/red indicators) */}
        <div className="flex gap-1 items-center mt-1 text-[9px] text-neutral-400">
          <span>СПОЖИВАННЯ:</span>
          <div className="flex gap-0.5">
            {/* Compute active drain factors */}
            {Array.from({ length: 5 }).map((_, idx) => {
              // usage level
              let activeLevels = 1; // passive fan
              if (isLeftDoorClosed) activeLevels++;
              if (isRightDoorClosed) activeLevels++;
              if (leftLight || rightLight) activeLevels++;
              if (isMonitorOpen) activeLevels++;
              if (isLampOn && !isLampBatteryActive) activeLevels += 3; // Desk lamp consumes highly unless battery is active

              return (
                <div 
                  key={idx}
                  className={`w-1.5 h-2.5 rounded-sm ${
                    idx < activeLevels 
                      ? idx < 2 
                        ? 'bg-emerald-500 shadow-[0_0_4px_#10b981]' 
                        : idx < 4 
                          ? 'bg-amber-500 shadow-[0_0_4px_#f59e0b]' 
                          : 'bg-red-500 shadow-[0_0_4px_#ef4444]'
                      : 'bg-neutral-800'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {isLampBatteryActive && (
          <div className="text-[8px] text-yellow-400 flex items-center gap-1.5 mt-1 border-t border-neutral-800/80 pt-1.5 font-bold animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block animate-ping" />
            🔋 АВТОНОМНА ЛАМПА
          </div>
        )}
      </div>

      {/* 11. SHELLY SCRATCHES OVERLAY */}
      {scratchIntensity > 0 && (
        <div 
          id="shelly-scratches-overlay"
          className="absolute inset-0 pointer-events-none z-50 transition-opacity duration-150"
          style={{ opacity: scratchIntensity }}
        >
          {/* Blood vignette around screen edges */}
          <div className="absolute inset-0 border-[35px] border-red-950/45 blur-md pointer-events-none" />
          {/* Blur background slightly to worsen visibility */}
          <div className="absolute inset-0 backdrop-blur-[1.5px] bg-red-950/15 pointer-events-none" />
          
          <svg className="w-full h-full" viewBox="0 0 1000 600" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g stroke="#ef4444" strokeWidth="6" strokeLinecap="round" filter="drop-shadow(0px 0px 8px rgba(220, 38, 38, 0.8))">
              {/* Claw Mark Group 1 */}
              <path d="M150 80 C220 180, 280 280, 330 420" />
              <path d="M185 70 C255 170, 315 270, 365 410" />
              <path d="M220 65 C290 165, 350 265, 400 405" />

              {/* Claw Mark Group 2 */}
              <path d="M650 180 C700 280, 730 380, 750 500" />
              <path d="M680 170 C730 270, 760 370, 780 490" />
              <path d="M710 165 C760 265, 790 365, 810 485" />
            </g>
            
            {/* Some minor organic cross-cuts or blood drips */}
            <g stroke="#b91c1c" strokeWidth="3" strokeLinecap="round">
              <path d="M300 250 L280 320" />
              <path d="M740 330 L750 390" />
              <path d="M365 410 L368 450" fill="none" />
            </g>
          </svg>
        </div>
      )}

      {/* SECRET ENTITY 4 (BROKEN MILKA) OFFICE VISUAL PRESENCE */}
      {isEntity_4Present && !isPantryOpen && (
        <div id="entity_4-office-overlay" className="absolute inset-0 pointer-events-none z-40 flex items-center justify-center bg-red-950/25 backdrop-blur-[1px] animate-[pulse_0.15s_infinite]">
          {/* Intense red flash vignette */}
          <div className="absolute inset-0 bg-radial-gradient from-transparent to-red-950/80 pointer-events-none shadow-[inset_0_0_120px_#7f1d1d]" />
          
          {/* Glitching demon cat silhouette and eyes */}
          <div className="relative flex flex-col items-center justify-center scale-110 animate-[bounce_0.2s_infinite]">
            {/* Dark cat head shape */}
            <div className="relative w-72 h-72 flex items-center justify-center opacity-85">
              {/* Cat ears (SVG triangles or styled divs) */}
              <div className="absolute top-4 left-10 w-16 h-24 bg-neutral-950 rotate-[-15deg] border-t-2 border-red-600/60" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
              <div className="absolute top-4 right-10 w-16 h-24 bg-neutral-950 rotate-[15deg] border-t-2 border-red-600/60" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
              
              {/* Cat head base circle */}
              <div className="absolute w-56 h-56 rounded-full bg-neutral-950 border-2 border-red-600/80 shadow-[0_0_50px_rgba(220,38,38,0.4)] flex items-center justify-center">
                {/* Corrupted face elements */}
                
                {/* Glowing red pupils */}
                <div className="absolute top-20 left-12 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-black border border-red-600 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-red-600 shadow-[0_0_15px_#dc2626] animate-ping" />
                    <div className="absolute w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_#dc2626]" />
                  </div>
                </div>
                <div className="absolute top-20 right-12 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-black border border-red-600 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-red-600 shadow-[0_0_15px_#dc2626] animate-ping" />
                    <div className="absolute w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_#dc2626]" />
                  </div>
                </div>

                {/* Glitched red scars / stitches */}
                <div className="absolute bottom-16 left-12 w-32 h-1 bg-red-600/70 rotate-[-5deg] animate-pulse" />
                <div className="absolute bottom-20 left-[110px] w-12 h-1 bg-red-600/70 rotate-[35deg]" />
                
                {/* Corrupted glitch grin */}
                <div className="absolute bottom-10 w-32 h-6 border-b-4 border-red-600 rounded-b-full animate-bounce" />
              </div>
            </div>

            {/* Creepy system glitched warning label */}
            <span className="text-[11px] text-red-500 font-mono font-bold tracking-[0.4em] uppercase mt-4 text-center bg-black/80 px-4 py-1.5 rounded-md border border-red-900/50 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse">
              SYSTEM_CORRUPT: ENTITY_4_DETECTED
            </span>
            <span className="text-[8px] text-red-600/80 font-mono mt-1 tracking-wider uppercase animate-bounce">
              PUT ON THE MASK IMMEDIATELY
            </span>
          </div>

          {/* Heavy screen static lines overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(220,38,38,0.1)_2px,transparent_2px)] bg-[size:100%_4px] pointer-events-none" />
          <div className="absolute inset-0 bg-neutral-950/20 mix-blend-overlay animate-pulse" />
        </div>
      )}

      {/* MILKA MASK HUD VIGNETTE OVERLAY */}
      {isMaskOn && !isPantryOpen && (
        <div id="milka-mask-vignette" className="absolute inset-0 pointer-events-none z-45 flex items-center justify-center">
          {/* Dark fuzzy cat-face vignette cutout */}
          <div className="absolute inset-0 bg-neutral-950/85 pointer-events-none shadow-[inset_0_0_100px_#000]" />
          
          {/* Eyeholes for vision */}
          <div className="absolute w-[280px] h-[280px] rounded-full border-[10px] border-amber-950/20 shadow-[0_0_80px_rgba(0,0,0,1)] bg-transparent left-[18%] top-[25%] pointer-events-none mix-blend-destination-out" style={{ clipPath: 'circle(50% at 50% 50%)' }} />
          <div className="absolute w-[280px] h-[280px] rounded-full border-[10px] border-amber-950/20 shadow-[0_0_80px_rgba(0,0,0,1)] bg-transparent right-[18%] top-[25%] pointer-events-none mix-blend-destination-out" style={{ clipPath: 'circle(50% at 50% 50%)' }} />
          
          {/* Heavy surrounding shadow block overlay to prevent looking at edges */}
          <div className="absolute inset-x-0 top-0 h-[25%] bg-black/95 shadow-[0_15px_30px_#000]" />
          <div className="absolute inset-x-0 bottom-0 h-[28%] bg-black/95 shadow-[0_-15px_30px_#000]" />
          <div className="absolute left-0 top-0 w-[18%] h-full bg-black/95 shadow-[15px_0_30px_#000]" />
          <div className="absolute right-0 top-0 w-[18%] h-full bg-black/95 shadow-[-15px_0_30px_#000]" />
          <div className="absolute left-[44%] w-[12%] h-[55%] top-[20%] bg-black/98 shadow-[0_0_20px_#000] rounded-b-full" />

          {/* Mask tag details */}
          <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 text-emerald-500/50 text-[10px] font-mono tracking-[0.25em] pointer-events-none select-none uppercase z-50 text-center animate-pulse">
            {getTranslation(language, 'maskVignetteLabel')}
          </div>
        </div>
      )}

      {/* FULLSCREEN PANTRY / CLOSET RECHARGER OVERLAY */}
      {isPantryOpen && (
        <div id="pantry-room-overlay" className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center z-50 p-6 select-none text-neutral-200">
          {/* Grid ambient background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(24,24,27,0.85)_0%,rgba(9,9,11,1)_100%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_12px] pointer-events-none" />

          {/* CRT scanlines and flicker effect */}
          <div className="absolute inset-0 bg-white/[0.01] pointer-events-none mix-blend-overlay animate-[pulse_0.1s_infinite]" />

          {/* Header */}
          <div className="z-10 text-center mb-6 flex flex-col items-center gap-1">
            <span className="text-[10px] uppercase tracking-[0.25em] text-orange-500 font-mono font-bold animate-pulse">{getTranslation(language, 'pantryTitleLabel')}</span>
            <h2 className="text-xl font-bold font-sans tracking-wide text-white">{getTranslation(language, 'pantryHeaderLabel')}</h2>
            <p className="text-[10px] text-neutral-400 max-w-[400px]">{getTranslation(language, 'pantryDescLabel')}</p>
          </div>

          {/* Interactive Mechanical charging core visualization */}
          <div className="z-10 flex flex-col items-center justify-center gap-6 bg-neutral-900/40 border border-neutral-800/80 p-8 rounded-xl backdrop-blur-md shadow-[0_15px_35px_rgba(0,0,0,0.6)] w-full max-w-[450px]">
            {/* Spinning gears and manual hand crank animation */}
            <div className="relative w-36 h-36 flex items-center justify-center bg-zinc-950 rounded-full border-2 border-zinc-800/60 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
              {/* Dynamic spinning gears using Lucide or styled divs */}
              <div className="absolute w-24 h-24 border-4 border-dashed border-orange-500/40 rounded-full animate-[spin_3s_linear_infinite]" />
              <div className="absolute w-16 h-16 border-4 border-dotted border-zinc-700 rounded-full animate-[spin_5s_linear_infinite_reverse]" />
              {/* Core energy node */}
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center shadow-[0_0_25px_rgba(249,115,22,0.65)] animate-pulse">
                <Power className="w-5 h-5 text-zinc-950 font-bold" />
              </div>
            </div>

            {/* Generator specs */}
            <div className="w-full flex flex-col gap-3 font-mono text-xs">
              {/* Power level meter */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 text-[10px] tracking-wider uppercase">{getTranslation(language, 'pantryChargeLabel')}</span>
                  <span className="text-orange-400 font-extrabold text-sm">{Math.ceil(power)}%</span>
                </div>
                <div className="w-full h-3 bg-zinc-950 rounded border border-zinc-800 overflow-hidden p-0.5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
                  <div 
                    className="h-full rounded bg-gradient-to-r from-orange-600 to-amber-400 shadow-[0_0_10px_rgba(249,115,22,0.5)] transition-all duration-150" 
                    style={{ width: `${Math.min(100, (power / (customNightConfig?.doublePower ? 200 : 100)) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Status indicators */}
              <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-400 mt-2">
                <div className="bg-zinc-950/80 border border-zinc-900 px-2 py-1.5 rounded flex flex-col gap-0.5">
                  <span className="text-neutral-500">{getTranslation(language, 'pantrySpeedLabel')}</span>
                  <span className="text-emerald-400 font-bold font-mono">+{((0.5 * (upgrades.generatorSpeed || 1))).toFixed(1)}% / сек</span>
                </div>
                <div className="bg-zinc-950/80 border border-zinc-900 px-2 py-1.5 rounded flex flex-col gap-0.5">
                  <span className="text-neutral-500">{getTranslation(language, 'pantryModeLabel')}</span>
                  <span className="text-orange-400 font-bold font-mono">АКТИВНЕ ЗАРЯДЖАННЯ</span>
                </div>
              </div>

              {/* Exit Button */}
              <button
                onClick={() => {
                  setIsPantryOpen(false);
                  sound.playClick();
                }}
                className="w-full py-2.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 hover:border-rose-600/80 text-rose-300 hover:text-white font-extrabold rounded-md tracking-wider font-mono text-xs cursor-pointer transition transform active:scale-95 shadow-md flex items-center justify-center gap-2 mt-2"
              >
                {getTranslation(language, 'btnReturnToOffice' as any)}
              </button>
            </div>
          </div>

          {/* Bottom decorative details */}
          <div className="absolute bottom-6 text-[9px] font-mono text-neutral-600 uppercase tracking-widest pointer-events-none">
            {getTranslation(language, 'pantryUnitLabel')}
          </div>
        </div>
      )}

      {/* Screen static/vignette filters to amplify atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.45)_100%)] pointer-events-none z-30" />
    </div>
  );
}
