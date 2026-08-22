import type { ContextRingUsage, ContextRingBreakdown, ModelPricingRate } from "./types.js";
import { calculateTokenCost, DEFAULT_MODEL_PRICING } from "./pricing.js";

const CHARS_PER_TOKEN = 3.8;

function estimateTokens(text: string | undefined): number {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export function foldSessionUsage(
  events: Array<{ type: string; data?: unknown; surfaceOp?: unknown }>,
  pricingLookup?: (model: string) => ModelPricingRate | undefined,
): ContextRingUsage | undefined {
  let promptTokens = 0;
  let completionTokens = 0;
  let reasoningTokens: number | undefined = undefined;
  let cacheReadTokens: number | undefined = undefined;
  let cacheCreationTokens: number | undefined = undefined;
  let costUsd: number | undefined = undefined;
  let modelName = "";

  let systemPromptChars = 0;
  let toolsChars = 0;
  let skillsChars = 0;
  let toolOutputsChars = 0;
  let conversationChars = 0;

  for (const ev of events) {
    if (ev.type === "request/header") {
      const d = ev.data as {
        header?: {
          system?: string;
          tools?: Array<Record<string, unknown>>;
          config?: { model?: string };
        };
      };
      if (d?.header?.config?.model) modelName = d.header.config.model;
      if (d?.header?.system) systemPromptChars += d.header.system.length;
      if (Array.isArray(d?.header?.tools)) {
        toolsChars += JSON.stringify(d.header.tools).length;
      }
    }

    if (ev.type === "user/message") {
      const d = ev.data as {
        content?: Array<{ type: string; text?: string }>;
        source?: { kind?: string; plugin?: string; form?: string };
      };
      const text = (d?.content ?? []).filter((b) => b.type === "text" && b.text).map((b) => b.text).join("");
      if (d?.source?.kind === "plugin" && d?.source?.plugin?.includes("skill")) {
        skillsChars += text.length;
      } else if (d?.source?.kind === "plugin" || d?.source?.form === "snapshot") {
        systemPromptChars += text.length;
      } else {
        conversationChars += text.length;
      }
    }

    if (ev.type === "tool/result") {
      const msg = (ev.data as { message?: { content?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }> } })?.message;
      const text = (msg?.content ?? []).flatMap((c) => c.content ?? []).filter((b) => b.type === "text" && b.text).map((b) => b.text).join("");
      toolOutputsChars += text.length;
    }

    if (ev.type === "assistant/message") {
      const d = ev.data as {
        usage?: {
          inputTokens?: number;
          outputTokens?: number;
          reasoningTokens?: number;
          cacheReadTokens?: number;
          cacheCreationTokens?: number;
          costUsd?: number;
        };
        message?: {
          content?: Array<{ type: string; text?: string }>;
          source?: { model?: string };
        };
      };
      if (d?.message?.source?.model) modelName = d.message.source.model;
      if (d?.usage) {
        if (d.usage.inputTokens) promptTokens = Math.max(promptTokens, d.usage.inputTokens);
        if (d.usage.outputTokens) completionTokens += d.usage.outputTokens;
        if (d.usage.reasoningTokens) reasoningTokens = (reasoningTokens ?? 0) + d.usage.reasoningTokens;
        if (d.usage.cacheReadTokens) cacheReadTokens = (cacheReadTokens ?? 0) + d.usage.cacheReadTokens;
        if (d.usage.cacheCreationTokens) cacheCreationTokens = (cacheCreationTokens ?? 0) + d.usage.cacheCreationTokens;
        if (d.usage.costUsd) costUsd = (costUsd ?? 0) + d.usage.costUsd;
      }
      const text = (d?.message?.content ?? []).filter((b) => b.type === "text" || b.type === "reasoning").map((b) => b.text ?? "").join("");
      conversationChars += text.length;
    }
  }

  const estSystem = estimateTokens(systemPromptChars > 0 ? "x".repeat(systemPromptChars) : undefined);
  const estTools = estimateTokens(toolsChars > 0 ? "x".repeat(toolsChars) : undefined);
  const estSkills = estimateTokens(skillsChars > 0 ? "x".repeat(skillsChars) : undefined);
  const estToolOutputs = estimateTokens(toolOutputsChars > 0 ? "x".repeat(toolOutputsChars) : undefined);
  const estConversation = estimateTokens(conversationChars > 0 ? "x".repeat(conversationChars) : undefined);

  let breakdown: ContextRingBreakdown;
  const totalEstimatedPrompt = estSystem + estTools + estSkills + estToolOutputs + estConversation;

  if (promptTokens > 0 && totalEstimatedPrompt > 0) {
    const scale = promptTokens / totalEstimatedPrompt;
    breakdown = {
      systemPrompt: Math.round(estSystem * scale),
      tools: Math.round(estTools * scale),
      skills: Math.round(estSkills * scale),
      toolOutputs: Math.round(estToolOutputs * scale),
      conversation: Math.max(0, promptTokens - Math.round((estSystem + estTools + estSkills + estToolOutputs) * scale)),
    };
  } else {
    breakdown = {
      systemPrompt: estSystem,
      tools: estTools,
      skills: estSkills,
      toolOutputs: estToolOutputs,
      conversation: estConversation,
    };
    if (promptTokens === 0) promptTokens = totalEstimatedPrompt;
  }

  if (costUsd === undefined && modelName) {
    const rate = (pricingLookup ? pricingLookup(modelName) : undefined) ?? DEFAULT_MODEL_PRICING[modelName];
    if (rate) {
      const est = calculateTokenCost({ promptTokens, completionTokens, cacheReadTokens, cacheCreationTokens }, rate);
      if (est) costUsd = est.costUsd;
    }
  }

  return {
    promptTokens,
    completionTokens,
    reasoningTokens,
    cacheReadTokens,
    cacheCreationTokens,
    costUsd,
    breakdown,
  };
}
