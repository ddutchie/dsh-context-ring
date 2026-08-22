# @deepseek-ai/dsh-context-ring

> **DSH 上下文环插件**：DeepSeek Harness (DSH) 实时 Token 归因、提示词结构分解与交互式可视化环形组件。

---

## 特性

- **5 级上下文构成细分**：
  - `systemPrompt`：基础系统提示词、执行策略与不可变量（Invariants）。
  - `tools`：`request/header` 中注册的工具 Schema 定义。
  - `skills`：已加载的技能指令与模板。
  - `toolOutputs`：工具执行返回的结果文本。
  - `conversation`：人类用户对话与模型推理过程。
- **纯事件流折叠（Zero-Dependency）**：直接在 DSH `SessionEvent[]` 上运行纯投影算法，无外部数据库依赖。
- **缓存节约与费用核算**：实时计算 Token 成本与 Prompt Cache 命中节省。
- **交互式 SVG 环形组件**：支持 React 多段平滑动画。

---

## 许可证

MIT
