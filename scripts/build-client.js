import esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function build() {
  const result = await esbuild.build({
    entryPoints: [path.join(__dirname, "../src/client/index.tsx")],
    bundle: true,
    format: "cjs",
    external: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "@deepseek-ai/cordis",
      "@deepseek-ai/dsh-session",
      "@deepseek-ai/dsh-client-runtime",
      "@deepseek-ai/dsh-client-ui-slots",
      "@deepseek-ai/dsh-client-ui-conversation"
    ],
    write: false,
  });

  const rawCode = result.outputFiles[0].text;

  const wrapped = `(function() {
  function factory(require, exports, module) {
${rawCode}
    return module.exports;
  }

  // 1. DSH web client module loader:
  if (typeof window !== "undefined" && window.__ModuleLoader__ && typeof window.__ModuleLoader__.load === "function") {
    window.__ModuleLoader__.load({
      id: "dsh-context-ring",
      factory: function(require) {
        var mod = { exports: {} };
        factory(require, mod.exports, mod);
        return mod.exports;
      }
    });
  }

  // 2. CommonJS (Cairn / Node):
  if (typeof module !== "undefined" && module.exports) {
    factory(typeof require === "function" ? require : function() {}, module.exports, module);
  }
})();
`;

  const outDir = path.join(__dirname, "../lib/client");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.js"), wrapped, "utf8");
  console.log("Built universal DSH + Cairn client bundle: lib/client/index.js");
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
