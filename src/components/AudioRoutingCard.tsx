import React from 'react';
import { 
  Mic, 
  Speaker, 
  Headphones, 
  Volume2, 
  VolumeX, 
  ExternalLink, 
  Info,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { AudioDevice } from '../types';

interface AudioRoutingCardProps {
  inputDevices: AudioDevice[];
  outputDevices: AudioDevice[];
  selectedInputId: string;
  selectedOutputId: string;
  selectedMonitorId: string;
  isMonitoring: boolean;
  monitorVolume: number;
  onSelectInput: (id: string) => void;
  onSelectOutput: (id: string) => void;
  onSelectMonitor: (id: string) => void;
  onToggleMonitoring: (enabled: boolean) => void;
  onChangeMonitorVolume: (vol: number) => void;
  onRefreshDevices: () => void;
  disabled?: boolean;
}

export const AudioRoutingCard: React.FC<AudioRoutingCardProps> = ({
  inputDevices,
  outputDevices,
  selectedInputId,
  selectedOutputId,
  selectedMonitorId,
  isMonitoring,
  monitorVolume,
  onSelectInput,
  onSelectOutput,
  onSelectMonitor,
  onToggleMonitoring,
  onChangeMonitorVolume,
  onRefreshDevices,
  disabled = false,
}) => {
  // Détecter si VB-Cable est présent dans la liste des sorties
  const hasVbCableOutput = outputDevices.some(
    d => d.label.toLowerCase().includes('cable input') || d.label.toLowerCase().includes('vb-audio')
  );

  return (
    <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5 lg:p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
            <Speaker className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Routage Audio &amp; Micro Virtuel
            </h2>
            <p className="text-xs text-neutral-400">
              Achemine le son transformé vers Snapchat Web sans boucle d&apos;écho
            </p>
          </div>
        </div>

        <button
          onClick={onRefreshDevices}
          disabled={disabled}
          className="cursor-pointer p-2 text-neutral-400 hover:text-white bg-neutral-800/60 hover:bg-neutral-800 rounded-xl border border-neutral-700/60 transition text-xs flex items-center gap-1.5"
          title="Actualiser la liste des périphériques Windows"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Actualiser</span>
        </button>
      </div>

      <div className="space-y-4">
        {/* 1. Sélection du Microphone d'entrée */}
        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 text-amber-400" />
            <span>1. Votre Microphone Physique (Entrée réelle)</span>
          </label>
          <div className="relative">
            <select
              value={selectedInputId}
              onChange={(e) => onSelectInput(e.target.value)}
              disabled={disabled}
              className="w-full bg-neutral-950 border border-neutral-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 appearance-none font-medium transition"
            >
              {inputDevices.map((dev) => (
                <option key={dev.deviceId} value={dev.deviceId}>
                  {dev.label || `Microphone (${dev.deviceId.slice(0, 8)}...)`}
                </option>
              ))}
              {inputDevices.length === 0 && (
                <option value="">Aucun microphone détecté</option>
              )}
            </select>
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Parlez naturellement dans votre micro en Darija et en Français.
          </span>
        </div>

        {/* 2. Sortie vers Micro Virtuel pour Snapchat Web */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
              <Speaker className="w-3.5 h-3.5 text-sky-400" />
              <span>2. Sortie Principale &rarr; Micro Virtuel Windows (Vers Snapchat)</span>
            </label>
            {hasVbCableOutput ? (
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> VB-Cable Détecté
              </span>
            ) : (
              <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> VB-Cable non détecté
              </span>
            )}
          </div>

          <select
            value={selectedOutputId}
            onChange={(e) => onSelectOutput(e.target.value)}
            disabled={disabled}
            className="w-full bg-neutral-950 border border-neutral-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-400 appearance-none font-medium transition"
          >
            {outputDevices.map((dev) => (
              <option key={dev.deviceId} value={dev.deviceId}>
                {dev.label || `Périphérique de sortie (${dev.deviceId.slice(0, 8)}...)`}
                {dev.label.toLowerCase().includes('cable input') ? ' (★ RECOMMANDÉ POUR SNAPCHAT)' : ''}
              </option>
            ))}
            {outputDevices.length === 0 && (
              <option value="">Périphérique audio par défaut</option>
            )}
          </select>

          {!hasVbCableOutput && (
            <div className="mt-2 p-2.5 bg-amber-950/30 border border-amber-800/50 rounded-xl text-xs text-amber-200/90 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span>Pour que Snapchat Web reçoive la voix transformée, installez le pilote virtuel gratuit </span>
                <a
                  href="https://vb-audio.com/Cable/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-300 font-bold underline inline-flex items-center gap-0.5 hover:text-white"
                >
                  VB-Audio Virtual Cable <ExternalLink className="w-3 h-3" />
                </a>
                <span>, puis sélectionnez <strong>&quot;CABLE Input&quot;</strong> ici et <strong>&quot;CABLE Output&quot;</strong> dans Snapchat.</span>
              </div>
            </div>
          )}
        </div>

        {/* 3. Écoute de contrôle facultative (Monitoring) */}
        <div className="pt-3 border-t border-neutral-800/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Headphones className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs font-semibold text-neutral-300">
                3. Écoute de contrôle (Retour dans votre casque)
              </span>
            </div>

            <button
              onClick={() => onToggleMonitoring(!isMonitoring)}
              disabled={disabled}
              className={`cursor-pointer px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                isMonitoring
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-900'
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {isMonitoring ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              {isMonitoring ? 'Active' : 'Désactivée'}
            </button>
          </div>

          {isMonitoring && (
            <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800 space-y-2.5 animate-fadeIn">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">
                  Sortie casque pour votre propre écoute :
                </label>
                <select
                  value={selectedMonitorId}
                  onChange={(e) => onSelectMonitor(e.target.value)}
                  disabled={disabled}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-400 appearance-none"
                >
                  {outputDevices.map((dev) => (
                    <option key={dev.deviceId} value={dev.deviceId}>
                      {dev.label || `Casque/Haut-parleur (${dev.deviceId.slice(0, 8)}...)`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Volume retour casque</span>
                  <span className="font-mono text-neutral-300">{Math.round(monitorVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={monitorVolume}
                  onChange={(e) => onChangeMonitorVolume(parseFloat(e.target.value))}
                  disabled={disabled}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
              </div>
              <p className="text-[10px] text-neutral-400 italic">
                Astuce : Utilisez un casque fermé pour éviter que le son du retour ne repasse dans votre micro.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
