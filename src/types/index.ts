export type EngineMode = 'local_gpu' | 'browser_dsp' | 'cloud_api';

export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
}

export interface ReferenceVoiceProfile {
  id: string;
  name: string;
  fileSizeBytes: number;
  durationSeconds: number;
  sampleRate: number;
  channels: number;
  snrDb: number;
  score: number;
  qualityLevel: 'EXCELLENTE' | 'BONNE' | 'INSUFFISANTE';
  issues: string[];
  strengths: string[];
  format: string;
  audioUrl: string;
  base64Data?: string;
  detectedPitchHz?: number;
  formantsProfile?: number[];
}

export interface ConversionMetrics {
  inputDb: number;
  outputDb: number;
  latencyMs: number;
  currentPitchHz: number;
  isClipping: boolean;
  isActive: boolean;
  bufferHealthPercent: number;
  failSafeTriggered: boolean;
  lastErrorMessage?: string;
}

export interface PipelineTestResult {
  success: boolean;
  inputDurationSec: number;
  measuredLatencyMs: number;
  inputAudioUrl: string;
  convertedAudioUrl: string;
  languageDetected: string;
  intonationScorePercent: number;
  timbreMatchPercent: number;
  logs: string[];
}
