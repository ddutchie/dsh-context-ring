import React from "react";
import { type ContextRingProps } from "./ContextRing.js";
export * from "./ContextRing.js";
export interface ContextRingWidgetProps {
    /** DSH session-projection accessor — the sole data source (token-meter views). */
    useProjection?: (key: string) => any;
    useSession?: (selector: (state: any) => any) => any;
    t?: (key: string, args?: any) => string;
}
export declare const ContextRingWidget: React.FC<ContextRingWidgetProps>;
/**
 * Client services this browser plugin reads off the client `ctx`. Cordis
 * inject-gates service access: `ctx.slots` is only readable once `slots` is
 * declared here. The `conversation.*` dock slots we register into are declared
 * by `@deepseek-ai/dsh-client-ui-conversation` (a load-order edge carried by
 * this package's `dsh.client.inject`), so `slots` is all the runtime services
 * this widget needs.
 */
export declare const inject: string[];
export declare function apply(ctx: any): void;
export declare function activate(ui: any): void;
declare const _default: {
    inject: string[];
    apply: typeof apply;
    activate: typeof activate;
    ContextRing: React.FC<ContextRingProps>;
    ContextRingWidget: React.FC<ContextRingWidgetProps>;
};
export default _default;
//# sourceMappingURL=index.d.ts.map