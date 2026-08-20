import { z } from "zod";

export const HarnessConfigSchema = z.object({
  version: z.string().default("1.0.0"),
  projectName: z.string().min(1),
  stack: z.array(z.string()).min(1),
  adapters: z.array(z.enum(["opencode", "antigravity", "cursor"])).min(1),
  workflowMode: z.enum(["solo-agent", "orchestrated", "vibe-assist"]).default("orchestrated"),
  provider: z.object({
    type: z.enum(["anthropic", "openrouter", "openai", "custom"]),
    model: z.string().min(1),
    promptCaching: z.boolean().default(true),
    baseUrl: z.string().optional(),
  }),
  taskBackend: z.object({
    type: z.enum(["local", "linear"]).default("local"),
  }),
  memoryBackend: z.object({
    type: z.enum(["local-logs", "ai-memory"]).default("local-logs"),
    aiMemoryConfig: z.object({
      wikiPath: z.string().default(".harness/wiki"),
      autoSync: z.boolean().default(true),
    }).optional(),
  }).optional(),
  circuitBreakerLimit: z.number().int().positive().max(5).default(3),
  pipelineMode: z.enum(["full-waterfall", "agile-fasttrack", "hotfix"]).default("agile-fasttrack"),
  vibeSettings: z.object({
    autoExpandBoundaries: z.boolean().default(true),
    retroIndexSpecs: z.boolean().default(true),
  }).default({ autoExpandBoundaries: true, retroIndexSpecs: true }),
  commands: z.object({
    test: z.string().min(1),
    lint: z.string().min(1),
    typecheck: z.string().optional(),
  }),
});

export type HarnessConfig = z.infer<typeof HarnessConfigSchema>;