"use client";

import { GiftCard } from "~/components/gift-card";
import type { Gift, Profile } from "~/lib/types";
import { Package } from "lucide-react";

interface MyPicksViewProps {
  gifts: Gift[];
  profiles: Profile[];
  currentUser: string;
  activeProfile: Profile | undefined;
}

export function MyPicksView({
  gifts,
  profiles,
  currentUser,
  activeProfile,
}: MyPicksViewProps) {
  if (gifts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-bold mb-2">
          No claimed gifts yet
        </h3>
        <p className="text-sm text-muted-foreground">
          Head to the Stock page to claim gifts you're planning to buy.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground px-1">
        {gifts.length} {gifts.length === 1 ? 'item' : 'items'} claimed
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
        {gifts.map((gift) => (
          <GiftCard
            key={gift.id}
            gift={gift}
            profiles={profiles}
            currentUser={currentUser}
            activeProfile={activeProfile}
            showClaimButton={false}
            showReleaseButton={true}
          />
        ))}
      </div>
    </div>
  );
}
