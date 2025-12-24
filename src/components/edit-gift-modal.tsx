'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { Gift, Profile } from '~/lib/types';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Badge } from '~/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Label } from '~/components/ui/label';
import { Checkbox } from '~/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert(message);
    }
  };

  const handleDelete = async () => {
    if (confirm('Delete item?')) {
      try {
        await deleteGift(gift.id);
        onUpdate?.();
        onClose();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        alert(message);
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
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <Card className="w-full max-w-sm max-h-[90vh] overflow-auto">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Edit Item</CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Gift Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Gift name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price</Label>
                <Input
                  id="edit-price"
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
                <Label>Purchaser</Label>
                <Select
                  value={formData.purchaserId || "none"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, purchaserId: value === "none" ? "" : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Who bought?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No one</SelectItem>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="edit-imageUrl">Image URL</Label>
              <Input
                id="edit-imageUrl"
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData({ ...formData, imageUrl: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-isSanta"
                  checked={formData.isSanta}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isSanta: checked as boolean })
                  }
                />
                <Label htmlFor="edit-isSanta" className="text-sm">Santa Item?</Label>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-sm">Return:</Label>
                <Select
                  value={formData.returnStatus}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      returnStatus: value as 'NONE' | 'TO_RETURN' | 'RETURNED',
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
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
              >
                Delete
              </Button>
              <Button type="submit" className="flex-[2]">
                Save
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
