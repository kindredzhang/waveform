/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Hand, Music, HelpCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const { t } = useLanguage();
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
            className="relative glass-panel bg-[#1c2b3c]/60 backdrop-blur-2xl border border-white/10 rounded-[20px] w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/5">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#44e2cd]" />
                <h2 className="font-display-lg text-xl md:text-2xl text-[#d4e4fa] uppercase tracking-widest">
                  {t('tutorial.title')}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-[#cac4d4] hover:text-[#cebdff] transition-colors p-2 rounded-full hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto flex flex-col gap-6">
              {/* Steps Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Step 1 */}
                <div className="flex flex-col gap-2 p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="w-8 h-8 rounded-full bg-[#44e2cd]/10 text-[#44e2cd] flex items-center justify-center text-[10px] font-bold font-mono">
                    1
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Camera className="w-4 h-4 text-[#cebdff]" />
                    <h3 className="font-sans font-medium text-[15px] text-[#d4e4fa]">
                      {t('tutorial.step1')}
                    </h3>
                  </div>
                  <p className="font-sans text-xs text-[#cac4d4] opacity-80 leading-relaxed">
                    {t('tutorial.step1Desc')}
                  </p>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col gap-2 p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="w-8 h-8 rounded-full bg-[#44e2cd]/10 text-[#44e2cd] flex items-center justify-center text-[10px] font-bold font-mono">
                    2
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Hand className="w-4 h-4 text-[#cebdff]" />
                    <h3 className="font-sans font-medium text-[15px] text-[#d4e4fa]">
                      {t('tutorial.step2')}
                    </h3>
                  </div>
                  <p className="font-sans text-xs text-[#cac4d4] opacity-80 leading-relaxed">
                    {t('tutorial.step2Desc')}
                  </p>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col gap-2 p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="w-8 h-8 rounded-full bg-[#44e2cd]/10 text-[#44e2cd] flex items-center justify-center text-[10px] font-bold font-mono">
                    3
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Music className="w-4 h-4 text-[#cebdff]" />
                    <h3 className="font-sans font-medium text-[15px] text-[#d4e4fa]">
                      {t('tutorial.step3')}
                    </h3>
                  </div>
                  <p className="font-sans text-xs text-[#cac4d4] opacity-80 leading-relaxed">
                    {t('tutorial.step3Desc')}
                  </p>
                </div>

                {/* Step 4 */}
                <div className="flex flex-col gap-2 p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="w-8 h-8 rounded-full bg-[#44e2cd]/10 text-[#44e2cd] flex items-center justify-center text-[10px] font-bold font-mono">
                    4
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[#44e2cd] font-bold text-sm">✨</span>
                    <h3 className="font-sans font-medium text-[15px] text-[#d4e4fa]">
                      {t('tutorial.step4')}
                    </h3>
                  </div>
                  <p className="font-sans text-xs text-[#cac4d4] opacity-80 leading-relaxed">
                    {t('tutorial.step4Desc')}
                  </p>
                </div>
              </div>

              {/* Quick Action Button */}
              <div className="flex justify-center pt-2">
                <button
                  onClick={onClose}
                  className="px-8 py-3 rounded-full bg-[#44e2cd]/20 text-[#62fae3] border border-[#44e2cd]/30 font-medium tracking-wide hover:bg-[#44e2cd]/30 transition-all font-mono text-[13px] uppercase"
                >
                  {t('tutorial.begin')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
