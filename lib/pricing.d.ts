import type { ModelPricingRate } from "./types.js";
export declare const DEFAULT_MODEL_PRICING: Record<string, ModelPricingRate>;
export declare function calculateTokenCost(usage: {
    promptTokens: number;
    completionTokens: number;
    cacheReadTokens?: number;
    cacheCreationTokens?: number;
}, rate?: ModelPricingRate): {
    costUsd: number;
    isEstimated: boolean;
} | undefined;
//# sourceMappingURL=pricing.d.ts.map