import fs from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import type { HarnessConfig } from "../schemas/harness-config.schema.js";
import { AdapterCompiler } from "@harness/adapters";

interface McpRow {
  name: string;
  type: string;
  target: string;
  env: string;
  source: "default" | "custom";
}

export async function runMcpList(): Promise<void> {
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
  const customMcp = await AdapterCompiler.loadMcpServers(cwd);

  const mcpList: McpRow[] = [];

  if (config.taskBackend.type === "linear") {
    mcpList.push({
      name: "linear",
      type: "local",
      target: "npx -y @modelcontextprotocol/server-linear",
      env: "LINEAR_API_KEY",
      source: "default",
    });
  }

  for (const server of customMcp) {
    const target =
      server.type === "remote" ? server.url || "N/A" : server.command.join(" ");
    const envKeys = Object.keys(server.env).join(", ") || "none";

    mcpList.push({
      name: server.name,
      type: server.type,
      target: target.length > 40 ? `${target.slice(0, 37)}...` : target,
      env: envKeys,
      source: "custom",
    });
  }

  console.log(chalk.bold.cyan("\n🔌 Configured Model Context Protocol (MCP) Servers\n"));

  if (mcpList.length === 0) {
    console.log(chalk.yellow("  No MCP servers configured yet."));
    console.log(chalk.dim("  Run `harness mcp:add` to configure an MCP server.\n"));
    return;
  }

  const colName = 18;
  const colType = 10;
  const colTarget = 42;
  const colEnv = 20;

  const header =
    "  " +
    chalk.bold("NAME".padEnd(colName)) +
    chalk.bold("TYPE".padEnd(colType)) +
    chalk.bold("COMMAND / URL".padEnd(colTarget)) +
    chalk.bold("ENV KEYS".padEnd(colEnv));

  console.log(header);
  console.log(chalk.dim("  " + "─".repeat(colName + colType + colTarget + colEnv)));

  for (const item of mcpList) {
    const namePadded = item.name.padEnd(colName);
    const renderedName =
      item.source === "default" ? chalk.blue(namePadded) : chalk.green(namePadded);

    const typeColor = item.type === "remote" ? chalk.magenta(item.type) : chalk.dim(item.type);

    console.log(
      `  ${renderedName}` +
      `${typeColor.padEnd(colType + (typeColor.length - item.type.length))}` +
      `${chalk.white(item.target.padEnd(colTarget))}` +
      `${chalk.yellow(item.env)}`
    );
  }

  console.log(chalk.dim(`\n  Legend: ${chalk.blue("■ Built-in (Task Backend)")}  ${chalk.green("■ Custom (.harness/mcp/)")}`));
  console.log(chalk.dim(`  Total: ${mcpList.length} MCP server(s) active\n`));
}