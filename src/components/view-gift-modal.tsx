'use client';

import { useState } from 'react';
import { X, Gift as GiftIcon, Edit2, RotateCcw } from 'lucide-react';
import type { Gift, Profile } from '~/lib/types';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { EditGiftModal } from '~/components/edit-gift-modal';
import { cn } from '~/lib/utils';

interface ViewGiftModalProps {
  gift: Gift;
  profiles: Profile[];
  currentUser: string;
  onClose: () => void;
  onUpdate?: () => void;
}

export function ViewGiftModal({
  gift,
  profiles,
  currentUser,
  onClose,
  onUpdate,
}: ViewGiftModalProps) {
  const [showEdit, setShowEdit] = useState(false);

  const recipients = gift.gift_recipients?.map((r) => r.profile) ?? [];
  const claimer = profiles.find((p) => p.id === gift.claimed_by_id);
  const purchaser = profiles.find((p) => p.id === gift.purchaser_id);
  const creator = profiles.find((p) => p.id === gift.created_by_id);
  const returnStatus = gift.return_status ?? 'NONE';

  if (showEdit) {
    return (
      <EditGiftModal
        gift={gift}
        profiles={profiles}
        currentUser={currentUser}
        onClose={() => {
          setShowEdit(false);
          onClose();
        }}
        onUpdate={() => {
          setShowEdit(false);
          onUpdate?.();
          onClose();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <Card className="w-full max-w-sm max-h-[90vh] overflow-auto">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Gift Details</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-4">
          {/* Image */}
          <div className="w-full aspect-video rounded-lg overflow-hidden bg-muted flex items-center justify-center">
            {gift.image_url ? (
              <img
                src={gift.image_url}
                alt={gift.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center text-muted-foreground">
                <GiftIcon className="h-12 w-12" />
                <span className="text-xs mt-1">No image</span>
              </div>
            )}
          </div>

          {/* Name and price */}
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">{gift.name}</h3>
            <p className="text-2xl font-bold text-primary">
              ${gift.price?.toFixed(2) ?? '0.00'}
            </p>
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap gap-1.5">
            {gift.is_santa && <Badge variant="secondary">🎅 Santa Item</Badge>}
            {gift.status === 'claimed' && (
              <Badge variant="default">Claimed</Badge>
            )}
            {gift.status === 'available' && (
              <Badge variant="outline">Available</Badge>
            )}
            {returnStatus !== 'NONE' && (
              <Badge
                variant="outline"
                className={cn(
                  returnStatus === 'RETURNED'
                    ? 'text-emerald-600 border-emerald-600'
                    : 'text-orange-600 border-orange-600'
                )}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                {returnStatus === 'RETURNED' ? 'Returned' : 'To Return'}
              </Badge>
            )}
          </div>

          {/* Details */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1.5 border-b">
              <span className="text-muted-foreground">Recipients</span>
              <span className="font-medium text-right">
                {recipients.length > 0
                  ? recipients.map((r) => r.name).join(', ')
                  : 'Unassigned'}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b">
              <span className="text-muted-foreground">Claimed By</span>
              <span className="font-medium">{claimer?.name ?? 'No one'}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b">
              <span className="text-muted-foreground">Purchased By</span>
              <span className="font-medium">
                {purchaser?.name ?? 'Not purchased'}
              </span>
            </div>

            {creator && (
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground">Added By</span>
                <span className="font-medium">{creator.name}</span>
              </div>
            )}

            {/* Tags */}
            {gift.gift_tags && gift.gift_tags.length > 0 && (
              <div className="py-1.5">
                <span className="text-muted-foreground block mb-1.5">Tags</span>
                <div className="flex flex-wrap gap-1">
                  {gift.gift_tags.map((tagObj, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {tagObj.tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Edit button */}
          <Button className="w-full gap-2" onClick={() => setShowEdit(true)}>
            <Edit2 className="h-4 w-4" />
            Edit Gift
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
