import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("use-client boundary in src/logic", () => {
  it("files with 'use client' in src/logic must export hooks only (names starting with 'use')", () => {
    const logicDir = path.resolve(process.cwd(), "src/logic");
    const files = fs.readdirSync(logicDir).filter((file) => file.endsWith(".ts") || file.endsWith(".tsx"));

    const violations: { file: string; exportName: string }[] = [];

    for (const file of files) {
      const filePath = path.join(logicDir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split(/\r?\n/);
      const firstLine = lines.find((l) => l.trim().length > 0)?.trim() || "";

      const isClientFile =
        firstLine === '"use client";' ||
        firstLine === "'use client';" ||
        firstLine === '"use client"' ||
        firstLine === "'use client'";

      if (!isClientFile) continue;

      // Match export function <name> and export const <name>
      // (types and interfaces like 'export type' / 'export interface' are allowed)
      const exportRegex = /export\s+(?:function|const)\s+([A-Za-z0-9_$]+)/g;
      let match: RegExpExecArray | null;

      while ((match = exportRegex.exec(content)) !== null) {
        const exportName = match[1];
        if (!exportName.startsWith("use")) {
          violations.push({ file, exportName });
        }
      }
    }

    if (violations.length > 0) {
      const violationDetails = violations
        .map((v) => `File '${v.file}' exports non-hook '${v.exportName}' in a 'use client' file`)
        .join("\n");
      expect.fail(
        `Found forbidden non-hook exports in 'use client' files in src/logic:\n${violationDetails}\n` +
          `Pure functions must go into their own file without 'use client' so server pages can call them.`
      );
    }

    expect(violations).toEqual([]);
  });
});

