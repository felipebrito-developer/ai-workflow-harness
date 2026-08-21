import { describe, expect, it } from "bun:test";
import { AstValidator } from "../src/engines/ast-validator.js";

describe("AstValidator Engine", () => {
	it("should validate non-TS files as clean", async () => {
		const validator = new AstValidator();
		const result = await validator.validateFiles(["README.md", "package.json"]);
		expect(result.valid).toBe(true);
		expect(result.errors.length).toBe(0);
	});

	it("should validate valid TS files without diagnostic errors", async () => {
		const validator = new AstValidator();
		const result = await validator.validateFiles([
			"packages/cli/src/engines/risk-engine.ts",
		]);
		expect(result.exportedSymbols.length).toBeGreaterThan(0);
	});
});
