import { z } from 'zod';

/**
 * Contract: fitoterapista agent (SupplementFactSheet).
 * Strictly consultative: biological targets, bioavailability and
 * precautions. Never closes a pharmacological dose.
 */
export const supplementFactSheetSchema = z.object({
  compound: z.string().min(1),
  biological_target: z.string().min(1),
  evidence_level: z.enum(['HIGH', 'MODERATE', 'PRELIMINARY']),
  suggested_bioavailability_notes: z.string().min(1),
  warnings: z.array(z.string()),
  mandatory_disclaimer: z.string().min(1),
});

export type SupplementFactSheet = z.infer<typeof supplementFactSheetSchema>;
