"use client";

import React, { useState } from "react";
import { ScrapedProduct } from "@/types/scraper";
import { JsonViewer } from "./JsonViewer";
import { ExternalLink, Copy, Check } from "lucide-react";

interface ProductPreviewCardProps {
  product: ScrapedProduct;
}

export const ProductPreviewCard: React.FC<ProductPreviewCardProps> = ({ product }) => {
  const [activeTab, setActiveTab] = useState<"preview" | "table" | "json">("preview");
  const [imageError, setImageError] = useState(false);
  const [copiedPost, setCopiedPost] = useState(false);

  const formatPriceDisplay = () => {
    if (!product.price) return "N/A";
    const currency = product.currency || "";
    if (currency === "USD" || currency === "$") return `$${product.price}`;
    if (currency === "EUR" || currency === "€") return `€${product.price}`;
    if (currency === "GBP" || currency === "£") return `£${product.price}`;
    return `${currency} ${product.price}`.trim();
  };

  const handleCopyPost = async () => {
    const postText = `${product.title}\n\nPrice: ${formatPriceDisplay()}\nSource: ${product.siteName}\nLink: ${product.url}`;
    try {
      await navigator.clipboard.writeText(postText);
      setCopiedPost(true);
      setTimeout(() => setCopiedPost(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="w-full rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
      {/* Header Bar */}
      <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between gap-3 bg-black">
        <div className="flex items-center gap-2">
          {product.favicon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.favicon}
              alt=""
              className="w-4 h-4 rounded-sm object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          )}
          <span className="text-xs font-medium text-white">{product.siteName}</span>
          {product.isFallback ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
              fallback
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
              scraped
            </span>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-2.5 py-1 rounded transition ${
              activeTab === "preview"
                ? "bg-zinc-800 text-white font-medium"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setActiveTab("table")}
            className={`px-2.5 py-1 rounded transition ${
              activeTab === "table"
                ? "bg-zinc-800 text-white font-medium"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Table
          </button>
          <button
            onClick={() => setActiveTab("json")}
            className={`px-2.5 py-1 rounded transition ${
              activeTab === "json"
                ? "bg-zinc-800 text-white font-medium"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            JSON
          </button>
        </div>
      </div>

      {/* Tab: Preview */}
      {activeTab === "preview" && (
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Image */}
            <div className="md:col-span-4 aspect-square w-full rounded-lg border border-zinc-800 bg-black flex items-center justify-center overflow-hidden">
              {!imageError && product.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-contain p-2"
                  onError={() => setImageError(true)}
                />
              ) : (
                <span className="text-xs text-zinc-600">No Image</span>
              )}
            </div>

            {/* Details */}
            <div className="md:col-span-8 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white leading-snug">
                  {product.title}
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-white tracking-tight">
                    {formatPriceDisplay()}
                  </span>
                  {product.currency && product.price && (
                    <span className="text-xs text-zinc-500">{product.currency}</span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed pt-1">
                  {product.description}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-md bg-white text-black hover:bg-zinc-200 text-xs font-medium inline-flex items-center gap-1.5 transition"
                >
                  <span>Open URL</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  type="button"
                  onClick={handleCopyPost}
                  className="px-3.5 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-medium inline-flex items-center gap-1.5 transition"
                >
                  {copiedPost ? (
                    <>
                      <Check className="w-3 h-3 text-white" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-zinc-400" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Table */}
      {activeTab === "table" && (
        <div className="p-4">
          <table className="w-full text-left text-xs">
            <tbody className="divide-y divide-zinc-800">
              <tr>
                <td className="py-2.5 px-3 text-zinc-500 font-mono w-28">title</td>
                <td className="py-2.5 px-3 text-white">{product.title}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-zinc-500 font-mono">price</td>
                <td className="py-2.5 px-3 text-zinc-300">{product.price || "null"}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-zinc-500 font-mono">currency</td>
                <td className="py-2.5 px-3 text-zinc-300">{product.currency || "null"}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-zinc-500 font-mono">site</td>
                <td className="py-2.5 px-3 text-zinc-300">{product.siteName}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-zinc-500 font-mono">description</td>
                <td className="py-2.5 px-3 text-zinc-400">{product.description}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-zinc-500 font-mono">image</td>
                <td className="py-2.5 px-3 text-zinc-400 break-all font-mono text-[11px]">
                  {product.image}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-zinc-500 font-mono">url</td>
                <td className="py-2.5 px-3 text-zinc-400 break-all font-mono text-[11px]">
                  {product.url}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: JSON */}
      {activeTab === "json" && (
        <div className="p-4">
          <JsonViewer data={product} />
        </div>
      )}
    </div>
  );
};
