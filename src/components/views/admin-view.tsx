"use client";

import { useState } from "react";
import {
  Database,
  Plus,
  Download,
  Upload,
  Trash2,
  ClipboardCopy,
  Check,
} from "lucide-react";
import { supabase } from "~/lib/supabase";
import type { Profile, Gift, Budget, MasterImportItem } from "~/lib/types";
import { AddGiftForm } from "~/components/forms/add-gift-form";
import { PeopleManager } from "~/components/people-manager";
import { BudgetManager } from "~/components/budget-manager";
import { addGift, addBudget, deleteBudget, addProfile, deleteProfile } from "~/actions/gift-actions";

interface AdminViewProps {
  profiles: Profile[];
  gifts: Gift[];
  budgets: Budget[];
  onDataChange?: () => void;
}

export function AdminView({ profiles, gifts, budgets, onDataChange }: AdminViewProps) {
  const [importing, setImporting] = useState(false);
  const [showAddGift, setShowAddGift] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleMasterImport = async () => {
    const json = prompt("Paste Master Import JSON:");
    if (!json) return;

    if (!confirm("Import Master List? This will skip duplicates.")) return;
    setImporting(true);
    try {
      const data = JSON.parse(json) as MasterImportItem[];
      for (const item of data) {
        // Ensure profile exists
        let { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .ilike("name", item.recipientName)
          .single();

        if (!profile) {
          const { data: newProfile } = await supabase
            .from("profiles")
            .insert({ name: item.recipientName })
            .select()
            .single();
          profile = newProfile;
        }

        if (!profile) continue;

        // Check if gift exists
        const { count } = await supabase
          .from("gifts")
          .select("*", { count: "exact", head: true })
          .eq("name", item.name);

        if (count === 0) {
          const { data: newGift, error } = await supabase
            .from("gifts")
            .insert({
              name: item.name,
              price: item.price,
              image_url: item.imageUrl || null,
              is_santa: item.isSanta,
              status: item.isSanta ? "santa" : "available",
            })
            .select()
            .single();

          if (newGift && !error) {
            await supabase.from("gift_recipients").insert({
              gift_id: newGift.id,
              profile_id: profile.id,
            });
          }
        }
      }
      alert("Import Done!");
    } catch (e) {
      console.error(e);
      alert("Error importing: Invalid JSON format");
    }
    setImporting(false);
  };

  const handleExport = async () => {
    const data = {
      profiles,
      gifts,
      budgets,
      exportedAt: new Date().toISOString(),
    };
    const json = JSON.stringify(data, null, 2);
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Note: Import/Wipe handlers still use direct supabase calls for bulk ops
  // as they are admin-only/complex tasks better suited for direct DB access
  // or a dedicated specialized server action. For now we keep them as is 
  // but wrap in try/catch to be safe.

  const handleImport = async () => {
    const json = prompt("Paste JSON backup data:");
    if (!json) return;

    try {
      const data = JSON.parse(json);
      if (!data.profiles || !data.gifts || !data.budgets) {
        alert("Invalid backup format");
        return;
      }

      if (!confirm("This will replace all current data. Continue?")) return;

      // Clear existing data (delete in order to respect foreign keys)
      const { data: allGifts } = await supabase.from("gifts").select("id");
      const { data: allBudgets } = await supabase.from("budgets").select("id");
      const { data: allProfiles } = await supabase.from("profiles").select("id");

      if (allGifts && allGifts.length > 0) {
        await Promise.all(
          allGifts.map((gift) =>
            supabase.from("gifts").delete().eq("id", gift.id)
          )
        );
      }
      if (allBudgets && allBudgets.length > 0) {
        await Promise.all(
          allBudgets.map((budget) =>
            supabase.from("budgets").delete().eq("id", budget.id)
          )
        );
      }
      if (allProfiles && allProfiles.length > 0) {
        await Promise.all(
          allProfiles.map((profile) =>
            supabase.from("profiles").delete().eq("id", profile.id)
          )
        );
      }

      // Import profiles
      for (const profile of data.profiles) {
        await supabase.from("profiles").insert({
          id: profile.id,
          name: profile.name,
          created_at: profile.created_at,
        });
      }

      // Import gifts
      for (const gift of data.gifts) {
        await supabase.from("gifts").insert({
          id: gift.id,
          name: gift.name,
          price: gift.price,
          image_url: gift.image_url,
          status: gift.status,
          recipient_id: gift.recipient_id,
          claimed_by_id: gift.claimed_by_id,
          is_santa: gift.is_santa,
          created_at: gift.created_at,
        });

        // Restore gift recipients (Handle both new and legacy formats)
        if (gift.gift_recipients && gift.gift_recipients.length > 0) {
          const recipientInserts = gift.gift_recipients.map((r: any) => ({
            gift_id: gift.id,
            profile_id: r.profile?.id || r.profile_id, // Handle potential data structure variations
          }));
          await supabase.from("gift_recipients").insert(recipientInserts);
        } else if (gift.recipient_id) {
          // Fallback for old backups
          await supabase.from("gift_recipients").insert({
            gift_id: gift.id,
            profile_id: gift.recipient_id,
          });
        }
      }

      // Import budgets
      for (const budget of data.budgets) {
        await supabase.from("budgets").insert({
          id: budget.id,
          gifter_id: budget.gifter_id,
          recipient_id: budget.recipient_id,
          limit_amount: budget.limit_amount,
        });
      }

      alert("Import successful!");
    } catch (e) {
      console.error(e);
      alert("Error importing backup");
    }
  };

  const handleWipe = async () => {
    if (
      !confirm(
        "WIPE ALL DATA? This cannot be undone. Type 'DELETE' to confirm."
      )
    ) {
      return;
    }
    const confirmation = prompt("Type 'DELETE' to confirm:");
    if (confirmation !== "DELETE") return;

    // Delete all gifts, budgets, then profiles (respecting foreign key constraints)
    const { data: allGifts } = await supabase.from("gifts").select("id");
    const { data: allBudgets } = await supabase.from("budgets").select("id");
    const { data: allProfiles } = await supabase.from("profiles").select("id");

    if (allGifts && allGifts.length > 0) {
      await Promise.all(
        allGifts.map((gift) =>
          supabase.from("gifts").delete().eq("id", gift.id)
        )
      );
    }
    if (allBudgets && allBudgets.length > 0) {
      await Promise.all(
        allBudgets.map((budget) =>
          supabase.from("budgets").delete().eq("id", budget.id)
        )
      );
    }
    if (allProfiles && allProfiles.length > 0) {
      await Promise.all(
        allProfiles.map((profile) =>
          supabase.from("profiles").delete().eq("id", profile.id)
        )
      );
    }
    alert("Database wiped!");
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white p-6 rounded-xl text-center">
        <Database className="mx-auto mb-2 opacity-50" size={40} />
        <h2 className="font-bold mb-2">Database Setup</h2>
        <button
          onClick={handleMasterImport}
          disabled={importing}
          className="bg-indigo-500 px-6 py-2 rounded-lg font-bold hover:bg-indigo-600 disabled:opacity-50"
        >
          {importing ? "Importing..." : "Run Master Import (Paste JSON)"}
        </button>
        <p className="text-xs text-slate-400 mt-2">
          Paste a JSON array of gifts to import into the DB.
        </p>
      </div>

      <PeopleManager profiles={profiles} />

      <BudgetManager
        profiles={profiles}
        budgets={budgets}
        onDataChange={onDataChange}
      />

      <div className="bg-white p-6 rounded-xl border space-y-4">
        <h3 className="font-bold text-lg">Manual Add Gift</h3>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowAddGift(!showAddGift)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} /> Add Gift
          </button>
        </div>

        {showAddGift && (
          <AddGiftForm
            profiles={profiles}
            onClose={() => setShowAddGift(false)}
          />
        )}
      </div>

      <div className="bg-white p-6 rounded-xl border space-y-4">
        <h3 className="font-bold text-lg">Backup & Restore</h3>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            {copied ? <Check size={16} /> : <ClipboardCopy size={16} />}
            {copied ? "Copied!" : "Export to Clipboard"}
          </button>
          <button
            onClick={handleImport}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            <Upload size={16} /> Import from Clipboard
          </button>
        </div>
      </div>

      <div className="bg-red-50 border-2 border-red-200 p-6 rounded-xl">
        <h3 className="font-bold text-lg text-red-900 mb-2">Danger Zone</h3>
          <button
            onClick={handleWipe}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
          <Trash2 size={16} /> Wipe Database
        </button>
        <p className="text-xs text-red-600 mt-2">
          This will delete ALL profiles, gifts, and budgets. Cannot be undone.
        </p>
      </div>
    </div>
  );
}

