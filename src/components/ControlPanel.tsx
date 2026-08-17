"use client";

import React, { useState } from "react";
import { CopyTone, ScrapedProduct } from "@/types/scraper";
import {
  Sparkles,
  Send,
  Calendar,
  Loader2,
  Tag,
  Globe,
  SlidersHorizontal,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import {
  getDefaultScheduleTimeKarachi,
  parseKarachiInputToIso,
} from "@/lib/dateUtils";

interface ControlPanelProps {
  url: string;
  setUrl: (val: string) => void;
  affiliateTag: string;
  setAffiliateTag: (val: string) => void;
  tone: CopyTone;
  setTone: (val: CopyTone) => void;
  copyText: string;
  setCopyText: (val: string) => void;
  onScrapeAndGenerate: () => Promise<void>;
  onPublishTelegram: () => Promise<void>;
  onSchedulePost: (scheduledTime: string) => Promise<void>;
  isScraping: boolean;
  isGenerating: boolean;
  isPublishing: boolean;
  isScheduling: boolean;
  product: ScrapedProduct | null;
  publishStatus: { success?: boolean; message?: string } | null;
  error?: string | null;
}

const TONE_OPTIONS: { id: CopyTone; label: string; description: string }[] = [
  {
    id: "urgent",
    label: "🚨 Urgent Deal Alert",
    description: "High-energy, FOMO & price drop emphasis",
  },
  {
    id: "features",
    label: "💡 Feature vs. Benefit",
    description: "Value breakdown & practical utility",
  },
  {
    id: "minimal",
    label: "⚡️ Short & Minimalist",
    description: "Ultra-crisp 2-3 line essential deal snippet",
  },
  {
    id: "story",
    label: "⭐️ Story Review",
    description: "Authentic enthusiast & micro-review angle",
  },
];

const PRESETS = [
  { name: "Amazon", url: "https://www.amazon.com/dp/B08N5WRWNW" },
  { name: "Apple", url: "https://www.apple.com/shop/buy-iphone/iphone-16-pro" },
  { name: "Nike", url: "https://www.nike.com/t/air-force-1-07-mens-shoes-jBrhbr/CW2288-111" },
  { name: "AliExpress", url: "https://www.aliexpress.com/item/1005006123456789.html" },
];

function detectStore(urlStr: string): string | null {
  if (!urlStr) return null;
  const lower = urlStr.toLowerCase();
  if (lower.includes("amazon.")) return "Amazon";
  if (lower.includes("aliexpress.")) return "AliExpress";
  if (lower.includes("ebay.")) return "eBay";
  if (lower.includes("apple.")) return "Apple";
  if (lower.includes("nike.")) return "Nike";
  if (lower.includes("walmart.")) return "Walmart";
  if (lower.includes("etsy.")) return "Etsy";
  if (lower.includes("target.")) return "Target";
  if (lower.includes("shopify.") || lower.includes("myshopify.")) return "Shopify";
  try {
    const host = new URL(urlStr).hostname.replace(/^www\./, "");
    return host.split(".")[0];
  } catch {
    return null;
  }
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  url,
  setUrl,
  affiliateTag,
  setAffiliateTag,
  tone,
  setTone,
  copyText,
  setCopyText,
  onScrapeAndGenerate,
  onPublishTelegram,
  onSchedulePost,
  isScraping,
  isGenerating,
  isPublishing,
  isScheduling,
  product,
  publishStatus,
  error,
}) => {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleTime, setScheduleTime] = useState(() => getDefaultScheduleTimeKarachi(5));

  const detectedStore = detectStore(url);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      // ignore
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleTime) return;
    const isoString = parseKarachiInputToIso(scheduleTime);
    await onSchedulePost(isoString);
    setShowScheduleModal(false);
  };

  const setPresetTime = (minutesAhead: number) => {
    setScheduleTime(getDefaultScheduleTimeKarachi(minutesAhead));
  };

  return (
    <div className="w-full space-y-4">
      {/* 1. URL & Store Input Card */}
      <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#0E0E14]/80 backdrop-blur-xl space-y-3.5 shadow-lg">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-white flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-[#00E5D4]" />
            <span>Product URL</span>
          </label>
          {detectedStore && (
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/[0.06] text-white/90 border border-white/10 font-medium">
              Store: <strong className="text-white">{detectedStore}</strong>
            </span>
          )}
        </div>

        <div className="relative">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste Amazon, AliExpress, Nike, or store URL..."
            className="w-full pl-3.5 pr-16 py-3 rounded-xl bg-black/60 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]/50 transition"
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
            <button
              type="button"
              onClick={handlePaste}
              className="px-2.5 py-1.5 text-[10px] font-semibold text-zinc-300 hover:text-white bg-white/[0.08] hover:bg-white/[0.15] rounded-lg border border-white/10 transition"
            >
              Paste
            </button>
          </div>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] text-zinc-500 mr-1">Quick:</span>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setUrl(p.url)}
              className="px-2.5 py-1 rounded-lg text-[11px] bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/[0.06] transition"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Custom Affiliate Tag & Tone Selector */}
      <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#0E0E14]/80 backdrop-blur-xl grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs shadow-lg">
        {/* Affiliate Tag */}
        <div className="space-y-1.5">
          <label className="text-zinc-400 font-medium flex items-center gap-1.5 text-[11px]">
            <Tag className="w-3.5 h-3.5 text-[#E05B6C]" />
            <span>Affiliate Tracking Tag</span>
          </label>
          <input
            type="text"
            value={affiliateTag}
            onChange={(e) => setAffiliateTag(e.target.value)}
            placeholder="e.g. tag=mydeals-20"
            className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-[#8B5CF6] transition"
          />
        </div>

        {/* Tone Selector */}
        <div className="space-y-1.5">
          <label className="text-zinc-400 font-medium flex items-center gap-1.5 text-[11px]">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span>Copy Style</span>
          </label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as CopyTone)}
            className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-[#8B5CF6] transition"
          >
            {TONE_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id} className="bg-[#0E0E14] text-white">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Primary Action Button */}
      <button
        type="button"
        onClick={onScrapeAndGenerate}
        disabled={isScraping || isGenerating || !url.trim()}
        className="w-full py-3.5 rounded-xl bg-white text-black hover:bg-zinc-100 font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.25)] hover:scale-[1.01] active:scale-[0.99]"
      >
        {isScraping || isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-black" />
            <span>{isScraping ? "Scraping Product..." : "Refracting AI Copy..."}</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
            <span>{product ? "Regenerate Deal Copy" : "Scrape & Generate Copy"}</span>
          </>
        )}
      </button>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-white">Notice</p>
            <p className="text-red-300 text-[11px] mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* 4. Editable Copy Area */}
      {copyText && (
        <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#0E0E14]/80 backdrop-blur-xl space-y-3 shadow-lg">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 font-medium text-white">
              <Edit3 className="w-3.5 h-3.5 text-[#00E5D4]" />
              <span>Deal Copy</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">Live Sync</span>
          </div>

          <textarea
            value={copyText}
            onChange={(e) => setCopyText(e.target.value)}
            rows={8}
            className="w-full p-3.5 rounded-xl bg-black/60 border border-white/10 text-zinc-200 text-xs font-mono leading-relaxed focus:outline-none focus:border-[#8B5CF6] transition resize-none"
            placeholder="Generated deal copy..."
          />

          {/* Publishing & Scheduling Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={onPublishTelegram}
              disabled={isPublishing || !copyText.trim()}
              className="py-3 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#3B82F6] hover:to-[#2563EB] text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-md disabled:opacity-40"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish Now</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setScheduleTime(getDefaultScheduleTimeKarachi(5));
                setShowScheduleModal(true);
              }}
              disabled={isScheduling || !copyText.trim()}
              className="py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white border border-white/10 font-semibold text-xs flex items-center justify-center gap-2 transition disabled:opacity-40"
            >
              {isScheduling ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                  <span>Scheduling...</span>
                </>
              ) : (
                <>
                  <Calendar className="w-3.5 h-3.5 text-[#00E5D4]" />
                  <span>Schedule Release</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Publish or Schedule Status Toast */}
      {publishStatus && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 ${
            publishStatus.success
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-200"
              : "bg-amber-500/10 border-amber-500/20 text-amber-200"
          }`}
        >
          {publishStatus.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-semibold text-white">{publishStatus.success ? "Success" : "Notice"}</p>
            <p className="text-zinc-300 text-[11px] mt-0.5">{publishStatus.message}</p>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0E0E14] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#00E5D4]" />
                <h3 className="text-sm font-semibold text-white">Schedule Deal Release</h3>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-zinc-500 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="text-zinc-400 font-medium">Release Time</label>
                <input
                  type="datetime-local"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-[#8B5CF6]"
                />

                {/* Quick Time Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-zinc-500 mr-0.5">Quick:</span>
                  <button
                    type="button"
                    onClick={() => setPresetTime(5)}
                    className="px-2.5 py-1 rounded-lg text-[10px] bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white border border-white/[0.06] transition"
                  >
                    +5 min
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetTime(15)}
                    className="px-2.5 py-1 rounded-lg text-[10px] bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white border border-white/[0.06] transition"
                  >
                    +15 min
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetTime(60)}
                    className="px-2.5 py-1 rounded-lg text-[10px] bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white border border-white/[0.06] transition"
                  >
                    +1 hour
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetTime(180)}
                    className="px-2.5 py-1 rounded-lg text-[10px] bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white border border-white/[0.06] transition"
                  >
                    +3 hours
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.06] text-zinc-300 text-xs hover:bg-white/[0.12] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isScheduling}
                  className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-100 flex items-center gap-1.5 transition"
                >
                  {isScheduling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Add to Queue</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
