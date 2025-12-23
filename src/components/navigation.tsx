"use client";

import {
  LayoutDashboard,
  UserCheck,
  PieChart,
  Settings,
  Receipt,
} from "lucide-react";

type TabType = "browse" | "my-claims" | "budgets" | "reconciliations" | "admin";

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  return (
    <nav className="fixed bottom-0 w-full bg-white border-t p-2 flex justify-around text-[10px] font-bold text-slate-400 z-[200]">
      <button
        onClick={() => setActiveTab("browse")}
        className={`flex flex-col items-center p-2 ${
          activeTab === "browse" ? "text-red-600" : ""
        }`}
      >
        <LayoutDashboard size={20} /> Stock
      </button>
      <button
        onClick={() => setActiveTab("my-claims")}
        className={`flex flex-col items-center p-2 ${
          activeTab === "my-claims" ? "text-red-600" : ""
        }`}
      >
        <UserCheck size={20} /> Mine
      </button>
      <button
        onClick={() => setActiveTab("budgets")}
        className={`flex flex-col items-center p-2 ${
          activeTab === "budgets" ? "text-red-600" : ""
        }`}
      >
        <PieChart size={20} /> Budgets
      </button>
      <button
        onClick={() => setActiveTab("reconciliations")}
        className={`flex flex-col items-center p-2 ${
          activeTab === "reconciliations" ? "text-red-600" : ""
        }`}
      >
        <Receipt size={20} /> Reconcile
      </button>
      <button
        onClick={() => setActiveTab("admin")}
        className={`flex flex-col items-center p-2 ${
          activeTab === "admin" ? "text-red-600" : ""
        }`}
      >
        <Settings size={20} /> Admin
      </button>
    </nav>
  );
}

