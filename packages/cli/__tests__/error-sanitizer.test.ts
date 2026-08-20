import { describe, expect, it } from "bun:test";
import { ErrorSanitizer } from "../src/engines/error-sanitizer.js";

describe("ErrorSanitizer Engine", () => {
  it("should sanitize ANSI codes and strip node_modules bloat", () => {
    const rawStderr = `
\u001b[31mFAIL\u001b[0m tests/auth.test.ts
Error: Expected 200 but got 500
    at Module._compile (node_modules/bun/internal/module.js:10:5)
    at process.processTicksAndRejections (node:internal/process.js:5:2)
    `;

    const card = ErrorSanitizer.sanitize("bun test", rawStderr, "");
    expect(card.failedCommand).toBe("bun test");
    expect(card.cleanTrace).not.toContain("node_modules");
    expect(card.summary).toContain("FAIL");

    const formatted = ErrorSanitizer.formatErrorCard(card);
    expect(formatted).toContain("[HARNESS VERIFICATION FAILURE REPORT]");
  });
});
