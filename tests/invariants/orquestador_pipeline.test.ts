import { describe, expect, it } from 'vitest';
import { handleUserTurn } from '@core/orquestador';
import { consolidateGroceryList } from '@core/agents/planificador';
import { weeklyNutritionPlanSchema } from '@core/contracts/planificador';
import type { UserProfile } from '@core/contracts/perfil';

const PROFILE: UserProfile = {
  intolerances: [],
  is_pregnant: false,
  is_breastfeeding: false,
  takes_anticoagulants: false,
  active_medications: [],
};

describe('orquestador: red-flag fast path', () => {
  it('a 10/10 pain message short-circuits the whole pipeline with emergency response', () => {
    const response = handleUserTurn({
      user_message: 'Me duele todo, es insoportable',
      check_in: { pain_score: 10, energy_level: 1, bloating: true, bleeding_level: 'SEVERE', cycle_day: 3 },
      profile: PROFILE,
      requests: ['plan', 'workout', 'supplement'],
    });
    expect(response.triage.status).toBe('EMERGENCY_REDIRECT');
    expect(response.emergency).not.toBeNull();
    expect(response.plan).toBeNull();
    expect(response.workout).toBeNull();
    expect(response.supplement_sheet).toBeNull();
  });
});

describe('orquestador: free-text red flags', () => {
  it('a free-text emergency message short-circuits the pipeline', () => {
    const response = handleUserTurn({
      user_message: 'ayer me desmayé y tengo el abdomen rígido y fiebre',
      profile: PROFILE,
      requests: ['workout'],
    });
    expect(response.triage.status).toBe('EMERGENCY_REDIRECT');
    expect(response.emergency).not.toBeNull();
    expect(response.workout).toBeNull();
  });
});

describe('orquestador: fail-safe workout dispatch', () => {
  it('delivers a RESTORATIVE workout (never STRENGTH) when the analizador cannot run', () => {
    // No cycle_day => analyzeBiologicalState throws => biologicalState null.
    // The dispatch must fall back to the conservative RED light, not YELLOW.
    const response = handleUserTurn({
      check_in: { pain_score: 9, energy_level: 2, bloating: false, bleeding_level: 'MILD' },
      profile: PROFILE,
      requests: ['workout'],
    });
    expect(response.triage.status).toBe('SAFE');
    expect(response.biological_state).toBeNull();
    expect(response.workout).not.toBeNull();
    expect(response.workout?.modality).toBe('RESTORATIVE');
  });
});

describe('orquestador: audited pipeline', () => {
  const planDays = Array.from({ length: 7 }, (_, day_index) => ({
    day_index,
    meals: [
      {
        name: `Comida ${day_index}`,
        ingredients: [{ name: 'Quinoa', quantity: 100, unit: 'g', category: 'Granos' }],
        microbiota_tags: [],
      },
    ],
  }));
  const plan = weeklyNutritionPlanSchema.parse({
    days: planDays,
    grocery_list: consolidateGroceryList(planDays as never),
    seasonality_notes: [],
  });

  it('runs plan, workout and supplement through the auditor on a safe turn', () => {
    const response = handleUserTurn({
      user_message: 'Quiero el menú de esta semana y mi rutina',
      check_in: { pain_score: 2, energy_level: 5, bloating: false, bleeding_level: 'NONE', cycle_day: 10 },
      profile: PROFILE,
      requests: ['plan', 'workout', 'supplement'],
      plan,
    });
    expect(response.triage.status).toBe('SAFE');
    expect(response.emergency).toBeNull();
    expect(response.plan).not.toBeNull();
    expect(response.workout).not.toBeNull();
    expect(response.supplement_sheet).not.toBeNull();
    expect(response.audit_report.status).toBe('APPROVED');
  });

  it('a rejected artifact surfaces REJECTED_WITH_RETRY instead of a user-facing artifact', () => {
    const tampered = { ...plan, grocery_list: [] };
    const response = handleUserTurn({
      user_message: 'menú',
      check_in: { pain_score: 2, energy_level: 4, bloating: false, bleeding_level: 'NONE', cycle_day: 10 },
      profile: PROFILE,
      requests: ['plan'],
      plan: tampered,
    });
    expect(response.audit_report.status).toBe('REJECTED_WITH_RETRY');
    expect(response.plan).toBeNull();
  });
});
