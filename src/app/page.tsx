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
  PublishTelegramResponse,
  QueueApiResponse,
  HistoryApiResponse,
  ParsedHistoryItem,
  CopyTone,
  AppSettings,
} from "@/types/scraper";
import { appendAffiliateTag } from "@/lib/gemini";
import { formatInKarachi } from "@/lib/dateUtils";

const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: "",
  telegramBotToken: "",
  telegramChatId: "",
  defaultAffiliateTag: "",
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
        setSettings(parsed);
        if (parsed.defaultAffiliateTag) {
          setAffiliateTag(parsed.defaultAffiliateTag);
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
  };

  // 1. Scrape & Generate Copy Pipeline
  const handleScrapeAndGenerate = async () => {
    if (!url.trim()) return;

    setIsScraping(true);
    setError(null);
    setPublishStatus(null);

    let scrapedData: ScrapedProduct | null = null;

    try {
      // Step A: Scrape URL
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Scraping failed.";
      setError(msg);
      setIsScraping(false);
      return;
    } finally {
      setIsScraping(false);
    }

    // Step B: Generate AI Copy
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

  // 2. Publish to Telegram Immediately
  const handlePublishTelegram = async () => {
    if (!copyText.trim() || !product) return;

    setIsPublishing(true);
    setPublishStatus(null);

    try {
      const res = await fetch("/api/publish-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: copyText.trim(),
          imageUrl: product.image,
          chatId: settings.telegramChatId || undefined,
          botToken: settings.telegramBotToken || undefined,
          parseMode: "HTML",
        }),
      });

      const data: PublishTelegramResponse = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to publish to Telegram.");
      }

      setPublishStatus({
        success: true,
        message: `Published successfully to ${data.chatTitle || "Telegram Channel"} (Message #${data.messageId})`,
      });
      refreshStats();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Publishing to Telegram failed.";
      setPublishStatus({
        success: false,
        message: msg,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // 3. Schedule Post to Queue Database
  const handleSchedulePost = async (scheduledTime: string) => {
    if (!copyText.trim() || !product) return;

    setIsScheduling(true);
    setPublishStatus(null);

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
          scheduled_time: scheduledTime,
        }),
      });

      const data: QueueApiResponse = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to schedule deal.");
      }

      setPublishStatus({
        success: true,
        message: `Deal scheduled for ${formatInKarachi(scheduledTime)}.`,
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
                  <h1 className="text-lg font-bold tracking-tight text-white">Deal Studio</h1>
                  <p className="text-xs text-zinc-400">
                    Input product URL to extract metadata and generate deal copy.
                  </p>
                </div>

                <ControlPanel
                  url={url}
                  setUrl={setUrl}
                  affiliateTag={affiliateTag}
                  setAffiliateTag={setAffiliateTag}
                  tone={tone}
                  setTone={setTone}
                  copyText={copyText}
                  setCopyText={setCopyText}
                  onScrapeAndGenerate={handleScrapeAndGenerate}
                  onPublishTelegram={handlePublishTelegram}
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
                  <h2 className="text-lg font-bold tracking-tight text-white">Post Preview</h2>
                  <p className="text-xs text-zinc-400">
                    Real-time visual rendering of the deal message for channel distribution.
                  </p>
                </div>

                <SocialMockupPreview
                  product={product}
                  copyText={copyText}
                  settings={settings}
                  finalAffiliateUrl={finalAffiliateUrl}
                />
              </div>
            </div>
          )
        )}

        {activeTab === "queue" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h1 className="text-lg font-bold tracking-tight text-white">Publishing Queue</h1>
              <p className="text-xs text-zinc-400">
                Scheduled deals and automated distribution manager.
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
              <h1 className="text-lg font-bold tracking-tight text-white">Parsed Products History</h1>
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

      {/* Neutral Minimalist Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-600">
        <div className="flex items-center justify-center gap-3">
          <span className="font-semibold text-zinc-400">PRISM</span>
          <span>&bull;</span>
          <span>Deal Distribution Engine</span>
        </div>
      </footer>
    </div>
  );
}
