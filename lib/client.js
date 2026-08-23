(function() {
  function factory(require, exports, module) {
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
  default: () => client_default,
  inject: () => inject
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
    const contextLimit = usage.contextLimit || usage.contextWindow || 0;
    const fillFraction = contextLimit > 0 ? Math.min(1, total / contextLimit) : 1;
    const filledArc = fillFraction * circumference;
    const items = [
      { key: "systemPrompt", color: colors.system ?? DEFAULT_COLORS.system, value: b.systemPrompt },
      { key: "tools", color: colors.tools ?? DEFAULT_COLORS.tools, value: b.tools },
      { key: "skills", color: colors.skills ?? DEFAULT_COLORS.skills, value: b.skills },
      { key: "toolOutputs", color: colors.toolOutputs ?? DEFAULT_COLORS.toolOutputs, value: b.toolOutputs },
      { key: "conversation", color: colors.conversation ?? DEFAULT_COLORS.conversation, value: b.conversation }
    ];
    let currentOffset = 0;
    return items.filter((item) => item.value > 0).map((item) => {
      const length = item.value / total * filledArc;
      const offset = currentOffset;
      currentOffset += length;
      return {
        key: item.key,
        color: item.color,
        dashArray: `${length} ${circumference - length}`,
        dashOffset: -offset
      };
    }).filter((seg) => parseFloat(seg.dashArray) > 0);
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
var ContextRingWidget = (props) => {
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
  const useProjection = props.useProjection;
  const tokenUsage = useProjection ? useProjection("tokenUsage") : void 0;
  const contextPressure = useProjection ? useProjection("contextPressure") : void 0;
  const contextBreakdown = useProjection ? useProjection("contextBreakdown") : void 0;
  const derivedInput = (tokenUsage?.uncachedInputTokens ?? 0) + (tokenUsage?.cacheReadTokens ?? 0);
  const usage = tokenUsage || contextPressure ? {
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
      conversation: contextBreakdown.messageTokens ?? 0
    } : void 0
  } : void 0;
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
  const contextLimit = usage.contextLimit || usage.contextWindow || 128e3;
  const percentFull = Math.min(100, Math.round(promptTokens / contextLimit * 100));
  const C = {
    textPrimary: "var(--dsw-alias-label-primary, var(--text-primary, #e6e6e6))",
    textSecondary: "var(--dsw-alias-label-secondary, var(--text-secondary, #a1a1aa))",
    textTertiary: "var(--dsw-alias-label-tertiary, var(--text-tertiary, #71717a))",
    surface: "var(--dsw-alias-bg-base, var(--surface, #18181b))",
    surface2: "var(--dsw-alias-interactive-bg-hover-solid, var(--surface-2, rgba(128,128,128,0.10)))",
    surface3: "var(--dsw-alias-interactive-bg-hover-solid, var(--surface-3, rgba(128,128,128,0.18)))",
    border: "var(--dsw-alias-border-l, var(--border, rgba(128,128,128,0.25)))"
  };
  const row = { display: "flex", alignItems: "center", justifyContent: "space-between" };
  const label = { color: C.textSecondary };
  const val = { fontWeight: 500, color: C.textPrimary };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { position: "relative", display: "inline-flex", alignItems: "center" }, ref: popoverRef, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
      "button",
      {
        type: "button",
        onClick: () => setOpen(!open),
        title: "Click to view full context & token breakdown",
        style: {
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
          lineHeight: 1
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ContextRing, { usage, size: 14, strokeWidth: 2.5 }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { fontWeight: 500, color: C.textPrimary }, children: formatTokens(promptTokens) })
        ]
      }
    ),
    open && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
      "div",
      {
        style: {
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
          userSelect: "none"
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { ...row, paddingBottom: 8, borderBottom: `1px solid ${C.border}` }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { fontWeight: 600, color: C.textPrimary }, children: "Context Breakdown" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { style: {
              fontSize: "0.7rem",
              padding: "2px 6px",
              borderRadius: 4,
              background: C.surface2,
              color: C.textSecondary
            }, children: [
              percentFull,
              "% Full (~",
              formatTokens(promptTokens),
              " / ",
              formatTokens(contextLimit),
              ")"
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: {
            width: "100%",
            height: 6,
            borderRadius: 9999,
            overflow: "hidden",
            display: "flex",
            gap: 2,
            background: "var(--surface-3,#3f3f46)",
            margin: "12px 0"
          }, children: categories.map((c, i) => {
            if (!c.count || c.count <= 0) return null;
            const width = Math.max(1, c.count / promptTokens * 100);
            return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "div",
              {
                style: { width: `${width}%`, backgroundColor: c.color },
                title: `${c.label}: ${formatTokens(c.count)}`
              },
              i
            );
          }) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: categories.map((c, i) => {
            if (!c.count || c.count <= 0) return null;
            return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: row, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { width: 8, height: 8, borderRadius: 9999, flexShrink: 0, backgroundColor: c.color } }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: label, children: c.label })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: val, children: formatTokens(c.count) })
            ] }, i);
          }) }),
          completionTokens > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { paddingTop: 8, marginTop: 8, borderTop: "1px solid var(--border,#27272a)", display: "flex", flexDirection: "column", gap: 4 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: row, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: label, children: "Output / Completion" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { fontWeight: 500 }, children: formatTokens(completionTokens) })
            ] }),
            reasoningTokens > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { ...row, color: "var(--text-tertiary,#71717a)" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u2514 Thinking / Reasoning" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: formatTokens(reasoningTokens) })
            ] })
          ] }),
          (cacheRead > 0 || cacheCreation > 0) && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { ...row, paddingTop: 8, marginTop: 8, borderTop: "1px solid var(--border,#27272a)" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: label, children: "Prompt Cache Read" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { style: { color: "#34d399", fontWeight: 500 }, children: [
              formatTokens(cacheRead),
              " tokens"
            ] })
          ] }),
          costUsd != null && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { ...row, paddingTop: 8, marginTop: 8, borderTop: "1px solid var(--border,#27272a)" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: label, children: "Turn Cost" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { style: { color: "#fbbf24", fontWeight: 600 }, children: [
              "$",
              costUsd < 0.01 ? "<0.01" : costUsd.toFixed(4)
            ] })
          ] })
        ]
      }
    )
  ] });
};
var inject = ["slots"];
function apply(ctx) {
  if (ctx?.slots?.inject) {
    ctx.slots.inject(
      "conversation.composer.dock",
      () => ctx.slots.register({ name: "conversation.composer.dock", id: "context-ring", order: 5 }, ContextRingWidget)
    );
    return;
  }
  if (ctx?.slots?.register) {
    ctx.slots.register({ name: "conversation.composer.dock", id: "context-ring", order: 5 }, ContextRingWidget);
    return;
  }
  if (typeof ctx?.registerChatFooter === "function") {
    ctx.registerChatFooter("context-ring", ContextRingWidget, 5);
  }
}
function activate(ui) {
  apply(ui);
}
var client_default = {
  inject,
  apply,
  activate,
  ContextRing,
  ContextRingWidget
};

    return module.exports;
  }

  // 1. DSH web client module loader:
  if (typeof window !== "undefined" && window.__ModuleLoader__ && typeof window.__ModuleLoader__.load === "function") {
    window.__ModuleLoader__.load({
      id: "dsh-context-ring",
      factory: function(require) {
        var mod = { exports: {} };
        factory(require, mod.exports, mod);
        return mod.exports;
      }
    });
  }

  // 2. CommonJS (Cairn / Node):
  if (typeof module !== "undefined" && module.exports) {
    factory(typeof require === "function" ? require : function() {}, module.exports, module);
  }
})();
