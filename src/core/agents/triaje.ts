import {
  safetyEvaluationSchema,
  type SafetyEvaluation,
  type TriageInput,
} from '@core/contracts/triaje';

/**
 * Deterministic red-flag rules. No LLM involved: safety must never depend
 * on inference. Symptoms are matched case-insensitively in English or
 * Spanish, since check-ins may be written in either language.
 */
const PERITONEAL_SIGNS = ['rigid abdomen', 'abdominal guarding', 'peritoneal', 'abdomen rígido'];
const SYNCOPE_SIGNS = ['fainted', 'syncope', 'syncop', 'desmayo', 'desmay', 'síncope'];
const FEVER_SIGNS = ['fever', 'fiebre'];

function matchesAny(symptoms: string[], needles: string[]): boolean {
  return symptoms.some((symptom) => {
    const normalized = symptom.toLowerCase();
    return needles.some((needle) => normalized.includes(needle));
  });
}

/**
 * Evaluates a check-in or free-text message against the red-flag protocol.
 * Output is always a well-formed SafetyEvaluation (validated by its own
 * contract schema before returning).
 */
export function evaluateSafety(input: TriageInput): SafetyEvaluation {
  const reasons: string[] = [];

  if (input.pain_score !== undefined && input.pain_score >= 10) {
    reasons.push('Sudden incapacitating pain 10/10 reported');
  }

  if (input.bleeding_level === 'SEVERE') {
    reasons.push('Abnormally heavy bleeding reported');
  }

  if (matchesAny(input.symptoms, PERITONEAL_SIGNS)) {
    reasons.push('Possible peritoneal signs reported');
  }

  if (matchesAny(input.symptoms, SYNCOPE_SIGNS)) {
    reasons.push('Syncope or fainting reported');
  }

  if (matchesAny(input.symptoms, FEVER_SIGNS)) {
    reasons.push('Active fever with pelvic symptoms reported');
  }

  const evaluation: SafetyEvaluation =
    reasons.length > 0
      ? {
          status: 'EMERGENCY_REDIRECT',
          alert_level: 'CRITICAL',
          emergency_reasons: reasons,
          required_disclaimers: [
            'Acuda a un centro de urgencias de inmediato. No es recomendación médica personalizada: es una señal de alarma clínica.',
          ],
        }
      : {
          status: 'SAFE',
          alert_level: 'INFO',
          emergency_reasons: [],
          required_disclaimers: [],
        };

  return safetyEvaluationSchema.parse(evaluation);
}
