import { describe, it, expect } from "vitest";
import { foldSessionUsage } from "../src/projection.js";

describe("dsh-context-ring projection", () => {
  it("folds basic session usage and calculates correct breakdown", () => {
    const events = [
      {
        type: "request/header",
        data: {
          header: {
            system: "You are an assistant.",
            tools: [{ name: "read_file", parameters: { type: "object" } }],
            config: { model: "deepseek-chat" },
          },
        },
      },
      {
        type: "user/message",
        data: {
          content: [{ type: "text", text: "Hello, world!" }],
          source: { kind: "user" },
        },
      },
      {
        type: "assistant/message",
        data: {
          usage: { inputTokens: 500, outputTokens: 50, reasoningTokens: 20 },
          message: {
            content: [{ type: "text", text: "Hi there!" }],
            source: { model: "deepseek-chat" },
          },
        },
      },
    ];

    const usage = foldSessionUsage(events);
    expect(usage).toBeDefined();
    expect(usage?.promptTokens).toBe(500);
    expect(usage?.completionTokens).toBe(50);
    expect(usage?.reasoningTokens).toBe(20);
    expect(usage?.breakdown.systemPrompt).toBeGreaterThan(0);
    expect(usage?.breakdown.tools).toBeGreaterThan(0);
    expect(usage?.breakdown.conversation).toBeGreaterThan(0);
  });

  it("does not accumulate per-request system/tools across turns (conversation stays non-zero)", () => {
    // Regression: system prompt + tool schemas are the SAME per-request block
    // resent each turn. Summing them across N request/headers over-counts and
    // drives the conversation remainder negative → clamped to 0. A big tool
    // array resent 6 times must not exceed the real prompt-token total.
    const bigTools = Array.from({ length: 56 }, (_, i) => ({
      name: `tool_${i}`,
      description: "x".repeat(400),
      parameters: { type: "object", properties: {} },
    }));
    const header = {
      type: "request/header",
      data: { header: { system: "S".repeat(1378), tools: bigTools, config: { model: "deepseek-chat" } } },
    };
    const toolResult = {
      type: "tool/result",
      data: { message: { content: [{ type: "text", text: "R".repeat(4700) }] } },
    };
    const events: Array<{ type: string; data?: unknown }> = [];
    // Six turns, each resending the identical header + a real prompt-token count.
    for (let turn = 0; turn < 6; turn++) {
      events.push(header);
      if (turn === 2) events.push(toolResult);
      events.push({
        type: "assistant/chunk",
        data: { chunk: { type: "usage", usage: { inputTokens: 9519, outputTokens: 32 } } },
      });
    }

    const usage = foldSessionUsage(events);
    expect(usage?.promptTokens).toBe(9519);
    const b = usage!.breakdown;
    // Latest-header accounting: tools reflect ONE header (~6.6K), not 6×.
    expect(b.tools).toBeLessThan(9519);
    expect(b.systemPrompt).toBeGreaterThan(0);
    expect(b.toolOutputs).toBeGreaterThan(0);
    // The previously-broken bucket: conversation must not be starved to 0.
    expect(b.conversation).toBeGreaterThan(0);
    // Buckets should reconcile to the real prompt total (no massive overshoot).
    expect(b.systemPrompt + b.tools + b.skills + b.toolOutputs + b.conversation).toBe(9519);
  });
});
