import React from 'react';
import { 
  X, 
  ExternalLink, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Mic, 
  Speaker, 
  ShieldCheck, 
  ArrowRight,
  Info
} from 'lucide-react';

interface SnapchatGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SnapchatGuideModal: React.FC<SnapchatGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

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
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Guide de Configuration : Windows &rarr; Micro Virtuel &rarr; Snapchat Web
            </h3>
            <p className="text-xs text-neutral-400">
              Pourquoi un micro virtuel est indispensable et comment le configurer en 3 minutes
            </p>
          </div>
        </div>

        {/* Explication honnête de la contrainte technique de Windows */}
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 mb-6 space-y-2 text-xs">
          <div className="font-semibold text-neutral-200 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-sky-400" />
            Réalité technique du navigateur (Sécurité Windows) :
          </div>
          <p className="text-neutral-300 leading-relaxed">
            Un navigateur web (Google Chrome ou Microsoft Edge) s&apos;exécute dans un bac à sable isolé (sandbox). 
            <strong>Aucune page web ne peut créer ou installer un pilote de périphérique physique ou virtuel directement dans le noyau de Windows</strong>.
          </p>
          <p className="text-neutral-400 leading-relaxed">
            La solution universelle, standard et gratuite est d&apos;utiliser un pont audio virtuel (VB-Audio Virtual Cable) : VoiceBridge envoie le son transformé dans l&apos;entrée du câble (<code className="text-amber-300">CABLE Input</code>), et Windows le fait réapparaître comme un microphone (<code className="text-amber-300">CABLE Output</code>) sélectionnable dans Snapchat Web !
          </p>
        </div>

        {/* Schéma du flux audio */}
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 mb-6">
          <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-3">
            Schéma du flux audio en direct :
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-800">
              <Mic className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <div className="font-bold text-white">1. Votre Micro</div>
              <div className="text-[10px] text-neutral-400">Vous parlez (Darija + FR)</div>
            </div>

            <div className="bg-neutral-900 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
              <Layers className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <div className="font-bold text-amber-300">2. VoiceBridge</div>
              <div className="text-[10px] text-neutral-300">Conversion vers voix ami</div>
            </div>

            <div className="bg-neutral-900 p-3 rounded-lg border border-sky-500/30 bg-sky-500/5">
              <Speaker className="w-4 h-4 text-sky-400 mx-auto mb-1" />
              <div className="font-bold text-sky-300">3. VB-CABLE Input</div>
              <div className="text-[10px] text-neutral-300">Sortie de cette page</div>
            </div>

            <div className="bg-neutral-900 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
              <CheckCircle2 className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
              <div className="font-bold text-yellow-300">4. Snapchat Web</div>
              <div className="text-[10px] text-neutral-300">Micro: CABLE Output</div>
            </div>
          </div>
        </div>

        {/* Étapes détaillées */}
        <div className="space-y-4">
          {/* Étape 1 */}
          <div className="flex items-start gap-3 bg-neutral-950/60 p-4 rounded-xl border border-neutral-800">
            <div className="w-6 h-6 rounded-full bg-amber-500 text-neutral-950 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
              1
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="font-bold text-white text-sm">
                Installer le pilote VB-Audio Virtual Cable (Gratuit)
              </div>
              <p className="text-neutral-300">
                Téléchargez le pilote officiel gratuit depuis le site de l&apos;éditeur français VB-Audio :
              </p>
              <a
                href="https://vb-audio.com/Cable/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-300 rounded-lg font-semibold transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger VB-CABLE Driver pour Windows</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <p className="text-neutral-400 text-[11px]">
                Décompressez le zip, clic droit sur <code className="text-neutral-200">VBCABLE_Setup_x64.exe</code> &rarr; &quot;Exécuter en tant qu&apos;administrateur&quot;. Redémarrez si Windows le demande.
              </p>
            </div>
          </div>

          {/* Étape 2 */}
          <div className="flex items-start gap-3 bg-neutral-950/60 p-4 rounded-xl border border-neutral-800">
            <div className="w-6 h-6 rounded-full bg-amber-500 text-neutral-950 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
              2
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="font-bold text-white text-sm">
                Régler la sortie dans VoiceBridge
              </div>
              <p className="text-neutral-300">
                Dans le panneau &quot;Routage Audio&quot; de cette application :
              </p>
              <ul className="list-disc list-inside space-y-1 text-neutral-300 pl-1">
                <li>Entrée 1 : Sélectionnez votre <strong>Microphone physique habituel</strong>.</li>
                <li>Sortie 2 : Sélectionnez <strong>&quot;CABLE Input (VB-Audio Virtual Cable)&quot;</strong>.</li>
                <li>Écoute 3 : Activez l&apos;écoute de contrôle sur <strong>vos écouteurs</strong> si vous voulez vérifier en direct.</li>
              </ul>
            </div>
          </div>

          {/* Étape 3 */}
          <div className="flex items-start gap-3 bg-neutral-950/60 p-4 rounded-xl border border-neutral-800">
            <div className="w-6 h-6 rounded-full bg-amber-500 text-neutral-950 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
              3
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="font-bold text-white text-sm">
                Sélectionner le micro virtuel dans Snapchat Web
              </div>
              <p className="text-neutral-300">
                Ouvrez votre navigateur sur <a href="https://web.snapchat.com" target="_blank" rel="noreferrer" className="text-amber-400 underline">web.snapchat.com</a> :
              </p>
              <ul className="list-disc list-inside space-y-1 text-neutral-300 pl-1">
                <li>Cliquez sur l&apos;icône de cadenas ou de réglages à gauche de l&apos;URL de la barre d&apos;adresse.</li>
                <li>Dans les autorisations du site &rarr; <strong>Microphone</strong> &rarr; Sélectionnez <strong>&quot;CABLE Output (VB-Audio Virtual Cable)&quot;</strong>.</li>
                <li>Ou dans les réglages d&apos;appel Snapchat, choisissez &quot;CABLE Output&quot; comme source micro.</li>
              </ul>
            </div>
          </div>

          {/* Étape 4 */}
          <div className="flex items-start gap-3 bg-neutral-950/60 p-4 rounded-xl border border-neutral-800">
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-neutral-950 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
              4
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="font-bold text-white text-sm">
                Validation finale par un véritable test d&apos;appel
              </div>
              <p className="text-neutral-300">
                Faites un premier appel court avec votre ami ou un contact de confiance pour valider :
              </p>
              <div className="space-y-1 text-neutral-300">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Aucun écho ou larsen (grâce au port du casque fermé)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Délai naturel &lt;300ms sans que vos paroles ne se chevauchent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Reconnaissance instantanée de la voix de l&apos;ami par l&apos;interlocuteur</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="cursor-pointer px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs rounded-xl transition"
          >
            Fermer le guide
          </button>
        </div>
      </div>
    </div>
  );
};
