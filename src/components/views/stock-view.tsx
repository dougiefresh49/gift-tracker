'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { Filter, ArrowUpDown, Lock, Plus, Layers } from 'lucide-react';
import { GiftCard } from '~/components/gift-card';
import { AddGiftForm } from '~/components/forms/add-gift-form';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '~/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet';
import { cn } from '~/lib/utils';
import type { Gift, Profile } from '~/lib/types';

interface StockViewProps {
  gifts: Gift[];
  profiles: Profile[];
  currentUser: string;
  activeProfile: Profile | undefined;
  searchQuery: string;
  isFilterBarVisible?: boolean;
}

type FilterStatus = 'available' | 'claimed' | 'all';
type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc';
type ReturnStatusFilter = 'none' | 'all' | 'to_return' | 'returned';
type GroupByOption = 'none' | 'recipient' | 'gifter';

export function StockView({
  gifts,
  profiles,
  currentUser,
  activeProfile,
  searchQuery,
  isFilterBarVisible = true,
}: StockViewProps) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('available');
  const [filterRecipient, setFilterRecipient] = useState('all');
  const [filterGifter, setFilterGifter] = useState('all');
  const [filterReturnStatus, setFilterReturnStatus] =
    useState<ReturnStatusFilter>('none');
  const [sortOption, setSortOption] = useState<SortOption>('name-asc');
  const [groupBy, setGroupBy] = useState<GroupByOption>('none');
  const [showSanta, setShowSanta] = useState(false);
  const [showAddGift, setShowAddGift] = useState(false);

  // Track if user is dragging (for preventing clicks during scroll)
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    isDraggingRef.current = false;
    startXRef.current = e.touches[0]?.clientX ?? 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const currentX = e.touches[0]?.clientX ?? 0;
    const deltaX = Math.abs(currentX - startXRef.current);
    if (deltaX > 10) {
      isDraggingRef.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    // Reset after a small delay to allow the click event to be blocked
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 100);
  }, []);

  // Wrapper to prevent clicks during scroll
  const handleFilterClick = useCallback(<T,>(action: () => T) => {
    return () => {
      if (!isDraggingRef.current) {
        action();
      }
    };
  }, []);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterStatus !== 'available') count++;
    if (filterRecipient !== 'all') count++;
    if (filterGifter !== 'all') count++;
    if (filterReturnStatus !== 'none') count++;
    return count;
  }, [filterStatus, filterRecipient, filterGifter, filterReturnStatus]);

  const filteredGifts = useMemo(() => {
    let result = showSanta
      ? gifts.filter((g) => g.is_santa)
      : gifts.filter((g) => !g.is_santa);

    if (searchQuery) {
      result = result.filter((g) =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus === 'available') {
      result = result.filter((g) => g.status === 'available');
    } else if (filterStatus === 'claimed') {
      result = result.filter((g) => g.status === 'claimed');
    }

    if (filterRecipient !== 'all') {
      result = result.filter((g) =>
        g.gift_recipients?.some((r) => r.profile.id === filterRecipient)
      );
    }

    if (filterGifter !== 'all') {
      if (filterGifter === 'unclaimed') {
        result = result.filter((g) => !g.claimed_by_id);
      } else {
        result = result.filter((g) => g.claimed_by_id === filterGifter);
      }
    }

    // Filter by return status - default to hiding TO_RETURN and RETURNED
    if (filterReturnStatus === 'none') {
      result = result.filter((g) => (g.return_status ?? 'NONE') === 'NONE');
    } else if (filterReturnStatus === 'to_return') {
      result = result.filter(
        (g) => (g.return_status ?? 'NONE') === 'TO_RETURN'
      );
    } else if (filterReturnStatus === 'returned') {
      result = result.filter((g) => (g.return_status ?? 'NONE') === 'RETURNED');
    }

    result.sort((a, b) => {
      switch (sortOption) {
        case 'price-asc':
          return (a.price ?? 0) - (b.price ?? 0);
        case 'price-desc':
          return (b.price ?? 0) - (a.price ?? 0);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [
    gifts,
    searchQuery,
    filterStatus,
    filterRecipient,
    filterGifter,
    filterReturnStatus,
    sortOption,
    showSanta,
  ]);

  // Group gifts by recipient or gifter
  const groupedGifts = useMemo(() => {
    if (groupBy === 'none') return null;

    const groups: Record<string, { name: string; gifts: Gift[] }> = {};

    if (groupBy === 'recipient') {
      // Group by recipient - create composite groups for multi-recipient gifts
      filteredGifts.forEach((gift) => {
        const recipients = gift.gift_recipients?.map((r) => r.profile) ?? [];
        if (recipients.length === 0) {
          // Unassigned
          if (!groups['unassigned']) {
            groups['unassigned'] = { name: 'Unassigned', gifts: [] };
          }
          groups['unassigned'].gifts.push(gift);
        } else if (recipients.length === 1) {
          // Single recipient - use their ID as the key
          const recipient = recipients[0]!;
          if (!groups[recipient.id]) {
            groups[recipient.id] = { name: recipient.name, gifts: [] };
          }
          groups[recipient.id].gifts.push(gift);
        } else {
          // Multiple recipients - create a composite group
          // Sort by name for consistent key generation
          const sortedRecipients = [...recipients].sort((a, b) =>
            a.name.localeCompare(b.name)
          );
          const compositeKey = sortedRecipients.map((r) => r.id).join('+');
          const compositeName = sortedRecipients.map((r) => r.name).join(' & ');

          if (!groups[compositeKey]) {
            groups[compositeKey] = { name: compositeName, gifts: [] };
          }
          groups[compositeKey].gifts.push(gift);
        }
      });
    } else if (groupBy === 'gifter') {
      // Group by who claimed/is buying the gift
      filteredGifts.forEach((gift) => {
        const gifterId = gift.claimed_by_id;
        if (!gifterId) {
          if (!groups['unclaimed']) {
            groups['unclaimed'] = { name: 'Unclaimed', gifts: [] };
          }
          groups['unclaimed'].gifts.push(gift);
        } else {
          const gifter = profiles.find((p) => p.id === gifterId);
          if (!groups[gifterId]) {
            groups[gifterId] = { name: gifter?.name ?? 'Unknown', gifts: [] };
          }
          groups[gifterId].gifts.push(gift);
        }
      });
    }

    // Sort groups alphabetically by name, but keep special groups at the end
    return Object.entries(groups)
      .sort(([keyA, a], [keyB, b]) => {
        if (keyA === 'unassigned' || keyA === 'unclaimed') return 1;
        if (keyB === 'unassigned' || keyB === 'unclaimed') return -1;
        return a.name.localeCompare(b.name);
      })
      .map(([key, value]) => ({ id: key, ...value }));
  }, [filteredGifts, groupBy, profiles]);

  const clearFilters = () => {
    setFilterStatus('available');
    setFilterRecipient('all');
    setFilterGifter('all');
    setFilterReturnStatus('none');
  };

  const getGroupByLabel = (option: GroupByOption) => {
    switch (option) {
      case 'none':
        return 'No Grouping';
      case 'recipient':
        return 'By Recipient';
      case 'gifter':
        return 'By Gifter';
    }
  };

  const getSortLabel = (sort: SortOption) => {
    switch (sort) {
      case 'name-asc':
        return 'A → Z';
      case 'name-desc':
        return 'Z → A';
      case 'price-asc':
        return '$ Low';
      case 'price-desc':
        return '$ High';
    }
  };

  return (
    <div className="space-y-2">
      {/* Filter bar - horizontal pills */}
      <div
        className={cn(
          'sticky top-[52px] z-[150] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 -mx-4 px-4 transition-transform duration-300',
          isFilterBarVisible ? 'translate-y-0' : '-translate-y-full opacity-0'
        )}
      >
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto scrollbar-hide touch-pan-x"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex gap-1.5 items-center pb-2 min-w-max">
            {/* Stock / Santa toggle */}
            <Badge
              variant={!showSanta ? 'default' : 'outline'}
              className="cursor-pointer whitespace-nowrap text-xs py-1 select-none"
              onClick={handleFilterClick(() => setShowSanta(false))}
            >
              Stock
            </Badge>
            <Badge
              variant={showSanta ? 'default' : 'outline'}
              className="cursor-pointer whitespace-nowrap text-xs py-1 gap-1 select-none"
              onClick={handleFilterClick(() => {
                setShowSanta(true);
                setFilterStatus('all'); // Santa items need "all" to show properly
              })}
            >
              <Lock className="h-3 w-3" /> Santa
            </Badge>

            <div className="w-px h-5 bg-border mx-1" />

            {/* Status filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Badge
                  variant={
                    filterStatus !== 'available' ? 'secondary' : 'outline'
                  }
                  className="cursor-pointer whitespace-nowrap text-xs py-1 gap-1"
                >
                  {filterStatus === 'all'
                    ? 'All'
                    : filterStatus === 'claimed'
                    ? 'Claimed'
                    : 'Available'}
                </Badge>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={4}>
                <DropdownMenuItem onClick={() => setFilterStatus('available')}>
                  Available
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('claimed')}>
                  Claimed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                  All Status
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Recipient filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Badge
                  variant={filterRecipient !== 'all' ? 'secondary' : 'outline'}
                  className="cursor-pointer whitespace-nowrap text-xs py-1"
                >
                  {filterRecipient === 'all'
                    ? 'For Anyone'
                    : profiles.find((p) => p.id === filterRecipient)?.name ??
                      'For...'}
                </Badge>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={4}>
                <DropdownMenuItem onClick={() => setFilterRecipient('all')}>
                  Anyone
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {profiles.map((p) => (
                  <DropdownMenuItem
                    key={p.id}
                    onClick={() => setFilterRecipient(p.id)}
                  >
                    {p.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* More filters */}
            <Sheet>
              <SheetTrigger asChild>
                <Badge
                  variant={activeFilterCount > 0 ? 'secondary' : 'outline'}
                  className="cursor-pointer whitespace-nowrap text-xs py-1 gap-1"
                >
                  <Filter className="h-3 w-3" />
                  {activeFilterCount > 0 && <span>({activeFilterCount})</span>}
                </Badge>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="rounded-t-xl max-h-[60vh] flex flex-col pb-20"
              >
                <SheetHeader className="shrink-0">
                  <SheetTitle className="flex items-center justify-between">
                    <span>Filters</span>
                    {activeFilterCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Clear all
                      </Button>
                    )}
                  </SheetTitle>
                </SheetHeader>
                <div className="overflow-y-auto flex-1 py-4">
                  <div className="grid gap-4">
                    {/* Gifter filter */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Claimed by
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant={
                            filterGifter === 'all' ? 'default' : 'outline'
                          }
                          className="cursor-pointer"
                          onClick={() => setFilterGifter('all')}
                        >
                          Anyone
                        </Badge>
                        <Badge
                          variant={
                            filterGifter === 'unclaimed' ? 'default' : 'outline'
                          }
                          className="cursor-pointer"
                          onClick={() => setFilterGifter('unclaimed')}
                        >
                          Unclaimed
                        </Badge>
                        {profiles.map((p) => (
                          <Badge
                            key={p.id}
                            variant={
                              filterGifter === p.id ? 'default' : 'outline'
                            }
                            className="cursor-pointer"
                            onClick={() => setFilterGifter(p.id)}
                          >
                            {p.name}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Return status filter */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Return Status
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant={
                            filterReturnStatus === 'none'
                              ? 'default'
                              : 'outline'
                          }
                          className="cursor-pointer"
                          onClick={() => setFilterReturnStatus('none')}
                        >
                          Hide Returns
                        </Badge>
                        <Badge
                          variant={
                            filterReturnStatus === 'all' ? 'default' : 'outline'
                          }
                          className="cursor-pointer"
                          onClick={() => setFilterReturnStatus('all')}
                        >
                          Show All
                        </Badge>
                        <Badge
                          variant={
                            filterReturnStatus === 'to_return'
                              ? 'default'
                              : 'outline'
                          }
                          className="cursor-pointer"
                          onClick={() => setFilterReturnStatus('to_return')}
                        >
                          To Return
                        </Badge>
                        <Badge
                          variant={
                            filterReturnStatus === 'returned'
                              ? 'default'
                              : 'outline'
                          }
                          className="cursor-pointer"
                          onClick={() => setFilterReturnStatus('returned')}
                        >
                          Returned
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Badge
                  variant="outline"
                  className="cursor-pointer whitespace-nowrap text-xs py-1 gap-1"
                >
                  <ArrowUpDown className="h-3 w-3" />
                  {getSortLabel(sortOption)}
                </Badge>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={4}>
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortOption('name-asc')}>
                  Name A → Z
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption('name-desc')}>
                  Name Z → A
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption('price-asc')}>
                  Price Low → High
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption('price-desc')}>
                  Price High → Low
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Group By */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Badge
                  variant={groupBy !== 'none' ? 'secondary' : 'outline'}
                  className="cursor-pointer whitespace-nowrap text-xs py-1 gap-1"
                >
                  <Layers className="h-3 w-3" />
                  {groupBy === 'none' ? 'Group' : getGroupByLabel(groupBy)}
                </Badge>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={4}>
                <DropdownMenuLabel>Group by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setGroupBy('none')}>
                  No Grouping
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGroupBy('recipient')}>
                  By Recipient
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGroupBy('gifter')}>
                  By Gifter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Add button */}
            <Button
              size="sm"
              className="ml-auto h-7 text-xs shrink-0"
              onClick={() => setShowAddGift(true)}
            >
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </div>
        </div>
      </div>

      {/* Add gift sheet */}
      <Sheet open={showAddGift} onOpenChange={setShowAddGift}>
        <SheetContent
          side="bottom"
          className="rounded-t-xl max-h-[85vh] overflow-auto pb-20"
        >
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <span>Add New Gift</span>
            </SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <AddGiftForm
              profiles={profiles}
              currentUser={currentUser}
              onClose={() => setShowAddGift(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Results count */}
      <div className="text-xs text-muted-foreground px-1">
        {filteredGifts.length} {filteredGifts.length === 1 ? 'item' : 'items'}
        {groupBy !== 'none' &&
          groupedGifts &&
          ` in ${groupedGifts.length} ${
            groupedGifts.length === 1 ? 'group' : 'groups'
          }`}
      </div>

      {/* Gift display - grouped or flat */}
      {groupBy !== 'none' && groupedGifts ? (
        // Grouped view
        <div className="space-y-6">
          {groupedGifts.map((group) => (
            <div key={group.id}>
              {/* Group header */}
              <div className="flex items-center gap-2 mb-3 sticky top-[100px] bg-background/95 backdrop-blur py-2 px-3 -mx-2 z-[50] rounded-lg shadow-md border border-border/50">
                <h3 className="font-semibold text-base">{group.name}</h3>
                <Badge variant="secondary" className="text-xs">
                  {group.gifts.length}
                </Badge>
              </div>
              {/* Group grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {group.gifts.map((gift) => (
                  <GiftCard
                    key={`${group.id}-${gift.id}`}
                    gift={gift}
                    profiles={profiles}
                    currentUser={currentUser}
                    activeProfile={activeProfile}
                    showClaimButton={true}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Flat grid view
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
          {filteredGifts.map((gift) => (
            <GiftCard
              key={gift.id}
              gift={gift}
              profiles={profiles}
              currentUser={currentUser}
              activeProfile={activeProfile}
              showClaimButton={true}
            />
          ))}
        </div>
      )}

      {filteredGifts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No gifts found matching your filters.</p>
          {activeFilterCount > 0 && (
            <Button variant="link" onClick={clearFilters} className="mt-2">
              Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
