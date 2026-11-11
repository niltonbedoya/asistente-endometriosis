import { describe, expect, it } from 'vitest';
import { clinicalTheme, clinicalStatusPresentation } from '@core/ui/theme';
import { createCheckInViewModel } from '@core/ui/check-in';
import { InMemoryLocalStore } from '@core/memory/local-store';

describe('UI foundation: clinical semantic tokens', () => {
  it('uses non-color status labels and accessible contrast-safe presentation', () => {
    for (const status of ['RED', 'YELLOW', 'GREEN'] as const) {
      const presentation = clinicalStatusPresentation(status);
      expect(presentation.label.length).toBeGreaterThan(0);
      expect(presentation.accessibilityLabel).toContain(presentation.label);
      expect(presentation.icon).toBeTruthy();
      expect(presentation.backgroundColor).toBe(clinicalTheme.status[status].background);
      expect(presentation.foregroundColor).toBe(clinicalTheme.status[status].foreground);
    }
  });

  it('does not encode emergency status as color alone', () => {
    const red = clinicalStatusPresentation('RED');
    expect(red.icon).toBe('!');
    expect(red.label).toMatch(/crisis/i);
    expect(red.accessibilityLiveRegion).toBe('assertive');
  });
});

describe('UI foundation: check-in view model', () => {
  it('builds a sub-30-second accessible check-in model', () => {
    const model = createCheckInViewModel({ pain_score: 7, energy_level: 2, bloating: true, bleeding_level: 'MODERATE' });
    expect(model.fields).toHaveLength(4);
    expect(model.fields.map((field) => field.id)).toEqual(['pain_score', 'energy_level', 'bloating', 'bleeding_level']);
    expect(model.fields.every((field) => field.accessibilityLabel.length > 0)).toBe(true);
    expect(model.estimatedSeconds).toBeLessThanOrEqual(30);
  });

  it('exposes validation errors without sending data anywhere', () => {
    const model = createCheckInViewModel({ pain_score: 11, energy_level: 0, bloating: false, bleeding_level: 'NONE' });
    expect(model.errors).toEqual(expect.arrayContaining(['pain_score', 'energy_level']));
    expect(model.submitDisabled).toBe(true);
  });
});

describe('UI foundation: local-first store', () => {
  it('round-trips data locally and preserves isolation between keys', async () => {
    const store = new InMemoryLocalStore();
    await store.set('check-in:today', { pain_score: 4 });
    expect(await store.get('check-in:today')).toEqual({ pain_score: 4 });
    expect(await store.get('profile')).toBeNull();
  });

  it('supports deletion without affecting another record', async () => {
    const store = new InMemoryLocalStore();
    await store.set('a', 1);
    await store.set('b', 2);
    await store.delete('a');
    expect(await store.get('a')).toBeNull();
    expect(await store.get('b')).toBe(2);
  });
});
