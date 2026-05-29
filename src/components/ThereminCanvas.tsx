/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, PointerEvent } from 'react';
import { motion } from 'motion/react';
import { Camera, CameraOff, Sparkles, Wand2 } from 'lucide-react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { ThereminSettings, TimbreType } from '../types';
import { globalAudioEngine } from '../utils/audio';
import { useLanguage } from '../contexts/LanguageContext';

interface ThereminCanvasProps {
  settings: ThereminSettings;
  timbre: TimbreType;
  onUpdateParams: (frequency: number, volume: number) => void;
  isActivated: boolean;
  onActivate: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: string;
}

interface WebRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

export default function ThereminCanvas({
  settings,
  timbre,
  onUpdateParams,
  isActivated,
  onActivate
}: ThereminCanvasProps) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isPointerIn, setIsPointerIn] = useState(false);
  const isPointerDownRef = useRef(false);

  // Interaction coordinates representing active position
  const pointerPosRef = useRef({ x: 0.5, y: 0.5 });
  const isPointerInRef = useRef(false);
  const [lastAssignedFreq, setLastAssignedFreq] = useState(432);

  // Webcam tracking states
  const [leftCentroid, setLeftCentroid] = useState<{ x: number; y: number } | null>(null);
  const [rightCentroid, setRightCentroid] = useState<{ x: number; y: number } | null>(null);
  const [motionActive, setMotionActive] = useState(false);

  // Tracking details stored in refs for low-latency audio sync
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const leftHandRef = useRef({ x: 0.25, y: 0.5, active: false, ticksSinceLastMotion: 100 });
  const rightHandRef = useRef({ x: 0.75, y: 0.5, active: false, ticksSinceLastMotion: 100 });

  // Visual assets / particles lists
  const particles = useRef<Particle[]>([]);
  const ripples = useRef<WebRipple[]>([]);
  const pointerTrail = useRef<{ x: number; y: number }[]>([]);

  // Initialize MediaPipe HandLandmarker
  useEffect(() => {
    let active = true;
    const initMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                delegate: "GPU"
            },
            runningMode: "VIDEO",
            numHands: 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        if (active) {
            handLandmarkerRef.current = handLandmarker;
        } else {
            handLandmarker.close();
        }
      } catch (e) {
        console.error("Failed to initialize mediapipe:", e);
      }
    };
    initMediaPipe();
    
    return () => {
      active = false;
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
        handLandmarkerRef.current = null;
      }
    };
  }, []);

  // Get color themes corresponding to active timbre
  const getThemeColor = (isAlpha = false, opacity = 1) => {
    switch (timbre) {
      case 'sine':
        return isAlpha ? `rgba(96, 165, 250, ${opacity})` : '#60a5fa'; // Blue
      case 'sawtooth':
        return isAlpha ? `rgba(52, 211, 153, ${opacity})` : '#34d399'; // Green
      case 'square':
        return isAlpha ? `rgba(251, 146, 60, ${opacity})` : '#fb923c'; // Orange
      case 'triangle':
      default:
        return isAlpha ? `rgba(206, 189, 255, ${opacity})` : '#cebdff'; // Purple/Violet
    }
  };

  const getSecondaryColor = (isAlpha = false, opacity = 1) => {
    return isAlpha ? `rgba(68, 226, 205, ${opacity})` : '#44e2cd'; // Seafoam / Secondary
  };

  // Setup / release camera stream
  useEffect(() => {
    if (cameraActive) {
      navigator.mediaDevices
        .getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' } })
        .then((s) => {
          setStream(s);
          setCameraError(null);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(console.error);
          }
        })
        .catch((err) => {
          console.error('Camera access denied or failed', err);
          setCameraError('Camera blocked or unavailable.');
          setCameraActive(false);
        });
    } else {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraActive]);

  // Handle live motion tracking frame comparison
  useEffect(() => {
    if (!cameraActive || !stream) {
      setLeftCentroid(null);
      setRightCentroid(null);
      setMotionActive(false);
      return;
    }

    let active = true;
    let lastVideoTime = -1;

    const updateTracking = () => {
      if (!active) return;
      const video = videoRef.current;
      const handLandmarker = handLandmarkerRef.current;

      if (video && handLandmarker && video.readyState >= 2) {
        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          let nowInMs = performance.now();
          const results = handLandmarker.detectForVideo(video, nowInMs);

          // Default smoothing = 40% -> smoothFactor = ~0.13
          const smoothFactor = 0.5 * Math.pow(0.04, settings.smoothing / 100);

          let detectedLeftHand: {x: number, y: number} | null = null;
          let detectedRightHand: {x: number, y: number} | null = null;

          if (results.landmarks && results.landmarks.length > 0) {
            for (let i = 0; i < results.landmarks.length; i++) {
              const landmarks = results.landmarks[i];
              // Middle finger MCP is a stable point
              const centroid = landmarks[9];
              // MediaPipe gives coordinates relative to original un-mirrored frame
               // video is mirrored via css scale-x-[-1]
              const handX = 1 - centroid.x;
              const handY = centroid.y;
              
              if (handX < 0.5) {
                detectedLeftHand = { x: handX, y: handY };
              } else {
                detectedRightHand = { x: handX, y: handY };
              }
            }
          }

          // 2. Process LEFT Zone hand
          if (detectedLeftHand) {
            // Normalize left hand x to 0.0-1.0 within left zone
            const targetLX = detectedLeftHand.x / 0.5;
            const targetLY = detectedLeftHand.y;
            
            leftHandRef.current.x += (targetLX - leftHandRef.current.x) * smoothFactor;
            leftHandRef.current.y += (targetLY - leftHandRef.current.y) * smoothFactor;
            leftHandRef.current.ticksSinceLastMotion = 0;
            leftHandRef.current.active = true;
            setLeftCentroid({ x: detectedLeftHand.x, y: detectedLeftHand.y });
          } else {
            leftHandRef.current.ticksSinceLastMotion++;
          }

          // 3. Process RIGHT Zone hand
          if (detectedRightHand) {
            // Normalize right hand x to 0.0-1.0 within right zone
            const targetRX = (detectedRightHand.x - 0.5) / 0.5;
            const targetRY = detectedRightHand.y;
            
            rightHandRef.current.x += (targetRX - rightHandRef.current.x) * smoothFactor;
            rightHandRef.current.y += (targetRY - rightHandRef.current.y) * smoothFactor;
            rightHandRef.current.ticksSinceLastMotion = 0;
            rightHandRef.current.active = true;
            setRightCentroid({ x: detectedRightHand.x, y: detectedRightHand.y });
          } else {
            rightHandRef.current.ticksSinceLastMotion++;
          }

          // 4. Persistence, Hold-Sustain, and Decoupled Decay Control
          const maxHoldTicks = 20; // ~330ms
          const fadeoutDuration = 15; // ~250ms

          // Apply Left Hand activity flag and decay multiplier
          let leftActive = false;
          let leftVolMult = 0;
          if (leftHandRef.current.ticksSinceLastMotion < maxHoldTicks + fadeoutDuration) {
            leftActive = true;
            if (leftHandRef.current.ticksSinceLastMotion < maxHoldTicks) {
              leftVolMult = 1.0;
            } else {
              // Smoothly fade out sound during decay to prevent clips or sudden silence
              leftVolMult = 1.0 - (leftHandRef.current.ticksSinceLastMotion - maxHoldTicks) / fadeoutDuration;
            }
          } else {
            setLeftCentroid(null);
          }
          leftHandRef.current.active = leftActive;

          // Apply Right Hand activity flag and decay multiplier
          let rightActive = false;
          let rightVolMult = 0;
          if (rightHandRef.current.ticksSinceLastMotion < maxHoldTicks + fadeoutDuration) {
            rightActive = true;
            if (rightHandRef.current.ticksSinceLastMotion < maxHoldTicks) {
              rightVolMult = 1.0;
            } else {
              rightVolMult = 1.0 - (rightHandRef.current.ticksSinceLastMotion - maxHoldTicks) / fadeoutDuration;
            }
          } else {
            setRightCentroid(null);
          }
          rightHandRef.current.active = rightActive;

          // Determine overall Motion Active state
          setMotionActive(leftActive || rightActive);

          // 5. Synthesis Parameters Selection based on Active Hand Layout
          if (isActivated) {
            if (leftActive && rightActive) {
              // --- DOUBLE HAND MODE ---
              const isStandard = settings.handSetup === 'standard';

              // Standard: Left controls volume, Right controls pitch
              // Southpaw: Right controls volume, Left controls pitch
              const activeVolumeRatio = isStandard
                ? (1 - leftHandRef.current.y) * leftVolMult
                : (1 - rightHandRef.current.y) * rightVolMult;

              const activePitchRatio = isStandard
                ? rightHandRef.current.x
                : leftHandRef.current.x;

              const rootOctaveFreq = 65.4 * Math.pow(2, settings.baseOctave - 2);
              const minFreq = rootOctaveFreq;
              const maxFreq = minFreq * 10;

              let targetFreq = 440;
              if (settings.responseMode === 'log') {
                targetFreq = minFreq * Math.pow(maxFreq / minFreq, activePitchRatio);
              } else {
                targetFreq = minFreq + (maxFreq - minFreq) * activePitchRatio;
              }

              globalAudioEngine.startOscillator();
              const finalParam = globalAudioEngine.updateParameters(targetFreq, activeVolumeRatio);
              if (finalParam) {
                onUpdateParams(finalParam.freq, finalParam.vol);
                setLastAssignedFreq(finalParam.freq);
                pointerPosRef.current = {
                  x: activePitchRatio,
                  y: 1 - activeVolumeRatio
                };
                setIsPointerIn(true);
                isPointerInRef.current = true;
              }
            } else if (leftActive) {
              // --- SINGLE HAND MODE (LEFT) ---
              // The Single left hand controls BOTH pitch (X coordinate) and volume (Y coordinate)
              const activeVolumeRatio = (1 - leftHandRef.current.y) * leftVolMult;
              const activePitchRatio = leftHandRef.current.x;

              const rootOctaveFreq = 65.4 * Math.pow(2, settings.baseOctave - 2);
              const minFreq = rootOctaveFreq;
              const maxFreq = minFreq * 10;

              let targetFreq = 440;
              if (settings.responseMode === 'log') {
                targetFreq = minFreq * Math.pow(maxFreq / minFreq, activePitchRatio);
              } else {
                targetFreq = minFreq + (maxFreq - minFreq) * activePitchRatio;
              }

              globalAudioEngine.startOscillator();
              const finalParam = globalAudioEngine.updateParameters(targetFreq, activeVolumeRatio);
              if (finalParam) {
                onUpdateParams(finalParam.freq, finalParam.vol);
                setLastAssignedFreq(finalParam.freq);
                pointerPosRef.current = {
                  x: activePitchRatio,
                  y: 1 - activeVolumeRatio
                };
                setIsPointerIn(true);
                isPointerInRef.current = true;
              }
            } else if (rightActive) {
              // --- SINGLE HAND MODE (RIGHT) ---
              // The Single right hand controls BOTH pitch (X coordinate) and volume (Y coordinate)
              const activeVolumeRatio = (1 - rightHandRef.current.y) * rightVolMult;
              const activePitchRatio = rightHandRef.current.x;

              const rootOctaveFreq = 65.4 * Math.pow(2, settings.baseOctave - 2);
              const minFreq = rootOctaveFreq;
              const maxFreq = minFreq * 10;

              let targetFreq = 440;
              if (settings.responseMode === 'log') {
                targetFreq = minFreq * Math.pow(maxFreq / minFreq, activePitchRatio);
              } else {
                targetFreq = minFreq + (maxFreq - minFreq) * activePitchRatio;
              }

              globalAudioEngine.startOscillator();
              const finalParam = globalAudioEngine.updateParameters(targetFreq, activeVolumeRatio);
              if (finalParam) {
                onUpdateParams(finalParam.freq, finalParam.vol);
                setLastAssignedFreq(finalParam.freq);
                pointerPosRef.current = {
                  x: activePitchRatio,
                  y: 1 - activeVolumeRatio
                };
                setIsPointerIn(true);
                isPointerInRef.current = true;
              }
            } else {
              // --- NO HANDS ACTIVE ---
              // Smoothly ramp volume down through the audio engine to zero
              if (isActivated) {
                globalAudioEngine.updateParameters(lastAssignedFreq, 0);
                onUpdateParams(lastAssignedFreq, 0);
              }
            }
          }
        }
      }

      animFrame = requestAnimationFrame(updateTracking);
    };

    let animFrame = requestAnimationFrame(updateTracking);

    return () => {
      active = false;
      cancelAnimationFrame(animFrame);
    };
  }, [cameraActive, stream, isActivated, settings, lastAssignedFreq]);

  // Handle Canvas Animation and Resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;

    const resizeCanvas = () => {
      const parent = containerRef.current;
      if (parent && canvas) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Main visual loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw elegant background web/grid coordinates
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      const step = 60;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw standard guide line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1.5;
      
      // Vertical guide representing active pointer X
      const curX = pointerPosRef.current.x * canvas.width;
      const curY = pointerPosRef.current.y * canvas.height;

      if (isPointerInRef.current) {
        // Horizontal Volume Guide
        ctx.beginPath();
        ctx.setLineDash([4, 6]);
        ctx.moveTo(0, curY);
        ctx.lineTo(canvas.width, curY);
        ctx.stroke();

        // Vertical Pitch Guide
        ctx.beginPath();
        ctx.moveTo(curX, 0);
        ctx.lineTo(curX, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 2. Process and draw ripples
      const activeRipples = ripples.current;
      for (let i = activeRipples.length - 1; i >= 0; i--) {
        const r = activeRipples[i];
        r.radius += (r.maxRadius - r.radius) * 0.06;
        r.alpha -= 0.015;

        if (r.alpha <= 0 || r.radius >= r.maxRadius - 2) {
          activeRipples.splice(i, 1);
          continue;
        }

        ctx.strokeStyle = getSecondaryColor(true, r.alpha);
        ctx.lineWidth = 2;
        ctx.shadowColor = getSecondaryColor(true, r.alpha * 0.5);
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset shadow
      }

      // 3. Process and draw floating cosmic particles
      const activeParticles = particles.current;
      // Spawn new particles randomly when moving cursor active
      if (isPointerInRef.current && Math.random() < 0.25) {
        activeParticles.push({
          x: curX + (Math.random() - 0.5) * 40,
          y: curY + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5 - 0.4,
          radius: Math.random() * 3 + 1,
          alpha: 1.0,
          color: Math.random() > 0.4 ? getThemeColor() : getSecondaryColor()
        });
      }

      for (let i = activeParticles.length - 1; i >= 0; i--) {
        const p = activeParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.01;

        if (p.alpha <= 0) {
          activeParticles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // 4. Paint the gorgeous Real-Time fluid water-wave visualization across center stage
      const analyserData = globalAudioEngine.getAnalyserData();
      
      let currentAmplitude = 0.05; // Base ambient amplitude
      if (isPointerInRef.current && analyserData.length > 0) {
        // Calculate RMS of analyser data to get a stable, smooth volume envelope instead of noisy waveforms
        let sumSquares = 0;
        for(let i=0; i<analyserData.length; i++) {
          const val = (analyserData[i] - 128) / 128.0;
          sumSquares += val * val;
        }
        const rms = Math.sqrt(sumSquares / analyserData.length);
        currentAmplitude = Math.min(1.0, Math.max(0.1, rms * 4.0)); // Scale to 0~1 smoothly
      }

      // We always draw the mathematical wave instead of relying entirely on raw analyser fallback
      if (true) {
        const time = performance.now() * 0.001;
        
        // Determine wave density and speed based on the pitch
        // (Using log scale mapping of frequency for linear feeling of pitch height)
        const pitchRatio = lastAssignedFreq > 0 ? Math.log2(lastAssignedFreq / 110) : 1; 
        const waveSpeed = 0.4 + pitchRatio * 0.2; // Slower rhythmic speed (e.g. 0.4 to ~1.2)
        const waveCount = 1.0 + pitchRatio * 0.4; // Less dense waves for elegance

        const numLayers = 3;
        for (let l = 0; l < numLayers; l++) {
          ctx.beginPath();
          ctx.lineWidth = 3 - l * 0.5;
          const alphaFade = isPointerInRef.current 
            ? (0.7 - l * 0.2) * Math.max(0.4, currentAmplitude) 
            : (0.2 - l * 0.05);

          ctx.strokeStyle = getThemeColor(true, alphaFade);
          
          if (l === 0) {
            ctx.shadowColor = getThemeColor(true, isPointerInRef.current ? 0.6 : 0.1);
            ctx.shadowBlur = isPointerInRef.current ? 15 + currentAmplitude * 10 : 0;
          } else {
            ctx.shadowBlur = 0;
          }

          const maxAmpPx = (canvas.height * 0.25) * currentAmplitude * (1.0 - l * 0.15);
          const phaseOffset = time * waveSpeed + (l * Math.PI * 0.4); // Offset each wave layer temporally

          for (let x = 0; x <= canvas.width; x += 5) {
            const nx = x / canvas.width; // Normalized X (0.0 to 1.0)
            
            // Taper the edges so the wave starts and ends smoothly at center Y
            const envelope = Math.sin(nx * Math.PI); 
            
            // Superposition of a few slow sine waves for fluid motion
            const w1 = Math.sin(nx * Math.PI * waveCount * 2.0 + phaseOffset) * 0.5;
            const w2 = Math.sin(nx * Math.PI * waveCount * 1.3 - phaseOffset * 0.7) * 0.3;
            const w3 = Math.sin(nx * Math.PI * waveCount * 0.8 + phaseOffset * 1.1) * 0.2;

            const compositeWave = w1 + w2 + w3;
            const y = (canvas.height / 2) + compositeWave * maxAmpPx * envelope;

            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }
        ctx.shadowBlur = 0; // Reset
      } else {
        // Fallback ambient horizontal wave line when sound engine is inactive
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      }

      // 5. Draw the active floating cursor hub dot
      if (isPointerInRef.current) {
        ctx.fillStyle = getSecondaryColor();
        ctx.shadowColor = getSecondaryColor(true, 0.6);
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(curX, curY, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(curX, curY, 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      animFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animFrame);
    };
  }, [timbre]);

  // Handle interaction / coordinates mapping
  const handleInteraction = (clientX: number, clientY: number, shouldPlaySound: boolean) => {
    const parent = containerRef.current;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const xRaw = (clientX - rect.left) / rect.width;
    const yRaw = (clientY - rect.top) / rect.height;

    const clampedX = Math.max(0, Math.min(1, xRaw));
    const clampedY = Math.max(0, Math.min(1, yRaw));

    pointerPosRef.current = { x: clampedX, y: clampedY };

    if (!isActivated) return;

    // Call update parameters only if shouldPlaySound is true
    if (shouldPlaySound) {
      // Apply sensitivity mapping
      const trackingSensitivity = settings.sensitivity / 100;
      const sensitivityOffset = (1 - trackingSensitivity) / 2;
      
      // Scale tracking inputs according to user's alignment
      let relativeX = (clampedX - sensitivityOffset) / trackingSensitivity;
      let relativeY = (clampedY - sensitivityOffset) / trackingSensitivity;

      relativeX = Math.max(0, Math.min(1, relativeX));
      relativeY = Math.max(0, Math.min(1, relativeY));

      // Determine Standard vs Southpaw variables layout
      // standard: X = Pitch, Y = Volume
      // southpaw: Y = Pitch, X = Volume
      const isStandard = settings.handSetup === 'standard';
      const pitchRatio = isStandard ? relativeX : relativeY;
      const volumeRatio = isStandard ? 1 - relativeY : 1 - relativeX; // top margin of screen is max volume (inverted)

      // Calculate Frequencies base on Octave and Response slope
      // Base frequency calculations: Octave C3 = ~130Hz, C4 = ~261Hz, C5 = ~523Hz, C2 = ~65Hz
      const rootOctaveFreq = 65.4 * Math.pow(2, settings.baseOctave - 2);
      
      // Expand a 4-octave span upwards
      const minFreq = rootOctaveFreq;
      const maxFreq = minFreq * 10;

      let targetFreq = 440;
      if (settings.responseMode === 'log') {
        targetFreq = minFreq * Math.pow(maxFreq / minFreq, pitchRatio);
      } else {
        targetFreq = minFreq + (maxFreq - minFreq) * pitchRatio;
      }

      // Pass parameters to real visual audio nodes
      const finalParam = globalAudioEngine.updateParameters(targetFreq, volumeRatio);
      if (finalParam) {
        onUpdateParams(finalParam.freq, finalParam.vol);
        setLastAssignedFreq(finalParam.freq);
      }
    }

    // Spawn ripples occasionally while moving rapidly
    if (Math.random() < 0.08) {
      ripples.current.push({
        x: clampedX * rect.width,
        y: clampedY * rect.height,
        radius: 10,
        maxRadius: 180 + Math.random() * 100,
        alpha: 0.6,
        color: getSecondaryColor()
      });
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('.pointer-events-auto') ||
      target.closest('button') ||
      target.closest('select') ||
      target.closest('input')
    ) {
      return;
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (ignore) {}
    
    isPointerDownRef.current = true;
    setIsPointerIn(true);
    isPointerInRef.current = true;
    
    if (!isActivated) {
      onActivate();
    }
    
    // Resume audio context
    globalAudioEngine.startOscillator();
    handleInteraction(e.clientX, e.clientY, true);

    // Immediate click ripple effect
    const parent = containerRef.current;
    if (parent) {
      const rect = parent.getBoundingClientRect();
      ripples.current.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        radius: 5,
        maxRadius: 280,
        alpha: 0.8,
        color: getSecondaryColor()
      });
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerIn) {
      setIsPointerIn(true);
    }
    isPointerInRef.current = true;

    const target = e.target as HTMLElement;
    if (
      target.closest('.pointer-events-auto') ||
      target.closest('button') ||
      target.closest('select') ||
      target.closest('input')
    ) {
      // Direct instant fadeout to prevent clicking or loud frequencies from dragging near margins
      if (isActivated && isPointerDownRef.current) {
        globalAudioEngine.updateParameters(lastAssignedFreq, 0);
        onUpdateParams(lastAssignedFreq, 0);
      }
      return;
    }

    handleInteraction(e.clientX, e.clientY, isPointerDownRef.current);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (ignore) {}
    
    isPointerDownRef.current = false;
    
    // Stop sound on release
    globalAudioEngine.stopOscillator();
    onUpdateParams(lastAssignedFreq, 0);
  };

  const handlePointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (ignore) {}

    isPointerDownRef.current = false;
    setIsPointerIn(false);
    isPointerInRef.current = false;
    
    // Stop sound when cursor leaves the zone
    globalAudioEngine.stopOscillator();
    onUpdateParams(lastAssignedFreq, 0);
  };

  const toggleWebcam = () => {
    setCameraActive(!cameraActive);
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      className="absolute inset-0 z-10 w-full h-full cursor-none overflow-hidden touch-none select-none"
    >
      {/* Background Interactive visual canvas element */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Simulated Video feed placeholder inside glass masked blob container */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div
          className="relative transition-all duration-1000 ease-in-out"
          style={{
            width: isPointerIn ? '65vw' : '55vw',
            height: isPointerIn ? '65vh' : '55vh',
            transform: `scale(${isPointerIn ? 1.05 : 1})`,
            filter: 'blur(35px)',
            opacity: isPointerIn ? 0.75 : 0.45,
            background: `radial-gradient(circle, ${getThemeColor(true, 0.1)} 0%, rgba(5, 20, 36, 0) 70%)`
          }}
        />
      </div>

      {/* Actual Live webcam video preview block */}
      {cameraActive && (
        <div className="absolute top-28 left-6 md:left-12 z-30 pointer-events-auto flex flex-col gap-2 scale-100 origin-top-left transition-transform duration-300">
          <div className="relative w-36 h-36 rounded-full overflow-hidden border border-white/10 shadow-lg bg-black/40 backdrop-blur-md flex items-center justify-center">
            <video
              ref={videoRef}
              muted
              playsInline
              className="w-full h-full object-cover scale-x-[-1]" // mirror effect
            />
            {/* Ambient visual overlay inside camera grid */}
            <div
              className="absolute inset-0 mix-blend-color-dodge opacity-50 pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${getThemeColor(true, 0.25)} 0%, rgba(0,0,0,0) 80%)`
              }}
            />

            {/* Micro computer vision hand tracking feedback indicators */}
            {leftCentroid && (
              <div
                className="absolute w-4 h-4 rounded-full bg-[#cebdff] border border-white shadow-[0_0_10px_#cebdff] pointer-events-none"
                style={{
                  left: `${leftCentroid.x * 100}%`,
                  top: `${leftCentroid.y * 100}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              />
            )}
            {rightCentroid && (
              <div
                className="absolute w-4 h-4 rounded-full bg-[#44e2cd] border border-white shadow-[0_0_10px_#44e2cd] pointer-events-none"
                style={{
                  left: `${rightCentroid.x * 100}%`,
                  top: `${rightCentroid.y * 100}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              />
            )}
          </div>
          
          <div className="flex flex-col items-center gap-0.5 select-none bg-slate-950/40 p-1.5 rounded-lg border border-white/5 backdrop-blur-sm max-w-[144px]">
            <span className="font-mono text-[9px] text-[#cac4d4]/60 uppercase tracking-widest text-center">
              {t('canvas.hudTitle')}
            </span>
            <span className="font-mono text-[8.5px] text-[#62fae3] uppercase tracking-wider text-center font-semibold">
              {leftCentroid && rightCentroid 
                  ? t('canvas.camLock')
                  : (leftCentroid || rightCentroid) 
                  ? t('canvas.camSingle') 
                  : t('canvas.camWait')}
            </span>
          </div>
        </div>
      )}

      {/* Active Web camera activation toggle button - bottom right panel relative */}
      <div className="absolute top-28 right-6 md:right-12 z-30 pointer-events-auto flex items-center gap-2">
        {cameraError && (
          <span className="font-sans text-[10px] text-[#ffb4ab] bg-[#93000a]/35 px-2.5 py-1 rounded-full border border-[#ffb4ab]/20">
            {cameraError}
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Stop trigger sound playing on click!
            toggleWebcam();
          }}
          className={`px-4 py-2 rounded-full border text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all ${
            cameraActive
              ? 'bg-[#44e2cd]/10 border-[#44e2cd]/30 text-[#62fae3]'
              : 'bg-white/5 border-white/15 text-[#d4e4fa] hover:bg-white/10'
          }`}
          title="Enable camera stream overlay"
        >
          {cameraActive ? (
            <>
              <Camera className="w-4 h-4 text-[#44e2cd]" />
              {t('canvas.camOn')}
            </>
          ) : (
            <>
              <CameraOff className="w-4 h-4 opacity-70" />
              {t('canvas.camOff')}
            </>
          )}
        </button>
      </div>

      {/* Activation overlay instructions */}
      {!isActivated && (
        <div className="absolute inset-0 z-40 bg-[#051424]/60 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none pointer-events-none">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center gap-4 max-w-md pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              onActivate();
            }}
          >
            <div className="w-16 h-16 rounded-full bg-[#44e2cd]/10 text-[#44e2cd] border border-[#44e2cd]/20 flex items-center justify-center mb-2 animate-bounce">
              <Wand2 className="w-7 h-7" />
            </div>
            <h2 className="font-display-lg text-2xl md:text-3.5xl text-[#d4e4fa] tracking-widest uppercase">
              {t('canvas.dormantSub')}
            </h2>
            <p className="font-sans text-sm text-[#cac4d4] opacity-80 leading-relaxed px-4">
              {t('canvas.dormant')}
            </p>
            <button className="mt-4 px-6 py-2.5 bg-[#44e2cd] text-[#003731] font-mono text-xs uppercase tracking-widest rounded-full font-bold shadow-lg shadow-[#44e2cd]/20 hover:scale-105 transition-transform">
              {t('canvas.unleash')}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
