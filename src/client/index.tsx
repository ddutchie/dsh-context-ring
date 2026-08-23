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
  /** DSH session-projection accessor — the sole data source (token-meter views). */
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

  // Purely DSH-native: read the token-meter session projections via the
  // standard DSH `useProjection` prop. A host that wants this widget provides
  // these projections (Cairn synthesises the same view shapes from its own
  // usage on its side, so no host-specific code lives here).
  // DSH view shapes (dsh-v0.1.1-rc.2 packages/llm/token-meter):
  //   tokenUsage      → { uncachedInputTokens, outputTokens, cacheReadTokens, cacheWriteTokens }
  //   contextPressure → { contextWindow?, pressureTokens?, projectedTokens? }
  //   contextBreakdown→ { systemTokens, toolsTokens, messageTokens }
  const useProjection = props.useProjection;
  const tokenUsage: any = useProjection ? useProjection("tokenUsage") : undefined;
  const contextPressure: any = useProjection ? useProjection("contextPressure") : undefined;
  const contextBreakdown: any = useProjection ? useProjection("contextBreakdown") : undefined;

  // Prompt (input-side) tokens for THIS/NEXT request: the context-pressure
  // figure (input + cache traffic), else derive from tokenUsage buckets
  // (uncached input + cache read).
  const derivedInput = (tokenUsage?.uncachedInputTokens ?? 0) + (tokenUsage?.cacheReadTokens ?? 0);
  const usage: ContextRingUsage | undefined = (tokenUsage || contextPressure) ? {
    promptTokens: contextPressure?.pressureTokens ?? derivedInput ?? 0,
    completionTokens: tokenUsage?.outputTokens ?? 0,
    cacheReadTokens: tokenUsage?.cacheReadTokens ?? 0,
    cacheCreationTokens: tokenUsage?.cacheWriteTokens ?? 0,
    contextLimit: contextPressure?.contextWindow,
    contextWindow: contextPressure?.contextWindow,
    breakdown: contextBreakdown ? {
      systemPrompt: contextBreakdown.systemTokens ?? 0,
      tools: contextBreakdown.toolsTokens ?? 0,
      skills: 0,
      toolOutputs: 0,
      conversation: contextBreakdown.messageTokens ?? 0,
    } : undefined,
  } : undefined;


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

  // Inline styles only — this bundle runs in hosts WITHOUT Tailwind (the DSH web
  // shell), so utility classes would be inert and the popover would render in
  // normal flow ("pops open") instead of floating.
  //
  // Theme tokens chain across hosts so dark/light follows the host automatically:
  //   1. DSH semantic tokens (--dsw-alias-*) — flip under body[data-ds-dark-theme]
  //   2. Cairn tokens (--surface*, --text-*, --border) — set on <html data-theme>
  //   3. hardcoded fallback (last resort if neither host provides them)
  // Whichever host is active defines its own vars, so the widget re-themes with
  // no host-specific code and no light/dark detection of its own.
  const C = {
    textPrimary: "var(--dsw-alias-label-primary, var(--text-primary, #e6e6e6))",
    textSecondary: "var(--dsw-alias-label-secondary, var(--text-secondary, #a1a1aa))",
    textTertiary: "var(--dsw-alias-label-tertiary, var(--text-tertiary, #71717a))",
    surface: "var(--dsw-alias-bg-base, var(--surface, #18181b))",
    surface2: "var(--dsw-alias-interactive-bg-hover-solid, var(--surface-2, rgba(128,128,128,0.10)))",
    surface3: "var(--dsw-alias-interactive-bg-hover-solid, var(--surface-3, rgba(128,128,128,0.18)))",
    border: "var(--dsw-alias-border-l, var(--border, rgba(128,128,128,0.25)))",
  };
  const row: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between" };
  const label: React.CSSProperties = { color: C.textSecondary };
  const val: React.CSSProperties = { fontWeight: 500, color: C.textPrimary };

  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }} ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title="Click to view full context & token breakdown"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 10px",
          borderRadius: 9999,
          background: C.surface2,
          border: `1px solid ${C.border}`,
          fontSize: "0.75rem",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          color: C.textSecondary,
          cursor: "pointer",
          userSelect: "none",
          lineHeight: 1,
        }}
      >
        <ContextRing usage={usage} size={14} strokeWidth={2.5} />
        <span style={{ fontWeight: 500, color: C.textPrimary }}>
          {formatTokens(promptTokens)}
        </span>
      </button>

      {/* Popover Breakdown Card — floats above the button (position: absolute). */}
      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            marginBottom: 8,
            zIndex: 50,
            width: 288,
            padding: 14,
            borderRadius: 12,
            background: C.surface,
            border: `1px solid ${C.border}`,
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            fontSize: "0.75rem",
            color: C.textPrimary,
            userSelect: "none",
          }}
        >
          {/* Header */}
          <div style={{ ...row, paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontWeight: 600, color: C.textPrimary }}>Context Breakdown</span>
            <span style={{
              fontSize: "0.7rem",
              padding: "2px 6px",
              borderRadius: 4,
              background: C.surface2,
              color: C.textSecondary,
            }}>
              {percentFull}% Full (~{formatTokens(promptTokens)} / {formatTokens(contextLimit)})
            </span>
          </div>

          {/* Breakdown progress bar */}
          <div style={{
            width: "100%",
            height: 6,
            borderRadius: 9999,
            overflow: "hidden",
            display: "flex",
            gap: 2,
            background: "var(--surface-3,#3f3f46)",
            margin: "12px 0",
          }}>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {categories.map((c, i) => {
              if (!c.count || c.count <= 0) return null;
              return (
                <div key={i} style={row}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 9999, flexShrink: 0, backgroundColor: c.color }} />
                    <span style={label}>{c.label}</span>
                  </div>
                  <span style={val}>{formatTokens(c.count)}</span>
                </div>
              );
            })}
          </div>

          {/* Output tokens */}
          {completionTokens > 0 && (
            <div style={{ paddingTop: 8, marginTop: 8, borderTop: "1px solid var(--border,#27272a)", display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={row}>
                <span style={label}>Output / Completion</span>
                <span style={{ fontWeight: 500 }}>{formatTokens(completionTokens)}</span>
              </div>
              {reasoningTokens > 0 && (
                <div style={{ ...row, color: "var(--text-tertiary,#71717a)" }}>
                  <span>└ Thinking / Reasoning</span>
                  <span>{formatTokens(reasoningTokens)}</span>
                </div>
              )}
            </div>
          )}

          {/* Prompt Cache */}
          {(cacheRead > 0 || cacheCreation > 0) && (
            <div style={{ ...row, paddingTop: 8, marginTop: 8, borderTop: "1px solid var(--border,#27272a)" }}>
              <span style={label}>Prompt Cache Read</span>
              <span style={{ color: "#34d399", fontWeight: 500 }}>{formatTokens(cacheRead)} tokens</span>
            </div>
          )}

          {/* Cost */}
          {costUsd != null && (
            <div style={{ ...row, paddingTop: 8, marginTop: 8, borderTop: "1px solid var(--border,#27272a)" }}>
              <span style={label}>Turn Cost</span>
              <span style={{ color: "#fbbf24", fontWeight: 600 }}>${costUsd < 0.01 ? "<0.01" : costUsd.toFixed(4)}</span>
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
    // One home only: the composer dock (the stats-line family), so the ring
    // sits alongside the session token stats. Registering into input.dock too
    // would render the widget twice.
    ctx.slots.inject("conversation.composer.dock", () =>
      ctx.slots.register({ name: "conversation.composer.dock", id: "context-ring", order: 5 }, ContextRingWidget)
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
