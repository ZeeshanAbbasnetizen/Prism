"use client";

import React, { useState, useEffect } from "react";
import { PrismLogo } from "./PrismLogo";

interface LoadingScreenProps {
  onComplete: () => void;
  minDuration?: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  onComplete,
  minDuration = 1400,
}) => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / minDuration) * 100));

      setProgress(pct);
      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(onComplete, 400);
        }, 200);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [minDuration, onComplete]);

  const handleSkip = () => {
    setProgress(100);
    setIsFadingOut(true);
    setTimeout(onComplete, 200);
  };

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white cursor-pointer select-none transition-all duration-500 ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center max-w-xs w-full px-6 space-y-6 text-center">
        {/* Prism Vector Drawing */}
        <PrismLogo size={64} withText={false} progress={progress} />

        {/* Brand Name */}
        <div className="space-y-1">
          <span className="font-bold tracking-[0.3em] text-white uppercase text-sm block">
            PRISM
          </span>
          <span className="text-[10px] text-zinc-500 tracking-widest uppercase font-mono block">
            Deal Distribution Engine
          </span>
        </div>

        {/* Minimal Hairline Progress Bar */}
        <div className="w-48 space-y-2">
          <div className="h-[1px] w-full bg-zinc-900 overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-600">
            <span>READY</span>
            <span>{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
