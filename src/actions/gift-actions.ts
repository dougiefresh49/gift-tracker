'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '~/lib/supabase';

export async function addGift(formData: {
  name: string;
  price: number;
  imageUrl: string;
  recipientIds: string[];
  purchaserId?: string;
  createdById?: string;
  claimedById?: string;
  giftType?: 'item' | 'cash' | 'gift_card';
  tags?: string[];
  isSanta: boolean;
  returnStatus?: 'NONE' | 'TO_RETURN' | 'RETURNED';
}) {
  // Determine status based on claimer
  let status: 'available' | 'claimed' | 'santa' = 'available';
  if (formData.isSanta) {
    status = 'santa';
  } else if (formData.claimedById) {
    status = 'claimed';
  }

  // 1. Insert Gift
  const { data: gift, error: giftError } = await supabase
    .from('gifts')
    .insert({
      name: formData.name,
      price: formData.price,
      image_url: formData.imageUrl || null,
      purchaser_id: formData.purchaserId || null,
      created_by_id: formData.createdById || null,
      claimed_by_id: formData.claimedById || null,
      gift_type: formData.giftType ?? 'item',
      is_santa: formData.isSanta,
      status,
      return_status: formData.returnStatus ?? 'NONE',
    })
    .select()
    .single();

  if (giftError || !gift) {
    throw new Error('Error creating gift: ' + giftError?.message);
  }

  // 2. Insert Recipients
  const recipientInserts = formData.recipientIds.map((id) => ({
    gift_id: gift.id,
    profile_id: id,
  }));

  const { error: recipientError } = await supabase
    .from('gift_recipients')
    .insert(recipientInserts);

  if (recipientError) {
    throw new Error('Error adding recipients: ' + recipientError.message);
  }

  // 3. Insert Tags
  if (formData.tags && formData.tags.length > 0) {
    const tagInserts = formData.tags.map((tag) => ({
      gift_id: gift.id,
      tag: tag.trim(),
    }));

    const { error: tagError } = await supabase
      .from('gift_tags')
      .insert(tagInserts);

    if (tagError) {
      throw new Error('Error adding tags: ' + tagError.message);
    }
  }

  revalidatePath('/');
}

export async function updateGift(
  giftId: string,
  formData: {
    name: string;
    price: number;
    imageUrl: string;
    recipientIds: string[];
    purchaserId?: string;
    claimedById?: string;
    giftType?: 'item' | 'cash' | 'gift_card';
    tags?: string[];
    isSanta: boolean;
    status: string;
    returnStatus?: 'NONE' | 'TO_RETURN' | 'RETURNED';
  }
) {
  // Determine status based on claimer
  let finalStatus = formData.status;
  if (formData.claimedById !== undefined) {
    if (formData.claimedById) {
      finalStatus = formData.isSanta ? 'santa' : 'claimed';
    } else {
      finalStatus = formData.isSanta ? 'santa' : 'available';
    }
  }

  // 1. Update Gift Details
  const { error } = await supabase
    .from('gifts')
    .update({
      name: formData.name,
      price: formData.price,
      image_url: formData.imageUrl || null,
      purchaser_id: formData.purchaserId || null,
      claimed_by_id: formData.claimedById || null,
      gift_type: formData.giftType ?? 'item',
      is_santa: formData.isSanta,
      status: finalStatus,
      return_status: formData.returnStatus ?? 'NONE',
    })
    .eq('id', giftId);

  if (error) {
    throw new Error('Error updating gift: ' + error.message);
  }

  // 2. Sync Recipients
  // First, get existing recipients to minimize churn
  const { data: existingRecipients } = await supabase
    .from('gift_recipients')
    .select('profile_id')
    .eq('gift_id', giftId);

  const currentIds = existingRecipients?.map((r) => r.profile_id) ?? [];
  const newIds = formData.recipientIds;

  const toAdd = newIds.filter((id) => !currentIds.includes(id));
  const toRemove = currentIds.filter((id) => !newIds.includes(id));

  if (toRemove.length > 0) {
    await supabase
      .from('gift_recipients')
      .delete()
      .eq('gift_id', giftId)
      .in('profile_id', toRemove);
  }

  if (toAdd.length > 0) {
    await supabase.from('gift_recipients').insert(
      toAdd.map((pid) => ({
        gift_id: giftId,
        profile_id: pid,
      }))
    );
  }

  // 3. Sync Tags
  if (formData.tags !== undefined) {
    // Delete all existing tags
    await supabase.from('gift_tags').delete().eq('gift_id', giftId);

    // Insert new tags
    if (formData.tags.length > 0) {
      const tagInserts = formData.tags.map((tag) => ({
        gift_id: giftId,
        tag: tag.trim(),
      }));

      const { error: tagError } = await supabase
        .from('gift_tags')
        .insert(tagInserts);

      if (tagError) {
        throw new Error('Error updating tags: ' + tagError.message);
      }
    }
  }

  revalidatePath('/');
}

export async function deleteGift(giftId: string) {
  const { error } = await supabase.from('gifts').delete().eq('id', giftId);
  if (error) {
    throw new Error('Error deleting gift: ' + error.message);
  }
  revalidatePath('/');
}

export async function toggleGiftRecipient(
  giftId: string,
  profileId: string,
  isAdding: boolean
) {
  if (isAdding) {
    await supabase.from('gift_recipients').insert({
      gift_id: giftId,
      profile_id: profileId,
    });
  } else {
    await supabase
      .from('gift_recipients')
      .delete()
      .eq('gift_id', giftId)
      .eq('profile_id', profileId);
  }
  revalidatePath('/');
}

export async function claimGift(giftId: string, claimerId: string) {
  const { error } = await supabase
    .from('gifts')
    .update({ status: 'claimed', claimed_by_id: claimerId })
    .eq('id', giftId);

  if (error) throw new Error('Error claiming gift');
  revalidatePath('/');
}

export async function unclaimGift(giftId: string) {
  const { error } = await supabase
    .from('gifts')
    .update({ status: 'available', claimed_by_id: null })
    .eq('id', giftId);

  if (error) throw new Error('Error unclaiming gift');
  revalidatePath('/');
}

export async function updateReturnStatus(
  giftId: string,
  returnStatus: 'NONE' | 'TO_RETURN' | 'RETURNED'
) {
  const { error } = await supabase
    .from('gifts')
    .update({ return_status: returnStatus })
    .eq('id', giftId);

  if (error) throw new Error('Error updating return status');
  revalidatePath('/');
}

export async function addBudget(budget: {
  gifterId: string;
  recipientId: string;
  limitAmount: number;
}) {
  const { error } = await supabase.from('budgets').insert({
    gifter_id: budget.gifterId,
    recipient_id: budget.recipientId,
    limit_amount: budget.limitAmount,
  });

  if (error) throw new Error('Error adding budget: ' + error.message);
  revalidatePath('/');
}

export async function deleteBudget(budgetId: string) {
  const { error } = await supabase.from('budgets').delete().eq('id', budgetId);
  if (error) throw new Error('Error deleting budget');
  revalidatePath('/');
}

export async function addProfile(name: string) {
  const { data, error } = await supabase
    .from('profiles')
    .insert({ name })
    .select()
    .single();

  if (error) throw new Error('Error adding profile: ' + error.message);
  revalidatePath('/');
  return data;
}

export async function deleteProfile(id: string) {
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) throw new Error('Error deleting profile');
  revalidatePath('/');
}

export async function bulkUpdateGifts(
  giftIds: string[],
  updates: {
    recipientIds?: string[];
    purchaserId?: string | null;
    isSanta?: boolean;
    returnStatus?: 'NONE' | 'TO_RETURN' | 'RETURNED';
    claimedById?: string | null;
  }
) {
  // Build the update object only with provided fields
  const giftUpdate: Record<string, unknown> = {};

  if (updates.purchaserId !== undefined) {
    giftUpdate.purchaser_id = updates.purchaserId;
  }
  if (updates.isSanta !== undefined) {
    giftUpdate.is_santa = updates.isSanta;
  }
  if (updates.returnStatus !== undefined) {
    giftUpdate.return_status = updates.returnStatus;
  }
  if (updates.claimedById !== undefined) {
    giftUpdate.claimed_by_id = updates.claimedById;
    // Update status based on claimer
    if (updates.claimedById) {
      giftUpdate.status = updates.isSanta ? 'santa' : 'claimed';
    } else {
      giftUpdate.status = updates.isSanta ? 'santa' : 'available';
    }
  }

  // Update gifts if there are gift-level updates
  if (Object.keys(giftUpdate).length > 0) {
    const { error } = await supabase
      .from('gifts')
      .update(giftUpdate)
      .in('id', giftIds);

    if (error) {
      throw new Error('Error bulk updating gifts: ' + error.message);
    }
  }

  // Handle recipient updates if provided
  if (updates.recipientIds !== undefined) {
    for (const giftId of giftIds) {
      // Get existing recipients
      const { data: existingRecipients } = await supabase
        .from('gift_recipients')
        .select('profile_id')
        .eq('gift_id', giftId);

      const currentIds = existingRecipients?.map((r) => r.profile_id) ?? [];
      const newIds = updates.recipientIds;

      const toAdd = newIds.filter((id) => !currentIds.includes(id));
      const toRemove = currentIds.filter((id) => !newIds.includes(id));

      if (toRemove.length > 0) {
        await supabase
          .from('gift_recipients')
          .delete()
          .eq('gift_id', giftId)
          .in('profile_id', toRemove);
      }

      if (toAdd.length > 0) {
        await supabase.from('gift_recipients').insert(
          toAdd.map((pid) => ({
            gift_id: giftId,
            profile_id: pid,
          }))
        );
      }
    }
  }

  revalidatePath('/');
}

export async function addReconciliation(reconciliation: {
  gifterId: string;
  recipientId: string;
  purchaserId: string;
  amount: number;
  transactionType: 'iou' | 'cash' | 'check' | 'bank_transfer' | 'trade';
  notes?: string;
}) {
  const { error } = await supabase.from('reconciliations').insert({
    gifter_id: reconciliation.gifterId,
    recipient_id: reconciliation.recipientId,
    purchaser_id: reconciliation.purchaserId,
    amount: reconciliation.amount,
    transaction_type: reconciliation.transactionType,
    notes: reconciliation.notes || null,
  });

  if (error) {
    throw new Error('Error adding reconciliation: ' + error.message);
  }

  revalidatePath('/');
}
