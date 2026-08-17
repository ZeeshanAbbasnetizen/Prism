"use client";

import React, { useState } from "react";
import { Loader2, ArrowRight, X } from "lucide-react";

interface ScraperFormProps {
  onScrape: (url: string) => Promise<void>;
  isLoading: boolean;
  error?: string | null;
}

const SAMPLE_URLS = [
  { name: "Amazon", url: "https://www.amazon.com/dp/B08N5WRWNW" },
  { name: "Apple", url: "https://www.apple.com/shop/buy-iphone/iphone-16-pro" },
  { name: "Nike", url: "https://www.nike.com/t/air-force-1-07-mens-shoes-jBrhbr/CW2288-111" },
  { name: "AliExpress", url: "https://www.aliexpress.com/item/1005006123456789.html" },
];

export const ScraperForm: React.FC<ScraperFormProps> = ({
  onScrape,
  isLoading,
  error,
}) => {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    onScrape(url.trim());
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      // ignore
    }
  };

  return (
    <div className="w-full space-y-3">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste product link (Amazon, AliExpress, Nike, Shopify, eBay)..."
            required
            className="w-full pl-3.5 pr-20 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-zinc-500 transition"
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1.5">
            {url ? (
              <button
                type="button"
                onClick={() => setUrl("")}
                className="p-1 text-zinc-500 hover:text-white transition"
                title="Clear"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePaste}
                className="px-2 py-0.5 text-[11px] font-medium text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded transition"
              >
                Paste
              </button>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="px-5 py-2.5 rounded-lg bg-white text-black hover:bg-zinc-200 text-sm font-medium flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-black" />
              <span>Scraping...</span>
            </>
          ) : (
            <>
              <span>Scrape</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Error Notice */}
      {error && (
        <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs">
          <span className="font-medium text-white">Error: </span>
          {error}
        </div>
      )}

      {/* Preset Quick Links */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-xs text-zinc-500 mr-1">Examples:</span>
        {SAMPLE_URLS.map((sample, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setUrl(sample.url);
              onScrape(sample.url);
            }}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-md text-xs bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 transition"
          >
            {sample.name}
          </button>
        ))}
      </div>
    </div>
  );
};
