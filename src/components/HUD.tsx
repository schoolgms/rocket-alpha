import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { MatchPhase } from '../game/state/MatchManager';
import { CarInputs } from '../game/physics/PhysicsTypes';
import { 
  Pause, 
  Camera, 
  Flame, 
  Zap, 
  RotateCw, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface HUDProps {
  blueScore: number;
  orangeScore: number;
  timeFormatted: string;
  isOvertime: boolean;
  phase: MatchPhase;
  countdownNumber: number | 'GO';
  boost: number;
  isSupersonic: boolean;
  isBallCam: boolean;
  onToggleBallCam: () => void;
  onPause: () => void;
  fps: number;
  showFps: boolean;
  lastGoalScorer: string;
  lastGoalTeam: 'blue' | 'orange';
  lastGoalSpeed: number;
  isTouchDevice: boolean;
  onTouchInput: (inputs: Partial<CarInputs>) => void;
}

export function HUD({
  blueScore,
  orangeScore,
  timeFormatted,
  isOvertime,
  phase,
  countdownNumber,
  boost,
  isSupersonic,
  isBallCam,
  onToggleBallCam,
  onPause,
  fps,
  showFps,
  lastGoalScorer,
  lastGoalTeam,
  lastGoalSpeed,
  isTouchDevice,
  onTouchInput,
}: HUDProps) {
  const { t } = useLanguage();
  const boostPercent = Math.max(0, Math.min(100, Math.round(boost)));

  return (
    <div className="absolute inset-0 z-10 pointer-events-none select-none flex flex-col justify-between p-3 md:p-6 overflow-hidden">
      {/* 1. TOP BAR: Pause / FPS readout & SCOREBOARD */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Pause & Telemetry */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onPause}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 shadow-lg backdrop-blur-md active:scale-95 transition-transform"
            title={t.paused}
          >
            <Pause className="w-5 h-5 fill-current" />
          </button>

          {showFps && (
            <div className="px-2.5 py-1 rounded-lg bg-black/60 border border-slate-800 text-[11px] font-mono text-emerald-400 font-bold tabular-nums">
              {fps} FPS
            </div>
          )}
        </div>

        {/* Center: Regulation Scoreboard */}
        <div className="flex flex-col items-center">
          <div className="flex items-center bg-slate-950/90 border border-slate-700/80 rounded-2xl shadow-[0_4px_25px_rgba(0,0,0,0.7)] backdrop-blur-md overflow-hidden">
            {/* Blue Score */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-700 to-blue-600 text-white min-w-[70px] justify-center shadow-inner">
              <span className="text-xs font-black tracking-widest uppercase hidden sm:inline">BLUE</span>
              <span className="text-2xl md:text-3xl font-extrabold tabular-nums" style={{ fontFamily: 'Teko, sans-serif' }}>
                {blueScore}
              </span>
            </div>

            {/* Match Timer */}
            <div className="px-4 py-1.5 flex flex-col items-center justify-center min-w-[75px]">
              <span className={`text-xl md:text-2xl font-black tabular-nums tracking-wider ${isOvertime ? 'text-amber-400 animate-pulse' : 'text-slate-100'}`} style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                {timeFormatted}
              </span>
              {isOvertime && (
                <span className="text-[9px] font-bold tracking-widest text-amber-400 uppercase -mt-1">
                  {t.overtime}
                </span>
              )}
            </div>

            {/* Orange Score */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-l from-orange-600 to-amber-600 text-white min-w-[70px] justify-center shadow-inner">
              <span className="text-2xl md:text-3xl font-extrabold tabular-nums" style={{ fontFamily: 'Teko, sans-serif' }}>
                {orangeScore}
              </span>
              <span className="text-xs font-black tracking-widest uppercase hidden sm:inline">ORANGE</span>
            </div>
          </div>
        </div>

        {/* Right: Camera Mode Pill */}
        <div className="pointer-events-auto">
          <button
            onClick={onToggleBallCam}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border shadow-lg backdrop-blur-md transition-all active:scale-95 ${
              isBallCam 
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                : 'bg-slate-900/80 border-slate-700 text-slate-300'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span className="text-xs font-bold tracking-wider uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              {isBallCam ? t.ballCam : t.carCam}
            </span>
          </button>
        </div>
      </div>

      {/* 2. CENTER OVERLAYS: Kickoff countdown & Goal Celebrations */}
      <div className="flex flex-col items-center justify-center my-auto">
        {/* Kickoff countdown */}
        {phase === 'countdown' && (
          <div className="flex flex-col items-center animate-in zoom-in-75 duration-200">
            <span className="text-6xl md:text-8xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-200 to-cyan-500 drop-shadow-[0_0_35px_rgba(6,182,212,0.8)]" style={{ fontFamily: 'Teko, sans-serif' }}>
              {countdownNumber}
            </span>
            <span className="text-sm font-bold tracking-widest text-cyan-300 uppercase mt-[-10px]">
              {countdownNumber === 'GO' ? t.go : t.ready}
            </span>
          </div>
        )}

        {/* Goal celebration explosion banner */}
        {phase === 'celebration' && (
          <div className="flex flex-col items-center text-center animate-in zoom-in-50 duration-300 bg-black/75 px-8 py-5 rounded-3xl border-2 border-amber-400/80 shadow-[0_0_50px_rgba(251,191,36,0.6)] backdrop-blur-md max-w-lg">
            <div className="text-5xl md:text-7xl font-extrabold italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-100 to-orange-500" style={{ fontFamily: 'Teko, sans-serif' }}>
              {t.goal}
            </div>
            <div className="text-lg md:text-xl font-black uppercase text-white tracking-wide mt-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              {t.scoredBy}: <span className={lastGoalTeam === 'blue' ? 'text-blue-400' : 'text-orange-400'}>{lastGoalScorer}</span>
            </div>
            <div className="text-xs font-semibold tracking-widest text-slate-300 uppercase mt-1">
              {t.speed}: <span className="text-amber-300 font-mono font-bold text-sm">{lastGoalSpeed} {t.kmh}</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. BOTTOM CLUSTER: Boost Gauge (Right) & Mobile Touch Controls */}
      <div className="flex items-end justify-between w-full">
        {/* Bottom Left: Touch Steering or Help */}
        {isTouchDevice ? (
          <div className="flex gap-2 pointer-events-auto">
            {/* Steering Left/Right Buttons */}
            <button
              onTouchStart={() => onTouchInput({ steer: -1 })}
              onTouchEnd={() => onTouchInput({ steer: 0 })}
              className="w-14 h-14 rounded-2xl bg-slate-900/80 border border-slate-700 flex items-center justify-center text-white active:bg-cyan-600 transition-colors"
            >
              <ArrowLeft className="w-7 h-7" />
            </button>
            <button
              onTouchStart={() => onTouchInput({ steer: 1 })}
              onTouchEnd={() => onTouchInput({ steer: 0 })}
              className="w-14 h-14 rounded-2xl bg-slate-900/80 border border-slate-700 flex items-center justify-center text-white active:bg-cyan-600 transition-colors"
            >
              <ArrowRight className="w-7 h-7" />
            </button>
            <button
              onTouchStart={() => onTouchInput({ throttle: -1 })}
              onTouchEnd={() => onTouchInput({ throttle: 0 })}
              className="w-14 h-14 rounded-2xl bg-slate-900/80 border border-slate-700 flex items-center justify-center text-rose-400 active:bg-rose-600 transition-colors"
              title="Reverse/Brake"
            >
              <ArrowDown className="w-6 h-6" />
            </button>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 font-medium bg-black/40 px-3 py-1.5 rounded-lg border border-slate-800 backdrop-blur-sm">
            <span>R: {t.resetCar}</span>
            <span>·</span>
            <span>Esc: {t.paused}</span>
          </div>
        )}

        {/* Center Mobile Drive Gas Button */}
        {isTouchDevice && (
          <div className="flex gap-2 pointer-events-auto">
            <button
              onTouchStart={() => onTouchInput({ throttle: 1 })}
              onTouchEnd={() => onTouchInput({ throttle: 0 })}
              className="w-16 h-16 rounded-2xl bg-emerald-600/90 border border-emerald-400 flex flex-col items-center justify-center text-white active:bg-emerald-500 shadow-lg font-bold"
            >
              <ArrowUp className="w-7 h-7" />
              <span className="text-[9px] uppercase">Gas</span>
            </button>
          </div>
        )}

        {/* Bottom Right: Touch Action Buttons + BOOST METER */}
        <div className="flex items-end gap-3">
          {/* Mobile Action Buttons (Jump, Boost, Drift) */}
          {isTouchDevice && (
            <div className="flex flex-col gap-2 pointer-events-auto">
              <button
                onTouchStart={() => onTouchInput({ jumpJustPressed: true, jump: true })}
                onTouchEnd={() => onTouchInput({ jump: false })}
                className="w-14 h-14 rounded-2xl bg-blue-600/90 border border-blue-400 flex items-center justify-center text-white active:bg-blue-500 shadow-lg font-black text-xs uppercase"
              >
                Jump
              </button>
              <button
                onTouchStart={() => onTouchInput({ handbrake: true })}
                onTouchEnd={() => onTouchInput({ handbrake: false })}
                className="w-14 h-14 rounded-2xl bg-slate-800/90 border border-slate-600 flex items-center justify-center text-amber-300 active:bg-amber-600 text-xs font-bold"
              >
                Drift
              </button>
            </div>
          )}

          {/* BOOST METER CIRCLE */}
          <div 
            onTouchStart={() => isTouchDevice && onTouchInput({ boost: true })}
            onTouchEnd={() => isTouchDevice && onTouchInput({ boost: false })}
            className={`relative flex items-center justify-center w-24 h-24 md:w-28 md:h-28 rounded-full bg-slate-950/90 border-2 ${
              isSupersonic ? 'border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.8)] animate-pulse' : 'border-slate-700 shadow-2xl'
            } backdrop-blur-md select-none ${isTouchDevice ? 'pointer-events-auto active:scale-95' : ''}`}
          >
            {/* SVG Progress Ring */}
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="40%"
                className="stroke-slate-800"
                strokeWidth="7"
                fill="transparent"
              />
              <circle
                cx="50%"
                cy="50%"
                r="40%"
                stroke={isSupersonic ? '#fbbf24' : '#00e5ff'}
                strokeWidth="7"
                strokeDasharray="251"
                strokeDashoffset={251 - (251 * boostPercent) / 100}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-75"
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl md:text-4xl font-extrabold tabular-nums tracking-tighter text-white" style={{ fontFamily: 'Teko, sans-serif' }}>
                {boostPercent}
              </span>
              <span className={`text-[10px] font-black tracking-widest uppercase -mt-2 ${isSupersonic ? 'text-amber-400' : 'text-cyan-400'}`}>
                {isSupersonic ? 'SUPERSONIC' : t.boost}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
