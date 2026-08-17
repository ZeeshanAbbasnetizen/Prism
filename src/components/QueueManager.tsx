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
} from "lucide-react";
import {
  formatInKarachi,
  getKarachiDateTimeLocal,
  parseKarachiInputToIso,
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

      setNotice({ type: "success", text: "Deal successfully published to Telegram!" });
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
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold animate-pulse">
          Due Now
        </span>
      );
    }
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 60) {
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300">
          In {diffMin}m
        </span>
      );
    }
    const diffHours = Math.round(diffMin / 60);
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300">
        In ~{diffHours}h
      </span>
    );
  };

  return (
    <div className="w-full space-y-5">
      {/* Notice Banner */}
      {notice && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            notice.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-200"
              : "bg-red-500/10 border-red-500/20 text-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            <span>{notice.text}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-zinc-500 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Top Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#0E0E14]/80 backdrop-blur-xl">
          <span className="text-xs text-zinc-400 block font-medium">Total Queued</span>
          <span className="text-2xl font-bold text-white tracking-tight mt-1 block">{stats.total}</span>
        </div>
        <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#0E0E14]/80 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 block font-medium">Pending</span>
            {stats.pending > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#00E5D4] animate-ping"></span>
            )}
          </div>
          <span className="text-2xl font-bold text-white tracking-tight mt-1 block">{stats.pending}</span>
        </div>
        <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#0E0E14]/80 backdrop-blur-xl">
          <span className="text-xs text-zinc-400 block font-medium">Published</span>
          <span className="text-2xl font-bold text-white tracking-tight mt-1 block">{stats.published}</span>
        </div>
        <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#0E0E14]/80 backdrop-blur-xl">
          <span className="text-xs text-zinc-400 block font-medium">Failed</span>
          <span className="text-2xl font-bold text-zinc-400 tracking-tight mt-1 block">{stats.failed}</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3.5 rounded-2xl border border-white/[0.08] bg-[#0E0E14]/80 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-lg">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto bg-white/[0.03] p-1 rounded-xl border border-white/[0.05]">
          {["all", "pending", "published", "failed"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-1.5 rounded-lg capitalize font-medium transition ${
                filterStatus === st
                  ? "bg-white/[0.12] text-white shadow-sm border border-white/10"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-52">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deals..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-[#8B5CF6]"
            />
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
          </div>

          <button
            onClick={() => fetchQueue()}
            className="p-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white border border-white/10 transition"
            title="Refresh queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={onNewDealClick}
            className="px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-100 font-semibold text-xs flex items-center gap-1.5 transition shrink-0 shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Deal</span>
          </button>
        </div>
      </div>

      {/* Posts List */}
      {isLoading && posts.length === 0 ? (
        <div className="p-12 rounded-2xl border border-white/[0.08] bg-[#0E0E14]/40 flex flex-col items-center justify-center text-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#8B5CF6]" />
          <span className="text-xs text-zinc-400">Loading queue...</span>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="p-12 rounded-2xl border border-dashed border-white/[0.08] bg-[#0E0E14]/30 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center text-zinc-500">
            <Clock className="w-5 h-5" />
          </div>
          <div className="space-y-1 max-w-xs">
            <p className="text-sm font-semibold text-white">No deals in queue</p>
            <p className="text-xs text-zinc-400">
              {filterStatus !== "all"
                ? `No posts found with status '${filterStatus}'.`
                : "Your distribution schedule is empty."}
            </p>
          </div>
          <button
            onClick={onNewDealClick}
            className="px-4 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-100 transition"
          >
            Create New Deal
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="p-5 rounded-2xl border border-white/[0.08] bg-[#0E0E14]/80 backdrop-blur-xl hover:border-white/20 transition-all duration-200 flex flex-col md:flex-row items-start gap-4 shadow-lg"
            >
              {/* Product Thumbnail */}
              <div className="relative w-full md:w-32 aspect-square rounded-xl border border-white/10 bg-black flex items-center justify-center overflow-hidden shrink-0">
                {post.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.image_url}
                    alt={post.product_title}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <span className="text-[10px] text-zinc-600">No Image</span>
                )}
                {post.price && (
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/90 text-white text-[10px] font-bold border border-white/10">
                    ${post.price}
                  </div>
                )}
              </div>

              {/* Main Info */}
              <div className="flex-1 space-y-2.5 w-full">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white line-clamp-1">
                      {post.product_title}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 border border-white/10">
                      {post.site_name || "Store"}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-1.5">
                    {post.status === "pending" && (
                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1.5 font-medium">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Pending</span>
                        {getRelativeTimeBadge(post.scheduled_time, post.status)}
                      </span>
                    )}
                    {post.status === "published" && (
                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Published</span>
                      </span>
                    )}
                    {post.status === "failed" && (
                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-red-500/10 text-red-300 border border-red-500/20 flex items-center gap-1.5 font-medium">
                        <AlertCircle className="w-3 h-3 text-red-400" />
                        <span>Failed</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Scheduled Time Banner */}
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Calendar className="w-3.5 h-3.5 text-[#00E5D4]" />
                  <span>Release:</span>
                  <span className="font-semibold text-white">{formatInKarachi(post.scheduled_time)}</span>
                </div>

                {/* Caption Snippet */}
                <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 text-zinc-300 text-xs font-mono leading-relaxed line-clamp-3">
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
                        className="px-3.5 py-1.5 rounded-xl bg-white text-black hover:bg-zinc-100 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                      >
                        {publishingId === post.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>Publish</span>
                      </button>
                    )}

                    <button
                      onClick={() => openEditModal(post)}
                      className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white border border-white/10 transition"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white border border-white/10 transition"
                      title="Delete"
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

      {/* Edit Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0E0E14] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
              <h3 className="text-sm font-semibold text-white">Edit Queued Deal</h3>
              <button onClick={() => setEditingPost(null)} className="text-zinc-500 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-medium">Scheduled Release Time</label>
                <input
                  type="datetime-local"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-medium">Deal Caption (HTML)</label>
                <textarea
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  rows={8}
                  required
                  className="w-full p-3.5 rounded-xl bg-black/60 border border-white/10 text-zinc-200 font-mono text-xs focus:outline-none focus:border-[#8B5CF6] leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] text-zinc-300 text-xs hover:bg-white/[0.12] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-100 transition"
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
