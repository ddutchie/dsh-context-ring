import React from "react";
import { type ContextRingProps } from "./ContextRing.js";
import type { ContextRingUsage } from "../types.js";
export * from "./ContextRing.js";
export declare const ContextRingWidget: React.FC<{
    usage?: ContextRingUsage;
}>;
export declare function apply(ctx: any): void;
export declare function activate(ui: any): void;
declare const _default: {
    apply: typeof apply;
    activate: typeof activate;
    ContextRing: React.FC<ContextRingProps>;
    ContextRingWidget: React.FC<{
        usage?: ContextRingUsage;
    }>;
};
export default _default;
//# sourceMappingURL=index.d.ts.map