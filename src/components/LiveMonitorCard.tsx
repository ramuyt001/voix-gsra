import React, { useEffect, useRef } from 'react';
import { 
  Activity, 
  Clock, 
  Zap, 
  Volume2, 
  VolumeX, 
  AlertOctagon, 
  Radio, 
  CheckCircle2, 
  Gauge 
} from 'lucide-react';
import { ConversionMetrics } from '../types';
import { audioEngine } from '../services/audioEngine';

interface LiveMonitorCardProps {
  metrics: ConversionMetrics;
  targetLatencyMs: number;
}

export const LiveMonitorCard: React.FC<LiveMonitorCardProps> = ({
  metrics,
  targetLatencyMs = 300,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animation de la forme d'onde en temps réel sur le Canvas
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = audioEngine.getInputAnalyser();
    const dataArray = new Uint8Array(256);

    const draw = () => {
      animId = requestAnimationFrame(draw);
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Fond sobre
      ctx.fillStyle = 'rgba(10, 10, 10, 0.4)';
      ctx.fillRect(0, 0, width, height);

      // Ligne centrale repère
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      if (analyser && metrics.isActive && !metrics.failSafeTriggered) {
        analyser.getByteTimeDomainData(dataArray);

        ctx.lineWidth = 2.5;
        // Dégradé de la forme d'onde (doré / ambre)
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#f59e0b');
        gradient.addColorStop(0.5, '#fbbf24');
        gradient.addColorStop(1, '#f59e0b');
        ctx.strokeStyle = gradient;

        ctx.beginPath();
        const sliceWidth = width / dataArray.length;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
      } else {
        // Ligne plate au repos ou en sécurité
        ctx.strokeStyle = metrics.failSafeTriggered ? '#ef4444' : 'rgba(150, 150, 150, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [metrics.isActive, metrics.failSafeTriggered]);

  // Conversion dB en pourcentage visuel (plage -60dB à 0dB)
  const dbToPercent = (db: number) => {
    if (db <= -60) return 0;
    if (db >= 0) return 100;
    return Math.round(((db + 60) / 60) * 100);
  };

  const inputPct = dbToPercent(metrics.inputDb);
  const outputPct = metrics.failSafeTriggered ? 0 : dbToPercent(metrics.outputDb);

  const isLowLatency = metrics.latencyMs <= targetLatencyMs;

  return (
    <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5 lg:p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Indicateurs &amp; Télémétrie en Direct
            </h2>
            <p className="text-xs text-neutral-400">
              Niveaux sonores, délai réel et préservation acoustique
            </p>
          </div>
        </div>

        {/* Badge cible latence */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-xs">
          <Clock className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-neutral-400">Objectif :</span>
          <span className="font-mono font-bold text-white">&lt; {targetLatencyMs} ms</span>
        </div>
      </div>

      {/* Visualiseur de forme d'onde */}
      <div className="relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 mb-4 h-24">
        <canvas
          ref={canvasRef}
          width={600}
          height={96}
          className="w-full h-full block"
        />
        <div className="absolute top-2 left-3 flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider">
          {metrics.isActive && !metrics.failSafeTriggered ? (
            <span className="text-amber-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              Oscilloscope Actif
            </span>
          ) : (
            <span className="text-neutral-500">Signal Audio au repos</span>
          )}
        </div>

        {/* Affichage du pitch F0 détecté */}
        <div className="absolute top-2 right-3 text-[11px] font-mono bg-black/60 px-2 py-0.5 rounded border border-neutral-800 text-neutral-300">
          Hauteur (F0) : {metrics.currentPitchHz > 0 ? `${metrics.currentPitchHz} Hz` : '---'}
        </div>
      </div>

      {/* Grille des indicateurs : VU-mètres & Latence */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* VU-mètre Entrée Micro */}
        <div className="bg-neutral-950/70 p-3.5 rounded-xl border border-neutral-800/80">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-neutral-400 font-medium">Entrée Micro Réelle</span>
            <div className="flex items-center gap-1">
              {metrics.isClipping && (
                <span className="text-[10px] font-bold text-red-400 animate-ping">CLIP</span>
              )}
              <span className="font-mono text-neutral-200">{metrics.inputDb} dB</span>
            </div>
          </div>
          <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                metrics.isClipping 
                  ? 'bg-red-500' 
                  : inputPct > 80 
                    ? 'bg-amber-400' 
                    : 'bg-emerald-500'
              }`}
              style={{ width: `${inputPct}%` }}
            />
          </div>
          <span className="text-[10px] text-neutral-400 mt-1.5 block">
            {metrics.inputDb > -50 ? "Voix détectée (Darija/Français)" : "Micro silencieux"}
          </span>
        </div>

        {/* VU-mètre Sortie Snapchat */}
        <div className="bg-neutral-950/70 p-3.5 rounded-xl border border-neutral-800/80">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-neutral-400 font-medium">Sortie Snapchat (Transformée)</span>
            <span className="font-mono text-neutral-200">
              {metrics.failSafeTriggered ? '-∞ dB' : `${metrics.outputDb} dB`}
            </span>
          </div>
          <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                metrics.failSafeTriggered 
                  ? 'bg-red-600' 
                  : 'bg-gradient-to-r from-sky-500 to-indigo-500'
              }`}
              style={{ width: `${outputPct}%` }}
            />
          </div>
          <span className="text-[10px] text-neutral-400 mt-1.5 block">
            {metrics.failSafeTriggered 
              ? "Silence forcé (Sécurité)" 
              : metrics.isActive 
                ? "Flux vocal de l'ami actif" 
                : "Transmission coupée"}
          </span>
        </div>

        {/* Délai Réel Mesuré */}
        <div className="bg-neutral-950/70 p-3.5 rounded-xl border border-neutral-800/80">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-neutral-400 font-medium">Délai Réel (Latence)</span>
            <span className={`font-mono font-bold text-xs px-1.5 py-0.5 rounded ${
              isLowLatency 
                ? 'bg-emerald-500/10 text-emerald-400' 
                : 'bg-amber-500/10 text-amber-400'
            }`}>
              {metrics.isActive ? `${metrics.latencyMs} ms` : '~45 ms'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-neutral-300 mt-1 font-medium">
            {isLowLatency ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Conforme conversation en direct
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5" /> Légère latence détectée
              </span>
            )}
          </div>
          <span className="text-[10px] text-neutral-400 mt-1 block">
            Temps de transit : Capture + Filtres de timbre + Câble virtuel
          </span>
        </div>
      </div>
    </div>
  );
};
