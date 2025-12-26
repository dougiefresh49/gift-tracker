"use client";

import { useState } from "react";
import {
  Database,
  Plus,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";

interface AdminViewProps {
  profiles: Profile[];
  gifts: Gift[];
  budgets: Budget[];
  currentUser?: string;
  onDataChange?: () => void;
}

export function AdminView({ profiles, gifts, budgets, currentUser, onDataChange }: AdminViewProps) {
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

      for (const profile of data.profiles) {
        await supabase.from("profiles").insert({
          id: profile.id,
          name: profile.name,
          created_at: profile.created_at,
        });
      }

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

        if (gift.gift_recipients && gift.gift_recipients.length > 0) {
          const recipientInserts = gift.gift_recipients.map((r: Record<string, unknown>) => ({
            gift_id: gift.id,
            profile_id: (r.profile as Record<string, unknown>)?.id || r.profile_id,
          }));
          await supabase.from("gift_recipients").insert(recipientInserts);
        } else if (gift.recipient_id) {
          await supabase.from("gift_recipients").insert({
            gift_id: gift.id,
            profile_id: gift.recipient_id,
          });
        }
      }

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
    <div className="space-y-4">
      {/* Master Import */}
      <Card className="bg-foreground text-background">
        <CardHeader className="p-4 pb-2 text-center">
          <Database className="mx-auto mb-1 opacity-50 h-8 w-8" />
          <CardTitle className="text-base">Database Setup</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2 text-center">
          <Button
            onClick={handleMasterImport}
            disabled={importing}
            variant="secondary"
            size="sm"
          >
            {importing ? "Importing..." : "Run Master Import (Paste JSON)"}
          </Button>
          <p className="text-xs opacity-60 mt-2">
            Paste a JSON array of gifts to import into the DB.
          </p>
        </CardContent>
      </Card>

      {/* People Manager */}
      <PeopleManager profiles={profiles} />

      {/* Budget Manager */}
      <BudgetManager
        profiles={profiles}
        budgets={budgets}
        onDataChange={onDataChange}
      />

      {/* Manual Add Gift */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base">Manual Add Gift</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <Button
            onClick={() => setShowAddGift(true)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Gift
          </Button>
        </CardContent>
      </Card>

      <Sheet open={showAddGift} onOpenChange={setShowAddGift}>
        <SheetContent side="bottom" className="rounded-t-xl max-h-[85vh] overflow-auto pb-20">
          <SheetHeader>
            <SheetTitle>Add New Gift</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <AddGiftForm
              profiles={profiles}
              currentUser={currentUser}
              onClose={() => setShowAddGift(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Backup & Restore */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base">Backup & Restore</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2 flex gap-2 flex-wrap">
          <Button
            onClick={handleExport}
            variant="secondary"
            size="sm"
          >
            {copied ? <Check className="h-4 w-4 mr-1" /> : <ClipboardCopy className="h-4 w-4 mr-1" />}
            {copied ? "Copied!" : "Export"}
          </Button>
          <Button
            onClick={handleImport}
            variant="outline"
            size="sm"
          >
            <Upload className="h-4 w-4 mr-1" /> Import
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
          <CardDescription className="text-xs">
            This will delete ALL profiles, gifts, and budgets. Cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <Button
            onClick={handleWipe}
            variant="destructive"
            size="sm"
          >
            <Trash2 className="h-4 w-4 mr-1" /> Wipe Database
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
