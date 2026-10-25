import * as THREE from 'three';
import { CarPhysics } from './CarPhysics';
import { BallPhysics } from './BallPhysics';
import { BoostPadData } from '../arena/ArenaTypes';

export class PhysicsWorld {
  public cars: CarPhysics[] = [];
  public ball: BallPhysics;
  public boostPads: BoostPadData[] = [];

  public onBoostCollected?: (car: CarPhysics, pad: BoostPadData) => void;
  public onCarCollision?: (carA: CarPhysics, carB: CarPhysics) => void;

  constructor(ball: BallPhysics) {
    this.ball = ball;
  }

  public addCar(car: CarPhysics) {
    this.cars.push(car);
  }

  public removeCar(id: string) {
    this.cars = this.cars.filter(c => c.state.id !== id);
  }

  public update(rawDt: number, onBounce?: (strength: number) => void): 'blue_goal' | 'orange_goal' | null {
    // Clamp frame delta time to guarantee stability
    const dt = Math.min(rawDt, 0.04);

    // 1. Update Ball Physics
    const goalResult = this.ball.update(dt, onBounce);

    // 2. Check Boost Pad pickups
    for (const car of this.cars) {
      if (car.state.boost < 100) {
        for (const pad of this.boostPads) {
          if (pad.currentCooldown <= 0) {
            const dx = car.state.position.x - pad.x;
            const dz = car.state.position.z - pad.z;
            const pickupRadius = pad.isFull ? 2.8 : 1.8;

            if (dx * dx + dz * dz < pickupRadius * pickupRadius) {
              const amount = pad.isFull ? 100 : 12;
              car.state.boost = Math.min(100, car.state.boost + amount);
              pad.currentCooldown = pad.respawnTime;
              if (this.onBoostCollected) {
                this.onBoostCollected(car, pad);
              }
            }
          }
        }
      }
    }

    // 3. Car-to-Car Collisions
    for (let i = 0; i < this.cars.length; i++) {
      for (let j = i + 1; j < this.cars.length; j++) {
        const carA = this.cars[i];
        const carB = this.cars[j];
        
        const diff = new THREE.Vector3().subVectors(carB.state.position, carA.state.position);
        const distSq = diff.lengthSq();
        const minDistance = 2.4; // approximate combined vehicle radius

        if (distSq < minDistance * minDistance && distSq > 0.001) {
          const dist = Math.sqrt(distSq);
          const normal = diff.clone().multiplyScalar(1 / dist);

          // Push apart
          const overlap = minDistance - dist;
          carA.state.position.addScaledVector(normal, -overlap * 0.5);
          carB.state.position.addScaledVector(normal, overlap * 0.5);

          // Bump impulse
          const relativeVel = new THREE.Vector3().subVectors(carA.state.velocity, carB.state.velocity);
          const impulseMag = Math.max(8.0, relativeVel.dot(normal));
          const impulse = normal.clone().multiplyScalar(impulseMag * 0.6);

          carA.state.velocity.sub(impulse);
          carB.state.velocity.add(impulse);

          if (this.onCarCollision) {
            this.onCarCollision(carA, carB);
          }
        }
      }
    }

    return goalResult;
  }
}
