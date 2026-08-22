"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.ts
var client_exports = {};
__export(client_exports, {
  ContextRing: () => ContextRing,
  activate: () => activate,
  apply: () => apply,
  default: () => client_default
});
module.exports = __toCommonJS(client_exports);
var import_react2 = __toESM(require("react"), 1);

// src/client/ContextRing.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var DEFAULT_COLORS = {
  system: "#6366f1",
  tools: "#8b5cf6",
  skills: "#ec4899",
  toolOutputs: "#06b6d4",
  conversation: "#22c55e",
  track: "rgba(128, 128, 128, 0.15)"
};
var ContextRing = ({
  usage,
  size = 28,
  strokeWidth = 3,
  className,
  colors = DEFAULT_COLORS
}) => {
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const segments = (0, import_react.useMemo)(() => {
    if (!usage || !usage.breakdown || usage.promptTokens <= 0) return [];
    const b = usage.breakdown;
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
      const length = ratio * circumference;
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { width: size, height: size, viewBox: `0 0 ${size} ${size}`, className, style: { transform: "rotate(-90deg)" }, children: [
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
        strokeLinecap: "round",
        style: { transition: "stroke-dasharray 0.3s ease, stroke-dashoffset 0.3s ease" }
      },
      seg.key
    ))
  ] });
};

// src/client/index.ts
function apply(ctx) {
  if (ctx && typeof ctx.slot === "function") {
    ctx.slot({
      id: "context-ring",
      order: 10,
      render: (props) => import_react2.default.createElement(ContextRing, props)
    });
  }
}
function activate(ui) {
  apply(ui);
}
var client_default = {
  apply,
  activate,
  ContextRing
};
