import { checkInSchema, type CheckIn } from '@core/contracts/analizador';

type CheckInField = {
  id: keyof Pick<CheckIn, 'pain_score' | 'energy_level' | 'bloating' | 'bleeding_level'>;
  label: string;
  accessibilityLabel: string;
  inputType: 'slider' | 'switch' | 'select';
  minimum?: number;
  maximum?: number;
};

export interface CheckInViewModel {
  fields: CheckInField[];
  errors: string[];
  submitDisabled: boolean;
  estimatedSeconds: number;
}

const fields: CheckInField[] = [
  { id: 'pain_score', label: 'Dolor EVA', accessibilityLabel: 'Dolor, escala visual analógica de 0 a 10', inputType: 'slider', minimum: 0, maximum: 10 },
  { id: 'energy_level', label: 'Energía', accessibilityLabel: 'Energía vital de 1 a 5', inputType: 'slider', minimum: 1, maximum: 5 },
  { id: 'bloating', label: 'Distensión', accessibilityLabel: 'Distensión abdominal o digestiva', inputType: 'switch' },
  { id: 'bleeding_level', label: 'Sangrado', accessibilityLabel: 'Nivel de sangrado', inputType: 'select' },
];

export function createCheckInViewModel(input: unknown): CheckInViewModel {
  const result = checkInSchema.safeParse(input);
  const errors = result.success ? [] : [...new Set(result.error.issues.map((issue) => String(issue.path[0])))] as string[];
  return { fields, errors, submitDisabled: errors.length > 0, estimatedSeconds: 20 };
}
