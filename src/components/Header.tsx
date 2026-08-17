"use client";

import React from "react";
import { Settings, Clock, Sparkles, History } from "lucide-react";
import { PrismLogo } from "./PrismLogo";

interface HeaderProps {
  onOpenSettings: () => void;
  activeTab: "creator" | "queue" | "history";
  onTabChange: (tab: "creator" | "queue" | "history") => void;
  pendingCount?: number;
  historyCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  activeTab,
  onTabChange,
  pendingCount = 0,
  historyCount = 0,
}) => {
  return (
    <header className="w-full border-b border-zinc-800 bg-black/90 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Left Brand & Navigation Tabs */}
        <div className="flex items-center gap-6 sm:gap-8">
          {/* Brand Logo */}
          <div
            className="flex items-center cursor-pointer"
            onClick={() => onTabChange("creator")}
          >
            <PrismLogo size={20} withText={true} textClassName="text-xs font-bold" />
          </div>

          {/* Navigation Switcher */}
          <nav className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800/80 text-xs">
            <button
              onClick={() => onTabChange("creator")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition ${
                activeTab === "creator"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Studio</span>
            </button>
            <button
              onClick={() => onTabChange("queue")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition ${
                activeTab === "queue"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Queue</span>
              {pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white text-black font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => onTabChange("history")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition ${
                activeTab === "history"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
              {historyCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
                  {historyCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Settings Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition"
          >
            <Settings className="w-3.5 h-3.5 text-zinc-400" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
