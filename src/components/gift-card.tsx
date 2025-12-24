'use client';

import { useState, useEffect } from 'react';
import { Gift, Pencil, ChevronDown } from 'lucide-react';
import { useImageToggle } from '~/contexts/image-toggle-context';
import type { Gift as GiftType, Profile } from '~/lib/types';
import { EditGiftModal } from '~/components/edit-gift-modal';

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
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeRecipientDropdown, setActiveRecipientDropdown] = useState<
    string | null
  >(null);

  const recipients = gift.gift_recipients?.map((r) => r.profile) ?? [];
  const claimer = profiles.find((p) => p.id === gift.claimed_by_id);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest('.recipient-dropdown') &&
        !target.closest('.claim-dropdown')
      ) {
        setActiveRecipientDropdown(null);
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClaim = async (giftId: string, claimerId: string) => {
    console.log('Claiming gift:', { giftId, claimerId });
    try {
      await claimGift(giftId, claimerId);
      console.log('Gift claimed successfully');
      setActiveDropdown(null);
      onUpdate?.();
    } catch (e: any) {
      console.error('Error claiming gift:', e);
      alert(e.message);
    }
  };

  const handleUnclaim = async (giftId: string) => {
    try {
      await unclaimGift(giftId);
      onUpdate?.();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleToggleRecipient = async (profileId: string) => {
    const isRecipient = recipients.some((r) => r.id === profileId);

    try {
      await toggleGiftRecipient(gift.id, profileId, !isRecipient);
      onUpdate?.();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const hasOpenDropdown = activeRecipientDropdown === gift.id || activeDropdown === gift.id;

  return (
    <>
      <div
        className={`bg-white rounded-xl border shadow-sm overflow-visible flex flex-col relative group ${
          gift.status === 'claimed' ? 'border-l-4 border-l-green-500' : ''
        } ${hasOpenDropdown ? 'z-[100]' : ''}`}
      >
        <div className="h-40 bg-slate-100 relative">
          {hideImages ? (
            <div className="w-full h-full bg-slate-300 pointer-events-none" />
          ) : gift.image_url ? (
            <img
              src={gift.image_url}
              alt={gift.name}
              className="w-full h-full object-cover pointer-events-none"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 pointer-events-none">
              <Gift size={32} />
            </div>
          )}
          <div className="absolute top-2 left-2 recipient-dropdown">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveRecipientDropdown(
                  activeRecipientDropdown === gift.id ? null : gift.id
                );
              }}
              className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-md hover:bg-red-700 cursor-pointer transition-colors flex items-center gap-1 max-w-[150px] relative"
            >
              <span className="truncate">
                For{' '}
                {recipients.length > 0
                  ? recipients.map((r) => r.name).join(', ')
                  : '...'}
              </span>
              <ChevronDown size={10} className="shrink-0" />
            </button>
            {activeRecipientDropdown === gift.id && (
              <div className="absolute top-full left-0 mt-1 w-40 bg-white border rounded shadow-xl py-1 z-[140]">
                {profiles.map((p) => {
                  const isSelected = recipients.some((r) => r.id === p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleToggleRecipient(p.id);
                      }}
                      className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 ${
                        isSelected ? 'bg-red-50 font-bold' : ''
                      }`}
                    >
                      {isSelected ? '✓ ' : ''}
                      {p.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="absolute bottom-2 right-2 bg-white px-2 py-0.5 rounded text-xs font-bold shadow-md">
            ${gift.price?.toFixed(2) ?? '0.00'}
          </div>
          <button
            onClick={() => setEditingItem(gift)}
            className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full shadow-md text-slate-600 hover:text-blue-600"
          >
            <Pencil size={12} />
          </button>
        </div>
        <div className="p-3 flex-1 flex flex-col">
          <h3 className="font-bold text-sm mb-3 line-clamp-2">{gift.name}</h3>

          <div className="flex items-center gap-2 mb-2 text-xs text-slate-500">
            {gift.purchaser_id && (
              <>
                <span>
                  Purchased by:{' '}
                  <span className="font-bold">
                    {profiles.find((p) => p.id === gift.purchaser_id)?.name ?? 'Unknown'}
                  </span>
                </span>
                <span>•</span>
              </>
            )}
            <span>
              Return:{' '}
              <select
                value={gift.return_status ?? 'NONE'}
                onChange={async (e) => {
                  try {
                    await updateReturnStatus(
                      gift.id,
                      e.target.value as 'NONE' | 'TO_RETURN' | 'RETURNED'
                    );
                    onUpdate?.();
                  } catch (e: any) {
                    alert(e.message);
                  }
                }}
                className={`text-[10px] font-bold rounded px-2 py-0.5 border transition-colors ${
                  gift.return_status === 'TO_RETURN'
                    ? 'bg-orange-100 text-orange-700 border-orange-300'
                    : gift.return_status === 'RETURNED'
                    ? 'bg-green-100 text-green-700 border-green-300'
                    : 'bg-slate-100 text-slate-500 border-slate-300'
                }`}
              >
                <option value="NONE">None</option>
                <option value="TO_RETURN">To Return</option>
                <option value="RETURNED">Returned</option>
              </select>
            </span>
          </div>

          {gift.gift_tags && gift.gift_tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {gift.gift_tags.map((tagObj, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-[10px] rounded-full bg-blue-100 text-blue-700"
                >
                  {tagObj.tag}
                </span>
              ))}
            </div>
          )}

          {showClaimButton && (
            <div className="mt-auto flex rounded-lg shadow-sm">
              <button
                onClick={() => handleClaim(gift.id, currentUser)}
                disabled={!activeProfile || gift.status === 'claimed'}
                className={`flex-1 py-1.5 text-xs font-bold rounded-l-lg ${
                  gift.status === 'claimed'
                    ? 'bg-slate-100 text-slate-400'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {gift.status === 'claimed'
                  ? `Claimed by ${claimer?.name ?? 'Unknown'}`
                  : 'Claim'}
              </button>
              <div className="relative claim-dropdown bg-green-700 rounded-r-lg">
                <button
                  type="button"
                  disabled={!activeProfile}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveDropdown(
                      activeDropdown === gift.id ? null : gift.id
                    );
                  }}
                  className="h-full px-2 text-white hover:bg-green-800 rounded-r-lg relative"
                >
                  <ChevronDown size={14} />
                </button>
                {activeDropdown === gift.id && (
                  <div className="absolute bottom-full right-0 mb-1 w-32 bg-white border rounded shadow-xl py-1 z-[140]">
                    {profiles
                      .filter((p) => p.id !== currentUser)
                      .map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleClaim(gift.id, p.id);
                          }}
                          className="block w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50"
                        >
                          Assign {p.name}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {showReleaseButton && (
            <button
              onClick={() => handleUnclaim(gift.id)}
              className="mt-auto w-full py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"
            >
              Release
            </button>
          )}
        </div>
      </div>

      {editingItem && (
        <EditGiftModal
          gift={editingItem}
          profiles={profiles}
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
