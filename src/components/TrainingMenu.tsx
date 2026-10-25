import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { TrainingDrill } from '../game/state/MatchManager';
import { X, Target, Shield, Rocket, ChevronRight } from 'lucide-react';

interface TrainingMenuProps {
  onSelectDrill: (drill: TrainingDrill) => void;
  onClose: () => void;
}

export function TrainingMenu({ onSelectDrill, onClose }: TrainingMenuProps) {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg bg-slate-950 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <Target className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold tracking-wider text-white uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              {t.trainingSelect}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drills List */}
        <div className="p-6 space-y-3">
          {/* Drill 1: Striker */}
          <button
            onClick={() => onSelectDrill('striker')}
            className="w-full group p-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-400/60 flex items-center justify-between transition-all active:scale-98"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="text-base font-bold text-white uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  {t.trainingStriker}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {t.trainingStrikerDesc}
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 group-hover:text-amber-400 transition-all" />
          </button>

          {/* Drill 2: Goalie */}
          <button
            onClick={() => onSelectDrill('goalie')}
            className="w-full group p-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-blue-400/60 flex items-center justify-between transition-all active:scale-98"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="text-base font-bold text-white uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  {t.trainingGoalie}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {t.trainingGoalieDesc}
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 group-hover:text-blue-400 transition-all" />
          </button>

          {/* Drill 3: Aerial */}
          <button
            onClick={() => onSelectDrill('aerial')}
            className="w-full group p-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-400/60 flex items-center justify-between transition-all active:scale-98"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-xl group-hover:scale-110 transition-transform">
                <Rocket className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="text-base font-bold text-white uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  {t.trainingAerial}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {t.trainingAerialDesc}
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 group-hover:text-cyan-400 transition-all" />
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl active:scale-95 transition-transform"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
