"use client";

import { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Input } from "~/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { Profile } from "~/lib/types";

interface HeaderProps {
  currentUser: string;
  setCurrentUser: (userId: string) => void;
  profiles: Profile[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isVisible?: boolean;
}

export function Header({ 
  currentUser, 
  setCurrentUser, 
  profiles, 
  searchQuery, 
  setSearchQuery,
  isVisible = true 
}: HeaderProps) {
  const currentProfile = profiles.find((p) => p.id === currentUser);
  const initials = currentProfile?.name?.charAt(0).toUpperCase() ?? "?";

  return (
    <header 
      className={`bg-primary text-primary-foreground sticky top-0 z-[200] transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      {/* Main header row */}
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Search input - takes most space */}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search gifts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 h-9 bg-background text-foreground border-0 rounded-full text-sm"
          />
        </div>

        {/* User avatar with dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 p-1 rounded-full hover:bg-primary-foreground/10 transition-colors">
              <Avatar className="h-8 w-8 border-2 border-primary-foreground/30">
                <AvatarFallback className="bg-primary-foreground text-primary text-sm font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-3 w-3 opacity-70" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {profiles.map((p) => (
              <DropdownMenuItem
                key={p.id}
                onClick={() => setCurrentUser(p.id)}
                className={currentUser === p.id ? "bg-accent" : ""}
              >
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarFallback className="text-xs">
                    {p.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {p.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
