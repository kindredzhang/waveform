/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sliders, Waves, HelpCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface NavBarProps {
  onOpenSettings: () => void;
  onOpenTutorial: () => void;
}

export default function NavBar({
  onOpenSettings,
  onOpenTutorial
}: NavBarProps) {
  const { t } = useLanguage();
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-2xl rounded-full bg-white/5 backdrop-blur-3xl border-t border-white/10 shadow-2xl z-50 flex justify-around items-center px-2 md:px-4 py-2 select-none">
      {/* Waveform / Mode active indicator button */}
      <div className="flex flex-col items-center justify-center bg-[#03c6b2]/10 text-[#62fae3] rounded-full px-4 md:px-5 py-2.5 scale-95 transition-transform min-w-[64px]">
        <Waves className="w-5 h-5 mb-1 text-[#44e2cd]" />
        <span className="font-mono text-[9px] uppercase tracking-wider font-semibold">
          Waveform
        </span>
      </div>

      {/* Settings Action Button */}
      <button
        onClick={onOpenSettings}
        className="flex flex-col items-center justify-center text-[#cac4d4]/75 rounded-full px-4 md:px-5 py-2.5 hover:bg-white/10 hover:text-[#44e2cd] transition-all cursor-pointer focus:outline-none min-w-[64px]"
      >
        <Sliders className="w-5 h-5 mb-1" />
        <span className="font-mono text-[9px] uppercase tracking-wider">
          {t('app.settings')}
        </span>
      </button>

      {/* Tutorial Trigger Button */}
      <button
        onClick={onOpenTutorial}
        className="flex flex-col items-center justify-center text-[#cac4d4]/75 rounded-full px-4 md:px-5 py-2.5 hover:bg-white/10 hover:text-[#44e2cd] transition-all cursor-pointer focus:outline-none min-w-[64px]"
      >
        <HelpCircle className="w-5 h-5 mb-1" />
        <span className="font-mono text-[9px] uppercase tracking-wider">
          {t('app.howToPlay')}
        </span>
      </button>
    </nav>
  );
}
