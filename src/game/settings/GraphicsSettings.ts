export type GraphicsPreset = 'potato' | 'low' | 'medium' | 'high' | 'custom';

export interface GraphicsConfig {
  preset: GraphicsPreset;
  resolutionScale: number; // 0.6 to 1.0
  shadows: boolean;
  shadowMapSize: number; // 512, 1024
  particleDensity: 'low' | 'medium' | 'high' | 'ultra';
  maxFps: 30 | 45 | 60 | 0; // 0 is uncapped
  showFps: boolean;
  antialias: boolean;
  reflections: boolean;
  soundVolume: number; // 0.0 to 1.0
  musicVolume: number; // 0.0 to 1.0
}

const SETTINGS_STORAGE_KEY = 'rocket_arena_graphics_settings';

export const PRESET_CONFIGS: Record<Exclude<GraphicsPreset, 'custom'>, Omit<GraphicsConfig, 'soundVolume' | 'musicVolume' | 'showFps'>> = {
  potato: {
    preset: 'potato',
    resolutionScale: 0.70,
    shadows: false,
    shadowMapSize: 256,
    particleDensity: 'low',
    maxFps: 30,
    antialias: false,
    reflections: false,
  },
  low: {
    preset: 'low',
    resolutionScale: 0.85,
    shadows: false,
    shadowMapSize: 512,
    particleDensity: 'medium',
    maxFps: 45,
    antialias: false,
    reflections: false,
  },
  medium: {
    preset: 'medium',
    resolutionScale: 1.0,
    shadows: true,
    shadowMapSize: 512,
    particleDensity: 'high',
    maxFps: 60,
    antialias: true,
    reflections: true,
  },
  high: {
    preset: 'high',
    resolutionScale: 1.0,
    shadows: true,
    shadowMapSize: 1024,
    particleDensity: 'ultra',
    maxFps: 60,
    antialias: true,
    reflections: true,
  }
};

export const DEFAULT_CONFIG: GraphicsConfig = {
  ...PRESET_CONFIGS.potato, // Start default with Potato Mode for low-spec Intel UHD 600 guarantee!
  showFps: true,
  soundVolume: 0.8,
  musicVolume: 0.5,
};

export class SettingsManager {
  private static instance: SettingsManager;
  private config: GraphicsConfig;
  private listeners: Array<(config: GraphicsConfig) => void> = [];

  private constructor() {
    this.config = this.load();
  }

  public static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  public getConfig(): GraphicsConfig {
    return { ...this.config };
  }

  public setPreset(preset: Exclude<GraphicsPreset, 'custom'>) {
    const presetData = PRESET_CONFIGS[preset];
    this.config = {
      ...this.config,
      ...presetData,
      preset,
    };
    this.save();
    this.notify();
  }

  public updateConfig(partial: Partial<GraphicsConfig>) {
    this.config = {
      ...this.config,
      ...partial,
      preset: partial.preset || 'custom',
    };
    this.save();
    this.notify();
  }

  public subscribe(listener: (config: GraphicsConfig) => void): () => void {
    this.listeners.push(listener);
    listener(this.config);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.config);
    }
  }

  private save() {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.config));
    } catch {
      // Ignore storage errors
    }
  }

  private load(): GraphicsConfig {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch {
      // Ignore parse error
    }
    return { ...DEFAULT_CONFIG };
  }
}
