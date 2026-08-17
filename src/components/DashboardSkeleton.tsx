"use client";

import React from "react";

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
      {/* Left Column Skeleton */}
      <div className="lg:col-span-5 space-y-4">
        <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0E0E14]/80 space-y-4">
          <div className="h-4 w-28 bg-white/[0.06] rounded"></div>
          <div className="h-11 w-full bg-white/[0.06] rounded-xl"></div>
          <div className="h-11 w-full bg-white/[0.06] rounded-xl"></div>
          <div className="h-28 w-full bg-white/[0.06] rounded-xl"></div>
          <div className="h-11 w-full bg-white/[0.06] rounded-xl"></div>
        </div>
      </div>

      {/* Right Column Skeleton */}
      <div className="lg:col-span-7 space-y-4">
        <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0E0E14]/80 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/[0.06]"></div>
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-36 bg-white/[0.06] rounded"></div>
              <div className="h-3 w-20 bg-white/[0.04] rounded"></div>
            </div>
          </div>
          <div className="aspect-video w-full rounded-xl bg-white/[0.06]"></div>
          <div className="space-y-2">
            <div className="h-4 w-3/4 bg-white/[0.06] rounded"></div>
            <div className="h-4 w-1/2 bg-white/[0.06] rounded"></div>
            <div className="h-12 w-full bg-white/[0.04] rounded-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
