"use client";

import React from "react";

interface PrismLogoProps {
  size?: number | string;
  className?: string;
  withText?: boolean;
  textClassName?: string;
  animated?: boolean;
  progress?: number; // 0 to 100 for loading progress
}

export const PrismLogo: React.FC<PrismLogoProps> = ({
  size = 28,
  className = "",
  withText = true,
  textClassName = "",
  animated = false,
  progress,
}) => {
  const isProgressControlled = typeof progress === "number";
  const pct = Math.min(100, Math.max(0, progress ?? 100));

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Prism Icon */}
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 90"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`w-full h-full ${animated ? "animate-prism-pulse" : ""}`}
        >
          <defs>
            {/* Prism Spectrum Gradient */}
            <linearGradient id="prismGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F43F5E" />
              <stop offset="35%" stopColor="#A855F7" />
              <stop offset="70%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>

            <linearGradient id="prismGlow" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#E11D48" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#9333EA" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#00F5D4" stopOpacity="0.8" />
            </linearGradient>

            <filter id="prismBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background subtle glow when loaded */}
          {(!isProgressControlled || pct > 70) && (
            <polygon
              points="50,10 88,78 12,78"
              fill="url(#prismGradient)"
              opacity={isProgressControlled ? (pct - 70) / 150 : "0.12"}
              className="transition-opacity duration-500"
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
                    strokeDashoffset: 230 - (230 * Math.min(pct * 1.2, 100)) / 100,
                    transition: "stroke-dashoffset 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
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
            stroke={isProgressControlled && pct > 35 ? "url(#prismGradient)" : "white"}
            strokeWidth="4"
            strokeLinecap="round"
            opacity={isProgressControlled ? Math.max(0, (pct - 20) / 30) : 0.95}
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
            stroke={isProgressControlled && pct > 55 ? "url(#prismGradient)" : "white"}
            strokeWidth="4"
            strokeLinecap="round"
            opacity={isProgressControlled ? Math.max(0, (pct - 45) / 30) : 0.95}
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
            stroke={isProgressControlled && pct > 75 ? "url(#prismGradient)" : "white"}
            strokeWidth="4"
            strokeLinecap="round"
            opacity={isProgressControlled ? Math.max(0, (pct - 70) / 30) : 0.95}
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
          className={`font-bold tracking-[0.28em] text-white uppercase text-sm leading-none ${textClassName}`}
          style={{ fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" }}
        >
          PRISM
        </span>
      )}
    </div>
  );
};
