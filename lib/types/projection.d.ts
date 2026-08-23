import type { ContextRingUsage, ModelPricingRate } from "./types.js";
export declare function foldSessionUsage(events: Array<{
    type: string;
    data?: unknown;
    surfaceOp?: unknown;
}>, pricingLookup?: (model: string) => ModelPricingRate | undefined): ContextRingUsage | undefined;
//# sourceMappingURL=projection.d.ts.map