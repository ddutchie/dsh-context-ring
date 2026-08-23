import React, { useMemo } from "react";
import type { ContextRingUsage, ContextRingBreakdown } from "../types.js";

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

const DEFAULT_COLORS = {
  system: "#6366f1",
  tools: "#8b5cf6",
  skills: "#ec4899",
  toolOutputs: "#06b6d4",
  conversation: "#22c55e",
  track: "rgba(128, 128, 128, 0.2)",
};

/** Derive the default 5-slice breakdown from usage (DSH / simple hosts). */
function defaultCategories(usage: ContextRingUsage, colors: NonNullable<ContextRingProps["colors"]>): ContextRingCategory[] {
  const b: ContextRingBreakdown = usage.breakdown ?? {
    systemPrompt: Math.min(usage.promptTokens, 350),
    tools: Math.min(Math.max(0, usage.promptTokens - 350), 2650),
    skills: 0,
    toolOutputs: 0,
    conversation: Math.max(0, usage.promptTokens - 3000),
  };
  return [
    { key: "systemPrompt", color: colors.system ?? DEFAULT_COLORS.system, value: b.systemPrompt },
    { key: "tools", color: colors.tools ?? DEFAULT_COLORS.tools, value: b.tools },
    { key: "skills", color: colors.skills ?? DEFAULT_COLORS.skills, value: b.skills },
    { key: "toolOutputs", color: colors.toolOutputs ?? DEFAULT_COLORS.toolOutputs, value: b.toolOutputs },
    { key: "conversation", color: colors.conversation ?? DEFAULT_COLORS.conversation, value: b.conversation },
  ];
}

export const ContextRing: React.FC<ContextRingProps> = ({
  usage,
  size = 20,
  strokeWidth = 2.5,
  className,
  categories,
  fillColor,
  colors = DEFAULT_COLORS,
}) => {
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  const segments = useMemo(() => {
    if (!usage || !usage.promptTokens || usage.promptTokens <= 0) return [];
    const total = usage.promptTokens;

    // The ring is a FILL gauge: the arc length represents how full the context
    // window is (promptTokens / contextLimit), not the breakdown as a whole
    // circle. The filled arc is then SUBDIVIDED by the breakdown proportions so
    // the same glyph shows both "how full" and "made of what"; the remainder
    // stays as the empty track. Falls back to a full ring only if no limit.
    const contextLimit = usage.contextLimit || usage.contextWindow || 0;
    const fillFraction = contextLimit > 0 ? Math.min(1, total / contextLimit) : 1;
    const filledArc = fillFraction * circumference;

    // A fixed/threshold fill colour overrides per-slice colours (fill-gauge mode).
    const solid = typeof fillColor === "function" ? fillColor(fillFraction)
      : typeof fillColor === "string" ? fillColor
      : undefined;

    const items = (categories ?? defaultCategories(usage, colors));

    let currentOffset = 0;
    return items
      .filter((item) => item.value > 0)
      .map((item) => {
        // Each slice takes its share OF THE FILLED ARC (value/total), scaled by
        // the fill fraction — so the coloured segments together span exactly
        // `filledArc`, and the rest of the circle is the empty track.
        const length = (item.value / total) * filledArc;
        const offset = currentOffset;
        currentOffset += length;
        return {
          key: item.key,
          color: solid ?? item.color,
          dashArray: `${length} ${circumference - length}`,
          dashOffset: -offset,
        };
      })
      .filter((seg) => parseFloat(seg.dashArray) > 0);
  }, [usage, circumference, categories, fillColor, colors]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={colors.track ?? DEFAULT_COLORS.track}
        strokeWidth={strokeWidth}
      />
      {segments.map((seg) => (
        <circle
          key={seg.key}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={seg.color}
          strokeWidth={strokeWidth}
          strokeDasharray={seg.dashArray}
          strokeDashoffset={seg.dashOffset}
          style={{ transition: "stroke-dasharray 0.3s ease, stroke-dashoffset 0.3s ease" }}
        />
      ))}
    </svg>
  );
};
