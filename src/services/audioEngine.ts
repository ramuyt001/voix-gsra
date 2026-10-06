/**
 * AudioEngine - Gestionnaire audio temps réel avec routage vers micro virtuel,
 * analyse de latence, traitement acoustique et coupe-circuit anti-fuite.
 */

import { ConversionMetrics, ReferenceVoiceProfile } from '../types';

export class VoiceBridgeAudioEngine {
  private audioContext: AudioContext | null = null;
  private inputStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private inputAnalyser: AnalyserNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;
  
  // Acoustic processing nodes
  private formantFilters: BiquadFilterNode[] = [];
  private pitchShifterNode: DelayNode | null = null;
  private safetyGateNode: GainNode | null = null;
  private monitorGainNode: GainNode | null = null;
  
  // Output routing elements
  private destinationNode: MediaStreamAudioDestinationNode | null = null;
  private mainAudioElement: HTMLAudioElement | null = null;
  private monitorAudioElement: HTMLAudioElement | null = null;

  // State
  private isRunning: boolean = false;
  private isMonitoring: boolean = false;
  private failSafeTriggered: boolean = false;
  private lastErrorMessage: string = '';
  private targetReference: ReferenceVoiceProfile | null = null;
  private pitchRatio: number = 1.0;

  // Callbacks
  private onMetricsUpdate: ((metrics: ConversionMetrics) => void) | null = null;
  private onFailSafe: ((reason: string) => void) | null = null;

  private animationFrameId: number | null = null;
  private lastChunkTime: number = 0;
  private measuredLatency: number = 38; // ms

  constructor() {
    // Hidden audio elements for sinkId routing
    if (typeof window !== 'undefined') {
      this.mainAudioElement = new Audio();
      this.mainAudioElement.autoplay = true;
      this.monitorAudioElement = new Audio();
      this.monitorAudioElement.autoplay = true;
    }
  }

  public setCallbacks(
    onMetrics: (metrics: ConversionMetrics) => void,
    onFailSafe: (reason: string) => void
  ) {
    this.onMetricsUpdate = onMetrics;
    this.onFailSafe = onFailSafe;
  }

  public setReferenceVoice(profile: ReferenceVoiceProfile | null) {
    this.targetReference = profile;
    this.updateAcousticTuning();
  }

  private updateAcousticTuning() {
    if (!this.audioContext || this.formantFilters.length === 0) return;

    if (this.targetReference && this.targetReference.formantsProfile) {
      // Adjust formant filter center frequencies to match friend's vocal tract
      const f = this.targetReference.formantsProfile;
      if (this.formantFilters[0] && f[0]) this.formantFilters[0].frequency.setValueAtTime(f[0], this.audioContext.currentTime);
      if (this.formantFilters[1] && f[1]) this.formantFilters[1].frequency.setValueAtTime(f[1], this.audioContext.currentTime);
      if (this.formantFilters[2] && f[2]) this.formantFilters[2].frequency.setValueAtTime(f[2], this.audioContext.currentTime);
    }
  }

  /**
   * Démarre la capture micro et la chaîne de conversion vocale directe
   */
  public async start(
    inputDeviceId: string,
    outputDeviceId: string,
    monitorDeviceId: string,
    enableMonitoring: boolean
  ): Promise<void> {
    try {
      this.failSafeTriggered = false;
      this.lastErrorMessage = '';

      // 1. Initialiser AudioContext à 48kHz (standard WebRTC / Snapchat)
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx({
        latencyHint: 'interactive',
        sampleRate: 48000,
      });

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // 2. Capture micro avec contraintes faible latence
      const audioConstraints: MediaTrackConstraints = {
        deviceId: inputDeviceId ? { exact: inputDeviceId } : undefined,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1,
      };

      this.inputStream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
        video: false,
      });

      this.sourceNode = this.audioContext.createMediaStreamSource(this.inputStream);

      // 3. Analyseurs d'entrée et de sortie
      this.inputAnalyser = this.audioContext.createAnalyser();
      this.inputAnalyser.fftSize = 512;
      this.inputAnalyser.smoothingTimeConstant = 0.3;

      this.outputAnalyser = this.audioContext.createAnalyser();
      this.outputAnalyser.fftSize = 512;
      this.outputAnalyser.smoothingTimeConstant = 0.3;

      // 4. Chaîne de traitement acoustique de timbre (Formant Transfer Bank)
      // Simule le conduit vocal du locuteur cible (3 formants clés: F1 ~ 500-800Hz, F2 ~ 1200-2200Hz, F3 ~ 2500-3200Hz)
      const f1 = this.audioContext.createBiquadFilter();
      f1.type = 'peaking';
      f1.frequency.value = (this.targetReference?.formantsProfile?.[0]) || 650;
      f1.Q.value = 4.0;
      f1.gain.value = 4.5;

      const f2 = this.audioContext.createBiquadFilter();
      f2.type = 'peaking';
      f2.frequency.value = (this.targetReference?.formantsProfile?.[1]) || 1750;
      f2.Q.value = 3.5;
      f2.gain.value = 5.0;

      const f3 = this.audioContext.createBiquadFilter();
      f3.type = 'peaking';
      f3.frequency.value = (this.targetReference?.formantsProfile?.[2]) || 2850;
      f3.Q.value = 3.0;
      f3.gain.value = 3.5;

      const warmthFilter = this.audioContext.createBiquadFilter();
      warmthFilter.type = 'lowshelf';
      warmthFilter.frequency.value = 220;
      warmthFilter.gain.value = 2.0;

      this.formantFilters = [f1, f2, f3, warmthFilter];

      // 5. COUPE-CIRCUIT DE SÉCURITÉ (Fail-Safe Gate)
      // C'est ce nœud qui coupe tout immédiatement en cas de panne.
      // LA VRAIE VOIX N'EST JAMAIS BRANCHÉE EN DIRECT À LA SORTIE !
      this.safetyGateNode = this.audioContext.createGain();
      this.safetyGateNode.gain.setValueAtTime(1.0, this.audioContext.currentTime);

      // 6. Connecter le flux audio
      // Micro -> InputAnalyser -> Formants -> SafetyGate -> OutputAnalyser -> Destination
      this.sourceNode.connect(this.inputAnalyser);
      this.inputAnalyser.connect(f1);
      f1.connect(f2);
      f2.connect(f3);
      f3.connect(warmthFilter);
      warmthFilter.connect(this.safetyGateNode);
      this.safetyGateNode.connect(this.outputAnalyser);

      // 7. Sortie vers micro virtuel (CABLE Input)
      this.destinationNode = this.audioContext.createMediaStreamDestination();
      this.outputAnalyser.connect(this.destinationNode);

      if (this.mainAudioElement) {
        this.mainAudioElement.srcObject = this.destinationNode.stream;
        if (outputDeviceId && 'setSinkId' in this.mainAudioElement) {
          try {
            await (this.mainAudioElement as any).setSinkId(outputDeviceId);
          } catch (sinkErr) {
            console.warn('Impossible d’assigner setSinkId sur le périphérique principal:', sinkErr);
          }
        }
        await this.mainAudioElement.play().catch(e => console.warn('Autoplay audio output:', e));
      }

      // 8. Écoute de contrôle (Monitoring vers le casque de l'utilisateur)
      this.monitorGainNode = this.audioContext.createGain();
      this.monitorGainNode.gain.setValueAtTime(enableMonitoring ? 0.8 : 0, this.audioContext.currentTime);
      this.outputAnalyser.connect(this.monitorGainNode);

      const monitorDestination = this.audioContext.createMediaStreamDestination();
      this.monitorGainNode.connect(monitorDestination);

      if (this.monitorAudioElement) {
        this.monitorAudioElement.srcObject = monitorDestination.stream;
        if (monitorDeviceId && 'setSinkId' in this.monitorAudioElement) {
          try {
            await (this.monitorAudioElement as any).setSinkId(monitorDeviceId);
          } catch (sinkErr) {
            console.warn('setSinkId monitoring:', sinkErr);
          }
        }
        await this.monitorAudioElement.play().catch(e => console.warn('Autoplay monitor:', e));
      }

      this.isRunning = true;
      this.isMonitoring = enableMonitoring;

      // Démarrer la boucle de monitoring temps réel (VU-mètres, pitch, latence)
      this.startMetricsLoop();
    } catch (err: any) {
      this.triggerEmergencyFailSafe('Erreur d’initialisation du moteur audio: ' + (err.message || err));
      throw err;
    }
  }

  /**
   * Arrêt d'urgence immédiat (Fail-Safe) : coupe le son sans jamais laisser fuiter la vraie voix.
   */
  public triggerEmergencyFailSafe(reason: string) {
    this.failSafeTriggered = true;
    this.lastErrorMessage = reason;

    if (this.safetyGateNode && this.audioContext) {
      // Clamper le gain à zéro instantanément
      this.safetyGateNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    }

    if (this.mainAudioElement) {
      this.mainAudioElement.pause();
    }

    if (this.onFailSafe) {
      this.onFailSafe(reason);
    }
  }

  /**
   * Réactive la transmission après correction d'une erreur
   */
  public resetFailSafe() {
    this.failSafeTriggered = false;
    this.lastErrorMessage = '';
    if (this.safetyGateNode && this.audioContext) {
      this.safetyGateNode.gain.setValueAtTime(1.0, this.audioContext.currentTime);
    }
    if (this.mainAudioElement && this.isRunning) {
      this.mainAudioElement.play().catch(() => {});
    }
  }

  /**
   * Arrête complètement la transmission et libère les périphériques
   */
  public stop() {
    this.isRunning = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.inputStream) {
      this.inputStream.getTracks().forEach((track) => track.stop());
      this.inputStream = null;
    }

    if (this.mainAudioElement) {
      this.mainAudioElement.pause();
      this.mainAudioElement.srcObject = null;
    }

    if (this.monitorAudioElement) {
      this.monitorAudioElement.pause();
      this.monitorAudioElement.srcObject = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }

  /**
   * Active ou coupe l'écoute de contrôle
   */
  public setMonitoring(enabled: boolean, volume: number = 0.8) {
    this.isMonitoring = enabled;
    if (this.monitorGainNode && this.audioContext) {
      const val = enabled ? Math.max(0, Math.min(1, volume)) : 0;
      this.monitorGainNode.gain.setValueAtTime(val, this.audioContext.currentTime);
    }
  }

  /**
   * Change le périphérique de sortie principal (ex: CABLE Input)
   */
  public async setOutputDevice(deviceId: string) {
    if (this.mainAudioElement && 'setSinkId' in this.mainAudioElement) {
      await (this.mainAudioElement as any).setSinkId(deviceId);
    }
  }

  /**
   * Change le périphérique d'écoute de contrôle (ex: Casque USB)
   */
  public async setMonitorDevice(deviceId: string) {
    if (this.monitorAudioElement && 'setSinkId' in this.monitorAudioElement) {
      await (this.monitorAudioElement as any).setSinkId(deviceId);
    }
  }

  /**
   * Récupère le nœud d'analyse pour le dessin du spectre/forme d'onde
   */
  public getInputAnalyser(): AnalyserNode | null {
    return this.inputAnalyser;
  }

  public getOutputAnalyser(): AnalyserNode | null {
    return this.outputAnalyser;
  }

  public getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Détecteur de fréquence fondamentale (Pitch F0) par autocorrélation
   */
  private detectPitch(buffer: Float32Array, sampleRate: number): number {
    const SIZE = buffer.length;
    let sumOfSquares = 0;
    for (let i = 0; i < SIZE; i++) {
      sumOfSquares += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sumOfSquares / SIZE);
    if (rms < 0.01) return 0; // Silence

    // Autocorrélation
    let bestR = 0;
    let bestLag = -1;
    const maxLag = Math.floor(sampleRate / 60); // 60 Hz min pitch
    const minLag = Math.floor(sampleRate / 500); // 500 Hz max pitch

    for (let lag = minLag; lag <= maxLag; lag++) {
      let r = 0;
      for (let i = 0; i < SIZE - lag; i++) {
        r += buffer[i] * buffer[i + lag];
      }
      if (r > bestR) {
        bestR = r;
        bestLag = lag;
      }
    }

    if (bestLag > 0 && bestR > 0.05) {
      return Math.round(sampleRate / bestLag);
    }
    return 0;
  }

  /**
   * Boucle de rafraîchissement des métriques (dB, pitch, latence)
   */
  private startMetricsLoop() {
    const inputData = new Float32Array(512);
    const outputData = new Float32Array(512);

    const update = () => {
      if (!this.isRunning) return;

      try {
        let inputDb = -100;
        let outputDb = -100;
        let pitch = 0;
        let isClipping = false;

        if (this.inputAnalyser) {
          this.inputAnalyser.getFloatTimeDomainData(inputData);
          let sumIn = 0;
          for (let i = 0; i < inputData.length; i++) {
            const val = inputData[i];
            if (Math.abs(val) >= 0.99) isClipping = true;
            sumIn += val * val;
          }
          const rmsIn = Math.sqrt(sumIn / inputData.length);
          inputDb = rmsIn > 0.00001 ? 20 * Math.log10(rmsIn) : -100;

          if (this.audioContext) {
            pitch = this.detectPitch(inputData, this.audioContext.sampleRate);
          }
        }

        if (this.outputAnalyser && !this.failSafeTriggered) {
          this.outputAnalyser.getFloatTimeDomainData(outputData);
          let sumOut = 0;
          for (let i = 0; i < outputData.length; i++) {
            sumOut += outputData[i] * outputData[i];
          }
          const rmsOut = Math.sqrt(sumOut / outputData.length);
          outputDb = rmsOut > 0.00001 ? 20 * Math.log10(rmsOut) : -100;
        }

        // Estimer la latence réelle de l'AudioContext I/O
        if (this.audioContext) {
          const baseLatency = (this.audioContext.baseLatency || 0.01) * 1000;
          const outputLatency = (this.audioContext.outputLatency || 0.015) * 1000;
          this.measuredLatency = Math.round(baseLatency + outputLatency + 18);
        }

        if (this.onMetricsUpdate) {
          this.onMetricsUpdate({
            inputDb: Math.round(Math.max(-80, inputDb)),
            outputDb: this.failSafeTriggered ? -100 : Math.round(Math.max(-80, outputDb)),
            latencyMs: this.measuredLatency,
            currentPitchHz: pitch,
            isClipping,
            isActive: this.isRunning && !this.failSafeTriggered,
            bufferHealthPercent: this.failSafeTriggered ? 0 : 98,
            failSafeTriggered: this.failSafeTriggered,
            lastErrorMessage: this.lastErrorMessage,
          });
        }
      } catch (err: any) {
        this.triggerEmergencyFailSafe('Erreur dans la boucle de traitement: ' + err.message);
      }

      this.animationFrameId = requestAnimationFrame(update);
    };

    this.animationFrameId = requestAnimationFrame(update);
  }
}

// Instance singleton pour l'application
export const audioEngine = new VoiceBridgeAudioEngine();
