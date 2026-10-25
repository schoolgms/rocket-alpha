export type CarBodyType = 'apex' | 'viper' | 'titan';
export type PaintFinish = 'glossy' | 'matte' | 'metallic';
export type WheelType = 'classic' | 'sport' | 'turbofan';

export interface CarCustomization {
  body: CarBodyType;
  primaryColor: string;
  decalColor: string;
  boostColor: string;
  wheel: WheelType;
  wheelColor: string;
  finish: PaintFinish;
  playerName: string;
  team?: 'blue' | 'orange';
}

export const DEFAULT_BLUE_CUSTOMIZATION: CarCustomization = {
  body: 'apex',
  primaryColor: '#0066ff',
  decalColor: '#ffffff',
  boostColor: '#00ddff',
  wheel: 'sport',
  wheelColor: '#333333',
  finish: 'metallic',
  playerName: 'Player 1',
  team: 'blue',
};

export const DEFAULT_ORANGE_CUSTOMIZATION: CarCustomization = {
  body: 'viper',
  primaryColor: '#ff5500',
  decalColor: '#ffdd00',
  boostColor: '#ff9900',
  wheel: 'turbofan',
  wheelColor: '#222222',
  finish: 'metallic',
  playerName: 'Player 2',
  team: 'orange',
};

const GARAGE_STORAGE_KEY = 'rocket_arena_car_garage';

export function loadSavedCar(): CarCustomization {
  try {
    const saved = localStorage.getItem(GARAGE_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_BLUE_CUSTOMIZATION, ...JSON.parse(saved) };
    }
  } catch {
    // Ignore
  }
  return { ...DEFAULT_BLUE_CUSTOMIZATION };
}

export function saveCar(custom: CarCustomization) {
  try {
    localStorage.setItem(GARAGE_STORAGE_KEY, JSON.stringify(custom));
  } catch {
    // Ignore
  }
}
