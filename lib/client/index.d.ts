import React from "react";
import { type ContextRingProps } from "./ContextRing.js";
import type { ContextRingUsage } from "../types.js";
export * from "./ContextRing.js";
export interface ContextRingWidgetProps {
    usage?: ContextRingUsage;
    useProjection?: (key: string) => any;
    useSession?: (selector: (state: any) => any) => any;
    t?: (key: string, args?: any) => string;
}
export declare const ContextRingWidget: React.FC<ContextRingWidgetProps>;
export declare function apply(ctx: any): void;
export declare function activate(ui: any): void;
declare const _default: {
    apply: typeof apply;
    activate: typeof activate;
    ContextRing: React.FC<ContextRingProps>;
    ContextRingWidget: React.FC<ContextRingWidgetProps>;
};
export default _default;
//# sourceMappingURL=index.d.ts.map