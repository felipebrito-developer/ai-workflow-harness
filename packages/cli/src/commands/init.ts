import fs from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import enquirer from "enquirer";
import {
  type HarnessConfig,
  HarnessConfigSchema,
} from "../schemas/harness-config.schema.js";
import { AdapterCompiler } from "@harness/adapters";
import { RepoAnalyzer } from "../engines/repo-analyzer.js";
import { SpecDatabase } from "../engines/spec-database.js";

export type StackOption =
  | "react-web"
  | "react-native"
  | "node"
  | "go"
  | "db-sql"
  | "db-nosql"
  | "python";

export type ModelPresetOption =
  | "complex-best"
  | "complex-efficient"
  | "small-best"
  | "small-efficient"
  | "custom";

export interface InitAnswers {
  projectName: string;
  enableTokenOptimizations: boolean;
  stack: StackOption[];
  createSpecialistTemplates: boolean;
  installRecommendedSkills: boolean;
  adapters: ("opencode" | "antigravity")[];
  workflowMode: "orchestrated" | "solo-agent" | "vibe-assist";
  providerType: "openrouter" | "anthropic" | "openai" | "custom";
  modelPreset: ModelPresetOption;
  customDefaultModel?: string;
  taskBackendType: "local" | "linear";
  useAiMemory: boolean;
  pipelineMode: "agile-fasttrack" | "full-waterfall" | "hotfix";
  cmdTest: string;
  cmdLint: string;
}

export async function runInit(): Promise<void> {
  console.log(chalk.bold.cyan("\n🔧 Initializing AI Workflow Harness\n"));

  const cwd = process.cwd();
  const harnessDir = path.join(cwd, ".harness");

  // 1. Brownfield Auto-Discovery Check
  let brownfieldResult: any = null;
  let isBrownfield = false;
  try {
    await fs.access(path.join(cwd, "package.json"));
    isBrownfield = true;
  } catch {
    try {
      await fs.access(path.join(cwd, "go.mod"));
      isBrownfield = true;
    } catch {}
  }

  if (isBrownfield) {
    const { runAutoScan } = await enquirer.prompt<{ runAutoScan: boolean }>({
      type: "confirm",
      name: "runAutoScan",
      message: "Existing codebase detected. Run Brownfield Auto-Discovery (harness analyze)?",
      initial: true,
    });
    if (runAutoScan) {
      brownfieldResult = await RepoAnalyzer.analyze(cwd);
    }
  }

  // 2. Conflict Audit
  const conflicts: string[] = [];
  for (const file of ["opencode.json", "antigravity.json", ".cursorrules"]) {
    try {
      await fs.access(path.join(cwd, file));
      conflicts.push(file);
    } catch {}
  }

  if (conflicts.length > 0) {
    console.log(
      chalk.yellow(`⚠️ Found existing tool configurations: ${conflicts.join(", ")}`)
    );
    const { proceed } = await enquirer.prompt<{ proceed: boolean }>({
      type: "confirm",
      name: "proceed",
      message: "Harness will wrap these configurations. Proceed?",
      initial: true,
    });
    if (!proceed) {
      console.log(chalk.red("Initialization aborted."));
      return;
    }
  }

  // 2. Interactive Setup Prompts
  const questions: Parameters<typeof enquirer.prompt>[0] = [
    {
      type: "input",
      name: "projectName",
      message: "Project Name:",
      initial: path.basename(cwd),
    },
    {
      type: "confirm",
      name: "enableTokenOptimizations",
      message: "Enable Token Usage Optimizations (Caveman brevity & Context Caching)?",
      initial: true,
    },
    {
      type: "multiselect",
      name: "stack",
      message: "Stack / Domains (Select all that apply):",
      choices: [
        { name: "react-web", message: "React / Web Frontend" },
        { name: "react-native", message: "React Native (Mobile)" },
        { name: "node", message: "Node.js (Backend)" },
        { name: "go", message: "Golang (Backend)" },
        { name: "db-sql", message: "SQL Database (PostgreSQL / SQLite)" },
        { name: "db-nosql", message: "NoSQL Database (MongoDB / DynamoDB)" },
        { name: "python", message: "Python" },
      ],
      initial: 0,
      validate(val: unknown) {
        if (!Array.isArray(val) || val.length === 0) {
          return "Please select at least one domain.";
        }
        return true;
      },
    },
    {
      type: "confirm",
      name: "createSpecialistTemplates",
      message: "Scaffold dedicated agent templates for selected stacks?",
      initial: true,
    },
    {
      type: "confirm",
      name: "installRecommendedSkills",
      message: "Install curated skill catalogs for chosen agents (.harness/skills/)?",
      initial: true,
    },
    {
      type: "multiselect",
      name: "adapters",
      message: "Select AI Tool Adapters:",
      choices: [
        { name: "opencode", message: "OpenCode (opencode.json + agent personas)" },
        { name: "antigravity", message: "Antigravity (MCP server directives)" },
      ],
      initial: 0,
    },
    {
      type: "select",
      name: "workflowMode",
      message: "AI Execution Topology:",
      choices: [
        { name: "orchestrated", message: "Orchestrated (Workflow Orchestrator + Specialists)" },
        { name: "solo-agent", message: "Solo-Agent (Single implementation agent)" },
        { name: "vibe-assist", message: "Vibe-Assist (Interactive pairing)" },
      ],
    },
    {
      type: "select",
      name: "providerType",
      message: "LLM Gateway / Provider:",
      choices: [
        { name: "openrouter", message: "OpenRouter (Recommended — Multi-model routing)" },
        { name: "anthropic", message: "Direct Anthropic" },
        { name: "openai", message: "Direct OpenAI" },
        { name: "custom", message: "Custom / Local Endpoint" },
      ],
    },
    {
      type: "select",
      name: "modelPreset",
      message: "Select Model Strategy Preset:",
      choices: [
        {
          name: "complex-best",
          message: "Complex — Best Models (Sonnet 3.5 + DeepSeek R1 + GLM 5.2)",
        },
        {
          name: "complex-efficient",
          message: "Complex — Low Cost / Efficient (DeepSeek R1 + GLM 5.2 + Qwen 2.5 Coder)",
        },
        {
          name: "small-best",
          message: "Small — Best Models (Sonnet 3.5 + GLM 5.2)",
        },
        {
          name: "small-efficient",
          message: "Small — Low Cost / Efficient (GLM 5.2 + Qwen 2.5 Coder + Gemini Flash)",
        },
        {
          name: "custom",
          message: "Custom (Specify a single model ID for all agents)",
        },
      ],
    },
    {
      type: "input",
      name: "customDefaultModel",
      message: "Enter Default Model ID:",
      initial: "anthropic/claude-3.5-sonnet",
      skip() {
        // @ts-ignore
        return this.state.answers.modelPreset !== "custom";
      },
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
      type: "confirm",
      name: "useAiMemory",
      message: "Enable long-term cross-agent memory backend (ai-memory)?",
      initial: false,
    },
    {
      type: "select",
      name: "pipelineMode",
      message: "Select Default Planning Pipeline Strategy:",
      choices: [
        { name: "agile-fasttrack", message: "Agile Fast-Track (2-Pass: Scope/UI -> Tech/Tasks) [Recommended]" },
        { name: "hotfix", message: "Hotfix / Spike (1-Pass Direct Task Injection)" },
      ],
      initial: 0,
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
  ];

  const answers = await enquirer.prompt<InitAnswers>(questions);

  // Granular Role-to-Model Mapping Engine
  function getModelForRole(role: string): string {
    let rawModel = "anthropic/claude-3.5-sonnet";

    if (answers.modelPreset === "custom") {
      rawModel = answers.customDefaultModel || "anthropic/claude-3.5-sonnet";
    } else if (answers.modelPreset === "complex-best") {
      switch (role) {
        case "architect-agent":
        case "db-engineer":
          rawModel = "deepseek/deepseek-r1";
          break;
        case "po-agent":
          rawModel = "z-ai/glm-5.2";
          break;
        case "test-runner":
          rawModel = "google/gemini-2.5-flash";
          break;
        default:
          rawModel = "anthropic/claude-3.5-sonnet";
      }
    } else if (answers.modelPreset === "complex-efficient") {
      switch (role) {
        case "architect-agent":
        case "db-engineer":
          rawModel = "deepseek/deepseek-r1";
          break;
        case "workflow-orchestrator":
        case "po-agent":
        case "designer-lead":
        case "designer-ui":
        case "tech-lead":
          rawModel = "z-ai/glm-5.2";
          break;
        case "test-runner":
          rawModel = "google/gemini-2.5-flash";
          break;
        default:
          rawModel = "qwen/qwen-2.5-coder-32b-instruct";
      }
    } else if (answers.modelPreset === "small-best") {
      switch (role) {
        case "po-agent":
          rawModel = "z-ai/glm-5.2";
          break;
        case "test-runner":
          rawModel = "google/gemini-2.5-flash";
          break;
        default:
          rawModel = "anthropic/claude-3.5-sonnet";
      }
    } else {
      switch (role) {
        case "workflow-orchestrator":
        case "architect-agent":
        case "po-agent":
        case "designer-lead":
        case "designer-ui":
          rawModel = "z-ai/glm-5.2";
          break;
        case "test-runner":
          rawModel = "google/gemini-2.5-flash";
          break;
        default:
          rawModel = "qwen/qwen-2.5-coder-32b-instruct";
      }
    }

    if (answers.providerType === "openrouter" && !rawModel.startsWith("openrouter/")) {
      return `openrouter/${rawModel}`;
    }
    return rawModel;
  }

  const primaryModel = getModelForRole("workflow-orchestrator");

  const configPayload = {
    version: "1.0.0",
    projectName: answers.projectName,
    stack: answers.stack,
    adapters: answers.adapters,
    workflowMode: answers.workflowMode,
    provider: {
      type: answers.providerType,
      model: primaryModel,
      promptCaching: answers.enableTokenOptimizations,
    },
    taskBackend: {
      type: answers.taskBackendType,
    },
    ...(answers.useAiMemory ? { memoryBackend: { type: "ai-memory" } } : {}),
    pipelineMode: answers.pipelineMode,
    circuitBreakerLimit: 3,
    commands: {
      test: answers.cmdTest,
      lint: answers.cmdLint,
    },
  };

  const validatedConfig: HarnessConfig = HarnessConfigSchema.parse(configPayload);

  // 3. Directory Scaffolding
  const dirsToCreate = [
    path.join(harnessDir, "spec", "features"),
    path.join(harnessDir, "tasks"),
    path.join(harnessDir, "standards", "pipeline"),
    path.join(harnessDir, "agents"),
    path.join(harnessDir, "skills", "core"),
    path.join(harnessDir, "skills", "stack"),
    path.join(harnessDir, "skills", "testing"),
    path.join(harnessDir, "mcp"),
    path.join(harnessDir, "UI", "details"),
    path.join(harnessDir, "temp", "scripts"),
    path.join(harnessDir, "temp", "assets"),
    path.join(harnessDir, "temp", "artifacts"),
    path.join(harnessDir, "memory", "discovery"),
    path.join(harnessDir, "memory", "workday-log"),
    path.join(harnessDir, "memory", "spawn-log"),
    path.join(harnessDir, "memory", "attempts"),
  ];

  if (answers.useAiMemory) {
    dirsToCreate.push(path.join(harnessDir, "wiki"));
  }

  for (const dir of dirsToCreate) {
    await fs.mkdir(dir, { recursive: true });
    const gitkeep = path.join(dir, ".gitkeep");
    try {
      await fs.writeFile(gitkeep, "", { flag: "wx" });
    } catch {}
  }

  // 4. Write Root .gitignore
  await fs.writeFile(
    path.join(harnessDir, ".gitignore"),
    [
      "# Ephemeral scratchpad",
      "temp/scripts/*",
      "temp/assets/*",
      "temp/artifacts/*",
      "!temp/*/.gitkeep",
      "",
      "# Ephemeral runtime memory",
      "memory/attempts/*",
      "!memory/attempts/.gitkeep",
      "",
      "# SQLite Local Database (WAL mode)",
      "harness.db",
      "harness.db-wal",
      "harness.db-shm",
      "",
    ].join("\n"),
    "utf-8"
  );

  // 5. Write Core Agents with Granular Model Allocation
  const agentsDir = path.join(harnessDir, "agents");

  const coreAgents: Record<string, any> = {
    "workflow-orchestrator": {
      name: "workflow-orchestrator",
      description: "Primary pipeline supervisor managing Phase 1–5 transitions and handoffs.",
      mode: "primary",
      provider: { type: answers.providerType, model: getModelForRole("workflow-orchestrator"), promptCaching: answers.enableTokenOptimizations },
      permissions: { edit: "allow", bash: "ask", task: { "*": "allow" }, externalDirectory: "deny" },
      systemPrompt: "You are the Workflow Orchestrator. Manage the 5-Phase Planning Lifecycle. Delegate Phase 1 & 4 to @architect-agent, Phase 2 & 5 to @po-agent, and Phase 3 to @designer-lead. Ensure all phase deliverables pass inspection before triggering technical execution.",
    },
    "architect-agent": {
      name: "architect-agent",
      description: "Owns Phase 1 Problem Discovery and Phase 4 Technical Architecture.",
      mode: "subagent",
      provider: { type: answers.providerType, model: getModelForRole("architect-agent"), promptCaching: answers.enableTokenOptimizations },
      permissions: { edit: "allow", bash: "ask", task: { "*": "deny" }, externalDirectory: "deny" },
      systemPrompt: "You are the Solution Architect. In Phase 1, conduct structured Q&A interviews using the 3+2 choice rule. In Phase 4, design data models, API contracts, and infrastructure ADRs in .harness/spec/features/<feature>/technical/spec.md. Never write feature source code directly.",
    },
    "po-agent": {
      name: "po-agent",
      description: "Owns Phase 2 Functional Strategy and Phase 5 Task Slicing.",
      mode: "subagent",
      provider: { type: answers.providerType, model: getModelForRole("po-agent"), promptCaching: answers.enableTokenOptimizations },
      permissions: { edit: "allow", bash: "ask", task: { "*": "deny" }, externalDirectory: "deny" },
      systemPrompt: "You are the Product Owner. In Phase 2, define epics, personas, user journeys, and validate workflow topology. In Phase 5, slice technical specs into atomic task manifests in .harness/tasks/task-XXX.md with explicit acceptance criteria checkboxes and dependencies.",
    },
    "designer-lead": {
      name: "designer-lead",
      description: "Owns Phase 3 UI Architecture, component registry, and design consistency.",
      mode: "subagent",
      provider: { type: answers.providerType, model: getModelForRole("designer-lead"), promptCaching: answers.enableTokenOptimizations },
      permissions: { edit: "allow", bash: "ask", task: { "*": "deny", "designer-ui": "allow" }, externalDirectory: "deny" },
      systemPrompt: "You are the Designer Lead. Define reusable UI components in .harness/UI/custom-components-registry.ts and author component specs in .harness/UI/details/<name>/component.md. Delegate ASCII and Mermaid wireframe creation to @designer-ui.",
    },
    "designer-ui": {
      name: "designer-ui",
      description: "Generates ASCII block wireframes and Mermaid route flowcharts.",
      mode: "subagent",
      provider: { type: answers.providerType, model: getModelForRole("designer-ui"), promptCaching: answers.enableTokenOptimizations },
      permissions: { edit: "allow", bash: "ask", task: { "*": "deny" }, externalDirectory: "deny" },
      systemPrompt: "You are the UI Wireframe Designer. Author ASCII block wireframes in wireframe-ascii.md and Mermaid state transition diagrams in route-flow-mermaid.md based on Designer-Lead component specifications.",
    },
    "tech-lead": {
      name: "tech-lead",
      description: "Execution manager. Decomposes tasks into subtasks, verifies ACs, and creates atomic git commits.",
      mode: "primary",
      provider: { type: answers.providerType, model: getModelForRole("tech-lead"), promptCaching: answers.enableTokenOptimizations },
      permissions: { edit: "allow", bash: "allow", task: { "*": "allow" }, externalDirectory: "deny" },
      systemPrompt: "You are the Tech Lead. Receive tasks from .harness/tasks/task-XXX.md and break them into stack subtasks. Delegate implementation to <stack>-specialist and testing to @test-creator/@test-runner. Validate that all Acceptance Criteria are met. You are the sole agent authorized to commit changes upon successful verification.",
    },
    "test-creator": {
      name: "test-creator",
      description: "Authors contract, unit, and integration tests matching Acceptance Criteria.",
      mode: "subagent",
      provider: { type: answers.providerType, model: getModelForRole("test-creator"), promptCaching: answers.enableTokenOptimizations },
      permissions: { edit: "allow", bash: "ask", task: { "*": "deny" }, externalDirectory: "deny" },
      systemPrompt: "You are the Test Creator. Generate failing unit and contract tests in __tests__/ matching the user story Acceptance Criteria before implementation begins. Do not implement feature logic.",
    },
    "test-runner": {
      name: "test-runner",
      description: "Executes test and lint commands. Emits structured zero-noise failure reports.",
      mode: "subagent",
      provider: { type: answers.providerType, model: getModelForRole("test-runner"), promptCaching: false },
      permissions: { edit: "deny", bash: "allow", task: { "*": "deny" }, externalDirectory: "deny" },
      systemPrompt: "You are the Test Runner. Execute verification commands via terminal. Never edit code or tests. Emit concise structured execution summaries containing only failing assertions, files, and line numbers.",
    },
  };

  for (const [name, def] of Object.entries(coreAgents)) {
    await fs.writeFile(
      path.join(agentsDir, `${name}.json`),
      JSON.stringify(def, null, 2),
      "utf-8"
    );
  }

  // Specialist Agents Scaffolding
  if (answers.createSpecialistTemplates) {
    const specialistMap: Record<StackOption, any> = {
      "react-web": {
        name: "web-specialist",
        description: "Specialist in React, Next.js/Vite, Tailwind, and Web state management.",
        mode: "subagent",
        provider: { type: answers.providerType, model: getModelForRole("web-specialist"), promptCaching: answers.enableTokenOptimizations },
        permissions: { edit: "allow", bash: "ask", task: { "*": "deny" }, externalDirectory: "deny" },
        systemPrompt: "You are the Web Specialist. Implement React and Web frontend components according to .harness/UI/ specs. Strictly respect file boundaries and ACs.",
      },
      "react-native": {
        name: "react-native-specialist",
        description: "Specialist in React Native, Expo Router, NativeWind, and gestures.",
        mode: "subagent",
        provider: { type: answers.providerType, model: getModelForRole("react-native-specialist"), promptCaching: answers.enableTokenOptimizations },
        permissions: { edit: "allow", bash: "ask", task: { "*": "deny" }, externalDirectory: "deny" },
        systemPrompt: "You are the React Native Specialist. Implement mobile components according to Expo standards and mobile specs. Strictly respect file boundaries.",
      },
      "node": {
        name: "node-specialist",
        description: "Specialist in Node.js, Fastify/Express, TypeScript, and clean architecture.",
        mode: "subagent",
        provider: { type: answers.providerType, model: getModelForRole("node-specialist"), promptCaching: answers.enableTokenOptimizations },
        permissions: { edit: "allow", bash: "ask", task: { "*": "deny" }, externalDirectory: "deny" },
        systemPrompt: "You are the Node.js Specialist. Implement backend endpoints, services, and domain models following strict typing and schema contracts.",
      },
      "go": {
        name: "go-specialist",
        description: "Specialist in idiomatic Go, Chi/Gin routers, and high-performance services.",
        mode: "subagent",
        provider: { type: answers.providerType, model: getModelForRole("go-specialist"), promptCaching: answers.enableTokenOptimizations },
        permissions: { edit: "allow", bash: "ask", task: { "*": "deny" }, externalDirectory: "deny" },
        systemPrompt: "You are the Go Specialist. Implement idiomatic Golang services and HTTP handlers adhering to technical contracts.",
      },
      "db-sql": {
        name: "db-engineer",
        description: "Specialist in SQL schema design, migrations, indexing, and query optimization.",
        mode: "subagent",
        provider: { type: answers.providerType, model: getModelForRole("db-engineer"), promptCaching: answers.enableTokenOptimizations },
        permissions: { edit: "allow", bash: "ask", task: { "*": "deny" }, externalDirectory: "deny" },
        systemPrompt: "You are the Database Engineer. Author relational schema migrations, DDL scripts, and indexing strategies.",
      },
      "db-nosql": {
        name: "db-engineer",
        description: "Specialist in NoSQL data models, single-table design, and aggregation pipelines.",
        mode: "subagent",
        provider: { type: answers.providerType, model: getModelForRole("db-engineer"), promptCaching: answers.enableTokenOptimizations },
        permissions: { edit: "allow", bash: "ask", task: { "*": "deny" }, externalDirectory: "deny" },
        systemPrompt: "You are the Database Engineer. Author NoSQL access patterns, schemas, and cache strategies.",
      },
      "python": {
        name: "python-specialist",
        description: "Specialist in Python services, FastAPI, and data scripting.",
        mode: "subagent",
        provider: { type: answers.providerType, model: getModelForRole("python-specialist"), promptCaching: answers.enableTokenOptimizations },
        permissions: { edit: "allow", bash: "ask", task: { "*": "deny" }, externalDirectory: "deny" },
        systemPrompt: "You are the Python Specialist. Implement typed Python services according to specifications.",
      },
    };

    for (const stackKey of answers.stack) {
      const specAgent = specialistMap[stackKey];
      if (specAgent) {
        await fs.writeFile(
          path.join(agentsDir, `${specAgent.name}.json`),
          JSON.stringify(specAgent, null, 2),
          "utf-8"
        );
      }
    }
  }

  // 6. Write Curated Skills in .harness/skills/
  if (answers.installRecommendedSkills) {
    const skillsBase = path.join(harnessDir, "skills");

    const coreSkills: Record<string, string> = {
      "skill-harness.md": "# Skill: AI Workflow Harness Framework\n\n## Objective\nOperate the 2-tier XP workflow, SQLite spec engine, and security gates.\n\n## Core Rules\n- Tier 1: `harness init` / `harness analyze` for app vision & zero-prompt brownfield auto-discovery.\n- Tier 2: `harness feature <name>` for 1-pass Agile feature generation & risk evaluation.\n- Pre-Commit Security: `harness audit` & `harness preflight` block uncommitted credentials or `.env` files.\n- File Boundaries: Restrict changes to `allowedFiles` (<=2 files per task). Require test exit code 0 on `harness verify`.\n",
      "skill-caveman.md": "# Skill: Caveman Mode\n\n## Objective\nDrastically conserve context tokens by eliminating conversational pleasantries.\n\n## Rules\n- Output dense code diffs and bullet points only.\n- Skip greetings, confirmations, and polite transitions.\n- Maximize signal-to-noise ratio in every reply.\n",
      "skill-context-caching.md": "# Skill: 2-Level Context Caching\n\n## Objective\nMinimize prompt cost across multi-turn agent sessions.\n\n## Rules\n1. Always load `.harness/spec/app-summary.md` as the root anchor.\n2. Load detailed feature sub-specs (`business/`, `ui/`, `technical/`) only when actively implementing that specific feature.\n3. Never load unneeded source files into the context window.\n",
    };

    const stackSkills: Record<string, string> = {
      "skill-tailwind-shadcn.md": "# Skill: Tailwind & Component Architecture\n\n## Rules\n- Use utility-first Tailwind classes adhering to design system tokens.\n- Maintain accessibility attributes (`aria-*`, `role`, focus states).\n- Keep presentation logic separate from data hooks.\n",
      "skill-tanstack-query.md": "# Skill: TanStack Query Best Practices\n\n## Rules\n- Declare standardized query keys using array tuples `['resource', id]`.\n- Implement optimistic updates for mutating actions with automatic rollback.\n- Centralize API fetchers in dedicated service modules.\n",
      "skill-expo-router.md": "# Skill: Expo Router & React Native\n\n## Rules\n- Follow file-based routing conventions in `app/`.\n- Utilize `react-native-reanimated` for 60fps UI transitions.\n- Ensure safe area insets are respected across iOS and Android.\n",
      "skill-typescript-strict.md": "# Skill: Strict TypeScript & Zod\n\n## Rules\n- Enforce `strict: true` with zero usage of `any` (use `unknown` + type guards).\n- Derive runtime types from Zod schemas using `z.infer<typeof Schema>`.\n- Use discriminated unions for distinct application states.\n",
      "skill-idiomatic-go.md": "# Skill: Idiomatic Golang\n\n## Rules\n- Always accept `context.Context` as the first argument in I/O methods.\n- Explicitly wrap errors using `fmt.Errorf(\"action: %w\", err)`.\n- Use structured logging via standard library `log/slog`.\n",
      "skill-sqlc.md": "# Skill: sqlc Type-Safe SQL\n\n## Rules\n- Author pure SQL queries with annotated query names `-- name: GetUser :one`.\n- Run `sqlc generate` to produce type-safe Go structs without ORM overhead.\n",
      "skill-postgres-schema-design.md": "# Skill: PostgreSQL Schema & Migration Strategy\n\n## Rules\n- All foreign keys must include explicit index coverage.\n- Author migrations with deterministic down/rollback scripts.\n- Use `TIMESTAMPTZ` for all temporal columns.\n",
      "skill-dynamodb-single-table.md": "# Skill: DynamoDB Single-Table Design\n\n## Rules\n- Model access patterns before defining Partition (`PK`) and Sort (`SK`) keys.\n- Use composite sort keys with delimiters (e.g., `USER#123#METADATA`).\n",
    };

    const testingSkills: Record<string, string> = {
      "skill-tdd-assertions.md": "# Skill: Test-Driven Development (TDD)\n\n## Rules\n- Author failing tests first before modifying implementation code.\n- Ensure tests assert specific error messages, not just truthiness.\n",
      "skill-zero-noise-reporter.md": "# Skill: Zero-Noise Test Diagnostic Reporting\n\n## Rules\n- Output concise failure cards containing only: Suite Name, Target File, Line Number, and Expected vs Actual values.\n- Do not output successful assertions or hundreds of irrelevant stack trace lines.\n",
    };

    for (const [file, content] of Object.entries(coreSkills)) {
      await fs.writeFile(path.join(skillsBase, "core", file), content, "utf-8");
    }
    for (const [file, content] of Object.entries(stackSkills)) {
      await fs.writeFile(path.join(skillsBase, "stack", file), content, "utf-8");
    }
    for (const [file, content] of Object.entries(testingSkills)) {
      await fs.writeFile(path.join(skillsBase, "testing", file), content, "utf-8");
    }
  }

  // 7. Write Modular Pipeline Standards in .harness/standards/pipeline/
  const pipelineDir = path.join(harnessDir, "standards", "pipeline");
  const pipelineFiles: Record<string, string> = {
    "phase-1-discovery.md": "# Phase 1: Problem Discovery & Baseline Audit\n\n## 1. Interactive Q&A Protocol\nUse Strict 3+2 rule: 3 recommended options, 4) Other, 5) Explain it better.\n\n## 2. Artifacts\nSave interview transcripts to `.harness/memory/discovery/<feature>.md`.\n",
    "phase-2-strategy.md": "# Phase 2: Functional Scope & Workflow Strategy\n\n## 1. Functional Scope\nDefine epics, user journeys, and validate AI execution topology (Orchestrated, Solo, Vibe-Assist).\n",
    "phase-3-design.md": "# Phase 3: Visualization & Design Architecture\n\n## 1. Component Registry\nDefine reusable components in `.harness/UI/custom-components-registry.ts` and details in `.harness/UI/details/<name>/`.\n",
    "phase-4-architecture.md": "# Phase 4: Technical Architecture & Contracts\n\n## 1. Contracts & ADRs\nDefine API contracts, DB schemas, and technical specs (≤500 lines) in `.harness/spec/features/<feature>/technical/spec.md`.\n",
    "phase-5-slicing.md": "# Phase 5: User Story Slicing & Task Backlog\n\n## 1. Task Invariants\nSlice specs into atomic manifests in `.harness/tasks/task-XXX.md` touching ≤2 files each.\n",
  };

  for (const [filename, content] of Object.entries(pipelineFiles)) {
    await fs.writeFile(path.join(pipelineDir, filename), content, "utf-8");
  }

  // 8. Initialize UI Components Registry
  const registryPath = path.join(harnessDir, "UI", "custom-components-registry.ts");
  try {
    await fs.access(registryPath);
  } catch {
    await fs.writeFile(
      registryPath,
      [
        "export interface UIComponentRecord {",
        "  name: string;",
        '  category: "atom" | "molecule" | "organism" | "template";',
        "  location: string;",
        "  description: string;",
        "  propsInterface?: string;",
        "  subComponents?: string[];",
        "  reusableAcross: string[];",
        "}",
        "",
        "export const CustomComponentsRegistry: UIComponentRecord[] = [];",
        "",
      ].join("\n"),
      "utf-8"
    );
  }

  // 9. Write Master Spec Index (app-summary.md)
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
        `> **Stack:** ${validatedConfig.stack.join(", ")}`,
        `> **Workflow Mode:** ${validatedConfig.workflowMode}`,
        "",
        "## System Overview",
        "High-level description of system goals, architecture invariants, and user personas.",
        "",
        "## Features Index",
        "| Feature | Status | Summary | Spec Path |",
        "| :--- | :--- | :--- | :--- |",
        "",
        "## Active Milestones",
        "- [ ] M0: Architectural Foundation",
        "",
      ].join("\n"),
      "utf-8"
    );
  }

  // 10. Write harness.config.json
  await fs.writeFile(
    path.join(harnessDir, "harness.config.json"),
    JSON.stringify(validatedConfig, null, 2),
    "utf-8"
  );

  // 11. Initialize SQLite Spec Database (.harness/harness.db)
  const specDb = new SpecDatabase(harnessDir);
  specDb.upsertFeature({
    id: "feat-core",
    name: validatedConfig.projectName,
    slug: "core-architecture",
    summary: `Core architectural foundation for ${validatedConfig.projectName}`,
    status: "STABLE",
  });
  await specDb.exportToMarkdown(harnessDir);
  specDb.close();

  // 12. Transpile Adapters
  const compiledFiles = await AdapterCompiler.compileAll(validatedConfig, cwd);

  console.log(chalk.green("\n✨ AI Harness initialized successfully!"));
  console.log(chalk.dim(`- Directory: .harness/ (with agents/, skills/, UI/, temp/)`));
  console.log(chalk.dim(`- Selected Strategy: ${answers.modelPreset}`));
  console.log(chalk.dim(`- Compiled Adapters: ${compiledFiles.join(", ")}`));
  console.log(
    chalk.cyan("\nNext: Launch your AI tool or run `harness start <task-id>`.\n")
  );
}