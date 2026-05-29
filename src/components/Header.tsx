/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sparkles } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function Header() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="flex justify-between items-center w-full px-6 md:px-12 py-6 z-40 bg-transparent absolute top-0 left-0 border-b border-transparent">
      {/* Brand logo details */}
      <div className="flex items-center gap-3">
        <h1 className="font-display-lg text-2xl md:text-3xl tracking-[0.15em] text-[#cebdff] opacity-85 uppercase font-extralight select-none flex items-center gap-2">
          {t('app.title')}
          <Sparkles className="w-4 h-4 text-[#44e2cd] animate-pulse hidden md:inline-block" />
        </h1>
      </div>

      {/* Utilities panel */}
      <div className="flex items-center gap-3 text-[#cebdff]">
        {/* Language Switch */}
        <button
          onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
          className="flex items-center justify-center w-8 h-8 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 transition-colors text-xs font-mono text-[#cac4d4]"
          title="Switch Language"
        >
          {language === 'zh' ? 'EN' : '中'}
        </button>
      </div>
    </header>
  );
}
