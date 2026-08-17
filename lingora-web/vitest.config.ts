import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import ts from "typescript";

export default defineConfig({
  plugins: [{
    name: "lingora-vitest-tsx",
    enforce: "pre",
    transform(code, id) {
      if (!id.split("?")[0].endsWith(".tsx")) return null;
      return ts.transpileModule(code, {
        compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
        fileName: id
      }).outputText;
    }
  }],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    coverage: { reporter: ["text", "html"] }
  }
});
