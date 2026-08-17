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
  TIMEZONE_LABEL,
  TIMEZONE_SHORT,
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
    description: "Value breakdown & practical everyday utility",
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

/**
 * Detect store from URL string
 */
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
      {/* 1. URL & Store Auto-detection Card */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-white flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-zinc-400" />
            <span>Product URL</span>
          </label>
          {detectedStore && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-800 font-medium">
              Detected: <strong className="text-white">{detectedStore}</strong>
            </span>
          )}
        </div>

        <div className="relative">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste Amazon, AliExpress, Nike, or any product link..."
            className="w-full pl-3 pr-16 py-2.5 rounded-lg bg-black border border-zinc-800 text-white placeholder-zinc-600 text-xs focus:outline-none focus:border-zinc-500 transition"
          />
          <div className="absolute inset-y-0 right-0 pr-1.5 flex items-center">
            <button
              type="button"
              onClick={handlePaste}
              className="px-2 py-1 text-[10px] font-medium text-zinc-400 hover:text-white bg-zinc-900 rounded border border-zinc-800 transition"
            >
              Paste
            </button>
          </div>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap items-center gap-1 text-xs">
          <span className="text-[11px] text-zinc-500 mr-1">Quick:</span>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setUrl(p.url)}
              className="px-2 py-0.5 rounded text-[11px] bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Custom Affiliate Tag & Tone Selector Card */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Affiliate Tag */}
        <div className="space-y-1">
          <label className="text-zinc-400 font-medium flex items-center gap-1 text-[11px]">
            <Tag className="w-3 h-3 text-zinc-400" />
            <span>Affiliate Tag</span>
          </label>
          <input
            type="text"
            value={affiliateTag}
            onChange={(e) => setAffiliateTag(e.target.value)}
            placeholder="e.g. tag=mydeals-20"
            className="w-full px-2.5 py-1.5 rounded-md bg-black border border-zinc-800 text-white placeholder-zinc-600 text-xs focus:outline-none focus:border-zinc-500"
          />
        </div>

        {/* Tone Selector */}
        <div className="space-y-1">
          <label className="text-zinc-400 font-medium flex items-center gap-1 text-[11px]">
            <SlidersHorizontal className="w-3 h-3 text-zinc-400" />
            <span>Copy Tone</span>
          </label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as CopyTone)}
            className="w-full px-2.5 py-1.5 rounded-md bg-black border border-zinc-800 text-white text-xs focus:outline-none focus:border-zinc-500"
          >
            {TONE_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
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
        className="w-full py-2.5 rounded-lg bg-white text-black hover:bg-zinc-200 font-medium text-xs flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed shadow"
      >
        {isScraping || isGenerating ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
            <span>{isScraping ? "Scraping Metadata..." : "Crafting AI Copy..."}</span>
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5" />
            <span>{product ? "Regenerate AI Deal Copy" : "Scrape & Generate AI Copy"}</span>
          </>
        )}
      </button>

      {/* Error Alert */}
      {error && (
        <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-white">Notice</p>
            <p className="text-zinc-400 text-[11px]">{error}</p>
          </div>
        </div>
      )}

      {/* 4. Editable Copy Area (When copy is available) */}
      {copyText && (
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1 font-medium text-zinc-300">
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editable Deal Copy</span>
            </span>
            <span className="text-[10px] text-zinc-500">Live syncs with preview</span>
          </div>

          <textarea
            value={copyText}
            onChange={(e) => setCopyText(e.target.value)}
            rows={8}
            className="w-full p-3 rounded-lg bg-black border border-zinc-800 text-zinc-200 text-xs font-mono leading-relaxed focus:outline-none focus:border-zinc-500 transition resize-none"
            placeholder="Generated deal copy..."
          />

          {/* Publishing & Scheduling Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onPublishTelegram}
              disabled={isPublishing || !copyText.trim()}
              className="py-2.5 rounded-lg bg-white text-black hover:bg-zinc-200 font-medium text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-40"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Post to Telegram</span>
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
              className="py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 font-medium text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-40"
            >
              {isScheduling ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                  <span>Scheduling...</span>
                </>
              ) : (
                <>
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Schedule Post ({TIMEZONE_SHORT})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Publish or Schedule Status Toast */}
      {publishStatus && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
            publishStatus.success
              ? "bg-zinc-900 border-zinc-700 text-white"
              : "bg-zinc-950 border-zinc-800 text-zinc-300"
          }`}
        >
          {publishStatus.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-medium">{publishStatus.success ? "Success" : "Telegram Notice"}</p>
            <p className="text-zinc-400 text-[11px] mt-0.5">{publishStatus.message}</p>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-white" />
                <div>
                  <h3 className="text-sm font-semibold text-white">Schedule Deal Release</h3>
                  <span className="text-[10px] text-zinc-400">Timezone: Islamabad / Karachi ({TIMEZONE_LABEL})</span>
                </div>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-zinc-400 font-medium">Release Time (Karachi Time)</label>
                  <span className="text-[10px] text-zinc-500">Current PKT</span>
                </div>

                <input
                  type="datetime-local"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded bg-black border border-zinc-800 text-white text-xs focus:outline-none focus:border-zinc-500"
                />

                {/* Quick Time Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-zinc-500 mr-0.5">Quick Set:</span>
                  <button
                    type="button"
                    onClick={() => setPresetTime(2)}
                    className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800"
                  >
                    +2 mins
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetTime(15)}
                    className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800"
                  >
                    +15 mins
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetTime(60)}
                    className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800"
                  >
                    +1 hour
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetTime(180)}
                    className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800"
                  >
                    +3 hours
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-3 py-1.5 rounded bg-zinc-900 text-zinc-300 text-xs hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isScheduling}
                  className="px-4 py-1.5 rounded bg-white text-black font-medium text-xs hover:bg-zinc-200 flex items-center gap-1.5 transition"
                >
                  {isScheduling ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  <span>Add to Queue (PKT)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
