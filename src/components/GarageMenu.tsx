import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { CarCustomization, CarBodyType, PaintFinish, WheelType, saveCar } from '../game/garage/GarageTypes';
import { ArrowLeft, Check, Sparkles, Palette, Shield, Disc3, User } from 'lucide-react';

interface GarageMenuProps {
  customization: CarCustomization;
  onUpdateCustomization: (custom: CarCustomization) => void;
  onClose: () => void;
}

export function GarageMenu({
  customization,
  onUpdateCustomization,
  onClose
}: GarageMenuProps) {
  const { t } = useLanguage();
  const [current, setCurrent] = useState<CarCustomization>({ ...customization });
  const [activeTab, setActiveTab] = useState<'body' | 'paint' | 'boost' | 'profile'>('body');

  const update = (partial: Partial<CarCustomization>) => {
    const next = { ...current, ...partial };
    setCurrent(next);
    onUpdateCustomization(next);
    saveCar(next);
  };

  const PRESET_COLORS = [
    '#0066ff', '#00d2ff', '#0284c7', '#2563eb', // Blues
    '#ff5500', '#ea580c', '#f59e0b', '#e11d48', // Oranges / Reds
    '#10b981', '#14b8a6', '#8b5cf6', '#ec4899', // Green / Purple
    '#f8fafc', '#94a3b8', '#334155', '#0f172a', // Grayscale
  ];

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-4 md:p-8 pointer-events-none select-none bg-gradient-to-t from-black/80 via-transparent to-black/60">
      {/* Top Header */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl shadow-lg backdrop-blur-md active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-cyan-400" />
          <span className="font-bold text-sm tracking-wide uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            {t.close}
          </span>
        </button>

        <h1 className="text-3xl md:text-4xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-400 uppercase italic" style={{ fontFamily: 'Teko, sans-serif' }}>
          {t.garage}
        </h1>

        <div className="text-xs text-slate-400 font-medium tracking-wide hidden sm:block bg-black/40 px-3 py-1.5 rounded-lg border border-slate-800">
          {t.rotateCar}
        </div>
      </div>

      {/* Bottom Customization Controls Dock */}
      <div className="w-full max-w-2xl mx-auto pointer-events-auto bg-slate-950/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl p-4 md:p-5 animate-in slide-in-from-bottom-6 duration-200">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
          {[
            { id: 'body', label: t.bodyModel, icon: Shield },
            { id: 'paint', label: t.paintFinish, icon: Palette },
            { id: 'boost', label: t.boostColor, icon: Sparkles },
            { id: 'profile', label: t.playerName, icon: User },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-cyan-600 border border-cyan-400 text-white shadow-lg'
                    : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Car Body Model */}
        {activeTab === 'body' && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'apex', name: 'Apex Hatch', desc: 'Agile & balanced with rear wing spoiler' },
              { id: 'viper', name: 'Viper Muscle', desc: 'Low-slung powerhouse with front splitter' },
              { id: 'titan', name: 'Titan Interceptor', desc: 'Heavy angular cyber wedge frame' },
            ].map(b => (
              <button
                key={b.id}
                onClick={() => update({ body: b.id as CarBodyType })}
                className={`p-3 text-left rounded-xl border transition-all ${
                  current.body === b.id
                    ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-sm font-bold text-white uppercase tracking-wide" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  {b.name}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {b.desc}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Tab 2: Paint & Finish */}
        {activeTab === 'paint' && (
          <div className="flex flex-col gap-3">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                {t.paintFinish}
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'glossy', name: t.finishGlossy },
                  { id: 'matte', name: t.finishMatte },
                  { id: 'metallic', name: t.finishMetallic },
                ].map(fin => (
                  <button
                    key={fin.id}
                    onClick={() => update({ finish: fin.id as PaintFinish })}
                    className={`py-1.5 text-xs font-bold uppercase rounded-lg border ${
                      current.finish === fin.id
                        ? 'bg-cyan-600 border-cyan-400 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {fin.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                {t.primaryColor}
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(col => (
                  <button
                    key={col}
                    onClick={() => update({ primaryColor: col })}
                    style={{ backgroundColor: col }}
                    className={`w-7 h-7 rounded-lg border-2 transition-transform active:scale-90 flex items-center justify-center ${
                      current.primaryColor === col ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                    }`}
                  >
                    {current.primaryColor === col && <Check className="w-4 h-4 text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                {t.decalColor}
              </span>
              <div className="flex flex-wrap gap-2">
                {['#ffffff', '#ffdd00', '#00ffff', '#ff0055', '#00ff66', '#111827'].map(col => (
                  <button
                    key={col}
                    onClick={() => update({ decalColor: col })}
                    style={{ backgroundColor: col }}
                    className={`w-7 h-7 rounded-lg border-2 transition-transform active:scale-90 flex items-center justify-center ${
                      current.decalColor === col ? 'border-cyan-400 scale-110 shadow-lg' : 'border-transparent'
                    }`}
                  >
                    {current.decalColor === col && <Check className="w-4 h-4 text-black drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Boost Trail Color */}
        {activeTab === 'boost' && (
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              {t.boostColor}
            </span>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {[
                { hex: '#00ddff', name: 'Cyan Plasma' },
                { hex: '#ff5500', name: 'Firestorm' },
                { hex: '#ff0077', name: 'Neon Magenta' },
                { hex: '#10b981', name: 'Emerald Flux' },
                { hex: '#eab308', name: 'Solar Flare' },
                { hex: '#8b5cf6', name: 'Void Purple' },
              ].map(b => (
                <button
                  key={b.hex}
                  onClick={() => update({ boostColor: b.hex })}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    current.boostColor === b.hex
                      ? 'bg-slate-900 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full shadow-inner" style={{ backgroundColor: b.hex }} />
                  <span className="text-[10px] font-bold text-slate-300 text-center truncate w-full">
                    {b.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Player Profile */}
        {activeTab === 'profile' && (
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              {t.playerName}
            </label>
            <input
              type="text"
              maxLength={16}
              value={current.playerName}
              onChange={(e) => update({ playerName: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold tracking-wide focus:outline-none focus:border-cyan-400"
            />
          </div>
        )}
      </div>
    </div>
  );
}
