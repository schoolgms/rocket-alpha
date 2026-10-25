import * as THREE from 'three';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  public mesh: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private particles: Particle[] = [];
  private maxParticles = 600;

  constructor(maxCount = 600) {
    this.maxParticles = maxCount;
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    // Circle particle texture generated in code
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#ffffff');
    grad.addColorStop(0.8, 'rgba(255,255,255,0.4)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 1.2,
      map: texture,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.mesh = new THREE.Points(this.geometry, material);
    this.mesh.frustumCulled = false;
  }

  public emitBoost(origin: THREE.Vector3, dir: THREE.Vector3, colorHex: string, count = 2) {
    if (this.particles.length >= this.maxParticles) return;
    const baseColor = new THREE.Color(colorHex);

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const spread = 0.4;
      const vel = dir.clone().multiplyScalar(-18 - Math.random() * 8);
      vel.x += (Math.random() - 0.5) * spread * 10;
      vel.y += (Math.random() - 0.5) * spread * 10;
      vel.z += (Math.random() - 0.5) * spread * 10;

      this.particles.push({
        position: origin.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2)),
        velocity: vel,
        color: baseColor.clone().offsetHSL(0, 0, (Math.random() - 0.5) * 0.2),
        size: 0.6 + Math.random() * 0.6,
        life: 0,
        maxLife: 0.25 + Math.random() * 0.15,
      });
    }
  }

  public emitGoalExplosion(center: THREE.Vector3, colorHex: string, count = 120) {
    const baseColor = new THREE.Color(colorHex);
    const goldColor = new THREE.Color('#ffdd00');

    for (let i = 0; i < Math.min(count, this.maxParticles - this.particles.length); i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const speed = 15 + Math.random() * 35;

      const vel = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi)
      ).multiplyScalar(speed);

      const color = Math.random() > 0.4 ? baseColor : goldColor;

      this.particles.push({
        position: center.clone(),
        velocity: vel,
        color: color.clone(),
        size: 1.0 + Math.random() * 1.5,
        life: 0,
        maxLife: 1.2 + Math.random() * 0.8,
      });
    }
  }

  public emitSparks(position: THREE.Vector3, count = 6) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 12,
        Math.random() * 8 + 2,
        (Math.random() - 0.5) * 12
      );
      this.particles.push({
        position: position.clone(),
        velocity: vel,
        color: new THREE.Color('#fbbf24'),
        size: 0.4,
        life: 0,
        maxLife: 0.35,
      });
    }
  }

  public update(dt: number) {
    let writeIdx = 0;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life < p.maxLife) {
        p.position.addScaledVector(p.velocity, dt);
        p.velocity.y -= 12 * dt; // gravity

        const alpha = 1.0 - p.life / p.maxLife;

        this.positions[writeIdx * 3] = p.position.x;
        this.positions[writeIdx * 3 + 1] = p.position.y;
        this.positions[writeIdx * 3 + 2] = p.position.z;

        this.colors[writeIdx * 3] = p.color.r * alpha;
        this.colors[writeIdx * 3 + 1] = p.color.g * alpha;
        this.colors[writeIdx * 3 + 2] = p.color.b * alpha;

        this.sizes[writeIdx] = p.size * alpha;

        this.particles[writeIdx] = p;
        writeIdx++;
      }
    }

    this.particles.length = writeIdx;

    // Zero out unused slots
    for (let i = writeIdx; i < this.maxParticles; i++) {
      this.sizes[i] = 0;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
  }
}
