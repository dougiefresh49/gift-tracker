'use client';

import { useState, useMemo } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { BudgetManager } from '~/components/budget-manager';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Progress } from '~/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet';
import { cn } from '~/lib/utils';
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
            g.gift_recipients?.some((r) => r.profile.id === budget.recipient_id) &&
            (g.return_status ?? 'NONE') === 'NONE' // Exclude returned items from budget
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
    <div className="space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-lg">Budgets</h2>
        <Button
          size="sm"
          onClick={() => setShowAddBudget(true)}
        >
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      {/* Add budget sheet */}
      <Sheet open={showAddBudget} onOpenChange={setShowAddBudget}>
        <SheetContent side="bottom" className="rounded-t-xl pb-20">
          <SheetHeader>
            <SheetTitle>Add Budget</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <BudgetManager
              profiles={profiles}
              budgets={budgets}
              onClose={() => setShowAddBudget(false)}
              showList={false}
              showHeader={false}
              onDataChange={onDataChange}
            />
          </div>
        </SheetContent>
      </Sheet>

      {budgetData.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>No budgets set up yet. Add one to track your spending.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {budgetData.map(
            ({
              budget,
              gifter,
              recipient,
              spent,
              percentage,
              isOverBudget,
            }) => (
              <Card key={budget.id} className="overflow-hidden">
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <span>
                      {gifter?.name ?? 'Unknown'} → {recipient?.name ?? 'Unknown'}
                    </span>
                    {isOverBudget && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span className={cn(isOverBudget && "text-destructive font-medium")}>
                      ${spent.toFixed(2)}
                    </span>
                    <span>${budget.limit_amount.toFixed(2)}</span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className={cn(
                      "h-2",
                      isOverBudget && "[&>div]:bg-destructive"
                    )}
                  />
                  {isOverBudget && (
                    <p className="text-[10px] text-destructive font-medium mt-1">
                      ${(spent - budget.limit_amount).toFixed(2)} over
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}
    </div>
  );
}
