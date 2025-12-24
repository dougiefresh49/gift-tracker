'use client';

import { useState, useMemo } from 'react';
import { Receipt, DollarSign, CheckCircle } from 'lucide-react';
import { addReconciliation } from '~/actions/gift-actions';
import type { Gift, Profile } from '~/lib/types';

interface ReconciliationsViewProps {
  gifts: Gift[];
  profiles: Profile[];
  currentUser: string;
}

export function ReconciliationsView({
  gifts,
  profiles,
  currentUser,
}: ReconciliationsViewProps) {
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [reconciliationForm, setReconciliationForm] = useState<{
    purchaserId: string;
    amount: string;
    transactionType: 'iou' | 'cash' | 'check' | 'bank_transfer' | 'trade';
    notes: string;
  } | null>(null);

  const currentUserProfile = profiles.find((p) => p.id === currentUser);

  // Filter gifts that were claimed by current user for selected recipients
  const relevantGifts = useMemo(() => {
    if (selectedRecipients.length === 0) return [];
    return gifts.filter(
      (g) =>
        g.claimed_by_id === currentUser &&
        g.gift_recipients?.some((r) =>
          selectedRecipients.includes(r.profile.id)
        )
    );
  }, [gifts, selectedRecipients, currentUser]);

  // Group by purchaser and calculate totals
  const purchaserTotals = useMemo(() => {
    const totals: Record<
      string,
      { purchaser: Profile; gifts: Gift[]; total: number; credits: number }
    > = {};

    relevantGifts.forEach((gift) => {
      if (!gift.purchaser_id) return;
      const purchaser = profiles.find((p) => p.id === gift.purchaser_id);
      if (!purchaser) return;

      if (!totals[gift.purchaser_id]) {
        totals[gift.purchaser_id] = {
          purchaser,
          gifts: [],
          total: 0,
          credits: 0,
        };
      }

      totals[gift.purchaser_id]!.gifts.push(gift);
      const recipientCount = gift.gift_recipients?.length || 1;
      const costPerRecipient = (gift.price ?? 0) / recipientCount;
      const returnStatus = gift.return_status ?? 'NONE';

      if (returnStatus !== 'NONE') {
        // Returned items are credits back to the purchaser
        totals[gift.purchaser_id]!.credits += costPerRecipient;
      } else {
        // Non-returned items count towards what's owed
        totals[gift.purchaser_id]!.total += costPerRecipient;
      }
    });

    return Object.values(totals);
  }, [relevantGifts, profiles]);

  const toggleRecipient = (recipientId: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(recipientId)
        ? prev.filter((id) => id !== recipientId)
        : [...prev, recipientId]
    );
  };

  const handleReconcile = async (
    purchaserId: string,
    recipientId: string,
    amount: number
  ) => {
    if (!reconciliationForm) return;

    try {
      await addReconciliation({
        gifterId: currentUser,
        recipientId,
        purchaserId,
        amount: parseFloat(reconciliationForm.amount),
        transactionType: reconciliationForm.transactionType,
        notes: reconciliationForm.notes || undefined,
      });
      setReconciliationForm(null);
      // Refresh would happen via realtime
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border">
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="text-purple-600" size={24} />
          <h2 className="font-bold text-lg">Reconciliation</h2>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          Select recipients to see what you owe for gifts you gave them.
        </p>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Select Recipients:
          </label>
          <div className="flex flex-wrap gap-2">
            {profiles
              .filter((p) => p.id !== currentUser)
              .map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleRecipient(p.id)}
                  className={`px-4 py-2 rounded-lg border transition-colors text-sm font-bold ${
                    selectedRecipients.includes(p.id)
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {p.name}
                </button>
              ))}
          </div>
        </div>
      </div>

      {selectedRecipients.length > 0 && relevantGifts.length > 0 && (
        <div className="bg-white p-6 rounded-xl border">
          <h3 className="font-bold text-lg mb-4">Receipt</h3>
          <div className="space-y-2 mb-6">
            {relevantGifts.map((gift) => {
              const recipientCount = gift.gift_recipients?.length || 1;
              const costPerRecipient = (gift.price ?? 0) / recipientCount;
              const purchaser = profiles.find((p) => p.id === gift.purchaser_id);
              const returnStatus = gift.return_status ?? 'NONE';
              const isReturn = returnStatus !== 'NONE';
              return (
                <div
                  key={gift.id}
                  className={`flex items-center justify-between py-2 border-b ${
                    isReturn ? 'bg-green-50' : ''
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-bold text-sm">{gift.name}</p>
                    <p className="text-xs text-slate-500">
                      Purchased by: {purchaser?.name ?? 'Unknown'}
                      {isReturn && (
                        <span className="ml-2 text-green-600 font-bold">
                          ({returnStatus === 'RETURNED' ? 'Returned' : 'To Return'})
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${isReturn ? 'text-green-600' : ''}`}>
                      {isReturn ? '+' : ''}${costPerRecipient.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {isReturn ? 'Credit' : 'Owed'} • ${gift.price?.toFixed(2) ?? '0.00'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t pt-4">
            <h4 className="font-bold text-sm mb-3">Amounts Owed by Purchaser:</h4>
            <div className="space-y-3">
              {purchaserTotals.map(({ purchaser, total, credits }) => {
                const netAmount = total - credits;
                return (
                  <div
                    key={purchaser.id}
                    className="bg-slate-50 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold">{purchaser.name}</p>
                      <p className="text-xs text-slate-500">
                        {selectedRecipients
                          .map((rid) => profiles.find((p) => p.id === rid)?.name)
                          .join(', ')}
                      </p>
                      {credits > 0 && (
                        <p className="text-xs text-green-600 mt-1">
                          Credits: ${credits.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${netAmount < 0 ? 'text-green-600' : 'text-purple-600'}`}>
                        {netAmount < 0 ? '+' : ''}${Math.abs(netAmount).toFixed(2)}
                      </p>
                      {netAmount < 0 && (
                        <p className="text-xs text-green-600">Credit to you</p>
                      )}
                      {reconciliationForm?.purchaserId === purchaser.id ? (
                        <div className="mt-2 space-y-2 bg-white p-3 rounded border">
                          <input
                            type="number"
                            step="0.01"
                            value={reconciliationForm.amount}
                            onChange={(e) =>
                              setReconciliationForm({
                                ...reconciliationForm,
                                amount: e.target.value,
                              })
                            }
                            placeholder="Amount"
                            className="w-full border rounded px-2 py-1 text-sm"
                          />
                          <select
                            value={reconciliationForm.transactionType}
                            onChange={(e) =>
                              setReconciliationForm({
                                ...reconciliationForm,
                                transactionType: e.target
                                  .value as typeof reconciliationForm.transactionType,
                              })
                            }
                            className="w-full border rounded px-2 py-1 text-sm"
                          >
                            <option value="iou">IOU</option>
                            <option value="cash">Cash</option>
                            <option value="check">Check</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="trade">Trade</option>
                          </select>
                          <input
                            type="text"
                            value={reconciliationForm.notes}
                            onChange={(e) =>
                              setReconciliationForm({
                                ...reconciliationForm,
                                notes: e.target.value,
                              })
                            }
                            placeholder="Notes (optional)"
                            className="w-full border rounded px-2 py-1 text-sm"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setReconciliationForm(null)}
                              className="flex-1 bg-slate-200 text-slate-700 py-1 rounded text-sm"
                            >
                              Cancel
                            </button>
                            {selectedRecipients.map((recipientId) => (
                              <button
                                key={recipientId}
                                type="button"
                                onClick={() =>
                                  handleReconcile(
                                    purchaser.id,
                                    recipientId,
                                    netAmount
                                  )
                                }
                                className="flex-1 bg-purple-600 text-white py-1 rounded text-sm font-bold"
                              >
                                Reconcile for{' '}
                                {profiles.find((p) => p.id === recipientId)?.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setReconciliationForm({
                              purchaserId: purchaser.id,
                              amount: Math.abs(netAmount).toFixed(2),
                              transactionType: 'iou',
                              notes: '',
                            })
                          }
                          className="mt-2 text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                        >
                          Reconcile
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {selectedRecipients.length > 0 && relevantGifts.length === 0 && (
        <div className="bg-white p-6 rounded-xl border text-center text-slate-400">
          <p>No gifts found for selected recipients.</p>
        </div>
      )}
    </div>
  );
}

