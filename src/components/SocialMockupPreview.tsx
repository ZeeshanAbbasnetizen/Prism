"use client";

import React, { useState } from "react";
import { ScrapedProduct, AppSettings } from "@/types/scraper";
import {
  Send,
  ExternalLink,
  DollarSign,
  Copy,
  Check,
  Tag,
  Layers,
  Code,
  Sparkles,
} from "lucide-react";
import { APP_TIMEZONE, TIMEZONE_LABEL } from "@/lib/dateUtils";

interface SocialMockupPreviewProps {
  product: ScrapedProduct | null;
  copyText: string;
  settings: AppSettings;
  finalAffiliateUrl: string;
}

export const SocialMockupPreview: React.FC<SocialMockupPreviewProps> = ({
  product,
  copyText,
  settings,
  finalAffiliateUrl,
}) => {
  const [activeTab, setActiveTab] = useState<"telegram" | "html" | "fields">("telegram");
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  const channelName = settings.telegramChatId
    ? settings.telegramChatId.startsWith("@")
      ? settings.telegramChatId
      : `@${settings.telegramChatId}`
    : "@DealsChannel";

  const handleCopyRaw = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const formatPriceDisplay = () => {
    if (!product?.price) return "Price on site";
    const currency = product.currency || "";
    if (currency === "USD" || currency === "$") return `$${product.price}`;
    if (currency === "EUR" || currency === "€") return `€${product.price}`;
    if (currency === "GBP" || currency === "£") return `£${product.price}`;
    return `${currency} ${product.price}`.trim();
  };

  const formattedTimeUtc5 = new Date().toLocaleTimeString("en-US", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  });

  if (!product) {
    return (
      <div className="h-full min-h-[460px] rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 p-8 flex flex-col items-center justify-center text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
          <Layers className="w-5 h-5" />
        </div>
        <div className="space-y-1 max-w-xs">
          <p className="text-sm font-medium text-white">Live Social Mockup Preview</p>
          <p className="text-xs text-zinc-500">
            Paste a product link on the left to extract metadata and view the live Telegram post mockup in UTC+5.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden flex flex-col shadow-xl">
      {/* Header Tabs */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-black text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white tracking-tight">Live Social Preview</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
            Telegram Channel Post ({TIMEZONE_LABEL})
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("telegram")}
            className={`px-2.5 py-1 rounded transition ${
              activeTab === "telegram"
                ? "bg-zinc-800 text-white font-medium"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Mockup
          </button>
          <button
            onClick={() => setActiveTab("html")}
            className={`px-2.5 py-1 rounded transition ${
              activeTab === "html"
                ? "bg-zinc-800 text-white font-medium"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            HTML
          </button>
          <button
            onClick={() => setActiveTab("fields")}
            className={`px-2.5 py-1 rounded transition ${
              activeTab === "fields"
                ? "bg-zinc-800 text-white font-medium"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Meta
          </button>
        </div>
      </div>

      {/* Tab: Telegram Mockup */}
      {activeTab === "telegram" && (
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4 bg-black/40">
          {/* Telegram Channel Post Container */}
          <div className="w-full rounded-xl border border-zinc-800/80 bg-[#17212b] overflow-hidden text-white shadow-2xl">
            {/* Telegram Channel Header */}
            <div className="px-4 py-3 border-b border-white/5 bg-[#202b36] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow">
                  {channelName.replace("@", "").charAt(0).toUpperCase() || "D"}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-white">{channelName}</span>
                    <span className="text-[10px] px-1 py-0.1 rounded bg-blue-500/20 text-blue-300 font-medium">
                      channel
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">Sponsored Deal Alert</span>
                </div>
              </div>

              <span className="text-[10px] text-slate-400">
                {formattedTimeUtc5} ({TIMEZONE_LABEL})
              </span>
            </div>

            {/* Post Photo with Dynamic Price Badge */}
            <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden border-b border-white/5">
              {!imageError && product.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-contain p-2"
                  onError={() => setImageError(true)}
                />
              ) : (
                <span className="text-xs text-slate-500">Image not available</span>
              )}

              {/* Dynamic Price Badge Overlay */}
              {product.price && (
                <div className="absolute bottom-3 left-3 px-3 py-1 rounded-md bg-black/85 backdrop-blur-md border border-white/10 text-white font-bold text-xs flex items-center gap-1 shadow-lg">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{formatPriceDisplay()}</span>
                </div>
              )}

              {/* Store Tag */}
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-medium text-slate-300">
                {product.siteName}
              </div>
            </div>

            {/* Post Content Body */}
            <div className="p-4 space-y-3">
              <div
                className="text-xs text-slate-100 whitespace-pre-wrap leading-relaxed select-text"
                dangerouslySetInnerHTML={{
                  __html: copyText || "<i>AI generated copy will appear here...</i>",
                }}
              />

              {/* Interactive Buy Now Button Mockup */}
              <div className="pt-2">
                <a
                  href={finalAffiliateUrl || product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-lg bg-[#2b5278] hover:bg-[#33618d] text-white font-medium text-xs flex items-center justify-center gap-2 transition shadow"
                >
                  <span>🛍 Buy Now on {product.siteName}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-blue-200" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Raw HTML */}
      {activeTab === "html" && (
        <div className="p-4 flex-1 space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between text-zinc-400 pb-1">
            <span>Raw Telegram HTML Text</span>
            <button
              onClick={handleCopyRaw}
              className="flex items-center gap-1 text-zinc-300 hover:text-white transition"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-white" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-zinc-400" />
                  <span>Copy HTML</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-3.5 rounded-lg bg-black border border-zinc-800 text-zinc-300 text-[11px] whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
            {copyText}
          </pre>
        </div>
      )}

      {/* Tab: Meta Fields */}
      {activeTab === "fields" && (
        <div className="p-4 flex-1">
          <table className="w-full text-left text-xs">
            <tbody className="divide-y divide-zinc-800">
              <tr>
                <td className="py-2 px-3 text-zinc-500 font-mono w-28">title</td>
                <td className="py-2 px-3 text-white">{product.title}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-zinc-500 font-mono">price</td>
                <td className="py-2 px-3 text-zinc-300">{product.price || "null"}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-zinc-500 font-mono">store</td>
                <td className="py-2 px-3 text-zinc-300">{product.siteName}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-zinc-500 font-mono">affiliate link</td>
                <td className="py-2 px-3 text-zinc-400 break-all font-mono text-[11px]">
                  {finalAffiliateUrl}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
