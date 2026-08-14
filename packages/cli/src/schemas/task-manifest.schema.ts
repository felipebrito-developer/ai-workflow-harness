import { z } from "zod";

export const TaskModeSchema = z.enum(["VARIANT_A", "VARIANT_B"]);
export const TaskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "DONE"]);

export const TaskFrontmatterSchema = z.object({
  id: z.string().regex(/^(TASK-\d+|[A-Z]+-\d+)(\.\d+)?$/, "Format must be TASK-XXX or LINEAR-XXX (e.g. FEL-101 or TASK-001.1)"),
  title: z.string().min(3),
  status: TaskStatusSchema.default("TODO"),
  mode: TaskModeSchema.default("VARIANT_A"),
  feature_ref: z.string().min(1),
  depends_on: z.array(z.string()).default([]),
});

export const TaskManifestSchema = z.object({
  frontmatter: TaskFrontmatterSchema,
  allowedFiles: z.array(z.string()).min(1, "At least one allowed file boundary must be declared"),
  acceptanceCriteria: z.array(z.string()).min(1, "At least one acceptance criterion is required"),
  verificationCommands: z.array(z.string()).min(1, "At least one verification command is required"),
});

export type TaskManifest = z.infer<typeof TaskManifestSchema>;
export type TaskFrontmatter = z.infer<typeof TaskFrontmatterSchema>;