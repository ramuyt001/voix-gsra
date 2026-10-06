import React from 'react';
import { 
  ShieldAlert, 
  RotateCcw, 
  AlertTriangle, 
  VolumeX, 
  MicOff 
} from 'lucide-react';

interface EmergencyAlertProps {
  reason: string;
  onReset: () => void;
}

export const EmergencyAlert: React.FC<EmergencyAlertProps> = ({ reason, onReset }) => {
  return (
    <div className="bg-red-950/80 border-2 border-red-500/80 rounded-2xl p-5 shadow-2xl backdrop-blur-md mb-6 animate-pulse">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-600/30 text-red-400 rounded-xl border border-red-500/40 shrink-0">
            <ShieldAlert className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white tracking-wider uppercase">
                Coupe-circuit activé
              </span>
              <h3 className="text-lg font-bold text-white">
                Protection Anti-Fuite Déclenchée
              </h3>
            </div>
            <p className="text-red-200/90 text-sm mt-1">
              La transmission vers Snapchat Web a été <strong className="text-white underline">instantanément coupée à 0 dB</strong>. 
              Votre vraie voix <strong className="text-red-300">n&apos;a PAS fuité</strong> dans l&apos;appel.
            </p>
            {reason && (
              <div className="mt-2 text-xs font-mono bg-black/40 text-red-300 px-3 py-1.5 rounded-lg border border-red-900/50 inline-block">
                Cause détectée : {reason}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onReset}
          className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-red-950 transition-all transform active:scale-95 shrink-0"
        >
          <RotateCcw className="w-4 h-4" />
          Réarmer le flux sécurisé
        </button>
      </div>
    </div>
  );
};
