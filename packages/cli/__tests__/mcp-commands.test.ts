import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import { type McpServer, McpServerSchema } from "../src/schemas/mcp.schema.js";

describe("MCP Server Schema & Storage Test Suite", () => {
	const tmpMcpDir = path.join(process.cwd(), ".tmp-mcp-test");

	beforeAll(async () => {
		await fs.mkdir(tmpMcpDir, { recursive: true });
	});

	afterAll(async () => {
		await fs.rm(tmpMcpDir, { recursive: true, force: true });
	});

	it("should validate and save local MCP server specification", async () => {
		const sampleServer: McpServer = {
			name: "filesystem",
			type: "local",
			command: ["npx", "-y", "@modelcontextprotocol/server-filesystem", "."],
			env: {},
		};

		const parsed = McpServerSchema.parse(sampleServer);
		expect(parsed.name).toBe("filesystem");

		const filePath = path.join(tmpMcpDir, "filesystem.json");
		await fs.writeFile(filePath, JSON.stringify(parsed, null, 2), "utf-8");

		const raw = await fs.readFile(filePath, "utf-8");
		const loaded = JSON.parse(raw);
		expect(loaded.command[0]).toBe("npx");
	});
});
