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
/**
 * Host plugin body — the cordis entry point dsh's Loader mounts. Mounting the
 * package (via a roster row / cordis.yml) provides the `contextRing` host
 * projection service and, crucially, lets the client-modules loader discover
 * this package's `dsh.client` declaration and serve its `exports["./client"]`
 * browser bundle. Named exports (`foldSessionUsage`, `ContextRingService`, …)
 * remain available for direct import (e.g. an embedding host like Cairn).
 * @param ctx - the Cordis context the Loader mounts this plugin onto.
 * @param config - optional plugin config (custom pricing lookup).
 */
export function apply(ctx, config = {}) {
    contextRingPlugin(ctx, config);
}
//# sourceMappingURL=index.js.map