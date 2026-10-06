import React, { useEffect, useRef, useState } from 'react';
import { 
  UploadCloud, 
  FileAudio, 
  Play, 
  Pause, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ShieldCheck, 
  Waves,
  Trash2,
  Info
} from 'lucide-react';
import { ReferenceVoiceProfile } from '../types';

interface ReferenceVoiceCardProps {
  currentProfile: ReferenceVoiceProfile | null;
  onProfileLoaded: (profile: ReferenceVoiceProfile | null) => void;
  disabled?: boolean;
}

export const ReferenceVoiceCard: React.FC<ReferenceVoiceCardProps> = ({
  currentProfile,
  onProfileLoaded,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [pendingAudio, setPendingAudio] = useState<{ buffer: AudioBuffer; url: string; name: string } | null>(null);
  const [clipStart, setClipStart] = useState(0);
  const [clipEnd, setClipEnd] = useState(0);
  const previewRef = useRef<HTMLAudioElement>(null);
  const importingRef = useRef(false);

  useEffect(() => {
    return () => { if (pendingAudio) URL.revokeObjectURL(pendingAudio.url); };
  }, [pendingAudio]);

  useEffect(() => {
    return () => { if (currentProfile?.audioUrl) URL.revokeObjectURL(currentProfile.audioUrl); };
  }, [currentProfile?.audioUrl]);

  // Encode uniquement le passage sélectionné en WAV mono.
  const makeWav = (buffer: AudioBuffer, start: number, end: number): Blob => {
    const first = Math.floor(start * buffer.sampleRate);
    const last = Math.min(buffer.length, Math.floor(end * buffer.sampleRate));
    const count = last - first;
    const bytes = new ArrayBuffer(44 + count * 2);
    const view = new DataView(bytes);
    const text = (offset: number, value: string) => {
      for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
    };
    text(0, 'RIFF'); view.setUint32(4, 36 + count * 2, true);
    text(8, 'WAVE'); text(12, 'fmt '); view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); view.setUint16(22, 1, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * 2, true);
    view.setUint16(32, 2, true); view.setUint16(34, 16, true);
    text(36, 'data'); view.setUint32(40, count * 2, true);
    const channels = Array.from({ length: buffer.numberOfChannels }, (_, ch) => buffer.getChannelData(ch));
    for (let i = 0; i < count; i++) {
      const sample = Math.max(-1, Math.min(1, channels.reduce((sum, channel) => sum + channel[first + i], 0) / channels.length));
      view.setInt16(44 + i * 2, Math.round(sample * (sample < 0 ? 32768 : 32767)), true);
    }
    return new Blob([bytes], { type: 'audio/wav' });
  };

  const handleFile = async (file: File) => {
    if (disabled || importingRef.current) return;
    setErrorMsg(null);
    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/') &&
        !/\.(wav|mp3|m4a|ogg|flac|aac|mp4|mov|webm)$/i.test(file.name)) {
      setErrorMsg('Choisissez un audio ou une vidéo MP4, MOV ou WebM.');
      return;
    }
    if (!file.size || file.size > 100 * 1024 * 1024) {
      setErrorMsg('Le fichier est vide ou dépasse la limite de 100 Mo.');
      return;
    }
    importingRef.current = true;
    setIsAnalyzing(true);
    let context: AudioContext | null = null;
    try {
      context = new AudioContext();
      const buffer = await context.decodeAudioData(await file.arrayBuffer());
      if (!buffer.length || !buffer.numberOfChannels || !Number.isFinite(buffer.duration)) {
        throw new Error('Aucune piste audio exploitable dans ce fichier.');
      }
      const url = URL.createObjectURL(makeWav(buffer, 0, buffer.duration));
      setPendingAudio({ buffer, url, name: file.name });
      setClipStart(0);
      setClipEnd(Math.min(60, buffer.duration));
    } catch (err) {
      setErrorMsg('Extraction impossible : fichier sans piste audio décodable, endommagé ou codec incompatible avec ce navigateur. Essayez un MP4 avec son AAC ou un fichier WAV/MP3.');
    } finally {
      if (context) await context.close().catch(() => {});
      importingRef.current = false;
      setIsAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const validateClip = async () => {
    if (!pendingAudio || disabled || isAnalyzing) return;
    if (!Number.isFinite(clipStart) || !Number.isFinite(clipEnd) || clipStart < 0 ||
        clipEnd > pendingAudio.buffer.duration || clipEnd - clipStart < 0.1) {
      setErrorMsg('Choisissez un début et une fin valides, avec au moins 0,1 seconde de son.');
      return;
    }
    previewRef.current?.pause();
    if ((clipEnd - clipStart) * pendingAudio.buffer.sampleRate * 2 > 30 * 1024 * 1024) {
      setErrorMsg('Passage trop long : sélectionnez un extrait plus court (20 à 60 secondes recommandées).');
      return;
    }
    setErrorMsg(null);
    const wav = makeWav(pendingAudio.buffer, clipStart, clipEnd);
    const file = new File([wav], pendingAudio.name.replace(/\.[^.]+$/, '') + '-reference.wav', { type: 'audio/wav' });
    await analyzeFile(file, clipEnd - clipStart, pendingAudio.buffer.sampleRate);
  };

  // Gérer la lecture / pause de l'audio de référence
  const togglePlay = () => {
    if (!audioPlayerRef.current) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Playback error:', err);
      });
    }
  };

  // L'import reste local : aucune référence n'est envoyée au serveur.
  const analyzeFile = async (file: File, duration: number, sampleRate: number) => {
    const audioUrl = URL.createObjectURL(file);
    onProfileLoaded({
      id: 'ref-media-' + Date.now(),
      name: file.name,
      fileSizeBytes: file.size,
      durationSeconds: duration,
      sampleRate,
      channels: 1,
      snrDb: 0,
      score: 0,
      qualityLevel: 'INSUFFISANTE',
      issues: ['La qualité acoustique et la ressemblance vocale ne sont pas évaluées par cet import.'],
      strengths: ['Passage extrait et décodé localement, prêt à être écouté.'],
      format: 'WAV PCM — extrait local',
      audioUrl,
    });
    setPendingAudio(null);
  };

  // Charger un exemple représentatif (voix ami parlant Darija + Français)
  const loadExampleSample = () => {
    // Création d'un profil échantillon de référence
    const demoProfile: ReferenceVoiceProfile = {
      id: 'demo-ami-1',
      name: 'echantillon_voix_ami_darija_fr.wav',
      fileSizeBytes: 2450000,
      durationSeconds: 28,
      sampleRate: 48000,
      channels: 1,
      snrDb: 32,
      score: 92,
      qualityLevel: 'EXCELLENTE',
      issues: [],
      strengths: [
        "Durée idéale (28 secondes) : couverture acoustique équilibrée.",
        "Excellent rapport signal/bruit (32 dB) : aucun souffle parasite.",
        "Spectre riche en phonèmes gutturaux (ع / ح / ق) et voyelles françaises.",
      ],
      format: 'WAV 48kHz PCM (Format optimal)',
      audioUrl: '', // Déclenché via oscillateur / sample local si besoin
      detectedPitchHz: 128,
      formantsProfile: [580, 1620, 2680],
    };

    onProfileLoaded(demoProfile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (disabled || isAnalyzing) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5 lg:p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <FileAudio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Voix de Référence de l&apos;Ami
            </h2>
            <p className="text-xs text-neutral-400">
              Audio ou vidéo source : choisissez le passage à utiliser comme référence
            </p>
          </div>
        </div>

        {currentProfile && (
          <button
            onClick={() => onProfileLoaded(null)}
            disabled={disabled}
            className="cursor-pointer text-xs text-neutral-400 hover:text-red-400 flex items-center gap-1 transition p-1"
            title="Supprimer la voix actuelle"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Changer</span>
          </button>
        )}
      </div>

      {/* Zone de glisser-déposer / Import */}
      {pendingAudio ? (
        <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4 space-y-3">
          <p className="text-sm text-white break-all">{pendingAudio.name}</p>
          <p className="text-xs text-neutral-400">Écoutez et choisissez un passage où votre ami parle seul, sans musique. Extraction locale, avant analyse.</p>
          <audio ref={previewRef} controls src={pendingAudio.url} className="w-full"
            onPlay={() => {
              const player = previewRef.current;
              if (player && (player.currentTime < clipStart || player.currentTime >= clipEnd)) player.currentTime = clipStart;
            }}
            onTimeUpdate={() => {
              const player = previewRef.current;
              if (player && player.currentTime >= clipEnd) { player.pause(); player.currentTime = clipStart; }
            }} />
          <div className="flex flex-wrap gap-3 text-xs text-neutral-300">
            <label>Début (secondes)
              <input type="number" min="0" max={pendingAudio.buffer.duration} step="0.1" value={clipStart}
                disabled={disabled || isAnalyzing} onChange={e => setClipStart(Number(e.target.value))}
                className="block bg-neutral-800 rounded p-2 mt-1 w-28" />
            </label>
            <label>Fin (secondes)
              <input type="number" min="0" max={pendingAudio.buffer.duration} step="0.1" value={clipEnd}
                disabled={disabled || isAnalyzing} onChange={e => setClipEnd(Number(e.target.value))}
                className="block bg-neutral-800 rounded p-2 mt-1 w-28" />
            </label>
          </div>
          <p className="text-xs text-neutral-400">Durée totale : {pendingAudio.buffer.duration.toFixed(1)} s. Passage : {Math.max(0, clipEnd - clipStart).toFixed(1)} s. Durée recommandée : 20 à 60 s.</p>
          <div className="flex gap-3">
            <button type="button" onClick={validateClip} disabled={disabled || isAnalyzing}
              className="bg-amber-500 text-neutral-950 px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-50">
              {isAnalyzing ? 'Analyse en cours…' : 'Valider ce passage'}
            </button>
            <button type="button" onClick={() => { previewRef.current?.pause(); setPendingAudio(null); setErrorMsg(null); }}
              disabled={disabled || isAnalyzing} className="text-neutral-300 text-xs">Annuler</button>
          </div>
        </div>
      ) : !currentProfile ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
            dragActive 
              ? 'border-amber-400 bg-amber-500/10 scale-[1.01]' 
              : 'border-neutral-700/80 hover:border-neutral-600 bg-neutral-950/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,video/mp4,video/quicktime,video/webm,.wav,.mp3,.m4a,.ogg,.flac,.aac,.mp4,.mov,.webm"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
            disabled={disabled || isAnalyzing}
          />

          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-800/80 border border-neutral-700 flex items-center justify-center text-amber-400 shadow-inner">
              {isAnalyzing ? (
                <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <UploadCloud className="w-6 h-6" />
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-neutral-200">
                {isAnalyzing ? "Analyse acoustique en cours..." : "Glissez l'enregistrement de votre ami ici"}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Audio : WAV, MP3, M4A, OGG, FLAC, AAC • Vidéo : MP4, MOV, WebM selon les codecs • Maximum : 100 Mo
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isAnalyzing}
                className="cursor-pointer px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs rounded-xl border border-neutral-600/60 transition shadow-sm"
              >
                Importer un audio ou une vidéo
              </button>

              <button
                type="button"
                onClick={loadExampleSample}
                disabled={disabled || isAnalyzing}
                className="cursor-pointer px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-medium text-xs rounded-xl border border-amber-500/30 transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Charger profil de démo (Darija/Français)
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Profil sélectionné avec analyse détaillée de qualité */
        <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4.5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {currentProfile.audioUrl ? (
                <button
                  onClick={togglePlay}
                  className="cursor-pointer w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 flex items-center justify-center shadow-lg transition active:scale-95 shrink-0"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </button>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-amber-400 shrink-0">
                  <Waves className="w-5 h-5" />
                </div>
              )}

              <div>
                <h4 className="text-sm font-bold text-white truncate max-w-[220px] sm:max-w-[320px]">
                  {currentProfile.name}
                </h4>
                <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                  <span>~{currentProfile.durationSeconds}s</span>
                  <span>•</span>
                  <span>{currentProfile.format}</span>
                  <span>•</span>
                  <span>{currentProfile.sampleRate} Hz</span>
                </div>
              </div>
            </div>

            {/* Note globale de qualité */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                currentProfile.qualityLevel === 'EXCELLENTE'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : currentProfile.qualityLevel === 'BONNE'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {currentProfile.id.startsWith('ref-media-') ? 'Audio extrait localement' : `Qualité ${currentProfile.qualityLevel} (${currentProfile.score}/100)`}
              </span>
            </div>
          </div>

          {currentProfile.audioUrl && (
            <audio
              ref={audioPlayerRef}
              src={currentProfile.audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          )}

          {/* Grille des critères acoustiques */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-neutral-800/80 text-xs">
            <div className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800">
              <span className="text-neutral-400 block mb-1">Rapport Signal/Bruit (SNR)</span>
              <span className="font-semibold text-emerald-400 text-sm">
                {currentProfile.id.startsWith('ref-media-') ? 'Non mesuré' : `~${currentProfile.snrDb} dB (Clarté vocale)`}
              </span>
            </div>

            <div className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800">
              <span className="text-neutral-400 block mb-1">Hauteur vocale cible (F0)</span>
              <span className="font-semibold text-amber-300 text-sm">
                {currentProfile.id.startsWith('ref-media-') ? 'Non mesurée' : `~${currentProfile.detectedPitchHz || 130} Hz (Voix masculine/naturelle)`}
              </span>
            </div>

            <div className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800">
              <span className="text-neutral-400 block mb-1">Darija + Français</span>
              <span className="font-semibold text-sky-300 text-sm">
                À vérifier par écoute
              </span>
            </div>
          </div>

          {/* Points forts et recommandations */}
          {currentProfile.strengths.length > 0 && (
            <div className="space-y-1 text-xs">
              {currentProfile.strengths.map((str, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-neutral-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{str}</span>
                </div>
              ))}
            </div>
          )}

          {currentProfile.issues.length > 0 && (
            <div className="space-y-1 text-xs pt-1">
              {currentProfile.issues.map((iss, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-amber-400">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{iss}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="mt-3 p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Déclaration de confidentialité et traitement éphémère */}
      <div className="mt-4 flex items-start gap-2 text-[11px] text-neutral-400 bg-neutral-950/40 p-2.5 rounded-xl border border-neutral-800/60">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-neutral-200">Confidentialité garantie :</strong> L&apos;extraction et la sélection du passage restent dans votre navigateur. Cet import n&apos;envoie pas votre fichier au serveur et ne l&apos;enregistre pas sur disque.
        </p>
      </div>
    </div>
  );
};
