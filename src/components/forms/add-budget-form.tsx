"use client";

import { useState } from "react";
import { supabase } from "~/lib/supabase";
import type { Profile } from "~/lib/types";

interface AddBudgetFormProps {
  profiles: Profile[];
  onClose: () => void;
}

export function AddBudgetForm({ profiles, onClose }: AddBudgetFormProps) {
  const [formData, setFormData] = useState({
    gifterId: "",
    recipientId: "",
    limitAmount: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from("budgets").insert({
      gifter_id: formData.gifterId,
      recipient_id: formData.recipientId,
      limit_amount: formData.limitAmount,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 border rounded-lg space-y-3">
      <select
        className="w-full border p-2 rounded"
        value={formData.gifterId}
        onChange={(e) =>
          setFormData({ ...formData, gifterId: e.target.value })
        }
        required
      >
        <option value="">Select gifter</option>
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <select
        className="w-full border p-2 rounded"
        value={formData.recipientId}
        onChange={(e) =>
          setFormData({ ...formData, recipientId: e.target.value })
        }
        required
      >
        <option value="">Select recipient</option>
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <input
        className="w-full border p-2 rounded"
        type="number"
        step="0.01"
        min="0"
        value={formData.limitAmount}
        onChange={(e) =>
          setFormData({ ...formData, limitAmount: parseFloat(e.target.value) })
        }
        placeholder="Budget limit"
        required
      />
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
          className="flex-1 bg-purple-600 text-white py-2 rounded font-bold"
        >
          Add Budget
        </button>
      </div>
    </form>
  );
}

