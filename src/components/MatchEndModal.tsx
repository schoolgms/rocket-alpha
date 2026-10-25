import React, { useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { MatchStats } from '../game/state/MatchManager';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Target, Zap, ShieldCheck } from 'lucide-react';

interface MatchEndModalProps {
  blueScore: number;
  orangeScore: number;
  playerTeam: 'blue' | 'orange';
  stats: MatchStats;
  onRematch: () => void;
  onReturnToLobby: () => void;
}

export function MatchEndModal({
  blueScore,
  orangeScore,
  playerTeam,
  stats,
  onRematch,
  onReturnToLobby
}: MatchEndModalProps) {
  const { t } = useLanguage();

  const isWin = (playerTeam === 'blue' && blueScore > orangeScore) || (playerTeam === 'orange' && orangeScore > blueScore);
  const isDraw = blueScore === orangeScore;

  useEffect(() => {
    if (isWin) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Ignore
      }
    }
  }, [isWin]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md bg-slate-950 border border-slate-700/80 rounded-2xl shadow-2xl p-6 flex flex-col items-center">
        {/* Banner */}
        <div className="flex flex-col items-center mb-5">
          <div className={`p-3 rounded-2xl mb-2 ${
            isWin ? 'bg-amber-500/20 text-amber-400 border border-amber-400/40' : (isDraw ? 'bg-slate-800 text-slate-300' : 'bg-rose-500/20 text-rose-400 border border-rose-400/40')
          }`}>
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className={`text-4xl md:text-5xl font-black italic tracking-wider uppercase ${
            isWin ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500' : (isDraw ? 'text-slate-300' : 'text-rose-400')
          }`} style={{ fontFamily: 'Teko, sans-serif' }}>
            {isWin ? t.victory : (isDraw ? t.draw : t.defeat)}
          </h2>
        </div>

        {/* Final Scoreboard */}
        <div className="flex items-center justify-center gap-6 py-3 px-6 bg-slate-900 border border-slate-800 rounded-2xl w-full mb-6 shadow-inner">
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">{t.blueTeam}</span>
            <span className="text-4xl font-black text-white tabular-nums" style={{ fontFamily: 'Teko, sans-serif' }}>{blueScore}</span>
          </div>
          <span className="text-2xl font-bold text-slate-600">:</span>
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">{t.orangeTeam}</span>
            <span className="text-4xl font-black text-white tabular-nums" style={{ fontFamily: 'Teko, sans-serif' }}>{orangeScore}</span>
          </div>
        </div>

        {/* Player Stats */}
        <div className="w-full mb-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            {t.matchStats}
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 font-medium">{t.goals}</span>
              <span className="text-cyan-400 font-bold font-mono text-sm">{stats.goals}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 font-medium">{t.shots}</span>
              <span className="text-cyan-400 font-bold font-mono text-sm">{stats.shots}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 font-medium">{t.saves}</span>
              <span className="text-cyan-400 font-bold font-mono text-sm">{stats.saves}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 font-medium">{t.boostUsed}</span>
              <span className="text-cyan-400 font-bold font-mono text-sm">{Math.round(stats.boostUsed)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          <button
            onClick={onRematch}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-base uppercase tracking-wider rounded-xl shadow-lg active:scale-95 transition-transform"
            style={{ fontFamily: 'Rajdhani, sans-serif' }}
          >
            <RotateCcw className="w-5 h-5" />
            {t.rematch}
          </button>

          <button
            onClick={onReturnToLobby}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-sm uppercase tracking-wider rounded-xl border border-slate-700 active:scale-95 transition-transform"
          >
            <Home className="w-4 h-4 text-cyan-400" />
            {t.mainMenu}
          </button>
        </div>
      </div>
    </div>
  );
}
