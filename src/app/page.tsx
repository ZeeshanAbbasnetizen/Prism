"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { ControlPanel } from "@/components/ControlPanel";
import { SocialMockupPreview } from "@/components/SocialMockupPreview";
import { QueueManager } from "@/components/QueueManager";
import { SettingsModal } from "@/components/SettingsModal";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { LoadingScreen } from "@/components/LoadingScreen";
import {
  ScrapedProduct,
  ScrapeApiResponse,
  GenerateCopyResponse,
  PublishTelegramResponse,
  QueueApiResponse,
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

  // Navigation active tab
  const [activeTab, setActiveTab] = useState<"creator" | "queue">("creator");
  const [pendingCount, setPendingCount] = useState<number>(0);

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

  // Refresh pending count
  const refreshPendingCount = async () => {
    try {
      const res = await fetch("/api/queue");
      const json: QueueApiResponse = await res.json();
      if (json.success && json.stats) {
        setPendingCount(json.stats.pending);
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
    refreshPendingCount();

    const interval = setInterval(() => {
      refreshPendingCount();
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
      refreshPendingCount();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Publishing failed.";
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
        message: `Deal scheduled successfully for ${formatInKarachi(scheduledTime)}.`,
      });
      refreshPendingCount();
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

  const finalAffiliateUrl = product
    ? appendAffiliateTag(product.url, affiliateTag || settings.defaultAffiliateTag)
    : "";

  return (
    <div className="min-h-screen bg-[#08080C] text-white flex flex-col relative selection:bg-[#8B5CF6]/30 selection:text-white">
      {/* Interactive Loading Screen */}
      {showLoading && (
        <LoadingScreen onComplete={() => setShowLoading(false)} />
      )}

      {/* Atmospheric Ambient Glow Backdrop (Matching the Prism color spectrum) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-[#E05B6C]/10 blur-[130px]" />
        <div className="absolute top-[20%] right-[5%] w-[45vw] h-[45vw] max-w-[550px] max-h-[550px] rounded-full bg-[#8B5CF6]/12 blur-[140px]" />
        <div className="absolute bottom-[10%] left-[20%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full bg-[#00E5D4]/8 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* Header */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingCount={pendingCount}
        onReplayLoading={() => setShowLoading(true)}
      />

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "creator" ? (
          isScraping ? (
            <DashboardSkeleton />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Control Panel */}
              <div className="lg:col-span-5 space-y-4">
                <div className="space-y-1">
                  <h1 className="text-xl font-bold tracking-tight text-white font-prism">Deal Studio</h1>
                  <p className="text-xs text-zinc-400">
                    Input product URL to extract metadata and refract into high-converting copy.
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
                  <h2 className="text-xl font-bold tracking-tight text-white font-prism">Post Preview</h2>
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
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight text-white font-prism">Publishing Queue</h1>
              <p className="text-xs text-zinc-400">
                Automated release manager and scheduled distribution queue.
              </p>
            </div>

            <QueueManager
              onNewDealClick={() => setActiveTab("creator")}
              onPostPublished={refreshPendingCount}
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

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-6 text-center text-xs text-zinc-500">
        <div className="flex items-center justify-center gap-3">
          <span className="font-semibold text-zinc-400">PRISM</span>
          <span>&bull;</span>
          <span>Intelligent Deal Distribution</span>
        </div>
      </footer>
    </div>
  );
}
