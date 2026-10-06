/**
 * VoiceBridge - Solution de conversion vocale en direct pour appels Snapchat Web sur Windows
 * Préservation de la Darija Algérienne et du Français • Routage Micro Virtuel • Mesure de latence < 300 ms
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Play, 
  Square, 
  Sparkles, 
  Zap, 
  HelpCircle, 
  Cpu, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Layers,
  ArrowRight,
  Radio,
  FileCheck,
  Headphones
} from 'lucide-react';

import { 
  AudioDevice, 
  ReferenceVoiceProfile, 
  ConversionMetrics, 
  EngineMode 
} from './types';
import { audioEngine } from './services/audioEngine';

import { Header } from './components/Header';
import { EmergencyAlert } from './components/EmergencyAlert';
import { ReferenceVoiceCard } from './components/ReferenceVoiceCard';
import { AudioRoutingCard } from './components/AudioRoutingCard';
import { LiveMonitorCard } from './components/LiveMonitorCard';
import { TestPipelineModal } from './components/TestPipelineModal';
import { SnapchatGuideModal } from './components/SnapchatGuideModal';
import { HardwareEngineModal } from './components/HardwareEngineCard';

export default function App() {
  // Périphériques audio
  const [inputDevices, setInputDevices] = useState<AudioDevice[]>([]);
  const [outputDevices, setOutputDevices] = useState<AudioDevice[]>([]);
  const [selectedInputId, setSelectedInputId] = useState<string>('');
  const [selectedOutputId, setSelectedOutputId] = useState<string>('');
  const [selectedMonitorId, setSelectedMonitorId] = useState<string>('');

  // Paramètres d'écoute de contrôle
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [monitorVolume, setMonitorVolume] = useState<number>(0.8);

  // Profil vocal de référence
  const [referenceProfile, setReferenceProfile] = useState<ReferenceVoiceProfile | null>(null);

  // Moteur et Télémétrie
  const [engineMode, setEngineMode] = useState<EngineMode>('browser_dsp');
  const [isActive, setIsActive] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<ConversionMetrics>({
    inputDb: -80,
    outputDb: -80,
    latencyMs: 38,
    currentPitchHz: 0,
    isClipping: false,
    isActive: false,
    bufferHealthPercent: 100,
    failSafeTriggered: false,
    lastErrorMessage: '',
  });

  // Modales
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState<boolean>(false);

  // Énumération des périphériques audio connectés
  const enumerateDevices = useCallback(async () => {
    try {
      // Demander l'accès au micro une première fois pour obtenir les noms réels
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => {});
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs: AudioDevice[] = [];
      const outputs: AudioDevice[] = [];

      devices.forEach((dev) => {
        if (dev.kind === 'audioinput') {
          inputs.push({
            deviceId: dev.deviceId,
            label: dev.label || `Microphone ${inputs.length + 1}`,
            kind: 'audioinput',
          });
        } else if (dev.kind === 'audiooutput') {
          outputs.push({
            deviceId: dev.deviceId,
            label: dev.label || `Haut-Parleur/Sortie ${outputs.length + 1}`,
            kind: 'audiooutput',
          });
        }
      });

      setInputDevices(inputs);
      setOutputDevices(outputs);

      if (inputs.length > 0 && !selectedInputId) {
        setSelectedInputId(inputs[0].deviceId);
      }

      // Chercher intelligemment "CABLE Input" pour la sortie principale
      const vbCable = outputs.find(
        (o) => o.label.toLowerCase().includes('cable input') || o.label.toLowerCase().includes('vb-audio')
      );
      if (vbCable) {
        setSelectedOutputId(vbCable.deviceId);
      } else if (outputs.length > 0 && !selectedOutputId) {
        setSelectedOutputId(outputs[0].deviceId);
      }

      if (outputs.length > 0 && !selectedMonitorId) {
        setSelectedMonitorId(outputs[0].deviceId);
      }
    } catch (err) {
      console.warn('Erreur énumération périphériques audio:', err);
    }
  }, [selectedInputId, selectedOutputId, selectedMonitorId]);

  useEffect(() => {
    enumerateDevices();

    // Configurer les callbacks du moteur audio
    audioEngine.setCallbacks(
      (newMetrics) => {
        setMetrics(newMetrics);
      },
      (failReason) => {
        setMetrics((prev) => ({
          ...prev,
          failSafeTriggered: true,
          lastErrorMessage: failReason,
          outputDb: -100,
        }));
      }
    );

    return () => {
      audioEngine.stop();
    };
  }, [enumerateDevices]);

  // Réagir aux changements de profil de voix
  const handleProfileLoaded = (profile: ReferenceVoiceProfile | null) => {
    setReferenceProfile(profile);
    audioEngine.setReferenceVoice(profile);
  };

  // Démarrer la transmission en direct
  const startLiveTransmission = async () => {
    try {
      if (!referenceProfile) {
        alert("Veuillez d'abord importer l'audio de référence de votre ami ou charger le profil de démo.");
        return;
      }

      await audioEngine.start(
        selectedInputId,
        selectedOutputId,
        selectedMonitorId,
        isMonitoring
      );
      setIsActive(true);
    } catch (err: any) {
      alert("Impossible de démarrer la transmission : " + err.message);
    }
  };

  // Arrêter la transmission
  const stopLiveTransmission = () => {
    audioEngine.stop();
    setIsActive(false);
  };

  // Déclencher le coupe-circuit d'urgence (Kill Switch)
  const handleEmergencyStop = () => {
    audioEngine.triggerEmergencyFailSafe("Déclenché manuellement par l'utilisateur (Kill Switch).");
  };

  // Réinitialiser le coupe-circuit
  const handleResetFailSafe = () => {
    audioEngine.resetFailSafe();
  };

  // Basculer l'écoute de contrôle
  const handleToggleMonitoring = (enabled: boolean) => {
    setIsMonitoring(enabled);
    audioEngine.setMonitoring(enabled, monitorVolume);
  };

  const handleChangeMonitorVolume = (vol: number) => {
    setMonitorVolume(vol);
    audioEngine.setMonitoring(isMonitoring, vol);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Barre de navigation et statut */}
      <Header
        isActive={isActive}
        failSafeTriggered={metrics.failSafeTriggered}
        onEmergencyStop={handleEmergencyStop}
        onOpenGuide={() => setIsGuideModalOpen(true)}
        onOpenHardwareModal={() => setIsHardwareModalOpen(true)}
        targetLatencyMs={300}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-6 space-y-6">
        {/* Alerte Coupe-Circuit d'Urgence si actif */}
        {metrics.failSafeTriggered && (
          <EmergencyAlert
            reason={metrics.lastErrorMessage || 'Interruption du flux détectée'}
            onReset={handleResetFailSafe}
          />
        )}

        {/* Bannière de résumé technique & faisabilité */}
        <div className="bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-amber-950/20 border border-neutral-800 rounded-2xl p-5 shadow-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Darija Algérienne &bull; Français
                </span>
                <span className="text-xs text-neutral-400 font-medium">
                  Zéro transcription &bull; Préservation intégrale du rythme et de l&apos;accent
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Routage Direct de Micro vers Snapchat Web sur Windows
              </h2>
              <p className="text-xs text-neutral-400 max-w-3xl leading-relaxed">
                Le son de votre micro est transformé avec la signature acoustique de votre ami, puis injecté dans le micro virtuel 
                <code className="text-amber-300 font-mono ml-1">CABLE Input</code>. Snapchat Web reçoit directement la voix modifiée comme un vrai microphone.
              </p>
            </div>

            {/* Bouton de test fonctionnel obligatoire */}
            <button
              onClick={() => setIsTestModalOpen(true)}
              className="cursor-pointer shrink-0 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-750 text-white font-semibold text-xs rounded-xl border border-neutral-700/80 shadow-md hover:border-amber-500/40 transition flex items-center gap-2 group"
            >
              <Zap className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Tester le pipeline (3s)</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                &lt;300ms
              </span>
            </button>
          </div>
        </div>

        {/* Grille principale : Profil vocal & Routage */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Carte 1 : Voix de référence */}
          <ReferenceVoiceCard
            currentProfile={referenceProfile}
            onProfileLoaded={handleProfileLoaded}
            disabled={isActive}
          />

          {/* Carte 2 : Routage Audio vers Micro Virtuel */}
          <AudioRoutingCard
            inputDevices={inputDevices}
            outputDevices={outputDevices}
            selectedInputId={selectedInputId}
            selectedOutputId={selectedOutputId}
            selectedMonitorId={selectedMonitorId}
            isMonitoring={isMonitoring}
            monitorVolume={monitorVolume}
            onSelectInput={setSelectedInputId}
            onSelectOutput={setSelectedOutputId}
            onSelectMonitor={setSelectedMonitorId}
            onToggleMonitoring={handleToggleMonitoring}
            onChangeMonitorVolume={handleChangeMonitorVolume}
            onRefreshDevices={enumerateDevices}
            disabled={isActive}
          />
        </div>

        {/* Carte 3 : Indicateurs en direct, Forme d'onde et Télémétrie */}
        <LiveMonitorCard
          metrics={metrics}
          targetLatencyMs={300}
        />

        {/* Barre de contrôle principale : Démarrer / Arrêter / Statut */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className={`w-3.5 h-3.5 rounded-full ${
              isActive && !metrics.failSafeTriggered 
                ? 'bg-emerald-500 animate-ping' 
                : 'bg-neutral-600'
            }`} />
            <div>
              <div className="text-sm font-bold text-white">
                {isActive && !metrics.failSafeTriggered ? (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    Transmission en direct vers Snapchat active
                  </span>
                ) : (
                  <span>Prêt pour l&apos;appel Snapchat Web</span>
                )}
              </div>
              <div className="text-xs text-neutral-400">
                {isActive 
                  ? "Parlez dans votre micro, votre ami virtuel parle dans l'appel."
                  : "Assurez-vous que l'audio de référence et VB-Cable sont sélectionnés."}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* Bouton Tester */}
            <button
              onClick={() => setIsTestModalOpen(true)}
              disabled={isActive}
              className="cursor-pointer flex-1 sm:flex-none px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs rounded-xl border border-neutral-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Tester</span>
            </button>

            {/* Bouton Démarrer / Arrêter */}
            {!isActive ? (
              <button
                onClick={startLiveTransmission}
                className="cursor-pointer flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-extrabold text-sm rounded-xl shadow-lg shadow-amber-500/25 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Démarrer la transmission</span>
              </button>
            ) : (
              <button
                onClick={stopLiveTransmission}
                className="cursor-pointer flex-1 sm:flex-none px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-red-900 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Arrêter la transmission</span>
              </button>
            )}
          </div>
        </div>

        {/* Checklist rapide de vérification avant appel Snapchat */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-neutral-900/50 p-3.5 rounded-xl border border-neutral-800/80 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">1. Zéro fuite de vraie voix</strong>
              <p className="text-neutral-400 text-[11px]">
                En cas de coupure réseau ou erreur de buffer, la sortie mute à 0 dB instantanément.
              </p>
            </div>
          </div>

          <div className="bg-neutral-900/50 p-3.5 rounded-xl border border-neutral-800/80 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">2. Bilingue Darija &amp; Français</strong>
              <p className="text-neutral-400 text-[11px]">
                Le transfert de formants n&apos;utilise pas d&apos;ASR texte : tous les mots et argots sont conservés intacts.
              </p>
            </div>
          </div>

          <div className="bg-neutral-900/50 p-3.5 rounded-xl border border-neutral-800/80 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">3. Latence inférieure à 300 ms</strong>
              <p className="text-neutral-400 text-[11px]">
                Mesure en continu du temps de traitement pour garantir un flux fluide sans chevauchement.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Modale de test fonctionnel */}
      <TestPipelineModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        referenceProfile={referenceProfile}
        selectedInputId={selectedInputId}
      />

      {/* Modale du Guide Snapchat Web & VB-Cable */}
      <SnapchatGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

      {/* Modale Diagnostic Matériel & Faisabilité */}
      <HardwareEngineModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
        currentMode={engineMode}
        onSelectMode={(mode) => {
          setEngineMode(mode);
          setIsHardwareModalOpen(false);
        }}
      />
    </div>
  );
}
