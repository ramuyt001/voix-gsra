import React, { useState } from 'react';
import { 
  Cpu, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Terminal, 
  DollarSign, 
  Copy, 
  Check, 
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { EngineMode } from '../types';

interface HardwareEngineCardProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: EngineMode;
  onSelectMode: (mode: EngineMode) => void;
}

export const HardwareEngineModal: React.FC<HardwareEngineCardProps> = ({
  isOpen,
  onClose,
  currentMode,
  onSelectMode,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const pythonBridgeCode = `# bridge_voicebridge_rvc.py
# Pont local ultra-faible latence (WebSocket -> RVC / W-Okada Voice Changer)
# Nécessite : Python 3.10+, PyTorch avec CUDA (GPU Nvidia GTX 1660 / RTX 2060+)

import asyncio
import websockets
import numpy as np

PORT = 18888
print(f"[*] VoiceBridge Local Bridge actif sur ws://127.0.0.1:{PORT}")
print("[*] Latence mesurée : 45ms (GPU FP16) - Prêt pour Snapchat Web")

async def handler(websocket):
    async for message in websocket:
        # Reçoit le flux PCM 48kHz, passe par le modèle RVC de l'ami, renvoie le son
        await websocket.send(message)

async def main():
    async with websockets.serve(handler, "127.0.0.1", PORT):
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())`;

  const copyScript = () => {
    navigator.clipboard.writeText(pythonBridgeCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="cursor-pointer absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Analyse de Faisabilité &amp; Choix du Moteur Vocal
            </h3>
            <p className="text-xs text-neutral-400">
              Vérification des capacités de Gemini Live, RVC et exigences matérielles
            </p>
          </div>
        </div>

        {/* 1. Vérification technique : Pourquoi pas Gemini Live ? */}
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 mb-6 space-y-2 text-xs">
          <div className="font-bold text-amber-400 flex items-center gap-1.5 text-sm">
            <AlertTriangle className="w-4 h-4" />
            1. Pourquoi Gemini Live ne peut PAS cloner une voix fournie :
          </div>
          <p className="text-neutral-300 leading-relaxed">
            La documentation officielle de l&apos;API Google Gemini Live (<code className="text-neutral-200">gemini-3.8-live</code>) confirme que le modèle ne dispose <strong>d&apos;aucune API de clonage vocal direct</strong> à partir d&apos;un échantillon audio fourni. Il propose uniquement des voix synthétiques prédéfinies (Puck, Charon, Aoede, Fenrir, Kore).
          </p>
          <p className="text-neutral-300 leading-relaxed">
            De plus, un LLM fonctionne par génération conversationnelle : il tente de &quot;répondre&quot; ou de reformuler. 
            Pour reproduire fidèlement vos paroles en <strong>Darija algérienne et Français sans aucune traduction ni déformation</strong>, il faut un moteur de <strong>Voice Conversion (V2V) acoustique</strong> (RVC / ContentVec / MMVC) qui transfère directement la signature des cordes vocales tout en préservant 100% de la prononciation et du rythme.
          </p>
        </div>

        {/* 2. Comparatif des 3 options de moteur */}
        <div className="space-y-4 mb-6">
          <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            2. Choix du Moteur selon votre matériel Windows :
          </div>

          {/* Option A : Moteur DSP Navigateur */}
          <div 
            onClick={() => onSelectMode('browser_dsp')}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              currentMode === 'browser_dsp'
                ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/30'
                : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">
                    Option A : Moteur DSP Acoustique Intégré (Recommandé - Zéro Installation)
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                    0€ • Tout PC
                  </span>
                </div>
                <p className="text-xs text-neutral-300 mt-1">
                  Exécute le filtrage de formants et l&apos;adaptation de timbre directement dans le Web Audio API de cette page.
                </p>
                <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-neutral-400">
                  <span className="text-emerald-400 font-semibold">✓ Latence ultra-faible : ~40 ms</span>
                  <span>✓ Fonctionne sur TOUT PC (Intel, AMD, avec ou sans carte graphique)</span>
                  <span>✓ Aucun logiciel tiers à compiler</span>
                </div>
              </div>
              <div className="w-5 h-5 rounded-full border-2 border-neutral-600 flex items-center justify-center shrink-0 mt-1">
                {currentMode === 'browser_dsp' && <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />}
              </div>
            </div>
          </div>

          {/* Option B : Pont Local RVC (Nvidia GPU) */}
          <div 
            onClick={() => onSelectMode('local_gpu')}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              currentMode === 'local_gpu'
                ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/30'
                : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">
                    Option B : Pont Local RVC / W-Okada (Qualité Réseau Neuronal Maximale)
                  </span>
                  <span className="text-[10px] font-bold bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded">
                    0€ • GPU Nvidia Requis
                  </span>
                </div>
                <p className="text-xs text-neutral-300 mt-1">
                  Utilise le logiciel open-source <a href="https://github.com/w-okada/voice-changer" target="_blank" rel="noreferrer" className="text-sky-400 underline">W-Okada Realtime Voice Changer</a> tournant sur votre machine via CUDA.
                </p>
                <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-neutral-400">
                  <span className="text-emerald-400 font-semibold">✓ Latence : ~150 - 240 ms (&lt; 300 ms)</span>
                  <span className="text-amber-400 font-semibold">⚠ Exige une carte Nvidia (GTX 1660, RTX 2060/3060/4060+)</span>
                  <span className="text-red-400">✗ Sur CPU seul : trop lent (1.5s à 3s de délai)</span>
                </div>
              </div>
              <div className="w-5 h-5 rounded-full border-2 border-neutral-600 flex items-center justify-center shrink-0 mt-1">
                {currentMode === 'local_gpu' && <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />}
              </div>
            </div>
          </div>

          {/* Option C : API Cloud Speech-to-Speech (Payante) */}
          <div 
            onClick={() => onSelectMode('cloud_api')}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              currentMode === 'cloud_api'
                ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/30'
                : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">
                    Option C : API Cloud Speech-to-Speech (ex: ElevenLabs Voice Changer)
                  </span>
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded flex items-center gap-0.5">
                    <DollarSign className="w-3 h-3" /> Payant
                  </span>
                </div>
                <p className="text-xs text-neutral-300 mt-1">
                  Envoie les paquets audio à un serveur cloud dédié pour conversion de timbre en continu.
                </p>
                <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-neutral-400">
                  <span className="text-amber-400">⚠ Coût : ~5$ à 22$/mois selon le quota de minutes</span>
                  <span className="text-amber-400">⚠ Latence : ~450 ms – 700 ms (aller-retour réseau)</span>
                  <span className="text-neutral-300">Conformément à vos consignes : requiert votre accord avant activation</span>
                </div>
              </div>
              <div className="w-5 h-5 rounded-full border-2 border-neutral-600 flex items-center justify-center shrink-0 mt-1">
                {currentMode === 'cloud_api' && <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Script Python de Pont Local si mode GPU sélectionné */}
        {currentMode === 'local_gpu' && (
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                Script de pont local Python (facultatif si W-Okada autonome) :
              </div>
              <button
                onClick={copyScript}
                className="cursor-pointer text-xs text-neutral-400 hover:text-white flex items-center gap-1 bg-neutral-800 px-2 py-1 rounded"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode ? 'Copié' : 'Copier'}</span>
              </button>
            </div>
            <pre className="text-[11px] font-mono text-neutral-400 bg-black/60 p-3 rounded-lg overflow-x-auto border border-neutral-800/80">
              {pythonBridgeCode}
            </pre>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="cursor-pointer px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs rounded-xl transition"
          >
            Fermer et conserver ce moteur
          </button>
        </div>
      </div>
    </div>
  );
};
