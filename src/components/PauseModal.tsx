import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Play, RotateCcw, Settings, Home } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onResetCar: () => void;
  onOpenSettings: () => void;
  onQuitToMenu: () => void;
}

export function PauseModal({
  onResume,
  onResetCar,
  onOpenSettings,
  onQuitToMenu
}: PauseModalProps) {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-sm bg-slate-950 border border-slate-700/80 rounded-2xl shadow-2xl p-6 flex flex-col items-center">
        <h2 className="text-3xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-200 uppercase mb-6 italic" style={{ fontFamily: 'Teko, sans-serif' }}>
          {t.paused}
        </h2>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-base uppercase tracking-wider rounded-xl shadow-lg active:scale-95 transition-transform"
            style={{ fontFamily: 'Rajdhani, sans-serif' }}
          >
            <Play className="w-5 h-5 fill-current" />
            {t.resume}
          </button>

          <button
            onClick={onResetCar}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-sm uppercase tracking-wider rounded-xl border border-slate-700 active:scale-95 transition-transform"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            {t.resetCar}
          </button>

          <button
            onClick={onOpenSettings}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-sm uppercase tracking-wider rounded-xl border border-slate-700 active:scale-95 transition-transform"
          >
            <Settings className="w-4 h-4 text-cyan-400" />
            {t.settings}
          </button>

          <button
            onClick={onQuitToMenu}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-bold text-sm uppercase tracking-wider rounded-xl border border-rose-800/60 active:scale-95 transition-transform mt-2"
          >
            <Home className="w-4 h-4 text-rose-400" />
            {t.mainMenu}
          </button>
        </div>
      </div>
    </div>
  );
}
