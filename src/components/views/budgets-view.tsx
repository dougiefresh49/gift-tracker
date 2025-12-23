'use client';

import { useState, useMemo } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { BudgetManager } from '~/components/budget-manager';
import type { Budget, Gift, Profile } from '~/lib/types';

interface BudgetsViewProps {
  budgets: Budget[];
  gifts: Gift[];
  profiles: Profile[];
  currentUser: string;
  onDataChange?: () => void;
}

export function BudgetsView({
  budgets,
  gifts,
  profiles,
  currentUser,
  onDataChange,
}: BudgetsViewProps) {
  const [showAddBudget, setShowAddBudget] = useState(false);

  const budgetData = useMemo(() => {
    return budgets.map((budget) => {
      const gifter = profiles.find((p) => p.id === budget.gifter_id);
      const recipient = profiles.find((p) => p.id === budget.recipient_id);

      const spent = gifts
        .filter(
          (g) =>
            g.claimed_by_id === budget.gifter_id &&
            g.gift_recipients?.some((r) => r.profile.id === budget.recipient_id)
        )
        .reduce((sum, g) => {
          const recipientCount = g.gift_recipients?.length || 1;
          return sum + (g.price ?? 0) / recipientCount;
        }, 0);

      const percentage =
        budget.limit_amount > 0
          ? Math.min((spent / budget.limit_amount) * 100, 100)
          : 0;

      const isOverBudget = spent > budget.limit_amount;

      return {
        budget,
        gifter,
        recipient,
        spent,
        percentage,
        isOverBudget,
      };
    });
  }, [budgets, gifts, profiles]);

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border flex justify-between items-center">
        <h2 className="font-bold text-lg">Budgets</h2>
        <button
          onClick={() => setShowAddBudget(!showAddBudget)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold"
        >
          <Plus size={16} /> {showAddBudget ? 'Cancel' : 'Add Budget'}
        </button>
      </div>

      {showAddBudget && (
        <div className="bg-white p-6 rounded-xl border">
          <BudgetManager
            profiles={profiles}
            budgets={budgets}
            onClose={() => setShowAddBudget(false)}
            showList={false}
            showHeader={false}
            onDataChange={onDataChange}
          />
        </div>
      )}

      {budgetData.length === 0 ? (
        <div className="bg-white p-6 rounded-xl border text-center text-slate-400">
          <p>No budgets set up yet. Add one above or go to Admin.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {budgetData.map(
            ({
              budget,
              gifter,
              recipient,
              spent,
              percentage,
              isOverBudget,
            }) => (
              <div
                key={budget.id}
                className="bg-white p-4 rounded-xl border shadow-sm"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-sm">
                    {gifter?.name ?? 'Unknown'} → {recipient?.name ?? 'Unknown'}
                  </h3>
                  {isOverBudget && (
                    <AlertTriangle className="text-red-600" size={20} />
                  )}
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>${spent.toFixed(2)}</span>
                    <span>${budget.limit_amount.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isOverBudget ? 'bg-red-600' : 'bg-green-600'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                {isOverBudget && (
                  <p className="text-xs text-red-600 font-bold">
                    Over budget by ${(spent - budget.limit_amount).toFixed(2)}
                  </p>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
