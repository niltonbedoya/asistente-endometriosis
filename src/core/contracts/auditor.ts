import { z } from 'zod';

/**
 * Contract: auditor agent (AuditReport). Independent QA gatekeeper:
 * every user-facing artifact must pass its validation before delivery.
 */
export const auditReportSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED_WITH_RETRY']),
  contract_violations: z.array(z.string()),
  safety_violations: z.array(z.string()),
  atomic_parity_verified: z.boolean(),
  payload: z.unknown().nullable(),
});

export type AuditReport = z.infer<typeof auditReportSchema>;
