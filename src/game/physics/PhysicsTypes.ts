import * as THREE from 'three';

export interface CarInputs {
  throttle: number; // -1 (reverse/brake) to +1 (forward)
  steer: number;    // -1 (left) to +1 (right)
  jump: boolean;    // space / button A
  jumpJustPressed: boolean;
  boost: boolean;   // shift / button B
  handbrake: boolean; // drift / powerslide
  airPitch: number; // -1 to +1
  airYaw: number;   // -1 to +1
  airRoll: number;  // -1 (roll left) to +1 (roll right)
}

export const EMPTY_INPUTS: CarInputs = {
  throttle: 0,
  steer: 0,
  jump: false,
  jumpJustPressed: false,
  boost: false,
  handbrake: false,
  airPitch: 0,
  airYaw: 0,
  airRoll: 0,
};

export interface CarState {
  id: string;
  name: string;
  team: 'blue' | 'orange';
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  boost: number; // 0 to 100
  isGrounded: boolean;
  isBoosting: boolean;
  isSupersonic: boolean;
  hasJumped: boolean;
  hasDoubleJumped: boolean;
  jumpTimer: number;
  flipTimer: number; // >0 during flip animation
  flipAxis: THREE.Vector3;
  flipAngle: number;
}
