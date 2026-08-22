import type { ModelPricingRate } from "./types.js";

export const DEFAULT_MODEL_PRICING: Record<string, ModelPricingRate> = {
  "deepseek-reasoner": { input: 0.55, output: 2.19, cacheRead: 0.14 },
  "deepseek-chat": { input: 0.27, output: 1.10, cacheRead: 0.07 },
  "deepseek-v3": { input: 0.27, output: 1.10, cacheRead: 0.07 },
  "claude-3-7-sonnet": { input: 3.00, output: 15.00, cacheRead: 0.30, cacheWrite: 3.75 },
  "claude-3-5-sonnet": { input: 3.00, output: 15.00, cacheRead: 0.30, cacheWrite: 3.75 },
  "gpt-4o": { input: 2.50, output: 10.00, cacheRead: 1.25 },
  "gpt-4o-mini": { input: 0.15, output: 0.60, cacheRead: 0.075 },
};

export function calculateTokenCost(
  usage: {
    promptTokens: number;
    completionTokens: number;
    cacheReadTokens?: number;
    cacheCreationTokens?: number;
  },
  rate?: ModelPricingRate,
): { costUsd: number; isEstimated: boolean } | undefined {
  if (!rate || (rate.input == null && rate.output == null)) return undefined;

  const inputRate = rate.input ?? 0;
  const outputRate = rate.output ?? 0;
  const cacheReadRate = rate.cacheRead ?? inputRate;
  const cacheWriteRate = rate.cacheWrite ?? inputRate;

  const cacheRead = usage.cacheReadTokens ?? 0;
  const cacheWrite = usage.cacheCreationTokens ?? 0;
  const standardPrompt = Math.max(0, usage.promptTokens - cacheRead - cacheWrite);

  const promptCost = (standardPrompt / 1_000_000) * inputRate;
  const cacheReadCost = (cacheRead / 1_000_000) * cacheReadRate;
  const cacheWriteCost = (cacheWrite / 1_000_000) * cacheWriteRate;
  const completionCost = (usage.completionTokens / 1_000_000) * outputRate;

  const totalCost = promptCost + cacheReadCost + cacheWriteCost + completionCost;
  return { costUsd: Number(totalCost.toFixed(6)), isEstimated: true };
}
