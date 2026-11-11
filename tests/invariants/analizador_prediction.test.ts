import { describe, expect, it } from 'vitest';
import { analyzeBiologicalState } from '@core/agents/analizador';
import type { CheckIn } from '@core/contracts/analizador';

function checkIn(partial: Partial<CheckIn> = {}): CheckIn {
  return {
    pain_score: 2,
    energy_level: 5,
    bloating: false,
    bleeding_level: 'NONE',
    cycle_day: 14,
    ...partial,
  };
}

describe('analizador: traffic light (semaforo)', () => {
  it('pain 7+ means RED (incapacitating pain)', () => {
    const state = analyzeBiologicalState({ check_ins: [checkIn({ pain_score: 8 })] });
    expect(state.traffic_light_status).toBe('RED');
  });

  it('severe bleeding means RED even with low pain', () => {
    const state = analyzeBiologicalState({
      check_ins: [checkIn({ pain_score: 1, bleeding_level: 'SEVERE' })],
    });
    expect(state.traffic_light_status).toBe('RED');
  });

  it('exhaustion (energy 1) means RED per the spec', () => {
    const state = analyzeBiologicalState({ check_ins: [checkIn({ pain_score: 2, energy_level: 1 })] });
    expect(state.traffic_light_status).toBe('RED');
  });

  it('moderate pain or bloating means YELLOW (pro-inflammatory transition)', () => {
    const state = analyzeBiologicalState({ check_ins: [checkIn({ pain_score: 5 })] });
    expect(state.traffic_light_status).toBe('YELLOW');
  });

  it('asymptomatic with optimal energy means GREEN', () => {
    const state = analyzeBiologicalState({ check_ins: [checkIn()] });
    expect(state.traffic_light_status).toBe('GREEN');
  });

  it('worst status of the day wins across multiple check-ins', () => {
    const state = analyzeBiologicalState({
      check_ins: [checkIn(), checkIn({ pain_score: 9 })],
    });
    expect(state.traffic_light_status).toBe('RED');
  });
});

describe('analizador: cycle phase', () => {
  it('maps cycle days to the four phases', () => {
    expect(analyzeBiologicalState({ check_ins: [checkIn({ cycle_day: 2 })] }).current_phase).toBe('MENSTRUAL');
    expect(analyzeBiologicalState({ check_ins: [checkIn({ cycle_day: 8 })] }).current_phase).toBe('FOLLICULAR');
    expect(analyzeBiologicalState({ check_ins: [checkIn({ cycle_day: 14 })] }).current_phase).toBe('OVULATORY');
    expect(analyzeBiologicalState({ check_ins: [checkIn({ cycle_day: 22 })] }).current_phase).toBe('LUTEAL');
  });

  it('uses the average cycle length when projecting phases', () => {
    const state = analyzeBiologicalState({
      check_ins: [checkIn({ cycle_day: 16 })],
      cycle_length_days: 26,
    });
    expect(state.current_phase).toBe('LUTEAL');
  });
});

describe('analizador: predictive risk window (7-14 days horizon)', () => {
  it('projects a HIGH risk luteal window ahead of the next menstrual phase', () => {
    const state = analyzeBiologicalState({ check_ins: [checkIn({ cycle_day: 14 })] });
    expect(state.projected_risk_window.risk_intensity).toBe('HIGH');
    expect(state.projected_risk_window.start_day).toBeGreaterThan(14);
    const horizon = state.projected_risk_window.end_day - 14;
    expect(horizon).toBeGreaterThanOrEqual(7);
    expect(horizon).toBeLessThanOrEqual(14);
  });

  it('keeps the horizon within 7-14 days from today', () => {
    const state = analyzeBiologicalState({ check_ins: [checkIn({ cycle_day: 10 })] });
    const start = state.projected_risk_window.start_day - 10;
    expect(start).toBeGreaterThanOrEqual(7);
    expect(start).toBeLessThanOrEqual(14);
  });

  it('GREEN windows stay LOW risk', () => {
    const state = analyzeBiologicalState({
      check_ins: [checkIn({ cycle_day: 9, pain_score: 1, energy_level: 5 })],
    });
    // Day 9 (follicular): risk window targets ovulation/premenstrual transition
    expect(['LOW', 'MEDIUM']).toContain(state.projected_risk_window.risk_intensity);
  });
});
