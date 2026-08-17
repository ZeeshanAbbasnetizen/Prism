"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface JsonViewerProps {
  data: unknown;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ data }) => {
  const [copied, setCopied] = useState(false);
  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative rounded-lg border border-zinc-800 bg-black font-mono text-xs overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-zinc-800 bg-zinc-950 text-zinc-400">
        <span className="text-[11px] font-medium text-zinc-400">payload.json</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-white" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-zinc-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-zinc-300 text-[11px] leading-relaxed max-h-96">
        {jsonString}
      </pre>
    </div>
  );
};
