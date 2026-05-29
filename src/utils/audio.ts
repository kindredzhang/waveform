/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TimbreType, ScaleType, PitchResponseMode } from '../types';

export const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const SCALES: Record<ScaleType, number[]> = {
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9]
};

// Map MIDI note to frequency
export function midiToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

// Map frequency to MIDI note
export function freqToMidi(freq: number): number {
  return 12 * Math.log2(freq / 440) + 69;
}

// Limit frequency checks
const MIN_FREQ = 60;
const MAX_FREQ = 2000;

export class AudioEngine {
  public ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  private isPlaying = false;

  // Effects and LFO parameters
  private vibratoEnabled = false;
  private vibratoSpeed = 6; // Hz
  private vibratoDepth = 35; // cents
  private vibratoLfo: OscillatorNode | null = null;
  private vibratoGain: GainNode | null = null;

  private delayEnabled = false;
  private delayTime = 0.4; // 400ms -> 0.4s
  private delayFeedbackAmount = 0.45; // 45%
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private delayGain: GainNode | null = null;

  private reverbEnabled = false;
  private reverbMix = 0.3; // 30%
  private reverbGain: GainNode | null = null;
  private revDelays: DelayNode[] = [];
  private revFeedback: GainNode[] = [];

  // Cache settings
  private timbre: TimbreType = 'triangle';
  private scale: ScaleType = 'major';
  private primaryKey = 'C';
  private baseOctave = 3;
  private responseMode: PitchResponseMode = 'log';

  constructor() {
    // Lazy initialized on play/user gesture
  }

  public init() {
    if (this.ctx) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      // Gain node for expressive volume control
      this.gain = this.ctx.createGain();
      this.gain.gain.setValueAtTime(0, this.ctx.currentTime);

      // Analyser node for gorgeous real-time canvas visualizers
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512;

      // DELAY EFFECTS RACK
      this.delayNode = this.ctx.createDelay(2.0);
      this.delayFeedback = this.ctx.createGain();
      this.delayGain = this.ctx.createGain();

      // Configure Delay Feedback loop
      this.delayNode.connect(this.delayFeedback);
      this.delayFeedback.connect(this.delayNode);

      // Connect Delay Dry/Wet path
      this.delayNode.connect(this.delayGain);

      // REVERB EFFECTS RACK (Algorithmic Space feedback network with prime delays)
      this.reverbGain = this.ctx.createGain();
      const delayTimes = [0.029, 0.037, 0.043];
      this.revDelays = delayTimes.map(() => this.ctx!.createDelay(1.0));
      this.revFeedback = delayTimes.map(() => this.ctx!.createGain());

      this.revDelays.forEach((d, i) => {
        d.delayTime.setValueAtTime(delayTimes[i], this.ctx!.currentTime);
        this.revFeedback[i].gain.setValueAtTime(0.70, this.ctx!.currentTime); // Reverb tail density
        
        // Loop back
        d.connect(this.revFeedback[i]);
        this.revFeedback[i].connect(d);

        // Mix output
        d.connect(this.reverbGain!);
      });

      // --- ASSEMBLE EFFECTS GRAPH ---
      // Direct Dry output passing through gain (volume gesture control)
      this.gain.connect(this.analyser);

      // Feed gain into delay and reverb
      this.gain.connect(this.delayNode);
      this.revDelays.forEach(d => {
        this.gain!.connect(d);
      });

      // Connect effects back into main analyser
      this.delayGain.connect(this.analyser);
      this.reverbGain.connect(this.analyser);

      // Destination output
      this.analyser.connect(this.ctx.destination);

      // Force-apply initial/cached state to the nodes
      this.applyEffectsInternal();

    } catch (e) {
      console.error('Failed to initialize AudioContext with effects rack', e);
    }
  }

  public startOscillator() {
    this.init();
    if (!this.ctx || this.isPlaying) return;

    try {
      this.osc = this.ctx.createOscillator();
      this.osc.type = this.timbre;
      this.osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      
      // Setup dynamic Vibrato LFO if enabled
      if (this.vibratoEnabled) {
        this.vibratoLfo = this.ctx.createOscillator();
        this.vibratoGain = this.ctx.createGain();
        this.vibratoLfo.frequency.setValueAtTime(this.vibratoSpeed, this.ctx.currentTime);
        
        // Cents depth converted to Hz mapping
        const depthHz = 440 * (Math.pow(2, this.vibratoDepth / 1200) - 1);
        this.vibratoGain.gain.setValueAtTime(depthHz, this.ctx.currentTime);
        
        this.vibratoLfo.connect(this.vibratoGain);
        this.vibratoGain.connect(this.osc.frequency);
        this.vibratoLfo.start();
      }

      // Connect oscillator to express volume gain node
      this.osc.connect(this.gain!);
      this.osc.start();
      this.isPlaying = true;

      // Resume context if suspended (browser behavior)
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {
      console.error('Failed to start oscillator', e);
    }
  }

  public stopOscillator() {
    if (!this.isPlaying || !this.osc) return;
    try {
      // Fade out to prevent clicking
      if (this.gain && this.ctx) {
        this.gain.gain.setValueAtTime(this.gain.gain.value, this.ctx.currentTime);
        this.gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.05);
      }

      const oscToStop = this.osc;
      const lfoToStop = this.vibratoLfo;
      const vibratoGainToDisconnect = this.vibratoGain;

      this.osc = null;
      this.vibratoLfo = null;
      this.vibratoGain = null;
      this.isPlaying = false;

      setTimeout(() => {
        try {
          oscToStop.stop();
          oscToStop.disconnect();
          
          if (lfoToStop) {
            lfoToStop.stop();
            lfoToStop.disconnect();
          }

          if (vibratoGainToDisconnect) {
            vibratoGainToDisconnect.disconnect();
          }
        } catch (err) {
          // Ignore state error if already disconnected
        }
      }, 60);
    } catch (e) {
      console.error('Error stopping oscillator', e);
    }
  }

  public updateParameters(freq: number, volume: number) {
    if (!this.ctx) return;
    this.startOscillator();

    // Clamp values
    const targetFreq = Math.max(MIN_FREQ, Math.min(MAX_FREQ, freq));
    const targetVol = Math.max(0, Math.min(1, volume));

    // Expressive scale quantization
    const finalFreq = this.quantizeFrequency(targetFreq);

    if (this.osc && this.gain) {
      // Smooth frequency transitions to emulate theremin slide
      this.osc.frequency.setTargetAtTime(finalFreq, this.ctx.currentTime, 0.06);
      
      // Smooth volume transition to dodge audio pops
      this.gain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.04);

      // Dynamically update vibrato scale depth based on actual current pitch
      if (this.vibratoEnabled && this.vibratoGain) {
        const depthHz = finalFreq * (Math.pow(2, this.vibratoDepth / 1200) - 1);
        this.vibratoGain.gain.setTargetAtTime(depthHz, this.ctx.currentTime, 0.05);
      }
    }

    return { freq: finalFreq, vol: targetVol };
  }

  public setTimbre(timbre: TimbreType) {
    this.timbre = timbre;
    if (this.osc) {
      this.osc.type = timbre;
    }
  }

  public setScaleSettings(scale: ScaleType, primaryKey: string, baseOctave: number, mode: PitchResponseMode) {
    this.scale = scale;
    this.primaryKey = primaryKey;
    this.baseOctave = baseOctave;
    this.responseMode = mode;
  }

  public setEffectsSettings(effects: {
    vibratoEnabled: boolean;
    vibratoSpeed: number;
    vibratoDepth: number;
    delayEnabled: boolean;
    delayTime: number; // ms
    delayFeedback: number; // percentage
    reverbEnabled: boolean;
    reverbMix: number; // percentage
  }) {
    this.vibratoEnabled = effects.vibratoEnabled;
    this.vibratoSpeed = effects.vibratoSpeed;
    this.vibratoDepth = effects.vibratoDepth;
    this.delayEnabled = effects.delayEnabled;
    this.delayTime = effects.delayTime / 1000; // ms to seconds
    this.delayFeedbackAmount = effects.delayFeedback / 100; // percentage to ratio
    this.reverbEnabled = effects.reverbEnabled;
    this.reverbMix = effects.reverbMix / 100; // percentage to ratio

    this.applyEffectsInternal();
  }

  private applyEffectsInternal() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Apply Delayed Sound parameters
    if (this.delayNode) {
      const clampedSec = Math.max(0.01, Math.min(2.0, this.delayTime));
      this.delayNode.delayTime.setTargetAtTime(clampedSec, now, 0.1);
    }

    if (this.delayFeedback) {
      const fbVal = this.delayEnabled ? Math.max(0, Math.min(0.95, this.delayFeedbackAmount)) : 0;
      this.delayFeedback.gain.setTargetAtTime(fbVal, now, 0.1);
    }

    if (this.delayGain) {
      const mixVal = this.delayEnabled ? 0.6 : 0;
      this.delayGain.gain.setTargetAtTime(mixVal, now, 0.1);
    }

    // Apply Reverb parameters
    if (this.reverbGain) {
      const mixVal = this.reverbEnabled ? Math.max(0, Math.min(0.95, this.reverbMix)) : 0;
      this.reverbGain.gain.setTargetAtTime(mixVal, now, 0.1);
    }

    // Live update Vibrato speed if active
    if (this.vibratoLfo && this.vibratoEnabled) {
      this.vibratoLfo.frequency.setTargetAtTime(this.vibratoSpeed, now, 0.1);
    }
  }

  public getAnalyserData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  // Calculate quantized frequency based on the configured key, scale, and base octave.
  private quantizeFrequency(rawFreq: number): number {
    if (this.scale === 'chromatic') {
      return rawFreq; // Keep it perfectly slidey for standard chromatic performance
    }

    // Find the relative key index (0 to 11)
    const keyIndex = KEYS.indexOf(this.primaryKey);
    const scaleMap = SCALES[this.scale];

    // Find raw MIDI note
    const rawMidi = freqToMidi(rawFreq);

    // Filter MIDI notes to match only notes in our scale & key
    // Calculate octave range for scale mapping
    // Let's find the nearest valid semitone
    const rawMidiRounded = Math.round(rawMidi);
    
    // Deconstruct raw MIDI into octave and semitone
    const midiRelative = (rawMidiRounded - keyIndex) % 12;
    const midiOctave = Math.floor((rawMidiRounded - keyIndex) / 12);
    
    // Normalized semitone relative to key (0 - 11)
    const normalizedRelative = midiRelative < 0 ? midiRelative + 12 : midiRelative;

    // Find the closest allowed note in the scale semitones
    let closestRelative = scaleMap[0];
    let minDiff = 12;

    for (const allowedRelative of scaleMap) {
      const diff = Math.min(
        Math.abs(allowedRelative - normalizedRelative),
        Math.abs(allowedRelative - normalizedRelative - 12),
        Math.abs(allowedRelative - normalizedRelative + 12)
      );
      if (diff < minDiff) {
        minDiff = diff;
        closestRelative = allowedRelative;
      }
    }

    // Standard adjustments for octave rollover
    let finalOctave = midiOctave;
    if (closestRelative - normalizedRelative > 6) {
      finalOctave -= 1;
    } else if (normalizedRelative - closestRelative > 6) {
      finalOctave += 1;
    }

    // Reconstruct valid midi note
    const quantizedMidi = (finalOctave * 12) + closestRelative + keyIndex;
    
    // Clamp to reasonable theremin range
    const clampedMidi = Math.max(12, Math.min(127, quantizedMidi));
    return midiToFreq(clampedMidi);
  }
}

export const globalAudioEngine = new AudioEngine();
