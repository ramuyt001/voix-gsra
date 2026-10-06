import React from 'react';
import { 
  Radio, 
  HelpCircle, 
  Cpu, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface HeaderProps {
  isActive: boolean;
  failSafeTriggered: boolean;
  onEmergencyStop: () => void;
  onOpenGuide: () => void;
  onOpenHardwareModal: () => void;
  targetLatencyMs: number;
}

export const Header: React.FC<HeaderProps> = ({
  isActive,
  failSafeTriggered,
  onEmergencyStop,
  onOpenGuide,
  onOpenHardwareModal,
  targetLatencyMs,
}) => {
  return (
    <header className="border-b border-neutral-800 bg-neutral-900/60 backdrop-blur-xl sticky top-0 z-40 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 p-0.5 shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-neutral-950 rounded-[10px] flex items-center justify-center">
                <Radio className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            {isActive && !failSafeTriggered && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg text-white tracking-tight">
                VoiceBridge
              </h1>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-md">
                Direct V2V • Snapchat Web
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Conversion vocale acoustique sans transcription • Français &amp; Darija
            </p>
          </div>
        </div>

        {/* Status badges & Quick Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Live Status Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-medium">
            {failSafeTriggered ? (
              <div className="flex items-center gap-1.5 text-red-400">
                <AlertCircle className="w-3.5 h-3.5 animate-bounce" />
                <span className="font-bold">MUTE SÉCURITÉ</span>
              </div>
            ) : isActive ? (
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold">EN DIRECT SNAPCHAT</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-neutral-400">
                <span className="w-2 h-2 rounded-full bg-neutral-600"></span>
                <span>En attente</span>
              </div>
            )}
          </div>

          {/* Guide Snapchat Button */}
          <button
            onClick={onOpenGuide}
            className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/60 text-xs font-semibold transition"
          >
            <HelpCircle className="w-3.5 h-3.5 text-yellow-400" />
            <span>Guide Snapchat &amp; VB-Cable</span>
          </button>

          {/* Hardware & Engine Info */}
          <button
            onClick={onOpenHardwareModal}
            className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/60 text-xs font-semibold transition"
          >
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <span>Moteur &amp; Faisabilité</span>
          </button>

          {/* Emergency Kill Switch Button */}
          {isActive && !failSafeTriggered && (
            <button
              onClick={onEmergencyStop}
              title="Coupe instantanément la sortie vers le micro virtuel"
              className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/90 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-950 transition active:scale-95"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Coupe-Circuit d&apos;Urgence</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
