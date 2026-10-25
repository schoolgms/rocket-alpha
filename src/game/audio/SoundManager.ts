/**
 * Pure procedural Web Audio API synthesizer for Rocket Arena 3D.
 * Generates all SFX and ambient drone without any external files or network assets.
 */
export class SoundManager {
  private static instance: SoundManager;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  
  // Continuous loops
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private boostNoiseNode: AudioNode | null = null;
  private boostGain: GainNode | null = null;

  private isAudioUnlocked = false;
  private sfxVolume = 0.8;
  private musicVolume = 0.5;

  private constructor() {
    // Setup unlock listeners on user interaction
    const unlock = () => {
      this.initContext();
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('touchstart', unlock);
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private initContext() {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.isAudioUnlocked = true;
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.setupContinuousNodes();
      this.isAudioUnlocked = true;
    } catch {
      // AudioContext unavailable
    }
  }

  private setupContinuousNodes() {
    if (!this.ctx || !this.sfxGain) return;

    // 1. Engine Oscillator (Sawtooth with lowpass filter for rumbling engine)
    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(45, this.ctx.currentTime);

      const engineFilter = this.ctx.createBiquadFilter();
      engineFilter.type = 'lowpass';
      engineFilter.frequency.setValueAtTime(160, this.ctx.currentTime);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

      this.engineOsc.connect(engineFilter);
      engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.sfxGain);
      this.engineOsc.start();
    } catch {
      // Ignore
    }

    // 2. Rocket Boost Noise Loop
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02; // Pinkish / brown noise
        lastOut = output[i];
        output[i] *= 3.5;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const boostFilter = this.ctx.createBiquadFilter();
      boostFilter.type = 'bandpass';
      boostFilter.frequency.setValueAtTime(380, this.ctx.currentTime);
      boostFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

      this.boostGain = this.ctx.createGain();
      this.boostGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

      noiseSource.connect(boostFilter);
      boostFilter.connect(this.boostGain);
      this.boostGain.connect(this.sfxGain);
      noiseSource.start();
      this.boostNoiseNode = noiseSource;
    } catch {
      // Ignore
    }
  }

  public setVolumes(sfx: number, music: number) {
    this.sfxVolume = Math.max(0, Math.min(1, sfx));
    this.musicVolume = Math.max(0, Math.min(1, music));
    if (this.ctx && this.sfxGain && this.musicGain) {
      const now = this.ctx.currentTime;
      this.sfxGain.gain.cancelScheduledValues(now);
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, now);
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setValueAtTime(this.musicVolume, now);
    }
  }

  /**
   * Modulate engine pitch and volume based on speed (0 to 1) and throttle input
   */
  public updateEngine(speedFraction: number, isAccelerating: boolean) {
    if (!this.ctx || !this.engineOsc || !this.engineGain) return;
    const now = this.ctx.currentTime;
    const baseFreq = 40;
    const targetFreq = baseFreq + speedFraction * 140 + (isAccelerating ? 25 : 0);
    const targetVol = 0.06 + speedFraction * 0.12 + (isAccelerating ? 0.06 : 0);

    this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.08);
    this.engineGain.gain.setTargetAtTime(targetVol * this.sfxVolume, now, 0.08);
  }

  /**
   * Modulate rocket boost thruster sound
   */
  public updateBoost(isBoosting: boolean) {
    if (!this.ctx || !this.boostGain) return;
    const now = this.ctx.currentTime;
    const targetVol = isBoosting ? 0.28 * this.sfxVolume : 0.0001;
    this.boostGain.gain.setTargetAtTime(targetVol, now, 0.05);
  }

  /**
   * Jump & Dodge sound
   */
  public playJump(isDoubleJump: boolean) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isDoubleJump ? 'sawtooth' : 'triangle';
    const startFreq = isDoubleJump ? 260 : 180;
    const endFreq = isDoubleJump ? 480 : 320;
    
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.15);

    gain.gain.setValueAtTime(0.25 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * Ball hit impulse sound (thud + metallic pop)
   */
  public playBallHit(strength = 1.0) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const clampedStrength = Math.min(Math.max(strength, 0.2), 2.5);

    // Punchy low sine
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140 * clampedStrength, now);
    subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

    subGain.gain.setValueAtTime(0.4 * this.sfxVolume * Math.min(clampedStrength, 1.2), now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(now);
    subOsc.stop(now + 0.15);

    // Crack click
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(650, now);
    clickOsc.frequency.exponentialRampToValueAtTime(100, now + 0.04);

    clickGain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    clickOsc.connect(clickGain);
    clickGain.connect(this.sfxGain);
    clickOsc.start(now);
    clickOsc.stop(now + 0.06);
  }

  /**
   * Car crash collision
   */
  public playCarCrash() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.linearRampToValueAtTime(40, now + 0.15);

    gain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  /**
   * Goal explosion fanfare and sub rumble
   */
  public playGoalExplosion() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Sub explosion boom
    const boomOsc = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boomOsc.type = 'sine';
    boomOsc.frequency.setValueAtTime(120, now);
    boomOsc.frequency.exponentialRampToValueAtTime(25, now + 0.8);

    boomGain.gain.setValueAtTime(0.6 * this.sfxVolume, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    boomOsc.connect(boomGain);
    boomGain.connect(this.sfxGain);
    boomOsc.start(now);
    boomOsc.stop(now + 0.95);

    // Goal siren / airhorn chords
    const chordNotes = [330, 415, 495, 660];
    chordNotes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const hornOsc = this.ctx.createOscillator();
      const hornGain = this.ctx.createGain();
      hornOsc.type = 'sawtooth';
      hornOsc.frequency.setValueAtTime(freq, now + 0.1);

      hornGain.gain.setValueAtTime(0, now);
      hornGain.gain.setValueAtTime(0.12 * this.sfxVolume, now + 0.1);
      hornGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4 + idx * 0.1);

      hornOsc.connect(hornGain);
      hornGain.connect(this.sfxGain);
      hornOsc.start(now + 0.1);
      hornOsc.stop(now + 1.5 + idx * 0.1);
    });
  }

  /**
   * Countdown beeps (3, 2, 1, GO)
   */
  public playCountdown(isGo: boolean) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isGo ? 880 : 440, now);

    const duration = isGo ? 0.35 : 0.15;
    gain.gain.setValueAtTime(0.35 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  /**
   * Boost pad pickup sound
   */
  public playBoostPickup(isFullPad: boolean) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isFullPad ? 523.25 : 440, now); // C5 or A4
    osc.frequency.linearRampToValueAtTime(isFullPad ? 1046.5 : 659.25, now + 0.15); // C6 or E5

    gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * UI Click
   */
  public playUiClick() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(350, now + 0.05);
    gain.gain.setValueAtTime(0.15 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }
}
