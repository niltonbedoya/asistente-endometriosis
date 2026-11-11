import { describe, expect, it } from 'vitest';
import { workoutPrescriptionSchema } from '@core/contracts/entrenador';

describe('entrenador contract: WorkoutPrescription', () => {
  it('accepts a restorative prescription', () => {
    const prescription = {
      modality: 'RESTORATIVE',
      exercises: [
        {
          name: 'Descompresión lumbopélvica (gato-vaca)',
          biomechanical_target: 'lumbar decompression',
          reps_or_duration: '8 respiraciones x 3 rondas',
          video_ref: 'exercises/gato-vaca.mp4',
          safety_notes: 'Movimiento fluido, sin forzar el rango',
        },
      ],
      contraindicated_movements: ['crunches', 'levanta pesas', 'plancha abdominal'],
    };
    expect(workoutPrescriptionSchema.parse(prescription)).toEqual(prescription);
  });

  it('rejects an unknown modality', () => {
    expect(() =>
      workoutPrescriptionSchema.parse({
        modality: 'HIIT',
        exercises: [],
        contraindicated_movements: [],
      }),
    ).toThrow();
  });

  it('rejects an exercise without safety notes', () => {
    expect(() =>
      workoutPrescriptionSchema.parse({
        modality: 'STRENGTH',
        exercises: [
          {
            name: 'Sentadilla',
            biomechanical_target: 'quads',
            reps_or_duration: '3x10',
            video_ref: 'x.mp4',
          },
        ],
        contraindicated_movements: [],
      }),
    ).toThrow();
  });
});
