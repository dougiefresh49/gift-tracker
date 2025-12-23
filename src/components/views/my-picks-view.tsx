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
        <Package className="w-16 h-16 text-slate-300 mb-4" />
        <h3 className="text-lg font-bold text-slate-700 mb-2">
          No claimed gifts yet
        </h3>
        <p className="text-sm text-slate-500">
          Head to the Stock page to claim gifts you're planning to buy.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
  );
}

