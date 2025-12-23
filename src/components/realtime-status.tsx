'use client';

import { useEffect } from 'react';
import { supabase } from '~/lib/supabase';
import { useRouter } from 'next/navigation';

export function RealtimeStatus() {
  const router = useRouter();

  useEffect(() => {
    const channel = supabase
      .channel('db_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          console.log('Change received!', payload);
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}

