# ROCKET ARENA 3D — Complete 3D Car Football Game

**Rocket Arena 3D** is a high-octane, browser-based 3D car football game inspired by arcade vehicle sports. Built from scratch with Three.js, React, and pure procedural assets.

Optimized specifically for low-power computers (Intel Celeron N4120, Intel UHD Graphics 600, 8GB RAM, 1366×768 display on Debian Bullseye / Linux / Chrome OS / Windows), scaling up to 60 FPS on high settings.

---

## 🎮 Key Features

1. **Arcade Vehicle Mechanics**:
   - Acceleration, braking, reverse, and powerslide handbrake drifting.
   - Jump, double jump, and 360° dodge flips (forward flip for power shot speed burst, backflips, and barrel rolls).
   - Rocket boost with thrust orientation for mid-air aerial flight.
   - In-air pitch, yaw, and roll controls.
   - Dedicated Ball Cam / Car Cam toggle.

2. **Physical Ball & Arena Geometry**:
   - Regulation physical football with real-time bounce, roll, and spin.
   - Continuous swept collision against arena walls, ceiling, curved 45° corner chamfers, and goal structures.
   - Goal mouth crossing validation (goal only registered when the full ball crosses the plane).
   - Strategic boost pads: 6 full 100-boost corner/midfield beacons + 14 small 12-boost lane pads.

3. **3 Original Stadiums**:
   - **Classic Stadium**: Traditional green turf pitch with crowd stands, floodlight towers, and electric stadium atmosphere.
   - **Neon Arena**: Cyberpunk coliseum with dark reflective floor, glowing cyan/magenta boundaries, and neon goal portals.
   - **Sunset Arena**: Warm twilight pitch framed by desert mountain silhouettes and dusk lighting.

4. **Game Modes**:
   - **VS AI Match**: 1v1, 2v2, and 3v3 team configurations with Easy, Normal, and Hard (aerial-capable) bot difficulties.
   - **Free Play**: Solo practice pitch with infinite rocket boost and instant car/ball reset (`R`).
   - **Training Drills**:
     - *Striker Practice*: Intercept rolling balls and drive power shots into the net.
     - *Goalie Practice*: Defend your goal from high-speed incoming ball trajectories.
     - *Aerial Practice*: Jump, pitch up, boost into the air, and strike high lofted balls.
   - **Online Multiplayer**: Real-time room-code matchmaking, team selection, invite link sharing, and synchronized matches.

5. **Graphics Presets & Potato Mode**:
   - **Potato Mode (Default)**: Optimized for Intel UHD Graphics 600 & low-power CPUs (0.70x resolution scale, disabled real-time shadows, capped particles, 30 FPS target).
   - **Low**: 0.85x resolution scale, 45 FPS target.
   - **Medium**: 1.0x native resolution, 512px soft shadow map, 60 FPS target.
   - **High**: Full resolution with antialiasing, 1024px soft shadows, rich particle density.
   - Custom sliders: Resolution Scale (60% to 100%), FPS Limiter (30, 45, 60, Uncapped), Live FPS display.

6. **Full Localization (7 Languages)**:
   - Spanish (Español) - Default & fallback
   - English (English)
   - Galician (Galego)
   - Portuguese (Português)
   - French (Français)
   - German (Deutsch)
   - Italian (Italiano)

7. **Garage & Customization**:
   - 3 Original Car Bodies: **Apex Hatch**, **Viper Muscle**, **Titan Interceptor**.
   - Custom paint colors, decal accent colors, and finishes (Glossy, Matte, Metallic).
   - Boost trail plasma colors (Cyan Plasma, Firestorm, Neon Magenta, Emerald Flux, Solar Flare, Void Purple).
   - Custom player name and 3D rotatable car preview.

8. **Zero 404 Procedural Audio & VFX**:
   - 100% synthesized in Web Audio API: engine rev pitch modulation, rocket thruster roar, metallic ball impacts, goal celebration sirens, referee countdown beeps.
   - Particle systems for rocket boost flames, sparks, and explosive goal blasts.

---

## 🕹️ Controls Guide

### Keyboard & Mouse
| Action | Key(s) |
| :--- | :--- |
| **Accelerate** | `W` or `↑` |
| **Brake / Reverse** | `S` or `↓` |
| **Steer Left / Right** | `A` / `D` or `←` / `→` |
| **Jump / Dodge Flip** | `Space` (Tap twice with direction for flip) |
| **Rocket Boost** | `Shift` (Hold) |
| **Handbrake / Drift** | `Ctrl` or `X` |
| **Air Roll (Aerial)** | `Q` (Left) / `E` (Right) |
| **Toggle Ball Cam** | `C` |
| **Reset Car** | `R` |
| **Pause Game** | `Esc` |

### Gamepad API (Xbox / PlayStation / Generic Controllers)
- **Steer / Pitch**: Left Analog Stick
- **Accelerate**: `RT` (Right Trigger)
- **Brake / Reverse**: `LT` (Left Trigger)
- **Jump / Dodge**: `Button A` (Cross)
- **Rocket Boost**: `Button B` (Circle) or `RB`
- **Handbrake / Drift**: `Button X` (Square)
- **Ball Cam Toggle**: `Button Y` (Triangle)
- **Air Roll**: `LB` (Left Bumper)
- **Pause**: `Start / Menu`

### Mobile Touch Controls
Virtual touch controls automatically appear on touch-enabled screens, with left/right steering, gas pedal, brake, jump button, and a boost gauge.

---

## 🚀 How to Run the Game Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` in your browser.

---

## 🌐 Online Multiplayer Architecture

Rocket Arena 3D supports two multiplayer communication layers:

1. **Broadcast & WebRTC Data Channels (Static / P2P)**:
   - Works immediately even on static hosts like GitHub Pages.
   - Allows multiple browser tabs, windows, or local devices to connect using shared Room Codes (e.g. `ARENA-101`) or shareable invite links (`?room=CODE`).
   - Host is authoritative for ball physics and match clock.

2. **Custom Dedicated WebSocket Relay Server (Optional for global WAN matchmaking)**:
   - When deploying to production with an external server, deploy the WebSocket relay service on any Node.js host (Render, Fly.io, Railway, or VPS).
   - In `MultiplayerManager.ts`, point `ws = new WebSocket('wss://your-relay-server.com')`.
   - The game gracefully falls back to local and peer channels if the external server is unreachable.

---

## 📦 How to Build for Production & Publish to GitHub Pages

### 1. Build the Static Frontend
Run the production build:
```bash
npm run build
```
This produces an optimized bundle in `/dist` with relative asset links (`base: './'`).

### 2. Deploy to GitHub Pages

#### Method A: GitHub Actions (Recommended)
Add a workflow file at `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Setup Pages
        uses: actions/configure-pages@v4
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

#### Method B: Manual gh-pages Branch
```bash
npm run build
npx gh-pages -d dist
```

In GitHub Repository Settings -> **Pages**, select **GitHub Actions** (or the `gh-pages` branch) as the source.

---

## ⚡ Performance Optimization for Intel Celeron / Intel UHD 600

- **Default Potato Preset**: When launched, the game defaults to Potato Mode:
  - Resolution scale: 70% (sharp 960x540 internal buffer scaled to 1366x768).
  - Software WebGL detection: disables expensive shadow passes automatically if hardware acceleration is unavailable.
  - Capped particle pools with zero runtime garbage collection.
  - Efficient 120ms throttled AI decision ticks preventing CPU spikes.
  - Zero external textures or audio files to avoid memory pressure and network latency.
