"use client";

import React, { useState, useEffect } from "react";
import { ParsedHistoryItem, HistoryApiResponse } from "@/types/scraper";
import {
  Search,
  ExternalLink,
  Trash2,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Globe,
  DollarSign,
  Layers,
  ArrowUpRight,
  SlidersHorizontal,
} from "lucide-react";
import { formatInKarachi } from "@/lib/dateUtils";

interface HistoryViewProps {
  onLoadInStudio: (item: ParsedHistoryItem) => void;
  onRefreshStats?: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  onLoadInStudio,
  onRefreshStats,
}) => {
  const [items, setItems] = useState<ParsedHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "table">("list");

  const fetchHistory = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch("/api/history");
      const json: HistoryApiResponse = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setItems(json.data);
      }
    } catch {
      // ignore
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Delete this product from history?")) return;

    try {
      const res = await fetch(`/api/history?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        if (onRefreshStats) onRefreshStats();
      }
    } catch {
      // ignore
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all parsed product history?")) return;

    try {
      const res = await fetch("/api/history?action=clear", {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setItems([]);
        if (onRefreshStats) onRefreshStats();
      }
    } catch {
      // ignore
    }
  };

  const handleCopyLink = async (url: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  // Extract unique stores for filtering
  const stores = Array.from(new Set(items.map((i) => i.site_name).filter(Boolean)));

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.site_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStore = selectedStore === "all" || item.site_name === selectedStore;

    return matchesSearch && matchesStore;
  });

  return (
    <div className="w-full space-y-5 text-white">
      {/* Top Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950">
          <span className="text-xs text-zinc-500 font-medium block">Total Parsed</span>
          <span className="text-2xl font-bold text-white tracking-tight mt-1 block">
            {items.length}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950">
          <span className="text-xs text-zinc-500 font-medium block">Unique Stores</span>
          <span className="text-2xl font-bold text-white tracking-tight mt-1 block">
            {stores.length}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950">
          <span className="text-xs text-zinc-500 font-medium block">Most Recent Store</span>
          <span className="text-sm font-semibold text-zinc-300 tracking-tight mt-2 block truncate">
            {items[0]?.site_name || "None"}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 flex flex-col justify-between">
          <span className="text-xs text-zinc-500 font-medium block">Actions</span>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={items.length === 0}
            className="text-xs font-medium text-zinc-400 hover:text-red-400 transition text-left disabled:opacity-30 disabled:hover:text-zinc-500"
          >
            Clear History
          </button>
        </div>
      </div>

      {/* Filter, Search & View Controls */}
      <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search parsed products..."
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-black border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-zinc-500"
          />
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
        </div>

        {/* Store Pills & Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end overflow-x-auto">
          {/* Store selector dropdown if many stores */}
          {stores.length > 0 && (
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="px-3 py-2 rounded-lg bg-black border border-zinc-800 text-zinc-300 text-xs focus:outline-none focus:border-zinc-500"
            >
              <option value="all">All Stores ({items.length})</option>
              {stores.map((s) => (
                <option key={s} value={s}>
                  {s} ({items.filter((i) => i.site_name === s).length})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => fetchHistory()}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition"
            title="Refresh history"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* History Items Container */}
      {isLoading && items.length === 0 ? (
        <div className="p-12 rounded-xl border border-zinc-800 bg-zinc-950/50 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-6 h-6 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
          <span className="text-xs text-zinc-500">Loading parsed history...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/30 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500">
            <Layers className="w-5 h-5" />
          </div>
          <div className="space-y-1 max-w-xs">
            <p className="text-sm font-semibold text-white">No parsed history yet</p>
            <p className="text-xs text-zinc-500">
              {searchQuery || selectedStore !== "all"
                ? "No products matched your search filter."
                : "Products parsed in the Studio will automatically be saved here."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onLoadInStudio(item)}
              className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 hover:border-zinc-600 transition cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
            >
              {/* Product Thumbnail & Core Info */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="w-14 h-14 rounded-lg bg-black border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <Globe className="w-4 h-4 text-zinc-600" />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white truncate group-hover:text-zinc-200">
                      {item.title}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 shrink-0 font-medium">
                      {item.site_name}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400">
                    {item.price && (
                      <span className="font-semibold text-white">
                        {item.currency || "$"}
                        {item.price}
                      </span>
                    )}
                    <span className="text-zinc-600">&bull;</span>
                    <span className="text-zinc-500 font-mono text-[10px]">
                      {formatInKarachi(item.parsed_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLoadInStudio(item);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                  title="Load into Studio to generate deal copy"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Open Studio</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleCopyLink(item.url, item.id, e)}
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition"
                  title="Copy Product URL"
                >
                  {copiedId === item.id ? (
                    <Check className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition"
                  title="Open in new tab"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={(e) => handleDelete(item.id, e)}
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 border border-zinc-800 transition"
                  title="Delete from history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
