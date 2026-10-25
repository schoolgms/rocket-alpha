import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { InputManager } from '../game/input/InputManager';
import { X, Keyboard, Gamepad, Smartphone, CheckCircle2, AlertCircle } from 'lucide-react';

interface ControlsGuideModalProps {
  onClose: () => void;
}

export function ControlsGuideModal({ onClose }: ControlsGuideModalProps) {
  const { t } = useLanguage();
  const inputManager = InputManager.getInstance();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-xl bg-slate-950 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <Gamepad className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold tracking-wider text-white uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              {t.controlsTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Controller status indicator */}
          <div className={`p-3 rounded-xl border flex items-center gap-3 ${
            inputManager.gamepadConnected ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}>
            {inputManager.gamepadConnected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-slate-500 flex-shrink-0" />
            )}
            <div className="text-xs font-semibold">
              <div className="text-white font-bold">{inputManager.gamepadConnected ? t.gamepadDetected : t.noGamepad}</div>
              {inputManager.gamepadConnected && <div className="text-[11px] text-emerald-400 font-mono mt-0.5">{inputManager.gamepadName}</div>}
            </div>
          </div>

          {/* 1. KEYBOARD SCHEME */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Keyboard className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">
                Keyboard & Mouse
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { keys: ['W', '↑'], action: t.accelerate },
                { keys: ['S', '↓'], action: t.reverseBrake },
                { keys: ['A', 'D', '←', '→'], action: t.steer },
                { keys: ['Space'], action: t.jumpDodge },
                { keys: ['Shift'], action: t.rocketBoost },
                { keys: ['Ctrl', 'X'], action: t.handbrake },
                { keys: ['Q', 'E'], action: t.airRoll },
                { keys: ['C'], action: t.toggleBallCam },
                { keys: ['R'], action: t.resetCar },
                { keys: ['Esc'], action: t.paused },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="flex gap-1">
                    {item.keys.map((k, i) => (
                      <kbd key={i} className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-[11px] font-bold">
                        {k}
                      </kbd>
                    ))}
                  </div>
                  <span className="text-slate-300 font-medium text-[11px]">{item.action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. GAMEPAD SCHEME */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Gamepad className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">
                Gamepad / Controller
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { btn: 'Left Stick', action: `${t.steer} & Aerial Pitch` },
                { btn: 'RT (Right Trigger)', action: t.accelerate },
                { btn: 'LT (Left Trigger)', action: t.reverseBrake },
                { btn: 'Button A (Cross)', action: t.jumpDodge },
                { btn: 'Button B (Circle) / RB', action: t.rocketBoost },
                { btn: 'Button X (Square)', action: t.handbrake },
                { btn: 'Button Y (Triangle)', action: t.toggleBallCam },
                { btn: 'LB (Left Bumper)', action: t.airRoll },
                { btn: 'Start / Menu', action: t.paused },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 font-mono text-[11px] font-bold">
                    {item.btn}
                  </span>
                  <span className="text-slate-300 font-medium text-[11px]">{item.action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. TOUCH SCREEN SCHEME */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-1.5">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">
                Touch Controls
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {t.touchControlsHint}. Touch the steering arrows on the left, accelerator button in the center, and tap the Jump button or hold the Boost ring on the right.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm tracking-wider uppercase rounded-xl border border-slate-700 active:scale-95 transition-transform"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
