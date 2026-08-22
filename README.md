# @deepseek-ai/dsh-context-ring

> **DSH Context Ring Plugin**: Real-time token provenance, prompt composition breakdown, and interactive visual ring projection for the DeepSeek Harness (DSH).

---

## Features

- **5-Tier Context Composition Breakdown**:
  - `systemPrompt`: Base system instructions, policies, and invariants.
  - `tools`: Registered tool schemas from `request/header`.
  - `skills`: Loaded skill catalogs and prompt templates.
  - `toolOutputs`: Output text returned from executed tools.
  - `conversation`: User prompts and assistant responses/reasoning.
- **Zero-Dependency Event Folding**: Pure projection over `SessionEvent[]` streams without database dependencies.
- **Cache & Cost Provenance**: Real-time estimation of token cost and prompt-cache savings.
- **Interactive Visual Ring**: Multi-segment SVG donut ring React component with smooth transitions.

---

## Installation

```bash
npm install @deepseek-ai/dsh-context-ring
```

---

## Usage

### 1. Pure Projection (Server or Client)

```ts
import { foldSessionUsage } from "@deepseek-ai/dsh-context-ring";

const usage = foldSessionUsage(sessionEvents);
console.log(usage.breakdown);
// { systemPrompt: 350, tools: 1200, skills: 200, toolOutputs: 800, conversation: 3400 }
```

### 2. Cordis Plugin (DSH Agent Loop)

```ts
import { Context } from "@deepseek-ai/cordis";
import { contextRingPlugin } from "@deepseek-ai/dsh-context-ring";

const ctx = new Context();
ctx.plugin(contextRingPlugin);

ctx.on("context-ring/update", (session, usage) => {
  console.log(`Session ${session.id} prompt tokens: ${usage.promptTokens}`);
});
```

### 3. React SVG Visual Ring

```tsx
import { ContextRing } from "@deepseek-ai/dsh-context-ring/client";

export function ChatHeader({ usage }) {
  return (
    <div className="flex items-center gap-2">
      <ContextRing usage={usage} size={24} strokeWidth={3} />
      <span>{usage.promptTokens.toLocaleString()} tokens</span>
    </div>
  );
}
```

---

## License

MIT
