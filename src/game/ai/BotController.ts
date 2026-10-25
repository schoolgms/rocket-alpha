import * as THREE from 'three';
import { CarPhysics } from '../physics/CarPhysics';
import { BallPhysics } from '../physics/BallPhysics';
import { CarInputs, EMPTY_INPUTS } from '../physics/PhysicsTypes';
import { ARENA_BOUNDS } from '../arena/ArenaTypes';

export type BotDifficulty = 'easy' | 'normal' | 'hard';

export class BotController {
  public car: CarPhysics;
  public difficulty: BotDifficulty;
  public role: 'striker' | 'defender' = 'striker';

  private decisionTimer = 0;
  private decisionInterval = 0.12; // 120ms decision loop (lightweight CPU!)
  private cachedInputs: CarInputs = { ...EMPTY_INPUTS };
  private targetPos = new THREE.Vector3();

  constructor(car: CarPhysics, difficulty: BotDifficulty = 'normal') {
    this.car = car;
    this.difficulty = difficulty;
    // Slight interval jitter so all bots don't tick on exact same frame
    this.decisionInterval = 0.1 + Math.random() * 0.05;
  }

  public update(dt: number, ball: BallPhysics): CarInputs {
    this.decisionTimer += dt;
    this.cachedInputs.jumpJustPressed = false;

    if (this.decisionTimer >= this.decisionInterval) {
      this.decisionTimer = 0;
      this.makeDecision(ball);
    }

    return this.cachedInputs;
  }

  private makeDecision(ball: BallPhysics) {
    const carPos = this.car.state.position;
    const isBlue = this.car.state.team === 'blue';
    const targetGoalZ = isBlue ? ARENA_BOUNDS.length / 2 : -ARENA_BOUNDS.length / 2;
    const ownGoalZ = isBlue ? -ARENA_BOUNDS.length / 2 : ARENA_BOUNDS.length / 2;

    // 1. Prediction of ball position based on difficulty
    const leadTime = this.difficulty === 'hard' ? 0.6 : (this.difficulty === 'normal' ? 0.35 : 0.1);
    const predictedBall = ball.position.clone().addScaledVector(ball.velocity, leadTime);

    // 2. Determine target position
    // If ball is between bot and own goal -> defensive retreat or clear!
    const isBallBehind = isBlue ? (carPos.z > ball.position.z + 2.0) : (carPos.z < ball.position.z - 2.0);

    if (isBallBehind && this.difficulty !== 'easy') {
      // Reposition behind ball towards own goal
      this.targetPos.set(
        ball.position.x * 0.7,
        0,
        ownGoalZ + (isBlue ? 12 : -12)
      );
    } else {
      // Strike ball towards opposing goal: aim slightly behind ball in line with target goal
      const toGoal = new THREE.Vector3(0, 0, targetGoalZ).sub(predictedBall).normalize();
      this.targetPos.copy(predictedBall).addScaledVector(toGoal, -2.5);
    }

    // 3. Compute Steering Angle to Target
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.car.state.quaternion);
    const toTarget = new THREE.Vector3().subVectors(this.targetPos, carPos);
    toTarget.y = 0;
    const distToTarget = toTarget.length();

    if (distToTarget > 0.5) {
      toTarget.normalize();
      const dot = forward.dot(toTarget);
      const crossY = forward.x * toTarget.z - forward.z * toTarget.x;

      // Steering
      let steerVal = THREE.MathUtils.clamp(-crossY * 3.5, -1.0, 1.0);
      if (this.difficulty === 'easy') {
        steerVal *= 0.65; // Slower steering response
      }
      this.cachedInputs.steer = steerVal;

      // Throttle
      if (dot > -0.2) {
        this.cachedInputs.throttle = 1.0;
        this.cachedInputs.handbrake = Math.abs(steerVal) > 0.8 && distToTarget > 8.0;
      } else {
        // Target is behind: reverse or hard powerslide
        this.cachedInputs.throttle = -0.6;
        this.cachedInputs.steer = -steerVal;
      }

      // Boost usage
      const angleAligned = dot > 0.85;
      const shouldBoost = (
        angleAligned &&
        distToTarget > 8.0 &&
        this.car.state.boost > 15 &&
        (this.difficulty === 'hard' || (this.difficulty === 'normal' && Math.random() > 0.3))
      );
      this.cachedInputs.boost = shouldBoost;

      // Jump / Aerial attack
      const ballHeight = ball.position.y;
      const closeToBall = carPos.distanceTo(ball.position) < 5.5;

      if (closeToBall && this.car.state.isGrounded) {
        if (ballHeight > 2.2 && (this.difficulty === 'hard' || (this.difficulty === 'normal' && Math.random() > 0.5))) {
          // Jump to hit airborne ball!
          this.cachedInputs.jump = true;
          this.cachedInputs.jumpJustPressed = true;
          if (this.difficulty === 'hard') {
            this.cachedInputs.airPitch = -0.5; // pitch up slightly
          }
        } else if (distToTarget < 3.5 && dot > 0.7 && Math.random() > 0.4) {
          // Dodge flip into ball for power shot
          this.cachedInputs.jump = true;
          this.cachedInputs.jumpJustPressed = true;
        }
      } else {
        this.cachedInputs.jump = false;
      }
    } else {
      this.cachedInputs.throttle = 0.2;
      this.cachedInputs.boost = false;
    }
  }
}
