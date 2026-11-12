import { evaluateSafety } from '@core/agents/triaje';
import { analyzeBiologicalState } from '@core/agents/analizador';
import type { SafetyEvaluation } from '@core/contracts/triaje';
import type { BiologicalState, CheckIn } from '@core/contracts/analizador';
import type { LocalStore } from '@core/memory/local-store';
import { checkInSchema } from '@core/contracts/analizador';

export interface DailyCheckInInput {
  user_message?: string;
  check_in: {
    pain_score: number;
    energy_level: number;
    bloating: boolean;
    bleeding_level: 'NONE' | 'SPOTTING' | 'MILD' | 'MODERATE' | 'SEVERE';
    cycle_day?: number;
  };
}

export type DailyCheckInResult =
  | { kind: 'EMERGENCY'; triage: SafetyEvaluation; emergency: { reasons: string[]; disclaimers: string[] } }
  | { kind: 'SAFE'; triage: SafetyEvaluation; biologicalState: BiologicalState }
  | { kind: 'SAFE_NO_CYCLE'; triage: SafetyEvaluation };

const CHECK_IN_KEY = 'last-check-in';
const BIO_STATE_KEY = 'last-biological-state';
const EMERGENCY_KEY = 'last-emergency';

/**
 * Critical Local-First flow: triage first (circuit breaker), then biological
 * analysis, then local persistence. No network calls, no cloud persistence.
 */
export async function runDailyCheckInFlow(store: LocalStore, input: DailyCheckInInput): Promise<DailyCheckInResult> {
  const triage = evaluateSafety({
    user_message: input.user_message,
    pain_score: input.check_in.pain_score,
    bleeding_level: input.check_in.bleeding_level,
    symptoms: [],
  });

  if (triage.status === 'EMERGENCY_REDIRECT') {
    await store.delete(BIO_STATE_KEY);
    await store.set(CHECK_IN_KEY, input.check_in);
    const emergency = { reasons: triage.emergency_reasons, disclaimers: triage.required_disclaimers };
    await store.set(EMERGENCY_KEY, { ...emergency, at: 'local-event' });
    return { kind: 'EMERGENCY', triage, emergency };
  }

  await store.delete(EMERGENCY_KEY);
  await store.set(CHECK_IN_KEY, input.check_in);

  const cycleDay = input.check_in.cycle_day;
  if (typeof cycleDay !== 'number' || cycleDay < 1) {
    await store.delete(BIO_STATE_KEY);
    return { kind: 'SAFE_NO_CYCLE', triage };
  }

  const parsedCheckIn = checkInSchema.parse({ ...input.check_in, cycle_day: cycleDay }) as CheckIn;
  const biologicalState = analyzeBiologicalState({ check_ins: [parsedCheckIn], cycle_day: cycleDay });
  await store.set(BIO_STATE_KEY, biologicalState);
  return { kind: 'SAFE', triage, biologicalState };
}
