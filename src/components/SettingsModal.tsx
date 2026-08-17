"use client";

import React, { useState, useEffect } from "react";
import { AppSettings } from "@/types/scraper";
import { X, Check, Key, Bot, AtSign, Tag, ShieldCheck } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setShowSaved(true);
    setTimeout(() => {
      setShowSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-black">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-white" />
            <h2 className="text-sm font-semibold text-white tracking-tight">
              AutoAffiliate Settings &amp; API Keys
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-900 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Gemini API Key */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 font-medium text-zinc-300">
              <Key className="w-3.5 h-3.5 text-zinc-400" />
              <span>Gemini AI API Key</span>
            </label>
            <input
              type="password"
              value={formData.geminiApiKey}
              onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
              placeholder="Paste Gemini API Key (e.g. AIzaSy... or AQ...)"
              className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
            />
            <p className="text-[11px] text-zinc-500">
              Used for automated deal copywriting with Gemini 3.6 Flash.
            </p>
          </div>

          {/* Telegram Bot Token */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 font-medium text-zinc-300">
              <Bot className="w-3.5 h-3.5 text-zinc-400" />
              <span>Telegram Bot Token</span>
            </label>
            <input
              type="password"
              value={formData.telegramBotToken}
              onChange={(e) => setFormData({ ...formData, telegramBotToken: e.target.value })}
              placeholder="Paste token from @BotFather (e.g. 123456:ABC-DEF...)"
              className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>

          {/* Telegram Chat ID / Channel */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 font-medium text-zinc-300">
              <AtSign className="w-3.5 h-3.5 text-zinc-400" />
              <span>Telegram Target Channel / Chat ID</span>
            </label>
            <input
              type="text"
              value={formData.telegramChatId}
              onChange={(e) => setFormData({ ...formData, telegramChatId: e.target.value })}
              placeholder="@MyDealsChannel or numeric Chat ID (e.g. 7818540698)"
              className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
            <p className="text-[11px] text-zinc-500">
              Make sure your bot is added as an <b>Administrator</b> in your channel to post photos.
            </p>
          </div>

          {/* Default Affiliate Tag */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 font-medium text-zinc-300">
              <Tag className="w-3.5 h-3.5 text-zinc-400" />
              <span>Default Affiliate Tracking Tag</span>
            </label>
            <input
              type="text"
              value={formData.defaultAffiliateTag}
              onChange={(e) => setFormData({ ...formData, defaultAffiliateTag: e.target.value })}
              placeholder="e.g. tag=mydeals-20 or ref=affiliate123"
              className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
            <p className="text-[11px] text-zinc-500">
              Automatically appended to product URLs (Amazon, AliExpress, etc.).
            </p>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-medium flex items-center gap-1.5 transition"
            >
              {showSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-black" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Settings</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
