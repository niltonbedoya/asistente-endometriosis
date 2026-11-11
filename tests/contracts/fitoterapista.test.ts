import { describe, expect, it } from 'vitest';
import {
  getSupplementFactSheet,
  mandatoryDisclaimersFor,
} from '@core/agents/fitoterapista';
import { supplementFactSheetSchema } from '@core/contracts/fitoterapista';

describe('fitoterapista contract: SupplementFactSheet', () => {
  it('accepts a consultative fact sheet with disclaimer', () => {
    const sheet = {
      compound: 'Cúrcuma (curcumina)',
      biological_target: 'vía NF-kB / mediadores inflamatorios',
      evidence_level: 'MODERATE',
      suggested_bioavailability_notes: 'Con piperina o en forma micelada',
      warnings: ['Anticoagulantes: efecto antiagregante aditivo'],
      mandatory_disclaimer: 'Informativo, no prescriptivo',
    };
    expect(supplementFactSheetSchema.parse(sheet)).toEqual(sheet);
  });

  it('rejects an unknown compound', () => {
    expect(() => getSupplementFactSheet('Estanozolol')).toThrow();
  });

  it('rejects a sheet missing the mandatory disclaimer', () => {
    expect(() =>
      supplementFactSheetSchema.parse({
        compound: 'Omega-3',
        biological_target: 'resolución de inflamación',
        evidence_level: 'HIGH',
        suggested_bioavailability_notes: 'Con comidas grasas',
        warnings: [],
      }),
    ).toThrow();
  });
});

describe('fitoterapista: consultative catalog', () => {
  it('exposes the four spec compounds', () => {
    for (const compound of ['cúrcuma', 'bisglicinato de magnesio', 'omega-3', 'n-acetilcisteína']) {
      const sheet = getSupplementFactSheet(compound);
      expect(sheet.biological_target.length).toBeGreaterThan(0);
      expect(['HIGH', 'MODERATE', 'PRELIMINARY']).toContain(sheet.evidence_level);
    }
  });

  it('never closes a pharmacological dose (consultative only)', () => {
    for (const name of ['curcuma', 'magnesio', 'omega-3', 'nac']) {
      const sheet = getSupplementFactSheet(name);
      const text = `${sheet.suggested_bioavailability_notes} ${sheet.warnings.join(' ')}`.toLowerCase();
      expect(text).not.toMatch(/\b\d+\s?(mg|g|ui)\s?(día|diaria|por)\b/);
    }
  });

  it('warns about anticoagulant interaction for curcuma and omega-3', () => {
    for (const name of ['curcuma', 'omega-3']) {
      const sheet = getSupplementFactSheet(name);
      const text = sheet.warnings.join(' ').toLowerCase();
      expect(text).toMatch(/anticoagulante|antiagregante/);
    }
  });
});

describe('fitoterapista: mandatory disclaimers', () => {
  it('requires pregnancy disclaimer when flagged', () => {
    const disclaimers = mandatoryDisclaimersFor({ is_pregnant: true, is_breastfeeding: false, takes_anticoagulants: false, intolerances: [] });
    expect(disclaimers.join(' ').toLowerCase()).toMatch(/embarazo/);
  });

  it('requires breastfeeding disclaimer when flagged', () => {
    const disclaimers = mandatoryDisclaimersFor({ is_pregnant: false, is_breastfeeding: true, takes_anticoagulants: false, intolerances: [] });
    expect(disclaimers.join(' ').toLowerCase()).toMatch(/lactancia/);
  });

  it('requires anticoagulant disclaimer when flagged (declared or via medication)', () => {
    const declared = mandatoryDisclaimersFor({ is_pregnant: false, is_breastfeeding: false, takes_anticoagulants: true, intolerances: [] });
    expect(declared.join(' ').toLowerCase()).toMatch(/anticoagulante/);
    const viaMed = mandatoryDisclaimersFor({
      is_pregnant: false,
      is_breastfeeding: false,
      takes_anticoagulants: false,
      intolerances: [],
      active_medications: [{ name: 'Warfarina', is_anticoagulant: true }],
    });
    expect(viaMed.join(' ').toLowerCase()).toMatch(/anticoagulante/);
  });

  it('always returns at least the general consultative disclaimer', () => {
    const disclaimers = mandatoryDisclaimersFor({ is_pregnant: false, is_breastfeeding: false, takes_anticoagulants: false, intolerances: [] });
    expect(disclaimers.length).toBeGreaterThan(0);
  });
});
