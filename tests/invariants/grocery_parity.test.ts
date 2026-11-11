import { describe, expect, it } from 'vitest';
import {
  consolidateGroceryList,
  verifyGroceryParity,
} from '@core/agents/planificador';
import type { DayPlan } from '@core/contracts/planificador';

function ing(name: string, quantity: number, unit: string, category: string) {
  return { name, quantity, unit, category };
}

function day(dayIndex: number, ingredients: ReturnType<typeof ing>[]): DayPlan {
  return {
    day_index: dayIndex,
    meals: [{ name: `Meal ${dayIndex}`, ingredients, microbiota_tags: [] }],
  };
}

describe('invariant: atomic grocery parity', () => {
  it('lists every ingredient of every meal exactly once, merged across days', () => {
    const days = [
      day(0, [ing('Lentejas', 200, 'g', 'Legumbres'), ing('Cebolla', 1, 'ud', 'Verduras')]),
      day(1, [ing('Lentejas', 200, 'g', 'Legumbres')]),
      day(2, [ing('Arroz integral', 150, 'g', 'Granos')]),
    ];
    const list = consolidateGroceryList(days);
    const lentejas = list.find((i) => i.item.toLowerCase() === 'lentejas');
    expect(lentejas).toBeDefined();
    expect(lentejas?.quantity).toBe(400);
    expect(lentejas?.unit).toBe('g');
    expect(list.map((i) => i.item.toLowerCase())).toEqual(
      expect.arrayContaining(['cebolla', 'arroz integral']),
    );
    expect(list).toHaveLength(3);
  });

  it('does not merge ingredients with different units', () => {
    const days = [
      day(0, [ing('Cúrcuma', 1, 'cdta', 'Especias')]),
      day(1, [ing('Cúrcuma', 500, 'mg', 'Especias')]),
    ];
    const list = consolidateGroceryList(days);
    expect(list.filter((i) => i.item.toLowerCase() === 'cúrcuma')).toHaveLength(2);
  });

  it('recomputes atomically: the list only reflects the current menu', () => {
    const before = consolidateGroceryList([
      day(0, [ing('Lentejas', 200, 'g', 'Legumbres'), ing('Espinaca', 100, 'g', 'Verduras')]),
    ]);
    const after = consolidateGroceryList([
      day(0, [ing('Quinoa', 150, 'g', 'Granos')]),
    ]);
    expect(before.map((i) => i.item.toLowerCase())).toContain('espinaca');
    expect(after.map((i) => i.item.toLowerCase())).not.toContain('espinaca');
    expect(after.map((i) => i.item.toLowerCase())).toContain('quinoa');
  });

  it('verifyGroceryParity flags ingredients missing from a provided list', () => {
    const days = [day(0, [ing('Lentejas', 200, 'g', 'Legumbres'), ing('Cebolla', 1, 'ud', 'Verduras')])];
    const incomplete = [{ category: 'Legumbres', item: 'Lentejas', quantity: 200, unit: 'g' }];
    const missing = verifyGroceryParity(days, incomplete);
    expect(missing).toContain('cebolla');
    expect(verifyGroceryParity(days, consolidateGroceryList(days))).toHaveLength(0);
  });
});
