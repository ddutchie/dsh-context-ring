"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.tsx
var client_exports = {};
__export(client_exports, {
  ContextRing: () => ContextRing,
  ContextRingWidget: () => ContextRingWidget,
  activate: () => activate,
  apply: () => apply,
  default: () => client_default
});
module.exports = __toCommonJS(client_exports);
var import_react2 = require("react");

// src/client/ContextRing.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var DEFAULT_COLORS = {
  system: "#6366f1",
  tools: "#8b5cf6",
  skills: "#ec4899",
  toolOutputs: "#06b6d4",
  conversation: "#22c55e",
  track: "rgba(128, 128, 128, 0.2)"
};
var ContextRing = ({
  usage,
  size = 20,
  strokeWidth = 2.5,
  className,
  colors = DEFAULT_COLORS
}) => {
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const segments = (0, import_react.useMemo)(() => {
    if (!usage || !usage.promptTokens || usage.promptTokens <= 0) return [];
    const b = usage.breakdown ?? {
      systemPrompt: Math.min(usage.promptTokens, 350),
      tools: Math.min(Math.max(0, usage.promptTokens - 350), 2650),
      skills: 0,
      toolOutputs: 0,
      conversation: Math.max(0, usage.promptTokens - 3e3)
    };
    const total = usage.promptTokens;
    const items = [
      { key: "systemPrompt", color: colors.system ?? DEFAULT_COLORS.system, value: b.systemPrompt },
      { key: "tools", color: colors.tools ?? DEFAULT_COLORS.tools, value: b.tools },
      { key: "skills", color: colors.skills ?? DEFAULT_COLORS.skills, value: b.skills },
      { key: "toolOutputs", color: colors.toolOutputs ?? DEFAULT_COLORS.toolOutputs, value: b.toolOutputs },
      { key: "conversation", color: colors.conversation ?? DEFAULT_COLORS.conversation, value: b.conversation }
    ];
    let currentOffset = 0;
    return items.filter((item) => item.value > 0).map((item) => {
      const ratio = item.value / total;
      const length = Math.max(1, ratio * circumference);
      const offset = currentOffset;
      currentOffset += length;
      return {
        key: item.key,
        color: item.color,
        dashArray: `${length} ${circumference - length}`,
        dashOffset: -offset
      };
    });
  }, [usage, circumference, colors]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { width: size, height: size, viewBox: `0 0 ${size} ${size}`, className, style: { transform: "rotate(-90deg)", flexShrink: 0 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "circle",
      {
        cx: center,
        cy: center,
        r: radius,
        fill: "none",
        stroke: colors.track ?? DEFAULT_COLORS.track,
        strokeWidth
      }
    ),
    segments.map((seg) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "circle",
      {
        cx: center,
        cy: center,
        r: radius,
        fill: "none",
        stroke: seg.color,
        strokeWidth,
        strokeDasharray: seg.dashArray,
        strokeDashoffset: seg.dashOffset,
        style: { transition: "stroke-dasharray 0.3s ease, stroke-dashoffset 0.3s ease" }
      },
      seg.key
    ))
  ] });
};

// src/client/index.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
function formatTokens(num) {
  if (!num) return "0";
  if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toLocaleString();
}
var ContextRingWidget = ({ usage }) => {
  const [open, setOpen] = (0, import_react2.useState)(false);
  const popoverRef = (0, import_react2.useRef)(null);
  (0, import_react2.useEffect)(() => {
    if (!open) return;
    const handleDown = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
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
  const b = usage.breakdown ?? {
    systemPrompt: Math.min(promptTokens, 350),
    tools: Math.min(Math.max(0, promptTokens - 350), 2650),
    skills: 0,
    toolOutputs: 0,
    conversation: Math.max(0, promptTokens - 3e3)
  };
  const categories = [
    { label: "System prompt", count: b.systemPrompt, color: "#6366f1" },
    { label: "Tool definitions", count: b.tools, color: "#8b5cf6" },
    { label: "Skills", count: b.skills, color: "#ec4899" },
    { label: "Tool outputs", count: b.toolOutputs, color: "#06b6d4" },
    { label: "Conversation", count: b.conversation, color: "#22c55e" }
  ];
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "relative inline-flex items-center", ref: popoverRef, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
      "button",
      {
        type: "button",
        onClick: () => setOpen(!open),
        className: "flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--surface-2,rgba(128,128,128,0.1))] hover:bg-[var(--surface-3,rgba(128,128,128,0.18))] border border-[var(--border,rgba(128,128,128,0.2))] text-xs font-mono text-[var(--text-secondary,#aaa)] transition-all cursor-pointer shadow-sm select-none",
        title: "Click to view full context & token breakdown",
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ContextRing, { usage, size: 16, strokeWidth: 2.5 }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "font-semibold text-[var(--text-primary,#eee)]", children: [
            promptTokens.toLocaleString(),
            " tokens"
          ] }),
          costUsd != null && costUsd > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "text-[var(--text-tertiary,#777)]", children: [
            "\xB7 $",
            costUsd < 0.01 ? "<0.01" : costUsd.toFixed(4)
          ] })
        ]
      }
    ),
    open && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
      "div",
      {
        className: "absolute bottom-full mb-2 left-0 z-50 w-72 p-3.5 rounded-xl bg-[var(--surface-1,#18181b)] border border-[var(--border,#27272a)] shadow-2xl text-xs font-sans text-[var(--text-primary,#f4f4f5)]",
        style: { backdropFilter: "blur(12px)" },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex items-center justify-between pb-2 mb-2 border-b border-[var(--border,#27272a)]", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ContextRing, { usage, size: 18, strokeWidth: 3 }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex flex-col", children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "font-semibold text-sm", children: "Context Breakdown" }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "text-[0.7rem] text-[var(--text-tertiary,#71717a)] font-mono", children: [
                  Math.round(promptTokens / (usage.contextLimit || 128e3) * 100),
                  "% Full (~",
                  formatTokens(promptTokens),
                  " / ",
                  formatTokens(usage.contextLimit || 128e3),
                  ")"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "button",
              {
                type: "button",
                onClick: () => setOpen(false),
                className: "text-[var(--text-tertiary,#71717a)] hover:text-[var(--text-primary,#f4f4f5)] p-0.5 rounded cursor-pointer",
                children: "\u2715"
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "w-full h-2 bg-[var(--border,rgba(128,128,128,0.2))] rounded-full overflow-hidden flex mb-3", children: categories.map((c) => {
            const pct = c.count / promptTokens * 100;
            if (pct <= 0) return null;
            return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "div",
              {
                style: { width: `${pct}%`, backgroundColor: c.color },
                className: "h-full",
                title: `${c.label}: ${c.count.toLocaleString()} tokens (${Math.round(pct)}%)`
              },
              c.label
            );
          }) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "space-y-1.5 mb-3 font-mono text-[0.75rem]", children: categories.map((c) => {
            if (c.count <= 0 && c.label === "Skills") return null;
            return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex items-center gap-1.5", children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "w-2 h-2 rounded-sm", style: { backgroundColor: c.color } }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "text-[var(--text-secondary,#a1a1aa)] font-sans", children: c.label })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "font-medium text-[var(--text-primary,#f4f4f5)]", children: formatTokens(c.count) })
            ] }, c.label);
          }) }),
          completionTokens > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "pt-2 border-t border-[var(--border,#27272a)] space-y-1 text-[0.75rem] font-mono", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "text-[var(--text-secondary,#a1a1aa)] font-sans", children: "Output / Completion" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "font-medium", children: formatTokens(completionTokens) })
            ] }),
            reasoningTokens > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex items-center justify-between text-[var(--text-tertiary,#71717a)]", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "font-sans", children: "\u2514 Thinking / Reasoning" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: formatTokens(reasoningTokens) })
            ] })
          ] }),
          (cacheRead > 0 || cacheCreation > 0) && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "pt-2 mt-2 border-t border-[var(--border,#27272a)] flex items-center justify-between text-[0.75rem] font-mono", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "text-[var(--text-secondary,#a1a1aa)] font-sans", children: "Prompt Cache Read" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "text-emerald-400 font-medium", children: [
              formatTokens(cacheRead),
              " tokens"
            ] })
          ] }),
          costUsd != null && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "pt-2 mt-2 border-t border-[var(--border,#27272a)] flex items-center justify-between text-[0.75rem] font-mono", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "text-[var(--text-secondary,#a1a1aa)] font-sans", children: "Turn Cost" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "text-amber-400 font-semibold", children: [
              "$",
              costUsd < 0.01 ? "<0.01" : costUsd.toFixed(4)
            ] })
          ] })
        ]
      }
    )
  ] });
};
function apply(ctx) {
  if (ctx?.slots?.register) {
    ctx.slots.register({ name: "conversation.composer.dock", id: "context-ring", order: 5 }, ContextRingWidget);
  }
  if (ctx?.registerChatFooter) {
    ctx.registerChatFooter("context-ring", ContextRingWidget, 5);
  }
}
function activate(ui) {
  apply(ui);
}
var client_default = {
  apply,
  activate,
  ContextRing,
  ContextRingWidget
};
