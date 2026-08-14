import { z } from "zod";

export const DeltaTierSchema = z.enum(["PATCH", "DELTA", "PIVOT"]);

export const GapSpecSchema = z.object({
  gapId: z.string().regex(/^GAP-\d+$/),
  targetFeature: z.string(),
  discoveredDuringTask: z.string(),
  tier: DeltaTierSchema,
  summary: z.string().min(10),
  questions: z.array(
    z.object({
      id: z.number().int().positive(),
      question: z.string(),
      context: z.string(),
      tradeOffs: z.string().optional(),
      resolution: z.string().optional(),
    })
  ),
  specPatches: z.array(
    z.object({
      targetFile: z.string(),
      descriptionOfChange: z.string(),
    })
  ).optional(),
});

export type GapSpec = z.infer<typeof GapSpecSchema>;