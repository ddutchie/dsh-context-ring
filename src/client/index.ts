import React from "react";
import { ContextRing, type ContextRingProps } from "./ContextRing.js";

export * from "./ContextRing.js";

/**
 * Standard DSH / Cairn client entry point.
 * Registers the Context Ring badge into the chat footer / composer dock slot.
 */
export function apply(ctx: any): void {
  const ContextRingWidget = (props: any) => {
    const usage = props?.usage;
    if (!usage || !usage.promptTokens) return null;

    return React.createElement(
      "div",
      {
        className: "flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--surface-2,rgba(128,128,128,0.1))] border border-[var(--border,rgba(128,128,128,0.2))] text-xs font-mono text-[var(--text-secondary,#888)] shadow-sm",
        style: { fontSize: "0.75rem" },
      },
      React.createElement(ContextRing, { usage, size: 16, strokeWidth: 2.5 }),
      React.createElement(
        "span",
        { className: "font-semibold text-[var(--text-primary,#fff)]" },
        (usage.promptTokens || 0).toLocaleString() + " tokens"
      ),
      usage.costUsd != null && usage.costUsd > 0
        ? React.createElement("span", { className: "text-[var(--text-tertiary,#666)]" }, " · $" + Number(usage.costUsd).toFixed(4))
        : null
    );
  };

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
};
