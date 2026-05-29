/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TimbreType = 'sine' | 'triangle' | 'sawtooth' | 'square';

export type PitchResponseMode = 'log' | 'lin';

export type ScaleType = 'chromatic' | 'major' | 'minor' | 'pentatonic';

export type ControlHandType = 'pitch' | 'volume';

export interface ThereminSettings {
  handSetup: 'standard' | 'southpaw'; // standard: Right = Pitch, Left = Volume
  scale: ScaleType;
  primaryKey: string;
  baseOctave: number;
  sensitivity: number; // 1 - 100
  smoothing: number; // 1 - 100
  responseMode: PitchResponseMode;
  timbre: TimbreType;
  vibratoEnabled: boolean;
  vibratoSpeed: number; // Hz
  vibratoDepth: number; // cents
  delayEnabled: boolean;
  delayTime: number; // ms
  delayFeedback: number; // %
  reverbEnabled: boolean;
  reverbMix: number; // %
}

