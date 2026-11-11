import {
  biologicalStateSchema,
  type BiologicalState,
  type CheckIn,
  type RiskIntensity,
  type TrafficLight,
} from '@core/contracts/analizador';

const DEFAULT_CYCLE_LENGTH = 28;
const RISK_HORIZON_START = 7; // Spec: 7-14 day predictive horizon
const RISK_HORIZON_END = 14;

/**
 * Deterministic traffic light per the domain spec:
 * 🔴 crisis: incapacitating pain (EVA >= 7), severe bleeding or exhaustion (energy 1).
 * 🟡 moderate: pain 4-6, bloating or medium energy.
 * 🟢 asymptomatic: no limiting pain and optimal energy.
 */
export function trafficLightForCheckIn(checkIn: CheckIn): TrafficLight {
  if (checkIn.pain_score >= 7 || checkIn.bleeding_level === 'SEVERE' || checkIn.energy_level <= 1) {
    return 'RED';
  }
  if (checkIn.pain_score >= 4 || checkIn.bloating || checkIn.energy_level <= 3) {
    return 'YELLOW';
  }
  return 'GREEN';
}

const LIGHT_ORDER: Record<TrafficLight, number> = { GREEN: 0, YELLOW: 1, RED: 2 };

export function worstLight(lights: TrafficLight[]): TrafficLight {
  return lights.reduce((worst, light) =>
    LIGHT_ORDER[light] > LIGHT_ORDER[worst] ? light : worst,
  'GREEN' as TrafficLight);
}

/**
 * Phase boundaries as cycle day ranges. The average cycle length shifts the
 * ovulatory/luteal boundary: shorter cycles reach luteal earlier.
 */
export function cyclePhaseForDay(cycleDay: number, cycleLength = DEFAULT_CYCLE_LENGTH): 'MENSTRUAL' | 'FOLLICULAR' | 'OVULATORY' | 'LUTEAL' {
  if (cycleDay <= 5) return 'MENSTRUAL';
  const ovulationDay = cycleLength - 14; // ~14 days before next period
  if (cycleDay <= ovulationDay - 2) return 'FOLLICULAR';
  if (cycleDay <= ovulationDay + 2) return 'OVULATORY';
  return 'LUTEAL';
}

/**
 * Deterministic risk projection: the inflammatory vulnerability window is
 * the premenstrual/luteal transition, projected within the 7-14 day horizon.
 */
export function projectRiskWindow(
  cycleDay: number,
  cycleLength = DEFAULT_CYCLE_LENGTH,
): BiologicalState['projected_risk_window'] {
  const nextPeriodDay = cycleDay + (cycleLength - cycleDay) + 1; // day 1 of next cycle
  const lutealOnset = cycleLength - 14 + cycleLength - cycleDay + 1;

  let startDay = Math.min(
    Math.max(cycleDay + RISK_HORIZON_START, cycleLength - cycleDay >= 7 ? cycleLength - cycleDay + 1 : cycleDay + 7),
    cycleDay + RISK_HORIZON_END,
  );
  let endDay = Math.min(startDay + 4, nextPeriodDay + 4, cycleDay + RISK_HORIZON_END);
  if (endDay <= startDay) {
    endDay = Math.min(cycleDay + RISK_HORIZON_END, startDay + 4);
  }

  const intensity: RiskIntensity = cycleDay >= cycleLength - 14 ? 'HIGH' : 'MEDIUM';
  void lutealOnset;

  return {
    start_day: startDay,
    end_day: endDay,
    risk_intensity: intensity,
  };
}

/**
 * Main deterministic entry point of the analizador agent.
 * Confidence reflects how many check-ins support today's state.
 */
export function analyzeBiologicalState(input: {
  check_ins: CheckIn[];
  cycle_length_days?: number;
  cycle_day?: number;
}): BiologicalState {
  const cycleLength = input.cycle_length_days ?? DEFAULT_CYCLE_LENGTH;
  const last = input.check_ins[input.check_ins.length - 1];
  if (!last) {
    throw new Error('analyzeBiologicalState requires at least one check-in');
  }
  const cycleDay = last.cycle_day ?? input.cycle_day ?? 0;
  if (cycleDay < 1) {
    throw new Error('analyzeBiologicalState requires the current cycle day (check-in or metadata)');
  }

  const lights = input.check_ins.map(trafficLightForCheckIn);
  const todayLight = worstLight(lights.slice(-1));
  const state = {
    current_phase: cyclePhaseForDay(cycleDay, cycleLength),
    traffic_light_status: todayLight,
    cycle_day: cycleDay,
    confidence_score: Math.min(1, input.check_ins.length / 7),
    projected_risk_window: projectRiskWindow(cycleDay, cycleLength),
  };

  return biologicalStateSchema.parse(state);
}
