"use client";

import { Gift } from "lucide-react";
import type { Profile } from "~/lib/types";

interface HeaderProps {
  currentUser: string;
  setCurrentUser: (userId: string) => void;
  profiles: Profile[];
}

export function Header({ currentUser, setCurrentUser, profiles }: HeaderProps) {
  return (
    <header className="bg-red-700 text-white p-4 shadow-lg sticky top-0 z-[200] flex justify-between items-center">
      <div className="flex items-center gap-2">
        <Gift size={24} />
        <span className="font-bold text-lg">Gift Tracker</span>
      </div>
      <select
        className="bg-red-800 rounded px-2 py-1 text-sm border border-red-500"
        value={currentUser}
        onChange={(e) => setCurrentUser(e.target.value)}
      >
        <option value="">I am...</option>
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </header>
  );
}

