import { z } from 'zod';

/**
 * Contract: triaje agent output (SafetyEvaluation).
 * The triage agent is a deterministic circuit breaker: its critical logic
 * never depends on an LLM. See docs/safety/red-flag-protocol.md.
 */
export const safetyEvaluationSchema = z
  .object({
    status: z.enum(['SAFE', 'EMERGENCY_REDIRECT']),
    alert_level: z.enum(['INFO', 'WARNING', 'CRITICAL']),
    emergency_reasons: z.array(z.string()),
    required_disclaimers: z.array(z.string()),
  })
  .superRefine((value, ctx) => {
    if (value.status === 'EMERGENCY_REDIRECT' && value.emergency_reasons.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['emergency_reasons'],
        message: 'EMERGENCY_REDIRECT requires at least one emergency reason',
      });
    }
    if (value.status === 'SAFE' && value.alert_level === 'CRITICAL') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['alert_level'],
        message: 'A SAFE evaluation cannot carry a CRITICAL alert level',
      });
    }
  });

export type SafetyEvaluation = z.infer<typeof safetyEvaluationSchema>;

export const bleedingLevelSchema = z.enum([
  'NONE',
  'SPOTTING',
  'MILD',
  'MODERATE',
  'SEVERE',
]);

export type BleedingLevel = z.infer<typeof bleedingLevelSchema>;

/**
 * Contract: triaje agent input. A daily check-in (< 30 s) and/or free text.
 */
export const triageInputSchema = z.object({
  user_message: z.string().optional(),
  pain_score: z.number().int().min(0).max(10).optional(),
  bleeding_level: bleedingLevelSchema.optional(),
  symptoms: z.array(z.string()).default([]),
});

export type TriageInput = z.infer<typeof triageInputSchema>;
