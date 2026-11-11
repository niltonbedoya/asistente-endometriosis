import { evaluateSafety } from '@core/agents/triaje';
import { analyzeBiologicalState } from '@core/agents/analizador';
import { prescribeWorkout } from '@core/agents/entrenador';
import { getSupplementFactSheet, mandatoryDisclaimersFor } from '@core/agents/fitoterapista';
import { auditPlanificador, auditEntrenador, auditFitoterapista } from '@core/agents/auditor';
import type { SafetyEvaluation } from '@core/contracts/triaje';
import type { BiologicalState } from '@core/contracts/analizador';
import type { AuditReport } from '@core/contracts/auditor';
import type { WeeklyNutritionPlan } from '@core/contracts/planificador';
import type { WorkoutPrescription } from '@core/contracts/entrenador';
import type { SupplementFactSheet } from '@core/contracts/fitoterapista';
import type { UserProfile } from '@core/contracts/perfil';

/**
 * Orquestador: routes the turn through the triaje fast-path first. A red
 * flag short-circuits the whole pipeline and emits the emergency response
 * (invariant: no ordinary recommendations during EMERGENCY_REDIRECT).
 */
export interface OrquestadorRequest {
  user_message?: string;
  check_in?: {
    pain_score: number;
    energy_level: number;
    bloating: boolean;
    bleeding_level: 'NONE' | 'SPOTTING' | 'MILD' | 'MODERATE' | 'SEVERE';
    cycle_day?: number;
  };
  profile: UserProfile;
  requests: Array<'plan' | 'workout' | 'supplement'>;
  plan?: WeeklyNutritionPlan;
  cycle_length_days?: number;
}

export interface OrquestadorResponse {
  triage: SafetyEvaluation;
  emergency: { reasons: string[]; disclaimers: string[] } | null;
  biological_state: BiologicalState | null;
  plan: WeeklyNutritionPlan | null;
  workout: WorkoutPrescription | null;
  supplement_sheet: SupplementFactSheet | null;
  disclaimers: string[];
  audit_report: AuditReport;
}

const EMERGENCY_DISCLAIMER =
  'Acude a un centro de urgencias de inmediato. No es recomendación médica personalizada: es una señal de alarma clínica.';

export function handleUserTurn(request: OrquestadorRequest): OrquestadorResponse {
  // 1) Fast-path: deterministic triage FIRST, no exceptions.
  const triage = evaluateSafety({
    user_message: request.user_message,
    pain_score: request.check_in?.pain_score,
    bleeding_level: request.check_in?.bleeding_level,
    symptoms: [],
  });

  if (triage.status === 'EMERGENCY_REDIRECT') {
    return {
      triage,
      emergency: {
        reasons: triage.emergency_reasons,
        disclaimers: [...triage.required_disclaimers, EMERGENCY_DISCLAIMER],
      },
      biological_state: null,
      plan: null,
      workout: null,
      supplement_sheet: null,
      disclaimers: [...triage.required_disclaimers, EMERGENCY_DISCLAIMER],
      audit_report: {
        status: 'APPROVED',
        contract_violations: [],
        safety_violations: [],
        atomic_parity_verified: true,
        payload: 'emergency_redirect',
      },
    };
  }

  // 2) Specialized pipeline (only reachable when SAFE).
  const pipelineErrors: string[] = [];
  let biologicalState: BiologicalState | null = null;
  let workout: WorkoutPrescription | null = null;
  let sheet: SupplementFactSheet | null = null;
  let planAudit: AuditReport | null = null;

  if (request.check_in) {
    try {
      biologicalState = analyzeBiologicalState({
        check_ins: [request.check_in],
        cycle_length_days: request.cycle_length_days,
      });
    } catch (error) {
      pipelineErrors.push(`analizador: ${(error as Error).message}`);
    }
  }

  if (request.requests.includes('workout')) {
    try {
      workout = prescribeWorkout({
        traffic_light_status: biologicalState?.traffic_light_status ?? 'YELLOW',
        pain_score: request.check_in?.pain_score ?? 3,
        energy_level: request.check_in?.energy_level ?? 3,
        cycle_phase: biologicalState?.current_phase ?? 'FOLLICULAR',
        available_equipment: [],
      });
    } catch (error) {
      pipelineErrors.push(`entrenador_personal: ${(error as Error).message}`);
    }
  }

  if (request.requests.includes('supplement')) {
    try {
      sheet = getSupplementFactSheet('magnesio');
    } catch (error) {
      pipelineErrors.push(`fitoterapista: ${(error as Error).message}`);
    }
  }

  // 3) Auditor gate on every artifact before delivery.
  if (request.requests.includes('plan')) {
    if (request.plan) {
      planAudit = auditPlanificador(request.plan);
    } else {
      planAudit = {
        status: 'REJECTED_WITH_RETRY',
        contract_violations: ['plan request without a plan artifact'],
        safety_violations: [],
        atomic_parity_verified: false,
        payload: null,
      };
    }
  }

  let audit: AuditReport = planAudit ?? {
    status: 'APPROVED',
    contract_violations: [],
    safety_violations: [],
    atomic_parity_verified: true,
    payload: 'no_plan_requested',
  };

  if (workout) {
    const workoutAudit = auditEntrenador(workout, biologicalState?.traffic_light_status ?? 'YELLOW');
    if (workoutAudit.status === 'REJECTED_WITH_RETRY') {
      audit = workoutAudit;
      workout = null;
    }
  }

  const disclaimers = sheet
    ? mandatoryDisclaimersFor({
        ...request.profile,
        intolerances: request.profile.intolerances,
      })
    : [];

  if (sheet) {
    const sheetAudit = auditFitoterapista(sheet, { ...request.profile, intolerances: request.profile.intolerances }, disclaimers);
    if (sheetAudit.status === 'REJECTED_WITH_RETRY') {
      audit = sheetAudit;
      sheet = null;
    }
  }

  if (pipelineErrors.length > 0) {
    audit = {
      status: 'REJECTED_WITH_RETRY',
      contract_violations: pipelineErrors,
      safety_violations: [],
      atomic_parity_verified: audit.atomic_parity_verified,
      payload: null,
    };
  }

  return {
    triage,
    emergency: null,
    biological_state: biologicalState,
    plan: audit.atomic_parity_verified && request.requests.includes('plan') && planAudit?.status === 'APPROVED' ? request.plan ?? null : null,
    workout,
    supplement_sheet: sheet,
    disclaimers,
    audit_report: audit,
  };
}
