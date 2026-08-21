import { z } from "zod";

export const AgentPermissionSchema = z.object({
	edit: z.enum(["allow", "deny", "ask"]).default("allow"),
	bash: z.enum(["allow", "deny", "ask"]).default("ask"),
	task: z
		.record(z.string(), z.enum(["allow", "deny", "ask"]))
		.default({ "*": "deny" }),
	externalDirectory: z.enum(["allow", "deny"]).default("deny"),
});

export const CustomAgentSchema = z.object({
	name: z.string().min(1),
	description: z.string().min(1),
	mode: z.enum(["subagent", "primary"]).default("subagent"),
	provider: z.object({
		type: z.enum(["anthropic", "openrouter", "openai", "custom"]),
		model: z.string().min(1),
		promptCaching: z.boolean().default(true),
		baseUrl: z.string().optional(),
	}),
	permissions: AgentPermissionSchema,
	systemPrompt: z.string().min(1),
	skills: z.array(z.string()).default([]),
});

export type CustomAgent = z.infer<typeof CustomAgentSchema>;
export type AgentPermission = z.infer<typeof AgentPermissionSchema>;
