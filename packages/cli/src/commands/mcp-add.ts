import fs from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import enquirer from "enquirer";
import type { HarnessConfig } from "../schemas/harness-config.schema.js";
import { type McpServer, McpServerSchema } from "../schemas/mcp.schema.js";
import { AdapterCompiler } from "@harness/adapters";

interface McpAddAnswers {
  preset: "filesystem" | "postgres" | "github" | "fetch" | "linear" | "custom_local" | "custom_remote";
  name: string;
  commandString?: string;
  url?: string;
  envKeys?: string;
}

export async function runMcpAdd(initialName?: string): Promise<void> {
  const cwd = process.cwd();
  const harnessConfigPath = path.join(cwd, ".harness", "harness.config.json");

  try {
    await fs.access(harnessConfigPath);
  } catch {
    console.error(chalk.red("Error: .harness directory not found. Run 'harness init' first."));
    process.exit(1);
  }

  const rawConfig = await fs.readFile(harnessConfigPath, "utf-8");
  const config: HarnessConfig = JSON.parse(rawConfig);

  console.log(chalk.bold.cyan("\n🔌 Add Model Context Protocol (MCP) Server\n"));

  const questions: Parameters<typeof enquirer.prompt>[0] = [
    {
      type: "select",
      name: "preset",
      message: "Select an MCP Server preset or custom:",
      choices: [
        { name: "filesystem", message: "Filesystem (@modelcontextprotocol/server-filesystem)" },
        { name: "github", message: "GitHub (@modelcontextprotocol/server-github)" },
        { name: "postgres", message: "PostgreSQL (@modelcontextprotocol/server-postgres)" },
        { name: "fetch", message: "Fetch Web (@modelcontextprotocol/server-fetch)" },
        { name: "linear", message: "Linear (@modelcontextprotocol/server-linear)" },
        { name: "custom_local", message: "Custom Local (Command & Arguments)" },
        { name: "custom_remote", message: "Custom Remote (HTTP / SSE URL)" },
      ],
    },
    {
      type: "input",
      name: "name",
      message: "Server Name / Key Identifier:",
      initial: initialName || "filesystem",
      validate: (val: string) =>
        /^[a-z0-9_-]+$/.test(val) || "Must be valid identifier (a-z, 0-9, -, _)",
    },
    {
      type: "input",
      name: "commandString",
      message: "Command (space separated args):",
      initial: "npx -y @modelcontextprotocol/server-filesystem .",
      skip: function (this: any) {
        const state = (this as any).state?.answers || {};
        return state.preset === "custom_remote";
      },
    },
    {
      type: "input",
      name: "url",
      message: "Remote Server URL (SSE Endpoint):",
      initial: "http://localhost:8000/sse",
      skip: function (this: any) {
        const state = (this as any).state?.answers || {};
        return state.preset !== "custom_remote";
      },
    },
    {
      type: "input",
      name: "envKeys",
      message: "Environment Variables (KEY=VALUE comma-separated, or leave empty):",
      initial: "",
    },
  ];

  const answers = await enquirer.prompt<McpAddAnswers>(questions);

  let type: "local" | "remote" = answers.preset === "custom_remote" ? "remote" : "local";
  let command: string[] = [];
  let env: Record<string, string> = {};

  // Resolve presets
  switch (answers.preset) {
    case "filesystem":
      command = ["npx", "-y", "@modelcontextprotocol/server-filesystem", "."];
      break;
    case "github":
      command = ["npx", "-y", "@modelcontextprotocol/server-github"];
      env = { GITHUB_PERSONAL_ACCESS_TOKEN: "{env:GITHUB_TOKEN}" };
      break;
    case "postgres":
      command = ["npx", "-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"];
      break;
    case "fetch":
      command = ["npx", "-y", "@modelcontextprotocol/server-fetch"];
      break;
    case "linear":
      command = ["npx", "-y", "@modelcontextprotocol/server-linear"];
      env = { LINEAR_API_KEY: "{env:LINEAR_API_KEY}" };
      break;
    case "custom_local":
      command = (answers.commandString || "").split(" ").filter(Boolean);
      break;
    case "custom_remote":
      break;
  }

  // Parse extra user environment inputs if provided
  if (answers.envKeys && answers.envKeys.trim().length > 0) {
    const pairs = answers.envKeys.split(",");
    for (const pair of pairs) {
      const [k, v] = pair.split("=");
      if (k && v) {
        env[k.trim()] = v.trim();
      }
    }
  }

  const serverPayload: McpServer = {
    name: answers.name,
    type,
    command,
    ...(answers.url ? { url: answers.url } : {}),
    env,
  };

  const validatedServer = McpServerSchema.parse(serverPayload);

  // 1. Save canonical definition to .harness/mcp/<name>.json
  const mcpDir = path.join(cwd, ".harness", "mcp");
  await fs.mkdir(mcpDir, { recursive: true });
  await fs.writeFile(
    path.join(mcpDir, `${validatedServer.name}.json`),
    JSON.stringify(validatedServer, null, 2),
    "utf-8"
  );

  // 2. Re-compile all active tool configurations
  const compiledFiles = await AdapterCompiler.compileAll(config, cwd);

  console.log(chalk.green(`\n✨ MCP Server '${validatedServer.name}' successfully configured!`));
  console.log(chalk.dim(`- Canonical Spec: .harness/mcp/${validatedServer.name}.json`));
  console.log(
    chalk.dim(
      `- Synchronized Adapter Files:\n  ${compiledFiles.map((f) => `• ${f}`).join("\n  ")}`
    )
  );
  console.log(chalk.cyan(`\nYour AI tools now have access to MCP server '${validatedServer.name}'.\n`));
}