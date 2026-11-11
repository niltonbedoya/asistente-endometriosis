import { describe, expect, it } from 'vitest';
import { prescribeWorkout } from '@core/agents/entrenador';

const HYPERPRESSURE = ['crunch', 'abdominal', 'crunches', 'plancha', 'sit-up', 'valsalva', 'hiperpresión'];

describe('invariant: workout safety on red traffic light', () => {
  it('RED day prescribes ONLY restorative work (pelvic floor, decompression, stretching, breathing)', () => {
    const prescription = prescribeWorkout({
      traffic_light_status: 'RED',
      pain_score: 8,
      energy_level: 2,
      cycle_phase: 'MENSTRUAL',
      available_equipment: ['dumbbells'],
    });
    expect(prescription.modality).toBe('RESTORATIVE');
    const names = prescription.exercises.map((e) => e.name.toLowerCase()).join(' ');
    expect(names).toMatch(/suelo pélvico|descompresión|estiramiento|diafragmátic|miofascial/);
  });

  it('RED day never includes strength or hyperpressure movements', () => {
    const prescription = prescribeWorkout({
      traffic_light_status: 'RED',
      pain_score: 9,
      energy_level: 1,
      cycle_phase: 'MENSTRUAL',
      available_equipment: ['barbell', 'dumbbells'],
    });
    expect(prescription.modality).toBe('RESTORATIVE');
    const all = prescription.exercises.map((e) => e.name.toLowerCase()).join(' ');
    for (const banned of HYPERPRESSURE) {
      expect(all).not.toContain(banned);
    }
    // Heavy equipment must not appear in restorative exercise names or targets
    const targets = prescription.exercises.map((e) => e.biomechanical_target.toLowerCase()).join(' ');
    expect(targets).not.toMatch(/\bbarbell\b|\bpeso muerto\b|\bpress\b/);
  });

  it('RED day explicitly lists contraindicated movements', () => {
    const prescription = prescribeWorkout({
      traffic_light_status: 'RED',
      pain_score: 8,
      energy_level: 1,
      cycle_phase: 'MENSTRUAL',
      available_equipment: [],
    });
    expect(prescription.contraindicated_movements.length).toBeGreaterThan(0);
  });
});

describe('invariant: strength only in yellow/green windows', () => {
  it('GREEN day with good energy prescribes progressive strength', () => {
    const prescription = prescribeWorkout({
      traffic_light_status: 'GREEN',
      pain_score: 1,
      energy_level: 5,
      cycle_phase: 'FOLLICULAR',
      available_equipment: ['dumbbells'],
    });
    expect(prescription.modality).toBe('STRENGTH');
    expect(prescription.exercises.length).toBeGreaterThan(0);
    expect(prescription.exercises.every((e) => e.safety_notes.length > 0)).toBe(true);
  });

  it('YELLOW day allows strength but adds safety notes and contraindications', () => {
    const prescription = prescribeWorkout({
      traffic_light_status: 'YELLOW',
      pain_score: 5,
      energy_level: 3,
      cycle_phase: 'LUTEAL',
      available_equipment: ['dumbbells'],
    });
    expect(prescription.modality).toBe('STRENGTH');
    expect(prescription.contraindicated_movements).toContain('hiperpresión abdominal');
    const notes = prescription.exercises.map((e) => e.safety_notes.toLowerCase()).join(' ');
    expect(notes).toMatch(/dolor|stop|detener/);
  });

  it('YELLOW day without equipment falls back to bodyweight strength', () => {
    const prescription = prescribeWorkout({
      traffic_light_status: 'YELLOW',
      pain_score: 4,
      energy_level: 3,
      cycle_phase: 'FOLLICULAR',
      available_equipment: [],
    });
    expect(prescription.modality).toBe('STRENGTH');
    const all = prescription.exercises.map((e) => e.name.toLowerCase()).join(' ');
    expect(all).not.toMatch(/dumbbell|barbell|pesas/);
  });
});
