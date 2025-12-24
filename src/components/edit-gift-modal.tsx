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
    purchaserId: gift.purchaser_id ?? '',
    tags: gift.gift_tags?.map((t) => t.tag) ?? [],
    newTag: '',
    isSanta: gift.is_santa,
    returnStatus: (gift.return_status ?? 'NONE') as 'NONE' | 'TO_RETURN' | 'RETURNED',
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
      await updateGift(gift.id, {
        ...formData,
        status,
        purchaserId: formData.purchaserId || undefined,
        tags: formData.tags,
        returnStatus: formData.returnStatus,
      });
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

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Purchaser (Who bought this?)
            </label>
            <select
              value={formData.purchaserId}
              onChange={(e) =>
                setFormData({ ...formData, purchaserId: e.target.value })
              }
              className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select purchaser (optional)</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-500">Tags:</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-700 flex items-center gap-1"
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
                    className="text-blue-700 hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
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
                className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
          <label className="flex items-center gap-2">
            <span className="text-sm font-bold">Return Status:</span>
            <select
              value={formData.returnStatus}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  returnStatus: e.target.value as 'NONE' | 'TO_RETURN' | 'RETURNED',
                })
              }
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="NONE">None</option>
              <option value="TO_RETURN">To Return</option>
              <option value="RETURNED">Returned</option>
            </select>
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
