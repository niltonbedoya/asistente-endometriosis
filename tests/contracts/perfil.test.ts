import { describe, expect, it } from 'vitest';
import { userProfileSchema } from '@core/contracts/perfil';

describe('perfil contract: UserProfile', () => {
  it('accepts a profile with intolerances and clinical flags', () => {
    const profile = {
      intolerances: ['GLUTEN', 'LACTOSE_CASEIN'],
      is_pregnant: false,
      is_breastfeeding: false,
      takes_anticoagulants: true,
      active_medications: [{ name: 'Apixabán', is_anticoagulant: true }],
    };
    expect(userProfileSchema.parse(profile)).toEqual(profile);
  });

  it('rejects an unknown intolerance tag', () => {
    const profile = { intolerances: ['MAGICAL_FOOD'], is_pregnant: false };
    expect(() => userProfileSchema.parse(profile)).toThrow();
  });

  it('rejects a medication entry without a name', () => {
    const profile = { intolerances: [], active_medications: [{ name: '', is_anticoagulant: false }] };
    expect(() => userProfileSchema.parse(profile)).toThrow();
  });

  it('accepts the full endometriosis intolerance vocabulary', () => {
    const profile = {
      intolerances: ['GLUTEN', 'LACTOSE_CASEIN', 'HISTAMINE', 'LEGUMES_LECTINS', 'FODMAP'],
      is_pregnant: true,
      is_breastfeeding: false,
      takes_anticoagulants: false,
      active_medications: [],
    };
    expect(userProfileSchema.parse(profile)).toEqual(profile);
  });

  it('defaults missing clinical flags to false', () => {
    const profile = { intolerances: [] };
    const parsed = userProfileSchema.parse(profile);
    expect(parsed.is_pregnant).toBe(false);
    expect(parsed.is_breastfeeding).toBe(false);
    expect(parsed.takes_anticoagulants).toBe(false);
  });
});
