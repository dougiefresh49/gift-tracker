'use client';

import { useState, useMemo } from 'react';
import { Receipt, Gift as GiftIcon, ChevronRight } from 'lucide-react';
import { addReconciliation } from '~/actions/gift-actions';
import { ViewGiftModal } from '~/components/view-gift-modal';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '~/components/ui/card';
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
  const [viewingGift, setViewingGift] = useState<Gift | null>(null);
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
        g.gift_recipients?.some((r) => selectedRecipients.includes(r.profile.id))
    );
  }, [gifts, selectedRecipients, currentUser]);

  // Group gifts by recipient (for multi-recipient view)
  const giftsByRecipient = useMemo(() => {
    if (selectedRecipients.length <= 1) return null;

    const groups: Record<string, { recipient: Profile; gifts: Gift[] }> = {};

    relevantGifts.forEach((gift) => {
      const giftRecipients = gift.gift_recipients?.map((r) => r.profile) ?? [];
      giftRecipients.forEach((recipient) => {
        if (selectedRecipients.includes(recipient.id)) {
          if (!groups[recipient.id]) {
            groups[recipient.id] = { recipient, gifts: [] };
          }
          groups[recipient.id].gifts.push(gift);
        }
      });
    });

    return Object.values(groups).sort((a, b) =>
      a.recipient.name.localeCompare(b.recipient.name)
    );
  }, [relevantGifts, selectedRecipients]);

  // Calculate totals by purchaser
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

  // Separate current user's purchases from others
  const youSpent = purchaserTotals.find((p) => p.purchaser.id === currentUser);
  const owedToOthers = purchaserTotals.filter(
    (p) => p.purchaser.id !== currentUser
  );

  // Calculate grand totals
  const grandTotals = useMemo(() => {
    let totalOutstanding = 0;
    let totalSpending = 0;

    owedToOthers.forEach(({ total, credits }) => {
      totalOutstanding += total - credits;
    });

    relevantGifts.forEach((gift) => {
      const returnStatus = gift.return_status ?? 'NONE';
      if (returnStatus === 'NONE') {
        totalSpending += gift.price ?? 0;
      }
    });

    return { totalOutstanding, totalSpending };
  }, [owedToOthers, relevantGifts]);

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

  // Render a single gift line item
  const renderGiftLineItem = (gift: Gift, showRecipient = false) => {
    const recipientCount = gift.gift_recipients?.length || 1;
    const costPerRecipient = (gift.price ?? 0) / recipientCount;
    const purchaser = profiles.find((p) => p.id === gift.purchaser_id);
    const returnStatus = gift.return_status ?? 'NONE';
    const isReturn = returnStatus !== 'NONE';

    return (
      <div
        key={gift.id}
        className={cn(
          'flex items-center gap-2 py-2 border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors -mx-2 px-2 rounded',
          isReturn && 'bg-emerald-50 dark:bg-emerald-950/20'
        )}
        onClick={() => setViewingGift(gift)}
      >
        {/* Thumbnail */}
        <div className="w-10 h-10 rounded bg-muted flex-shrink-0 overflow-hidden">
          {gift.image_url ? (
            <img
              src={gift.image_url}
              alt={gift.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <GiftIcon className="h-4 w-4" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{gift.name}</p>
          <p className="text-xs text-muted-foreground">
            By: {purchaser?.name ?? 'Unknown'}
            {isReturn && (
              <Badge
                variant="outline"
                className="ml-1.5 text-[9px] h-4 text-emerald-600"
              >
                {returnStatus === 'RETURNED' ? 'Returned' : 'To Return'}
              </Badge>
            )}
          </p>
        </div>

        {/* Price */}
        <div className="text-right shrink-0">
          <p
            className={cn('font-bold text-sm', isReturn && 'text-emerald-600')}
          >
            {isReturn ? '+' : ''}${costPerRecipient.toFixed(2)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {isReturn ? 'Credit' : 'Owed'}
          </p>
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-20">
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
                  variant={
                    selectedRecipients.includes(p.id) ? 'default' : 'outline'
                  }
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
            {/* If multiple recipients, group by recipient */}
            {giftsByRecipient ? (
              <div className="space-y-4">
                {giftsByRecipient.map(({ recipient, gifts: recipientGifts }) => (
                  <div key={recipient.id}>
                    <div className="flex items-center gap-2 mb-2 sticky top-0 bg-card py-1">
                      <h4 className="font-semibold text-sm">{recipient.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {recipientGifts.length}
                      </Badge>
                    </div>
                    <div className="space-y-0">
                      {recipientGifts.map((gift) => renderGiftLineItem(gift))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Single recipient - flat list
              <div className="space-y-0">
                {relevantGifts.map((gift) => renderGiftLineItem(gift))}
              </div>
            )}

            <Separator className="my-4" />

            {/* Totals Section */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Totals</h4>

              {/* You Owe (to other purchasers) */}
              {owedToOthers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    You Owe
                  </p>
                  {owedToOthers.map(({ purchaser, total, credits }) => {
                    const netAmount = total - credits;
                    if (netAmount <= 0) return null;
                    return (
                      <div
                        key={purchaser.id}
                        className="bg-muted/50 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">
                              {purchaser.name}
                            </p>
                            {credits > 0 && (
                              <p className="text-[10px] text-emerald-600">
                                Credits applied: -${credits.toFixed(2)}
                              </p>
                            )}
                          </div>
                          <p className="font-bold text-lg text-primary">
                            ${netAmount.toFixed(2)}
                          </p>
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
                                  transactionType:
                                    value as typeof reconciliationForm.transactionType,
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
                                <SelectItem value="bank_transfer">
                                  Bank Transfer
                                </SelectItem>
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
                              <Button
                                size="sm"
                                className="flex-1 h-7 text-xs"
                                onClick={() =>
                                  handleReconcile(
                                    purchaser.id,
                                    selectedRecipients[0] ?? '',
                                    netAmount
                                  )
                                }
                              >
                                Confirm
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full h-7 text-xs"
                            onClick={() =>
                              setReconciliationForm({
                                purchaserId: purchaser.id,
                                amount: netAmount.toFixed(2),
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
              )}

              {/* You Spent (current user's purchases) */}
              {youSpent && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    You Spent
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Your Purchases</p>
                        <p className="text-[10px] text-muted-foreground">
                          {youSpent.gifts.length} item
                          {youSpent.gifts.length !== 1 ? 's' : ''}
                        </p>
                        {youSpent.credits > 0 && (
                          <p className="text-[10px] text-emerald-600">
                            Returns/credits: +${youSpent.credits.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <p className="font-bold text-lg text-blue-600">
                        ${(youSpent.total - youSpent.credits).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            {/* Grand Totals */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Grand Totals</h4>
              <div className="bg-muted rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Outstanding (owed to others)
                  </span>
                  <span className="font-bold text-primary">
                    ${grandTotals.totalOutstanding.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Total Gift Spending
                  </span>
                  <span className="font-bold">
                    ${grandTotals.totalSpending.toFixed(2)}
                  </span>
                </div>
              </div>
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

      {/* View Gift Modal */}
      {viewingGift && (
        <ViewGiftModal
          gift={viewingGift}
          profiles={profiles}
          currentUser={currentUser}
          onClose={() => setViewingGift(null)}
          onUpdate={() => setViewingGift(null)}
        />
      )}
    </div>
  );
}
