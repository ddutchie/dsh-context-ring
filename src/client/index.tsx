import React, { useState, useRef, useEffect } from "react";
import { ContextRing, type ContextRingProps } from "./ContextRing.js";
import type { ContextRingUsage, ContextRingBreakdown } from "../types.js";

export * from "./ContextRing.js";

function formatTokens(num?: number): string {
  if (!num) return "0";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toLocaleString();
}

export interface ContextRingWidgetProps {
  usage?: ContextRingUsage;
  useProjection?: (key: string) => any;
  useSession?: (selector: (state: any) => any) => any;
  t?: (key: string, args?: any) => string;
}

export const ContextRingWidget: React.FC<ContextRingWidgetProps> = (props) => {
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

  // Read from props.usage (Cairn) or projections (DSH)
  const tokenUsage = props.useProjection ? props.useProjection("tokenUsage") : undefined;
  const contextPressure = props.useProjection ? props.useProjection("contextPressure") : undefined;
  const contextBreakdown = props.useProjection ? props.useProjection("contextBreakdown") : undefined;

  const usage: ContextRingUsage | undefined = props.usage ?? (tokenUsage || contextPressure ? {
    promptTokens: tokenUsage?.inputTokens ?? contextPressure?.current ?? 0,
    completionTokens: tokenUsage?.outputTokens ?? 0,
    reasoningTokens: tokenUsage?.reasoningTokens ?? 0,
    cacheReadTokens: tokenUsage?.cacheReadTokens ?? 0,
    cacheCreationTokens: tokenUsage?.cacheCreationTokens ?? 0,
    costUsd: tokenUsage?.costUsd,
    contextLimit: contextPressure?.capacity,
    contextWindow: contextPressure?.capacity,
    breakdown: contextBreakdown ? {
      systemPrompt: contextBreakdown.systemTokens ?? 0,
      tools: contextBreakdown.toolsTokens ?? 0,
      skills: 0,
      toolOutputs: 0,
      conversation: contextBreakdown.messageTokens ?? 0,
    } : undefined,
  } : undefined);

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

  const contextLimit = usage.contextLimit || usage.contextWindow || 128000;
  const percentFull = Math.min(100, Math.round((promptTokens / contextLimit) * 100));

  return (
    <div className="relative inline-flex items-center" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--surface-2,rgba(128,128,128,0.1))] hover:bg-[var(--surface-3,rgba(128,128,128,0.18))] border border-[var(--border,rgba(128,128,128,0.2))] text-xs font-mono text-[var(--text-secondary,#aaa)] transition-all cursor-pointer shadow-sm select-none"
        title="Click to view full context & token breakdown"
      >
        <ContextRing usage={usage} size={14} strokeWidth={2.5} />
        <span className="font-medium text-[var(--text-primary,#ddd)]">
          {formatTokens(promptTokens)}
        </span>
      </button>

      {/* Popover Breakdown Card */}
      {open && (
        <div className="absolute bottom-full mb-2 left-0 z-50 w-72 p-3.5 rounded-xl bg-[var(--surface-1,#18181b)] border border-[var(--border,#27272a)] shadow-2xl backdrop-blur-md text-xs text-[var(--text-primary,#f4f4f5)] animate-in fade-in zoom-in-95 duration-150 select-none pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border,#27272a)]">
            <span className="font-semibold text-xs text-[var(--text-primary,#f4f4f5)]">Context Breakdown</span>
            <span className="text-[0.7rem] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-2,#27272a)] text-[var(--text-secondary,#a1a1aa)]">
              {percentFull}% Full (~{formatTokens(promptTokens)} / {formatTokens(contextLimit)})
            </span>
          </div>

          {/* Breakdown progress bar */}
          <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-[var(--surface-3,#3f3f46)] my-3 gap-0.5">
            {categories.map((c, i) => {
              if (!c.count || c.count <= 0) return null;
              const width = Math.max(1, (c.count / promptTokens) * 100);
              return (
                <div
                  key={i}
                  style={{ width: `${width}%`, backgroundColor: c.color }}
                  title={`${c.label}: ${formatTokens(c.count)}`}
                />
              );
            })}
          </div>

          {/* Prompt Breakdown List */}
          <div className="space-y-1.5 text-[0.75rem] font-mono">
            {categories.map((c, i) => {
              if (!c.count || c.count <= 0) return null;
              return (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
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

/**
 * Client services this browser plugin reads off the client `ctx`. Cordis
 * inject-gates service access: `ctx.slots` is only readable once `slots` is
 * declared here. The `conversation.*` dock slots we register into are declared
 * by `@deepseek-ai/dsh-client-ui-conversation` (a load-order edge carried by
 * this package's `dsh.client.inject`), so `slots` is all the runtime services
 * this widget needs.
 */
export const inject = ["slots"];

export function apply(ctx: any): void {
  // dsh client host: a Cordis context with the injected `slots` service.
  // Cordis inject-gates EVERY property read on the ctx proxy, so we must not
  // probe host-specific properties (e.g. registerChatFooter) on it — that
  // throws "cannot get property … without inject". The `slots` branch is the
  // canonical dsh path and is mutually exclusive with the Cairn `ui` path.
  if (ctx?.slots?.inject) {
    ctx.slots.inject("conversation.composer.dock", () =>
      ctx.slots.register({ name: "conversation.composer.dock", id: "context-ring", order: 5 }, ContextRingWidget)
    );
    ctx.slots.inject("conversation.input.dock", () =>
      ctx.slots.register({ name: "conversation.input.dock", id: "context-ring", order: 5 }, ContextRingWidget)
    );
    return;
  }

  // A slots-capable host without the inject() layering (register directly).
  if (ctx?.slots?.register) {
    ctx.slots.register({ name: "conversation.composer.dock", id: "context-ring", order: 5 }, ContextRingWidget);
    return;
  }

  // Cairn `ui` API host: a plain object (not a Cordis proxy), so probing
  // registerChatFooter is safe here.
  if (typeof ctx?.registerChatFooter === "function") {
    ctx.registerChatFooter("context-ring", ContextRingWidget, 5);
  }
}

export function activate(ui: any): void {
  apply(ui);
}

export default {
  inject,
  apply,
  activate,
  ContextRing,
  ContextRingWidget,
};
