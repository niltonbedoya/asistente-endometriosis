import { describe, expect, it } from 'vitest';
import { evaluateSafety } from '@core/agents/triaje';

describe('invariant: red-flag circuit breaker', () => {
  it('pain 10/10 triggers immediate emergency redirect', () => {
    const result = evaluateSafety({
      pain_score: 10,
      symptoms: ['sudden severe pelvic pain'],
    });
    expect(result.status).toBe('EMERGENCY_REDIRECT');
    expect(result.alert_level).toBe('CRITICAL');
    expect(result.emergency_reasons.length).toBeGreaterThan(0);
  });

  it('abnormally heavy bleeding triggers emergency redirect', () => {
    const result = evaluateSafety({
      pain_score: 3,
      bleeding_level: 'SEVERE',
      symptoms: [],
    });
    expect(result.status).toBe('EMERGENCY_REDIRECT');
  });

  it('peritoneal signs trigger emergency redirect', () => {
    const result = evaluateSafety({
      pain_score: 6,
      symptoms: ['rigid abdomen', 'abdominal guarding'],
    });
    expect(result.status).toBe('EMERGENCY_REDIRECT');
  });

  it('syncope triggers emergency redirect', () => {
    const result = evaluateSafety({
      pain_score: 4,
      symptoms: ['fainted', 'dizziness'],
    });
    expect(result.status).toBe('EMERGENCY_REDIRECT');
  });

  it('active fever with pelvic pain triggers emergency redirect', () => {
    const result = evaluateSafety({
      pain_score: 7,
      symptoms: ['fever', 'pelvic pain'],
    });
    expect(result.status).toBe('EMERGENCY_REDIRECT');
  });

  it('a routine mild check-in stays SAFE', () => {
    const result = evaluateSafety({
      pain_score: 3,
      bleeding_level: 'MILD',
      symptoms: ['mild bloating'],
    });
    expect(result.status).toBe('SAFE');
    expect(result.alert_level).toBe('INFO');
  });

  it('an emergency redirect always carries an urgent-care disclaimer', () => {
    const result = evaluateSafety({
      pain_score: 10,
      symptoms: [],
    });
    expect(result.status).toBe('EMERGENCY_REDIRECT');
    expect(result.required_disclaimers.join(' ').toLowerCase()).toContain('urgencia');
  });
});
