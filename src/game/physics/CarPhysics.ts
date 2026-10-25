import * as THREE from 'three';
import { CarInputs, CarState } from './PhysicsTypes';
import { CarMeshes } from '../garage/CarBuilder';
import { ARENA_BOUNDS } from '../arena/ArenaTypes';
import { BallPhysics } from './BallPhysics';

export class CarPhysics {
  public state: CarState;
  public meshes: CarMeshes;
  
  // Dimensions & bounds
  public length = 4.0;
  public width = 2.0;
  public height = 1.25;

  // Handling constants
  private maxSpeed = 26.0;         // Normal max ground speed (~94 km/h)
  private supersonicSpeed = 33.0;  // Boost max speed (~118 km/h)
  private acceleration = 28.0;     // m/s²
  private brakeDecel = 35.0;       // m/s²
  private boostThrust = 38.0;      // m/s²
  private boostDrainRate = 33.3;   // % per second (approx 3 full seconds)
  private gravity = -26.0;         // m/s²
  private jumpForce = 11.5;        // m/s initial jump pop
  private doubleJumpForce = 9.5;
  private dodgeImpulse = 12.0;     // Speed burst during flip

  // Audio & effect callbacks
  public onJump?: (isDouble: boolean) => void;
  public onBoostChange?: (isBoosting: boolean) => void;
  public onCrash?: () => void;
  public onBallHit?: (strength: number) => void;

  constructor(id: string, name: string, team: 'blue' | 'orange', meshes: CarMeshes) {
    this.meshes = meshes;
    this.state = {
      id,
      name,
      team,
      position: new THREE.Vector3(0, 0.4, 0),
      quaternion: new THREE.Quaternion(),
      velocity: new THREE.Vector3(0, 0, 0),
      angularVelocity: new THREE.Vector3(0, 0, 0),
      boost: 33.3, // Standard starting boost
      isGrounded: true,
      isBoosting: false,
      isSupersonic: false,
      hasJumped: false,
      hasDoubleJumped: false,
      jumpTimer: 0,
      flipTimer: 0,
      flipAxis: new THREE.Vector3(1, 0, 0),
      flipAngle: 0,
    };
  }

  public reset(x: number, z: number, targetFacingAngle: number) {
    this.state.position.set(x, 0.4, z);
    this.state.velocity.set(0, 0, 0);
    this.state.angularVelocity.set(0, 0, 0);
    this.state.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetFacingAngle);
    this.state.isGrounded = true;
    this.state.isBoosting = false;
    this.state.isSupersonic = false;
    this.state.hasJumped = false;
    this.state.hasDoubleJumped = false;
    this.state.jumpTimer = 0;
    this.state.flipTimer = 0;
    this.state.boost = 33.3;
    this.syncMeshes();
  }

  public update(dt: number, inputs: CarInputs, ball: BallPhysics) {
    // 1. Directional vectors from quaternion
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.state.quaternion).normalize();
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.state.quaternion).normalize();
    const right = new THREE.Vector3().crossVectors(up, forward).normalize();

    // 2. Jumping & Double Jump / Dodge Flip mechanics
    if (this.state.isGrounded) {
      this.state.hasJumped = false;
      this.state.hasDoubleJumped = false;
      this.state.jumpTimer = 0;

      if (inputs.jumpJustPressed) {
        this.state.velocity.y = this.jumpForce;
        this.state.isGrounded = false;
        this.state.hasJumped = true;
        this.state.jumpTimer = 0;
        if (this.onJump) this.onJump(false);
      }
    } else {
      // Airborne
      this.state.jumpTimer += dt;

      // Check for Double Jump / Dodge Flip
      if (inputs.jumpJustPressed && !this.state.hasDoubleJumped && this.state.jumpTimer < 1.4) {
        this.state.hasDoubleJumped = true;
        
        // Directional dodge check
        const hasDirection = Math.abs(inputs.throttle) > 0.2 || Math.abs(inputs.steer) > 0.2;
        if (hasDirection) {
          // Dodge Flip!
          this.state.flipTimer = 0.65; // ~0.65s flip animation
          this.state.flipAngle = 0;

          const dodgeDir = new THREE.Vector3();
          dodgeDir.addScaledVector(forward, inputs.throttle);
          dodgeDir.addScaledVector(right, inputs.steer);
          dodgeDir.normalize();

          // Flip axis is perpendicular to dodge direction
          this.state.flipAxis = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dodgeDir).normalize();
          if (this.state.flipAxis.lengthSq() < 0.1) {
            this.state.flipAxis.set(1, 0, 0);
          }

          // Dodge impulse burst
          this.state.velocity.addScaledVector(dodgeDir, this.dodgeImpulse);
          this.state.velocity.y = Math.max(this.state.velocity.y, 2.0); // Slight pop
        } else {
          // Neutral double jump
          this.state.velocity.y += this.doubleJumpForce;
        }

        if (this.onJump) this.onJump(true);
      }
    }

    // 3. Rocket Boost
    const wantsBoost = inputs.boost && this.state.boost > 0;
    if (wantsBoost) {
      this.state.boost = Math.max(0, this.state.boost - this.boostDrainRate * dt);
      this.state.velocity.addScaledVector(forward, this.boostThrust * dt);
      if (!this.state.isBoosting) {
        this.state.isBoosting = true;
        if (this.onBoostChange) this.onBoostChange(true);
      }
    } else {
      if (this.state.isBoosting) {
        this.state.isBoosting = false;
        if (this.onBoostChange) this.onBoostChange(false);
      }
    }

    // 4. Ground vs Air Physics
    if (this.state.isGrounded) {
      // Forward velocity along car heading
      let currentForwardSpeed = this.state.velocity.dot(forward);

      // Throttle acceleration / braking
      if (inputs.throttle > 0) {
        currentForwardSpeed += this.acceleration * inputs.throttle * dt;
      } else if (inputs.throttle < 0) {
        if (currentForwardSpeed > 0.5) {
          // Braking
          currentForwardSpeed -= this.brakeDecel * dt;
        } else {
          // Reverse
          currentForwardSpeed += this.acceleration * 0.7 * inputs.throttle * dt;
        }
      } else {
        // Natural ground friction roll-off
        currentForwardSpeed *= Math.pow(0.96, dt * 60);
      }

      // Max speed clamp
      const speedCap = wantsBoost ? this.supersonicSpeed : this.maxSpeed;
      currentForwardSpeed = Math.max(-12.0, Math.min(speedCap, currentForwardSpeed));

      // Lateral drift / powerslide
      const lateralFriction = inputs.handbrake ? 0.88 : 0.45; // lower means more grip
      const lateralVel = this.state.velocity.dot(right);
      const newLateralVel = lateralVel * Math.pow(lateralFriction, dt * 60);

      // Reconstruct ground velocity
      this.state.velocity.copy(forward).multiplyScalar(currentForwardSpeed);
      this.state.velocity.addScaledVector(right, newLateralVel);

      // Steering
      const steerFactor = inputs.handbrake ? 3.6 : 2.5;
      const effectiveSpeed = Math.min(1.0, Math.abs(currentForwardSpeed) / 10.0);
      const turnSign = currentForwardSpeed >= -0.1 ? 1 : -1;
      const yawDelta = -inputs.steer * steerFactor * effectiveSpeed * turnSign * dt;

      const yawQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yawDelta);
      this.state.quaternion.premultiply(yawQuat);

    } else {
      // Airborne: Gravity + Air Steering (Pitch, Yaw, Roll)
      this.state.velocity.y += this.gravity * dt;

      // Handle dodge flip animation rotation
      if (this.state.flipTimer > 0) {
        this.state.flipTimer -= dt;
        const flipSpeed = (Math.PI * 2) / 0.65;
        const dAngle = flipSpeed * dt;
        const flipRot = new THREE.Quaternion().setFromAxisAngle(this.state.flipAxis, dAngle);
        this.state.quaternion.multiply(flipRot);
      } else {
        // Player aerial controls
        const airPitchSpeed = 3.2;
        const airYawSpeed = 3.0;
        const airRollSpeed = 3.8;

        // Pitch (local X)
        if (Math.abs(inputs.airPitch) > 0.05) {
          const pitchQuat = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(1, 0, 0),
            inputs.airPitch * airPitchSpeed * dt
          );
          this.state.quaternion.multiply(pitchQuat);
        }

        // Yaw (local Y)
        if (Math.abs(inputs.airYaw) > 0.05) {
          const yawQuat = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 1, 0),
            -inputs.airYaw * airYawSpeed * dt
          );
          this.state.quaternion.multiply(yawQuat);
        }

        // Air Roll (local Z)
        if (Math.abs(inputs.airRoll) > 0.05) {
          const rollQuat = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 0, 1),
            -inputs.airRoll * airRollSpeed * dt
          );
          this.state.quaternion.multiply(rollQuat);
        }
      }
    }

    // 5. Update Position
    this.state.position.addScaledVector(this.state.velocity, dt);

    // 6. Ground & Arena Boundaries
    const groundHeight = 0.4;
    if (this.state.position.y <= groundHeight) {
      this.state.position.y = groundHeight;
      this.state.velocity.y = 0;
      this.state.isGrounded = true;

      // Auto-level car pitch/roll when grounded
      const euler = new THREE.Euler().setFromQuaternion(this.state.quaternion, 'YXZ');
      euler.x *= 0.8;
      euler.z *= 0.8;
      this.state.quaternion.setFromEuler(euler);
    } else {
      this.state.isGrounded = false;
    }

    // Arena wall boundaries
    const halfW = ARENA_BOUNDS.width / 2 - 1.2;
    const halfL = ARENA_BOUNDS.length / 2 - 1.2;
    if (Math.abs(this.state.position.x) > halfW) {
      this.state.position.x = Math.sign(this.state.position.x) * halfW;
      this.state.velocity.x *= -0.4;
      if (this.onCrash) this.onCrash();
    }
    if (Math.abs(this.state.position.z) > halfL) {
      this.state.position.z = Math.sign(this.state.position.z) * halfL;
      this.state.velocity.z *= -0.4;
      if (this.onCrash) this.onCrash();
    }

    // Supersonic check (> 28 m/s = 100 km/h)
    const currentSpeed = this.state.velocity.length();
    this.state.isSupersonic = currentSpeed > 27.5;

    // 7. Car-to-Ball Collision
    this.checkBallCollision(ball);

    // 8. Update Wheels animation
    this.updateWheelAnimations(dt, inputs.steer);

    // Sync 3D transforms
    this.syncMeshes();
  }

  private checkBallCollision(ball: BallPhysics) {
    const carPos = this.state.position;
    const ballPos = ball.position;
    
    // Distance check
    const diff = new THREE.Vector3().subVectors(ballPos, carPos);
    const combinedRadius = ball.radius + 1.2;
    const distSq = diff.lengthSq();

    if (distSq < combinedRadius * combinedRadius) {
      const dist = Math.sqrt(distSq);
      const hitNormal = dist > 0.001 ? diff.clone().multiplyScalar(1 / dist) : new THREE.Vector3(0, 1, 0);

      // Separate ball out of car penetration
      const penetration = combinedRadius - dist;
      ball.position.addScaledVector(hitNormal, penetration * 0.8);
      this.state.position.addScaledVector(hitNormal, -penetration * 0.2);

      // Calculate hit impulse
      const carVel = this.state.velocity;
      const relativeVel = new THREE.Vector3().subVectors(carVel, ball.velocity);
      const normalVel = relativeVel.dot(hitNormal);

      // Mechanical hit bonus
      let hitMultiplier = 1.2;
      const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.state.quaternion);
      const frontDot = forward.dot(hitNormal);
      if (frontDot > 0.4) {
        // Front bumper hit = Power shot!
        hitMultiplier += 0.45;
      }
      if (this.state.flipTimer > 0) {
        // Dodge flip hit = Rocket power shot!
        hitMultiplier += 0.5;
      }

      const impulseMagnitude = Math.max(12.0, (Math.abs(normalVel) + 10.0) * hitMultiplier);
      const impulse = hitNormal.clone().multiplyScalar(impulseMagnitude);

      ball.velocity.add(impulse);
      ball.lastHitPlayer = this.state.name;
      ball.lastHitTeam = this.state.team;

      // Slight recoil on car
      this.state.velocity.addScaledVector(hitNormal, -impulseMagnitude * 0.15);

      if (this.onBallHit) {
        this.onBallHit(impulseMagnitude / 15.0);
      }
    }
  }

  private updateWheelAnimations(dt: number, steerInput: number) {
    const forwardSpeed = this.state.velocity.length();
    const wheelRotSpeed = (forwardSpeed / 0.38) * dt;

    // Spin wheels
    for (const w of this.meshes.wheels) {
      w.rotation.x += wheelRotSpeed;
    }

    // Steer front wheels
    const maxSteerAngle = 0.45; // ~26 degrees
    const targetSteerAngle = -steerInput * maxSteerAngle;
    for (const fw of this.meshes.frontWheels) {
      fw.rotation.y = THREE.MathUtils.lerp(fw.rotation.y, targetSteerAngle, dt * 15);
    }
  }

  public syncMeshes() {
    this.meshes.root.position.copy(this.state.position);
    this.meshes.root.quaternion.copy(this.state.quaternion);
  }
}
