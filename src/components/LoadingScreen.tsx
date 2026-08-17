"use client";

import React, { useState, useEffect } from "react";
import { PrismLogo } from "./PrismLogo";
import { Sparkles, ArrowRight } from "lucide-react";

interface LoadingScreenProps {
  onComplete: () => void;
  minDuration?: number; // ms
}

const STAGES = [
  { threshold: 0, text: "Initializing Prism Engine..." },
  { threshold: 28, text: "Aligning Refractive Matrix..." },
  { threshold: 58, text: "Connecting AI Deal Pipeline..." },
  { threshold: 85, text: "Optimizing Distribution Channel..." },
  { threshold: 100, text: "System Ready" },
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  onComplete,
  minDuration = 1800,
}) => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isInteractiveSpeedup, setIsInteractiveSpeedup] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const duration = isInteractiveSpeedup ? 500 : minDuration;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawPct = Math.min(100, Math.floor((elapsed / duration) * 100));

      // Non-linear easing for natural feel
      const easedPct = Math.min(100, Math.round(100 * Math.sin((rawPct * Math.PI) / 200)));

      setProgress((prev) => {
        const next = Math.max(prev, rawPct);
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(() => {
              onComplete();
            }, 600);
          }, 350);
          return 100;
        }
        return next;
      });
    }, 24);

    return () => clearInterval(interval);
  }, [minDuration, isInteractiveSpeedup, onComplete]);

  // Click or keypress anywhere to fast-forward
  const handleFastForward = () => {
    setIsInteractiveSpeedup(true);
    setProgress(100);
    setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(onComplete, 500);
    }, 200);
  };

  const currentStage =
    [...STAGES].reverse().find((s) => progress >= s.threshold)?.text || "Loading...";

  return (
    <div
      onClick={handleFastForward}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#07070A] text-white cursor-pointer select-none transition-all duration-700 ${
        isFadingOut ? "opacity-0 scale-105 pointer-events-none blur-sm" : "opacity-100 scale-100"
      }`}
    >
      {/* Dynamic Aura Gradient Mesh Backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Coral Ambient Sphere (Top Left) */}
        <div className="absolute -top-[15%] -left-[15%] w-[60vw] h-[60vw] max-w-[650px] max-h-[650px] rounded-full bg-[#E05B6C]/25 blur-[120px] animate-pulse" />

        {/* Purple Violet Core (Center) */}
        <div className="absolute top-[20%] left-[25%] w-[55vw] h-[55vw] max-w-[600px] max-h-[600px] rounded-full bg-[#8B5CF6]/30 blur-[140px]" />

        {/* Cobalt Blue Glow (Right) */}
        <div className="absolute top-[10%] -right-[15%] w-[60vw] h-[60vw] max-w-[650px] max-h-[650px] rounded-full bg-[#3B82F6]/25 blur-[130px]" />

        {/* Turquoise / Cyan Burst (Bottom Right) */}
        <div className="absolute -bottom-[15%] right-[5%] w-[55vw] h-[55vw] max-w-[550px] max-h-[550px] rounded-full bg-[#00E5D4]/20 blur-[120px]" />

        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />
      </div>

      {/* Main Interactive Loading Card */}
      <div className="relative z-10 flex flex-col items-center max-w-sm w-full px-6 text-center space-y-8">
        {/* Animated Prism Graphic */}
        <div className="relative flex flex-col items-center">
          {/* Ambient Glow behind Prism */}
          <div
            className="absolute inset-0 -m-8 rounded-full bg-gradient-to-tr from-[#F43F5E] via-[#8B5CF6] to-[#00E5D4] opacity-25 blur-2xl transition-opacity duration-300"
            style={{ opacity: Math.max(0.15, progress / 160) }}
          />

          <PrismLogo
            size={96}
            withText={false}
            progress={progress}
            className="drop-shadow-[0_0_25px_rgba(139,92,246,0.5)]"
          />

          {/* Wordmark with dynamic tracking */}
          <div className="mt-5 space-y-1">
            <h1
              className="text-2xl sm:text-3xl font-black tracking-[0.35em] text-white uppercase"
              style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}
            >
              PRISM
            </h1>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/50 font-medium">
              Autonomous Deal Studio
            </p>
          </div>
        </div>

        {/* Interactive Progress Bar & Percentage */}
        <div className="w-full space-y-3">
          {/* Sleek Progress Track */}
          <div className="relative h-1.5 w-full bg-white/10 rounded-full overflow-hidden backdrop-blur-md p-[1px]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#E05B6C] via-[#8B5CF6] via-[#3B82F6] to-[#00E5D4] transition-all duration-150 ease-out shadow-[0_0_12px_rgba(139,92,246,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Telemetry info row */}
          <div className="flex items-center justify-between text-[11px] font-mono text-white/60">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <Sparkles className="w-3 h-3 text-[#00E5D4] animate-spin" style={{ animationDuration: "3s" }} />
              <span>{currentStage}</span>
            </span>
            <span className="font-semibold text-white tracking-wider">{progress}%</span>
          </div>
        </div>

        {/* Quick Skip Prompt */}
        <div className="pt-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleFastForward();
            }}
            className="px-3.5 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white/60 hover:text-white text-[11px] font-medium transition flex items-center gap-1.5 group backdrop-blur-sm"
          >
            <span>Click anywhere to enter</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
