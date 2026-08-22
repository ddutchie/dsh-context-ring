import { describe, it, expect, vi } from "vitest";
import { Context } from "@deepseek-ai/cordis";
import { ContextRingService, contextRingPlugin } from "../src/index.js";

describe("dsh-context-ring cordis plugin", () => {
  it("registers ContextRingService and emits context-ring/update on session events", async () => {
    const ctx = new Context();
    await ctx.plugin(ContextRingService);

    expect(ctx.contextRing).toBeDefined();

    const mockSession = { id: "test-session-1" } as any;
    const updateHandler = vi.fn();
    ctx.on("context-ring/update", updateHandler);

    ctx.emit("session/event", mockSession, {
      type: "request/header",
      data: {
        header: {
          system: "Test system prompt",
          tools: [{ name: "test_tool" }],
        },
      },
    } as any);

    expect(updateHandler).toHaveBeenCalledTimes(1);
    const [sess, usage] = updateHandler.mock.calls[0];
    expect(sess.id).toBe("test-session-1");
    expect(usage.breakdown.systemPrompt).toBeGreaterThan(0);
    expect(usage.breakdown.tools).toBeGreaterThan(0);

    const storedUsage = ctx.contextRing.getUsage("test-session-1");
    expect(storedUsage).toEqual(usage);
  });
});
