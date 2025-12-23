"use client";

import { useState } from "react";
import { supabase } from "~/lib/supabase";

interface AddProfileFormProps {
  onClose: () => void;
}

export function AddProfileForm({ onClose }: AddProfileFormProps) {
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from("profiles").insert({ name });
    setName("");
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 border rounded-lg space-y-3">
      <input
        className="w-full border p-2 rounded"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Person name"
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
          className="flex-1 bg-green-600 text-white py-2 rounded font-bold"
        >
          Add Person
        </button>
      </div>
    </form>
  );
}

