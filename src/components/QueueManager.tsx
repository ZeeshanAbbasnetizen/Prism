"use client";

import React, { useState, useEffect } from "react";
import { QueuePost, QueueApiResponse, SocialPlatform } from "@/types/scraper";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Send,
  Edit3,
  ExternalLink,
  RefreshCw,
  Plus,
  Search,
  Loader2,
  Calendar,
  Heart,
  Globe,
  Pin,
  Sparkles,
} from "lucide-react";
import {
  formatInKarachi,
  getKarachiDateTimeLocal,
  parseKarachiInputToIso,
} from "@/lib/dateUtils";
import { getPlatformDisplayName } from "@/lib/publisher";

interface QueueManagerProps {
  onNewDealClick: () => void;
  onPostPublished?: () => void;
}

const PLATFORM_ICONS: Record<SocialPlatform, { icon: typeof Send; color: string; bg: string }> = {
  telegram: { icon: Send, color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20" },
  instagram: { icon: Heart, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
  facebook: { icon: Globe, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  pinterest: { icon: Pin, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  youtube: { icon: Sparkles, color: "text-red-500", bg: "bg-red-600/10 border-red-600/20" },
};

export const QueueManager: React.FC<QueueManagerProps> = ({
  onNewDealClick,
  onPostPublished,
}) => {
  const [posts, setPosts] = useState<QueuePost[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    pending: number;
    published: number;
    failed: number;
  }>({ total: 0, pending: 0, published: 0, failed: 0 });

  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<QueuePost | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editPlatform, setEditPlatform] = useState<SocialPlatform>("telegram");
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchQueue = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch("/api/queue");
      const json: QueueApiResponse = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPosts(json.data);
        if (json.stats) setStats(json.stats);
      }
    } catch {
      // ignore
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(() => {
      fetchQueue(true);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handlePublishNow = async (id: string) => {
    setPublishingId(id);
    setNotice(null);

    try {
      const res = await fetch("/api/queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "publish_now" }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to publish post.");
      }

      setNotice({ type: "success", text: "Deal published successfully to platform!" });
      fetchQueue();
      if (onPostPublished) onPostPublished();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Publishing failed.";
      setNotice({ type: "error", text: msg });
      fetchQueue();
    } finally {
      setPublishingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this post from the queue?")) return;

    try {
      const res = await fetch(`/api/queue?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setPosts(posts.filter((p) => p.id !== id));
        fetchQueue();
      }
    } catch {
      // ignore
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;

    try {
      const isoTime = parseKarachiInputToIso(editTime);
      const res = await fetch("/api/queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPost.id,
          caption: editCaption,
          scheduled_time: isoTime,
          platform: editPlatform,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setEditingPost(null);
        fetchQueue();
      }
    } catch {
      // ignore
    }
  };

  const openEditModal = (post: QueuePost) => {
    setEditingPost(post);
    setEditCaption(post.caption);
    setEditPlatform(post.platform || "telegram");
    try {
      const d = new Date(post.scheduled_time);
      setEditTime(getKarachiDateTimeLocal(d));
    } catch {
      setEditTime(post.scheduled_time);
    }
  };

  const filteredPosts = posts.filter((p) => {
    const matchesFilter = filterStatus === "all" || p.status === filterStatus;
    const matchesPlatform = filterPlatform === "all" || (p.platform || "telegram") === filterPlatform;
    const matchesSearch =
      !searchQuery ||
      p.product_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.site_name && p.site_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesPlatform && matchesSearch;
  });

  const getRelativeTimeBadge = (scheduledTimeIso: string, status: string) => {
    if (status !== "pending") return null;
    const diffMs = new Date(scheduledTimeIso).getTime() - Date.now();
    if (diffMs <= 0) {
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium animate-pulse">
          Due Now
        </span>
      );
    }
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 60) {
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 font-mono">
          In {diffMin}m
        </span>
      );
    }
    const diffHours = Math.round(diffMin / 60);
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 font-mono">
        In ~{diffHours}h
      </span>
    );
  };

  return (
    <div className="w-full space-y-4 animate-fade-in-up">
      {/* Notice Banner */}
      {notice && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between animate-fade-in-scale ${
            notice.type === "success"
              ? "bg-zinc-900 border-zinc-700 text-white"
              : "bg-zinc-950 border-zinc-800 text-zinc-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-white animate-bounce" style={{ animationIterationCount: 2 }} />
            ) : (
              <AlertCircle className="w-4 h-4 text-zinc-400" />
            )}
            <span>{notice.text}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-zinc-500 hover:text-white transition active:scale-95">
            ✕
          </button>
        </div>
      )}

      {/* Top Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 interactive-card">
          <span className="text-xs text-zinc-500 block font-medium">Total Queued</span>
          <span className="text-2xl font-bold text-white tracking-tight mt-1 block font-heading">{stats.total}</span>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 interactive-card">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 block font-medium">Pending</span>
            {stats.pending > 0 && (
              <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            )}
          </div>
          <span className="text-2xl font-bold text-white tracking-tight mt-1 block font-heading">{stats.pending}</span>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 interactive-card">
          <span className="text-xs text-zinc-500 block font-medium">Published</span>
          <span className="text-2xl font-bold text-white tracking-tight mt-1 block font-heading">{stats.published}</span>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 interactive-card">
          <span className="text-xs text-zinc-500 block font-medium">Failed</span>
          <span className="text-2xl font-bold text-zinc-400 tracking-tight mt-1 block font-heading">{stats.failed}</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950 flex flex-col gap-3 text-xs interactive-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {["all", "pending", "published", "failed"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-lg capitalize font-medium transition-all duration-150 active:scale-95 ${
                  filterStatus === st
                    ? "bg-white text-black shadow-sm"
                    : "text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Platform Filter Selector */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 text-[11px]">Platform:</span>
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-black border border-zinc-800 text-white text-xs cursor-pointer focus:outline-none focus:border-zinc-600"
            >
              <option value="all">All Platforms</option>
              <option value="telegram">Telegram</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="pinterest">Pinterest</option>
              <option value="youtube">YouTube</option>
            </select>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-900">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search queue deals..."
              className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-black border border-zinc-800 text-white placeholder-zinc-500 text-xs input-interactive"
            />
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchQueue()}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-all duration-150 active:scale-95"
              title="Refresh queue"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={onNewDealClick}
              className="px-3 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 font-medium text-xs flex items-center gap-1.5 btn-interactive shrink-0 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Deal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Posts List */}
      {isLoading && posts.length === 0 ? (
        <div className="p-8 rounded-xl border border-zinc-800 bg-zinc-950/50 flex flex-col items-center justify-center text-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          <span className="text-xs text-zinc-500">Loading queue...</span>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="p-12 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/30 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 animate-float-subtle">
            <Clock className="w-5 h-5" />
          </div>
          <div className="space-y-1 max-w-xs">
            <p className="text-sm font-medium text-white font-heading">No deals in queue</p>
            <p className="text-xs text-zinc-500">
              {filterStatus !== "all" || filterPlatform !== "all"
                ? `No posts found matching the selected filter.`
                : "Your scheduling queue is currently empty."}
            </p>
          </div>
          <button
            onClick={onNewDealClick}
            className="px-4 py-2 rounded-lg bg-white text-black text-xs font-medium hover:bg-zinc-200 btn-interactive"
          >
            Create New Deal
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => {
            const platformKey = (post.platform || "telegram") as SocialPlatform;
            const platformConfig = PLATFORM_ICONS[platformKey] || PLATFORM_ICONS.telegram;
            const PlatformIcon = platformConfig.icon;

            return (
              <div
                key={post.id}
                className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 hover:border-zinc-600 transition-all duration-200 flex flex-col md:flex-row items-start gap-4 interactive-card group/card"
              >
                {/* Product Thumbnail */}
                <div className="relative w-full md:w-28 aspect-square rounded-lg border border-zinc-800 bg-black flex items-center justify-center overflow-hidden shrink-0">
                  {post.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.image_url}
                      alt={post.product_title}
                      className="w-full h-full object-contain p-1 transition-transform duration-300 group-hover/card:scale-105"
                    />
                  ) : (
                    <span className="text-[10px] text-zinc-600">No Image</span>
                  )}
                  {post.price && (
                    <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/90 text-white text-[10px] font-bold border border-zinc-800 font-mono">
                      ${post.price}
                    </div>
                  )}
                </div>

                {/* Main Info */}
                <div className="flex-1 space-y-2 w-full">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* Platform Badge */}
                      <span className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 font-medium capitalize ${platformConfig.bg} ${platformConfig.color}`}>
                        <PlatformIcon className="w-3 h-3" />
                        <span>{getPlatformDisplayName(platformKey)}</span>
                      </span>

                      <span className="text-xs font-semibold text-white line-clamp-1 font-heading group-hover/card:text-zinc-200 transition-colors">
                        {post.product_title}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 font-mono">
                        {post.site_name || "Store"}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5">
                      {post.status === "pending" && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-800 flex items-center gap-1.5 font-medium">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          <span>Pending</span>
                          {getRelativeTimeBadge(post.scheduled_time, post.status)}
                        </span>
                      )}
                      {post.status === "published" && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-800 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                          <span>Published</span>
                        </span>
                      )}
                      {post.status === "failed" && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-800 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3 h-3 text-zinc-400" />
                          <span>Failed</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Scheduled Time Banner */}
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Release:</span>
                    <span className="font-medium text-white font-mono">{formatInKarachi(post.scheduled_time)}</span>
                  </div>

                  {/* Caption Snippet */}
                  <div className="p-3 rounded-lg bg-black border border-zinc-800 text-zinc-300 text-xs font-mono leading-relaxed line-clamp-3">
                    <div dangerouslySetInnerHTML={{ __html: post.caption }} />
                  </div>

                  {/* Actions Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <a
                      href={post.affiliate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition"
                    >
                      <span>Affiliate Link</span>
                      <ExternalLink className="w-3 h-3 text-zinc-500" />
                    </a>

                    <div className="flex items-center gap-1.5">
                      {post.status !== "published" && (
                        <button
                          onClick={() => handlePublishNow(post.id)}
                          disabled={publishingId === post.id}
                          className="px-3 py-1 rounded bg-white text-black hover:bg-zinc-200 text-xs font-medium flex items-center gap-1 btn-interactive disabled:opacity-50"
                        >
                          {publishingId === post.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                          <span>Post to {getPlatformDisplayName(platformKey)}</span>
                        </button>
                      )}

                      <button
                        onClick={() => openEditModal(post)}
                        className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 transition active:scale-95"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-zinc-700 transition active:scale-95"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in-scale">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-semibold text-white font-heading">Edit Queued Deal</h3>
              <button onClick={() => setEditingPost(null)} className="text-zinc-500 hover:text-white transition active:scale-95">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-zinc-400 font-medium">Target Social Platform</label>
                <select
                  value={editPlatform}
                  onChange={(e) => setEditPlatform(e.target.value as SocialPlatform)}
                  className="w-full px-3 py-2 rounded bg-black border border-zinc-800 text-white input-interactive"
                >
                  <option value="telegram">Telegram</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="pinterest">Pinterest</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 font-medium">Release Time</label>
                <input
                  type="datetime-local"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded bg-black border border-zinc-800 text-white input-interactive font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 font-medium">Deal Caption</label>
                <textarea
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  rows={8}
                  required
                  className="w-full p-3 rounded bg-black border border-zinc-800 text-zinc-200 font-mono text-xs input-interactive leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="px-3 py-1.5 rounded bg-zinc-900 text-zinc-300 text-xs hover:bg-zinc-800 transition active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-white text-black font-medium text-xs hover:bg-zinc-200 btn-interactive shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
