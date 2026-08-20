import fs from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import matter from "gray-matter";
import { RiskEngine } from "../engines/risk-engine.js";
import { SpecDatabase } from "../engines/spec-database.js";

export async function runFeature(featureName: string, options: { files?: string; isSchema?: boolean }): Promise<void> {
  const cwd = process.cwd();
  const harnessDir = path.join(cwd, ".harness");
  const slug = featureName.toLowerCase().replace(/[^a-z0-9]/g, "-");

  console.log(chalk.bold.cyan(`\n⚡ Generating Feature (1-Pass Agile Loop): ${featureName}\n`));

  const targetFiles = options.files ? options.files.split(",").map((f) => f.trim()) : ["src/feature.ts", "tests/feature.test.ts"];
  const isSchema = !!options.isSchema;

  // 1. Evaluate Risk Score
  const risk = RiskEngine.evaluateTaskRisk(targetFiles, isSchema);
  console.log(RiskEngine.formatRiskCard(risk));

  // 2. Insert into SpecDatabase
  await fs.mkdir(harnessDir, { recursive: true });
  const specDb = new SpecDatabase(harnessDir);
  const featId = `feat-${slug}`;

  specDb.upsertFeature({
    id: featId,
    name: featureName,
    slug,
    summary: `Feature ${featureName} created via Agile 1-pass cycle`,
    status: "DRAFT",
  });

  const topicId = `topic-${slug}-ui`;
  specDb.upsertTopic({
    id: topicId,
    feature_id: featId,
    category: "ui",
    slug: `${slug}-ui`,
    title: `${featureName} Screen & UI Contract`,
  });

  specDb.upsertChunk({
    id: `chunk-${slug}-summary`,
    topic_id: topicId,
    level: "summary",
    content: `\`\`\`ascii\n┌────────────────────────────────┐\n│   ${featureName.padEnd(27)} │\n├────────────────────────────────┤\n│ [Input]                        │\n│ [Action Button]                │\n└────────────────────────────────┘\n\`\`\``,
    token_estimate: 80,
  });

  await specDb.exportToMarkdown(harnessDir);
  specDb.close();

  // 3. Emit Task Manifest task-XXX.md
  const tasksDir = path.join(harnessDir, "tasks");
  await fs.mkdir(tasksDir, { recursive: true });

  const taskId = `task-${slug}`;
  const taskPath = path.join(tasksDir, `${taskId}.md`);

  const taskContent = matter.stringify(
    [
      `# Task: ${featureName}`,
      "",
      "## 1. Allowed File Boundaries",
      ...targetFiles.map((f) => `- \`${f}\``),
      "",
      "## 2. Acceptance Criteria",
      `- [ ] Verify UI layout matches wireframe mockup`,
      `- [ ] Verify ${featureName} logic satisfies RED-GREEN test suite`,
      "",
      "## 3. Verification Commands",
      "- `bun test`",
    ].join("\n"),
    {
      id: taskId,
      title: featureName,
      status: "TODO",
      workflowMode: "agile-fasttrack",
      riskLevel: risk.level,
    }
  );

  await fs.writeFile(taskPath, taskContent, "utf-8");

  console.log(chalk.bold.green(`\n✔ Feature ${featureName} initialized and atomic task generated:`));
  console.log(chalk.dim(`  - Task Manifest: .harness/tasks/${taskId}.md`));
  console.log(chalk.cyan(`\nNext: Run 'harness start ${taskId}' to execute.\n`));
}
