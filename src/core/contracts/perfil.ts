import { z } from 'zod';

/**
 * Contract: user profile for the endometriosis assistant.
 * Intolerance vocabulary follows the domain spec: non-restrictive but
 * informative digestive-tolerance metadata (gluten, casein/dairy,
 * histamine level, legumes/lectins, FODMAPs). Clinical flags drive the
 * mandatory disclaimers of the fitoterapista agent.
 */
export const intoleranceTagSchema = z.enum([
  'GLUTEN',
  'LACTOSE_CASEIN',
  'HISTAMINE',
  'LEGUMES_LECTINS',
  'FODMAP',
]);

export type IntoleranceTag = z.infer<typeof intoleranceTagSchema>;

export const medicationSchema = z.object({
  name: z.string().min(1),
  is_anticoagulant: z.boolean().default(false),
});

export type Medication = z.infer<typeof medicationSchema>;

export const userProfileSchema = z
  .object({
    intolerances: z.array(intoleranceTagSchema).default([]),
    is_pregnant: z.boolean().default(false),
    is_breastfeeding: z.boolean().default(false),
    takes_anticoagulants: z.boolean().default(false),
    active_medications: z.array(medicationSchema).default([]),
  })
  .transform((profile) => {
    // Derived invariant: anticoagulant flag is true if the user declared it
    // or if any active medication is marked as anticoagulant.
    const takesAnticoagulants =
      profile.takes_anticoagulants ||
      profile.active_medications.some((m) => m.is_anticoagulant);
    return { ...profile, takes_anticoagulants: takesAnticoagulants };
  });

export type UserProfile = z.infer<typeof userProfileSchema>;
