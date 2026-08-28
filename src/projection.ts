import type { ContextRingUsage, ContextRingBreakdown, ModelPricingRate } from "./types.js";
import { calculateTokenCost, DEFAULT_MODEL_PRICING, DEFAULT_MODEL_CONTEXT_LIMITS } from "./pricing.js";

// Vendored from scratch/dsh-repo/packages/llm/token-meter/src/estimate.ts so
// Cairn and harness share the same heuristic (CHARS_PER_TOKEN=4, BLOCK/ROLE overhead).
const CHARS_PER_TOKEN = 4;
const BLOCK_OVERHEAD = 4;
const ROLE_OVERHEAD = 4;

function estimateSystemTokensFromChars(chars: number): number {
  if (chars <= 0) return 0;
  return Math.ceil(chars / CHARS_PER_TOKEN) + ROLE_OVERHEAD;
}
function estimateToolsTokensFromChars(chars: number): number {
  if (chars <= 0) return 0;
  return Math.ceil(chars / CHARS_PER_TOKEN) + BLOCK_OVERHEAD;
}

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
  let contextWindow: number | undefined = undefined;
  let hasUsage = false;

  // System prompt and tool definitions are FIXED per-request context — the same
  // block is resent on every turn, not accumulated. Summing them across every
  // `request/header` massively over-counts (e.g. a 26 KB tool array × 6 turns →
  // ~40K "tool" tokens on a 9.5K-token prompt), which then drives the
  // `conversation` remainder negative and clamps it to 0. Track the LATEST
  // request header's system + tools instead (last-write-wins), and likewise let
  // recurring plugin/snapshot system injections win rather than sum. Only the
  // genuinely growing buckets — tool outputs and real conversation — accumulate.
  let headerSystemChars = 0;
  let headerToolsChars = 0;
  let pluginSystemChars = 0;
  let skillsChars = 0;
  let toolOutputsChars = 0;
  let conversationChars = 0;

  for (const ev of events) {
    if (ev.type === "request/context") {
      const d = ev.data as { contextWindow?: number; model?: string; provider?: string } | undefined;
      if (typeof d?.contextWindow === "number" && d.contextWindow > 0) contextWindow = d.contextWindow;
      if (d?.model) modelName = d.model;
    }

    if (ev.type === "request/header") {
      const d = ev.data as {
        header?: {
          system?: string;
          tools?: Array<Record<string, unknown>>;
          config?: { model?: string };
        };
      };
      if (d?.header?.config?.model) modelName = d.header.config.model;
      // Latest header wins — the system prompt and tool schemas are the same
      // per-request payload each turn, so the newest header reflects what the
      // NEXT request actually carries (also the correct value mid-compaction).
      if (typeof d?.header?.system === "string") headerSystemChars = d.header.system.length;
      if (Array.isArray(d?.header?.tools)) {
        headerToolsChars = JSON.stringify(d.header.tools).length;
      }
    }

    if (ev.type === "user/message") {
      const d = ev.data as {
        content?: Array<{ type: string; text?: string }>;
        source?: { kind?: string; plugin?: string; form?: string };
      };
      const text = (d?.content ?? []).filter((b) => b.type === "text" && b.text).map((b) => b.text).join("");
      if (d?.source?.kind === "plugin" && d?.source?.plugin?.includes("skill")) {
        // Skill catalog / injected skills are re-sent context — latest wins.
        skillsChars = Math.max(skillsChars, text.length);
      } else if (d?.source?.kind === "plugin" || d?.source?.form === "snapshot") {
        // Snapshot / plugin system injections are per-request context, not
        // cumulative conversation. Keep the largest seen so a compacted turn
        // doesn't undercount.
        pluginSystemChars = Math.max(pluginSystemChars, text.length);
      } else {
        conversationChars += text.length;
      }
    }

    if (ev.type === "tool/result") {
      const d = ev.data as {
        message?: { content?: Array<{ type?: string; text?: string; content?: Array<{ type?: string; text?: string }> }> };
        error?: { message?: string };
      } | undefined;
      const blocks = d?.message?.content ?? [];
      for (const block of blocks) {
        if (typeof block.text === "string") toolOutputsChars += block.text.length;
        if (Array.isArray(block.content)) {
          for (const sub of block.content) {
            if (sub && typeof sub.text === "string") toolOutputsChars += sub.text.length;
          }
        }
      }
      if (d?.error?.message) {
        toolOutputsChars += d.error.message.length;
      }
    }

    if (ev.type === "assistant/chunk") {
      const chunk = (ev.data as {
        chunk?: {
          type?: string;
          usage?: {
            inputTokens?: number;
            promptTokens?: number;
            outputTokens?: number;
            completionTokens?: number;
            reasoningTokens?: number;
            cacheReadTokens?: number;
            cacheWriteTokens?: number;
            cachedTokens?: number;
            costUsd?: number;
          };
        };
      } | undefined)?.chunk;

      if (chunk?.type === "usage" && chunk.usage) {
        hasUsage = true;
        const u = chunk.usage;
        if (typeof u.inputTokens === "number" && u.inputTokens > 0) promptTokens = Math.max(promptTokens, u.inputTokens);
        else if (typeof u.promptTokens === "number" && u.promptTokens > 0) promptTokens = Math.max(promptTokens, u.promptTokens);

        if (typeof u.outputTokens === "number") completionTokens += u.outputTokens;
        else if (typeof u.completionTokens === "number") completionTokens += u.completionTokens;

        if (typeof u.reasoningTokens === "number") reasoningTokens = (reasoningTokens ?? 0) + u.reasoningTokens;
        if (typeof u.cacheReadTokens === "number") cacheReadTokens = (cacheReadTokens ?? 0) + u.cacheReadTokens;
        else if (typeof u.cachedTokens === "number") cacheReadTokens = (cacheReadTokens ?? 0) + u.cachedTokens;
        if (typeof u.cacheWriteTokens === "number") cacheCreationTokens = (cacheCreationTokens ?? 0) + u.cacheWriteTokens;
        if (typeof u.costUsd === "number") costUsd = (costUsd ?? 0) + u.costUsd;
      }
    }

    if (ev.type === "assistant/message") {
      const d = ev.data as {
        usage?: Record<string, unknown>;
        message?: {
          content?: Array<{ type: string; text?: string }>;
          usage?: Record<string, unknown>;
          source?: { model?: string };
        };
      };
      if (d?.message?.source?.model) modelName = d.message.source.model;
      const u = (d?.message?.usage ?? d?.usage) as {
        inputTokens?: number;
        promptTokens?: number;
        outputTokens?: number;
        completionTokens?: number;
        reasoningTokens?: number;
        cacheReadTokens?: number;
        cacheWriteTokens?: number;
        cachedTokens?: number;
        costUsd?: number;
      } | undefined;

      if (u) {
        hasUsage = true;
        if (typeof u.inputTokens === "number" && u.inputTokens > 0) promptTokens = Math.max(promptTokens, u.inputTokens);
        else if (typeof u.promptTokens === "number" && u.promptTokens > 0) promptTokens = Math.max(promptTokens, u.promptTokens);

        if (typeof u.outputTokens === "number") completionTokens = Math.max(completionTokens, u.outputTokens);
        else if (typeof u.completionTokens === "number") completionTokens = Math.max(completionTokens, u.completionTokens);

        if (typeof u.reasoningTokens === "number") reasoningTokens = Math.max(reasoningTokens ?? 0, u.reasoningTokens);
        if (typeof u.cacheReadTokens === "number") cacheReadTokens = Math.max(cacheReadTokens ?? 0, u.cacheReadTokens);
        else if (typeof u.cachedTokens === "number") cacheReadTokens = Math.max(cacheReadTokens ?? 0, u.cachedTokens);
        if (typeof u.cacheWriteTokens === "number") cacheCreationTokens = Math.max(cacheCreationTokens ?? 0, u.cacheWriteTokens);
        if (typeof u.costUsd === "number") costUsd = u.costUsd;
      }

      const text = (d?.message?.content ?? []).filter((b) => b.type === "text" || b.type === "reasoning").map((b) => b.text ?? "").join("");
      conversationChars += text.length;
    }
  }

  const systemPromptChars = headerSystemChars + pluginSystemChars;
  const toolsChars = headerToolsChars;

  const estToolOutputs = Math.round(toolOutputsChars / CHARS_PER_TOKEN);
  const estSkills = Math.round(skillsChars / CHARS_PER_TOKEN);
  const estSystem = systemPromptChars > 0 ? estimateSystemTokensFromChars(systemPromptChars) : Math.min(promptTokens > 0 ? promptTokens : 350, 350);
  const estTools = toolsChars > 0 ? estimateToolsTokensFromChars(toolsChars) : Math.min(Math.max(0, (promptTokens > 0 ? promptTokens : 3000) - estSystem), 2650);
  const rawConversation = Math.round(conversationChars / CHARS_PER_TOKEN);
  const remaining = promptTokens > 0 ? promptTokens - estSystem - estTools - estSkills - estToolOutputs : 0;
  const estConversation = promptTokens > 0
    ? Math.min(Math.max(rawConversation, Math.max(0, remaining)), promptTokens)
    : rawConversation;

  if (promptTokens === 0) {
    promptTokens = estSystem + estTools + estSkills + estToolOutputs + estConversation;
  }

  const breakdown: ContextRingBreakdown = {
    systemPrompt: estSystem,
    tools: estTools,
    skills: estSkills,
    toolOutputs: estToolOutputs,
    conversation: estConversation,
  };

  if (!hasUsage && promptTokens === 0 && completionTokens === 0 && events.length === 0) {
    return undefined;
  }

  if (costUsd === undefined && modelName) {
    const rate = (pricingLookup ? pricingLookup(modelName) : undefined) ?? DEFAULT_MODEL_PRICING[modelName];
    if (rate) {
      const est = calculateTokenCost({ promptTokens, completionTokens, cacheReadTokens, cacheCreationTokens }, rate);
      if (est) costUsd = est.costUsd;
    }
  }

  const contextLimit = contextWindow ?? (modelName ? DEFAULT_MODEL_CONTEXT_LIMITS[modelName] : undefined) ?? 128_000;

  return {
    promptTokens,
    completionTokens,
    reasoningTokens,
    cacheReadTokens,
    cacheCreationTokens,
    costUsd,
    contextLimit,
    contextWindow: contextLimit,
    breakdown,
  };
}
