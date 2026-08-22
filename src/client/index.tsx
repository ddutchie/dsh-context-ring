import React, { useState, useRef, useEffect } from "react";
import { ContextRing, type ContextRingProps } from "./ContextRing.js";
import type { ContextRingUsage, ContextRingBreakdown } from "../types.js";

export * from "./ContextRing.js";

function formatTokens(num?: number): string {
  if (!num) return "0";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toLocaleString();
}

export const ContextRingWidget: React.FC<{ usage?: ContextRingUsage }> = ({ usage }) => {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", handleDown);
    return () => window.removeEventListener("mousedown", handleDown);
  }, [open]);

  if (!usage || !usage.promptTokens || usage.promptTokens <= 0) return null;

  const promptTokens = usage.promptTokens;
  const completionTokens = usage.completionTokens || 0;
  const reasoningTokens = usage.reasoningTokens || 0;
  const cacheRead = usage.cacheReadTokens || 0;
  const cacheCreation = usage.cacheCreationTokens || 0;
  const costUsd = usage.costUsd;

  const b: ContextRingBreakdown = usage.breakdown ?? {
    systemPrompt: Math.min(promptTokens, 350),
    tools: Math.min(Math.max(0, promptTokens - 350), 2650),
    skills: 0,
    toolOutputs: 0,
    conversation: Math.max(0, promptTokens - 3000),
  };

  const categories = [
    { label: "System prompt", count: b.systemPrompt, color: "#6366f1" },
    { label: "Tool definitions", count: b.tools, color: "#8b5cf6" },
    { label: "Skills", count: b.skills, color: "#ec4899" },
    { label: "Tool outputs", count: b.toolOutputs, color: "#06b6d4" },
    { label: "Conversation", count: b.conversation, color: "#22c55e" },
  ];

  return (
    <div className="relative inline-flex items-center" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--surface-2,rgba(128,128,128,0.1))] hover:bg-[var(--surface-3,rgba(128,128,128,0.18))] border border-[var(--border,rgba(128,128,128,0.2))] text-xs font-mono text-[var(--text-secondary,#aaa)] transition-all cursor-pointer shadow-sm select-none"
        title="Click to view full context & token breakdown"
      >
        <ContextRing usage={usage} size={16} strokeWidth={2.5} />
        <span className="font-semibold text-[var(--text-primary,#eee)]">
          {promptTokens.toLocaleString()} tokens
        </span>
        {costUsd != null && costUsd > 0 && (
          <span className="text-[var(--text-tertiary,#777)]">· ${costUsd < 0.01 ? "<0.01" : costUsd.toFixed(4)}</span>
        )}
      </button>

      {open && (
        <div
          className="absolute bottom-full mb-2 left-0 z-50 w-72 p-3.5 rounded-xl bg-[var(--surface-1,#18181b)] border border-[var(--border,#27272a)] shadow-2xl text-xs font-sans text-[var(--text-primary,#f4f4f5)]"
          style={{ backdropFilter: "blur(12px)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border,#27272a)]">
            <div className="flex items-center gap-2">
              <ContextRing usage={usage} size={18} strokeWidth={3} />
              <div className="flex flex-col">
              <span className="font-semibold text-sm">Context Breakdown</span>
              <span className="text-[0.7rem] text-[var(--text-tertiary,#71717a)] font-mono">
                {Math.round((promptTokens / (usage.contextLimit || 128000)) * 100)}% Full (~{formatTokens(promptTokens)} / {formatTokens(usage.contextLimit || 128000)})
              </span>
            </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[var(--text-tertiary,#71717a)] hover:text-[var(--text-primary,#f4f4f5)] p-0.5 rounded cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Segmented bar */}
          <div className="w-full h-2 bg-[var(--border,rgba(128,128,128,0.2))] rounded-full overflow-hidden flex mb-3">
            {categories.map((c) => {
              const pct = (c.count / promptTokens) * 100;
              if (pct <= 0) return null;
              return (
                <div
                  key={c.label}
                  style={{ width: `${pct}%`, backgroundColor: c.color }}
                  className="h-full"
                  title={`${c.label}: ${c.count.toLocaleString()} tokens (${Math.round(pct)}%)`}
                />
              );
            })}
          </div>

          {/* Categories Legend */}
          <div className="space-y-1.5 mb-3 font-mono text-[0.75rem]">
            {categories.map((c) => {
              if (c.count <= 0 && c.label === "Skills") return null;
              return (
                <div key={c.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: c.color }} />
                    <span className="text-[var(--text-secondary,#a1a1aa)] font-sans">{c.label}</span>
                  </div>
                  <span className="font-medium text-[var(--text-primary,#f4f4f5)]">{formatTokens(c.count)}</span>
                </div>
              );
            })}
          </div>

          {/* Output tokens */}
          {completionTokens > 0 && (
            <div className="pt-2 border-t border-[var(--border,#27272a)] space-y-1 text-[0.75rem] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary,#a1a1aa)] font-sans">Output / Completion</span>
                <span className="font-medium">{formatTokens(completionTokens)}</span>
              </div>
              {reasoningTokens > 0 && (
                <div className="flex items-center justify-between text-[var(--text-tertiary,#71717a)]">
                  <span className="font-sans">└ Thinking / Reasoning</span>
                  <span>{formatTokens(reasoningTokens)}</span>
                </div>
              )}
            </div>
          )}

          {/* Prompt Cache */}
          {(cacheRead > 0 || cacheCreation > 0) && (
            <div className="pt-2 mt-2 border-t border-[var(--border,#27272a)] flex items-center justify-between text-[0.75rem] font-mono">
              <span className="text-[var(--text-secondary,#a1a1aa)] font-sans">Prompt Cache Read</span>
              <span className="text-emerald-400 font-medium">{formatTokens(cacheRead)} tokens</span>
            </div>
          )}

          {/* Cost */}
          {costUsd != null && (
            <div className="pt-2 mt-2 border-t border-[var(--border,#27272a)] flex items-center justify-between text-[0.75rem] font-mono">
              <span className="text-[var(--text-secondary,#a1a1aa)] font-sans">Turn Cost</span>
              <span className="text-amber-400 font-semibold">${costUsd < 0.01 ? "<0.01" : costUsd.toFixed(4)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export function apply(ctx: any): void {
  if (ctx?.slots?.register) {
    ctx.slots.register({ name: "conversation.composer.dock", id: "context-ring", order: 5 }, ContextRingWidget);
  }
  if (ctx?.registerChatFooter) {
    ctx.registerChatFooter("context-ring", ContextRingWidget, 5);
  }
}

export function activate(ui: any): void {
  apply(ui);
}

export default {
  apply,
  activate,
  ContextRing,
  ContextRingWidget,
};
