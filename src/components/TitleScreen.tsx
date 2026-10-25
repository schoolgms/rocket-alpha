import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { SupportedLanguage } from '../i18n/translations';
import { StadiumType } from '../game/arena/ArenaTypes';
import { BotDifficulty } from '../game/ai/BotController';
import { MatchConfig } from '../game/state/MatchManager';
import { CarCustomization } from '../game/garage/GarageTypes';
import { 
  Play, 
  Gamepad2, 
  Sparkles, 
  Globe, 
  Wrench, 
  Settings as SettingsIcon, 
  BookOpen, 
  Flame, 
  Shield, 
  Trophy,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

interface TitleScreenProps {
  onStartMatch: (config: MatchConfig) => void;
  onOpenGarage: () => void;
  onOpenSettings: () => void;
  onOpenControls: () => void;
  onOpenOnline: () => void;
  onOpenTraining: () => void;
  playerCar: CarCustomization;
}

export function TitleScreen({
  onStartMatch,
  onOpenGarage,
  onOpenSettings,
  onOpenControls,
  onOpenOnline,
  onOpenTraining,
  playerCar
}: TitleScreenProps) {
  const { t, language, setLanguage } = useLanguage();
  const [showMatchSetup, setShowMatchSetup] = useState(false);

  // Match setup form state
  const [teamSize, setTeamSize] = useState<1 | 2 | 3>(2);
  const [stadium, setStadium] = useState<StadiumType>('classic');
  const [difficulty, setDifficulty] = useState<BotDifficulty>('normal');
  const [duration, setDuration] = useState<number>(3);
  const [selectedTeam, setSelectedTeam] = useState<'blue' | 'orange'>('blue');

  const handleLaunchOffline = () => {
    onStartMatch({
      mode: 'offline',
      stadium,
      teamSize,
      durationMinutes: duration,
      botDifficulty: difficulty,
      playerCustomization: { ...playerCar, team: selectedTeam },
    });
  };

  const handleLaunchFreePlay = () => {
    onStartMatch({
      mode: 'freeplay',
      stadium,
      teamSize: 1,
      durationMinutes: 99,
      botDifficulty: 'easy',
      playerCustomization: { ...playerCar, team: 'blue' },
    });
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 md:p-8 pointer-events-none select-none bg-gradient-to-t from-black/80 via-black/30 to-black/70">
      {/* Top Bar: Title lockup & Language selector */}
      <div className="flex items-start justify-between w-full pointer-events-auto">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Flame className="w-6 h-6 animate-pulse" />
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-amber-400 italic" style={{ fontFamily: 'Teko, sans-serif' }}>
              {t.gameTitle}
            </h1>
          </div>
          <p className="text-xs md:text-sm font-semibold tracking-widest text-slate-400 uppercase mt-0.5" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            {t.gameSubtitle}
          </p>
        </div>

        {/* Language selector & Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenControls}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold tracking-wider uppercase text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 rounded-lg backdrop-blur-md transition-all shadow-lg active:scale-95"
            title={t.controlsGuide}
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">{t.controlsGuide}</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold tracking-wider uppercase text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 rounded-lg backdrop-blur-md transition-all shadow-lg active:scale-95"
            title={t.settings}
          >
            <SettingsIcon className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">{t.settings}</span>
          </button>

          <div className="relative group">
            <div className="flex items-center gap-1 px-3 py-2 text-xs font-bold uppercase text-slate-300 bg-slate-900/80 border border-slate-700/60 rounded-lg backdrop-blur-md">
              <Globe className="w-4 h-4 text-sky-400" />
              <span>{language.toUpperCase()}</span>
            </div>
            <div className="absolute right-0 mt-1 hidden group-hover:flex flex-col bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden min-w-[120px] z-50">
              {[
                { code: 'es', label: 'Español' },
                { code: 'en', label: 'English' },
                { code: 'gl', label: 'Galego' },
                { code: 'pt', label: 'Português' },
                { code: 'fr', label: 'Français' },
                { code: 'de', label: 'Deutsch' },
                { code: 'it', label: 'Italiano' },
              ].map(item => (
                <button
                  key={item.code}
                  onClick={() => setLanguage(item.code as SupportedLanguage)}
                  className={`px-3 py-1.5 text-xs text-left font-medium hover:bg-cyan-500/20 hover:text-cyan-400 transition-colors ${language === item.code ? 'text-cyan-400 font-bold bg-cyan-950/40' : 'text-slate-300'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Menu Center / Left Navigation */}
      <div className="my-auto max-w-md w-full pointer-events-auto">
        {!showMatchSetup ? (
          <div className="flex flex-col gap-2.5">
            {/* Play Offline Match */}
            <button
              onClick={() => setShowMatchSetup(true)}
              className="group relative flex items-center justify-between px-6 py-4 bg-gradient-to-r from-cyan-600/90 to-blue-700/90 hover:from-cyan-500 hover:to-blue-600 border border-cyan-400/50 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all duration-200 active:scale-98"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-black/30 rounded-lg text-cyan-300 group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 fill-current" />
                </div>
                <div className="text-left">
                  <div className="text-xl font-bold tracking-wide text-white uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    {t.playOffline}
                  </div>
                  <div className="text-xs text-cyan-200/80 font-medium">1v1, 2v2, 3v3 vs Bots</div>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-cyan-300 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Free Play */}
            <button
              onClick={handleLaunchFreePlay}
              className="group flex items-center justify-between px-6 py-3.5 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-xl transition-all duration-200 active:scale-98 backdrop-blur-md"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-slate-800 rounded-lg text-emerald-400 group-hover:scale-110 transition-transform">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-lg font-bold tracking-wide text-white uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    {t.freePlay}
                  </div>
                  <div className="text-xs text-slate-400">Practice solo, unlimited boost</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Training Modes */}
            <button
              onClick={onOpenTraining}
              className="group flex items-center justify-between px-6 py-3.5 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-xl transition-all duration-200 active:scale-98 backdrop-blur-md"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-slate-800 rounded-lg text-amber-400 group-hover:scale-110 transition-transform">
                  <Trophy className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-lg font-bold tracking-wide text-white uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    {t.training}
                  </div>
                  <div className="text-xs text-slate-400">Striker, Goalie, Aerial drills</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Online Multiplayer */}
            <button
              onClick={onOpenOnline}
              className="group flex items-center justify-between px-6 py-3.5 bg-slate-900/80 hover:bg-slate-800/90 border border-purple-500/40 hover:border-purple-400 rounded-xl transition-all duration-200 active:scale-98 backdrop-blur-md"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-purple-950/60 rounded-lg text-purple-400 group-hover:scale-110 transition-transform">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-lg font-bold tracking-wide text-white uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    {t.onlineMatch}
                  </div>
                  <div className="text-xs text-purple-300/80">Rooms, peer sync & lobbies</div>
                </div>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 rounded border border-purple-500/40">
                Live
              </span>
            </button>

            {/* Garage */}
            <button
              onClick={onOpenGarage}
              className="group flex items-center justify-between px-6 py-3.5 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-xl transition-all duration-200 active:scale-98 backdrop-blur-md"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-slate-800 rounded-lg text-cyan-400 group-hover:scale-110 transition-transform">
                  <Wrench className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-lg font-bold tracking-wide text-white uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    {t.garage}
                  </div>
                  <div className="text-xs text-slate-400">Cars, colors, decals & trails</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ) : (
          /* Match Setup Configuration Submenu */
          <div className="bg-slate-900/95 border border-cyan-500/40 rounded-2xl p-5 shadow-2xl backdrop-blur-xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <h2 className="text-xl font-bold tracking-wider text-cyan-300 uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                {t.selectMode}
              </h2>
              <button
                onClick={() => setShowMatchSetup(false)}
                className="text-xs font-semibold text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded"
              >
                ← {t.cancel}
              </button>
            </div>

            {/* Team Size */}
            <div className="mb-3">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                {t.teamSize}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([1, 2, 3] as const).map(size => (
                  <button
                    key={size}
                    onClick={() => setTeamSize(size)}
                    className={`py-2 text-sm font-bold rounded-lg border transition-all ${teamSize === size ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg' : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                  >
                    {size}v{size}
                  </button>
                ))}
              </div>
            </div>

            {/* Stadium Selection */}
            <div className="mb-3">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                {t.stadium}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'classic', name: t.stadiumClassic },
                  { id: 'neon', name: t.stadiumNeon },
                  { id: 'sunset', name: t.stadiumSunset },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setStadium(item.id as StadiumType)}
                    className={`py-2 px-1 text-xs font-bold rounded-lg border truncate transition-all ${stadium === item.id ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg' : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Bot Difficulty */}
            <div className="mb-3">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                {t.botDifficulty}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'easy', name: t.easy },
                  { id: 'normal', name: t.normal },
                  { id: 'hard', name: t.hard },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setDifficulty(item.id as BotDifficulty)}
                    className={`py-2 px-1 text-xs font-bold rounded-lg border truncate transition-all ${difficulty === item.id ? 'bg-amber-600 border-amber-400 text-white shadow-lg' : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Match Duration & Team */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  {t.matchDuration}
                </label>
                <div className="flex gap-2">
                  {[3, 5].map(m => (
                    <button
                      key={m}
                      onClick={() => setDuration(m)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border ${duration === m ? 'bg-cyan-600 border-cyan-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
                    >
                      {m} min
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  {t.joinTeam}
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedTeam('blue')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border ${selectedTeam === 'blue' ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                  >
                    {t.blueTeam}
                  </button>
                  <button
                    onClick={() => setSelectedTeam('orange')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border ${selectedTeam === 'orange' ? 'bg-orange-600 border-orange-400 text-white shadow-[0_0_10px_rgba(234,88,12,0.5)]' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                  >
                    {t.orangeTeam}
                  </button>
                </div>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleLaunchOffline}
              className="w-full py-3.5 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-lg uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all active:scale-98"
              style={{ fontFamily: 'Rajdhani, sans-serif' }}
            >
              <Play className="w-5 h-5 fill-current" />
              {t.startGame}
            </button>
          </div>
        )}
      </div>

      {/* Bottom Hint Line */}
      <div className="flex items-center justify-between text-xs text-slate-400 font-medium tracking-wide">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">WASD</span>
          <span>Drive</span>
          <span className="text-slate-600">·</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">Space</span>
          <span>Jump/Flip</span>
          <span className="text-slate-600">·</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">Shift</span>
          <span>Boost</span>
          <span className="text-slate-600">·</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">C</span>
          <span>Ball Cam</span>
        </div>
        <div className="text-slate-400 text-[11px]">
          v1.0.0 · Optimized for Low-Power Intel UHD / Celeron
        </div>
      </div>
    </div>
  );
}
