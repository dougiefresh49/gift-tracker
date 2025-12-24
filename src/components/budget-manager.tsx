'use client';

import { useState } from 'react';
import { DollarSign, Trash2 } from 'lucide-react';
import type { Profile, Budget } from '~/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(err);
      alert(message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!confirm('Delete this budget?')) return;

    try {
      await deleteBudget(budgetId);
      onDataChange?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert(message);
    }
  };

  const getProfileName = (id: string) => {
    return profiles.find((p) => p.id === id)?.name ?? 'Unknown';
  };

  const content = (
    <>
      <form onSubmit={handleAddBudget} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Select value={gifterId} onValueChange={setGifterId}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Gifter" />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={recipientId} onValueChange={setRecipientId}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Recipient" />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={limitAmount}
            onChange={(e) => setLimitAmount(e.target.value)}
            placeholder="Limit ($)"
            className="flex-1 h-9"
            required
          />

          <Button
            type="submit"
            size="sm"
            disabled={isAdding || !gifterId || !recipientId || !limitAmount}
          >
            {isAdding ? 'Adding...' : 'Set Budget'}
          </Button>
        </div>
      </form>

      {showList && (
        <>
          {budgets.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">
                Active Budgets
              </h4>
              <div className="space-y-1.5">
                {budgets.map((budget) => (
                  <div
                    key={budget.id}
                    className="bg-muted/50 rounded-lg px-3 py-2 flex items-center justify-between text-sm"
                  >
                    <span>
                      <span className="font-medium">{getProfileName(budget.gifter_id)}</span>
                      {' → '}
                      <span className="font-medium">{getProfileName(budget.recipient_id)}</span>
                      {' • '}
                      <span className="text-primary font-bold">
                        ${budget.limit_amount.toFixed(2)}
                      </span>
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDeleteBudget(budget.id)}
                      title="Delete budget"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {budgets.length === 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">
                Active Budgets
              </h4>
              <p className="text-muted-foreground text-sm italic">No budgets defined.</p>
            </div>
          )}
        </>
      )}
    </>
  );

  if (!showHeader) {
    return content;
  }

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="h-4 w-4" />
          Set Budgets
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {content}
      </CardContent>
    </Card>
  );
}
