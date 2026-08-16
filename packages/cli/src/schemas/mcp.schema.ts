import { z } from "zod";

export const McpServerSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["local", "remote"]).default("local"),
  command: z.array(z.string()).default([]),
  url: z.string().optional(),
  env: z.record(z.string(), z.string()).default({}),
  description: z.string().optional(),
});

export type McpServer = z.infer<typeof McpServerSchema>;