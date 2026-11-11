import {
  supplementFactSheetSchema,
  type SupplementFactSheet,
} from '@core/contracts/fitoterapista';

const GENERAL_DISCLAIMER =
  'Información consultativa y educativa. No es una prescripción: consulta con tu equipo médico antes de iniciar cualquier suplemento.';

const CATALOG: Record<string, Omit<SupplementFactSheet, 'mandatory_disclaimer'>> = {
  curcuma: {
    compound: 'Cúrcuma (curcumina)',
    biological_target: 'Vía NF-kB y mediadores inflamatorios (IL-6, TNF-α)',
    evidence_level: 'MODERATE',
    suggested_bioavailability_notes:
      'La curcumina sola se absorbe mal: suele acompañarse de piperina o presentarse en formas miceladas/liposomales.',
    warnings: [
      'Interacción con anticoagulantes/antiagregantes: efecto aditivo.',
      'Puede irritar la vía biliar en litiasis conocida.',
    ],
  },
  magnesio: {
    compound: 'Bisglicinato de Magnesio',
    biological_target: 'Modulación de excitabilidad neuromuscular, sueño y dolor muscular',
    evidence_level: 'MODERATE',
    suggested_bioavailability_notes:
      'La forma bisglicinato es quelada y suele tolerarse mejor a nivel digestivo que el óxido.',
    warnings: ['Precaución con insuficiencia renal conocida.', 'Puede potenciar el efecto de sedantes.'],
  },
  'omega-3': {
    compound: 'Omega-3 (EPA/DHA)',
    biological_target: 'Resolución de inflamación (pro-resolving lipid mediators), perfil lipídico',
    evidence_level: 'HIGH',
    suggested_bioavailability_notes:
      'Se absorbe mejor con comidas que contienen grasa; formas en triglicérido suelen tener mejor biodisponibilidad.',
    warnings: [
      'Interacción con anticoagulantes/antiagregantes: efecto antiagregante aditivo.',
      'Verificar pureza (metales pesados) del proveedor.',
    ],
  },
  nac: {
    compound: 'N-Acetilcisteína (NAC)',
    biological_target: 'Precursor de glutatión; defensa antioxidante y fluidificación de mocos',
    evidence_level: 'PRELIMINARY',
    suggested_bioavailability_notes:
      'Estabilidad mayor en formas efervescentes o encapsuladas con protección gástrica.',
    warnings: ['Precaución con nitroglicerina (cefalea aditiva).', 'Olor azufrado habitual, no es deterioro.'],
  },
};

const ALIASES: Record<string, string> = {
  'cúrcuma': 'curcuma',
  'curcumina': 'curcuma',
  'magnesio': 'magnesio',
  'bisglicinato': 'magnesio',
  'omega 3': 'omega-3',
  'n-acetilcisteína': 'nac',
  'acetilcisteína': 'nac',
};

function canonicalKey(name: string): string {
  const normalized = name.trim().toLowerCase();
  if (normalized in ALIASES) return ALIASES[normalized] ?? normalized;
  if (normalized.includes('curcum')) return 'curcuma';
  if (normalized.includes('magnesio') || normalized.includes('bisglicinato')) return 'magnesio';
  if (normalized.includes('omega')) return 'omega-3';
  if (normalized.includes('cistein') || normalized === 'nac') return 'nac';
  return normalized;
}

export function getSupplementFactSheet(name: string): SupplementFactSheet {
  const entry = CATALOG[canonicalKey(name)];
  if (!entry) {
    throw new Error(`Unknown compound in the consultative catalog: ${name}`);
  }
  return supplementFactSheetSchema.parse({ ...entry, mandatory_disclaimer: GENERAL_DISCLAIMER });
}

export function listCatalog(): SupplementFactSheet[] {
  return Object.keys(CATALOG).map((key) => getSupplementFactSheet(key));
}

export interface ClinicalFlags {
  is_pregnant: boolean;
  is_breastfeeding: boolean;
  takes_anticoagulants: boolean;
  intolerances: readonly unknown[];
  active_medications?: Array<{ name: string; is_anticoagulant?: boolean }>;
}

/**
 * Mandatory disclaimers per the red-flag/safety protocol: automatic
 * warnings before pregnancy, breastfeeding or anticoagulant interaction.
 * The general consultative disclaimer is always present.
 */
export function mandatoryDisclaimersFor(flags: ClinicalFlags): string[] {
  const disclaimers = [GENERAL_DISCLAIMER];

  if (flags.is_pregnant) {
    disclaimers.push(
      'Posible embarazo: consulta a tu equipo médico antes de cualquier suplemento o cambio de dieta.',
    );
  }
  if (flags.is_breastfeeding) {
    disclaimers.push(
      'Lactancia: consulta a tu equipo médico antes de cualquier suplemento o cambio de dieta.',
    );
  }
  const declaredAnticoagulant =
    flags.takes_anticoagulants ||
    (flags.active_medications?.some((m) => m.is_anticoagulant) ?? false);
  if (declaredAnticoagulant) {
    disclaimers.push(
      'Medicación anticoagulante/antiagregante: ciertos compuestos (cúrcuma, omega-3, NAC) tienen efecto aditivo. Consulta obligatoria con tu equipo médico.',
    );
  }

  return disclaimers;
}
