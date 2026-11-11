import { z } from 'zod';

/**
 * Contract: entrenador_personal agent (WorkoutPrescription).
 * Bimodal training: RESTORATIVE on RED days (pelvic floor work, lumbo-pelvic
 * decompression, myofascial stretching, diaphragmatic breathing) and
 * STRENGTH in green/yellow windows. Heavy abdominal hyperpressure is
 * strictly forbidden on RED days (workout_safety invariant).
 */
export const exerciseSchema = z.object({
  name: z.string().min(1),
  biomechanical_target: z.string().min(1),
  sets: z.number().int().positive().optional(),
  reps_or_duration: z.string().min(1),
  video_ref: z.string().min(1),
  safety_notes: z.string().min(1),
});

export type Exercise = z.infer<typeof exerciseSchema>;

export const workoutPrescriptionSchema = z.object({
  modality: z.enum(['RESTORATIVE', 'STRENGTH']),
  exercises: z.array(exerciseSchema),
  contraindicated_movements: z.array(z.string()),
});

export type WorkoutPrescription = z.infer<typeof workoutPrescriptionSchema>;
