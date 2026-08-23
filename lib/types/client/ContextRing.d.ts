import React from "react";
import type { ContextRingUsage } from "../types.js";
/** One coloured slice of the filled arc. Hosts can pass their own ordered set. */
export interface ContextRingCategory {
    /** Stable key (used as React key). */
    key: string;
    /** Token count for this slice. */
    value: number;
    /** Any CSS colour (hex, rgb, or a CSS var like `var(--accent)`). */
    color: string;
}
export interface ContextRingProps {
    usage?: ContextRingUsage;
    size?: number;
    strokeWidth?: number;
    className?: string;
    /**
     * Explicit ordered breakdown slices. When omitted, the component derives the
     * default 5 slices (system/tools/skills/toolOutputs/conversation) from
     * `usage.breakdown` — so DSH and simple hosts need pass nothing. A richer host
     * (e.g. one with rules/MCP/subagent-definition buckets) supplies its own
     * ordered list here; the ring renders exactly those, in order.
     */
    categories?: ContextRingCategory[];
    /**
     * Colour of the FILLED arc. A string sets a fixed colour; a function receives
     * the fill fraction (0–1) so a host can threshold (e.g. warn/danger as the
     * window fills). When omitted, each slice keeps its own `color` (breakdown
     * mode). When provided, the whole filled arc uses this single colour
     * (fill-gauge mode) — the breakdown then lives only in the popover.
     */
    fillColor?: string | ((fillFraction: number) => string);
    colors?: {
        system?: string;
        tools?: string;
        skills?: string;
        toolOutputs?: string;
        conversation?: string;
        track?: string;
    };
}
export declare const ContextRing: React.FC<ContextRingProps>;
//# sourceMappingURL=ContextRing.d.ts.map