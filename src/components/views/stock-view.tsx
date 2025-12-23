"use client";

import { useState, useMemo } from "react";
import { Search, Filter, ArrowUpDown, Lock } from "lucide-react";
import { GiftCard } from "~/components/gift-card";
import type { Gift, Profile } from "~/lib/types";

interface StockViewProps {
  gifts: Gift[];
  profiles: Profile[];
  currentUser: string;
  activeProfile: Profile | undefined;
}

export function StockView({
  gifts,
  profiles,
  currentUser,
  activeProfile,
}: StockViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("available");
  const [filterRecipient, setFilterRecipient] = useState("all");
  const [filterGifter, setFilterGifter] = useState("all");
  const [sortOption, setSortOption] = useState("name-asc");
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showSanta, setShowSanta] = useState(false);

  const filteredGifts = useMemo(() => {
    let result = showSanta 
      ? gifts.filter((g) => g.is_santa)
      : gifts.filter((g) => !g.is_santa);

    if (searchQuery) {
      result = result.filter((g) =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus === "available") {
      result = result.filter((g) => g.status === "available");
    } else if (filterStatus === "claimed") {
      result = result.filter((g) => g.status === "claimed");
    }

    if (filterRecipient !== "all") {
      result = result.filter((g) =>
        g.gift_recipients?.some((r) => r.profile.id === filterRecipient)
      );
    }

    if (filterGifter !== "all") {
      if (filterGifter === "unclaimed") {
        result = result.filter((g) => !g.claimed_by_id);
      } else {
        result = result.filter((g) => g.claimed_by_id === filterGifter);
      }
    }

    result.sort((a, b) => {
      switch (sortOption) {
        case "price-asc":
          return (a.price ?? 0) - (b.price ?? 0);
        case "price-desc":
          return (b.price ?? 0) - (a.price ?? 0);
        case "name-desc":
          return b.name.localeCompare(a.name);
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [
    gifts,
    searchQuery,
    filterStatus,
    filterRecipient,
    filterGifter,
    sortOption,
    showSanta,
  ]);

  return (
    <>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowSanta(false)}
          className={`px-4 py-2 rounded-lg font-bold text-sm border transition-colors ${
            !showSanta
              ? 'bg-red-600 text-white border-red-600'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
          }`}
        >
          Stock
        </button>
        <button
          onClick={() => setShowSanta(true)}
          className={`px-4 py-2 rounded-lg font-bold text-sm border transition-colors flex items-center gap-2 ${
            showSanta
              ? 'bg-red-600 text-white border-red-600'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
          }`}
        >
          <Lock size={16} /> Santa
        </button>
      </div>

      <div className="bg-white p-3 rounded-xl border flex gap-2 shadow-sm sticky top-20 z-10">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
          <input
            className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-lg text-sm outline-none focus:ring-2 ring-red-200"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-lg border ${
            showFilters
              ? "bg-red-50 text-red-600 border-red-200"
              : "border-slate-200"
          }`}
        >
          <Filter size={20} />
        </button>
        <button
          onClick={() => setShowSort(!showSort)}
          className={`p-2 rounded-lg border ${
            showSort
              ? "bg-red-50 text-red-600 border-red-200"
              : "border-slate-200"
          }`}
        >
          <ArrowUpDown size={20} />
        </button>

        {showFilters && (
          <div className="absolute top-full right-0 mt-2 w-64 bg-white border rounded-xl shadow-xl p-4 z-20 space-y-3">
            <div>
              <p className="text-xs font-bold text-slate-400 mb-1">Status</p>
              <select
                className="w-full border rounded p-1 text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="available">Available</option>
                <option value="claimed">Claimed</option>
                <option value="all">All</option>
              </select>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 mb-1">Recipient</p>
              <select
                className="w-full border rounded p-1 text-sm"
                value={filterRecipient}
                onChange={(e) => setFilterRecipient(e.target.value)}
              >
                <option value="all">Everyone</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 mb-1">Gifter</p>
              <select
                className="w-full border rounded p-1 text-sm"
                value={filterGifter}
                onChange={(e) => setFilterGifter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="unclaimed">Unclaimed</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {showSort && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-white border rounded-xl shadow-xl p-2 z-20">
            {["name-asc", "name-desc", "price-asc", "price-desc"].map((o) => (
              <button
                key={o}
                onClick={() => {
                  setSortOption(o);
                  setShowSort(false);
                }}
                className="block w-full text-left px-3 py-2 hover:bg-slate-50 rounded text-sm capitalize"
              >
                {o.replace("-", " ")}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredGifts.map((gift) => (
          <GiftCard
            key={gift.id}
            gift={gift}
            profiles={profiles}
            currentUser={currentUser}
            activeProfile={activeProfile}
            showClaimButton={true}
          />
        ))}
      </div>
    </>
  );
}

