import {
  workoutPrescriptionSchema,
  type Exercise,
  type WorkoutPrescription,
} from '@core/contracts/entrenador';

type TrafficLight = 'RED' | 'YELLOW' | 'GREEN';
type CyclePhase = 'MENSTRUAL' | 'FOLLICULAR' | 'OVULATORY' | 'LUTEAL';

export interface WorkoutInput {
  traffic_light_status: TrafficLight;
  pain_score: number;
  energy_level: number;
  cycle_phase: CyclePhase;
  available_equipment: string[];
}

const RESTORATIVE_EXERCISES: Exercise[] = [
  {
    name: 'Conexión de suelo pélvico (respiración 360º)',
    biomechanical_target: 'pelvic floor activation',
    reps_or_duration: '5 min de respiración guiada',
    video_ref: 'exercises/suelo-pelvico-respiracion.mp4',
    safety_notes: 'Sin empuje abdominal; exhala al activar. Stop inmediato ante dolor.',
  },
  {
    name: 'Descompresión lumbopélvica (gato-vaca lento)',
    biomechanical_target: 'lumbar decompression',
    reps_or_duration: '8 respiraciones x 3 rondas',
    video_ref: 'exercises/gato-vaca.mp4',
    safety_notes: 'Rango suave, sin forzar. Detener si el dolor sube de 3/10.',
  },
  {
    name: 'Estiramiento miofascial de psoas en decúbito',
    biomechanical_target: 'myofascial psoas release',
    reps_or_duration: '90 s por lado',
    video_ref: 'exercises/psoas-decubito.mp4',
    safety_notes: 'Presión leve y sostenida; nunca picante ni irradiada a la pierna.',
  },
  {
    name: 'Relajación diafragmática supina',
    biomechanical_target: 'diaphragmatic downregulation',
    reps_or_duration: '6 min',
    video_ref: 'exercises/diafragmatica-supina.mp4',
    safety_notes: 'Exhalación larga; si aparece mareo, vuelve a respiración normal.',
  },
];

const BODYWEIGHT_STRENGTH: Exercise[] = [
  {
    name: 'Sentadilla goblet sin peso (control de tempo)',
    biomechanical_target: 'lower body strength',
    sets: 3,
    reps_or_duration: '10 reps tempo 3-1-1',
    video_ref: 'exercises/sentadilla-bodyweight.mp4',
    safety_notes: 'Tempo lento; si el dolor supera 3/10, detener la serie.',
  },
  {
    name: 'Puente de glúteo con pausa',
    biomechanical_target: 'glute strength, pelvic stability',
    sets: 3,
    reps_or_duration: '12 reps con pausa 2 s',
    video_ref: 'exercises/puente-gluteo.mp4',
    safety_notes: 'Sin hiperextender lumbar. Stop ante dolor pélvico agudo.',
  },
  {
    name: 'Pallof press con banda (anti-rotación)',
    biomechanical_target: 'core anti-rotation, no intra-abdominal pressure',
    sets: 3,
    reps_or_duration: '10 por lado',
    video_ref: 'exercises/pallof-press.mp4',
    safety_notes: 'Core activo sin Valsalva; respiración continua.',
  },
];

const EQUIPPED_STRENGTH: Exercise[] = [
  ...BODYWEIGHT_STRENGTH,
  {
    name: 'Peso muerto rumano con mancuernas',
    biomechanical_target: 'posterior chain strength',
    sets: 3,
    reps_or_duration: '8 reps',
    video_ref: 'exercises/rdl-mancuernas.mp4',
    safety_notes: 'Carga progresiva moderada; espalda neutra. Stop ante dolor lumbar.',
  },
  {
    name: 'Remo con mancuernas apoyada',
    biomechanical_target: 'upper back strength',
    sets: 3,
    reps_or_duration: '10 por lado',
    video_ref: 'exercises/remo-apoyada.mp4',
    safety_notes: 'Sin Valsalva; exhala en el esfuerzo.',
  },
];

const CONTRAINDICATED = [
  'hiperpresión abdominal',
  'crunches/sit-ups',
  'plancha frontal en fatiga',
  'levanta pesas con Valsalva',
  'entrenamiento extenuante',
];

export function prescribeWorkout(input: WorkoutInput): WorkoutPrescription {
  const prescription: WorkoutPrescription =
    input.traffic_light_status === 'RED'
      ? {
          modality: 'RESTORATIVE',
          exercises: RESTORATIVE_EXERCISES,
          contraindicated_movements: CONTRAINDICATED,
        }
      : {
          modality: 'STRENGTH',
          exercises: input.available_equipment.length > 0 ? EQUIPPED_STRENGTH : BODYWEIGHT_STRENGTH,
          contraindicated_movements: CONTRAINDICATED,
        };

  return workoutPrescriptionSchema.parse(prescription);
}
