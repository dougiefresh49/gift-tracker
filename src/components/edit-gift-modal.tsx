'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { Gift, Profile } from '~/lib/types';

import { updateGift, deleteGift } from '~/actions/gift-actions';

interface EditGiftModalProps {
  gift: Gift;
  profiles: Profile[];
  onClose: () => void;
  onUpdate?: () => void;
}

export function EditGiftModal({
  gift,
  profiles,
  onClose,
  onUpdate,
}: EditGiftModalProps) {
  const [formData, setFormData] = useState({
    name: gift.name,
    price: gift.price ?? 0,
    imageUrl: gift.image_url ?? '',
    recipientIds: gift.gift_recipients?.map((r) => r.profile.id) ?? [],
    isSanta: gift.is_santa,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.recipientIds.length === 0) {
      alert('Please select at least one recipient');
      return;
    }

    const status = formData.isSanta
      ? 'santa'
      : gift.status === 'santa'
      ? 'available'
      : gift.status;

    try {
      await updateGift(gift.id, { ...formData, status });
      onUpdate?.();
      onClose();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async () => {
    if (confirm('Delete item?')) {
      try {
        await deleteGift(gift.id);
        onUpdate?.();
        onClose();
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  const toggleRecipient = (id: string) => {
    setFormData((prev) => {
      if (prev.recipientIds.includes(id)) {
        return {
          ...prev,
          recipientIds: prev.recipientIds.filter((r) => r !== id),
        };
      } else {
        return { ...prev, recipientIds: [...prev.recipientIds, id] };
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden">
        <div className="p-4 border-b font-bold flex justify-between bg-slate-50">
          Edit Item
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
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
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
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
            onChange={(e) =>
              setFormData({ ...formData, imageUrl: e.target.value })
            }
            placeholder="Image URL"
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
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleDelete}
              className="flex-1 bg-red-100 text-red-600 py-2 rounded font-bold"
            >
              Delete
            </button>
            <button
              type="submit"
              className="flex-[2] bg-blue-600 text-white py-2 rounded font-bold"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
