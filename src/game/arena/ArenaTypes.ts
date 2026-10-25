import * as THREE from 'three';

export type StadiumType = 'classic' | 'neon' | 'sunset';

export interface BoostPadData {
  id: number;
  x: number;
  z: number;
  isFull: boolean; // true = 100 boost, false = 12 boost
  respawnTime: number; // 10s for full, 4s for small
  currentCooldown: number;
  meshGroup?: THREE.Group;
  beaconLight?: THREE.Mesh;
}

export interface ArenaBounds {
  width: number;       // X span: [-width/2, width/2] = [-40, 40]
  length: number;      // Z span: [-length/2, length/2] = [-65, 65]
  height: number;      // Ceiling Y = 24
  cornerChamfer: number; // 14
  goalWidth: number;   // 17
  goalHeight: number;  // 7.5
  goalDepth: number;   // 9
}

export const ARENA_BOUNDS: ArenaBounds = {
  width: 80,
  length: 130,
  height: 25,
  cornerChamfer: 16,
  goalWidth: 18,
  goalHeight: 8,
  goalDepth: 10,
};
