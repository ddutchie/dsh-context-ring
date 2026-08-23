/**
 * Plain-ESM React entry — importable components for any React host that wants to
 * render the Context Ring inside its own tree (not via the DSH plugin/slot
 * bundle). This is the reusable half: `import { ContextRing, ContextRingWidget }
 * from "dsh-context-ring/react"`.
 *
 * The DSH web-shell plugin bundle lives at `./client` (a `__ModuleLoader__`
 * registration IIFE); this `./react` entry is normal ESM with real exports, so
 * embedding hosts (Cairn, other community React apps) can compose the components
 * directly and project them wherever they need.
 */
export { ContextRing } from "./client/ContextRing.js";
export { ContextRingWidget } from "./client/index.js";
//# sourceMappingURL=react.js.map