"use client";

import React from "react";
import { Settings, Clock, Sparkles } from "lucide-react";

interface HeaderProps {
  onOpenSettings: () => void;
  botConnected?: boolean;
  activeTab: "creator" | "queue";
  onTabChange: (tab: "creator" | "queue") => void;
  pendingCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  botConnected = true,
  activeTab,
  onTabChange,
  pendingCount = 0,
}) => {
  return (
    <header className="w-full border-b border-zinc-800 bg-black/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Left Brand & Navigation Tabs */}
        <div className="flex items-center gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 bg-white rounded flex items-center justify-center text-black font-bold text-xs">
              A
            </div>
            <span className="font-semibold text-sm text-white tracking-tight">AutoAffiliate</span>
          </div>

          {/* Navigation Switcher */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
            <button
              onClick={() => onTabChange("creator")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition ${
                activeTab === "creator"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Deal Creator</span>
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
              <span>Scheduled Queue</span>
              {pendingCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-white text-black font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Right Status & Settings */}
        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-zinc-300 font-medium text-[11px]">
              {botConnected ? "Bot Connected" : "Connecting..."}
            </span>
          </div>

          {/* Settings Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition"
          >
            <Settings className="w-3.5 h-3.5 text-zinc-400" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
