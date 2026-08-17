"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { ControlPanel } from "@/components/ControlPanel";
import { SocialMockupPreview } from "@/components/SocialMockupPreview";
import { QueueManager } from "@/components/QueueManager";
import { SettingsModal } from "@/components/SettingsModal";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
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
      const saved = localStorage.getItem("autoaffiliate_settings");
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
      localStorage.setItem("autoaffiliate_settings", JSON.stringify(newSettings));
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
      const msg = err instanceof Error ? err.message : "Publishing to Telegram failed.";
      setPublishStatus({
        success: false,
        message: msg,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // 3. Schedule Post to Local Queue Database
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
        message: `Deal scheduled successfully for ${formatInKarachi(scheduledTime)}! Added to queue.`,
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
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-white selection:text-black">
      {/* Header with Navigation Switcher */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        botConnected={true}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingCount={pendingCount}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "creator" ? (
          isScraping ? (
            <DashboardSkeleton />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Control Panel */}
              <div className="lg:col-span-5 space-y-4">
                <div className="space-y-1 pb-1">
                  <h1 className="text-xl font-bold tracking-tight text-white">Deal Control Panel</h1>
                  <p className="text-xs text-zinc-400">
                    Configure target URL, affiliate tags, and AI copywriting tone.
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
                <div className="space-y-1 pb-1">
                  <h2 className="text-xl font-bold tracking-tight text-white">Live Post Preview</h2>
                  <p className="text-xs text-zinc-400">
                    Real-time Telegram post mockup with interactive buttons in Islamabad / Karachi time (PKT).
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
            <div className="space-y-1 pb-1">
              <h1 className="text-xl font-bold tracking-tight text-white">Scheduled Publishing Queue</h1>
              <p className="text-xs text-zinc-400">
                Automated release manager in Islamabad / Karachi time (PKT).
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
      <footer className="border-t border-zinc-900 py-5 text-center text-xs text-zinc-600">
        AutoAffiliate &bull; Powered by Next.js 15, Gemini 3.6 Flash &amp; Local Queue Engine (PKT)
      </footer>
    </div>
  );
}
