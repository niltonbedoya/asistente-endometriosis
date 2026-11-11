import { describe, expect, it } from 'vitest';
import { auditPlanificador, auditEntrenador, auditFitoterapista } from '@core/agents/auditor';
import { consolidateGroceryList } from '@core/agents/planificador';
import { weeklyNutritionPlanSchema } from '@core/contracts/planificador';
import { prescribeWorkout } from '@core/agents/entrenador';
import { getSupplementFactSheet } from '@core/agents/fitoterapista';

function validPlan() {
  const days = Array.from({ length: 7 }, (_, day_index) => ({
    day_index,
    meals: [
      {
        name: `Comida ${day_index}`,
        ingredients: [
          { name: 'Lentejas', quantity: 200, unit: 'g', category: 'Legumbres' },
          { name: 'Brócoli', quantity: 150, unit: 'g', category: 'Verduras' },
        ],
        microbiota_tags: [],
      },
    ],
  }));
  return weeklyNutritionPlanSchema.parse({
    days,
    grocery_list: consolidateGroceryList(days as never),
    seasonality_notes: [],
  });
}

describe('auditor: planificador gate', () => {
  it('approves a plan with atomic parity', () => {
    const report = auditPlanificador(validPlan());
    expect(report.status).toBe('APPROVED');
    expect(report.atomic_parity_verified).toBe(true);
  });

  it('rejects a plan whose grocery list lost an ingredient (parity violation)', () => {
    const plan = validPlan();
    plan.grocery_list = plan.grocery_list.filter(
      (i) => i.item.toLowerCase() !== 'brócoli',
    );
    const report = auditPlanificador(plan);
    expect(report.status).toBe('REJECTED_WITH_RETRY');
    expect(report.safety_violations.join(' ').toLowerCase()).toContain('paridad');
  });
});

describe('auditor: entrenador gate', () => {
  it('approves strength on a green day', () => {
    const prescription = prescribeWorkout({
      traffic_light_status: 'GREEN',
      pain_score: 1,
      energy_level: 5,
      cycle_phase: 'FOLLICULAR',
      available_equipment: ['dumbbells'],
    });
    expect(auditEntrenador(prescription, 'GREEN').status).toBe('APPROVED');
  });

  it('rejects heavy strength modality on a RED day', () => {
    const report = auditEntrenador(
      {
        modality: 'STRENGTH',
        exercises: [
          {
            name: 'Peso muerto con barra',
            biomechanical_target: 'posterior chain',
            reps_or_duration: '5x5',
            video_ref: 'x.mp4',
            safety_notes: 'n/a',
          },
        ],
        contraindicated_movements: [],
      },
      'RED',
    );
    expect(report.status).toBe('REJECTED_WITH_RETRY');
    expect(report.safety_violations.join(' ')).toMatch(/semáforo rojo|RED/i);
  });

  it('rejects hyperpressure movements on a RED day', () => {
    const report = auditEntrenador(
      {
        modality: 'RESTORATIVE',
        exercises: [
          {
            name: 'Crunch abdominal con peso',
            biomechanical_target: 'abs',
            reps_or_duration: '3x15',
            video_ref: 'x.mp4',
            safety_notes: 'n/a',
          },
        ],
        contraindicated_movements: [],
      },
      'RED',
    );
    expect(report.status).toBe('REJECTED_WITH_RETRY');
    expect(report.safety_violations.join(' ').toLowerCase()).toContain('hiperpresión');
  });
});

describe('auditor: fitoterapista gate', () => {
  const flags = {
    is_pregnant: true,
    is_breastfeeding: false,
    takes_anticoagulants: false,
    intolerances: [],
  };

  it('approves a consultative sheet with its disclaimer and the pregnancy one', () => {
    const sheet = getSupplementFactSheet('magnesio');
    const report = auditFitoterapista(sheet, flags, [
      sheet.mandatory_disclaimer,
      'Posible embarazo: consulta a tu equipo médico antes de cualquier suplemento o cambio de dieta.',
    ]);
    expect(report.status).toBe('APPROVED');
  });

  it('rejects a response missing the pregnancy disclaimer when flagged', () => {
    const sheet = getSupplementFactSheet('magnesio');
    const report = auditFitoterapista(sheet, flags, []);
    expect(report.status).toBe('REJECTED_WITH_RETRY');
    expect(report.safety_violations.join(' ').toLowerCase()).toContain('embarazo');
  });

  it('rejects prescriptive closed doses in bioavailability notes', () => {
    const sheet = getSupplementFactSheet('curcuma');
    const tampered = { ...sheet, suggested_bioavailability_notes: 'Tomar 500 mg diaria con comidas' };
    const report = auditFitoterapista(tampered, flags, [sheet.mandatory_disclaimer, 'Embarazo: consulta']);
    expect(report.status).toBe('REJECTED_WITH_RETRY');
    expect(report.safety_violations.join(' ').toLowerCase()).toContain('dosis');
  });
});
