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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between bg-black">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-zinc-400" />
            <h2 className="text-xs font-semibold text-white tracking-tight uppercase">
              Configuration
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
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {/* Gemini API Key */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 font-medium text-zinc-300 text-[11px]">
              <Key className="w-3 h-3 text-zinc-400" />
              <span>Gemini API Key</span>
            </label>
            <input
              type="password"
              value={formData.geminiApiKey}
              onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
              placeholder="AIzaSy... or AQ..."
              className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>

          {/* Telegram Bot Token */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 font-medium text-zinc-300 text-[11px]">
              <Bot className="w-3 h-3 text-zinc-400" />
              <span>Telegram Bot Token</span>
            </label>
            <input
              type="password"
              value={formData.telegramBotToken}
              onChange={(e) => setFormData({ ...formData, telegramBotToken: e.target.value })}
              placeholder="123456:ABC-DEF..."
              className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>

          {/* Telegram Chat ID */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 font-medium text-zinc-300 text-[11px]">
              <AtSign className="w-3 h-3 text-zinc-400" />
              <span>Telegram Channel / Chat ID</span>
            </label>
            <input
              type="text"
              value={formData.telegramChatId}
              onChange={(e) => setFormData({ ...formData, telegramChatId: e.target.value })}
              placeholder="@MyChannel or numeric chat ID"
              className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          {/* Default Affiliate Tag */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 font-medium text-zinc-300 text-[11px]">
              <Tag className="w-3 h-3 text-zinc-400" />
              <span>Default Affiliate Tag</span>
            </label>
            <input
              type="text"
              value={formData.defaultAffiliateTag}
              onChange={(e) => setFormData({ ...formData, defaultAffiliateTag: e.target.value })}
              placeholder="e.g. tag=mydeals-20"
              className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 border-t border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-medium flex items-center gap-1.5 transition shadow-sm"
            >
              {showSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-black" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
