# Contratos de Agentes (Zod)

Fuente de verdad runtime: `src/core/contracts/`. Este documento los describe para humanos y revisores.

## `triaje` — `SafetyEvaluation`

```ts
interface SafetyEvaluation {
  status: 'SAFE' | 'EMERGENCY_REDIRECT';
  alert_level: 'INFO' | 'WARNING' | 'CRITICAL';
  emergency_reasons: string[];
  required_disclaimers: string[];
}
```

**Entrada:** mensajes de usuaria + logs de check-in (`pain_score`, `bleeding_level`, `symptoms`).
**Auditor:** detección determinista de banderas rojas. `EMERGENCY_REDIRECT` interrumpe el pipeline completo.

## `analizador` — `BiologicalState`

```ts
interface BiologicalState {
  current_phase: 'MENSTRUAL' | 'FOLLICULAR' | 'OVULATORY' | 'LUTEAL';
  traffic_light_status: 'RED' | 'YELLOW' | 'GREEN';
  cycle_day: number;
  confidence_score: number;
  projected_risk_window: { start_day: number; end_day: number; risk_intensity: 'LOW' | 'MEDIUM' | 'HIGH' };
}
```

**Entrada:** check-in diario (<30 s: EVA 0–10, energía 1–5, distensión, sangrado) + histórico + metadatos del ciclo.
**Auditor:** coherencia entre escala EVA y estado semafórico.

## `planificador` — `WeeklyNutritionPlan`

```ts
interface WeeklyNutritionPlan {
  days: Array<{ day_index: number; meals: Array<{ name; ingredients: string[]; microbiota_tags: string[] }>; batch_cooking_flag?: boolean }>;
  grocery_list: Array<{ category; item; quantity; unit }>;
  seasonality_notes: string[];
}
```

**Auditor — Paridad Atómica 1:1:** cada ingrediente de los menús está reflejado en la lista de compra. Toda mutación HITL del menú recalcula la lista de forma atómica.

## `entrenador_personal` — `WorkoutPrescription`

```ts
interface WorkoutPrescription {
  modality: 'RESTORATIVE' | 'STRENGTH';
  exercises: Array<{ name; biomechanical_target; sets?; reps_or_duration; video_ref; safety_notes }>;
  contraindicated_movements: string[];
}
```

**Auditor:** bloqueo estricto de hiperpresión abdominal y fuerza pesada con semáforo 🔴.

## `fitoterapista` — `SupplementFactSheet`

```ts
interface SupplementFactSheet {
  compound; biological_target;
  evidence_level: 'HIGH' | 'MODERATE' | 'PRELIMINARY';
  suggested_bioavailability_notes; warnings: string[]; mandatory_disclaimer;
}
```

**Auditor:** descargos mandatorios ante embarazo, lactancia o anticoagulantes. Nunca dosis farmacológicas cerradas.

## `auditor` — `AuditReport`

```ts
interface AuditReport {
  status: 'APPROVED' | 'REJECTED_WITH_RETRY';
  contract_violations: string[];
  safety_violations: string[];
  atomic_parity_verified: boolean;
  payload: unknown;
}
```

**Criterios de rechazo:** fallo de esquema Zod; discrepancia ingrediente↔lista de compra; descargos omitidos; sugerencias prescriptivas farmacológicas; fuerza pesada con semáforo rojo.

## Regla de cambio de contrato

Schema → test de contrato → este documento → registro en `openspec/`. En ese orden, siempre.
