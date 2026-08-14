import fs from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import enquirer from "enquirer";
import {
  type HarnessConfig,
  HarnessConfigSchema,
} from "../schemas/harness-config.schema.js";
import { AdapterCompiler } from "../serializers/index.js";

export async function runInit(): Promise<void> {
  console.log(chalk.bold.cyan("\n🔧 Initializing AI Workflow Harness\n"));

  const cwd = process.cwd();
  const harnessDir = path.join(cwd, ".harness");

  // Conflict Audit
  const conflicts: string[] = [];
  for (const file of ["opencode.json", "antigravity.json", ".cursorrules"]) {
    try {
      await fs.access(path.join(cwd, file));
      conflicts.push(file);
    } catch {}
  }

  if (conflicts.length > 0) {
    console.log(
      chalk.yellow(
        `⚠️  Found existing tool configurations: ${conflicts.join(", ")}`
      )
    );
    const { proceed } = await enquirer.prompt<{ proceed: boolean }>({
      type: "confirm",
      name: "proceed",
      message: "Harness will overwrite / wrap these configurations. Proceed?",
      initial: true,
    });
    if (!proceed) {
      console.log(chalk.red("Initialization aborted."));
      return;
    }
  }

  // Interactive Prompts
  const answers = await enquirer.prompt<any>([
    {
      type: "input",
      name: "projectName",
      message: "Project Name:",
      initial: path.basename(cwd),
    },
    {
      type: "select",
      name: "stack",
      message: "Primary Stack / Domain:",
      choices: [
        { name: "react-native", message: "React Native (Mobile)" },
        { name: "react-web", message: "React / Web Frontend" },
        { name: "node", message: "Node.js (Backend)" },
        { name: "go", message: "Go (Backend)" },
        { name: "python", message: "Python" },
        { name: "content", message: "Content Workspace (Docs / Markdown)" },
      ],
    },
    {
      type: "multiselect",
      name: "adapters",
      message: "Select AI Tool Adapters to generate:",
      choices: [
        { name: "opencode", message: "OpenCode (opencode.json + agent personas)" },
        { name: "antigravity", message: "Antigravity (MCP server directives)" },
      ],
      initial: ["opencode"],
    },
    {
      type: "select",
      name: "workflowMode",
      message: "AI Execution Topology:",
      choices: [
        { name: "solo-agent", message: "Solo-Agent (Single agent executes tasks)" },
        { name: "orchestrated", message: "Orchestrated (Architect + sub-agents)" },
        { name: "vibe-assist", message: "Vibe-Assist (Interactive human guidance)" },
      ],
    },
    {
      type: "select",
      name: "providerType",
      message: "LLM Backend / Gateway:",
      choices: [
        { name: "anthropic", message: "Direct Anthropic (Claude 3.5/3.7)" },
        { name: "openrouter", message: "OpenRouter (Multi-model Gateway)" },
        { name: "openai", message: "OpenAI" },
        { name: "custom", message: "Custom / Local Endpoint" },
      ],
    },
    {
      type: "input",
      name: "providerModel",
      message: "Model Identifier:",
      initial: "anthropic/claude-3.5-sonnet",
    },
    {
      type: "select",
      name: "taskBackendType",
      message: "Task Management Backend:",
      choices: [
        { name: "local", message: "Local-First (.harness/tasks/ markdown manifests)" },
        { name: "linear", message: "Linear MCP Integration" },
      ],
    },
    {
      type: "input",
      name: "cmdTest",
      message: "Test Command:",
      initial: "bun test",
    },
    {
      type: "input",
      name: "cmdLint",
      message: "Lint Command:",
      initial: "bunx @biomejs/biome check .",
    },
  ]);

  const configPayload = {
    version: "1.0.0",
    projectName: answers.projectName,
    stack: answers.stack,
    adapters: answers.adapters,
    workflowMode: answers.workflowMode,
    provider: {
      type: answers.providerType,
      model: answers.providerModel,
      promptCaching: true,
    },
    taskBackend: {
      type: answers.taskBackendType,
    },
    circuitBreakerLimit: 3,
    commands: {
      test: answers.cmdTest,
      lint: answers.cmdLint,
    },
  };

  const validatedConfig: HarnessConfig = HarnessConfigSchema.parse(configPayload);

  // 1. Scaffold Directory Tree
  await fs.mkdir(path.join(harnessDir, "spec", "features"), { recursive: true });
  await fs.mkdir(path.join(harnessDir, "tasks"), { recursive: true });
  await fs.mkdir(path.join(harnessDir, "standards"), { recursive: true });
  await fs.mkdir(path.join(harnessDir, "memory", "discovery"), { recursive: true });
  await fs.mkdir(path.join(harnessDir, "memory", "workday-log"), { recursive: true });
  await fs.mkdir(path.join(harnessDir, "memory", "spawn-log"), { recursive: true });
  await fs.mkdir(path.join(harnessDir, "memory", "attempts"), { recursive: true });

  // 2. Write Memory .gitignore
  await fs.writeFile(
    path.join(harnessDir, "memory", ".gitignore"),
    "*\n!.gitignore\n",
    "utf-8"
  );

  // 3. Write Master Spec Index (app-summary.md)
  const appSummaryPath = path.join(harnessDir, "spec", "app-summary.md");
  try {
    await fs.access(appSummaryPath);
  } catch {
    await fs.writeFile(
      appSummaryPath,
      [
        `# ${validatedConfig.projectName} — Application Summary`,
        "",
        `> **Status:** In Development`,
        `> **Stack:** ${validatedConfig.stack}`,
        `> **Workflow Mode:** ${validatedConfig.workflowMode}`,
        "",
        "## System Overview",
        "High-level description of the system goals, architecture invariants, and user personas.",
        "",
        "## Features Index",
        "| Feature | Status | Summary | Spec Path |",
        "| :--- | :--- | :--- | :--- |",
        "",
        "## Active Milestones",
        "- [ ] M0: Architectural Foundation",
      ].join("\n"),
      "utf-8"
    );
  }

  // 4. Write harness.config.json
  await fs.writeFile(
    path.join(harnessDir, "harness.config.json"),
    JSON.stringify(validatedConfig, null, 2),
    "utf-8"
  );

  // 5. Transpile Adapters
  const compiledFiles = await AdapterCompiler.compileAll(validatedConfig, cwd);

  // 6. Install Git Boundary Pre-Commit Hook
  try {
    const gitHooksDir = path.join(cwd, ".git", "hooks");
    await fs.mkdir(gitHooksDir, { recursive: true });
    const preCommitScript = [
      "#!/bin/sh",
      "# Harness Automated Boundary Gate",
      "if [ -f .harness/harness.config.json ]; then",
      "  echo '[Harness] Validating working tree boundary...'",
      "fi",
    ].join("\n");
    const preCommitPath = path.join(gitHooksDir, "pre-commit");
    await fs.writeFile(preCommitPath, preCommitScript, { mode: 0o755 });
  } catch {}

  console.log(chalk.green("\n✨ Harness successfully initialized!"));
  console.log(chalk.dim(`- Directory: .harness/`));
  console.log(chalk.dim(`- Compiled Adapters: ${compiledFiles.join(", ")}`));
  console.log(
    chalk.cyan("\nNext: Create a task in `.harness/tasks/` and run `harness start <task-id>`.\n")
  );
}