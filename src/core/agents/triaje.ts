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
const PERITONEAL_SIGNS = ['rigid abdomen', 'abdominal guarding', 'peritoneal', 'abdomen rigido'];
const SYNCOPE_SIGNS = ['fainted', 'syncope', 'syncop', 'desmayo', 'desmay', 'sincope'];
const FEVER_SIGNS = ['fever', 'fiebre'];
const BLEEDING_SIGNS = [
  'sangrado abundante',
  'sangrado muy abundante',
  'hemorragia',
  'heavy bleeding',
  'abnormal bleeding',
];

function foldText(text: string): string {
  // Case- and accent-insensitive matching: 'abdomen rígido' and
  // 'abdomen rigido' (missing accent) must behave identically.
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function matchesAny(symptoms: string[], needles: string[]): boolean {
  return symptoms.some((symptom) => {
    const normalized = foldText(symptom);
    return needles.some((needle) => normalized.includes(foldText(needle)));
  });
}

/**
 * Red flags are matched against structured symptoms AND the free-text
 * message, since users may describe an emergency in prose. Matching is
 * case-insensitive in English or Spanish; pain/bleeding rules are unchanged.
 */
function redFlagText(input: TriageInput): string[] {
  return input.user_message
    ? [...input.symptoms, input.user_message]
    : input.symptoms;
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

  if (input.bleeding_level === 'SEVERE' || matchesAny(redFlagText(input), BLEEDING_SIGNS)) {
    reasons.push('Abnormally heavy bleeding reported');
  }

  if (matchesAny(redFlagText(input), PERITONEAL_SIGNS)) {
    reasons.push('Possible peritoneal signs reported');
  }

  if (matchesAny(redFlagText(input), SYNCOPE_SIGNS)) {
    reasons.push('Syncope or fainting reported');
  }

  if (matchesAny(redFlagText(input), FEVER_SIGNS)) {
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
