import React, { useMemo } from "react";
import type { ContextRingUsage, ContextRingBreakdown } from "../types.js";

export interface ContextRingProps {
  usage?: ContextRingUsage;
  size?: number;
  strokeWidth?: number;
  className?: string;
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
  track: "rgba(128, 128, 128, 0.15)",
};

export const ContextRing: React.FC<ContextRingProps> = ({
  usage,
  size = 28,
  strokeWidth = 3,
  className,
  colors = DEFAULT_COLORS,
}) => {
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  const segments = useMemo(() => {
    if (!usage || !usage.breakdown || usage.promptTokens <= 0) return [];
    const b = usage.breakdown;
    const total = usage.promptTokens;

    const items: Array<{ key: keyof ContextRingBreakdown; color: string; value: number }> = [
      { key: "systemPrompt", color: colors.system ?? DEFAULT_COLORS.system, value: b.systemPrompt },
      { key: "tools", color: colors.tools ?? DEFAULT_COLORS.tools, value: b.tools },
      { key: "skills", color: colors.skills ?? DEFAULT_COLORS.skills, value: b.skills },
      { key: "toolOutputs", color: colors.toolOutputs ?? DEFAULT_COLORS.toolOutputs, value: b.toolOutputs },
      { key: "conversation", color: colors.conversation ?? DEFAULT_COLORS.conversation, value: b.conversation },
    ];

    let currentOffset = 0;
    return items
      .filter((item) => item.value > 0)
      .map((item) => {
        const ratio = item.value / total;
        const length = ratio * circumference;
        const offset = currentOffset;
        currentOffset += length;
        return {
          key: item.key,
          color: item.color,
          dashArray: `${length} ${circumference - length}`,
          dashOffset: -offset,
        };
      });
  }, [usage, circumference, colors]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} style={{ transform: "rotate(-90deg)" }}>
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
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.3s ease, stroke-dashoffset 0.3s ease" }}
        />
      ))}
    </svg>
  );
};
