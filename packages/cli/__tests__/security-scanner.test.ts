import { describe, expect, it } from "bun:test";
import { SecurityScanner } from "../src/engines/security-scanner.js";

describe("SecurityScanner Engine", () => {
	it("should detect credential leak in git diff text", async () => {
		const fakeDiff = `
+++ b/src/config.ts
+ const AWS_KEY = "AKIA1234567890ABCDEF";
+ const API_SECRET = "api_key = 'abcdef1234567890'";
    `;

		const issues = await SecurityScanner.scanDiffSecrets(fakeDiff);
		expect(issues.length).toBeGreaterThan(0);
		expect(issues[0].severity).toBe("CRITICAL");
		expect(issues[0].type).toBe("SECRET_LEAK");
	});

	it("should detect unprotected .env file in diff", async () => {
		const fakeDiff = `
+++ b/.env
+ PORT=3000
    `;

		const issues = await SecurityScanner.scanDiffSecrets(fakeDiff);
		expect(issues.length).toBe(1);
		expect(issues[0].type).toBe("UNPROTECTED_ENV");
	});
});
