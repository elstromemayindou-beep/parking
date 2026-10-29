/**
 * AutoGestion Pro v3.0 - Module 6: Stocks, Magasin & Achats
 * Requirements:
 * - RF-68 : Suivi des stocks pièces/produits, alertes de seuil critique et bon de commande
 * - RF-72 : Transfert de pièces détachées inter-succursales avec bon de décharge
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PieceStock, TransfertStock } from '../../types';
import {
  Boxes,
  PlusCircle,
  AlertTriangle,
  ArrowRightLeft,
  Truck,
  ShoppingCart,
  FileCheck2,
  Search,
  Filter,
  CheckCircle2,
  PackageCheck
} from 'lucide-react';

export const StocksModule: React.FC = () => {
  const {
    piecesStock,
    mouvementsStock,
    transfertsStock,
    succursales,
    currentSuccursale,
    ajouterStockPiece,
    commanderStock,
    ajusterStockPiece,
    creerTransfertStock,
    formatCurrency,
    showNotification
  } = useApp();

  const [filterQuery, setFilterQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [modalNewPieceOpen, setModalNewPieceOpen] = useState(false);
  const [modalTransfertOpen, setModalTransfertOpen] = useState(false);
  const [selectedPieceForOrder, setSelectedPieceForOrder] = useState<PieceStock | null>(null);
  const [selectedPieceForAdjustment, setSelectedPieceForAdjustment] = useState<PieceStock | null>(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [quantiteACommander, setQuantiteACommander] = useState<number>(10);

  // New piece form
  const [reference, setReference] = useState('');
  const [nom, setNom] = useState('');
  const [categorie, setCategorie] = useState<PieceStock['categorie']>('Filtres & Vidange');
  const [quantite, setQuantite] = useState<number>(10);
  const [seuilAlerte, setSeuilAlerte] = useState<number>(5);
  const [prixAchat, setPrixAchat] = useState<number>(20000);
  const [prixVente, setPrixVente] = useState<number>(35000);
  const [fournisseur, setFournisseur] = useState('');
  const [emplacement, setEmplacement] = useState('Rayon A-01');

  // Transfert form (RF-72)
  const [transfertPieceId, setTransfertPieceId] = useState<number>(piecesStock[0]?.id || 1);
  const [transfertDestId, setTransfertDestId] = useState<number>(2);
  const [transfertQte, setTransfertQte] = useState<number>(2);

  const categories = [
    'Filtres & Vidange',
    'Freinage',
    'Suspension',
    'Pneumatiques',
    'Électricité & Batterie',
    'Consommables Lavage'
  ];

  const handleCreatePiece = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim() || !nom.trim()) {
      showNotification('Référence et nom requis', 'warning');
      return;
    }

    ajouterStockPiece({
      succursale_id: currentSuccursale.id,
      reference: reference.toUpperCase().trim(),
      nom: nom.trim(),
      categorie,
      quantite_disponible: Number(quantite),
      seuil_alerte: Number(seuilAlerte),
      prix_achat: Number(prixAchat),
      prix_vente: Number(prixVente),
      fournisseur: fournisseur || 'Fournisseur Local',
      emplacement: emplacement || 'Magasin Central'
    });

    setModalNewPieceOpen(false);
    setReference('');
    setNom('');
  };

  const handleExecuteTransfert = (e: React.FormEvent) => {
    e.preventDefault();
    creerTransfertStock(transfertPieceId, transfertDestId, Number(transfertQte));
    setModalTransfertOpen(false);
  };

  const handleConfirmOrder = () => {
    if (!selectedPieceForOrder) return;
    commanderStock(selectedPieceForOrder.id, Number(quantiteACommander), `Réapprovisionnement fournisseur : ${selectedPieceForOrder.fournisseur}`);
    setSelectedPieceForOrder(null);
  };

  const handleAdjustmentSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedPieceForAdjustment) return;
    if (ajusterStockPiece(selectedPieceForAdjustment.id, Number(adjustmentQuantity), adjustmentReason)) {
      setSelectedPieceForAdjustment(null);
      setAdjustmentReason('');
    }
  };

  const filteredPieces = piecesStock.filter(p => {
    const matchesQuery = p.nom.toLowerCase().includes(filterQuery.toLowerCase()) ||
      p.reference.toLowerCase().includes(filterQuery.toLowerCase()) ||
      p.fournisseur.toLowerCase().includes(filterQuery.toLowerCase());
    
    if (categoryFilter === 'ALL') return matchesQuery;
    return matchesQuery && p.categorie === categoryFilter;
  });

  const piecesEnAlerte = piecesStock.filter(p => p.quantite_disponible <= p.seuil_alerte);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
            <Boxes className="w-4 h-4" />
            <span>Module Stocks & Pièces Détachées</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Inventaire Magasin, Seuils Critiques & Transferts
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Suivi des consommables (RF-68), transferts inter-succursales avec bon de décharge (RF-72).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setModalTransfertOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 border border-blue-500/40 font-bold text-xs flex items-center justify-center gap-2 transition hover:scale-105 cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Transfert Inter-Sites (RF-72)</span>
          </button>

          <button
            onClick={() => setModalNewPieceOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition hover:scale-105 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Entrée Nouvelle Pièce</span>
          </button>
        </div>
      </div>

      {/* Critical Stock Alert Banner */}
      {piecesEnAlerte.length > 0 && (
        <div className="bg-red-950/40 border border-red-600/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/30 text-red-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">
                Attention : {piecesEnAlerte.length} article(s) sous le seuil d'alerte critique !
              </h3>
              <p className="text-xs text-red-200 mt-0.5">
                Rupture imminente sur : {piecesEnAlerte.map(p => `${p.nom} (${p.quantite_disponible} restants)`).join(', ')}.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedPieceForOrder(piecesEnAlerte[0]);
              setQuantiteACommander(10);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            Générer Bon de Commande →
          </button>
        </div>
      )}

      {/* Search & Filter bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par référence, désignation, fournisseur..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="ALL">Toutes les catégories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stocks Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Référence</th>
                <th className="py-3 px-4">Désignation & Catégorie</th>
                <th className="py-3 px-4">Emplacement</th>
                <th className="py-3 px-4 text-center">Quantité en Stock</th>
                <th className="py-3 px-4 text-right">P. Achat</th>
                <th className="py-3 px-4 text-right">P. Vente Client</th>
                <th className="py-3 px-4 text-center">Statut Seuil</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredPieces.map((p) => {
                const isLow = p.quantite_disponible <= p.seuil_alerte;
                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">
                      {p.reference}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-sm">{p.nom}</div>
                      <div className="text-[11px] text-slate-400">{p.categorie} • {p.fournisseur}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {p.emplacement}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-mono text-sm font-black px-2.5 py-1 rounded-lg ${
                        isLow ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-slate-800 text-slate-200'
                      }`}>
                        {p.quantite_disponible}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      {formatCurrency(p.prix_achat)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(p.prix_vente)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isLow ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                          Alerte (≤ {p.seuil_alerte})
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                          Optimal
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedPieceForOrder(p);
                          setQuantiteACommander(10);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
                      >
                        Commander +
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPieceForAdjustment(p);
                          setAdjustmentQuantity(p.quantite_disponible);
                          setAdjustmentReason('');
                        }}
                        className="ml-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-200 hover:bg-amber-500/20"
                      >
                        Ajuster
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-md">
        <div className="border-b border-slate-800 p-5">
          <h2 className="text-sm font-bold text-white">Journal détaillé des mouvements de stock</h2>
          <p className="mt-1 text-xs text-slate-400">Entrées, consommations lavage/garage, transferts et ajustements sont conservés avec le responsable et le motif.</p>
        </div>
        {mouvementsStock.length === 0 ? (
          <p className="p-5 text-center text-xs text-slate-500">Aucun mouvement enregistré. Les mouvements seront tracés au fur et à mesure des opérations.</p>
        ) : (
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="sticky top-0 bg-slate-950 text-slate-400">
                <tr>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Article</th>
                  <th className="px-4 py-2.5">Mouvement</th>
                  <th className="px-4 py-2.5 text-right">Variation</th>
                  <th className="px-4 py-2.5 text-right">Avant → après</th>
                  <th className="px-4 py-2.5">Motif / Référence</th>
                  <th className="px-4 py-2.5">Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {mouvementsStock.slice(0, 200).map(movement => (
                  <tr key={movement.id}>
                    <td className="px-4 py-2.5 font-mono text-[10px] text-slate-400">{movement.created_at}</td>
                    <td className="px-4 py-2.5"><span className="font-bold text-white">{movement.piece_nom}</span><span className="ml-1 text-slate-500">{movement.reference_piece}</span></td>
                    <td className="px-4 py-2.5">{movement.type}</td>
                    <td className={`px-4 py-2.5 text-right font-mono font-bold ${movement.type === 'ENTREE' ? 'text-emerald-300' : 'text-amber-200'}`}>
                      {movement.type === 'ENTREE' ? '+' : '−'}{movement.quantite}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">{movement.quantite_avant} → {movement.quantite_apres}</td>
                    <td className="px-4 py-2.5">{movement.motif}{movement.reference_operation && <span className="block text-[10px] text-blue-300">{movement.reference_operation}</span>}</td>
                    <td className="px-4 py-2.5">{movement.responsable}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Inter-Branch Transfers History (RF-72) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-400" />
              <span>Transferts entre établissements</span>
            </h2>
            <p className="text-xs text-slate-400">
              Historique des transferts enregistrés dans l’application.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {transfertsStock.map(trf => {
            const src = succursales.find(s => s.id === trf.succursale_source_id);
            const dst = succursales.find(s => s.id === trf.succursale_dest_id);

            return (
              <div key={trf.id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-blue-400 bg-blue-950/60 px-2 py-1 rounded border border-blue-500/30">
                    {trf.reference_bon}
                  </span>
                  <div>
                    <span className="font-bold text-white">{trf.piece_nom}</span> ({trf.quantite} unités)
                    <div className="text-[11px] text-slate-400">
                      De : <span className="text-slate-300 font-semibold">{src?.nom}</span> → Vers : <span className="text-slate-300 font-semibold">{dst?.nom}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-slate-400">
                  <span className="font-mono text-[11px]">{trf.date_transfert}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    trf.statut === 'RECU' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {trf.statut}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL 1: NOUVELLE PIÈCE EN STOCK */}
      {modalNewPieceOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Ajout d'une Référence Stock</h3>
                  <p className="text-xs text-slate-400">Paramétrage du seuil d'alerte et prix</p>
                </div>
              </div>
              <button onClick={() => setModalNewPieceOpen(false)} className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreatePiece} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Référence Unique *</label>
                  <input
                    type="text"
                    required
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Ex: FLT-AIR-TOY-01"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-mono text-xs font-bold text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Catégorie</label>
                  <select
                    value={categorie}
                    onChange={(e) => setCategorie(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Désignation complète de la pièce *</label>
                <input
                  type="text"
                  required
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex: Filtre à air Toyota Prado V6"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Quantité Initiale</label>
                  <input
                    type="number"
                    value={quantite}
                    onChange={(e) => setQuantite(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-mono text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Seuil Alerte Réappro (RF-68)</label>
                  <input
                    type="number"
                    value={seuilAlerte}
                    onChange={(e) => setSeuilAlerte(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-mono text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Prix d'Achat Fournisseur (FCFA)</label>
                  <input
                    type="number"
                    value={prixAchat}
                    onChange={(e) => setPrixAchat(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-mono text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Prix de Vente Client (FCFA)</label>
                  <input
                    type="number"
                    value={prixVente}
                    onChange={(e) => setPrixVente(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-mono text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Fournisseur Habituel</label>
                  <input
                    type="text"
                    value={fournisseur}
                    onChange={(e) => setFournisseur(e.target.value)}
                    placeholder="Ex: CFAO Motors"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Emplacement Magasin</label>
                  <input
                    type="text"
                    value={emplacement}
                    onChange={(e) => setEmplacement(e.target.value)}
                    placeholder="Ex: Rayon B-02"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setModalNewPieceOpen(false)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer">Annuler</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer">Enregistrer au Magasin</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedPieceForAdjustment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form onSubmit={handleAdjustmentSubmit} className="w-full max-w-md space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div>
              <h2 className="text-base font-bold text-white">Ajuster le stock — {selectedPieceForAdjustment.nom}</h2>
              <p className="mt-1 text-xs text-slate-400">Stock actuellement enregistré : {selectedPieceForAdjustment.quantite_disponible}</p>
            </div>
            <label className="block text-xs font-semibold text-slate-300">
              Nouvelle quantité physique
              <input required type="number" min="0" step="1" value={adjustmentQuantity} onChange={event => setAdjustmentQuantity(Number(event.target.value))} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
            </label>
            <label className="block text-xs font-semibold text-slate-300">
              Motif obligatoire
              <textarea required minLength={3} rows={3} value={adjustmentReason} onChange={event => setAdjustmentReason(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" placeholder="Inventaire, perte, casse, correction…" />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setSelectedPieceForAdjustment(null)} className="rounded-lg bg-slate-700 px-4 py-2 text-xs font-semibold text-white">Retour</button>
              <button type="submit" className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-500">Enregistrer l’ajustement</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: TRANSFERT INTER-SUCCURSALES (RF-72) */}
      {modalTransfertOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Transfert Inter-Succursales (RF-72)</h3>
                  <p className="text-xs text-slate-400">Émission du bon de décharge matériel</p>
                </div>
              </div>
              <button onClick={() => setModalTransfertOpen(false)} className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleExecuteTransfert} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Pièce à Transférer *</label>
                <select
                  value={transfertPieceId}
                  onChange={(e) => setTransfertPieceId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                >
                  {piecesStock.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nom} (Stock dispo : {p.quantite_disponible})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Succursale Destination *</label>
                  <select
                    value={transfertDestId}
                    onChange={(e) => setTransfertDestId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  >
                    {succursales
                      .filter(s => s.id !== currentSuccursale.id)
                      .map(s => (
                        <option key={s.id} value={s.id}>
                          {s.nom} ({s.ville})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Quantité *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={transfertQte}
                    onChange={(e) => setTransfertQte(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-mono text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setModalTransfertOpen(false)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer">Annuler</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer">Émettre Bon de Décharge</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: BON DE COMMANDE FOURNISSEUR */}
      {selectedPieceForOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Bon de Commande Réappro</h3>
                  <p className="text-xs text-slate-400">{selectedPieceForOrder.nom}</p>
                </div>
              </div>
              <button onClick={() => setSelectedPieceForOrder(null)} className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer">✕</button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Fournisseur :</span>
                  <span className="font-bold text-white">{selectedPieceForOrder.fournisseur}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Stock actuel disponible :</span>
                  <span className="font-mono text-red-400 font-bold">{selectedPieceForOrder.quantite_disponible} unités</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Prix unitaire achat :</span>
                  <span className="font-mono text-slate-200">{formatCurrency(selectedPieceForOrder.prix_achat)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Quantité à Commander
                </label>
                <input
                  type="number"
                  min={1}
                  value={quantiteACommander}
                  onChange={(e) => setQuantiteACommander(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-mono text-sm font-bold text-white focus:outline-none"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400">Montant d'achat estimé :</span>
                <span className="font-mono text-emerald-400 font-black text-sm">
                  {formatCurrency(selectedPieceForOrder.prix_achat * Number(quantiteACommander))}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button onClick={() => setSelectedPieceForOrder(null)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer">Annuler</button>
                <button onClick={handleConfirmOrder} className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer">
                  Confirmer Réception Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
