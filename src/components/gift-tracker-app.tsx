'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { ImageToggleProvider } from '~/contexts/image-toggle-context';
import { Header } from '~/components/header';
import { Navigation } from '~/components/navigation';
import { StockView } from '~/components/views/stock-view';
import { MyPicksView } from '~/components/views/my-picks-view';
import { BudgetsView } from '~/components/views/budgets-view';
import { ReconciliationsView } from '~/components/views/reconciliations-view';
import { AdminView } from '~/components/views/admin-view';
import { RealtimeStatus } from '~/components/realtime-status';
import { OnboardingModal } from '~/components/onboarding-modal';
import type { Gift, Profile, Budget } from '~/lib/types';

interface GiftTrackerAppProps {
  initialProfiles: Profile[];
  initialGifts: Gift[];
  initialBudgets: Budget[];
}

const STORAGE_KEY = 'gift-tracker-user-id';
const ADMIN_USER_ID = '1e13c1e6-eea7-4739-bcfd-b0fbb9548cc3';

function GiftTrackerAppContent({
  initialProfiles: profiles,
  initialGifts: gifts,
  initialBudgets: budgets,
}: GiftTrackerAppProps) {
  const [currentUser, setCurrentUser] = useState<string>('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'browse' | 'my-claims' | 'budgets' | 'reconciliations' | 'admin'
  >('browse');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Scroll-based visibility for header/nav/filter bar
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [hasScrolledPastThreshold, setHasScrolledPastThreshold] = useState(false);

  // Handle scroll-based visibility
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    const scrollThreshold = 100; // Start hiding after scrolling 100px
    const scrollDelta = 10; // Minimum scroll distance to trigger change

    setHasScrolledPastThreshold(currentScrollY > scrollThreshold);

    if (Math.abs(currentScrollY - lastScrollY) < scrollDelta) {
      return;
    }

    if (currentScrollY > lastScrollY && currentScrollY > scrollThreshold) {
      // Scrolling down past threshold - hide bars
      setIsHeaderVisible(false);
      setIsNavVisible(false);
    } else {
      // Scrolling up - show bars
      setIsHeaderVisible(true);
      setIsNavVisible(true);
    }

    setLastScrollY(currentScrollY);
  }, [lastScrollY]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

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

  const handleUserChange = (userId: string) => {
    localStorage.setItem(STORAGE_KEY, userId);
    setCurrentUser(userId);
  };

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === currentUser),
    [profiles, currentUser]
  );

  const myClaims = useMemo(
    () => gifts.filter((g) => g.claimed_by_id === currentUser),
    [gifts, currentUser]
  );

  // Filter budgets for non-admin users
  const userBudgets = useMemo(() => {
    if (currentUser === ADMIN_USER_ID) {
      return budgets;
    }
    return budgets.filter((b) => b.gifter_id === currentUser);
  }, [budgets, currentUser]);

  return (
    <div className="min-h-screen bg-background pb-16 font-sans text-foreground relative">
      {showOnboarding && (
        <OnboardingModal
          profiles={profiles}
          budgets={budgets}
          onComplete={handleOnboardingComplete}
        />
      )}

      <Header
        currentUser={currentUser}
        setCurrentUser={handleUserChange}
        profiles={profiles}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isVisible={isHeaderVisible || !hasScrolledPastThreshold}
      />

      <main className="max-w-7xl mx-auto px-2 sm:px-4 pt-2 space-y-2">
        {activeTab === 'browse' && (
          <StockView
            gifts={gifts}
            profiles={profiles}
            currentUser={currentUser}
            activeProfile={activeProfile}
            searchQuery={searchQuery}
            isFilterBarVisible={isHeaderVisible || !hasScrolledPastThreshold}
          />
        )}
        {activeTab === 'my-claims' && (
          <MyPicksView
            gifts={myClaims}
            profiles={profiles}
            currentUser={currentUser}
            activeProfile={activeProfile}
          />
        )}
        {activeTab === 'budgets' && (
          <BudgetsView
            budgets={userBudgets}
            gifts={gifts}
            profiles={profiles}
            currentUser={currentUser}
          />
        )}
        {activeTab === 'reconciliations' && (
          <ReconciliationsView
            gifts={gifts}
            profiles={profiles}
            currentUser={currentUser}
          />
        )}
        {activeTab === 'admin' && (
          <AdminView profiles={profiles} gifts={gifts} budgets={budgets} currentUser={currentUser} />
        )}
      </main>

      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        currentUserId={currentUser}
        isVisible={isNavVisible || !hasScrolledPastThreshold}
      />
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
