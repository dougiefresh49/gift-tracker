"use client";

import { GiftCard } from "~/components/gift-card";
import type { Gift, Profile } from "~/lib/types";

interface MyPicksViewProps {
  gifts: Gift[];
  profiles: Profile[];
  currentUser: string;
}

export function MyPicksView({
  gifts,
  profiles,
  currentUser,
}: MyPicksViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {gifts.map((gift) => (
        <GiftCard
          key={gift.id}
          gift={gift}
          profiles={profiles}
          currentUser={currentUser}
          activeProfile={undefined}
          showClaimButton={false}
          showReleaseButton={true}
        />
      ))}
    </div>
  );
}

