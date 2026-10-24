/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private sfxVolume: number = 0.5;
  private musicVolume: number = 0.4;
  
  private menuDrone: { oscs: OscillatorNode[]; gain: GainNode } | null = null;
  private officeHum: { oscs: OscillatorNode[]; noise: AudioWorkletNode | ScriptProcessorNode | null; filter: BiquadFilterNode; gain: GainNode } | null = null;

  constructor() {
    // Lazy initialization on user interaction
  }

  private initCtx() {
    if (!this.ctx) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      } catch (e) {
        console.warn('AudioContext initialization failed:', e);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        this.ctx.resume();
      } catch (e) {
        console.warn('AudioContext resume failed:', e);
      }
    }
  }

  private getDest(pan?: number, time?: number): { dest: AudioNode } {
    if (!this.ctx) return { dest: null as any };
    const now = time ?? this.ctx.currentTime;
    if (typeof pan === 'number' && pan !== 0 && (this.ctx as any).createStereoPanner) {
      try {
        const panner = (this.ctx as any).createStereoPanner();
        panner.pan.setValueAtTime(pan, now);
        panner.connect(this.ctx.destination);
        return { dest: panner };
      } catch (e) {
        console.warn('Failed to create stereo panner:', e);
      }
    }
    return { dest: this.ctx.destination };
  }

  setVolumes(sfx: number, music: number) {
    this.sfxVolume = sfx;
    this.musicVolume = music;
    
    // Dynamically adjust active drones
    if (this.menuDrone) {
      this.menuDrone.gain.gain.setValueAtTime(this.musicVolume * 0.3, this.ctx?.currentTime || 0);
    }
    if (this.officeHum) {
      this.officeHum.gain.gain.setValueAtTime(this.musicVolume * 0.4, this.ctx?.currentTime || 0);
    }
  }

  // Procedure for mechanical click (Flashlight / Buttons)
  playClick(pan?: number) {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Click tone
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1000, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.05);
    
    gain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    
    const { dest } = this.getDest(pan, now);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  // Camera monitor toggle sound
  playCameraSwitch(pan?: number) {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.setValueAtTime(1200, now + 0.03);
    
    gain.gain.setValueAtTime(this.sfxVolume * 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    
    const { dest } = this.getDest(pan, now);
    osc.connect(gain);
    gain.connect(dest);
    
    osc.start(now);
    osc.stop(now + 0.1);

    // Static burst
    this.playStaticBurst(0.08, 0.05, pan);
  }

  // Procedural static noise burst
  private playStaticBurst(duration: number, volumeFactor: number, pan?: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, now);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.sfxVolume * volumeFactor, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    const { dest } = this.getDest(pan, now);
    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    
    noiseNode.start(now);
    noiseNode.stop(now + duration);
  }

  // Door opening/closing sound
  playDoorToggle(isClosing: boolean, pan?: number) {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Heavy low rumble
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(isClosing ? 90 : 60, now);
    osc.frequency.exponentialRampToValueAtTime(isClosing ? 40 : 150, now + 0.4);
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, now);
    
    gain.gain.setValueAtTime(this.sfxVolume * 0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
    
    const { dest } = this.getDest(pan, now);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    
    osc.start(now);
    osc.stop(now + 0.5);

    // Short click at the end of closing or start of opening
    setTimeout(() => {
      this.playClick(pan);
    }, isClosing ? 400 : 10);
  }

  // Metallic heavy door slam sound with thump
  playDoorSlam(pan?: number) {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Heavy low thump
    const thumpOsc = this.ctx.createOscillator();
    const thumpGain = this.ctx.createGain();
    thumpOsc.type = 'sawtooth';
    thumpOsc.frequency.setValueAtTime(100, now);
    thumpOsc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

    const thumpFilter = this.ctx.createBiquadFilter();
    thumpFilter.type = 'lowpass';
    thumpFilter.frequency.setValueAtTime(140, now);

    thumpGain.gain.setValueAtTime(this.sfxVolume * 0.95, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);

    const { dest } = this.getDest(pan, now);
    thumpOsc.connect(thumpFilter);
    thumpFilter.connect(thumpGain);
    thumpGain.connect(dest);

    thumpOsc.start(now);
    thumpOsc.stop(now + 0.4);

    // 2. High-frequency metal impact rattle
    const rattleOsc = this.ctx.createOscillator();
    const rattleGain = this.ctx.createGain();
    rattleOsc.type = 'triangle';
    rattleOsc.frequency.setValueAtTime(450, now);
    rattleOsc.frequency.exponentialRampToValueAtTime(220, now + 0.15);

    const rattleFilter = this.ctx.createBiquadFilter();
    rattleFilter.type = 'bandpass';
    rattleFilter.frequency.setValueAtTime(600, now);

    rattleGain.gain.setValueAtTime(this.sfxVolume * 0.3, now);
    rattleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    rattleOsc.connect(rattleFilter);
    rattleFilter.connect(rattleGain);
    rattleGain.connect(dest);

    rattleOsc.start(now);
    rattleOsc.stop(now + 0.2);
  }

  // Creepy cat meow
  playMeow(pitchMultiplier: number = 1.0, pan?: number) {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const baseFreq = 420 * pitchMultiplier;
    
    // We construct a vocal formanted meow using 2 primary oscillators
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc1.type = 'triangle';
    osc2.type = 'sawtooth';
    
    // Meow frequency sweep: "Mee-oo-ww"
    // Starts highish, dips down, slides up then down
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc1.frequency.linearRampToValueAtTime(baseFreq * 1.25, now + 0.25);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + 0.85);

    osc2.frequency.setValueAtTime(baseFreq * 1.5, now);
    osc2.frequency.linearRampToValueAtTime(baseFreq * 1.5 * 1.25, now + 0.25);
    osc2.frequency.exponentialRampToValueAtTime(baseFreq * 1.5 * 0.7, now + 0.85);

    // Vocal filter to simulate mouth closing
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(3.0, now);
    filter.frequency.setValueAtTime(1000, now);
    filter.frequency.linearRampToValueAtTime(1800, now + 0.2);
    filter.frequency.exponentialRampToValueAtTime(450, now + 0.85);

    // Delay/Reverb space effect (makes it sound creepy and echoed in the dark house!)
    const delay = this.ctx.createDelay();
    delay.delayTime.setValueAtTime(0.18, now);
    const feedback = this.ctx.createGain();
    feedback.gain.setValueAtTime(0.4, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.8, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);

    const { dest } = this.getDest(pan, now);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    
    // Connect Delay Line
    gain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(dest);

    gain.connect(dest);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.0);
    osc2.stop(now + 1.0);
  }

  // Horror sound effects for footsteps and crawling
  playFootsteps(pan?: number) {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // 3 heavy steps
    for (let i = 0; i < 3; i++) {
      const stepTime = now + i * 0.65;
      
      const bufferSize = this.ctx.sampleRate * 0.18;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) {
        data[j] = Math.random() * 2 - 1;
      }
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(130, stepTime);
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, stepTime);
      gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.35, stepTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.18);
      
      const { dest } = this.getDest(pan, stepTime);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
      
      noise.start(stepTime);
      noise.stop(stepTime + 0.2);
    }
  }

  // Play creepy static or heavy interference
  playCameraInterference(pan?: number) {
    this.initCtx();
    this.playStaticBurst(0.6, 0.4, pan);
  }

  // Play creepy breathing or scratching sound
  playScratch(pan?: number) {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    this.playStaticBurst(0.3, 0.2, pan);
    setTimeout(() => {
      this.playStaticBurst(0.2, 0.15, pan);
    }, 250);
  }

  // Menu ambient background music drone
  playMenuAmbient() {
    this.initCtx();
    if (!this.ctx) return;
    if (this.menuDrone) return; // Already playing

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.value = 45; // ultra low C#
    
    osc2.type = 'sine';
    osc2.frequency.value = 45.4; // detune for horror wobble

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 110;

    gain.gain.setValueAtTime(this.musicVolume * 0.35, now);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);

    this.menuDrone = { oscs: [osc1, osc2], gain };
  }

  stopMenuAmbient() {
    if (this.menuDrone) {
      try {
        this.menuDrone.oscs.forEach(o => o.stop());
      } catch (e) {}
      this.menuDrone = null;
    }
  }

  // Office ambient fan hum and tense background drone
  playOfficeAmbient() {
    this.initCtx();
    if (!this.ctx) return;
    if (this.officeHum) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.value = 55; // A1
    
    osc2.type = 'sine';
    osc2.frequency.value = 55.6; // detuned hum

    // Lowpass filter for muffled heavy feeling
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 90;

    gain.gain.setValueAtTime(this.musicVolume * 0.45, now);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);

    // Synthesize an office fan (muffled hiss)
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of looping white noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;
    noiseNode.loop = true;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 400;
    noiseFilter.Q.value = 1.0;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.value = this.musicVolume * 0.08;

    noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noiseNode.start(now);

    this.officeHum = { 
      oscs: [osc1, osc2], 
      noise: noiseNode as any, 
      filter: noiseFilter, 
      gain 
    };
  }

  stopOfficeAmbient() {
    if (this.officeHum) {
      try {
        this.officeHum.oscs.forEach(o => o.stop());
        if (this.officeHum.noise) {
          (this.officeHum.noise as any).stop();
        }
      } catch (e) {}
      this.officeHum = null;
    }
  }

  // Terrifying custom robotic cat jumpscare scream (Dual modulated oscillators + loud noise blast)
  playJumpscare() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Stop ambient sounds to amplify jumpscare shock
    this.stopOfficeAmbient();
    this.stopMenuAmbient();

    // Sound 1: Modulated piercing synthesizer
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const osc3 = this.ctx.createOscillator(); // FM modulator
    const gain1 = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc3.type = 'sawtooth';

    osc1.frequency.setValueAtTime(320, now);
    osc1.frequency.linearRampToValueAtTime(1100, now + 0.35);
    osc1.frequency.exponentialRampToValueAtTime(110, now + 1.8);

    osc2.frequency.setValueAtTime(160, now);
    osc2.frequency.linearRampToValueAtTime(2200, now + 0.35);
    osc2.frequency.exponentialRampToValueAtTime(55, now + 1.8);

    osc3.frequency.setValueAtTime(80, now);
    osc3.frequency.linearRampToValueAtTime(350, now + 1.0);

    // Ring modulation simulation
    const modGain = this.ctx.createGain();
    modGain.gain.setValueAtTime(200, now);
    modGain.gain.exponentialRampToValueAtTime(0.1, now + 1.8);

    osc3.connect(modGain);
    modGain.connect(osc1.frequency);
    modGain.connect(osc2.frequency);

    gain1.gain.setValueAtTime(this.sfxVolume * 1.5, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 1.9);

    osc1.connect(gain1);
    osc2.connect(gain1);
    
    gain1.connect(this.ctx.destination);
    
    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    
    osc1.stop(now + 2.0);
    osc2.stop(now + 2.0);
    osc3.stop(now + 2.0);

    // Sound 2: Loud pink/white noise explosion (shriek)
    const bufferSize = this.ctx.sampleRate * 2.0;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Create high-amplitude chaotic white noise
      data[i] = (Math.random() * 2 - 1) * 0.95;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'peaking';
    noiseFilter.frequency.setValueAtTime(1500, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(400, now + 1.5);
    noiseFilter.Q.value = 1.0;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(this.sfxVolume * 1.6, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.005, now + 1.9);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + 2.0);
  }

  // Win Chime: Cute clock ringing 6:00 AM + children cheering
  playWinChime() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Classic 3-note clock chime: G4, E4, C4, G4, E4, G4, C5
    const notes = [392, 330, 261, 392, 330, 392, 523];
    const timings = [0, 0.4, 0.8, 1.2, 1.6, 2.0, 2.4];

    notes.forEach((freq, idx) => {
      const time = now + timings[idx];
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      // Ringing vibration
      const vibrato = this.ctx!.createOscillator();
      const vibratoGain = this.ctx!.createGain();
      vibrato.frequency.value = 12;
      vibratoGain.gain.value = 5;
      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);
      
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(this.musicVolume * 0.7, time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.75);
      
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      
      vibrato.start(time);
      osc.start(time);
      
      vibrato.stop(time + 0.8);
      osc.stop(time + 0.8);
    });

    // Synthesized cheering sounds after 3 seconds
    setTimeout(() => {
      if (!this.ctx) return;
      const cheerStart = this.ctx.currentTime;
      // High-frequency white noise filtered like wind/shouting
      const bufferSize = this.ctx.sampleRate * 2.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const cheerNoise = this.ctx.createBufferSource();
      cheerNoise.buffer = buffer;

      const cheerFilter = this.ctx.createBiquadFilter();
      cheerFilter.type = 'bandpass';
      cheerFilter.frequency.setValueAtTime(800, cheerStart);
      cheerFilter.frequency.exponentialRampToValueAtTime(1400, cheerStart + 2.0);
      cheerFilter.Q.value = 1.5;

      const cheerGain = this.ctx.createGain();
      cheerGain.gain.setValueAtTime(0, cheerStart);
      cheerGain.gain.linearRampToValueAtTime(this.sfxVolume * 0.5, cheerStart + 0.2);
      cheerGain.gain.exponentialRampToValueAtTime(0.001, cheerStart + 2.5);

      cheerNoise.connect(cheerFilter);
      cheerFilter.connect(cheerGain);
      cheerGain.connect(this.ctx.destination);

      cheerNoise.start(cheerStart);
      cheerNoise.stop(cheerStart + 2.5);
    }, 2800);
  }

  // Realistic dog sniffing sounds
  playSniff(pan?: number) {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      const sniffTime = now + i * 0.25;
      const bufferSize = this.ctx.sampleRate * 0.12;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) {
        data[j] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, sniffTime);
      filter.Q.setValueAtTime(2.0, sniffTime);
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, sniffTime);
      gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.3, sniffTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, sniffTime + 0.1);
      
      const { dest } = this.getDest(pan, sniffTime);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
      noise.start(sniffTime);
      noise.stop(sniffTime + 0.12);
    }
  }

  // Soft heavier footsteps (trot of a real dog)
  playDogFootsteps(pan?: number) {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const stepTime = now + i * 0.35;
      const bufferSize = this.ctx.sampleRate * 0.14;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) {
        data[j] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(160, stepTime);
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, stepTime);
      gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.45, stepTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.12);
      
      const { dest } = this.getDest(pan, stepTime);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
      noise.start(stepTime);
      noise.stop(stepTime + 0.14);
    }
  }

  // Soft rustle near doors
  playRustle(pan?: number) {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.playStaticBurst(0.4, 0.25, pan);
  }

  // Crunchy chewing sound for food/pâté eating
  playEat(pan?: number) {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const eatTime = now + i * 0.25;
      const bufferSize = this.ctx.sampleRate * 0.16;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) {
        data[j] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, eatTime);
      filter.Q.setValueAtTime(1.5, eatTime);
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, eatTime);
      gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.55, eatTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, eatTime + 0.14);
      
      const { dest } = this.getDest(pan, eatTime);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
      noise.start(eatTime);
      noise.stop(eatTime + 0.16);
    }
  }

  // Desk lamp toggle mechanical click sound
  playLampToggle(pan?: number) {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.setValueAtTime(700, now + 0.02);
    
    gain.gain.setValueAtTime(this.sfxVolume * 0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
    
    const { dest } = this.getDest(pan, now);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Camera Flash sound (charge-up sound + discharge pop)
  playCameraFlash(pan?: number) {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const oscPop = this.ctx.createOscillator();
    const gainPop = this.ctx.createGain();
    oscPop.type = 'triangle';
    oscPop.frequency.setValueAtTime(350, now);
    oscPop.frequency.exponentialRampToValueAtTime(20, now + 0.25);
    gainPop.gain.setValueAtTime(this.sfxVolume * 0.8, now);
    gainPop.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    const { dest } = this.getDest(pan, now);
    oscPop.connect(gainPop);
    gainPop.connect(dest);
    oscPop.start(now);
    oscPop.stop(now + 0.31);

    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3000, now);
    const gainNoise = this.ctx.createGain();
    gainNoise.gain.setValueAtTime(this.sfxVolume * 0.4, now);
    gainNoise.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    noise.connect(filter);
    filter.connect(gainNoise);
    gainNoise.connect(dest);
    noise.start(now);
    noise.stop(now + 0.26);
  }

  // Realistic dog whimpering sound when scared away by flash
  playDogWhimper(pan?: number) {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Whimper 1
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(850, now);
    osc.frequency.exponentialRampToValueAtTime(1300, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.25);
    gain.gain.setValueAtTime(this.sfxVolume * 0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    
    const { dest } = this.getDest(pan, now);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.26);

    // Whimper 2 (slightly delayed and pitched down)
    const whimper2Time = now + 0.22;
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(750, whimper2Time);
    osc2.frequency.exponentialRampToValueAtTime(1150, whimper2Time + 0.1);
    osc2.frequency.exponentialRampToValueAtTime(650, whimper2Time + 0.22);
    gain2.gain.setValueAtTime(this.sfxVolume * 0.35, whimper2Time);
    gain2.gain.exponentialRampToValueAtTime(0.01, whimper2Time + 0.22);
    osc2.connect(gain2);
    gain2.connect(dest);
    osc2.start(whimper2Time);
    osc2.stop(whimper2Time + 0.23);
  }

  // Shelly's low-frequency cozy purr (used when petting or when she is asleep/happy)
  playPurr(pan: number = -0.65) {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Low frequency modulation
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(25, now); // ultra low frequency purr
    
    // add small pitch wobble
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 14; // purring frequency rate
    lfoGain.gain.value = 8;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    
    // volume envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.35, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    
    const { dest } = this.getDest(pan, now);
    osc.connect(gain);
    gain.connect(dest);
    
    lfo.start(now);
    osc.start(now);
    
    lfo.stop(now + 0.65);
    osc.stop(now + 0.65);
  }

  // Cute successful pet meow/purr combination
  playPurrSuccess(pan: number = -0.65) {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // A happy high-pitched chirp "Mrrrp!"
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(840, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.3);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.45, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    
    const { dest } = this.getDest(pan, now);
    osc.connect(gain);
    gain.connect(dest);
    
    osc.start(now);
    osc.stop(now + 0.36);
  }

  // Angry cat hiss when irritated
  playCatHiss(pan: number = -0.65) {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const duration = 0.8;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3200, now);
    filter.frequency.exponentialRampToValueAtTime(2400, now + duration);
    filter.Q.value = 1.0;
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.65, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    const { dest } = this.getDest(pan, now);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    
    noise.start(now);
    noise.stop(now + duration);
  }
}

export const sound = new SoundManager();
