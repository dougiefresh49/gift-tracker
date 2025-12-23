'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '~/lib/supabase';

export async function addGift(formData: {
  name: string;
  price: number;
  imageUrl: string;
  recipientIds: string[];
  isSanta: boolean;
}) {
  // 1. Insert Gift
  const { data: gift, error: giftError } = await supabase
    .from('gifts')
    .insert({
      name: formData.name,
      price: formData.price,
      image_url: formData.imageUrl || null,
      is_santa: formData.isSanta,
      status: formData.isSanta ? 'santa' : 'available',
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

  revalidatePath('/');
}

export async function updateGift(
  giftId: string,
  formData: {
    name: string;
    price: number;
    imageUrl: string;
    recipientIds: string[];
    isSanta: boolean;
    status: string;
  }
) {
  // 1. Update Gift Details
  const { error } = await supabase
    .from('gifts')
    .update({
      name: formData.name,
      price: formData.price,
      image_url: formData.imageUrl || null,
      is_santa: formData.isSanta,
      status: formData.status,
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
