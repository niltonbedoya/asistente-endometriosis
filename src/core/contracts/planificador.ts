import { z } from 'zod';

/**
 * Contract: planificador agent (WeeklyNutritionPlan).
 * Anti-inflammatory weekly menus with atomic grocery-list parity.
 * See docs/contracts/contracts.md and the grocery_parity invariant.
 */
export const ingredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  category: z.string().min(1),
});

export type Ingredient = z.infer<typeof ingredientSchema>;

export const mealSchema = z.object({
  name: z.string().min(1),
  ingredients: z.array(ingredientSchema),
  microbiota_tags: z.array(z.string()),
});

export type Meal = z.infer<typeof mealSchema>;

export const dayPlanSchema = z.object({
  day_index: z.number().int().min(0).max(6),
  meals: z.array(mealSchema),
  batch_cooking_flag: z.boolean().optional(),
});

export type DayPlan = z.infer<typeof dayPlanSchema>;

export const groceryItemSchema = z.object({
  category: z.string().min(1),
  item: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
});

export type GroceryItem = z.infer<typeof groceryItemSchema>;

export const weeklyNutritionPlanSchema = z
  .object({
    days: z.array(dayPlanSchema).length(7),
    grocery_list: z.array(groceryItemSchema),
    seasonality_notes: z.array(z.string()),
  })
  .superRefine((plan, ctx) => {
    const seen = new Set<number>();
    for (const day of plan.days) {
      if (seen.has(day.day_index)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['days'],
          message: `Duplicate day_index ${day.day_index}`,
        });
      }
      seen.add(day.day_index);
    }
  });

export type WeeklyNutritionPlan = z.infer<typeof weeklyNutritionPlanSchema>;
