"use client";

import {
  LayoutDashboard,
  UserCheck,
  PieChart,
  Settings,
  Receipt,
} from "lucide-react";
import { cn } from "~/lib/utils";

type TabType = "browse" | "my-claims" | "budgets" | "reconciliations" | "admin";

const ADMIN_USER_ID = "1e13c1e6-eea7-4739-bcfd-b0fbb9548cc3";

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  currentUserId: string;
  isVisible?: boolean;
}

export function Navigation({ activeTab, setActiveTab, currentUserId, isVisible = true }: NavigationProps) {
  const isAdmin = currentUserId === ADMIN_USER_ID;
  
  const tabs = [
    { id: "browse" as const, icon: LayoutDashboard, label: "Stock" },
    { id: "my-claims" as const, icon: UserCheck, label: "Mine" },
    { id: "budgets" as const, icon: PieChart, label: "Budgets" },
    { id: "reconciliations" as const, icon: Receipt, label: "Reconcile" },
    ...(isAdmin ? [{ id: "admin" as const, icon: Settings, label: "Admin" }] : []),
  ];

  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-background border-t z-[200] transition-transform duration-300",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="flex justify-around items-center py-1 max-w-lg mx-auto">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors rounded-lg min-w-[60px]",
              activeTab === id 
                ? "text-primary bg-primary/5" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
