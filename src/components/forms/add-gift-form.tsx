"use client";

import { useState } from "react";
import type { Profile } from "~/lib/types";

import { addGift } from "~/actions/gift-actions";

interface AddGiftFormProps {
  profiles: Profile[];
  onClose: () => void;
}

export function AddGiftForm({ profiles, onClose }: AddGiftFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    imageUrl: "",
    recipientIds: [] as string[],
    isSanta: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.recipientIds.length === 0) {
      alert("Please select at least one recipient");
      return;
    }

    try {
      await addGift(formData);
      onClose();
    } catch (e: any) {
      alert(e.message);
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
    <form onSubmit={handleSubmit} className="mt-4 p-4 border rounded-lg space-y-3">
      <input
        className="w-full border p-2 rounded"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Gift name"
        required
      />
      <div className="flex gap-2">
        <input
          className="w-full border p-2 rounded"
          type="number"
          step="0.01"
          min="0"
          value={formData.price}
          onChange={(e) =>
            setFormData({ ...formData, price: parseFloat(e.target.value) })
          }
          placeholder="Price"
          required
        />
      </div>
      
      <div className="space-y-1">
        <p className="text-sm font-bold text-slate-500">Recipients:</p>
        <div className="flex flex-wrap gap-2">
          {profiles.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => toggleRecipient(p.id)}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                formData.recipientIds.includes(p.id)
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <input
        className="w-full border p-2 rounded text-xs"
        value={formData.imageUrl}
        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
        placeholder="Image URL (optional)"
      />
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={formData.isSanta}
          onChange={(e) =>
            setFormData({ ...formData, isSanta: e.target.checked })
          }
        />
        Santa Item?
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-slate-200 text-slate-700 py-2 rounded font-bold"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white py-2 rounded font-bold"
        >
          Add Gift
        </button>
      </div>
    </form>
  );
}

