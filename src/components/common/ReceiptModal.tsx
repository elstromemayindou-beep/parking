/**
 * Print receipts and service documents generated from recorded data.
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { Printer, X, CheckCircle, Car } from 'lucide-react';

export const ReceiptModal: React.FC = () => {
  const { receiptModalData, setReceiptModalData, currentSuccursale, formatCurrency } = useApp();

  if (!receiptModalData || !receiptModalData.visible) return null;

  const { type, data } = receiptModalData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white text-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative font-mono text-xs">
        {/* Close Button */}
        <button
          onClick={() => setReceiptModalData(null)}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-800 font-bold text-base cursor-pointer"
        >
          ✕
        </button>

        {/* Printable Ticket Receipt Content */}
        <div className="text-center pb-3 border-b-2 border-dashed border-slate-300">
          <div className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
            AUTOGESTION PRO v3.0
          </div>
          <div className="text-[11px] text-slate-600 font-sans">
            {currentSuccursale.nom}
          </div>
          <div className="text-[10px] text-slate-500 font-sans">
            {currentSuccursale.adresse} - {currentSuccursale.ville}
          </div>
          <div className="text-[10px] text-slate-500 font-sans">
            Tél : {currentSuccursale.telephone}
          </div>
        </div>

        {/* Ticket Type Specific Body */}
        {type === 'PARKING' && (
          <div className="py-4 space-y-2">
            <div className="text-center font-bold text-xs uppercase bg-slate-100 py-1 rounded">
              TICKET DE STATIONNEMENT
            </div>

            <div className="my-3 flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-500">Référence du ticket</span>
              <span className="font-bold text-[10px] text-slate-600 mt-1">
                {data.code_ticket}
              </span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">Plaque Immat :</span>
                <span className="font-black text-sm">{data.plaque}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Véhicule :</span>
                <span>{data.type_vehicule === 'MOTO' ? 'Moto' : 'Voiture'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Emplacement :</span>
                <span className="font-bold">Place {data.place_numero}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Heure Entrée :</span>
                <span>{data.heure_entree}</span>
              </div>
              {data.heure_sortie && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Heure Sortie :</span>
                  <span>{data.heure_sortie}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600">Tarif Catégorie :</span>
                <span>{data.type_client}</span>
              </div>
              {data.montant_final !== undefined && (
                <div className="flex justify-between pt-2 border-t border-dashed border-slate-300 font-black text-sm">
                  <span>MONTANT PAYÉ :</span>
                  <span>{formatCurrency(data.montant_final)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {type === 'LAVAGE' && (
          <div className="py-4 space-y-2">
            <div className="text-center font-bold text-xs uppercase bg-slate-100 py-1 rounded">
              REÇU DE LAVAGE & DETAILING
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">Réf Prestation :</span>
                <span className="font-bold">{data.code_lavage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Véhicule :</span>
                <span className="font-black">{data.type_vehicule === 'MOTO' ? 'Moto · ' : 'Voiture · '}{data.plaque}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Client :</span>
                <span>{data.client_nom}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Formule :</span>
                <span className="font-bold">{data.formule}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-dashed border-slate-300 font-black text-sm">
                <span>TOTAL ENCAISSÉ :</span>
                <span>{formatCurrency(data.prix)}</span>
              </div>
            </div>
          </div>
        )}

        {type === 'GARAGE' && (
          <div className="py-4 space-y-2">
            <div className="text-center font-bold text-xs uppercase bg-slate-100 py-1 rounded">
              DEVIS & ORDRE DE RÉPARATION
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">N° OR :</span>
                <span className="font-bold">{data.numero_or}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Véhicule :</span>
                <span className="font-black">{data.type_vehicule === 'MOTO' ? 'Moto' : 'Voiture'} · {data.plaque} ({data.modele})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Kilométrage :</span>
                <span>{data.kilometrage} km</span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-600 block text-[10px] mb-1 font-bold">PIÈCES DÉTACHÉES :</span>
                {data.pieces_demandees?.map((p: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-[10px]">
                    <span>{p.nom} x{p.qte}</span>
                    <span>{formatCurrency(p.prix * p.qte)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-1 text-[10px]">
                <span className="text-slate-600">Main d'œuvre atelier :</span>
                <span>{formatCurrency(data.main_oeuvre_montant || 0)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-dashed border-slate-300 font-black text-sm">
                <span>TOTAL ESTIMÉ TTC :</span>
                <span>{formatCurrency(data.montant_total_estime || 0)}</span>
              </div>
            </div>
          </div>
        )}

        {type === 'CLOTURE' && (
          <div className="py-4 space-y-2">
            <div className="text-center font-bold text-xs uppercase bg-slate-100 py-1 rounded">
              FEUILLE DE CLÔTURE DE CAISSE (RF-47)
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">Date Session :</span>
                <span>{data.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Recettes Théoriques :</span>
                <span>{formatCurrency(data.recettes_especes_theorique + data.recettes_momo_theorique + data.recettes_airtel_theorique)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Dépenses Jour :</span>
                <span>-{formatCurrency(data.depenses_validees)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-600">Solde Net Théorique :</span>
                <span>{formatCurrency(data.solde_net_theorique)}</span>
              </div>
              <div className="flex justify-between text-amber-700 font-bold pt-1 border-t border-dashed border-slate-300">
                <span>Écart Comptage Saisi :</span>
                <span>{formatCurrency(data.ecart_total || 0)}</span>
              </div>
              <div className="text-[10px] text-slate-500 italic mt-1">
                Motif : {data.motif_ecart}
              </div>
            </div>
          </div>
        )}

        {type === 'PAIE' && (
          <div className="py-4 space-y-2">
            <div className="text-center font-bold text-xs uppercase bg-slate-100 py-1 rounded">
              BULLETIN DE PAIE NET (RF-55)
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">Salarié :</span>
                <span className="font-bold">{data.employe?.nom_complet}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Poste :</span>
                <span>{data.employe?.poste}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Salaire Base :</span>
                <span>{formatCurrency(data.employe?.salaire_base || 0)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Primes Rendement :</span>
                <span>+{formatCurrency(data.breakdown?.totalPrimes || 0)}</span>
              </div>
              <div className="flex justify-between text-red-700">
                <span>Retenues Amendes :</span>
                <span>-{formatCurrency(data.breakdown?.totalAmendes || 0)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-dashed border-slate-300 font-black text-sm">
                <span>NET À PAYER :</span>
                <span>{formatCurrency(data.breakdown?.salaireNet || 0)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t-2 border-dashed border-slate-300 text-center text-[9px] text-slate-500">
          <div>Merci de votre confiance !</div>
          <div>Reçu généré depuis les données enregistrées</div>
          <div className="mt-2 text-slate-400">Imprimé le {new Date().toLocaleString('fr-FR')}</div>
        </div>

        {/* Action Controls */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between font-sans">
          <button
            onClick={() => setReceiptModalData(null)}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
          >
            Fermer
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimer Ticket (80mm)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
