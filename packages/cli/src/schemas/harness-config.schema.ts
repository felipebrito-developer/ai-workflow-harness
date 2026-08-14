import { z } from "zod";

export const StackTypeSchema = z.enum([
  "react-native",
  "react-web",
  "node",
  "go",
  "python",
  "content",
]);

export const AIAdapterSchema = z.enum(["opencode", "antigravity"]);

export const WorkflowModeSchema = z.enum([
  "solo-agent",
  "orchestrated",
  "vibe-assist",
]);

export const ProviderConfigSchema = z.object({
  type: z.enum(["anthropic", "openrouter", "openai", "custom"]),
  model: z.string(),
  promptCaching: z.boolean().default(true),
  baseUrl: z.string().optional(),
});

export const TaskBackendSchema = z.object({
  type: z.enum(["local", "linear"]),
  linearTeamKey: z.string().optional(),
  linearProjectSlug: z.string().optional(),
});

export const HarnessConfigSchema = z.object({
  version: z.literal("1.0.0"),
  projectName: z.string().min(1),
  stack: StackTypeSchema,
  adapters: z.array(AIAdapterSchema).min(1),
  workflowMode: WorkflowModeSchema,
  provider: ProviderConfigSchema,
  taskBackend: TaskBackendSchema,
  circuitBreakerLimit: z.number().int().positive().default(3),
  commands: z.object({
    test: z.string(),
    lint: z.string(),
    typecheck: z.string().optional(),
  }),
});

export type HarnessConfig = z.infer<typeof HarnessConfigSchema>;