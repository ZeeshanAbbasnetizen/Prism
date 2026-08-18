"use client";

import React, { useEffect, useState } from "react";
import { Download, Monitor, Check } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    ) {
      setIsInstalled(true);
    }

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("[PWA] Service worker registered."))
        .catch((err) => console.warn("[PWA] Service worker registration error:", err));
    }

    // Listen for install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      setShowToast(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowToast(false);
      console.log("[PWA] App successfully installed.");
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback instruction for browsers without deferred prompt
      alert(
        "To install PRISM:\n1. Click the 'Install App' or 'Open in App' icon in your browser's address bar.\n2. Or click your browser's 3-dots menu -> 'Install PRISM' / 'Save and Share' -> 'Install app'."
      );
      return;
    }

    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === "accepted") {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowToast(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <>
      {children}

      {/* Floating Install Prompt Banner for quick 1-click Desktop/Taskbar installation */}
      {isInstallable && !isInstalled && showToast && (
        <div className="fixed bottom-5 right-5 z-50 p-4 rounded-xl border border-zinc-700 bg-zinc-950/95 backdrop-blur-md shadow-2xl flex items-center gap-3 animate-fade-in-scale max-w-sm">
          <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shrink-0 shadow">
            <Monitor className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-xs font-semibold text-white font-heading">Install PRISM Desktop App</p>
            <p className="text-[11px] text-zinc-400">
              Pin to your Taskbar &amp; Desktop for instant 1-click access.
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowToast(false)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-white transition text-xs"
            >
              ✕
            </button>
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-black" />
              <span>Install</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
