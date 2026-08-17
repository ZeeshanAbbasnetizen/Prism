"use client";

import React, { useState, useEffect } from "react";
import { QueuePost, QueueApiResponse } from "@/types/scraper";
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
  Zap,
} from "lucide-react";
import {
  formatInKarachi,
  getKarachiDateTimeLocal,
  parseKarachiInputToIso,
  TIMEZONE_LABEL,
  TIMEZONE_SHORT,
} from "@/lib/dateUtils";

interface QueueManagerProps {
  onNewDealClick: () => void;
  onPostPublished?: () => void;
}

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
  const [searchQuery, setSearchQuery] = useState("");
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<QueuePost | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editTime, setEditTime] = useState("");
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
    // Automatic background scheduler heartbeat every 8 seconds
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

      setNotice({ type: "success", text: "Post successfully published to Telegram!" });
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
    if (!confirm("Are you sure you want to remove this post from the queue?")) return;

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
    try {
      const d = new Date(post.scheduled_time);
      setEditTime(getKarachiDateTimeLocal(d));
    } catch {
      setEditTime(post.scheduled_time);
    }
  };

  const filteredPosts = posts.filter((p) => {
    const matchesFilter = filterStatus === "all" || p.status === filterStatus;
    const matchesSearch =
      !searchQuery ||
      p.product_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.site_name && p.site_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getRelativeTimeBadge = (scheduledTimeIso: string, status: string) => {
    if (status !== "pending") return null;
    const diffMs = new Date(scheduledTimeIso).getTime() - Date.now();
    if (diffMs <= 0) {
      return (
        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold animate-pulse">
          Due Now (Auto-Publishing...)
        </span>
      );
    }
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 60) {
      return (
        <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
          In {diffMin}m
        </span>
      );
    }
    const diffHours = Math.round(diffMin / 60);
    return (
      <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
        In ~{diffHours}h
      </span>
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Notice Banner */}
      {notice && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
            notice.type === "success"
              ? "bg-zinc-900 border-zinc-700 text-white"
              : "bg-zinc-950 border-zinc-800 text-zinc-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-zinc-400" />
            )}
            <span>{notice.text}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-zinc-500 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950">
          <span className="text-[11px] text-zinc-500 block font-medium">Total Queued</span>
          <span className="text-xl font-bold text-white tracking-tight">{stats.total}</span>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-500 block font-medium">Pending Release</span>
            {stats.pending > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            )}
          </div>
          <span className="text-xl font-bold text-white tracking-tight">{stats.pending}</span>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950">
          <span className="text-[11px] text-zinc-500 block font-medium">Published</span>
          <span className="text-xl font-bold text-white tracking-tight">{stats.published}</span>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950">
          <span className="text-[11px] text-zinc-500 block font-medium">Failed</span>
          <span className="text-xl font-bold text-zinc-400 tracking-tight">{stats.failed}</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Filter Pills */}
        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
          {["all", "pending", "published", "failed"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg capitalize font-medium transition ${
                filterStatus === st
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-black border border-zinc-800 text-white placeholder-zinc-600 text-xs focus:outline-none focus:border-zinc-500"
            />
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2" />
          </div>

          <button
            onClick={() => fetchQueue()}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition"
            title="Refresh queue and trigger due posts check"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={onNewDealClick}
            className="px-3 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 font-medium text-xs flex items-center gap-1.5 transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Deal</span>
          </button>
        </div>
      </div>

      {/* Auto-Publisher Live Indicator */}
      <div className="flex items-center justify-between px-2 text-[11px] text-zinc-500">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Auto-Publisher active (Islamabad / Karachi PKT, UTC+5)</span>
        </div>
        <span>Auto-checks every 8s</span>
      </div>

      {/* Posts List */}
      {isLoading && posts.length === 0 ? (
        <div className="p-8 rounded-xl border border-zinc-800 bg-zinc-950/50 flex flex-col items-center justify-center text-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          <span className="text-xs text-zinc-500">Loading scheduled queue (PKT)...</span>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="p-12 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/30 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500">
            <Clock className="w-5 h-5" />
          </div>
          <div className="space-y-1 max-w-xs">
            <p className="text-sm font-medium text-white">No scheduled deals found</p>
            <p className="text-xs text-zinc-500">
              {filterStatus !== "all"
                ? `There are no posts with status '${filterStatus}'.`
                : "Your scheduling queue is currently empty."}
            </p>
          </div>
          <button
            onClick={onNewDealClick}
            className="px-4 py-2 rounded-lg bg-white text-black text-xs font-medium hover:bg-zinc-200 transition"
          >
            Create New Deal
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 hover:border-zinc-700 transition flex flex-col md:flex-row items-start gap-4"
            >
              {/* Product Thumbnail */}
              <div className="relative w-full md:w-32 aspect-square md:aspect-square rounded-lg border border-zinc-800 bg-black flex items-center justify-center overflow-hidden shrink-0">
                {post.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.image_url}
                    alt={post.product_title}
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <span className="text-[10px] text-zinc-600">No Image</span>
                )}
                {post.price && (
                  <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/90 text-white text-[10px] font-bold">
                    ${post.price}
                  </div>
                )}
              </div>

              {/* Main Info */}
              <div className="flex-1 space-y-2 w-full">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white line-clamp-1">
                      {post.product_title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                      {post.site_name || "Store"}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-1.5">
                    {post.status === "pending" && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-800 flex items-center gap-1.5 font-medium">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Pending</span>
                        {getRelativeTimeBadge(post.scheduled_time, post.status)}
                      </span>
                    )}
                    {post.status === "published" && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-800 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Published</span>
                      </span>
                    )}
                    {post.status === "failed" && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-800 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3 h-3 text-red-400" />
                        <span>Failed</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Scheduled Time Banner (in PKT) */}
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Scheduled for:</span>
                  <span className="font-medium text-white">{formatInKarachi(post.scheduled_time)}</span>
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
                    <span>View Affiliate URL</span>
                    <ExternalLink className="w-3 h-3 text-zinc-500" />
                  </a>

                  <div className="flex items-center gap-1.5">
                    {post.status !== "published" && (
                      <button
                        onClick={() => handlePublishNow(post.id)}
                        disabled={publishingId === post.id}
                        className="px-3 py-1 rounded bg-white text-black hover:bg-zinc-200 text-xs font-medium flex items-center gap-1 transition disabled:opacity-50"
                      >
                        {publishingId === post.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        <span>Publish Now</span>
                      </button>
                    )}

                    <button
                      onClick={() => openEditModal(post)}
                      className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition"
                      title="Edit Post"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition"
                      title="Delete Post"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal in PKT */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Edit Queued Deal</h3>
                <span className="text-[10px] text-zinc-400">Timezone: Islamabad / Karachi ({TIMEZONE_LABEL})</span>
              </div>
              <button onClick={() => setEditingPost(null)} className="text-zinc-500 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-zinc-400 font-medium">Scheduled Release Time (Karachi Time)</label>
                <input
                  type="datetime-local"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded bg-black border border-zinc-800 text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 font-medium">Deal Caption (HTML)</label>
                <textarea
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  rows={8}
                  required
                  className="w-full p-3 rounded bg-black border border-zinc-800 text-zinc-200 font-mono text-xs focus:outline-none focus:border-zinc-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="px-3 py-1.5 rounded bg-zinc-900 text-zinc-300 text-xs hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-white text-black font-medium text-xs hover:bg-zinc-200"
                >
                  Save Changes (PKT)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
