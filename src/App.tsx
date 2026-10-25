import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { LanguageProvider } from './i18n/LanguageContext';
import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { GarageMenu } from './components/GarageMenu';
import { SettingsModal } from './components/SettingsModal';
import { ControlsGuideModal } from './components/ControlsGuideModal';
import { PauseModal } from './components/PauseModal';
import { MatchEndModal } from './components/MatchEndModal';
import { OnlineLobbyModal } from './components/OnlineLobbyModal';
import { TrainingMenu } from './components/TrainingMenu';

import { SettingsManager, GraphicsConfig } from './game/settings/GraphicsSettings';
import { SoundManager } from './game/audio/SoundManager';
import { CarCustomization, loadSavedCar, saveCar } from './game/garage/GarageTypes';
import { CarBuilder } from './game/garage/CarBuilder';
import { ArenaBuilder, BuiltArena } from './game/arena/ArenaBuilder';
import { StadiumType } from './game/arena/ArenaTypes';
import { BallPhysics } from './game/physics/BallPhysics';
import { CarPhysics } from './game/physics/CarPhysics';
import { PhysicsWorld } from './game/physics/PhysicsWorld';
import { BotController } from './game/ai/BotController';
import { GameRenderer } from './game/renderer/GameRenderer';
import { InputManager } from './game/input/InputManager';
import { MatchManager, MatchConfig, TrainingDrill } from './game/state/MatchManager';
import { MultiplayerManager, NetworkMatchState } from './game/network/MultiplayerManager';

export function GameApp() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // High-level App States
  const [gameState, setGameState] = useState<'title' | 'playing' | 'paused' | 'match_end'>('title');
  const [activeModal, setActiveModal] = useState<'none' | 'garage' | 'settings' | 'controls' | 'online' | 'training'>('none');

  // Match & Telemetry state for React HUD
  const [matchManager, setMatchManager] = useState<MatchManager | null>(null);
  const [hudState, setHudState] = useState({
    blueScore: 0,
    orangeScore: 0,
    timeFormatted: '5:00',
    isOvertime: false,
    phase: 'countdown' as any,
    countdownNumber: 3 as number | 'GO',
    boost: 33.3,
    isSupersonic: false,
    isBallCam: true,
    fps: 60,
    showFps: true,
    lastGoalScorer: '',
    lastGoalTeam: 'blue' as 'blue' | 'orange',
    lastGoalSpeed: 0,
  });

  const [playerCustomization, setPlayerCustomization] = useState<CarCustomization>(() => loadSavedCar());

  // Game Engine Singletons / Persistent Refs
  const rendererRef = useRef<GameRenderer | null>(null);
  const physicsWorldRef = useRef<PhysicsWorld | null>(null);
  const playerCarRef = useRef<CarPhysics | null>(null);
  const botsRef = useRef<BotController[]>([]);
  const currentArenaRef = useRef<BuiltArena | null>(null);
  const matchManagerRef = useRef<MatchManager | null>(null);
  const isShowcaseOrbitRef = useRef(true);
  const showcaseAngleRef = useRef(0);
  const isDraggingShowcaseRef = useRef(false);
  const lastMouseXRef = useRef(0);

  // Initialize Game Engines & Three.js Canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const settingsManager = SettingsManager.getInstance();
    const soundManager = SoundManager.getInstance();
    const inputManager = InputManager.getInstance();
    const mpManager = MultiplayerManager.getInstance();

    const config = settingsManager.getConfig();
    const renderer = new GameRenderer(canvasRef.current, config);
    rendererRef.current = renderer;

    // 1. Initial Ball & Physics World
    const ball = new BallPhysics();
    renderer.scene.add(ball.mesh);
    const physicsWorld = new PhysicsWorld(ball);
    physicsWorldRef.current = physicsWorld;

    // Ball bounce sound hook
    const handleBallBounce = (strength: number) => {
      soundManager.playBallHit(strength);
    };

    // Car collision sound hook
    physicsWorld.onCarCollision = () => {
      soundManager.playCarCrash();
    };

    // Boost pad collected hook
    physicsWorld.onBoostCollected = (car, pad) => {
      soundManager.playBoostPickup(pad.isFull);
      if (rendererRef.current) {
        rendererRef.current.particleSystem.emitSparks(new THREE.Vector3(pad.x, 0.4, pad.z), 12);
      }
    };

    // 2. Build Default Classic Arena for Title showcase
    const arena = ArenaBuilder.buildArena('classic');
    renderer.scene.add(arena.group);
    currentArenaRef.current = arena;
    physicsWorld.boostPads = arena.boostPads;

    // 3. Build Player Car
    const playerMeshes = CarBuilder.buildCar(playerCustomization);
    renderer.scene.add(playerMeshes.root);
    const playerCar = new CarPhysics('player', playerCustomization.playerName, 'blue', playerMeshes);
    playerCar.reset(0, -35, 0);
    playerCarRef.current = playerCar;
    physicsWorld.addCar(playerCar);

    // Audio hooks for player car
    playerCar.onJump = (isDouble) => soundManager.playJump(isDouble);
    playerCar.onBoostChange = (boosting) => soundManager.updateBoost(boosting);
    playerCar.onCrash = () => soundManager.playCarCrash();
    playerCar.onBallHit = (str) => soundManager.playBallHit(str);

    // 4. Check URL room parameter for instant join
    const params = new URLSearchParams(window.location.search);
    const joinRoomCode = params.get('room');
    if (joinRoomCode) {
      mpManager.joinRoom(joinRoomCode, playerCustomization);
      setActiveModal('online');
    }

    // 5. Main Animation Loop
    let animFrameId = 0;
    let lastTime = performance.now();

    const gameLoop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const pCar = playerCarRef.current;
      const mm = matchManagerRef.current;

      // Check input hotkeys
      if (inputManager.consumeBallCamToggle()) {
        renderer.isBallCam = !renderer.isBallCam;
        setHudState(s => ({ ...s, isBallCam: renderer.isBallCam }));
      }
      if (inputManager.consumeReset()) {
        if (pCar) pCar.reset(0, pCar.state.team === 'blue' ? -35 : 35, pCar.state.team === 'blue' ? 0 : Math.PI);
      }
      if (inputManager.consumePause()) {
        setGameState(cur => cur === 'playing' ? 'paused' : (cur === 'paused' ? 'playing' : cur));
      }

      if (isShowcaseOrbitRef.current) {
        // TITLE / SHOWCASE CAMERA
        showcaseAngleRef.current += dt * 0.35;
        const radius = 10.5;
        const cx = Math.sin(showcaseAngleRef.current) * radius;
        const cz = Math.cos(showcaseAngleRef.current) * radius;
        renderer.camera.position.set(cx, 3.8, cz - 35);
        if (pCar) {
          renderer.camera.lookAt(pCar.state.position.x, 1.2, pCar.state.position.z);
        }
      } else {
        // ACTIVE GAMEPLAY TICK
        if (pCar) {
          // Poll inputs
          const inputs = inputManager.getInputs();

          // During kickoff countdown, lock vehicle throttle/jump
          if (mm && mm.phase === 'countdown') {
            inputs.throttle = 0;
            inputs.jump = false;
            inputs.jumpJustPressed = false;
            inputs.boost = false;
          }

          // Step player car
          pCar.update(dt, inputs, ball);

          // Modulate engine audio
          const speedFraction = pCar.state.velocity.length() / 30.0;
          soundManager.updateEngine(speedFraction, Math.abs(inputs.throttle) > 0.1);

          // Boost flame VFX
          if (pCar.state.isBoosting) {
            const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(pCar.state.quaternion);
            for (const nozzle of pCar.meshes.exhaustNozzles) {
              const nozzleWorldPos = new THREE.Vector3();
              nozzle.getWorldPosition(nozzleWorldPos);
              renderer.particleSystem.emitBoost(nozzleWorldPos, fwd, playerCustomization.boostColor, 2);
            }
          }
        }

        // Step AI Bots
        for (const bot of botsRef.current) {
          const botInputs = mm && mm.phase === 'countdown' ? { throttle: 0, steer: 0, jump: false, jumpJustPressed: false, boost: false, handbrake: false, airPitch: 0, airYaw: 0, airRoll: 0 } : bot.update(dt, ball);
          bot.car.update(dt, botInputs, ball);

          // Bot boost VFX
          if (bot.car.state.isBoosting) {
            const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(bot.car.state.quaternion);
            for (const nozzle of bot.car.meshes.exhaustNozzles) {
              const nozzleWorldPos = new THREE.Vector3();
              nozzle.getWorldPosition(nozzleWorldPos);
              renderer.particleSystem.emitBoost(nozzleWorldPos, fwd, '#ff5500', 1);
            }
          }
        }

        // Step Physics World
        const goalEvent = physicsWorld.update(dt, handleBallBounce);

        // Check Goal
        if (goalEvent && mm && mm.phase === 'playing') {
          const teamScored = goalEvent === 'orange_goal' ? 'blue' : 'orange'; // Orange goal struck = Blue scores
          const scorer = ball.lastHitPlayer || (teamScored === 'blue' ? 'Blue Team' : 'Orange Team');
          mm.registerGoal(teamScored, scorer, ball.lastHitSpeed);

          soundManager.playGoalExplosion();
          renderer.triggerCelebration(true);
          const goalCenter = new THREE.Vector3(0, 3, teamScored === 'blue' ? 65 : -65);
          renderer.particleSystem.emitGoalExplosion(goalCenter, teamScored === 'blue' ? '#0088ff' : '#ff5500', 150);
        }

        // Step Match Manager
        if (mm) {
          const { shouldResetPositions, matchEnded } = mm.update(dt);

          if (shouldResetPositions) {
            resetFieldPositions();
            renderer.triggerCelebration(false);
          }

          if (matchEnded) {
            setGameState('match_end');
            renderer.triggerCelebration(false);
          }

          // Sync state to React HUD
          if (pCar) {
            setHudState({
              blueScore: mm.blueScore,
              orangeScore: mm.orangeScore,
              timeFormatted: mm.formatTime(),
              isOvertime: mm.isOvertime,
              phase: mm.phase,
              countdownNumber: mm.countdownTimer <= 1.0 ? 'GO' : Math.ceil(mm.countdownTimer),
              boost: pCar.state.boost,
              isSupersonic: pCar.state.isSupersonic,
              isBallCam: renderer.isBallCam,
              fps: renderer.currentFps,
              showFps: config.showFps,
              lastGoalScorer: mm.lastGoalScorer,
              lastGoalTeam: mm.lastGoalTeam,
              lastGoalSpeed: mm.lastGoalSpeed,
            });
          }
        }

        // Update Camera
        renderer.updateCamera(dt, pCar, ball);
      }

      // Update Arena animations (e.g. boost pad lights)
      if (currentArenaRef.current) {
        currentArenaRef.current.update(dt);
      }

      // Render Three.js Scene
      renderer.render(dt);

      animFrameId = requestAnimationFrame(gameLoop);
    };

    animFrameId = requestAnimationFrame(gameLoop);

    // Window Resize Handler
    const handleResize = () => {
      renderer.resize(config.resolutionScale);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Helper: Reset Field Positions (after goal or kickoff)
  const resetFieldPositions = useCallback(() => {
    const mm = matchManagerRef.current;
    const pCar = playerCarRef.current;
    const pw = physicsWorldRef.current;
    if (!mm || !pCar || !pw) return;

    // Reset ball to center
    pw.ball.reset(0, 1.55, 0);

    const { blueSpawns, orangeSpawns } = mm.getKickoffPositions(mm.config.teamSize);

    // Place Player Car
    const isPlayerBlue = pCar.state.team === 'blue';
    const playerSpawn = isPlayerBlue ? blueSpawns[0] : orangeSpawns[0];
    if (playerSpawn) {
      pCar.reset(playerSpawn.x, playerSpawn.z, playerSpawn.angle);
    }

    // Place Bots
    let blueIdx = isPlayerBlue ? 1 : 0;
    let orangeIdx = isPlayerBlue ? 0 : 1;

    for (const bot of botsRef.current) {
      if (bot.car.state.team === 'blue') {
        const spawn = blueSpawns[blueIdx++] || blueSpawns[0];
        bot.car.reset(spawn.x, spawn.z, spawn.angle);
      } else {
        const spawn = orangeSpawns[orangeIdx++] || orangeSpawns[0];
        bot.car.reset(spawn.x, spawn.z, spawn.angle);
      }
    }
  }, []);

  // Handler: Start a Match
  const handleStartMatch = useCallback((config: MatchConfig) => {
    const renderer = rendererRef.current;
    const pw = physicsWorldRef.current;
    if (!renderer || !pw) return;

    // 1. Rebuild Arena if stadium changed
    if (!currentArenaRef.current || currentArenaRef.current.group.name !== 'Stadium_' + config.stadium) {
      if (currentArenaRef.current) {
        renderer.scene.remove(currentArenaRef.current.group);
      }
      const newArena = ArenaBuilder.buildArena(config.stadium);
      renderer.scene.add(newArena.group);
      currentArenaRef.current = newArena;
      pw.boostPads = newArena.boostPads;
    }

    // 2. Clear old bots
    for (const bot of botsRef.current) {
      renderer.scene.remove(bot.car.meshes.root);
      pw.removeCar(bot.car.state.id);
    }
    botsRef.current = [];

    // 3. Setup Player Car
    let pCar = playerCarRef.current;
    if (pCar) {
      renderer.scene.remove(pCar.meshes.root);
      pw.removeCar(pCar.state.id);
    }
    const pMeshes = CarBuilder.buildCar(config.playerCustomization);
    renderer.scene.add(pMeshes.root);
    pCar = new CarPhysics('player', config.playerCustomization.playerName, config.playerCustomization.team || 'blue', pMeshes);
    playerCarRef.current = pCar;
    pw.addCar(pCar);

    // Audio hooks for player car
    const soundManager = SoundManager.getInstance();
    pCar.onJump = (isDouble) => soundManager.playJump(isDouble);
    pCar.onBoostChange = (boosting) => soundManager.updateBoost(boosting);
    pCar.onCrash = () => soundManager.playCarCrash();
    pCar.onBallHit = (str) => soundManager.playBallHit(str);

    // 4. Spawn AI Bots (if offline mode)
    if (config.mode === 'offline') {
      const neededBlueBots = config.playerCustomization.team === 'blue' ? config.teamSize - 1 : config.teamSize;
      const neededOrangeBots = config.playerCustomization.team === 'orange' ? config.teamSize - 1 : config.teamSize;

      // Blue Bots
      for (let i = 0; i < neededBlueBots; i++) {
        const botCustom: CarCustomization = {
          body: i % 2 === 0 ? 'viper' : 'titan',
          primaryColor: '#0066ff',
          decalColor: '#ffffff',
          boostColor: '#00d2ff',
          wheel: 'sport',
          wheelColor: '#333333',
          finish: 'metallic',
          playerName: `Blue Bot ${i + 1}`,
          team: 'blue',
        };
        const botMeshes = CarBuilder.buildCar(botCustom);
        renderer.scene.add(botMeshes.root);
        const botCar = new CarPhysics(`bot_b_${i}`, botCustom.playerName, 'blue', botMeshes);
        pw.addCar(botCar);
        botsRef.current.push(new BotController(botCar, config.botDifficulty));
      }

      // Orange Bots
      for (let i = 0; i < neededOrangeBots; i++) {
        const botCustom: CarCustomization = {
          body: i % 2 === 0 ? 'apex' : 'viper',
          primaryColor: '#ff5500',
          decalColor: '#ffdd00',
          boostColor: '#ff9900',
          wheel: 'turbofan',
          wheelColor: '#222222',
          finish: 'metallic',
          playerName: `Orange Bot ${i + 1}`,
          team: 'orange',
        };
        const botMeshes = CarBuilder.buildCar(botCustom);
        renderer.scene.add(botMeshes.root);
        const botCar = new CarPhysics(`bot_o_${i}`, botCustom.playerName, 'orange', botMeshes);
        pw.addCar(botCar);
        botsRef.current.push(new BotController(botCar, config.botDifficulty));
      }
    }

    // 5. Initialize Match Manager
    const mm = new MatchManager(config);
    matchManagerRef.current = mm;
    setMatchManager(mm);

    mm.onCountdownTick = (count) => {
      soundManager.playCountdown(count === 'GO');
    };

    // Reset kickoff spawns
    resetFieldPositions();

    // Switch out of showcase orbit to active chase camera
    isShowcaseOrbitRef.current = false;
    renderer.triggerCelebration(false);
    setGameState('playing');
    setActiveModal('none');
  }, [resetFieldPositions]);

  // Handler: Start Online Match
  const handleStartOnlineMatch = useCallback((roomCode: string, isHost: boolean) => {
    handleStartMatch({
      mode: 'online',
      stadium: 'classic',
      teamSize: 2,
      durationMinutes: 5,
      botDifficulty: 'normal',
      playerCustomization,
    });
  }, [handleStartMatch, playerCustomization]);

  // Handler: Start Training Drill
  const handleStartTrainingDrill = useCallback((drill: TrainingDrill) => {
    handleStartMatch({
      mode: 'training',
      stadium: 'classic',
      teamSize: 1,
      durationMinutes: 99,
      botDifficulty: 'easy',
      trainingDrill: drill,
      playerCustomization: { ...playerCustomization, team: 'blue' },
    });

    // Custom training ball positioning
    const pw = physicsWorldRef.current;
    const pCar = playerCarRef.current;
    if (pw && pCar) {
      if (drill === 'striker') {
        pCar.reset(0, -25, 0);
        pw.ball.reset(0, 1.55, 10);
        pw.ball.velocity.set(0, 0, 8); // rolling toward orange goal
      } else if (drill === 'goalie') {
        pCar.reset(0, -60, 0); // inside goal mouth
        pw.ball.reset(0, 4.0, 15);
        pw.ball.velocity.set(0, 2, -32); // fast shot incoming!
      } else if (drill === 'aerial') {
        pCar.reset(0, -35, 0);
        pw.ball.reset(0, 1.55, 0);
        pw.ball.velocity.set(0, 28, 5); // high lofted pop!
      }
    }
  }, [handleStartMatch, playerCustomization]);

  // Handler: Return to Main Menu Title
  const handleQuitToMenu = useCallback(() => {
    isShowcaseOrbitRef.current = true;
    setGameState('title');
    setActiveModal('none');
    SoundManager.getInstance().updateBoost(false);
    SoundManager.getInstance().updateEngine(0, false);
    
    // Reset player car to showcase position
    if (playerCarRef.current) {
      playerCarRef.current.reset(0, -35, 0);
    }
    if (physicsWorldRef.current) {
      physicsWorldRef.current.ball.reset(0, 1.55, 0);
    }
  }, []);

  // Update Car customization
  const handleUpdateCustomization = (next: CarCustomization) => {
    setPlayerCustomization(next);
    saveCar(next);

    const renderer = rendererRef.current;
    const pw = physicsWorldRef.current;
    if (renderer && pw && playerCarRef.current) {
      renderer.scene.remove(playerCarRef.current.meshes.root);
      pw.removeCar(playerCarRef.current.state.id);

      const pMeshes = CarBuilder.buildCar(next);
      renderer.scene.add(pMeshes.root);
      const newCar = new CarPhysics('player', next.playerName, next.team || 'blue', pMeshes);
      newCar.reset(0, -35, 0);
      playerCarRef.current = newCar;
      pw.addCar(newCar);
    }
  };

  // Mouse drag handling for rotating the car during garage/title
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingShowcaseRef.current = true;
    lastMouseXRef.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingShowcaseRef.current) {
      const deltaX = e.clientX - lastMouseXRef.current;
      lastMouseXRef.current = e.clientX;
      showcaseAngleRef.current -= deltaX * 0.008;
    }
  };

  const handleMouseUp = () => {
    isDraggingShowcaseRef.current = false;
  };

  return (
    <div 
      className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={(e) => {
        if (gameState === 'title' || activeModal === 'garage') {
          isDraggingShowcaseRef.current = true;
          lastMouseXRef.current = e.touches[0].clientX;
        }
      }}
      onTouchMove={(e) => {
        if (isDraggingShowcaseRef.current) {
          const deltaX = e.touches[0].clientX - lastMouseXRef.current;
          lastMouseXRef.current = e.touches[0].clientX;
          showcaseAngleRef.current -= deltaX * 0.01;
        }
      }}
      onTouchEnd={() => {
        isDraggingShowcaseRef.current = false;
      }}
    >
      {/* 3D WebGL Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block touch-none z-0"
      />

      {/* Main Title Screen */}
      {gameState === 'title' && activeModal === 'none' && (
        <TitleScreen
          onStartMatch={handleStartMatch}
          onOpenGarage={() => setActiveModal('garage')}
          onOpenSettings={() => setActiveModal('settings')}
          onOpenControls={() => setActiveModal('controls')}
          onOpenOnline={() => setActiveModal('online')}
          onOpenTraining={() => setActiveModal('training')}
          playerCar={playerCustomization}
        />
      )}

      {/* In-Game Regulation HUD */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <HUD
          blueScore={hudState.blueScore}
          orangeScore={hudState.orangeScore}
          timeFormatted={hudState.timeFormatted}
          isOvertime={hudState.isOvertime}
          phase={hudState.phase}
          countdownNumber={hudState.countdownNumber}
          boost={hudState.boost}
          isSupersonic={hudState.isSupersonic}
          isBallCam={hudState.isBallCam}
          onToggleBallCam={() => {
            if (rendererRef.current) {
              rendererRef.current.isBallCam = !rendererRef.current.isBallCam;
              setHudState(s => ({ ...s, isBallCam: rendererRef.current!.isBallCam }));
            }
          }}
          onPause={() => setGameState('paused')}
          fps={hudState.fps}
          showFps={hudState.showFps}
          lastGoalScorer={hudState.lastGoalScorer}
          lastGoalTeam={hudState.lastGoalTeam}
          lastGoalSpeed={hudState.lastGoalSpeed}
          isTouchDevice={InputManager.getInstance().isTouchDevice}
          onTouchInput={(inputs) => InputManager.getInstance().setTouchInput(inputs)}
        />
      )}

      {/* Garage Customizer Overlay */}
      {activeModal === 'garage' && (
        <GarageMenu
          customization={playerCustomization}
          onUpdateCustomization={handleUpdateCustomization}
          onClose={() => setActiveModal('none')}
        />
      )}

      {/* Settings Modal */}
      {activeModal === 'settings' && (
        <SettingsModal
          onClose={() => setActiveModal('none')}
          onConfigChange={(newConfig) => {
            if (rendererRef.current) {
              rendererRef.current.setResolutionScale(newConfig.resolutionScale);
              rendererRef.current.applyShadowSettings(newConfig.shadows);
            }
          }}
        />
      )}

      {/* Controls Guide Modal */}
      {activeModal === 'controls' && (
        <ControlsGuideModal
          onClose={() => setActiveModal('none')}
        />
      )}

      {/* Online Multiplayer Lobby Modal */}
      {activeModal === 'online' && (
        <OnlineLobbyModal
          customization={playerCustomization}
          onStartOnlineMatch={handleStartOnlineMatch}
          onClose={() => setActiveModal('none')}
        />
      )}

      {/* Training Drills Modal */}
      {activeModal === 'training' && (
        <TrainingMenu
          onSelectDrill={handleStartTrainingDrill}
          onClose={() => setActiveModal('none')}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={() => setGameState('playing')}
          onResetCar={() => {
            if (playerCarRef.current) {
              playerCarRef.current.reset(0, playerCarRef.current.state.team === 'blue' ? -35 : 35, playerCarRef.current.state.team === 'blue' ? 0 : Math.PI);
            }
            setGameState('playing');
          }}
          onOpenSettings={() => setActiveModal('settings')}
          onQuitToMenu={handleQuitToMenu}
        />
      )}

      {/* Match End Modal */}
      {gameState === 'match_end' && matchManagerRef.current && (
        <MatchEndModal
          blueScore={matchManagerRef.current.blueScore}
          orangeScore={matchManagerRef.current.orangeScore}
          playerTeam={playerCustomization.team || 'blue'}
          stats={matchManagerRef.current.playerStats}
          onRematch={() => {
            if (matchManagerRef.current) {
              handleStartMatch(matchManagerRef.current.config);
            }
          }}
          onReturnToLobby={handleQuitToMenu}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <GameApp />
    </LanguageProvider>
  );
}
