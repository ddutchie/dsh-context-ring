import React from "react";
import { ContextRing, type ContextRingProps } from "./ContextRing.js";

export * from "./ContextRing.js";

/**
 * Standard DSH / Cairn client entry point.
 */
export function apply(ctx: any): void {
  if (ctx && typeof ctx.slot === "function") {
    ctx.slot({
      id: "context-ring",
      order: 10,
      render: (props: any) => React.createElement(ContextRing, props),
    });
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
