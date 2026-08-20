import fs from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import enquirer from "enquirer";
import { SpecDatabase } from "./spec-database.js";

export interface RepoAnalysisResult {
  projectName: string;
  stack: string[];
  testCmd: string;
  lintCmd: string;
  detectedModules: string[];
}

export class RepoAnalyzer {
  public static async analyze(cwd: string): Promise<RepoAnalysisResult> {
    console.log(chalk.bold.cyan("\n🔍 Analyzing Brownfield Repository Structure...\n"));

    const stack: string[] = [];
    let projectName = path.basename(cwd);
    let testCmd = "bun test";
    let lintCmd = "bunx @biomejs/biome check .";
    const detectedModules: string[] = [];

    // Inspect package.json
    try {
      const pkgPath = path.join(cwd, "package.json");
      const pkgRaw = await fs.readFile(pkgPath, "utf-8");
      const pkg = JSON.parse(pkgRaw);
      if (pkg.name) projectName = pkg.name;

      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      if (deps.react || deps["react-dom"]) stack.push("react-web");
      if (deps["react-native"]) stack.push("react-native");
      if (deps.express || deps.fastify || deps.koa || deps.hono) stack.push("node");
      if (deps.prisma || deps.pg || deps.sqlite3 || deps["bun:sqlite"]) stack.push("db-sql");
      if (deps.mongodb || deps.mongoose) stack.push("db-nosql");

      if (pkg.scripts?.test) testCmd = "npm test";
      if (pkg.scripts?.lint) lintCmd = "npm run lint";
    } catch {}

    // Inspect go.mod
    try {
      const goModPath = path.join(cwd, "go.mod");
      await fs.access(goModPath);
      stack.push("go");
      testCmd = "go test ./...";
    } catch {}

    // Inspect directory structure for key modules
    try {
      const entries = await fs.readdir(cwd, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
          detectedModules.push(entry.name);
        }
      }
    } catch {}

    if (stack.length === 0) {
      stack.push("node");
    }

    console.log(chalk.green(`✔ Detected Project Name: ${projectName}`));
    console.log(chalk.green(`✔ Detected Stack: ${stack.join(", ")}`));
    console.log(chalk.green(`✔ Auto-Discovered Modules: ${detectedModules.slice(0, 5).join(", ")}`));

    // Interactive 3-Question Verification Card (Eliminates Misconceptions)
    console.log(chalk.bold.yellow("\n📋 Confirm Discovered Architecture Baseline:"));

    const answers = await enquirer.prompt<{
      confirmName: string;
      confirmModules: string;
      confirmTestCmd: string;
    }>([
      {
        type: "input",
        name: "confirmName",
        message: "Project Name & Purpose:",
        initial: projectName,
      },
      {
        type: "input",
        name: "confirmModules",
        message: "Core Module Scope (comma separated):",
        initial: detectedModules.slice(0, 5).join(", ") || "core, api",
      },
      {
        type: "input",
        name: "confirmTestCmd",
        message: "Verification Test Command:",
        initial: testCmd,
      },
    ]);

    const finalModules = answers.confirmModules.split(",").map((m) => m.trim()).filter(Boolean);

    // Seed SQLite database
    const harnessDir = path.join(cwd, ".harness");
    await fs.mkdir(harnessDir, { recursive: true });
    const specDb = new SpecDatabase(harnessDir);

    specDb.upsertFeature({
      id: "feat-brownfield-core",
      name: answers.confirmName,
      slug: "brownfield-baseline",
      summary: `Auto-analyzed baseline architecture for ${answers.confirmName}`,
      status: "STABLE",
    });

    for (const mod of finalModules) {
      specDb.upsertTopic({
        id: `topic-${mod}`,
        feature_id: "feat-brownfield-core",
        category: "technical",
        slug: mod.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        title: `Module: ${mod}`,
      });
    }

    await specDb.exportToMarkdown(harnessDir);
    specDb.close();

    return {
      projectName: answers.confirmName,
      stack,
      testCmd: answers.confirmTestCmd,
      lintCmd,
      detectedModules: finalModules,
    };
  }
}
