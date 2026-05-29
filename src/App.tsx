/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Droplet,
  Triangle as TriangleIcon,
  TrendingUp,
  Square as SquareIcon,
  Info,
  HelpCircle,
  Sparkles,
  Volume2,
  Activity
} from 'lucide-react';

import { ThereminSettings, TimbreType } from './types';
import Header from './components/Header';
import NavBar from './components/NavBar';
import ThereminCanvas from './components/ThereminCanvas';
import SettingsModal from './components/SettingsModal';
import TutorialModal from './components/TutorialModal';
import { globalAudioEngine } from './utils/audio';
import { useLanguage } from './contexts/LanguageContext';

const STORAGE_KEY = 'aetherwave_recordings';

export default function App() {
  const { t } = useLanguage();
  // Audio Activation status to bypass autoplay blocks
  const [isActivated, setIsActivated] = useState(false);

  // Core visual parameters synchronized with interactions
  const [resonance, setResonance] = useState(0);
  const [aura, setAura] = useState(0);
  const [timbre, setTimbre] = useState<TimbreType>('triangle');

  // Modals alignment tracking
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  // Settings structure matching requirements
  const [settings, setSettings] = useState<ThereminSettings>({
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
  });

  // Sync AudioEngine when scale or settings updates
  useEffect(() => {
    globalAudioEngine.setScaleSettings(
      settings.scale,
      settings.primaryKey,
      settings.baseOctave,
      settings.responseMode
    );
    globalAudioEngine.setTimbre(settings.timbre);
    globalAudioEngine.setEffectsSettings({
      vibratoEnabled: settings.vibratoEnabled,
      vibratoSpeed: settings.vibratoSpeed,
      vibratoDepth: settings.vibratoDepth,
      delayEnabled: settings.delayEnabled,
      delayTime: settings.delayTime,
      delayFeedback: settings.delayFeedback,
      reverbEnabled: settings.reverbEnabled,
      reverbMix: settings.reverbMix
    });
    setTimbre(settings.timbre);
  }, [settings]);

  // Sound input updates
  const handleUpdateParams = (freq: number, vol: number) => {
    setResonance(Math.round(freq));
    setAura(Math.round(vol * 100));
  };

  const handleActivate = () => {
    setIsActivated(true);
    globalAudioEngine.init();

    if (!localStorage.getItem('aetherwave_unleashed')) {
      localStorage.setItem('aetherwave_unleashed', 'true');
      setIsTutorialOpen(true);
    }
  };

  // Dynamic theme class names derived from active timbre selection
  const getThemeClass = () => {
    switch (timbre) {
      case 'sine':
        return 'theme-sine';
      case 'sawtooth':
        return 'theme-sawtooth';
      case 'square':
        return 'theme-square';
      case 'triangle':
      default:
        return 'theme-triangle';
    }
  };

  const getThemeColorClass = () => {
    switch (timbre) {
      case 'sine':
        return 'text-blue-400';
      case 'sawtooth':
        return 'text-emerald-400';
      case 'square':
        return 'text-orange-400';
      case 'triangle':
      default:
        return 'text-violet-300';
    }
  };

  return (
    <div
      className={`relative h-screen w-screen selection:bg-[#44e2cd] selection:text-[#003731] overflow-hidden bg-[#051424] text-[#d4e4fa] ${getThemeClass()}`}
    >
      {/* 2. Ambient Mesh Layer updates dynamically via state properties */}
      <div
        className="absolute inset-0 z-0 transition-all duration-1000 ease-in-out"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${
            timbre === 'sine'
              ? 'rgba(59, 130, 246, 0.13)'
              : timbre === 'sawtooth'
              ? 'rgba(16, 185, 129, 0.13)'
              : timbre === 'square'
              ? 'rgba(249, 115, 22, 0.13)'
              : 'rgba(167, 139, 250, 0.13)'
          } 0%, rgba(5, 20, 36, 1) 100%)`
        }}
      />

      {/* 3. Static Monochrome Noise Grain texture for deep atmospheric warmth */}
      <div
        className="absolute inset-0 z-1 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Header element */}
      <Header />

      {/* Main Interactive Theremin Surface */}
      <main className="absolute inset-0 z-10 w-full h-full">
        <ThereminCanvas
          settings={settings}
          timbre={timbre}
          onUpdateParams={handleUpdateParams}
          isActivated={isActivated}
          onActivate={handleActivate}
        />
      </main>

      {/* HUD Telemetry — desktop: left panel, mobile: compact top-right strip without icons */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <div className="hidden md:flex justify-between items-center px-6 md:px-12 h-full">
          <div className="glass-panel bg-[#122131]/25 border border-white/10 rounded-[24px] p-6 pointer-events-auto flex flex-col gap-6 min-w-[150px] shadow-2xl backdrop-blur-md select-none">
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[9px] text-[#cac4d4] opacity-55 uppercase tracking-[0.15em] flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 opacity-60 text-[#44e2cd]" />
                {t('canvas.resonanceTitle')}
              </span>
              <span className={`font-sans font-light text-2xl md:text-3xl transition-colors duration-500 ${getThemeColorClass()}`}>
                {isActivated ? `${resonance} Hz` : '---'}
              </span>
            </div>
            <div className="w-full h-[1px] bg-white/5" />
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[9px] text-[#cac4d4] opacity-55 uppercase tracking-[0.15em] flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 opacity-60 text-[#44e2cd]" />
                {t('canvas.auraLevelTitle')}
              </span>
              <span className={`font-sans font-light text-2xl md:text-3xl transition-colors duration-500 ${getThemeColorClass()}`}>
                {isActivated ? `${aura}%` : '---'}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile: compact telemetry strip — left side, not overlapping camera button */}
        <div className="md:hidden absolute top-24 left-4 z-30 flex items-center gap-2 pointer-events-auto select-none">
          <div className="glass-panel bg-[#122131]/40 border border-white/10 rounded-full px-3 py-1.5 shadow-xl backdrop-blur-md flex items-center gap-3">
            <span className={`font-mono font-semibold text-xs transition-colors duration-500 ${getThemeColorClass()}`}>
              {isActivated ? `${resonance}Hz` : '---'}
            </span>
            <span className="text-white/10">|</span>
            <span className={`font-mono font-semibold text-xs transition-colors duration-500 ${getThemeColorClass()}`}>
              {isActivated ? `${aura}%` : '---'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation capsule */}
      <NavBar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTutorial={() => setIsTutorialOpen(true)}
      />

      {/* Modal overlays */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={(updated) => setSettings(updated)}
      />

      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />
    </div>
  );
}
