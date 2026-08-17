"use client";

import React from "react";
import { Settings, Clock, Sparkles, RotateCcw } from "lucide-react";
import { PrismLogo } from "./PrismLogo";

interface HeaderProps {
  onOpenSettings: () => void;
  activeTab: "creator" | "queue";
  onTabChange: (tab: "creator" | "queue") => void;
  pendingCount?: number;
  onReplayLoading?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  activeTab,
  onTabChange,
  pendingCount = 0,
  onReplayLoading,
}) => {
  return (
    <header className="w-full border-b border-white/[0.08] bg-[#08080C]/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left Brand & Navigation Tabs */}
        <div className="flex items-center gap-6 sm:gap-8">
          {/* Brand Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onTabChange("creator")}>
            <PrismLogo size={26} withText={true} textClassName="text-sm font-extrabold" />
          </div>

          {/* Navigation Switcher */}
          <nav className="flex items-center bg-white/[0.04] p-1 rounded-xl border border-white/[0.06] text-xs">
            <button
              onClick={() => onTabChange("creator")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-all duration-200 ${
                activeTab === "creator"
                  ? "bg-white/[0.12] text-white shadow-sm border border-white/10"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00E5D4]" />
              <span>Studio</span>
            </button>
            <button
              onClick={() => onTabChange("queue")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-all duration-200 ${
                activeTab === "queue"
                  ? "bg-white/[0.12] text-white shadow-sm border border-white/10"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Queue</span>
              {pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-gradient-to-r from-[#E05B6C] to-[#8B5CF6] text-white font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {onReplayLoading && (
            <button
              type="button"
              onClick={onReplayLoading}
              title="Replay Prism intro animation"
              className="p-2 rounded-lg text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Settings Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white border border-white/10 transition"
          >
            <Settings className="w-3.5 h-3.5 text-zinc-400" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
