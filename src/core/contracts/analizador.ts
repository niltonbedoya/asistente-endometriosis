import { z } from 'zod';
import { bleedingLevelSchema } from './triaje';

/**
 * Contract: analizador agent (BiologicalState).
 * Deterministic cyclic analysis: cycle phase, clinical traffic light and
 * predictive inflammatory risk window (7-14 day horizon).
 */
export const cyclePhaseSchema = z.enum(['MENSTRUAL', 'FOLLICULAR', 'OVULATORY', 'LUTEAL']);
export type CyclePhase = z.infer<typeof cyclePhaseSchema>;

export const trafficLightSchema = z.enum(['RED', 'YELLOW', 'GREEN']);
export type TrafficLight = z.infer<typeof trafficLightSchema>;

export const riskIntensitySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);
export type RiskIntensity = z.infer<typeof riskIntensitySchema>;

export const checkInSchema = z.object({
  pain_score: z.number().int().min(0).max(10),
  energy_level: z.number().int().min(1).max(5),
  bloating: z.boolean(),
  bleeding_level: bleedingLevelSchema,
  cycle_day: z.number().int().min(1).max(60).optional(),
});

export type CheckIn = z.infer<typeof checkInSchema>;

export const biologicalStateSchema = z
  .object({
    current_phase: cyclePhaseSchema,
    traffic_light_status: trafficLightSchema,
    cycle_day: z.number().int().min(1).max(60),
    confidence_score: z.number().min(0).max(1),
    projected_risk_window: z
      .object({
        start_day: z.number().int().min(1).max(60),
        end_day: z.number().int().min(1).max(60),
        risk_intensity: riskIntensitySchema,
      })
      .refine((w) => w.end_day >= w.start_day, {
        message: 'Projected risk window must not be inverted',
      }),
  });

export type BiologicalState = z.infer<typeof biologicalStateSchema>;
