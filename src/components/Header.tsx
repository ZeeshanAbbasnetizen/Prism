"use client";

import React, { useState, useEffect } from "react";
import { Settings, Clock, Sparkles, History, Download, Monitor } from "lucide-react";
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
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsStandalone(true);
    }

    const handlePrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
        setIsStandalone(true);
      }
    } else {
      alert(
        "To install PRISM as an app on your Desktop/Taskbar:\n\n1. Look for the 'Open in app' or 'Install' icon on the right side of your browser address bar.\n2. Or click the browser 3-dots menu (⋮) -> 'Save and share' -> 'Install PRISM'."
      );
    }
  };

  return (
    <header className="w-full border-b border-zinc-800/80 bg-black/90 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Left Brand & Navigation Tabs */}
        <div className="flex items-center gap-4 sm:gap-8">
          {/* Brand Logo */}
          <div
            className="flex items-center cursor-pointer group"
            onClick={() => onTabChange("creator")}
          >
            <PrismLogo
              size={20}
              withText={true}
              textClassName="text-xs font-bold tracking-[0.24em] group-hover:text-zinc-300 transition-colors"
            />
          </div>

          {/* Navigation Switcher */}
          <nav className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800/80 text-xs">
            <button
              onClick={() => onTabChange("creator")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all duration-150 active:scale-95 ${
                activeTab === "creator"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Studio</span>
            </button>

            <button
              onClick={() => onTabChange("queue")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all duration-150 active:scale-95 ${
                activeTab === "queue"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Queue</span>
              {pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white text-black font-bold animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange("history")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all duration-150 active:scale-95 ${
                activeTab === "history"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
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
          {/* Open in App / Install App PWA Button */}
          {!isStandalone && (
            <button
              type="button"
              onClick={handleInstallApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-all duration-150 active:scale-95 shadow-sm"
              title="Open in app / Install on Desktop & Taskbar"
            >
              <Download className="w-3.5 h-3.5 text-black" />
              <span className="hidden sm:inline">Open in App</span>
              <span className="sm:hidden">Install</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-all duration-150 active:scale-95 shadow-sm"
          >
            <Settings className="w-3.5 h-3.5 text-zinc-400 transition-transform group-hover:rotate-45" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
