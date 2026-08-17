"use client";

import React, { useState, useEffect } from "react";
import { ScrapedProduct, GenerateCopyResponse, PublishTelegramResponse } from "@/types/scraper";
import {
  Send,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Settings,
  Eye,
  Edit3,
  Copy,
  Check,
} from "lucide-react";

interface CopyPublisherCardProps {
  product: ScrapedProduct;
}

export const CopyPublisherCard: React.FC<CopyPublisherCardProps> = ({ product }) => {
  const [copyText, setCopyText] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [publishStatus, setPublishStatus] = useState<{
    success?: boolean;
    message?: string;
    messageId?: number;
  } | null>(null);

  // Custom Settings
  const [chatId, setChatId] = useState<string>("");
  const [affiliateTag, setAffiliateTag] = useState<string>("");
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Auto-generate copy on first load of new product
  useEffect(() => {
    handleGenerateCopy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.url]);

  const handleGenerateCopy = async () => {
    setIsGenerating(true);
    setGenError(null);
    setPublishStatus(null);

    try {
      const res = await fetch("/api/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: product.title,
          price: product.price,
          currency: product.currency,
          description: product.description,
          url: product.url,
          siteName: product.siteName,
          affiliateTag: affiliateTag.trim() || undefined,
        }),
      });

      const data: GenerateCopyResponse = await res.json();

      if (!res.ok || !data.success || !data.copy) {
        throw new Error(data.error || "Failed to generate copy.");
      }

      setCopyText(data.copy);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate copy.";
      setGenError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublishTelegram = async () => {
    if (!copyText.trim()) return;

    setIsPublishing(true);
    setPublishStatus(null);

    try {
      const res = await fetch("/api/publish-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: copyText.trim(),
          imageUrl: product.image,
          chatId: chatId.trim() || undefined,
          parseMode: "HTML",
        }),
      });

      const data: PublishTelegramResponse = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to post to Telegram.");
      }

      setPublishStatus({
        success: true,
        message: `Successfully posted to ${data.chatTitle || "Telegram Channel"} (Message #${data.messageId})`,
        messageId: data.messageId,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to post to Telegram.";
      setPublishStatus({
        success: false,
        message: msg,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="w-full rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden space-y-0">
      {/* Header Bar */}
      <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between gap-3 bg-black">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white tracking-tight">
            AI Deal Copywriter &amp; Publisher
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
            Gemini Flash
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`px-2.5 py-1 rounded text-xs inline-flex items-center gap-1.5 transition ${
              showSettings
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800"
            }`}
          >
            <Settings className="w-3 h-3" />
            <span>Config</span>
          </button>

          <button
            type="button"
            onClick={handleGenerateCopy}
            disabled={isGenerating}
            className="px-2.5 py-1 rounded text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 inline-flex items-center gap-1.5 transition disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            <span>Regenerate</span>
          </button>
        </div>
      </div>

      {/* Settings Drawer (Collapsible) */}
      {showSettings && (
        <div className="p-4 border-b border-zinc-800 bg-black/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-zinc-400 mb-1 font-medium">
              Telegram Chat ID / Channel (@channel or -100xxx)
            </label>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="e.g. @MyDealsChannel or numeric ID"
              className="w-full px-3 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>
          <div>
            <label className="block text-zinc-400 mb-1 font-medium">
              Affiliate Tracking Tag (e.g. tag=deals-20)
            </label>
            <input
              type="text"
              value={affiliateTag}
              onChange={(e) => setAffiliateTag(e.target.value)}
              placeholder="e.g. tag=mydeals-20"
              className="w-full px-3 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>
      )}

      {/* Main Content: Editor & Live Telegram Preview */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Column 1: Editable Copy Textarea */}
        <div className="flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1 font-medium text-zinc-300">
              <Edit3 className="w-3.5 h-3.5" />
              <span>Deal Copy (HTML Formatted)</span>
            </span>
            <button
              onClick={handleCopyText}
              className="hover:text-white inline-flex items-center gap-1 transition"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-white" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <textarea
            value={copyText}
            onChange={(e) => setCopyText(e.target.value)}
            disabled={isGenerating}
            rows={10}
            className="w-full p-3.5 rounded-lg bg-black border border-zinc-800 text-zinc-200 text-xs font-mono leading-relaxed focus:outline-none focus:border-zinc-500 transition resize-none disabled:opacity-50"
            placeholder="AI generating high-converting deal copy..."
          />

          <div className="text-[11px] text-zinc-500">
            Supports Telegram HTML tags: &lt;b&gt;, &lt;i&gt;, &lt;a href=&quot;...&quot;&gt;
          </div>
        </div>

        {/* Column 2: Simulated Live Telegram Post Preview */}
        <div className="flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1 font-medium text-zinc-300">
              <Eye className="w-3.5 h-3.5" />
              <span>Telegram Message Preview</span>
            </span>
            <span className="text-[11px] text-zinc-500">How followers see it</span>
          </div>

          {/* Telegram Chat Bubble Simulation */}
          <div className="w-full rounded-lg border border-zinc-800 bg-[#17212b] p-3.5 text-white flex flex-col gap-3 min-h-[220px] max-h-[260px] overflow-y-auto">
            {/* Image Thumbnail inside bubble */}
            {product.image && (
              <div className="aspect-video w-full rounded bg-black/40 overflow-hidden border border-white/5 flex items-center justify-center shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image}
                  alt="Post Preview"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Rendered HTML caption */}
            <div
              className="text-xs text-slate-100 whitespace-pre-wrap leading-relaxed select-text"
              dangerouslySetInnerHTML={{ __html: copyText || "<i>No copy generated yet...</i>" }}
            />
          </div>

          {/* Publishing Action */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handlePublishTelegram}
              disabled={isPublishing || isGenerating || !copyText.trim()}
              className="w-full py-2.5 rounded-lg bg-white text-black hover:bg-zinc-200 font-medium text-xs flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed shadow"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                  <span>Publishing to Telegram...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Post to Telegram Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Publish Feedback Alerts */}
      {publishStatus && (
        <div
          className={`mx-5 mb-5 p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
            publishStatus.success
              ? "bg-zinc-900 border-zinc-700 text-white"
              : "bg-zinc-950 border-zinc-800 text-zinc-300"
          }`}
        >
          {publishStatus.success ? (
            <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-medium">{publishStatus.success ? "Post Published" : "Publish Notice"}</p>
            <p className="text-zinc-400 mt-0.5">{publishStatus.message}</p>
          </div>
        </div>
      )}

      {genError && (
        <div className="mx-5 mb-5 p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 text-xs">
          <span className="font-medium text-white">Generation Notice: </span>
          {genError}
        </div>
      )}
    </div>
  );
};
