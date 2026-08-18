"use client";

import React, { useState } from "react";
import { ScrapedProduct, AppSettings, SocialPlatform } from "@/types/scraper";
import {
  ExternalLink,
  DollarSign,
  Copy,
  Check,
  Layers,
  Send,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Globe,
  Pin,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { APP_TIMEZONE } from "@/lib/dateUtils";
import { getInstagramShareUrl } from "@/lib/instagram";
import { getFacebookShareUrl } from "@/lib/facebook";
import { getPinterestShareUrl } from "@/lib/pinterest";
import { getYouTubeStudioUrl } from "@/lib/youtube";

interface SocialMockupPreviewProps {
  product: ScrapedProduct | null;
  copyText: string;
  settings: AppSettings;
  finalAffiliateUrl: string;
  selectedPlatform?: SocialPlatform;
  onPlatformChange?: (platform: SocialPlatform) => void;
}

export const SocialMockupPreview: React.FC<SocialMockupPreviewProps> = ({
  product,
  copyText,
  settings,
  finalAffiliateUrl,
  selectedPlatform = "telegram",
  onPlatformChange,
}) => {
  const [activeTab, setActiveTab] = useState<"mockup" | "raw" | "meta">("mockup");
  const [currentPlatform, setCurrentPlatform] = useState<SocialPlatform>(selectedPlatform);
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  // Sync internal platform state with props
  const activePlatform = selectedPlatform || currentPlatform;

  const handlePlatformSelect = (p: SocialPlatform) => {
    setCurrentPlatform(p);
    if (onPlatformChange) {
      onPlatformChange(p);
    }
  };

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
    if (!product?.price) return "Special Deal";
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

  const getPlatformShareUrl = (): string => {
    const url = finalAffiliateUrl || product?.url || "";
    switch (activePlatform) {
      case "instagram":
        return getInstagramShareUrl();
      case "facebook":
        return getFacebookShareUrl(url, copyText);
      case "pinterest":
        return getPinterestShareUrl(url, product?.image, copyText || product?.title);
      case "youtube":
        return getYouTubeStudioUrl(settings.youtubeChannelId);
      case "telegram":
      default:
        return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(copyText)}`;
    }
  };

  if (!product) {
    return (
      <div className="h-full min-h-[460px] rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 p-8 flex flex-col items-center justify-center text-center space-y-3 animate-fade-in-scale">
        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 animate-float-subtle">
          <Layers className="w-5 h-5" />
        </div>
        <div className="space-y-1 max-w-xs">
          <p className="text-sm font-medium text-white font-heading">Multi-Platform Post Preview</p>
          <p className="text-xs text-zinc-500">
            Paste a product link on the left to extract metadata and view real-time rendering across Telegram, Instagram, Facebook, Pinterest, and YouTube.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden flex flex-col shadow-xl interactive-card animate-fade-in-scale">
      {/* Top Bar: Platform Selector & View Mode Switcher */}
      <div className="px-4 py-3 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2 bg-black text-xs">
        {/* Platform Selector Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: "telegram", label: "Telegram", icon: Send, color: "text-sky-400" },
              { id: "instagram", label: "Instagram", icon: Heart, color: "text-pink-400" },
              { id: "facebook", label: "Facebook", icon: Globe, color: "text-blue-400" },
              { id: "pinterest", label: "Pinterest", icon: Pin, color: "text-red-400" },
              { id: "youtube", label: "YouTube", icon: Sparkles, color: "text-red-500" },
            ] as const
          ).map((p) => {
            const Icon = p.icon;
            const isSelected = activePlatform === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handlePlatformSelect(p.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 active:scale-95 ${
                  isSelected
                    ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                <Icon className={`w-3 h-3 ${p.color}`} />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("mockup")}
            className={`px-2.5 py-1 rounded text-[11px] transition-all duration-150 active:scale-95 ${
              activeTab === "mockup"
                ? "bg-zinc-800 text-white font-medium shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Mockup
          </button>
          <button
            onClick={() => setActiveTab("raw")}
            className={`px-2.5 py-1 rounded text-[11px] transition-all duration-150 active:scale-95 ${
              activeTab === "raw"
                ? "bg-zinc-800 text-white font-medium shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Raw Copy
          </button>
          <button
            onClick={() => setActiveTab("meta")}
            className={`px-2.5 py-1 rounded text-[11px] transition-all duration-150 active:scale-95 ${
              activeTab === "meta"
                ? "bg-zinc-800 text-white font-medium shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Meta
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {activeTab === "mockup" && (
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4 bg-black/40 animate-fade-in-up">
          {/* 1. TELEGRAM MOCKUP */}
          {activePlatform === "telegram" && (
            <div className="w-full rounded-xl border border-zinc-800 bg-[#17212b] overflow-hidden text-white shadow-2xl transition-all duration-200 hover:border-zinc-700">
              {/* Telegram Channel Header */}
              <div className="px-4 py-3 border-b border-white/5 bg-[#202b36] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-sky-600/30 border border-sky-500/40 flex items-center justify-center text-xs font-bold text-sky-400 shadow">
                    {settings.telegramChatId ? settings.telegramChatId.replace("@", "").charAt(0).toUpperCase() : "P"}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white font-heading">
                        {settings.telegramChatId || "@PrismDeals"}
                      </span>
                      <span className="text-[10px] px-1 py-0.2 rounded bg-zinc-700 text-zinc-300 font-medium">
                        channel
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400">Telegram Deal Alert</span>
                  </div>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">{formattedTime}</span>
              </div>

              {/* Photo */}
              <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden border-b border-white/5 group/img">
                {!imageError && product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover/img:scale-105"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <span className="text-xs text-zinc-500">Image not available</span>
                )}

                {product.price && (
                  <div className="absolute bottom-3 left-3 px-3 py-1 rounded-md bg-black/85 backdrop-blur-md border border-white/10 text-white font-bold text-xs flex items-center gap-1 shadow-lg">
                    <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{formatPriceDisplay()}</span>
                  </div>
                )}

                <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-medium text-zinc-300 font-mono">
                  {product.siteName}
                </div>
              </div>

              {/* Telegram Caption */}
              <div className="p-4 space-y-3">
                <div
                  className="text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed select-text"
                  dangerouslySetInnerHTML={{
                    __html: copyText || "<i>Generated Telegram deal copy will appear here...</i>",
                  }}
                />

                <div className="pt-2">
                  <a
                    href={finalAffiliateUrl || product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-lg bg-[#2b5278] hover:bg-[#33618d] text-white font-medium text-xs flex items-center justify-center gap-2 transition-all duration-150 active:scale-98 shadow"
                  >
                    <span>Buy on {product.siteName}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-300" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* 2. INSTAGRAM MOCKUP */}
          {activePlatform === "instagram" && (
            <div className="w-full max-w-md mx-auto rounded-xl border border-zinc-800 bg-black text-white shadow-2xl overflow-hidden transition-all duration-200 hover:border-zinc-700">
              {/* Instagram Profile Header */}
              <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-900 bg-zinc-950">
                <div className="flex items-center gap-2.5">
                  <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600">
                    <div className="w-8 h-8 rounded-full bg-black p-0.5 flex items-center justify-center">
                      <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white">
                        P
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white">prism.deals</span>
                      <span className="w-3 h-3 rounded-full bg-blue-500 text-white flex items-center justify-center text-[8px] font-bold">
                        ✓
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400">{product.siteName} • Sponsored</span>
                  </div>
                </div>

                <span className="text-zinc-500 text-sm tracking-widest font-bold">•••</span>
              </div>

              {/* Photo Area */}
              <div className="relative aspect-square w-full bg-zinc-900 flex items-center justify-center overflow-hidden group/ig">
                {!imageError && product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-contain p-3 transition-transform duration-300 group-ig:scale-105"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <span className="text-xs text-zinc-500">Image not available</span>
                )}

                {/* Price Sticker Overlay */}
                {product.price && (
                  <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-white font-bold text-xs flex items-center gap-1.5 shadow-xl">
                    <ShoppingBag className="w-3.5 h-3.5 text-pink-400" />
                    <span>{formatPriceDisplay()}</span>
                  </div>
                )}
              </div>

              {/* Instagram Action Icons */}
              <div className="p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-zinc-300">
                    <button
                      onClick={() => setLiked(!liked)}
                      className={`transition active:scale-125 ${liked ? "text-rose-500 fill-rose-500" : "hover:text-white"}`}
                    >
                      <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
                    </button>
                    <button className="hover:text-white transition active:scale-110">
                      <MessageCircle className="w-5 h-5" />
                    </button>
                    <button className="hover:text-white transition active:scale-110">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                  <button
                    onClick={() => setBookmarked(!bookmarked)}
                    className={`transition active:scale-125 ${bookmarked ? "text-white fill-white" : "text-zinc-300 hover:text-white"}`}
                  >
                    <Bookmark className={`w-5 h-5 ${bookmarked ? "fill-current" : ""}`} />
                  </button>
                </div>

                {/* Likes count */}
                <p className="text-[11px] font-semibold text-zinc-200">
                  {liked ? "1,430 likes" : "1,429 likes"}
                </p>

                {/* Instagram Caption */}
                <div className="text-xs text-zinc-200 leading-relaxed space-y-1">
                  <span className="font-semibold text-white mr-1.5">prism.deals</span>
                  <div className="whitespace-pre-wrap select-text text-zinc-300 text-xs">
                    {copyText || "AI Instagram caption will appear here..."}
                  </div>
                </div>

                {/* Link in bio banner */}
                <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="text-pink-400 font-medium">🔗 Link in Bio & Stories</span>
                  <span className="font-mono text-[10px] text-zinc-500">{formattedTime}</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. FACEBOOK MOCKUP */}
          {activePlatform === "facebook" && (
            <div className="w-full rounded-xl border border-zinc-800 bg-[#242526] text-white shadow-2xl overflow-hidden transition-all duration-200 hover:border-zinc-700">
              {/* Facebook Page Header */}
              <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-sm shadow">
                    P
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white">Prism Deals & Discounts</span>
                      <span className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] font-bold">
                        ✓
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                      <span>Just now</span>
                      <span>&bull;</span>
                      <Globe className="w-3 h-3 text-zinc-400" />
                    </div>
                  </div>
                </div>
                <span className="text-zinc-500 text-sm tracking-widest font-bold">•••</span>
              </div>

              {/* Facebook Post Caption */}
              <div className="p-4 text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed select-text">
                {copyText || "AI Facebook deal copy will appear here..."}
              </div>

              {/* Facebook OpenGraph Rich Link Preview Card */}
              <div className="border-t border-b border-white/10 bg-[#18191a] overflow-hidden group/fb">
                {/* Preview Image */}
                <div className="relative aspect-[1.91/1] w-full bg-black flex items-center justify-center overflow-hidden">
                  {!imageError && product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-contain p-2 transition-transform duration-300 group-fb:scale-105"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <span className="text-xs text-zinc-500">Image</span>
                  )}
                  {product.price && (
                    <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-black/90 text-white text-xs font-bold border border-white/10">
                      {formatPriceDisplay()}
                    </div>
                  )}
                </div>

                {/* Link Card Footer */}
                <div className="p-3 bg-[#3a3b3c]/50 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <span className="text-[10px] uppercase font-mono text-zinc-400 truncate block">
                      {product.siteName.toUpperCase()}.COM
                    </span>
                    <span className="text-xs font-semibold text-white truncate block">
                      {product.title}
                    </span>
                    <span className="text-[11px] text-zinc-400 line-clamp-1">
                      {product.description || "Click to see price and details."}
                    </span>
                  </div>

                  <a
                    href={finalAffiliateUrl || product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded bg-[#4e4f50] hover:bg-[#5e5f60] text-white text-xs font-medium shrink-0 flex items-center gap-1 transition active:scale-95"
                  >
                    <span>Shop Now</span>
                    <ExternalLink className="w-3 h-3 text-zinc-300" />
                  </a>
                </div>
              </div>

              {/* Engagement Reaction Bar */}
              <div className="px-4 py-2.5 flex items-center justify-between text-[11px] text-zinc-400 border-b border-white/5">
                <div className="flex items-center gap-1">
                  <span className="flex -space-x-1">
                    <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[9px] text-white">👍</span>
                    <span className="w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center text-[9px] text-white">❤️</span>
                  </span>
                  <span className="ml-1 text-zinc-300">348</span>
                </div>
                <span>42 comments &bull; 18 shares</span>
              </div>
            </div>
          )}

          {/* 4. PINTEREST MOCKUP */}
          {activePlatform === "pinterest" && (
            <div className="w-full max-w-sm mx-auto rounded-2xl border border-zinc-800 bg-zinc-950 text-white shadow-2xl overflow-hidden transition-all duration-200 hover:border-zinc-700">
              {/* Pin Image Container */}
              <div className="relative aspect-[3/4] w-full bg-zinc-900 flex items-center justify-center overflow-hidden group/pin">
                {!imageError && product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-contain p-4 transition-transform duration-300 group-pin:scale-105"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <span className="text-xs text-zinc-500">Image</span>
                )}

                {/* Save Pin Button Overlay */}
                <div className="absolute top-3 right-3">
                  <a
                    href={finalAffiliateUrl || product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg transition active:scale-95"
                  >
                    Save
                  </a>
                </div>

                {/* Store Link Chip */}
                <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg">
                  <span>{product.siteName}</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                </div>
              </div>

              {/* Pin Content Details */}
              <div className="p-4 space-y-2.5">
                <h3 className="text-sm font-bold text-white font-heading leading-tight">
                  {product.title}
                </h3>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-white font-mono">
                    {formatPriceDisplay()}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                    Verified Deal
                  </span>
                </div>

                <div className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed line-clamp-4 select-text">
                  {copyText || "AI Pinterest Pin description will appear here..."}
                </div>

                {/* Creator Footer */}
                <div className="pt-2 border-t border-zinc-900 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-[10px] font-bold text-white">
                    P
                  </div>
                  <span className="text-xs font-medium text-zinc-300">Affiliate Deals Hub</span>
                </div>
              </div>
            </div>
          )}

          {/* 5. YOUTUBE MOCKUP */}
          {activePlatform === "youtube" && (
            <div className="w-full rounded-xl border border-zinc-800 bg-[#0f0f0f] text-white shadow-2xl overflow-hidden transition-all duration-200 hover:border-zinc-700">
              {/* YouTube Community Post Header */}
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center font-bold text-white text-sm shadow">
                    ▶
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white">Prism Tech & Deals</span>
                      <span className="w-3.5 h-3.5 rounded-full bg-zinc-700 text-zinc-300 flex items-center justify-center text-[8px] font-bold">
                        ✓
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400">Community Deal Post &bull; 2 hours ago</span>
                  </div>
                </div>
                <span className="text-zinc-500 text-sm tracking-widest font-bold">•••</span>
              </div>

              {/* YouTube Post Body */}
              <div className="p-4 space-y-3">
                <div className="text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed select-text font-sans">
                  {copyText || "AI YouTube Community post & description will appear here..."}
                </div>

                {/* Attached Photo */}
                <div className="relative aspect-video w-full rounded-lg bg-black border border-zinc-800 flex items-center justify-center overflow-hidden">
                  {!imageError && product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-contain p-2"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <span className="text-xs text-zinc-500">Image</span>
                  )}
                  {product.price && (
                    <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-black/90 text-white text-xs font-bold border border-zinc-700">
                      {formatPriceDisplay()}
                    </div>
                  )}
                </div>

                {/* YouTube Action Buttons */}
                <div className="pt-2 flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1.5 hover:text-white transition">
                      <ThumbsUp className="w-4 h-4" />
                      <span>852</span>
                    </button>
                    <button className="hover:text-white transition">
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                    <button className="hover:text-white transition">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-[11px] text-zinc-500">48 comments</span>
                </div>

                {/* Simulated Pinned Comment */}
                <div className="mt-3 p-3 rounded-lg bg-zinc-900/70 border border-zinc-800 space-y-1">
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
                    <Pin className="w-3 h-3 text-red-500" />
                    <span>Pinned by Prism Tech & Deals</span>
                  </div>
                  <p className="text-xs text-zinc-200">
                    🔥 Direct Deal Link:{" "}
                    <a
                      href={finalAffiliateUrl || product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:underline font-mono break-all"
                    >
                      {finalAffiliateUrl || product.url}
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick 1-Click Platform Intent Launcher */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-900">
            <div className="text-[11px] text-zinc-400">
              <span>Selected Platform: </span>
              <strong className="text-white capitalize">{activePlatform}</strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyRaw}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs flex items-center gap-1.5 transition active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                <span>{copied ? "Copied" : "Copy Copy"}</span>
              </button>

              <a
                href={getPlatformShareUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              >
                <span>Launch on {activePlatform.toUpperCase()}</span>
                <ExternalLink className="w-3.5 h-3.5 text-black" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Raw Text */}
      {activeTab === "raw" && (
        <div className="p-4 flex-1 space-y-2 font-mono text-xs animate-fade-in-up">
          <div className="flex items-center justify-between text-zinc-400 pb-1">
            <span>Raw Copy ({activePlatform})</span>
            <button
              onClick={handleCopyRaw}
              className="flex items-center gap-1 text-zinc-300 hover:text-white px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white animate-bounce" style={{ animationIterationCount: 2 }} />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Copy Text</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-3.5 rounded-lg bg-black border border-zinc-800 text-zinc-300 text-[11px] whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
            {copyText}
          </pre>
        </div>
      )}

      {/* Tab: Metadata */}
      {activeTab === "meta" && (
        <div className="p-4 flex-1 animate-fade-in-up">
          <table className="w-full text-left text-xs">
            <tbody className="divide-y divide-zinc-800">
              <tr>
                <td className="py-2 px-3 text-zinc-500 font-mono w-28">platform</td>
                <td className="py-2 px-3 text-white capitalize">{activePlatform}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-zinc-500 font-mono">title</td>
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
