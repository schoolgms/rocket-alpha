import { CarInputs, EMPTY_INPUTS } from '../physics/PhysicsTypes';

export class InputManager {
  private static instance: InputManager;
  private keys: Record<string, boolean> = {};
  private jumpJustPressed = false;
  private ballCamJustPressed = false;
  private resetJustPressed = false;
  private pauseJustPressed = false;

  // Touch state
  private touchInputs: Partial<CarInputs> = {};
  public isTouchDevice = false;

  // Gamepad state
  public gamepadConnected = false;
  public gamepadName = '';
  private prevGamepadButtons: boolean[] = [];

  private constructor() {
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.setupKeyboard();
    this.setupGamepad();
  }

  public static getInstance(): InputManager {
    if (!InputManager.instance) {
      InputManager.instance = new InputManager();
    }
    return InputManager.instance;
  }

  private setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      // Avoid browser scrolling on space/arrows during game
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'Space' && !this.keys['Space']) {
        this.jumpJustPressed = true;
      }
      if (['KeyC', 'Space'].includes(e.code) && !this.keys[e.code]) {
        // C key for ball cam
        if (e.code === 'KeyC') this.ballCamJustPressed = true;
      }
      if (e.code === 'KeyR' && !this.keys['KeyR']) {
        this.resetJustPressed = true;
      }
      if (e.code === 'Escape' && !this.keys['Escape']) {
        this.pauseJustPressed = true;
      }

      this.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Clear held keys on window blur
    window.addEventListener('blur', () => {
      this.keys = {};
    });
  }

  private setupGamepad() {
    window.addEventListener('gamepadconnected', (e: GamepadEvent) => {
      this.gamepadConnected = true;
      this.gamepadName = e.gamepad.id || 'Standard Controller';
    });

    window.addEventListener('gamepaddisconnected', () => {
      this.gamepadConnected = false;
      this.gamepadName = '';
    });
  }

  public setTouchInput(partial: Partial<CarInputs>) {
    this.touchInputs = { ...this.touchInputs, ...partial };
    if (partial.jumpJustPressed) {
      this.jumpJustPressed = true;
    }
  }

  public consumeBallCamToggle(): boolean {
    const val = this.ballCamJustPressed;
    this.ballCamJustPressed = false;
    return val;
  }

  public consumeReset(): boolean {
    const val = this.resetJustPressed;
    this.resetJustPressed = false;
    return val;
  }

  public consumePause(): boolean {
    const val = this.pauseJustPressed;
    this.pauseJustPressed = false;
    return val;
  }

  public getInputs(): CarInputs {
    const inputs: CarInputs = { ...EMPTY_INPUTS };

    // 1. Keyboard Inputs
    // Throttle: W / Up Arrow vs S / Down Arrow
    if (this.keys['KeyW'] || this.keys['ArrowUp']) inputs.throttle += 1.0;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) inputs.throttle -= 1.0;

    // Steer: A / Left Arrow vs D / Right Arrow
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) inputs.steer -= 1.0;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) inputs.steer += 1.0;

    // Jump
    inputs.jump = !!this.keys['Space'];
    inputs.jumpJustPressed = this.jumpJustPressed;
    this.jumpJustPressed = false; // consume edge-trigger

    // Boost: Shift or Right Click
    inputs.boost = !!(this.keys['ShiftLeft'] || this.keys['ShiftRight']);

    // Handbrake: Space + S or Left Control or KeyX
    inputs.handbrake = !!(this.keys['ControlLeft'] || this.keys['KeyX']);

    // Air Roll: Q / E
    if (this.keys['KeyQ']) inputs.airRoll -= 1.0;
    if (this.keys['KeyE']) inputs.airRoll += 1.0;

    // Air Pitch / Yaw (same as W/S and A/D in air)
    inputs.airPitch = inputs.throttle;
    inputs.airYaw = inputs.steer;

    // 2. Poll Gamepad API
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0];
    if (gp && gp.connected) {
      this.gamepadConnected = true;

      // Left Stick (Axes 0: Steer, Axes 1: Pitch)
      const stickDeadzone = 0.15;
      const stickX = gp.axes[0];
      const stickY = gp.axes[1];

      if (Math.abs(stickX) > stickDeadzone) {
        inputs.steer = stickX;
        inputs.airYaw = stickX;
      }
      if (Math.abs(stickY) > stickDeadzone) {
        inputs.airPitch = -stickY; // invert for natural nose up/down
      }

      // RT (Throttle) and LT (Brake)
      const rt = gp.buttons[7] ? gp.buttons[7].value : 0;
      const lt = gp.buttons[6] ? gp.buttons[6].value : 0;
      if (rt > 0.1) inputs.throttle = rt;
      if (lt > 0.1) inputs.throttle = -lt;

      // Buttons
      // A (0): Jump
      const btnA = gp.buttons[0] && gp.buttons[0].pressed;
      if (btnA) {
        inputs.jump = true;
        if (!this.prevGamepadButtons[0]) {
          inputs.jumpJustPressed = true;
        }
      }

      // B (1) or RB (5): Boost
      const btnB = (gp.buttons[1] && gp.buttons[1].pressed) || (gp.buttons[5] && gp.buttons[5].pressed);
      if (btnB) inputs.boost = true;

      // X (2): Handbrake
      const btnX = gp.buttons[2] && gp.buttons[2].pressed;
      if (btnX) inputs.handbrake = true;

      // LB (4): Air roll left
      if (gp.buttons[4] && gp.buttons[4].pressed) inputs.airRoll -= 1.0;

      // Y (3): Ball Cam Toggle
      const btnY = gp.buttons[3] && gp.buttons[3].pressed;
      if (btnY && !this.prevGamepadButtons[3]) {
        this.ballCamJustPressed = true;
      }

      // Start / Menu (9): Pause
      const btnStart = gp.buttons[9] && gp.buttons[9].pressed;
      if (btnStart && !this.prevGamepadButtons[9]) {
        this.pauseJustPressed = true;
      }

      // Cache buttons for edge-trigger detection
      this.prevGamepadButtons = gp.buttons.map(b => b.pressed);
    }

    // 3. Merge Touch Inputs
    if (this.touchInputs.throttle !== undefined) inputs.throttle = this.touchInputs.throttle;
    if (this.touchInputs.steer !== undefined) {
      inputs.steer = this.touchInputs.steer;
      inputs.airYaw = this.touchInputs.steer;
    }
    if (this.touchInputs.boost !== undefined) inputs.boost = inputs.boost || this.touchInputs.boost;
    if (this.touchInputs.handbrake !== undefined) inputs.handbrake = inputs.handbrake || this.touchInputs.handbrake;
    if (this.touchInputs.airRoll !== undefined) inputs.airRoll = this.touchInputs.airRoll;
    if (this.touchInputs.jump !== undefined) inputs.jump = inputs.jump || this.touchInputs.jump;

    return inputs;
  }
}
