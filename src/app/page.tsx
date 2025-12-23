import { GiftTrackerApp } from '~/components/gift-tracker-app';
import { supabase } from '~/lib/supabase';
import type { Gift, Profile, Budget } from '~/lib/types';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [profilesRes, giftsRes, budgetsRes] = await Promise.all([
    supabase.from('profiles').select('*'),
    supabase.from('gifts').select('*, gift_recipients(profile:profiles(*)), gift_tags(*)'),
    supabase.from('budgets').select('*'),
  ]);

  const profiles = (profilesRes.data as Profile[]) ?? [];
  const gifts = (giftsRes.data as Gift[]) ?? [];
  const budgets = (budgetsRes.data as Budget[]) ?? [];

  return (
    <GiftTrackerApp
      initialProfiles={profiles}
      initialGifts={gifts}
      initialBudgets={budgets}
    />
  );
}
