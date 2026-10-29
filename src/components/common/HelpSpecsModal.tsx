/**
 * Help modal describing the application features currently available.
 */

import React from 'react';
import { FileText } from 'lucide-react';

interface HelpSpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpSpecsModal: React.FC<HelpSpecsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const keySpecs = [
    { code: 'COMPTE', title: 'Connexion & établissement', desc: 'Connexion via Supabase et données séparées selon l’établissement sélectionné.' },
    { code: 'CAISSE', title: 'Caisse', desc: 'Suivi des encaissements et des dépenses validées, avec une synthèse de la session.' },
    { code: 'PARKING', title: 'Parking', desc: 'Saisie manuelle des entrées et sorties. La reconnaissance OCR n’est pas activée.' },
    { code: 'RAPPORTS', title: 'Rapports', desc: 'Aperçus basés sur les données enregistrées ; impression ou partage manuel uniquement.' },
    { code: 'DEMANDES', title: 'Demandes clients', desc: 'Le traitement et la note sont enregistrés en interne ; aucun message n’est envoyé au client.' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Aide et périmètre actuel
              </h3>
              <p className="text-xs text-slate-400">
                Fonctionnalités disponibles dans l’application
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h4 className="font-bold text-white text-sm mb-1">À savoir</h4>
            <p className="text-slate-400 leading-relaxed">
              Les applications mobiles d’agents et de clients, les notifications push, les connexions automatiques Mobile Money, l’OCR, l’IA et le mode hors ligne ne sont pas disponibles. Les rapports sont des aperçus de gestion, pas des documents comptables certifiés.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm mb-2">Fonctions disponibles :</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {keySpecs.map(s => (
                <div key={s.code} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2">
                  <span className="font-mono text-[10px] font-bold text-blue-400 bg-blue-950 px-1.5 py-0.5 rounded border border-blue-600/40 shrink-0">
                    {s.code}
                  </span>
                  <div>
                    <span className="font-bold text-slate-200">{s.title} : </span>
                    <span className="text-slate-400 text-[11px]">{s.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
            >
              Fermer la Documentation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
