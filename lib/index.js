import { Service } from "@deepseek-ai/cordis";
import { foldSessionUsage } from "./projection.js";
export * from "./types.js";
export * from "./pricing.js";
export * from "./projection.js";
export class ContextRingService extends Service {
    config;
    static provide = "contextRing";
    _sessionEvents = new Map();
    _latestUsage = new Map();
    constructor(ctx, config = {}) {
        super(ctx, "contextRing");
        this.config = config;
        ctx.on("session/event", (session, event) => {
            const id = String(session.id);
            let list = this._sessionEvents.get(id);
            if (!list) {
                list = [];
                this._sessionEvents.set(id, list);
            }
            list.push(event);
            const usage = foldSessionUsage(list, typeof config.pricing === "function" ? config.pricing : undefined);
            if (usage) {
                this._latestUsage.set(id, usage);
                ctx.emit("context-ring/update", session, usage);
            }
        });
    }
    getUsage(sessionId) {
        return this._latestUsage.get(sessionId);
    }
    clear(sessionId) {
        this._sessionEvents.delete(sessionId);
        this._latestUsage.delete(sessionId);
    }
}
export function contextRingPlugin(ctx, config = {}) {
    ctx.plugin(ContextRingService, config);
}
//# sourceMappingURL=index.js.map