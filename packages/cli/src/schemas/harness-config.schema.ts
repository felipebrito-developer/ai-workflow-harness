import { z } from "zod";

export const HarnessConfigSchema = z.object({
	version: z.string().default("1.0.0"),
	projectName: z.string().min(1),
	stack: z.array(z.string()).min(1),
	packageManager: z
		.enum(["bun", "pnpm", "yarn", "npm", "cargo", "go"])
		.default("bun"),
	adapters: z.array(z.enum(["opencode", "antigravity", "cursor"])).min(1),
	provider: z.object({
		model: z.string().min(1),
		promptCaching: z.boolean().default(true),
	}),
	circuitBreakerLimit: z.number().int().positive().max(5).default(3),
});

export type HarnessConfig = z.infer<typeof HarnessConfigSchema>;
