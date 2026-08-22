import { Service, type Context } from "@deepseek-ai/cordis";
import type { Session, SessionEvent } from "@deepseek-ai/dsh-session";
import type { ContextRingUsage, ContextRingPluginConfig } from "./types.js";
import { foldSessionUsage } from "./projection.js";

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

export class ContextRingService extends Service {
  static readonly provide = "contextRing";
  private _sessionEvents = new Map<string, SessionEvent[]>();
  private _latestUsage = new Map<string, ContextRingUsage>();

  constructor(ctx: Context, public config: ContextRingPluginConfig = {}) {
    super(ctx, "contextRing");

    ctx.on("session/event", (session: Session, event: SessionEvent) => {
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

  public getUsage(sessionId: string): ContextRingUsage | undefined {
    return this._latestUsage.get(sessionId);
  }

  public clear(sessionId: string): void {
    this._sessionEvents.delete(sessionId);
    this._latestUsage.delete(sessionId);
  }
}

export function contextRingPlugin(ctx: Context, config: ContextRingPluginConfig = {}): void {
  ctx.plugin(ContextRingService, config);
}
