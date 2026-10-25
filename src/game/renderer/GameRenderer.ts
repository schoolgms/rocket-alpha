import * as THREE from 'three';
import { GraphicsConfig } from '../settings/GraphicsSettings';
import { ParticleSystem } from './ParticleSystem';
import { CarPhysics } from '../physics/CarPhysics';
import { BallPhysics } from '../physics/BallPhysics';

export class GameRenderer {
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public particleSystem: ParticleSystem;

  private canvas: HTMLCanvasElement;
  private width = 0;
  private height = 0;
  private isSoftwareGl = false;

  // Camera settings
  public isBallCam = true;
  private cameraTarget = new THREE.Vector3();
  private cameraPos = new THREE.Vector3();

  // Replay / Celebration camera
  public isGoalCelebration = false;
  private celebrationTimer = 0;

  // Performance telemetry
  public currentFps = 60;
  public frameTimeMs = 16.6;
  private fpsFrames = 0;
  private fpsLastTime = performance.now();

  constructor(canvas: HTMLCanvasElement, config: GraphicsConfig) {
    this.canvas = canvas;

    // 1. Detect software WebGL from renderer string
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Initialize Three.js Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: config.antialias && !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    
    // Configure shadows based on settings
    this.applyShadowSettings(config.shadows);

    // 3. Scene & Horizon Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f1d);
    this.scene.fog = new THREE.FogExp2(0x0a0f1d, 0.007);

    // 4. Perspective Camera
    this.camera = new THREE.PerspectiveCamera(65, 1, 0.5, 350);
    this.camera.position.set(0, 15, -40);

    // 5. Lighting Rig (Key Directional Light + Warm/Cool Hemisphere fill)
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 1.2);
    this.scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.0);
    keyLight.position.set(30, 45, 20);
    keyLight.castShadow = config.shadows && !this.isSoftwareGl;
    keyLight.shadow.mapSize.width = config.shadowMapSize || 512;
    keyLight.shadow.mapSize.height = config.shadowMapSize || 512;
    keyLight.shadow.camera.near = 10;
    keyLight.shadow.camera.far = 120;
    keyLight.shadow.camera.left = -50;
    keyLight.shadow.camera.right = 50;
    keyLight.shadow.camera.top = 50;
    keyLight.shadow.camera.bottom = -50;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    // Subtle Rim/Back Light
    const rimLight = new THREE.DirectionalLight(0x00d2ff, 0.8);
    rimLight.position.set(-35, 25, -45);
    this.scene.add(rimLight);

    // 6. Particle System
    const particleCap = config.particleDensity === 'low' ? 120 : (config.particleDensity === 'medium' ? 300 : 700);
    this.particleSystem = new ParticleSystem(particleCap);
    this.scene.add(this.particleSystem.mesh);

    this.resize(config.resolutionScale);
  }

  public applyShadowSettings(enableShadows: boolean) {
    this.renderer.shadowMap.enabled = enableShadows && !this.isSoftwareGl;
    if (this.renderer.shadowMap.enabled) {
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
  }

  public setResolutionScale(scale: number) {
    this.resize(scale);
  }

  public resize(scale = 1.0) {
    const parent = this.canvas.parentElement || document.body;
    this.width = parent.clientWidth || window.innerWidth;
    this.height = parent.clientHeight || window.innerHeight;

    // Apply resolution scale for Potato/Low mode
    const pixelRatio = this.isSoftwareGl ? 1.0 : Math.min(window.devicePixelRatio, 1.5) * scale;
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(this.width, this.height, false);

    this.camera.aspect = this.width / Math.max(1, this.height);
    this.camera.updateProjectionMatrix();
  }

  /**
   * Smoothly follow the player car with dynamic Ball Cam toggle
   */
  public updateCamera(dt: number, playerCar: CarPhysics | null, ball: BallPhysics) {
    if (!playerCar) return;

    if (this.isGoalCelebration) {
      // Cinematic 360 orbit around the ball / goal celebration
      this.celebrationTimer += dt;
      const radius = 14.0;
      const angle = this.celebrationTimer * 1.5;
      const targetPos = ball.position.clone();

      this.camera.position.set(
        targetPos.x + Math.sin(angle) * radius,
        targetPos.y + 4.5 + Math.sin(this.celebrationTimer * 2) * 1.5,
        targetPos.z + Math.cos(angle) * radius
      );
      this.camera.lookAt(targetPos);
      return;
    }

    const carPos = playerCar.state.position;
    const carQuat = playerCar.state.quaternion;
    const ballPos = ball.position;

    // Forward direction of car
    const carForward = new THREE.Vector3(0, 0, 1).applyQuaternion(carQuat).normalize();
    const carUp = new THREE.Vector3(0, 1, 0).applyQuaternion(carQuat).normalize();

    let desiredCamPos = new THREE.Vector3();
    let desiredLookAt = new THREE.Vector3();

    if (this.isBallCam) {
      // Ball Cam: Camera sits behind car looking towards the ball
      const carToBall = new THREE.Vector3().subVectors(ballPos, carPos);
      carToBall.y = 0;
      const dist = carToBall.length();
      
      let camDir: THREE.Vector3;
      if (dist > 1.0) {
        camDir = carToBall.clone().normalize().negate(); // point behind car relative to ball
      } else {
        camDir = carForward.clone().negate();
      }

      const camDistance = 8.5;
      const camHeight = 3.8;

      desiredCamPos.copy(carPos)
        .addScaledVector(camDir, camDistance)
        .add(new THREE.Vector3(0, camHeight, 0));

      // Look slightly above ball
      desiredLookAt.copy(ballPos).add(new THREE.Vector3(0, 0.4, 0));

    } else {
      // Car Cam: Fixed behind car's forward orientation
      const camDistance = 8.2;
      const camHeight = 3.2;

      desiredCamPos.copy(carPos)
        .addScaledVector(carForward, -camDistance)
        .addScaledVector(carUp, camHeight);

      desiredLookAt.copy(carPos).addScaledVector(carForward, 8.0).add(new THREE.Vector3(0, 1.2, 0));
    }

    // Frame-rate independent exponential damping for buttery smooth motion
    const dampRate = 14.0;
    this.cameraPos.lerp(desiredCamPos, 1.0 - Math.exp(-dampRate * dt));
    this.cameraTarget.lerp(desiredLookAt, 1.0 - Math.exp(-dampRate * dt));

    this.camera.position.copy(this.cameraPos);
    this.camera.lookAt(this.cameraTarget);
  }

  public render(dt: number) {
    // 1. Update particles
    this.particleSystem.update(dt);

    // 2. Telemetry FPS calculation
    const now = performance.now();
    this.fpsFrames++;
    this.frameTimeMs = dt * 1000;
    if (now - this.fpsLastTime >= 500) {
      this.currentFps = Math.round((this.fpsFrames * 1000) / (now - this.fpsLastTime));
      this.fpsFrames = 0;
      this.fpsLastTime = now;
    }

    // 3. Render Three.js Scene
    this.renderer.render(this.scene, this.camera);
  }

  public triggerCelebration(isGoal: boolean) {
    this.isGoalCelebration = isGoal;
    this.celebrationTimer = 0;
  }

  public dispose() {
    this.renderer.dispose();
  }
}
