/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, SlidersHorizontal, Settings, Flame, Layers, Award, Waves, Volume2, Music, Sparkles, RotateCcw } from 'lucide-react';
import { ThereminSettings, ScaleType, PitchResponseMode, TimbreType } from '../types';
import { KEYS } from '../utils/audio';
import { useLanguage } from '../contexts/LanguageContext';

const DEFAULT_SETTINGS: ThereminSettings = {
  handSetup: 'standard',
  scale: 'major',
  primaryKey: 'C',
  baseOctave: 3,
  sensitivity: 75,
  smoothing: 40,
  responseMode: 'log',
  timbre: 'triangle',
  vibratoEnabled: true,
  vibratoSpeed: 6,
  vibratoDepth: 35,
  delayEnabled: true,
  delayTime: 400,
  delayFeedback: 45,
  reverbEnabled: true,
  reverbMix: 30
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ThereminSettings;
  onSave: (settings: ThereminSettings) => void;
}

type TabType = 'basic' | 'advanced';

export default function SettingsModal({ isOpen, onClose, settings, onSave }: SettingsModalProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [localSettings, setLocalSettings] = useState<ThereminSettings>({ ...settings });

  const handleChange = (key: keyof ThereminSettings, value: any) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    onSave(updated); // Sync settings instantly for interactive feedback!
  };

  const handleResetDefaults = () => {
    setLocalSettings({ ...DEFAULT_SETTINGS });
    onSave({ ...DEFAULT_SETTINGS });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#051424]/80 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative glass-panel bg-[#1c2b3c]/60 backdrop-blur-2xl border border-white/10 rounded-[20px] w-full max-w-xl flex flex-col shadow-2xl overflow-hidden max-h-[85vh] z-10"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-[#44e2cd]" />
                <h2 className="font-display-lg text-xl text-[#d4e4fa] uppercase tracking-widest">
                  {t('settings.title')}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-[#cac4d4] hover:text-[#cebdff] transition-colors p-2 rounded-full hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Tabs */}
            <div className="flex border-b border-white/5 px-6 pt-3 gap-5">
              <button
                onClick={() => setActiveTab('basic')}
                className={`pb-3 border-b-2 font-label-caps text-xs uppercase tracking-widest transition-all ${
                  activeTab === 'basic'
                    ? 'border-[#44e2cd] text-[#44e2cd]'
                    : 'border-transparent text-[#cac4d4] hover:text-[#d4e4fa]'
                }`}
              >
                {t('settings.basic')}
              </button>
              <button
                onClick={() => setActiveTab('advanced')}
                className={`pb-3 border-b-2 font-label-caps text-xs uppercase tracking-widest transition-all ${
                  activeTab === 'advanced'
                    ? 'border-[#44e2cd] text-[#44e2cd]'
                    : 'border-transparent text-[#cac4d4] hover:text-[#d4e4fa]'
                }`}
              >
                {t('settings.advanced')}
              </button>
            </div>

            {/* Basic setup panel */}
            <div className={`p-6 overflow-y-auto flex-1 flex-col gap-5 ${activeTab === 'basic' ? 'flex' : 'hidden'}`}>
              <div className="flex flex-col gap-3">
                {/* Standard Card */}
                <div
                  onClick={() => handleChange('handSetup', 'standard')}
                  className={`flex items-center justify-between p-4 rounded-[16px] border cursor-pointer hover:bg-white/5 transition-all ${
                    localSettings.handSetup === 'standard'
                      ? 'border-[#44e2cd]/50 bg-[#44e2cd]/5'
                      : 'border-white/10 bg-transparent'
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className={`font-sans font-medium text-lg ${localSettings.handSetup === 'standard' ? 'text-[#44e2cd]' : 'text-[#d4e4fa]'}`}>
                        {t('settings.setupStandard')}
                      </span>
                    </div>
                    <p className="font-sans text-xs text-[#cac4d4] opacity-70 mt-1">
                      {t('settings.setupStandardDesc')}
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    localSettings.handSetup === 'standard' ? 'border-[#44e2cd]' : 'border-white/25'
                  }`}>
                    {localSettings.handSetup === 'standard' && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#44e2cd]" />
                    )}
                  </div>
                </div>

                {/* Southpaw Card */}
                <div
                  onClick={() => handleChange('handSetup', 'southpaw')}
                  className={`flex items-center justify-between p-4 rounded-[16px] border cursor-pointer hover:bg-white/5 transition-all ${
                    localSettings.handSetup === 'southpaw'
                      ? 'border-[#44e2cd]/50 bg-[#44e2cd]/5'
                      : 'border-white/10 bg-transparent'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className={`font-sans font-medium text-lg ${localSettings.handSetup === 'southpaw' ? 'text-[#44e2cd]' : 'text-[#d4e4fa]'}`}>
                      {t('settings.setupInverse')}
                    </span>
                    <p className="font-sans text-xs text-[#cac4d4] opacity-70 mt-1">
                      {t('settings.setupInverseDesc')}
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    localSettings.handSetup === 'southpaw' ? 'border-[#44e2cd]' : 'border-white/25'
                  }`}>
                    {localSettings.handSetup === 'southpaw' && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#44e2cd]" />
                    )}
                  </div>
                </div>
              </div>

              {/* Interaction Preview Visual representation */}
              <div className="bg-[#010f1f]/40 rounded-[24px] p-6 flex flex-col gap-4 border border-white/5">
                <span className="font-label-caps text-xs text-[#cac4d4]/60 uppercase tracking-widest text-center">
                  {t('settings.mapping')}
                </span>
                <div className="flex justify-around items-end h-32 relative py-2">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-baseline gap-1 h-20">
                      <div className="w-1 bg-[#44e2cd]/30 h-4 rounded-full animate-pulse" />
                      <div className="w-1 bg-[#44e2cd]/50 h-8 rounded-full animate-pulse [animation-delay:0.15s]" />
                      <div className="w-1 bg-[#44e2cd]/80 h-12 rounded-full animate-pulse [animation-delay:0.3s]" />
                      <div className="w-1 bg-[#44e2cd]/50 h-8 rounded-full animate-pulse [animation-delay:0.15s]" />
                      <div className="w-1 bg-[#44e2cd]/30 h-4 rounded-full animate-pulse" />
                    </div>
                    <span className="font-mono text-[10px] uppercase text-[#cebdff] tracking-wide">
                      {t('canvas.pitch')}
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-20 border-l border-b border-dashed border-[#44e2cd]/30 flex items-center justify-center">
                      <div className="w-full h-1 rounded-full bg-[#44e2cd]/60 animate-bounce" />
                    </div>
                    <span className="font-mono text-[10px] uppercase text-[#62fae3] tracking-wide">
                      {t('canvas.volume')}
                    </span>
                  </div>
                </div>
              </div>

              <p className="font-sans text-xs text-[#cac4d4] italic leading-relaxed text-center px-4 opacity-80 mt-auto">
                {t('settings.setupStandardText')}
              </p>
            </div>

            {/* Advanced synthesis panel */}
            <div className={`p-6 overflow-y-auto flex-1 flex-col gap-5 ${activeTab === 'advanced' ? 'flex' : 'hidden'}`}>
              
              <div className="flex justify-between items-center mb-1">
                <span className="font-label-caps text-[11px] text-[#cac4d4]/60 uppercase tracking-widest text-center">
                  {t('settings.advanced')}
                </span>
                <button 
                  onClick={handleResetDefaults}
                  className="flex items-center gap-1.5 font-label-caps text-[10px] uppercase text-[#44e2cd] hover:text-[#62fae3] border border-[#44e2cd]/30 rounded px-2.5 py-1.5 hover:bg-[#44e2cd]/10 transition-all">
                  <RotateCcw className="w-3 h-3" />
                  {t('settings.reset')}
                </button>
              </div>

              {/* Primary Key and Base Octave */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-label-caps text-[11px] text-[#44e2cd] uppercase tracking-widest font-semibold flex items-center gap-1.5">
                    <Music className="w-4 h-4" />
                    {t('settings.primaryKey')}
                  </label>
                  <select
                    value={localSettings.primaryKey}
                    onChange={(e) => handleChange('primaryKey', e.target.value)}
                    className="bg-[#0f1d2c] border border-white/10 rounded-xl p-2.5 text-[#d4e4fa] focus:border-[#44e2cd] focus:ring-1 focus:ring-[#44e2cd] outline-none font-sans text-xs"
                  >
                    {KEYS.map((k) => (
                      <option key={k} className="bg-[#122131]" value={k}>
                        {k} {t('settings.keyLabel')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-label-caps text-[11px] text-[#44e2cd] uppercase tracking-widest font-semibold flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4" />
                    {t('settings.baseOctave')}
                  </label>
                  <select
                    value={localSettings.baseOctave}
                    onChange={(e) => handleChange('baseOctave', parseInt(e.target.value))}
                    className="bg-[#0f1d2c] border border-white/10 rounded-xl p-2.5 text-[#d4e4fa] focus:border-[#44e2cd] focus:ring-1 focus:ring-[#44e2cd] outline-none font-sans text-xs"
                  >
                    <option className="bg-[#122131]" value={2}>{t('settings.octave2')}</option>
                    <option className="bg-[#122131]" value={3}>{t('settings.octave3')}</option>
                    <option className="bg-[#122131]" value={4}>{t('settings.octave4')}</option>
                    <option className="bg-[#122131]" value={5}>{t('settings.octave5')}</option>
                  </select>
                </div>
              </div>

              {/* Active Cosmic Scale */}
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[11px] text-[#44e2cd] uppercase tracking-widest font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#44e2cd]" />
                  {t('settings.scale')}
                </label>
                <select
                  value={localSettings.scale}
                  onChange={(e) => handleChange('scale', e.target.value as ScaleType)}
                  className="bg-[#0f1d2c] border border-white/10 rounded-xl p-2.5 text-[#d4e4fa] focus:border-[#44e2cd] focus:ring-1 focus:ring-[#44e2cd] outline-none font-sans text-xs"
                >
                  <option className="bg-[#122131]" value="chromatic">{t('settings.scaleChromatic')}</option>
                  <option className="bg-[#122131]" value="major">{t('settings.scaleMajor')}</option>
                  <option className="bg-[#122131]" value="minor">{t('settings.scaleMinor')}</option>
                  <option className="bg-[#122131]" value="pentatonic">{t('settings.scalePentatonic')}</option>
                </select>
                
                {localSettings.scale !== 'chromatic' && (
                  <div className="bg-[#44e2cd]/10 border border-[#44e2cd]/30 rounded-xl p-3 flex gap-2.5 items-start mt-0.5 shadow-md">
                    <span className="text-[#62fae3] text-sm leading-none">💡</span>
                    <div className="flex flex-col gap-1">
                      <span className="font-sans font-semibold text-[11px] text-[#62fae3]">
                        {t('settings.tuningActive')}
                      </span>
                      <p className="font-sans text-[10px] text-[#cac4d4] leading-relaxed">
                        {t('settings.tuningDesc')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Vibrato LFO parameters */}
              <div className="flex flex-col gap-3 p-4 rounded-[16px] border border-white/5 bg-[#010f1f]/35">
                <div className="flex justify-between items-center">
                  <span className="font-label-caps text-[11px] text-[#62fae3] uppercase tracking-widest font-bold">
                    {t('settings.vibrato')}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.vibratoEnabled}
                      onChange={(e) => handleChange('vibratoEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#44e2cd]/80"></div>
                  </label>
                </div>

                {localSettings.vibratoEnabled && (
                  <div className="flex flex-col gap-4 transition-all">
                    {/* Speed */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#cac4d4]">Speed:</span>
                        <span className="font-mono text-[#62fae3] font-semibold">{localSettings.vibratoSpeed} Hz</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="12"
                        step="0.5"
                        value={localSettings.vibratoSpeed}
                        onChange={(e) => handleChange('vibratoSpeed', parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#44e2cd]"
                      />
                    </div>

                    {/* Depth */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#cac4d4]">Depth:</span>
                        <span className="font-mono text-[#62fae3] font-semibold">{localSettings.vibratoDepth} cents</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="80"
                        value={localSettings.vibratoDepth}
                        onChange={(e) => handleChange('vibratoDepth', parseInt(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#44e2cd]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Nebular Sound FX parameters */}
              <div className="flex flex-col gap-4 p-4 rounded-[16px] border border-white/5 bg-[#010f1f]/35">
                <span className="font-label-caps text-[11px] text-[#62fae3] uppercase tracking-widest font-bold">
                  {t('settings.nebular')}
                </span>

                {/* Stereo Echo Delay */}
                <div className="flex flex-col gap-3 border-t border-white/5 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-[#d4e4fa] flex items-center gap-1">
                      {t('settings.echo')}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.delayEnabled}
                        onChange={(e) => handleChange('delayEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#44e2cd]/80"></div>
                    </label>
                  </div>

                  {localSettings.delayEnabled && (
                    <div className="flex flex-col gap-3.5 pl-2 border-l border-[#44e2cd]/10">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#cac4d4]/80">{t('settings.time')}</span>
                          <span className="font-mono text-[#62fae3] font-medium">{localSettings.delayTime} ms</span>
                        </div>
                        <input
                          type="range"
                          min="100"
                          max="1500"
                          step="50"
                          value={localSettings.delayTime}
                          onChange={(e) => handleChange('delayTime', parseInt(e.target.value))}
                          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#44e2cd]"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#cac4d4]/80">{t('settings.feedback')}</span>
                          <span className="font-mono text-[#62fae3] font-medium">{localSettings.delayFeedback}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="85"
                          value={localSettings.delayFeedback}
                          onChange={(e) => handleChange('delayFeedback', parseInt(e.target.value))}
                          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#44e2cd]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Space Reverb */}
                <div className="flex flex-col gap-3 border-t border-white/5 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-[#d4e4fa] flex items-center gap-1">
                      {t('settings.reverb')}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.reverbEnabled}
                        onChange={(e) => handleChange('reverbEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#44e2cd]/80"></div>
                    </label>
                  </div>

                  {localSettings.reverbEnabled && (
                    <div className="flex flex-col gap-1.5 pl-2 border-l border-[#44e2cd]/10">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#cac4d4]/80">{t('settings.mix')}</span>
                        <span className="font-mono text-[#62fae3] font-medium">{localSettings.reverbMix}%</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="80"
                        value={localSettings.reverbMix}
                        onChange={(e) => handleChange('reverbMix', parseInt(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#44e2cd]"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamics & Smoothing settings */}
              <div className="flex flex-col gap-4 p-4 rounded-[16px] border border-white/5 bg-[#010f1f]/35">
                <span className="font-label-caps text-[11px] text-[#62fae3] uppercase tracking-widest font-bold">
                  {t('settings.dynamics')}
                </span>

                {/* Tracking scale sensitivity */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="font-label-caps text-[10px] text-[#cac4d4]/80 uppercase tracking-widest">
                      {t('settings.sensitivity')}
                    </label>
                    <span className="font-mono text-xs text-[#44e2cd]">{localSettings.sensitivity}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={localSettings.sensitivity}
                    onChange={(e) => handleChange('sensitivity', parseInt(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#44e2cd]"
                  />
                </div>

                {/* Motion smoothing scale */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="font-label-caps text-[10px] text-[#cac4d4]/80 uppercase tracking-widest">
                      {t('settings.smoothing')}
                    </label>
                    <span className="font-mono text-xs text-[#44e2cd]">{localSettings.smoothing}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="95"
                    value={localSettings.smoothing}
                    onChange={(e) => handleChange('smoothing', parseInt(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#44e2cd]"
                  />
                </div>
              </div>

              {/* Pitch Response Toggle */}
              <div className="flex items-center justify-between p-4 rounded-[16px] border border-white/10 bg-white/5 mb-4">
                <div className="flex flex-col">
                  <span className="font-sans font-medium text-[#d4e4fa] text-xs md:text-sm">{t('settings.pitchResponse')}</span>
                  <p className="font-sans text-[10px] text-[#cac4d4]/80">
                    {t('settings.pitchResponseDesc')}
                  </p>
                </div>
                <div className="flex bg-[#051424] rounded-lg p-1 border border-white/10">
                  <button
                    onClick={() => handleChange('responseMode', 'log')}
                    className={`px-3 py-1 rounded-md font-label-caps text-[10px] transition-all uppercase ${
                      localSettings.responseMode === 'log'
                        ? 'bg-[#44e2cd]/20 text-[#44e2cd] border border-[#44e2cd]/10'
                        : 'text-[#cac4d4] hover:text-[#d4e4fa]'
                    }`}
                  >
                    Log
                  </button>
                  <button
                    onClick={() => handleChange('responseMode', 'lin')}
                    className={`px-3 py-1 rounded-md font-label-caps text-[10px] transition-all uppercase ${
                      localSettings.responseMode === 'lin'
                        ? 'bg-[#44e2cd]/20 text-[#44e2cd] border border-[#44e2cd]/10'
                        : 'text-[#cac4d4] hover:text-[#d4e4fa]'
                    }`}
                  >
                    Lin
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
