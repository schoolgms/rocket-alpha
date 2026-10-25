import * as THREE from 'three';
import { ARENA_BOUNDS } from '../arena/ArenaTypes';

export class BallPhysics {
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public angularVelocity: THREE.Vector3;
  public radius = 1.45;
  public mesh: THREE.Mesh;
  
  private gravity = -24.0;
  private bounciness = 0.76;
  private friction = 0.985;
  private airDrag = 0.997;

  // Collision tracking
  public lastHitPlayer: string | null = null;
  public lastHitTeam: 'blue' | 'orange' | null = null;
  public lastHitSpeed = 0; // km/h

  constructor() {
    this.position = new THREE.Vector3(0, this.radius + 0.1, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.angularVelocity = new THREE.Vector3(0, 0, 0);

    // Create 3D soccer ball mesh with high-contrast pentagonal pattern
    this.mesh = this.createBallMesh();
  }

  private createBallMesh(): THREE.Mesh {
    const geom = new THREE.SphereGeometry(this.radius, 24, 24);
    
    // Procedural soccer football texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // White base
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Glowing futuristic carbon panels
    ctx.fillStyle = '#0f172a';
    for (let x = 32; x < 512; x += 96) {
      for (let y = 32; y < 256; y += 96) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          const px = x + Math.cos(angle) * 26;
          const py = y + Math.sin(angle) * 26;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      }
    }

    // Glowing seam lines
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, 512, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.25,
      metalness: 0.35,
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  public reset(x = 0, y = 1.55, z = 0) {
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    this.angularVelocity.set(0, 0, 0);
    this.mesh.position.copy(this.position);
    this.lastHitPlayer = null;
    this.lastHitTeam = null;
    this.lastHitSpeed = 0;
  }

  public update(dt: number, onBounce?: (strength: number) => void): 'blue_goal' | 'orange_goal' | null {
    // 1. Gravity and Drag
    this.velocity.y += this.gravity * dt;
    this.velocity.x *= this.airDrag;
    this.velocity.z *= this.airDrag;

    // Terminal velocity cap
    const speed = this.velocity.length();
    const maxSpeed = 48.0; // ~170 km/h
    if (speed > maxSpeed) {
      this.velocity.multiplyScalar(maxSpeed / speed);
    }

    // Update position
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;

    // Ball visual rotation
    if (speed > 0.05) {
      const rotAxis = new THREE.Vector3(-this.velocity.z, 0, this.velocity.x).normalize();
      const rotAngle = (speed / this.radius) * dt;
      this.mesh.rotateOnWorldAxis(rotAxis, rotAngle);
    }

    // 2. Arena Collisions
    const b = ARENA_BOUNDS;
    const halfW = b.width / 2;
    const halfL = b.length / 2;
    const r = this.radius;

    // Floor collision
    if (this.position.y - r < 0) {
      this.position.y = r;
      if (this.velocity.y < 0) {
        const bounceImpulse = -this.velocity.y;
        this.velocity.y = -this.velocity.y * this.bounciness;
        this.velocity.x *= this.friction;
        this.velocity.z *= this.friction;
        if (bounceImpulse > 2.0 && onBounce) {
          onBounce(bounceImpulse / 15.0);
        }
      }
    }

    // Ceiling collision
    if (this.position.y + r > b.height) {
      this.position.y = b.height - r;
      if (this.velocity.y > 0) {
        this.velocity.y = -this.velocity.y * this.bounciness;
      }
    }

    // Side Walls collision
    if (this.position.x - r < -halfW) {
      this.position.x = -halfW + r;
      if (this.velocity.x < 0) {
        this.velocity.x = -this.velocity.x * this.bounciness;
        if (Math.abs(this.velocity.x) > 2 && onBounce) onBounce(Math.abs(this.velocity.x) / 15);
      }
    } else if (this.position.x + r > halfW) {
      this.position.x = halfW - r;
      if (this.velocity.x > 0) {
        this.velocity.x = -this.velocity.x * this.bounciness;
        if (Math.abs(this.velocity.x) > 2 && onBounce) onBounce(Math.abs(this.velocity.x) / 15);
      }
    }

    // Corner Chamfer collisions
    // c1: top-left (-halfW, -halfL), normal = (1, 0, 1) / sqrt(2)
    const checkChamfer = (cornerX: number, cornerZ: number, nx: number, nz: number) => {
      // Line equation: nx * (x - cornerX) + nz * (z - cornerZ) = 0
      const d = nx * (this.position.x - cornerX) + nz * (this.position.z - cornerZ);
      if (d < r) {
        this.position.x += nx * (r - d);
        this.position.z += nz * (r - d);
        const dot = this.velocity.x * nx + this.velocity.z * nz;
        if (dot < 0) {
          this.velocity.x -= (1 + this.bounciness) * dot * nx;
          this.velocity.z -= (1 + this.bounciness) * dot * nz;
          if (onBounce) onBounce(Math.abs(dot) / 15);
        }
      }
    };

    const chamferOffset = b.cornerChamfer;
    const invSqrt2 = Math.SQRT1_2;
    // Corners:
    if (this.position.x < -halfW + chamferOffset && this.position.z < -halfL + chamferOffset) {
      checkChamfer(-halfW + chamferOffset, -halfL + chamferOffset, invSqrt2, invSqrt2);
    } else if (this.position.x > halfW - chamferOffset && this.position.z < -halfL + chamferOffset) {
      checkChamfer(halfW - chamferOffset, -halfL + chamferOffset, -invSqrt2, invSqrt2);
    } else if (this.position.x < -halfW + chamferOffset && this.position.z > halfL - chamferOffset) {
      checkChamfer(-halfW + chamferOffset, halfL - chamferOffset, invSqrt2, -invSqrt2);
    } else if (this.position.x > halfW - chamferOffset && this.position.z > halfL - chamferOffset) {
      checkChamfer(halfW - chamferOffset, halfL - chamferOffset, -invSqrt2, -invSqrt2);
    }

    // 3. Goal Mouth and End Wall Handling
    const inGoalMouthX = Math.abs(this.position.x) < b.goalWidth / 2 - 0.4;
    const inGoalMouthY = this.position.y < b.goalHeight;

    // Blue End (-Z)
    if (this.position.z - r < -halfL) {
      if (!inGoalMouthX || !inGoalMouthY) {
        // Hit outer end wall
        this.position.z = -halfL + r;
        if (this.velocity.z < 0) {
          this.velocity.z = -this.velocity.z * this.bounciness;
          if (onBounce) onBounce(Math.abs(this.velocity.z) / 15);
        }
      } else {
        // Inside Blue Goal!
        // Back of goal net collision
        if (this.position.z - r < -halfL - b.goalDepth) {
          this.position.z = -halfL - b.goalDepth + r;
          this.velocity.multiplyScalar(0.2); // Ball dampens in net
        }
        // Entire ball crossed goal plane!
        if (this.position.z + r < -halfL) {
          // Orange team scores into Blue goal!
          this.lastHitSpeed = Math.round(speed * 3.6);
          return 'orange_goal';
        }
      }
    }

    // Orange End (+Z)
    if (this.position.z + r > halfL) {
      if (!inGoalMouthX || !inGoalMouthY) {
        // Hit outer end wall
        this.position.z = halfL - r;
        if (this.velocity.z > 0) {
          this.velocity.z = -this.velocity.z * this.bounciness;
          if (onBounce) onBounce(Math.abs(this.velocity.z) / 15);
        }
      } else {
        // Inside Orange Goal!
        if (this.position.z + r > halfL + b.goalDepth) {
          this.position.z = halfL + b.goalDepth - r;
          this.velocity.multiplyScalar(0.2);
        }
        // Entire ball crossed goal plane!
        if (this.position.z - r > halfL) {
          // Blue team scores into Orange goal!
          this.lastHitSpeed = Math.round(speed * 3.6);
          return 'blue_goal';
        }
      }
    }

    this.mesh.position.copy(this.position);
    return null;
  }
}
