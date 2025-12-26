"use client";

import { useState } from "react";
import { X, Gift, Banknote, CreditCard } from "lucide-react";
import type { Profile, GiftType } from "~/lib/types";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { cn } from "~/lib/utils";

import { addGift } from "~/actions/gift-actions";

interface AddGiftFormProps {
  profiles: Profile[];
  currentUser?: string;
  onClose: () => void;
}

const giftTypeOptions: { value: GiftType; label: string; icon: React.ReactNode; emoji: string }[] = [
  { value: "item", label: "Physical Gift", icon: <Gift className="h-4 w-4" />, emoji: "🎁" },
  { value: "cash", label: "Cash", icon: <Banknote className="h-4 w-4" />, emoji: "💵" },
  { value: "gift_card", label: "Gift Card", icon: <CreditCard className="h-4 w-4" />, emoji: "💳" },
];

export function AddGiftForm({ profiles, currentUser, onClose }: AddGiftFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    imageUrl: "",
    recipientIds: [] as string[],
    purchaserId: "",
    giftType: "item" as GiftType,
    tags: [] as string[],
    newTag: "",
    isSanta: false,
    returnStatus: "NONE" as "NONE" | "TO_RETURN" | "RETURNED",
    claimByPurchaser: true,
  });

  // Auto-set name for cash/gift card if empty
  const getDefaultName = () => {
    if (formData.giftType === "cash") return "Cash";
    if (formData.giftType === "gift_card") return "Gift Card";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.recipientIds.length === 0) {
      alert("Please select at least one recipient");
      return;
    }

    try {
      // For cash/gift_card, auto-claim by purchaser if checkbox is checked
      const claimedById = 
        formData.giftType !== "item" && formData.claimByPurchaser && formData.purchaserId
          ? formData.purchaserId
          : undefined;

      await addGift({
        ...formData,
        name: formData.name || getDefaultName(),
        createdById: currentUser,
        giftType: formData.giftType,
        claimedById,
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert(message);
    }
  };

  const toggleRecipient = (id: string) => {
    setFormData((prev) => {
      if (prev.recipientIds.includes(id)) {
        return { ...prev, recipientIds: prev.recipientIds.filter((r) => r !== id) };
      } else {
        return { ...prev, recipientIds: [...prev.recipientIds, id] };
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Gift Type Selector */}
      <div className="space-y-2">
        <Label>Type</Label>
        <div className="flex gap-2">
          {giftTypeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFormData({ ...formData, giftType: option.value })}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all",
                formData.giftType === option.value
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-muted-foreground/30"
              )}
            >
              <span className="text-xl">{option.emoji}</span>
              <span className="text-xs font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">
          {formData.giftType === "item" ? "Gift Name" : formData.giftType === "cash" ? "Description (optional)" : "Gift Card Name"}
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={formData.giftType === "item" ? "Gift name" : formData.giftType === "cash" ? "e.g., Birthday cash" : "e.g., Amazon Gift Card"}
          required={formData.giftType === "item"}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="price">
            {formData.giftType === "cash" ? "Amount" : formData.giftType === "gift_card" ? "Value" : "Price"}
          </Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
            }
            placeholder="0.00"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>{formData.giftType === "cash" ? "From" : "Purchaser"}</Label>
          <Select
            value={formData.purchaserId}
            onValueChange={(value) =>
              setFormData({ ...formData, purchaserId: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={formData.giftType === "cash" ? "Who gave?" : "Who bought?"} />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Auto-claim checkbox for cash/gift_card */}
      {formData.giftType !== "item" && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="claimByPurchaser"
            checked={formData.claimByPurchaser}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, claimByPurchaser: checked as boolean })
            }
          />
          <Label htmlFor="claimByPurchaser" className="text-sm">
            {formData.giftType === "cash" ? "Mark as given by giver" : "Mark as claimed by purchaser"}
          </Label>
        </div>
      )}

      <div className="space-y-2">
        <Label>Recipients</Label>
        <div className="flex flex-wrap gap-1.5">
          {profiles.map((p) => (
            <Badge
              key={p.id}
              variant={formData.recipientIds.includes(p.id) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleRecipient(p.id)}
            >
              {p.name}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {formData.tags.map((tag, idx) => (
            <Badge
              key={idx}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              {tag}
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    tags: formData.tags.filter((_, i) => i !== idx),
                  })
                }
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <Input
          type="text"
          value={formData.newTag}
          onChange={(e) =>
            setFormData({ ...formData, newTag: e.target.value })
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter' && formData.newTag.trim()) {
              e.preventDefault();
              setFormData({
                ...formData,
                tags: [...formData.tags, formData.newTag.trim()],
                newTag: '',
              });
            }
          }}
          placeholder="Add tag (press Enter)"
        />
      </div>

      {/* Image URL - only for physical items */}
      {formData.giftType === "item" && (
        <div className="space-y-2">
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input
            id="imageUrl"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isSanta"
            checked={formData.isSanta}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, isSanta: checked as boolean })
            }
          />
          <Label htmlFor="isSanta" className="text-sm">Santa Item?</Label>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-sm">Return Status:</Label>
          <Select
            value={formData.returnStatus}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                returnStatus: value as "NONE" | "TO_RETURN" | "RETURNED",
              })
            }
          >
            <SelectTrigger className="w-28 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">None</SelectItem>
              <SelectItem value="TO_RETURN">To Return</SelectItem>
              <SelectItem value="RETURNED">Returned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          Add Gift
        </Button>
      </div>
    </form>
  );
}
