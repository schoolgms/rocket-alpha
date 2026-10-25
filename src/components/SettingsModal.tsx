import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { SupportedLanguage } from '../i18n/translations';
import { GraphicsConfig, GraphicsPreset, SettingsManager } from '../game/settings/GraphicsSettings';
import { SoundManager } from '../game/audio/SoundManager';
import { X, Sliders, Monitor, Volume2, Globe, Cpu, Check } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  onConfigChange: (config: GraphicsConfig) => void;
}

export function SettingsModal({ onClose, onConfigChange }: SettingsModalProps) {
  const { t, language, setLanguage } = useLanguage();
  const settingsManager = SettingsManager.getInstance();
  const [config, setConfig] = useState<GraphicsConfig>(() => settingsManager.getConfig());

  const applyPreset = (preset: Exclude<GraphicsPreset, 'custom'>) => {
    settingsManager.setPreset(preset);
    const updated = settingsManager.getConfig();
    setConfig(updated);
    onConfigChange(updated);
  };

  const updateSetting = (partial: Partial<GraphicsConfig>) => {
    settingsManager.updateConfig(partial);
    const updated = settingsManager.getConfig();
    setConfig(updated);
    onConfigChange(updated);

    // If volume changed, update sound manager
    if (partial.soundVolume !== undefined || partial.musicVolume !== undefined) {
      SoundManager.getInstance().setVolumes(
        updated.soundVolume,
        updated.musicVolume
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-xl bg-slate-950 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold tracking-wider text-white uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              {t.settings}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* 1. GRAPHICS PRESETS */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <label className="text-xs font-bold tracking-wider text-slate-300 uppercase">
                {t.graphicsPreset}
              </label>
            </div>

            {/* Potato Mode Hero Card */}
            <div
              onClick={() => applyPreset('potato')}
              className={`p-3.5 mb-2.5 rounded-xl border cursor-pointer transition-all ${
                config.preset === 'potato'
                  ? 'bg-cyan-950/70 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-amber-300">🥔 {t.presetPotato}</span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
                    Recommended for Celeron / UHD 600
                  </span>
                </div>
                {config.preset === 'potato' && <Check className="w-4 h-4 text-cyan-400" />}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {t.presetPotatoDesc}
              </p>
            </div>

            {/* Standard Presets */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'low', name: t.presetLow },
                { id: 'medium', name: t.presetMedium },
                { id: 'high', name: t.presetHigh },
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p.id as Exclude<GraphicsPreset, 'custom'>)}
                  className={`py-2 text-xs font-bold uppercase rounded-lg border transition-all ${
                    config.preset === p.id
                      ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* 2. ADVANCED GRAPHICS ADJUSTMENTS */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-cyan-400" />
              <label className="text-xs font-bold tracking-wider text-slate-300 uppercase">
                {t.customSettings}
              </label>
            </div>

            {/* Resolution Scale Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
                <span>{t.resolutionScale}</span>
                <span className="text-cyan-400 font-mono font-bold">{Math.round(config.resolutionScale * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.60"
                max="1.00"
                step="0.05"
                value={config.resolutionScale}
                onChange={(e) => updateSetting({ resolutionScale: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
            </div>

            {/* Max FPS Limit */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                {t.maxFps}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[30, 45, 60, 0].map(fps => (
                  <button
                    key={fps}
                    onClick={() => updateSetting({ maxFps: fps as 30 | 45 | 60 | 0 })}
                    className={`py-1.5 text-xs font-bold rounded-lg border ${
                      config.maxFps === fps
                        ? 'bg-cyan-600 border-cyan-400 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {fps === 0 ? 'Max' : `${fps} FPS`}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles: Shadows & Show FPS */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => updateSetting({ shadows: !config.shadows })}
                className={`p-3 rounded-xl border text-left flex items-center justify-between ${
                  config.shadows ? 'bg-cyan-950/60 border-cyan-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div>
                  <div className="text-xs font-bold uppercase">{t.shadows}</div>
                  <div className="text-[10px] text-slate-400">{config.shadows ? t.enabled : t.disabled}</div>
                </div>
                {config.shadows && <Check className="w-4 h-4 text-cyan-400" />}
              </button>

              <button
                onClick={() => updateSetting({ showFps: !config.showFps })}
                className={`p-3 rounded-xl border text-left flex items-center justify-between ${
                  config.showFps ? 'bg-cyan-950/60 border-cyan-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div>
                  <div className="text-xs font-bold uppercase">{t.showFps}</div>
                  <div className="text-[10px] text-slate-400">{config.showFps ? t.enabled : t.disabled}</div>
                </div>
                {config.showFps && <Check className="w-4 h-4 text-cyan-400" />}
              </button>
            </div>
          </div>

          {/* 3. AUDIO CONTROLS */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <label className="text-xs font-bold tracking-wider text-slate-300 uppercase">
                Audio
              </label>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
                <span>{t.soundVolume}</span>
                <span className="text-cyan-400 font-mono font-bold">{Math.round(config.soundVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.soundVolume}
                onChange={(e) => updateSetting({ soundVolume: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
                <span>{t.musicVolume}</span>
                <span className="text-cyan-400 font-mono font-bold">{Math.round(config.musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.musicVolume}
                onChange={(e) => updateSetting({ musicVolume: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* 4. LANGUAGE SELECTOR */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <label className="text-xs font-bold tracking-wider text-slate-300 uppercase">
                {t.language}
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                  className={`py-1.5 px-2 text-xs font-bold rounded-lg border text-center transition-all ${
                    language === item.code
                      ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm tracking-wider uppercase rounded-xl shadow-lg active:scale-95 transition-transform"
          >
            {t.save} & {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
