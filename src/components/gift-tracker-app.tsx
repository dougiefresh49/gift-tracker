'use client';

import { useState, useMemo, useEffect } from 'react';
import { ImageToggleProvider } from '~/contexts/image-toggle-context';
import { Header } from '~/components/header';
import { Navigation } from '~/components/navigation';
import { StockView } from '~/components/views/stock-view';
import { MyPicksView } from '~/components/views/my-picks-view';
import { BudgetsView } from '~/components/views/budgets-view';
import { AdminView } from '~/components/views/admin-view';
import { RealtimeStatus } from '~/components/realtime-status';
import { ImageToggleButton } from '~/components/image-toggle-button';
import { OnboardingModal } from '~/components/onboarding-modal';
import type { Gift, Profile, Budget } from '~/lib/types';

interface GiftTrackerAppProps {
  initialProfiles: Profile[];
  initialGifts: Gift[];
  initialBudgets: Budget[];
}

const STORAGE_KEY = 'gift-tracker-user-id';

function GiftTrackerAppContent({
  initialProfiles: profiles,
  initialGifts: gifts,
  initialBudgets: budgets,
}: GiftTrackerAppProps) {
  const [currentUser, setCurrentUser] = useState<string>('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'browse' | 'my-claims' | 'budgets' | 'admin'
  >('browse');

  // Check localStorage on mount
  useEffect(() => {
    const savedUserId = localStorage.getItem(STORAGE_KEY);
    if (savedUserId && profiles.some((p) => p.id === savedUserId)) {
      setCurrentUser(savedUserId);
    } else {
      setShowOnboarding(true);
    }
  }, [profiles]);

  const handleOnboardingComplete = (userId: string) => {
    localStorage.setItem(STORAGE_KEY, userId);
    setCurrentUser(userId);
    setShowOnboarding(false);
    // Refresh the page to get updated data (new profile or budget)
    window.location.reload();
  };

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === currentUser),
    [profiles, currentUser]
  );

  const myClaims = useMemo(
    () => gifts.filter((g) => g.claimed_by_id === currentUser),
    [gifts, currentUser]
  );

  // Removed loading check since data is passed from server

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900 relative">
      {showOnboarding && (
        <OnboardingModal
          profiles={profiles}
          budgets={budgets}
          onComplete={handleOnboardingComplete}
        />
      )}

      <Header
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        profiles={profiles}
      />

      <main className="max-w-3xl mx-auto p-4 space-y-6">
        {activeTab === 'browse' && (
          <StockView
            gifts={gifts}
            profiles={profiles}
            currentUser={currentUser}
            activeProfile={activeProfile}
          />
        )}
        {activeTab === 'my-claims' && (
          <MyPicksView
            gifts={myClaims}
            profiles={profiles}
            currentUser={currentUser}
          />
        )}
        {activeTab === 'budgets' && (
          <BudgetsView
            budgets={budgets}
            gifts={gifts}
            profiles={profiles}
            currentUser={currentUser}
          />
        )}
        {activeTab === 'admin' && (
          <AdminView profiles={profiles} gifts={gifts} budgets={budgets} />
        )}
      </main>

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <ImageToggleButton />
      <RealtimeStatus />
    </div>
  );
}

export function GiftTrackerApp(props: GiftTrackerAppProps) {
  return (
    <ImageToggleProvider>
      <GiftTrackerAppContent {...props} />
    </ImageToggleProvider>
  );
}
