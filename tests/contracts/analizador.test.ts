import { describe, expect, it } from 'vitest';
import {
  biologicalStateSchema,
  checkInSchema,
} from '@core/contracts/analizador';

describe('analizador contract: BiologicalState', () => {
  it('accepts a complete biological state', () => {
    const state = {
      current_phase: 'LUTEAL',
      traffic_light_status: 'YELLOW',
      cycle_day: 22,
      confidence_score: 0.8,
      projected_risk_window: { start_day: 25, end_day: 29, risk_intensity: 'HIGH' },
    };
    expect(biologicalStateSchema.parse(state)).toEqual(state);
  });

  it('rejects an unknown cycle phase', () => {
    expect(() =>
      biologicalStateSchema.parse({
        current_phase: 'PMS',
        traffic_light_status: 'GREEN',
        cycle_day: 10,
        confidence_score: 0.5,
        projected_risk_window: { start_day: 12, end_day: 15, risk_intensity: 'LOW' },
      }),
    ).toThrow();
  });

  it('rejects a confidence score out of range', () => {
    expect(() =>
      biologicalStateSchema.parse({
        current_phase: 'MENSTRUAL',
        traffic_light_status: 'RED',
        cycle_day: 3,
        confidence_score: 1.5,
        projected_risk_window: { start_day: 5, end_day: 9, risk_intensity: 'LOW' },
      }),
    ).toThrow();
  });

  it('rejects an inverted projected risk window', () => {
    expect(() =>
      biologicalStateSchema.parse({
        current_phase: 'OVULATORY',
        traffic_light_status: 'GREEN',
        cycle_day: 14,
        confidence_score: 0.6,
        projected_risk_window: { start_day: 20, end_day: 18, risk_intensity: 'MEDIUM' },
      }),
    ).toThrow();
  });
});

describe('analizador contract: CheckIn', () => {
  it('accepts a check-in with all four telemetry fields', () => {
    const checkIn = {
      pain_score: 6,
      energy_level: 2,
      bloating: true,
      bleeding_level: 'MODERATE',
    };
    expect(checkInSchema.parse(checkIn)).toEqual(checkIn);
  });

  it('rejects energy outside 1-5', () => {
    expect(() =>
      checkInSchema.parse({ pain_score: 3, energy_level: 6, bloating: false, bleeding_level: 'NONE' }),
    ).toThrow();
  });
});
