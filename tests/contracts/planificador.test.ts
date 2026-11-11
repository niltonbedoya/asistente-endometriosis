import { describe, expect, it } from 'vitest';
import {
  weeklyNutritionPlanSchema,
  type WeeklyNutritionPlan,
} from '@core/contracts/planificador';

function ingredient(name: string, quantity: number, unit: string, category: string) {
  return { name, quantity, unit, category };
}

function makePlan(grocery: Array<{ category: string; item: string; quantity: number; unit: string }>): WeeklyNutritionPlan {
  return weeklyNutritionPlanSchema.parse({
    days: Array.from({ length: 7 }, (_, day_index) => ({
      day_index,
      meals: [
        {
          name: `Meal ${day_index}`,
          ingredients: [ingredient('Lentejas', 200, 'g', 'Legumbres')],
          microbiota_tags: ['legumbres'],
        },
      ],
    })),
    grocery_list: grocery,
    seasonality_notes: [],
  });
}

describe('planificador contract: WeeklyNutritionPlan', () => {
  it('accepts a valid 7-day plan', () => {
    const plan = makePlan([{ category: 'Legumbres', item: 'Lentejas', quantity: 1400, unit: 'g' }]);
    expect(weeklyNutritionPlanSchema.parse(plan)).toEqual(plan);
  });

  it('rejects a plan with fewer than 7 days', () => {
    const plan = {
      days: [0, 1, 2].map((day_index) => ({
        day_index,
        meals: [{ name: 'x', ingredients: [], microbiota_tags: [] }],
      })),
      grocery_list: [],
      seasonality_notes: [],
    };
    expect(() => weeklyNutritionPlanSchema.parse(plan)).toThrow();
  });

  it('rejects duplicate day_index values', () => {
    const plan = {
      days: Array.from({ length: 7 }, (_, i) => ({
        day_index: i === 6 ? 5 : i,
        meals: [{ name: 'x', ingredients: [], microbiota_tags: [] }],
      })),
      grocery_list: [],
      seasonality_notes: [],
    };
    expect(() => weeklyNutritionPlanSchema.parse(plan)).toThrow();
  });

  it('rejects negative ingredient quantities', () => {
    const plan = {
      days: [
        {
          day_index: 0,
          meals: [
            {
              name: 'M',
              ingredients: [ingredient('Arroz', -1, 'g', 'Granos')],
              microbiota_tags: [],
            },
          ],
        },
      ],
      grocery_list: [],
      seasonality_notes: [],
    };
    expect(() => weeklyNutritionPlanSchema.parse(plan)).toThrow();
  });
});
