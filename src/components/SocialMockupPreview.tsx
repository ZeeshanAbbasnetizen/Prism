"use client";

import React, { useState } from "react";
import { ScrapedProduct, AppSettings } from "@/types/scraper";
import {
  ExternalLink,
  DollarSign,
  Copy,
  Check,
  Layers,
} from "lucide-react";
import { APP_TIMEZONE } from "@/lib/dateUtils";

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

  const formattedTime = new Date().toLocaleTimeString("en-US", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  });

  if (!product) {
    return (
      <div className="h-full min-h-[480px] rounded-2xl border border-dashed border-white/[0.08] bg-[#0E0E14]/40 backdrop-blur-xl p-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400">
          <Layers className="w-6 h-6 text-[#8B5CF6]" />
        </div>
        <div className="space-y-1.5 max-w-xs">
          <p className="text-sm font-semibold text-white">Live Post Preview</p>
          <p className="text-xs text-zinc-400">
            Paste a product link on the left to extract metadata and view real-time distribution rendering.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-white/[0.08] bg-[#0E0E14]/80 backdrop-blur-xl overflow-hidden flex flex-col shadow-xl">
      {/* Header Tabs */}
      <div className="px-5 py-3.5 border-b border-white/[0.08] flex items-center justify-between bg-black/40 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white tracking-tight">Channel Rendering</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-400 border border-white/[0.06]">
            Telegram
          </span>
        </div>

        <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.06]">
          <button
            onClick={() => setActiveTab("telegram")}
            className={`px-3 py-1 rounded-lg transition ${
              activeTab === "telegram"
                ? "bg-white/[0.12] text-white font-medium shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Mockup
          </button>
          <button
            onClick={() => setActiveTab("html")}
            className={`px-3 py-1 rounded-lg transition ${
              activeTab === "html"
                ? "bg-white/[0.12] text-white font-medium shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            HTML
          </button>
          <button
            onClick={() => setActiveTab("fields")}
            className={`px-3 py-1 rounded-lg transition ${
              activeTab === "fields"
                ? "bg-white/[0.12] text-white font-medium shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Meta
          </button>
        </div>
      </div>

      {/* Tab: Telegram Mockup */}
      {activeTab === "telegram" && (
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4 bg-black/30">
          {/* Telegram Channel Post Container */}
          <div className="w-full rounded-2xl border border-white/10 bg-[#17212b] overflow-hidden text-white shadow-2xl">
            {/* Telegram Channel Header */}
            <div className="px-4 py-3 border-b border-white/5 bg-[#202b36] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-xs font-bold text-white shadow">
                  {channelName.replace("@", "").charAt(0).toUpperCase() || "D"}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white">{channelName}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-medium">
                      channel
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">Deal Alert</span>
                </div>
              </div>

              <span className="text-[10px] text-slate-400">
                {formattedTime}
              </span>
            </div>

            {/* Post Photo with Price Badge */}
            <div className="relative aspect-video w-full bg-black/80 flex items-center justify-center overflow-hidden border-b border-white/5">
              {!imageError && product.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-contain p-3"
                  onError={() => setImageError(true)}
                />
              ) : (
                <span className="text-xs text-slate-500">Image not available</span>
              )}

              {/* Dynamic Price Badge Overlay */}
              {product.price && (
                <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-black/85 backdrop-blur-md border border-white/15 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg">
                  <DollarSign className="w-3.5 h-3.5 text-[#00E5D4]" />
                  <span>{formatPriceDisplay()}</span>
                </div>
              )}

              {/* Store Tag */}
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-slate-200">
                {product.siteName}
              </div>
            </div>

            {/* Post Content Body */}
            <div className="p-4 space-y-3">
              <div
                className="text-xs text-slate-100 whitespace-pre-wrap leading-relaxed select-text font-sans"
                dangerouslySetInnerHTML={{
                  __html: copyText || "<i>Deal copy will render here...</i>",
                }}
              />

              {/* Buy Now Button Mockup */}
              <div className="pt-2">
                <a
                  href={finalAffiliateUrl || product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-[#2b5278] hover:bg-[#33618d] text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow"
                >
                  <span>Buy on {product.siteName}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-blue-200" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Raw HTML */}
      {activeTab === "html" && (
        <div className="p-5 flex-1 space-y-2.5 font-mono text-xs">
          <div className="flex items-center justify-between text-zinc-400 pb-1">
            <span>Formatted HTML Content</span>
            <button
              onClick={handleCopyRaw}
              className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Copy HTML</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-black/60 border border-white/10 text-zinc-300 text-[11px] whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
            {copyText}
          </pre>
        </div>
      )}

      {/* Tab: Meta Fields */}
      {activeTab === "fields" && (
        <div className="p-5 flex-1">
          <table className="w-full text-left text-xs">
            <tbody className="divide-y divide-white/[0.06]">
              <tr>
                <td className="py-2.5 px-3 text-zinc-500 font-mono w-28">title</td>
                <td className="py-2.5 px-3 text-white font-medium">{product.title}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-zinc-500 font-mono">price</td>
                <td className="py-2.5 px-3 text-zinc-300">{product.price || "null"}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-zinc-500 font-mono">store</td>
                <td className="py-2.5 px-3 text-zinc-300">{product.siteName}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-zinc-500 font-mono">affiliate link</td>
                <td className="py-2.5 px-3 text-zinc-400 break-all font-mono text-[11px]">
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
