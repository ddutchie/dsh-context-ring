export interface ContextRingBreakdown {
    systemPrompt: number;
    tools: number;
    skills: number;
    toolOutputs: number;
    conversation: number;
}
export interface ContextRingUsage {
    promptTokens: number;
    completionTokens: number;
    reasoningTokens?: number;
    cacheReadTokens?: number;
    cacheCreationTokens?: number;
    costUsd?: number;
    costEstimated?: boolean;
    breakdown: ContextRingBreakdown;
}
export interface ModelPricingRate {
    input: number | null;
    output: number | null;
    cacheRead?: number | null;
    cacheWrite?: number | null;
}
export interface ContextRingPluginConfig {
    pricing?: Record<string, ModelPricingRate> | ((model: string) => ModelPricingRate | undefined);
    charsPerToken?: number;
}
//# sourceMappingURL=types.d.ts.map