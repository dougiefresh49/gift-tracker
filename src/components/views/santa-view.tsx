"use client";

import { GiftCard } from "~/components/gift-card";
import type { Gift, Profile } from "~/lib/types";

interface SantaViewProps {
  gifts: Gift[];
  profiles: Profile[];
  currentUser: string;
  activeProfile: Profile | undefined;
}

export function SantaView({
  gifts,
  profiles,
  currentUser,
  activeProfile,
}: SantaViewProps) {
  const santaGifts = gifts.filter((g) => g.is_santa);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {santaGifts.map((gift) => (
        <GiftCard
          key={gift.id}
          gift={gift}
          profiles={profiles}
          currentUser={currentUser}
          activeProfile={activeProfile}
          showClaimButton={false}
        />
      ))}
    </div>
  );
}

