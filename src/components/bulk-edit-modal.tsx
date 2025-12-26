'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { Gift, Profile } from '~/lib/types';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Label } from '~/components/ui/label';
import { Checkbox } from '~/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

import { bulkUpdateGifts } from '~/actions/gift-actions';

interface BulkEditModalProps {
  selectedGifts: Gift[];
  profiles: Profile[];
  onClose: () => void;
  onUpdate?: () => void;
}

export function BulkEditModal({
  selectedGifts,
  profiles,
  onClose,
  onUpdate,
}: BulkEditModalProps) {
  // Track which fields to update
  const [updateRecipients, setUpdateRecipients] = useState(false);
  const [updatePurchaser, setUpdatePurchaser] = useState(false);
  const [updateSanta, setUpdateSanta] = useState(false);
  const [updateReturnStatus, setUpdateReturnStatus] = useState(false);
  const [updateClaimer, setUpdateClaimer] = useState(false);

  // Field values
  const [recipientIds, setRecipientIds] = useState<string[]>([]);
  const [purchaserId, setPurchaserId] = useState<string>('');
  const [isSanta, setIsSanta] = useState(false);
  const [returnStatus, setReturnStatus] = useState<'NONE' | 'TO_RETURN' | 'RETURNED'>('NONE');
  const [claimerId, setClaimerId] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updates: Parameters<typeof bulkUpdateGifts>[1] = {};

      if (updateRecipients) {
        updates.recipientIds = recipientIds;
      }
      if (updatePurchaser) {
        updates.purchaserId = purchaserId || null;
      }
      if (updateSanta) {
        updates.isSanta = isSanta;
      }
      if (updateReturnStatus) {
        updates.returnStatus = returnStatus;
      }
      if (updateClaimer) {
        updates.claimedById = claimerId || null;
      }

      await bulkUpdateGifts(
        selectedGifts.map((g) => g.id),
        updates
      );

      onUpdate?.();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRecipient = (id: string) => {
    setRecipientIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((r) => r !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const hasAnyUpdate = updateRecipients || updatePurchaser || updateSanta || updateReturnStatus || updateClaimer;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-auto">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Bulk Edit {selectedGifts.length} Items
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <p className="text-sm text-muted-foreground mb-4">
            Check the fields you want to update. Only checked fields will be changed.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Recipients */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="update-recipients"
                  checked={updateRecipients}
                  onCheckedChange={(checked) => setUpdateRecipients(!!checked)}
                />
                <Label htmlFor="update-recipients" className="font-medium">
                  Update Recipients
                </Label>
              </div>
              {updateRecipients && (
                <div className="pl-6 flex flex-wrap gap-1.5">
                  {profiles.map((p) => (
                    <Badge
                      key={p.id}
                      variant={recipientIds.includes(p.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleRecipient(p.id)}
                    >
                      {p.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Purchaser */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="update-purchaser"
                  checked={updatePurchaser}
                  onCheckedChange={(checked) => setUpdatePurchaser(!!checked)}
                />
                <Label htmlFor="update-purchaser" className="font-medium">
                  Update Purchaser
                </Label>
              </div>
              {updatePurchaser && (
                <div className="pl-6">
                  <Select
                    value={purchaserId || 'none'}
                    onValueChange={(value) => setPurchaserId(value === 'none' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Who bought?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No one</SelectItem>
                      {profiles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Claimer */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="update-claimer"
                  checked={updateClaimer}
                  onCheckedChange={(checked) => setUpdateClaimer(!!checked)}
                />
                <Label htmlFor="update-claimer" className="font-medium">
                  Update Claimed By
                </Label>
              </div>
              {updateClaimer && (
                <div className="pl-6">
                  <Select
                    value={claimerId || 'none'}
                    onValueChange={(value) => setClaimerId(value === 'none' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Who claimed?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No one (Available)</SelectItem>
                      {profiles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Santa toggle */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="update-santa"
                  checked={updateSanta}
                  onCheckedChange={(checked) => setUpdateSanta(!!checked)}
                />
                <Label htmlFor="update-santa" className="font-medium">
                  Update Santa Status
                </Label>
              </div>
              {updateSanta && (
                <div className="pl-6 flex items-center space-x-2">
                  <Checkbox
                    id="is-santa"
                    checked={isSanta}
                    onCheckedChange={(checked) => setIsSanta(!!checked)}
                  />
                  <Label htmlFor="is-santa">Mark as Santa Item</Label>
                </div>
              )}
            </div>

            {/* Return Status */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="update-return"
                  checked={updateReturnStatus}
                  onCheckedChange={(checked) => setUpdateReturnStatus(!!checked)}
                />
                <Label htmlFor="update-return" className="font-medium">
                  Update Return Status
                </Label>
              </div>
              {updateReturnStatus && (
                <div className="pl-6">
                  <Select
                    value={returnStatus}
                    onValueChange={(value) =>
                      setReturnStatus(value as 'NONE' | 'TO_RETURN' | 'RETURNED')
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">None</SelectItem>
                      <SelectItem value="TO_RETURN">To Return</SelectItem>
                      <SelectItem value="RETURNED">Returned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={!hasAnyUpdate || isSubmitting}
              >
                {isSubmitting ? 'Updating...' : `Update ${selectedGifts.length} Items`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

