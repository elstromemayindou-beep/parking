/**
 * N.O.B BUSINESS - Widget Alertes Stocks Critiques & Ruptures
 * Requirements:
 * - RF-68 : Suivi des stocks pièces/produits, alertes de seuil critique et bon de commande
 * - Surveillance en temps réel des ruptures (0 unité) et stocks sous le seuil d'alerte minimal
 * - Réapprovisionnement rapide en 1 clic
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PieceStock } from '../types';
import {
  AlertTriangle,
  AlertOctagon,
  Boxes,
  ShoppingCart,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Building,
  MapPin,
  TrendingDown
} from 'lucide-react';

export const StockCriticalAlertsWidget: React.FC = () => {
  const { piecesStock, commanderStock, setActiveModule, setDepartementActif, formatCurrency, showNotification } = useApp();
  const openGlobalStock = () => {
    setDepartementActif('GLOBAL');
    setActiveModule('STOCKS');
  };
  const [orderingPiece, setOrderingPiece] = useState<PieceStock | null>(null);
  const [orderQty, setOrderQty] = useState<number>(10);

  // Filter items in total rupture (0) or below threshold
  const itemsCritiques = piecesStock.filter(p => p.quantite_disponible <= p.seuil_alerte);
  const rupturesTotales = itemsCritiques.filter(p => p.quantite_disponible === 0);

  const handleQuickReorder = (piece: PieceStock) => {
    // Default recommended order: quantity needed to reach 2x the safety threshold
    const recommendedQty = Math.max(5, (piece.seuil_alerte * 2) - piece.quantite_disponible);
    setOrderQty(recommendedQty);
    setOrderingPiece(piece);
  };

  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderingPiece) return;
    commanderStock(orderingPiece.id, Number(orderQty));
    setOrderingPiece(null);
  };

  const handleReorderAllCritical = () => {
    itemsCritiques.forEach(item => {
      const needed = Math.max(5, (item.seuil_alerte * 2) - item.quantite_disponible);
      commanderStock(item.id, needed);
    });
    showNotification(`Bons de commande émis pour les ${itemsCritiques.length} articles critiques !`, 'success');
  };

  if (itemsCritiques.length === 0) {
    return (
      <div className="glass-panel mb-6 flex items-center justify-between gap-4 rounded-2xl border border-white/80 bg-white/75 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            {piecesStock.length > 0 ? <CheckCircle2 className="h-5 w-5" /> : <Boxes className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              {piecesStock.length > 0 ? 'Stock à jour' : 'Aucun article enregistré'}
            </h3>
            <p className="mt-0.5 text-xs text-slate-600">
              {piecesStock.length > 0
                ? `Aucun article sous le seuil d’alerte parmi ${piecesStock.length} référence(s) suivie(s).`
                : 'Ajoutez vos articles pour activer le suivi des seuils et des alertes.'}
            </p>
          </div>
        </div>

        <button
          onClick={openGlobalStock}
          className="glass-button flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-blue-900"
        >
          <Boxes className="h-3.5 w-3.5 text-blue-700" />
          <span>{piecesStock.length > 0 ? 'Voir les stocks' : 'Ajouter des articles'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel mb-6 relative overflow-hidden rounded-3xl border border-white/80 bg-white p-5 shadow-sm">
      {/* Background soft blue glow */}
      <div className="absolute top-0 right-0 w-80 h-32 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white tracking-tight">
                Alertes Stocks & Réapprovisionnement Magasin
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-200 border border-blue-600/50">
                {itemsCritiques.length} référence(s) sous seuil
              </span>
              {rupturesTotales.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-900 text-white border border-blue-400">
                  ⚠️ {rupturesTotales.length} Rupture(s) Totale(s)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Articles dont la quantité disponible est inférieure ou égale au seuil de sécurité (RF-68).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleReorderAllCritical}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition hover:scale-105 cursor-pointer flex items-center gap-1.5"
            title="Émettre un bon de réapprovisionnement groupé pour tous les articles sous seuil"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-white" />
            <span>Commander le Lot ({itemsCritiques.length})</span>
          </button>

          <button
            onClick={openGlobalStock}
            className="px-3 py-1.5 rounded-xl bg-blue-950 hover:bg-blue-900 text-white border border-blue-600/50 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
          >
            <span>Module Stocks</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
          </button>
        </div>
      </div>

      {/* Critical Stock Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
        {itemsCritiques.map((piece) => {
          const isZero = piece.quantite_disponible === 0;
          const deficit = Math.max(0, piece.seuil_alerte - piece.quantite_disponible);
          const ratioPercent = Math.min(100, Math.round((piece.quantite_disponible / piece.seuil_alerte) * 100));

          return (
            <div
              key={piece.id}
              className="p-3.5 rounded-xl border border-slate-800 hover:border-blue-400 bg-slate-950 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="truncate">
                    <span className="font-mono text-[10px] font-bold text-white bg-blue-950 px-2 py-0.5 rounded border border-blue-600/50">
                      {piece.reference}
                    </span>
                    <h4 className="text-xs font-bold text-white mt-1.5 truncate" title={piece.nom}>
                      {piece.nom}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {piece.categorie}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`font-mono text-sm font-black px-2 py-0.5 rounded-lg inline-block ${
                      isZero
                        ? 'bg-blue-900 text-white border border-blue-400 font-extrabold'
                        : 'bg-blue-950 text-blue-200 border border-blue-600/50'
                    }`}>
                      {piece.quantite_disponible} dispo
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                      Seuil min : {piece.seuil_alerte}
                    </span>
                  </div>
                </div>

                {/* Gauge bar */}
                <div className="my-2 space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Niveau de réserve</span>
                    <span className="text-blue-300 font-bold">
                      {ratioPercent}% du seuil
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full transition-all duration-500 bg-blue-500"
                      style={{ width: `${Math.max(5, ratioPercent)}%` }}
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="text-[10px] text-slate-400 space-y-0.5 pt-1 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Building className="w-2.5 h-2.5 text-blue-400" />
                      {piece.fournisseur}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <MapPin className="w-2.5 h-2.5 text-blue-400" />
                      {piece.emplacement}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300 font-mono">
                    <span>P. Achat : {formatCurrency(piece.prix_achat)}</span>
                    <span className="text-blue-300 font-semibold">Vente : {formatCurrency(piece.prix_vente)}</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-300 font-medium">
                  {deficit > 0 ? `Déficit : -${deficit} unités` : 'Au seuil strict'}
                </span>
                <button
                  onClick={() => handleQuickReorder(piece)}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <ShoppingCart className="w-3 h-3 text-white" />
                  <span>Réappro +</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* QUICK REORDER MODAL */}
      {orderingPiece && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-600/30 text-red-400 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Réapprovisionnement d'Urgence</h4>
                  <p className="text-xs text-slate-400">{orderingPiece.nom}</p>
                </div>
              </div>
              <button
                onClick={() => setOrderingPiece(null)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmOrder} className="space-y-3.5">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Référence :</span>
                  <span className="font-mono text-blue-400 font-bold">{orderingPiece.reference}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Stock Actuel :</span>
                  <span className="font-mono font-bold text-red-400">{orderingPiece.quantite_disponible} unités</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Seuil de sécurité minimal :</span>
                  <span className="font-mono text-slate-300">{orderingPiece.seuil_alerte} unités</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Fournisseur attitré :</span>
                  <span className="text-white font-semibold">{orderingPiece.fournisseur}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Quantité à commander / recevoir *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={orderQty}
                  onChange={(e) => setOrderQty(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-mono text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">Total estimé commande HT :</span>
                <span className="text-emerald-400 font-mono font-black text-sm">
                  {formatCurrency(orderingPiece.prix_achat * Number(orderQty))}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setOrderingPiece(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition hover:scale-105 cursor-pointer"
                >
                  Confirmer Entrée de Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
