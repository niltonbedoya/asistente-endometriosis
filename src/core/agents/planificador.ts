import {
  groceryItemSchema,
  type DayPlan,
  type GroceryItem,
  type Ingredient,
} from '@core/contracts/planificador';

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Atomic grocery-list consolidation, adapted from Cardionutri's
 * consolidateShoppingList (weeklyPlanner.schema.ts:199-284) to the
 * endometriosis domain: merges identical ingredients across all days,
 * sums quantities per unit, and recomputes from scratch so every menu
 * mutation produces a fully synchronized list (grocery_parity invariant).
 */
export function consolidateGroceryList(days: DayPlan[]): GroceryItem[] {
  const merged = new Map<string, GroceryItem>();

  for (const day of days) {
    for (const meal of day.meals) {
      for (const ingredient of meal.ingredients) {
        const key = `${normalizeName(ingredient.name)}|${ingredient.unit}`;
        const existing = merged.get(key);
        if (existing) {
          existing.quantity = round(existing.quantity + ingredient.quantity);
        } else {
          merged.set(key, groceryItemSchema.parse(toGroceryItem(ingredient)));
        }
      }
    }
  }

  return [...merged.values()];
}

function toGroceryItem(ingredient: Ingredient): GroceryItem {
  return {
    category: ingredient.category,
    item: ingredient.name,
    quantity: ingredient.quantity,
    unit: ingredient.unit,
  };
}

function round(quantity: number): number {
  // Two decimals avoid float drift (0.1 + 0.2 problems) in summed quantities.
  return Math.round(quantity * 100) / 100;
}

/**
 * Parity verifier used by the auditor: every ingredient in the menu must
 * appear in the grocery list (normalized name + unit). Returns the list of
 * missing item names; empty means parity holds.
 */
export function verifyGroceryParity(
  days: DayPlan[],
  groceryList: GroceryItem[],
): string[] {
  const listed = new Set(groceryList.map((i) => `${normalizeName(i.item)}|${i.unit}`));
  const missing = new Set<string>();

  for (const day of days) {
    for (const meal of day.meals) {
      for (const ingredient of meal.ingredients) {
        const key = `${normalizeName(ingredient.name)}|${ingredient.unit}`;
        if (!listed.has(key)) {
          missing.add(normalizeName(ingredient.name));
        }
      }
    }
  }

  return [...missing];
}
