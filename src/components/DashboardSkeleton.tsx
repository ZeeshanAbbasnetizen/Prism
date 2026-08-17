"use client";

import React from "react";

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
      {/* Left Column Skeleton */}
      <div className="lg:col-span-5 space-y-4">
        <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-950 space-y-4">
          <div className="h-4 w-28 bg-zinc-900 rounded"></div>
          <div className="h-10 w-full bg-zinc-900 rounded-lg"></div>
          <div className="h-10 w-full bg-zinc-900 rounded-lg"></div>
          <div className="h-24 w-full bg-zinc-900 rounded-lg"></div>
          <div className="h-10 w-full bg-zinc-900 rounded-lg"></div>
        </div>
      </div>

      {/* Right Column Skeleton */}
      <div className="lg:col-span-7 space-y-4">
        <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-950 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-900"></div>
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-36 bg-zinc-900 rounded"></div>
              <div className="h-3 w-20 bg-zinc-900/60 rounded"></div>
            </div>
          </div>
          <div className="aspect-video w-full rounded-lg bg-zinc-900"></div>
          <div className="space-y-2">
            <div className="h-4 w-3/4 bg-zinc-900 rounded"></div>
            <div className="h-4 w-1/2 bg-zinc-900 rounded"></div>
            <div className="h-10 w-full bg-zinc-900/60 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
