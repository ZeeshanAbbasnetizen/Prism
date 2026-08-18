"use client";

import React, { useState, useEffect } from "react";
import { AppSettings, SocialPlatform } from "@/types/scraper";
import {
  X,
  Check,
  Key,
  Bot,
  AtSign,
  Tag,
  Sliders,
  Send,
  Heart,
  Globe,
  Pin,
  Sparkles,
} from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"general" | "telegram" | "instagram" | "facebook" | "pinterest" | "youtube">("general");
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
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between bg-black">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-zinc-400" />
            <h2 className="text-xs font-semibold text-white tracking-tight uppercase font-heading">
              Platform &amp; API Configuration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-900 transition active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-4 py-2 border-b border-zinc-800 bg-black/50 flex items-center gap-1 overflow-x-auto text-xs">
          {[
            { id: "general", label: "General", icon: Sliders },
            { id: "telegram", label: "Telegram", icon: Send },
            { id: "instagram", label: "Instagram", icon: Heart },
            { id: "facebook", label: "Facebook", icon: Globe },
            { id: "pinterest", label: "Pinterest", icon: Pin },
            { id: "youtube", label: "YouTube", icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all duration-150 active:scale-95 ${
                  isSelected
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
          {/* 1. GENERAL TAB */}
          {activeTab === "general" && (
            <div className="space-y-3.5 animate-fade-in-up">
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 font-medium text-zinc-300 text-[11px]">
                  <Key className="w-3 h-3 text-zinc-400" />
                  <span>Gemini AI API Key</span>
                </label>
                <input
                  type="password"
                  value={formData.geminiApiKey || ""}
                  onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
                  placeholder="AIzaSy... (leave blank to use server environment key)"
                  className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono text-xs"
                />
                <p className="text-[10px] text-zinc-500">
                  Used to generate high-converting copy across all supported social platforms.
                </p>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1.5 font-medium text-zinc-300 text-[11px]">
                  <Tag className="w-3 h-3 text-zinc-400" />
                  <span>Default Affiliate Tag</span>
                </label>
                <input
                  type="text"
                  value={formData.defaultAffiliateTag || ""}
                  onChange={(e) => setFormData({ ...formData, defaultAffiliateTag: e.target.value })}
                  placeholder="e.g. tag=mydeals-20 or ref=aff123"
                  className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 text-xs"
                />
                <p className="text-[10px] text-zinc-500">
                  Appended automatically to destination URLs when scraping or posting.
                </p>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1.5 font-medium text-zinc-300 text-[11px]">
                  <Sliders className="w-3 h-3 text-zinc-400" />
                  <span>Default Target Platform</span>
                </label>
                <select
                  value={formData.defaultPlatform || "telegram"}
                  onChange={(e) => setFormData({ ...formData, defaultPlatform: e.target.value as SocialPlatform })}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-800 text-white text-xs cursor-pointer focus:outline-none focus:border-zinc-500"
                >
                  <option value="telegram">Telegram</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="pinterest">Pinterest</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>
            </div>
          )}

          {/* 2. TELEGRAM TAB */}
          {activeTab === "telegram" && (
            <div className="space-y-3.5 animate-fade-in-up">
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 font-medium text-zinc-300 text-[11px]">
                  <Bot className="w-3 h-3 text-zinc-400" />
                  <span>Telegram Bot Token</span>
                </label>
                <input
                  type="password"
                  value={formData.telegramBotToken || ""}
                  onChange={(e) => setFormData({ ...formData, telegramBotToken: e.target.value })}
                  placeholder="123456:ABC-DEF..."
                  className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1.5 font-medium text-zinc-300 text-[11px]">
                  <AtSign className="w-3 h-3 text-zinc-400" />
                  <span>Telegram Channel / Chat ID</span>
                </label>
                <input
                  type="text"
                  value={formData.telegramChatId || ""}
                  onChange={(e) => setFormData({ ...formData, telegramChatId: e.target.value })}
                  placeholder="@MyChannel or numeric chat ID (-100...)"
                  className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 text-xs"
                />
              </div>
            </div>
          )}

          {/* 3. INSTAGRAM TAB */}
          {activeTab === "instagram" && (
            <div className="space-y-3.5 animate-fade-in-up">
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 font-medium text-zinc-300 text-[11px]">
                  <Key className="w-3 h-3 text-zinc-400" />
                  <span>Meta Graph API Access Token</span>
                </label>
                <input
                  type="password"
                  value={formData.instagramAccessToken || ""}
                  onChange={(e) => setFormData({ ...formData, instagramAccessToken: e.target.value })}
                  placeholder="EAA..."
                  className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono text-xs"
                />
                <p className="text-[10px] text-zinc-500">
                  Required for automated direct photo posting to Instagram Business/Creator accounts.
                </p>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1.5 font-medium text-zinc-300 text-[11px]">
                  <Heart className="w-3 h-3 text-zinc-400" />
                  <span>Instagram Business Account ID</span>
                </label>
                <input
                  type="text"
                  value={formData.instagramAccountId || ""}
                  onChange={(e) => setFormData({ ...formData, instagramAccountId: e.target.value })}
                  placeholder="178414..."
                  className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 text-xs"
                />
              </div>
            </div>
          )}

          {/* 4. FACEBOOK TAB */}
          {activeTab === "facebook" && (
            <div className="space-y-3.5 animate-fade-in-up">
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 font-medium text-zinc-300 text-[11px]">
                  <Key className="w-3 h-3 text-zinc-400" />
                  <span>Facebook Page Access Token</span>
                </label>
                <input
                  type="password"
                  value={formData.facebookPageAccessToken || ""}
                  onChange={(e) => setFormData({ ...formData, facebookPageAccessToken: e.target.value })}
                  placeholder="EAA..."
                  className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1.5 font-medium text-zinc-300 text-[11px]">
                  <Globe className="w-3 h-3 text-zinc-400" />
                  <span>Facebook Page ID</span>
                </label>
                <input
                  type="text"
                  value={formData.facebookPageId || ""}
                  onChange={(e) => setFormData({ ...formData, facebookPageId: e.target.value })}
                  placeholder="e.g. 10982374923"
                  className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 text-xs"
                />
              </div>
            </div>
          )}

          {/* 5. PINTEREST TAB */}
          {activeTab === "pinterest" && (
            <div className="space-y-3.5 animate-fade-in-up">
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 font-medium text-zinc-300 text-[11px]">
                  <Key className="w-3 h-3 text-zinc-400" />
                  <span>Pinterest API v5 Access Token</span>
                </label>
                <input
                  type="password"
                  value={formData.pinterestAccessToken || ""}
                  onChange={(e) => setFormData({ ...formData, pinterestAccessToken: e.target.value })}
                  placeholder="pina_..."
                  className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1.5 font-medium text-zinc-300 text-[11px]">
                  <Pin className="w-3 h-3 text-zinc-400" />
                  <span>Pinterest Board ID</span>
                </label>
                <input
                  type="text"
                  value={formData.pinterestBoardId || ""}
                  onChange={(e) => setFormData({ ...formData, pinterestBoardId: e.target.value })}
                  placeholder="e.g. 1029384756"
                  className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 text-xs"
                />
              </div>
            </div>
          )}

          {/* 6. YOUTUBE TAB */}
          {activeTab === "youtube" && (
            <div className="space-y-3.5 animate-fade-in-up">
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 font-medium text-zinc-300 text-[11px]">
                  <Key className="w-3 h-3 text-zinc-400" />
                  <span>YouTube Data API Key</span>
                </label>
                <input
                  type="password"
                  value={formData.youtubeApiKey || ""}
                  onChange={(e) => setFormData({ ...formData, youtubeApiKey: e.target.value })}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1.5 font-medium text-zinc-300 text-[11px]">
                  <Sparkles className="w-3 h-3 text-zinc-400" />
                  <span>YouTube Channel ID</span>
                </label>
                <input
                  type="text"
                  value={formData.youtubeChannelId || ""}
                  onChange={(e) => setFormData({ ...formData, youtubeChannelId: e.target.value })}
                  placeholder="UC..."
                  className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 text-xs"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-800 transition active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-medium flex items-center gap-1.5 transition shadow-sm active:scale-95"
            >
              {showSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-black" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save All Settings</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
