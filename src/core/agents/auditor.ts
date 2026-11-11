import {
  auditReportSchema,
  type AuditReport,
} from '@core/contracts/auditor';
import { verifyGroceryParity } from './planificador';
import type { WeeklyNutritionPlan } from '@core/contracts/planificador';
import type { WorkoutPrescription } from '@core/contracts/entrenador';
import type { SupplementFactSheet } from '@core/contracts/fitoterapista';
import { mandatoryDisclaimersFor, type ClinicalFlags } from './fitoterapista';

const HYPERPRESSURE_PATTERNS = [
  'crunch', 'crunches', 'sit-up', 'situp', 'plancha', 'abdominal', 'valsalva', 'peso muerto',
  'barbell', 'deadlift',
];

type TrafficLight = 'RED' | 'YELLOW' | 'GREEN';

function approved(payload: unknown, parity = true): AuditReport {
  return auditReportSchema.parse({
    status: 'APPROVED',
    contract_violations: [],
    safety_violations: [],
    atomic_parity_verified: parity,
    payload,
  });
}

function rejected(
  contractViolations: string[],
  safetyViolations: string[],
  parity = false,
): AuditReport {
  return auditReportSchema.parse({
    status: 'REJECTED_WITH_RETRY',
    contract_violations: contractViolations,
    safety_violations: safetyViolations,
    atomic_parity_verified: parity,
    payload: null,
  });
}

/** Gate for planificador artifacts: schema validity + atomic parity. */
export function auditPlanificador(plan: WeeklyNutritionPlan): AuditReport {
  const days = plan.days as WeeklyNutritionPlan['days'];
  const missing = verifyGroceryParity(days, plan.grocery_list);
  if (missing.length > 0) {
    return rejected([], [`Paridad atómica rota: faltan en la lista de compra: ${missing.join(', ')}`]);
  }
  return approved(plan, true);
}

/** Gate for entrenador artifacts: RED days forbid strength and hyperpressure. */
export function auditEntrenador(prescription: WorkoutPrescription, trafficLight: TrafficLight): AuditReport {
  if (trafficLight === 'RED') {
    if (prescription.modality !== 'RESTORATIVE') {
      return rejected([], ['Ejercicios de fuerza pesada prohibidos en semáforo rojo 🔴']);
    }
    const hyperpressure = prescription.exercises
      .map((e) => `${e.name} ${e.biomechanical_target}`.toLowerCase())
      .filter((text) => HYPERPRESSURE_PATTERNS.some((p) => text.includes(p)));
    if (hyperpressure.length > 0) {
      return rejected([], [`Hiperpresión abdominal en semáforo rojo 🔴: ${hyperpressure.join('; ')}`]);
    }
  }
  return approved(prescription);
}

/** Gate for fitoterapista artifacts: consultative tone + mandatory disclaimers. */
export function auditFitoterapista(
  sheet: SupplementFactSheet,
  flags: ClinicalFlags,
  responseDisclaimers: string[],
): AuditReport {
  const violations: string[] = [];

  const text = `${sheet.suggested_bioavailability_notes} ${sheet.warnings.join(' ')}`.toLowerCase();
  if (/\b\d+\s?(mg|g|ui)\s?(día|diaria|por)\b/.test(text)) {
    violations.push('Dosis farmacológica cerrada detectada: el catálogo es estrictamente consultivo');
  }

  const required = mandatoryDisclaimersFor(flags);
  const responseText = responseDisclaimers.join(' ').toLowerCase();
  for (const disclaimer of required) {
    // The general disclaimer is always acceptable as-is; clinical ones must
    // carry their key concept (embarazo, lactancia, anticoagulante).
    const [key] = disclaimer.toLowerCase().split(/[:,]/);
    if (key === undefined) continue;
    if (key.startsWith('posible embarazo') && !responseText.includes('embarazo')) {
      violations.push('Omisión de descargo obligatorio: embarazo');
    }
    if (key.startsWith('lactancia') && !responseText.includes('lactancia')) {
      violations.push('Omisión de descargo obligatorio: lactancia');
    }
    if (key.startsWith('medicación anticoagulante') && !responseText.includes('anticoagulante')) {
      violations.push('Omisión de descargo obligatorio: anticoagulantes');
    }
  }

  if (violations.length > 0) {
    return rejected([], violations);
  }
  return approved(sheet);
}
