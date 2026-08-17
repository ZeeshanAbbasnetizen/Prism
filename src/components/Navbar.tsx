import React from "react";

export const Navbar: React.FC = () => {
  return (
    <header className="w-full border-b border-zinc-800/80 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Wordmark */}
        <div className="flex items-center gap-2.5">
          <div className="w-4 h-4 bg-white rounded-sm"></div>
          <span className="font-semibold text-sm text-white tracking-tight">autoposter</span>
          <span className="text-zinc-500 text-xs">/ scraper</span>
        </div>

        {/* Status */}
        <div className="flex items-center gap-4 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>api ready</span>
          </div>
        </div>
      </div>
    </header>
  );
};
