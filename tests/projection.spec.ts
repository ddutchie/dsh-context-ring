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
});
