"use client";

import React from "react";

interface PrismLogoProps {
  size?: number | string;
  className?: string;
  withText?: boolean;
  textClassName?: string;
  progress?: number; // 0 to 100 for loading progress
}

export const PrismLogo: React.FC<PrismLogoProps> = ({
  size = 24,
  className = "",
  withText = true,
  textClassName = "",
  progress,
}) => {
  const isProgressControlled = typeof progress === "number";
  const pct = Math.min(100, Math.max(0, progress ?? 100));

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Prism Icon */}
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 90"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Subtle fill on completion */}
          {(!isProgressControlled || pct >= 95) && (
            <polygon
              points="50,10 88,78 12,78"
              fill="white"
              opacity="0.04"
            />
          )}

          {/* Outer Triangle */}
          <polygon
            points="50,10 88,78 12,78"
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={
              isProgressControlled
                ? {
                    strokeDasharray: 230,
                    strokeDashoffset: 230 - (230 * Math.min(pct * 1.15, 100)) / 100,
                    transition: "stroke-dashoffset 0.15s ease-out",
                  }
                : undefined
            }
          />

          {/* Internal Refraction Ray 1 (Upper) */}
          <line
            x1="34"
            y1="40"
            x2="72"
            y2="49"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            opacity={isProgressControlled ? Math.max(0, (pct - 20) / 30) : 0.9}
            style={
              isProgressControlled
                ? {
                    strokeDasharray: 45,
                    strokeDashoffset: 45 - (45 * Math.min(Math.max(0, pct - 20) * 2.5, 100)) / 100,
                    transition: "stroke-dashoffset 0.15s ease-out",
                  }
                : undefined
            }
          />

          {/* Internal Refraction Ray 2 (Middle) */}
          <line
            x1="24"
            y1="58"
            x2="80"
            y2="63"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            opacity={isProgressControlled ? Math.max(0, (pct - 45) / 30) : 0.9}
            style={
              isProgressControlled
                ? {
                    strokeDasharray: 60,
                    strokeDashoffset: 60 - (60 * Math.min(Math.max(0, pct - 45) * 2.5, 100)) / 100,
                    transition: "stroke-dashoffset 0.15s ease-out",
                  }
                : undefined
            }
          />

          {/* Internal Refraction Ray 3 (Bottom Horizontal) */}
          <line
            x1="18"
            y1="71"
            x2="82"
            y2="71"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            opacity={isProgressControlled ? Math.max(0, (pct - 70) / 30) : 0.9}
            style={
              isProgressControlled
                ? {
                    strokeDasharray: 65,
                    strokeDashoffset: 65 - (65 * Math.min(Math.max(0, pct - 70) * 3, 100)) / 100,
                    transition: "stroke-dashoffset 0.15s ease-out",
                  }
                : undefined
            }
          />
        </svg>
      </div>

      {/* Wordmark */}
      {withText && (
        <span
          className={`font-bold tracking-[0.24em] text-white uppercase text-xs leading-none ${textClassName}`}
        >
          PRISM
        </span>
      )}
    </div>
  );
};
