"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { ControlPanel } from "@/components/ControlPanel";
import { SocialMockupPreview } from "@/components/SocialMockupPreview";
import { QueueManager } from "@/components/QueueManager";
import { HistoryView } from "@/components/HistoryView";
import { SettingsModal } from "@/components/SettingsModal";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { LoadingScreen } from "@/components/LoadingScreen";
import {
  ScrapedProduct,
  ScrapeApiResponse,
  GenerateCopyResponse,
  PublishSocialResponse,
  QueueApiResponse,
  HistoryApiResponse,
  ParsedHistoryItem,
  CopyTone,
  SocialPlatform,
  AppSettings,
} from "@/types/scraper";
import { appendAffiliateTag } from "@/lib/gemini";
import { formatInKarachi } from "@/lib/dateUtils";
import { getPlatformDisplayName } from "@/lib/publisher";

const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: "",
  defaultAffiliateTag: "",
  defaultPlatform: "telegram",
  telegramBotToken: "",
  telegramChatId: "",
  instagramAccessToken: "",
  instagramAccountId: "",
  facebookPageAccessToken: "",
  facebookPageId: "",
  pinterestAccessToken: "",
  pinterestBoardId: "",
  youtubeApiKey: "",
  youtubeChannelId: "",
};

export default function DashboardPage() {
  // Intro Loading Screen state
  const [showLoading, setShowLoading] = useState<boolean>(true);

  // Navigation active tab: 'creator' | 'queue' | 'history'
  const [activeTab, setActiveTab] = useState<"creator" | "queue" | "history">("creator");
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [historyCount, setHistoryCount] = useState<number>(0);

  // App state
  const [url, setUrl] = useState<string>("");
  const [affiliateTag, setAffiliateTag] = useState<string>("");
  const [tone, setTone] = useState<CopyTone>("urgent");
  const [platform, setPlatform] = useState<SocialPlatform>("telegram");
  const [copyText, setCopyText] = useState<string>("");
  const [product, setProduct] = useState<ScrapedProduct | null>(null);

  // Status state
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isScheduling, setIsScheduling] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [publishStatus, setPublishStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  // Settings state
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Refresh counts
  const refreshStats = async () => {
    try {
      const [queueRes, historyRes] = await Promise.all([
        fetch("/api/queue"),
        fetch("/api/history"),
      ]);
      const queueJson: QueueApiResponse = await queueRes.json();
      if (queueJson.success && queueJson.stats) {
        setPendingCount(queueJson.stats.pending);
      }
      const historyJson: HistoryApiResponse = await historyRes.json();
      if (historyJson.success && historyJson.data) {
        setHistoryCount(historyJson.data.length);
      }
    } catch {
      // ignore
    }
  };

  // Load client settings from localStorage on initial render & run periodic heartbeat
  useEffect(() => {
    try {
      const saved = localStorage.getItem("prism_settings") || localStorage.getItem("autoaffiliate_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings((prev) => ({ ...prev, ...parsed }));
        if (parsed.defaultAffiliateTag) {
          setAffiliateTag(parsed.defaultAffiliateTag);
        }
        if (parsed.defaultPlatform) {
          setPlatform(parsed.defaultPlatform);
        }
      }
    } catch {
      // ignore
    }
    refreshStats();

    const interval = setInterval(() => {
      refreshStats();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem("prism_settings", JSON.stringify(newSettings));
    } catch {
      // ignore
    }
    if (newSettings.defaultAffiliateTag && !affiliateTag) {
      setAffiliateTag(newSettings.defaultAffiliateTag);
    }
    if (newSettings.defaultPlatform) {
      setPlatform(newSettings.defaultPlatform);
    }
  };

  // 1. Scrape & Generate Copy Pipeline
  const handleScrapeAndGenerate = async (targetPlatform: SocialPlatform = platform) => {
    if (!url.trim()) return;

    setIsScraping(true);
    setError(null);
    setPublishStatus(null);

    let scrapedData: ScrapedProduct | null = product;

    try {
      // Step A: Scrape URL if new or not yet loaded
      if (!product || product.url !== url.trim()) {
        const scrapeRes = await fetch("/api/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim() }),
        });

        const scrapeJson: ScrapeApiResponse = await scrapeRes.json();

        if (!scrapeRes.ok || !scrapeJson.success || !scrapeJson.data) {
          throw new Error(scrapeJson.error || "Failed to extract product metadata.");
        }

        scrapedData = scrapeJson.data;
        setProduct(scrapedData);
        refreshStats();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Scraping failed.";
      setError(msg);
      setIsScraping(false);
      return;
    } finally {
      setIsScraping(false);
    }

    // Step B: Generate AI Copy for Target Platform
    if (scrapedData) {
      setIsGenerating(true);
      try {
        const copyRes = await fetch("/api/generate-copy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: scrapedData.title,
            price: scrapedData.price,
            currency: scrapedData.currency,
            description: scrapedData.description,
            url: scrapedData.url,
            siteName: scrapedData.siteName,
            affiliateTag: affiliateTag.trim() || settings.defaultAffiliateTag || undefined,
            tone,
            platform: targetPlatform,
            customApiKey: settings.geminiApiKey || undefined,
          }),
        });

        const copyJson: GenerateCopyResponse = await copyRes.json();

        if (!copyRes.ok || !copyJson.success || !copyJson.copy) {
          throw new Error(copyJson.error || "Failed to generate copy.");
        }

        setCopyText(copyJson.copy);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Copy generation failed.";
        setError(msg);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  // Switch platform and automatically re-generate tailored copy if product is loaded
  const handlePlatformChange = (newPlatform: SocialPlatform) => {
    setPlatform(newPlatform);
    if (product) {
      handleScrapeAndGenerate(newPlatform);
    }
  };

  // 2. Publish to Target Platform Immediately
  const handlePublish = async (targetPlatform: SocialPlatform = platform) => {
    if (!copyText.trim() || !product) return;

    setIsPublishing(true);
    setPublishStatus(null);

    const platformName = getPlatformDisplayName(targetPlatform);
    const finalUrl = appendAffiliateTag(product.url, affiliateTag || settings.defaultAffiliateTag);

    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: targetPlatform,
          text: copyText.trim(),
          imageUrl: product.image,
          affiliateUrl: finalUrl,
          title: product.title,
          siteName: product.siteName,
          price: product.price,
          currency: product.currency,
          // Pass any custom settings
          telegramChatId: settings.telegramChatId || undefined,
          telegramBotToken: settings.telegramBotToken || undefined,
          instagramAccessToken: settings.instagramAccessToken || undefined,
          instagramAccountId: settings.instagramAccountId || undefined,
          facebookPageAccessToken: settings.facebookPageAccessToken || undefined,
          facebookPageId: settings.facebookPageId || undefined,
          pinterestAccessToken: settings.pinterestAccessToken || undefined,
          pinterestBoardId: settings.pinterestBoardId || undefined,
          youtubeApiKey: settings.youtubeApiKey || undefined,
          youtubeChannelId: settings.youtubeChannelId || undefined,
        }),
      });

      const data: PublishSocialResponse = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Failed to publish to ${platformName}.`);
      }

      setPublishStatus({
        success: true,
        message: `Successfully posted to ${platformName}! ${data.targetTitle ? `(${data.targetTitle})` : ""}`,
      });
      refreshStats();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Publishing to ${platformName} failed.`;
      setPublishStatus({
        success: false,
        message: msg,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // 3. Schedule Post to Queue Database
  const handleSchedulePost = async (scheduledTime: string, targetPlatform: SocialPlatform = platform) => {
    if (!copyText.trim() || !product) return;

    setIsScheduling(true);
    setPublishStatus(null);

    const platformName = getPlatformDisplayName(targetPlatform);

    try {
      const finalUrl = appendAffiliateTag(product.url, affiliateTag || settings.defaultAffiliateTag);

      const res = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_title: product.title,
          image_url: product.image,
          affiliate_url: finalUrl,
          caption: copyText.trim(),
          price: product.price,
          currency: product.currency,
          site_name: product.siteName,
          platform: targetPlatform,
          scheduled_time: scheduledTime,
        }),
      });

      const data: QueueApiResponse = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Failed to schedule ${platformName} deal.`);
      }

      setPublishStatus({
        success: true,
        message: `${platformName} deal scheduled for ${formatInKarachi(scheduledTime)}.`,
      });
      refreshStats();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Scheduling failed.";
      setPublishStatus({
        success: false,
        message: msg,
      });
    } finally {
      setIsScheduling(false);
    }
  };

  // Load an item from History directly into Studio
  const handleLoadFromHistory = (item: ParsedHistoryItem) => {
    setUrl(item.url);
    if (item.affiliate_url) {
      setAffiliateTag(item.affiliate_url.split("tag=")[1] || "");
    }
    if (item.copy_generated) {
      setCopyText(item.copy_generated);
    }
    if (item.tone) {
      setTone(item.tone);
    }
    if (item.platform) {
      setPlatform(item.platform);
    }
    setProduct({
      url: item.url,
      title: item.title,
      description: item.description || "",
      image: item.image_url || "",
      images: item.image_url ? [item.image_url] : [],
      price: item.price !== null && item.price !== undefined ? item.price.toString() : null,
      currency: item.currency || "$",
      siteName: item.site_name,
      scrapedAt: item.parsed_at,
    });
    setActiveTab("creator");
  };

  const finalAffiliateUrl = product
    ? appendAffiliateTag(product.url, affiliateTag || settings.defaultAffiliateTag)
    : "";

  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-zinc-800 selection:text-white">
      {/* Minimalist Loading Screen */}
      {showLoading && (
        <LoadingScreen onComplete={() => setShowLoading(false)} />
      )}

      {/* Header */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingCount={pendingCount}
        historyCount={historyCount}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "creator" && (
          isScraping ? (
            <DashboardSkeleton />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Control Panel */}
              <div className="lg:col-span-5 space-y-4">
                <div className="space-y-1">
                  <h1 className="text-lg font-bold tracking-tight text-white font-heading">
                    Multi-Platform Deal Studio
                  </h1>
                  <p className="text-xs text-zinc-400">
                    Input product URL to extract metadata and generate tailored copy for Telegram, Instagram, Facebook, Pinterest, or YouTube.
                  </p>
                </div>

                <ControlPanel
                  url={url}
                  setUrl={setUrl}
                  affiliateTag={affiliateTag}
                  setAffiliateTag={setAffiliateTag}
                  tone={tone}
                  setTone={setTone}
                  platform={platform}
                  setPlatform={handlePlatformChange}
                  copyText={copyText}
                  setCopyText={setCopyText}
                  onScrapeAndGenerate={() => handleScrapeAndGenerate(platform)}
                  onPublish={handlePublish}
                  onSchedulePost={handleSchedulePost}
                  isScraping={isScraping}
                  isGenerating={isGenerating}
                  isPublishing={isPublishing}
                  isScheduling={isScheduling}
                  product={product}
                  publishStatus={publishStatus}
                  error={error}
                />
              </div>

              {/* Right Column: Live Social Preview */}
              <div className="lg:col-span-7 space-y-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold tracking-tight text-white font-heading">
                    Channel &amp; Feed Simulation
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Real-time visual rendering of the deal post for your selected social media channel.
                  </p>
                </div>

                <SocialMockupPreview
                  product={product}
                  copyText={copyText}
                  settings={settings}
                  finalAffiliateUrl={finalAffiliateUrl}
                  selectedPlatform={platform}
                  onPlatformChange={handlePlatformChange}
                />
              </div>
            </div>
          )
        )}

        {activeTab === "queue" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h1 className="text-lg font-bold tracking-tight text-white font-heading">
                Multi-Platform Publishing Queue
              </h1>
              <p className="text-xs text-zinc-400">
                Scheduled deals and automated distribution manager across all connected social channels.
              </p>
            </div>

            <QueueManager
              onNewDealClick={() => setActiveTab("creator")}
              onPostPublished={refreshStats}
            />
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h1 className="text-lg font-bold tracking-tight text-white font-heading">
                Parsed Products History
              </h1>
              <p className="text-xs text-zinc-400">
                Archived logs of previously scraped products, metadata, and generated copy.
              </p>
            </div>

            <HistoryView
              onLoadInStudio={handleLoadFromHistory}
              onRefreshStats={refreshStats}
            />
          </div>
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      {/* Minimalist Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-600">
        <div className="flex items-center justify-center gap-3">
          <span className="font-semibold text-zinc-400">PRISM</span>
          <span>&bull;</span>
          <span>Multi-Platform Deal Distribution Engine (Telegram, Instagram, Facebook, Pinterest, YouTube)</span>
        </div>
      </footer>
    </div>
  );
}
