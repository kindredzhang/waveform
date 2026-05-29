import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'zh' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  zh: {
    // App.tsx
    'app.title': 'Waveform',
    'app.subtitle': '交互式光波合成器',
    'app.settings': '设置',
    'app.howToPlay': '如何演奏',

    // SettingsModal
    'settings.title': '配置',
    'settings.basic': '基础设置',
    'settings.advanced': '高级设置',
    'settings.camMode': '手势追踪模式',
    'settings.camModeDesc': '需开启摄像头权限',
    'settings.touchMode': '触控演奏模式',
    'settings.touchModeDesc': '使用鼠标或触摸板滑动',
    'settings.handSetup': '双手控制与音域映射',
    'settings.setupStandard': '标准模式',
    'settings.setupStandardDesc': '左手控制音高，右手控制音量 (推荐)',
    'settings.setupInverse': '反转模式',
    'settings.setupInverseDesc': '左手控制音量，右手控制音高',
    'settings.setupSingle': '单手模式',
    'settings.setupSingleDesc': '单手同时控制音高(X轴)和音量(Y轴)',
    'settings.mapping': '实时交互映射',
    'settings.setupStandardText': '标准设置模仿传统特雷门琴声学，将频率灵敏区放置在横向视野，为你还原最真实的频率追踪感。',
    'settings.reset': '恢复默认',
    'settings.timbre': '发声波形模型',
    'settings.timbreDesc': '基础声纹底色',
    'settings.timbreSine': 'Sine (纯净正弦波)',
    'settings.timbreTriangle': 'Triangle (温暖三角波)',
    'settings.timbreSawtooth': 'Sawtooth (明亮锯齿波)',
    'settings.timbreSquare': 'Square (复古方波)',
    'settings.primaryKey': '基准根音',
    'settings.keyLabel': '调',
    'settings.baseOctave': '基础音区',
    'settings.octave2': '2 - Bass (低沉重音)',
    'settings.octave3': '3 - Baritone (磁性中低 - 推荐)',
    'settings.octave4': '4 - Standard (空灵标准音)',
    'settings.octave5': '5 - Soprano (高亢哨音)',
    'settings.scale': '调式与纠音算法',
    'settings.scaleChromatic': 'Chromatic (半音阶/无纠音)',
    'settings.scaleMajor': 'Major Scale (大调)',
    'settings.scaleMinor': 'Natural Minor Scale (自然小调)',
    'settings.scalePentatonic': 'Pentatonic Scale (和风五声)',
    'settings.tuningActive': '智能纠音已启动',
    'settings.tuningDesc': '你的滑动将完美吸附到谐和音程上。',
    'settings.vibrato': '情感颤音 (LFO)',
    'settings.speed': '速率:',
    'settings.depth': '深度:',
    'settings.nebular': '星云空间音效',
    'settings.echo': '立体声回跳延迟',
    'settings.time': '时间:',
    'settings.feedback': '回声增益:',
    'settings.reverb': '空间混响',
    'settings.mix': '干湿比:',
    'settings.dynamics': '物理动量与滑音属性',
    'settings.sensitivity': '捕捉灵敏度',
    'settings.smoothing': '滑音平滑度(阻尼)',
    'settings.pitchResponse': '音高响应曲线',
    'settings.pitchResponseDesc': '对数(Log)符合人耳直觉；线性(Lin)适合机械式跳跃',

    // Tutorial
    'tutorial.title': '如何演奏',
    'tutorial.step1': '允许相机访问',
    'tutorial.step1Desc': '程序使用摄像头捕捉手部进行光波合成。所有画面仅在本地运算，全过程不会有任何视频数据被保存或上传。',
    'tutorial.step2': '光标与手势',
    'tutorial.step2Desc': '在感应区内滑动双手或鼠标，以唤醒沉睡的声波。整个画面就是你的表达画板。',
    'tutorial.step3': '波形控制',
    'tutorial.step3Desc': '横向(X轴)改变音高（共鸣频率）；纵向(Y轴)控制响度。手势越靠近，能量越强。',
    'tutorial.step4': '塑造你的音响',
    'tutorial.step4Desc': '通过右侧设置可调节回声延迟和空间混响，甚至启动和风调式的自动谐波纠偏。',
    'tutorial.begin': '开始',

    // ThereminCanvas
    'canvas.pitch': '共鸣音高 (Pitch)',
    'canvas.volume': '光感音量 (Aura Level)',
    'canvas.timbreTitle': '音色',
    'canvas.resonanceTitle': '共鸣',
    'canvas.auraLevelTitle': '音量',
    'canvas.camReady': '视觉传感器已连接。',
    'canvas.camAccessing': '正在获取视觉信号...',
    'canvas.camMove': '将双手移入视场边缘...',
    'canvas.playCam': '开启手势追踪',
    'canvas.dormant': '核心处于休眠状态...',
    'canvas.dormantSub': '点击启动接入星流',
    'canvas.unleash': '启动合成器',
    'canvas.camLock': '双手锁定 • 经典控制',
    'canvas.camSingle': '单手演奏 • 音高&音量',
    'canvas.camWait': '空中挥手 • 准备就绪',
    'canvas.camOn': '开启隔空操作',
    'canvas.camOff': '关闭隔空操作',
    'canvas.hudTitle': 'HUD 手势侦测',
  },
  en: {
    'app.title': 'Waveform',
    'app.subtitle': 'Interactive Light-Wave Synthesizer',
    'app.settings': 'Settings',
    'app.howToPlay': 'How to Play',

    'settings.title': 'Configuration',
    'settings.basic': 'Basic Setup',
    'settings.advanced': 'Advanced Settings',
    'settings.camMode': 'Camera Motion Mode',
    'settings.camModeDesc': 'Requires webcam permission',
    'settings.touchMode': 'Touch & Cursor Mode',
    'settings.touchModeDesc': 'Use mouse or touch pad',
    'settings.handSetup': 'Hand Tracking & Mapping',
    'settings.setupStandard': 'Standard',
    'settings.setupStandardDesc': 'Left: Pitch, Right: Volume (Recommended)',
    'settings.setupInverse': 'Inverse',
    'settings.setupInverseDesc': 'Left: Volume, Right: Pitch',
    'settings.setupSingle': 'Single Hand',
    'settings.setupSingleDesc': 'One hand controls Pitch(X) and Volume(Y)',
    'settings.mapping': 'Live Interaction Mapping',
    'settings.setupStandardText': 'Standard setup mimics traditional theremin acoustics, placing pitch sensitivity on the lateral direction of screen movement for authentic frequency tracking.',
    'settings.reset': 'Reset Defaults',
    'settings.timbre': 'Timbre Waveform',
    'settings.timbreDesc': 'Base Texture Sound',
    'settings.timbreSine': 'Sine (Pure Water)',
    'settings.timbreTriangle': 'Triangle (Warm Classic)',
    'settings.timbreSawtooth': 'Sawtooth (Bright Sweeps)',
    'settings.timbreSquare': 'Square (Retro Digital)',
    'settings.primaryKey': 'Primary Key',
    'settings.keyLabel': 'Key',
    'settings.baseOctave': 'Base Octave',
    'settings.octave2': '2 - Bass (Deep Drone)',
    'settings.octave3': '3 - Baritone (Recommended)',
    'settings.octave4': '4 - Standard (Audio Standard)',
    'settings.octave5': '5 - Soprano (Cosmic Whistle)',
    'settings.scale': 'Active Scale Tuning',
    'settings.scaleChromatic': 'Chromatic (Free Slide)',
    'settings.scaleMajor': 'Major Scale',
    'settings.scaleMinor': 'Natural Minor Scale',
    'settings.scalePentatonic': 'Pentatonic Scale (Zen)',
    'settings.tuningActive': 'Tuning Active',
    'settings.tuningDesc': 'Scale correction is ON. As you move, the frequency locks onto harmonic intervals.',
    'settings.vibrato': 'Vibrato Dynamics (LFO)',
    'settings.speed': 'Speed:',
    'settings.depth': 'Depth:',
    'settings.nebular': 'Nebular Sound FX',
    'settings.echo': 'Stereo Echo Delay',
    'settings.time': 'Time:',
    'settings.feedback': 'Feedback:',
    'settings.reverb': 'Space Reverb',
    'settings.mix': 'Space Mix:',
    'settings.dynamics': 'Dynamics Settings',
    'settings.sensitivity': 'Gesture Tracking Sensitivity',
    'settings.smoothing': 'Frequency Glide Smoothing',
    'settings.pitchResponse': 'Pitch Response Slope',
    'settings.pitchResponseDesc': 'Logarithmic fits human hearing, Linear offers rapid leaps',
    
    'tutorial.title': 'How to Play',
    'tutorial.step1': 'Allow Camera Access',
    'tutorial.step1Desc': 'AetherWave uses your webcam for tracking and ambient visuals. All feeds are processed locally in your browser; no video is ever uploaded or saved.',
    'tutorial.step2': 'Cursor & Gestures',
    'tutorial.step2Desc': 'Move your mouse/touch across the screen area to start modulating sound waves. The visual canvas serves as your primary expression board.',
    'tutorial.step3': 'Wave Controls',
    'tutorial.step3Desc': 'The X-axis influences Resonance (Pitch). The Y-axis controls Volume (Aura expression). Closer proximity increases signal intensity.',
    'tutorial.step4': 'Shape your sound',
    'tutorial.step4Desc': 'Adjust delay and reverb effects using the advanced settings to change the tonal acoustics. Tweak base scales and settings for automated harmonics!',
    'tutorial.begin': 'Start',

    'canvas.pitch': 'Resonance Pitch',
    'canvas.volume': 'Aura Volume',
    'canvas.timbreTitle': 'TIMBRE',
    'canvas.resonanceTitle': 'RESONANCE',
    'canvas.auraLevelTitle': 'AURA LEVEL',
    'canvas.camReady': 'Webcam Active. Ready.',
    'canvas.camAccessing': 'Accessing visual sensors...',
    'canvas.camMove': 'Move hands within sight...',
    'canvas.playCam': 'Play via Camera',
    'canvas.dormant': 'System is currently dormant...',
    'canvas.dormantSub': 'Click to ignite the starstream',
    'canvas.unleash': 'Unleash Synthesizer',
    'canvas.camLock': 'HANDS LOCKED • CLASSIC',
    'canvas.camSingle': 'SINGLE HAND • PITCH & VOL',
    'canvas.camWait': 'WAVE IN AIR • READY',
    'canvas.camOn': 'Cam On',
    'canvas.camOff': 'Cam Off',
    'canvas.hudTitle': 'HUD MOTION CAM',
  }
};

export const LanguageContext = createContext<LanguageContextType>({
  language: 'zh',
  setLanguage: () => {},
  t: () => '',
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('zh');

  const t = (key: string) => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
