import { Service, type Context } from "@deepseek-ai/cordis";
import type { Session } from "@deepseek-ai/dsh-session";
import type { ContextRingUsage, ContextRingPluginConfig } from "./types.js";
export * from "./types.js";
export * from "./pricing.js";
export * from "./projection.js";
declare module "@deepseek-ai/cordis" {
    interface Context {
        contextRing: ContextRingService;
    }
    interface Events {
        "context-ring/update": (session: Session, usage: ContextRingUsage) => void;
    }
}
export declare class ContextRingService extends Service {
    config: ContextRingPluginConfig;
    static readonly provide = "contextRing";
    private _sessionEvents;
    private _latestUsage;
    constructor(ctx: Context, config?: ContextRingPluginConfig);
    getUsage(sessionId: string): ContextRingUsage | undefined;
    clear(sessionId: string): void;
}
export declare function contextRingPlugin(ctx: Context, config?: ContextRingPluginConfig): void;
//# sourceMappingURL=index.d.ts.map