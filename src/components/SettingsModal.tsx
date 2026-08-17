"use client";

import React, { useState, useEffect } from "react";
import { AppSettings } from "@/types/scraper";
import { X, Check, Key, Bot, AtSign, Tag, Sliders } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0E0E14] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-white/[0.08] flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-[#00E5D4]" />
            <h2 className="text-sm font-semibold text-white tracking-tight">
              PRISM Configuration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Gemini API Key */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 font-medium text-zinc-300">
              <Key className="w-3.5 h-3.5 text-[#E05B6C]" />
              <span>Gemini API Key</span>
            </label>
            <input
              type="password"
              value={formData.geminiApiKey}
              onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
              placeholder="AIzaSy... or AQ..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-[#8B5CF6] font-mono"
            />
          </div>

          {/* Telegram Bot Token */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 font-medium text-zinc-300">
              <Bot className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Telegram Bot Token</span>
            </label>
            <input
              type="password"
              value={formData.telegramBotToken}
              onChange={(e) => setFormData({ ...formData, telegramBotToken: e.target.value })}
              placeholder="e.g. 123456:ABC-DEF..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-[#8B5CF6] font-mono"
            />
          </div>

          {/* Telegram Chat ID */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 font-medium text-zinc-300">
              <AtSign className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span>Telegram Target Channel / Chat ID</span>
            </label>
            <input
              type="text"
              value={formData.telegramChatId}
              onChange={(e) => setFormData({ ...formData, telegramChatId: e.target.value })}
              placeholder="@MyChannel or numeric chat ID"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>

          {/* Default Affiliate Tag */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 font-medium text-zinc-300">
              <Tag className="w-3.5 h-3.5 text-[#00E5D4]" />
              <span>Default Affiliate Tag</span>
            </label>
            <input
              type="text"
              value={formData.defaultAffiliateTag}
              onChange={(e) => setFormData({ ...formData, defaultAffiliateTag: e.target.value })}
              placeholder="e.g. tag=mydeals-20"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 text-xs font-medium border border-white/10 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-white text-black hover:bg-zinc-100 text-xs font-semibold flex items-center gap-1.5 transition shadow"
            >
              {showSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-black" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
