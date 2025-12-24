'use client';

import { useState, useMemo } from 'react';
import { Receipt, DollarSign } from 'lucide-react';
import { addReconciliation } from '~/actions/gift-actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Separator } from '~/components/ui/separator';
import { cn } from '~/lib/utils';
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
        totals[gift.purchaser_id]!.credits += costPerRecipient;
      } else {
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert(message);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="p-4 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-5 w-5 text-primary" />
            Reconciliation
          </CardTitle>
          <CardDescription className="text-xs">
            Select recipients to see what you owe for gifts you gave them.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <label className="block text-sm font-medium mb-2">
            Select Recipients:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {profiles
              .filter((p) => p.id !== currentUser)
              .map((p) => (
                <Badge
                  key={p.id}
                  variant={selectedRecipients.includes(p.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleRecipient(p.id)}
                >
                  {p.name}
                </Badge>
              ))}
          </div>
        </CardContent>
      </Card>

      {selectedRecipients.length > 0 && relevantGifts.length > 0 && (
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Receipt</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            {relevantGifts.map((gift) => {
              const recipientCount = gift.gift_recipients?.length || 1;
              const costPerRecipient = (gift.price ?? 0) / recipientCount;
              const purchaser = profiles.find((p) => p.id === gift.purchaser_id);
              const returnStatus = gift.return_status ?? 'NONE';
              const isReturn = returnStatus !== 'NONE';
              return (
                <div
                  key={gift.id}
                  className={cn(
                    "flex items-center justify-between py-2 border-b last:border-0",
                    isReturn && "bg-emerald-50 dark:bg-emerald-950/20 -mx-4 px-4"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{gift.name}</p>
                    <p className="text-xs text-muted-foreground">
                      By: {purchaser?.name ?? 'Unknown'}
                      {isReturn && (
                        <Badge variant="outline" className="ml-1.5 text-[9px] h-4 text-emerald-600">
                          {returnStatus === 'RETURNED' ? 'Returned' : 'To Return'}
                        </Badge>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className={cn("font-bold text-sm", isReturn && "text-emerald-600")}>
                      {isReturn ? '+' : ''}${costPerRecipient.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {isReturn ? 'Credit' : 'Owed'}
                    </p>
                  </div>
                </div>
              );
            })}

            <Separator className="my-3" />

            <h4 className="font-medium text-sm">By Purchaser:</h4>
            <div className="space-y-2">
              {purchaserTotals.map(({ purchaser, total, credits }) => {
                const netAmount = total - credits;
                return (
                  <div
                    key={purchaser.id}
                    className="bg-muted/50 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{purchaser.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {selectedRecipients
                            .map((rid) => profiles.find((p) => p.id === rid)?.name)
                            .join(', ')}
                        </p>
                        {credits > 0 && (
                          <p className="text-[10px] text-emerald-600">
                            Credits: ${credits.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "font-bold text-lg",
                          netAmount < 0 ? "text-emerald-600" : "text-primary"
                        )}>
                          {netAmount < 0 ? '+' : ''}${Math.abs(netAmount).toFixed(2)}
                        </p>
                        {netAmount < 0 && (
                          <p className="text-[10px] text-emerald-600">Credit to you</p>
                        )}
                      </div>
                    </div>

                    {reconciliationForm?.purchaserId === purchaser.id ? (
                      <div className="mt-2 space-y-2 bg-background p-2 rounded border">
                        <Input
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
                          className="h-8 text-sm"
                        />
                        <Select
                          value={reconciliationForm.transactionType}
                          onValueChange={(value) =>
                            setReconciliationForm({
                              ...reconciliationForm,
                              transactionType: value as typeof reconciliationForm.transactionType,
                            })
                          }
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="iou">IOU</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="check">Check</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="trade">Trade</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="text"
                          value={reconciliationForm.notes}
                          onChange={(e) =>
                            setReconciliationForm({
                              ...reconciliationForm,
                              notes: e.target.value,
                            })
                          }
                          placeholder="Notes (optional)"
                          className="h-8 text-sm"
                        />
                        <div className="flex gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-7 text-xs"
                            onClick={() => setReconciliationForm(null)}
                          >
                            Cancel
                          </Button>
                          {selectedRecipients.map((recipientId) => (
                            <Button
                              key={recipientId}
                              size="sm"
                              className="flex-1 h-7 text-xs"
                              onClick={() =>
                                handleReconcile(
                                  purchaser.id,
                                  recipientId,
                                  netAmount
                                )
                              }
                            >
                              {profiles.find((p) => p.id === recipientId)?.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full h-7 text-xs"
                        onClick={() =>
                          setReconciliationForm({
                            purchaserId: purchaser.id,
                            amount: Math.abs(netAmount).toFixed(2),
                            transactionType: 'iou',
                            notes: '',
                          })
                        }
                      >
                        Reconcile
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedRecipients.length > 0 && relevantGifts.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>No gifts found for selected recipients.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
