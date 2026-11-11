import { describe, expect, it } from 'vitest';
import {
  safetyEvaluationSchema,
  triageInputSchema,
  type SafetyEvaluation,
} from '@core/contracts/triaje';

describe('triaje contract: SafetyEvaluation', () => {
  it('accepts a valid SAFE evaluation', () => {
    const evaluation: SafetyEvaluation = {
      status: 'SAFE',
      alert_level: 'INFO',
      emergency_reasons: [],
      required_disclaimers: [],
    };
    expect(safetyEvaluationSchema.parse(evaluation)).toEqual(evaluation);
  });

  it('accepts a valid EMERGENCY_REDIRECT with reasons', () => {
    const evaluation: SafetyEvaluation = {
      status: 'EMERGENCY_REDIRECT',
      alert_level: 'CRITICAL',
      emergency_reasons: ['sudden pain 10/10'],
      required_disclaimers: ['Seek immediate emergency care'],
    };
    expect(safetyEvaluationSchema.parse(evaluation)).toEqual(evaluation);
  });

  it('rejects EMERGENCY_REDIRECT without emergency reasons', () => {
    const evaluation = {
      status: 'EMERGENCY_REDIRECT',
      alert_level: 'CRITICAL',
      emergency_reasons: [],
      required_disclaimers: [],
    };
    expect(() => safetyEvaluationSchema.parse(evaluation)).toThrow();
  });

  it('rejects an unknown status value', () => {
    const evaluation = {
      status: 'MAYBE_SAFE',
      alert_level: 'INFO',
      emergency_reasons: [],
      required_disclaimers: [],
    };
    expect(() => safetyEvaluationSchema.parse(evaluation)).toThrow();
  });

  it('rejects a CRITICAL alert_level with SAFE status (incoherent)', () => {
    const evaluation = {
      status: 'SAFE',
      alert_level: 'CRITICAL',
      emergency_reasons: [],
      required_disclaimers: [],
    };
    expect(() => safetyEvaluationSchema.parse(evaluation)).toThrow();
  });
});

describe('triaje contract: triageInput', () => {
  it('accepts a check-in log with pain, bleeding and symptoms', () => {
    const input = {
      pain_score: 4,
      bleeding_level: 'MILD',
      symptoms: ['abdominal bloating'],
    };
    expect(triageInputSchema.parse(input)).toEqual(input);
  });

  it('rejects pain_score above 10', () => {
    expect(() => triageInputSchema.parse({ pain_score: 11, symptoms: [] })).toThrow();
  });

  it('rejects negative pain_score', () => {
    expect(() => triageInputSchema.parse({ pain_score: -1, symptoms: [] })).toThrow();
  });

  it('accepts free-text user messages with the metrics', () => {
    const input = {
      user_message: 'Me duele mucho el costado izquierdo',
      pain_score: 8,
      bleeding_level: 'MODERATE',
      symptoms: ['pelvic pain'],
    };
    expect(triageInputSchema.parse(input)).toEqual(input);
  });
});
