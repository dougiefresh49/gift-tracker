'use client';

import { useState } from 'react';
import { DollarSign, Trash2 } from 'lucide-react';
import type { Profile, Budget } from '~/lib/types';

import { addBudget, deleteBudget } from "~/actions/gift-actions";

interface BudgetManagerProps {
  profiles: Profile[];
  budgets: Budget[];
  onClose?: () => void;
  showList?: boolean;
  showHeader?: boolean;
  onDataChange?: () => void;
}

export function BudgetManager({ profiles, budgets, onClose, showList = true, showHeader = true, onDataChange }: BudgetManagerProps) {
  const [gifterId, setGifterId] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gifterId || !recipientId || !limitAmount) return;

    setIsAdding(true);
    try {
      await addBudget({
        gifterId,
        recipientId,
        limitAmount: parseFloat(limitAmount),
      });

      setGifterId('');
      setRecipientId('');
      setLimitAmount('');
      onClose?.();
      onDataChange?.();
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!confirm('Delete this budget?')) return;

    try {
      await deleteBudget(budgetId);
      onDataChange?.();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getProfileName = (id: string) => {
    return profiles.find((p) => p.id === id)?.name ?? 'Unknown';
  };

  return (
    <div className={showHeader ? 'bg-white p-6 rounded-xl border' : ''}>
      {showHeader && (
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="text-green-600" size={20} />
          <h3 className="font-bold text-lg">Set Budgets</h3>
        </div>
      )}

      <form onSubmit={handleAddBudget} className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <select
            value={gifterId}
            onChange={(e) => setGifterId(e.target.value)}
            className="flex-1 min-w-[150px] border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          >
            <option value="">Gifter (Who buys?)</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            className="flex-1 min-w-[150px] border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          >
            <option value="">Recipient (For whom?)</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            step="0.01"
            min="0"
            value={limitAmount}
            onChange={(e) => setLimitAmount(e.target.value)}
            placeholder="Limit ($)"
            className="flex-1 min-w-[120px] border border-green-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />

          <button
            type="submit"
            disabled={isAdding || !gifterId || !recipientId || !limitAmount}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdding ? 'Adding...' : 'Set'}
          </button>
        </div>
      </form>

      {showList && (
        <>
          {budgets.length > 0 && (
            <div className="mt-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">
                Active Budgets
              </h4>
              <div className="space-y-2">
                {budgets.map((budget) => (
                  <div
                    key={budget.id}
                    className="bg-slate-50 rounded-lg px-4 py-3 flex items-center justify-between"
                  >
                    <span className="text-sm">
                      <span className="font-bold">{getProfileName(budget.gifter_id)}</span> plans to
                      spend{' '}
                      <span className="font-bold text-green-600">
                        ${budget.limit_amount.toFixed(2)}
                      </span>{' '}
                      on <span className="font-bold">{getProfileName(budget.recipient_id)}</span>
                    </span>
                    <button
                      onClick={() => handleDeleteBudget(budget.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete budget"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {budgets.length === 0 && (
            <div className="mt-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">
                Active Budgets
              </h4>
              <p className="text-slate-400 text-sm italic">No budgets defined.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

