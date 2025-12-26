'use client';

import { useState } from 'react';
import { Gift, Pencil, ChevronDown, RotateCcw } from 'lucide-react';
import { useImageToggle } from '~/contexts/image-toggle-context';
import type { Gift as GiftType, Profile } from '~/lib/types';
import { EditGiftModal } from '~/components/edit-gift-modal';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { cn } from '~/lib/utils';

import {
  claimGift,
  unclaimGift,
  toggleGiftRecipient,
  updateReturnStatus,
} from '~/actions/gift-actions';

interface GiftCardProps {
  gift: GiftType;
  profiles: Profile[];
  currentUser: string;
  activeProfile: Profile | undefined;
  showClaimButton?: boolean;
  showReleaseButton?: boolean;
  onUpdate?: () => void;
}

export function GiftCard({
  gift,
  profiles,
  currentUser,
  activeProfile,
  showClaimButton = true,
  showReleaseButton = false,
  onUpdate,
}: GiftCardProps) {
  const { hideImages } = useImageToggle();
  const [editingItem, setEditingItem] = useState<GiftType | null>(null);
  const [isRecipientOpen, setIsRecipientOpen] = useState(false);
  const [isClaimOpen, setIsClaimOpen] = useState(false);

  const recipients = gift.gift_recipients?.map((r) => r.profile) ?? [];
  const claimer = profiles.find((p) => p.id === gift.claimed_by_id);

  const handleClaim = async (giftId: string, claimerId: string) => {
    try {
      await claimGift(giftId, claimerId);
      setIsClaimOpen(false);
      onUpdate?.();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      alert(message);
    }
  };

  const handleUnclaim = async (giftId: string) => {
    try {
      await unclaimGift(giftId);
      onUpdate?.();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      alert(message);
    }
  };

  const handleToggleRecipient = async (profileId: string) => {
    const isRecipient = recipients.some((r) => r.id === profileId);

    try {
      await toggleGiftRecipient(gift.id, profileId, !isRecipient);
      onUpdate?.();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      alert(message);
    }
  };

  // Get return status display
  const returnStatusDisplay = () => {
    if (gift.return_status === 'TO_RETURN')
      return { label: 'Return', color: 'bg-orange-500' };
    if (gift.return_status === 'RETURNED')
      return { label: 'Returned', color: 'bg-emerald-500' };
    return null;
  };

  const returnStatus = returnStatusDisplay();

  return (
    <>
      <div
        className={cn(
          'bg-card rounded-lg border overflow-visible flex flex-col relative group transition-shadow hover:shadow-md',
          gift.status === 'claimed' && 'ring-2 ring-primary/20'
        )}
      >
        {/* Image container */}
        <div className="relative aspect-square bg-muted/30">
          {hideImages ? (
            <div className="w-full h-full bg-muted" />
          ) : gift.image_url ? (
            <img
              src={gift.image_url}
              alt={gift.name}
              className="w-full h-full object-contain p-1"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Gift className="h-8 w-8" />
            </div>
          )}

          {/* Recipient badge */}
          <DropdownMenu
            open={isRecipientOpen}
            onOpenChange={setIsRecipientOpen}
          >
            <DropdownMenuTrigger asChild>
              <button className="absolute top-1 left-1 bg-primary text-primary-foreground px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-0.5 max-w-[90%] shadow-sm">
                <span className="truncate">
                  {recipients.length > 0
                    ? recipients.length === 1
                      ? recipients[0]?.name
                      : `${recipients.length} people`
                    : 'Unassigned'}
                </span>
                <ChevronDown className="h-2.5 w-2.5 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-36 z-[200]">
              {profiles.map((p) => {
                const isSelected = recipients.some((r) => r.id === p.id);
                return (
                  <DropdownMenuItem
                    key={p.id}
                    onClick={() => handleToggleRecipient(p.id)}
                    className={cn(isSelected && 'bg-accent')}
                  >
                    {isSelected && '✓ '}
                    {p.name}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Price badge */}
          <div className="absolute bottom-1 right-1 bg-background/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-xs font-bold shadow-sm">
            ${gift.price?.toFixed(2) ?? '0.00'}
          </div>

          {/* Return status badge */}
          {returnStatus && (
            <div
              className={cn(
                'absolute top-1 right-1 text-white px-1.5 py-0.5 rounded text-[9px] font-bold shadow-sm flex items-center gap-0.5',
                returnStatus.color
              )}
            >
              <RotateCcw className="h-2.5 w-2.5" />
              {returnStatus.label}
            </div>
          )}

          {/* Edit button - show on hover */}
          <button
            onClick={() => setEditingItem(gift)}
            className="absolute top-1 right-1 bg-background/90 p-1 rounded-full shadow-sm text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ display: returnStatus ? 'none' : undefined }}
          >
            <Pencil className="h-3 w-3" />
          </button>
        </div>

        {/* Content */}
        <div className="p-2 flex-1 flex flex-col gap-1">
          <h3 className="font-medium text-xs leading-tight line-clamp-2 min-h-[2rem]">
            {gift.name}
          </h3>

          {/* Tags */}
          {gift.gift_tags && gift.gift_tags.length > 0 && (
            <div className="flex flex-wrap gap-0.5">
              {gift.gift_tags.slice(0, 2).map((tagObj, idx) => (
                <span
                  key={idx}
                  className="px-1 py-0 text-[9px] rounded bg-secondary text-secondary-foreground"
                >
                  {tagObj.tag}
                </span>
              ))}
              {gift.gift_tags.length > 2 && (
                <span className="text-[9px] text-muted-foreground">
                  +{gift.gift_tags.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Claim button area */}
          <div className="mt-auto pt-1">
            {showClaimButton && (
              <>
                {gift.status === 'claimed' ? (
                  <div className="text-[10px] text-muted-foreground text-center py-1 bg-muted rounded">
                    <span className="font-medium">{claimer?.name}</span> claimed
                  </div>
                ) : (
                  <div className="flex gap-0.5">
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1 h-7 text-[10px]"
                      onClick={() => handleClaim(gift.id, currentUser)}
                      disabled={!activeProfile}
                    >
                      Claim
                    </Button>
                    <DropdownMenu
                      open={isClaimOpen}
                      onOpenChange={setIsClaimOpen}
                    >
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="default"
                          className="h-7 px-1.5"
                          disabled={!activeProfile}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-28 z-[200]">
                        {profiles
                          .filter((p) => p.id !== currentUser)
                          .map((p) => (
                            <DropdownMenuItem
                              key={p.id}
                              onClick={() => handleClaim(gift.id, p.id)}
                              className="text-xs"
                            >
                              {p.name}
                            </DropdownMenuItem>
                          ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </>
            )}

            {showReleaseButton && (
              <Button
                size="sm"
                variant="destructive"
                className="w-full h-7 text-[10px]"
                onClick={() => handleUnclaim(gift.id)}
              >
                Release
              </Button>
            )}
          </div>
        </div>
      </div>

      {editingItem && (
        <EditGiftModal
          gift={editingItem}
          profiles={profiles}
          currentUser={currentUser}
          onClose={() => setEditingItem(null)}
          onUpdate={() => {
            setEditingItem(null);
            onUpdate?.();
          }}
        />
      )}
    </>
  );
}
