import { describe, expect, it } from 'vitest';
import { InMemoryLocalStore } from '@core/memory/local-store';
import { runDailyCheckInFlow } from '@core/ui/check-in-flow';

const SAFE_INPUT = {
  user_message: 'me siento bien',
  check_in: { pain_score: 2, energy_level: 5, bloating: false, bleeding_level: 'NONE' as const, cycle_day: 10 },
};

describe('critical flow: daily check-in -> triage -> biological state -> local persistence', () => {
  it('persists safe check-in and biological state locally with no network boundary', async () => {
    const store = new InMemoryLocalStore();
    const result = await runDailyCheckInFlow(store, SAFE_INPUT);
    expect(result.kind).toBe('SAFE');
    if (result.kind === 'SAFE') {
      expect(result.triage.status).toBe('SAFE');
      expect(result.biologicalState.traffic_light_status).toBe('GREEN');
      expect(result.biologicalState.cycle_day).toBe(10);
    }
    expect(await store.get('last-check-in')).toMatchObject({ pain_score: 2, cycle_day: 10 });
    expect(await store.get('last-biological-state')).toMatchObject({ traffic_light_status: 'GREEN' });
    expect(await store.get('last-emergency')).toBeNull();
  });

  it('short-circuits on emergency, persists emergency context and never stores ordinary biological state', async () => {
    const store = new InMemoryLocalStore();
    await store.set('last-biological-state', { traffic_light_status: 'GREEN' });
    const result = await runDailyCheckInFlow(store, {
      user_message: 'dolor insoportable y sangrado abundante',
      check_in: { pain_score: 10, energy_level: 1, bloating: true, bleeding_level: 'SEVERE' as const, cycle_day: 3 },
    });
    expect(result.kind).toBe('EMERGENCY');
    if (result.kind === 'EMERGENCY') {
      expect(result.triage.status).toBe('EMERGENCY_REDIRECT');
      expect(result.emergency.reasons.length).toBeGreaterThan(0);
    }
    expect(await store.get('last-emergency')).toBeTruthy();
    expect(await store.get('last-biological-state')).toBeNull();
  });

  it('persists check-in even when cycle day is missing but never fabricates a biological state', async () => {
    const store = new InMemoryLocalStore();
    const result = await runDailyCheckInFlow(store, {
      check_in: { pain_score: 2, energy_level: 4, bloating: false, bleeding_level: 'NONE' as const },
    });
    expect(result.kind).toBe('SAFE_NO_CYCLE');
    expect(await store.get('last-check-in')).toMatchObject({ pain_score: 2 });
    expect(await store.get('last-biological-state')).toBeNull();
  });
});
