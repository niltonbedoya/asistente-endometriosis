# Core Multiagente del Asistente Endometriosis (Fases 1–6)

**Objetivo:** implementar todos los agentes del dominio con TDD estricto, integrados por orquestador y auditor, siguiendo ADR-002 (port de Cardionutri solo donde transfiere).
**Rama:** `main` (continúa en main con work-unit commits; PR slices por chained-pr al superar 400 líneas acumuladas).
**Estrategia de entrega:** `auto-chain`.
**Test runner:** `npm test` (Vitest + Zod).
**Puerta por fase:** el usuario exige: cada fase solo avanza si sus tests pasan al 100%; si fallan, corregir, re-testear y recién entonces avanzar.

## Specs (verbatim del prompt maestro)

- **S1 (paridad atómica):** "Todo ingrediente se consolida automáticamente." / "Cualquier mutación del menú recalcula y sincroniza la lista de la compra de forma atómica."
- **S2 (check-in):** "Captura dolor Escala Visual Analógica EVA (0–10), energía vital (1–5), distensión abdominal/digestiva y presencia de sangrado."
- **S3 (semáforo):** 🔴 "Crisis activa, dolor incapacitante, sangrado severo o agotamiento." / 🟡 "Molestia moderada, transición proinflamatoria, energía media." / 🟢 "Ventana asintomática, ausencia de dolor limitante, energía óptima."
- **S4 (motor predictivo):** "Proyección de ventanas de riesgo y vulnerabilidad inflamatoria en un horizonte de 7 a 14 días."
- **S5 (fases):** `current_phase: 'MENSTRUAL' | 'FOLLICULAR' | 'OVULATORY' | 'LUTEAL'` con `cycle_day`, `confidence_score`, `projected_risk_window`.
- **S6 (entrenamiento bimodal):** 🔴 "Trabajo de suelo pélvico, descompresión lumbopélvica, estiramientos miofasciales, relajación diafragmática. Prohibición estricta de hiperpresión abdominal o entrenamientos extenuantes." / 🟢🟡 "Rutinas de fuerza progresiva con pesas y control metabólico."
- **S7 (fitoquímica):** "Enfoque estrictamente informativo: dianas biológicas, biodisponibilidad y precauciones sin prescribir dosis farmacológicas cerradas." Catálogo: "Cúrcuma, Bisglicinato de Magnesio, Omega-3, N-Acetilcisteína".
- **S8 (descargos):** "Advertencias automáticas ante embarazo, lactancia o interacción con anticoagulantes."
- **S9 (contratos):** `WeeklyNutritionPlan`, `WorkoutPrescription`, `SupplementFactSheet`, `BiologicalState`, `AuditReport` según interfaces del prompt maestro.
- **S10 (auditor — criterios de rechazo):** "Fallo de esquema Zod, discrepancia ingrediente-lista de compra en `planificador`, omisión de descargos obligatorios, presencia de sugerencias prescriptivas farmacológicas o ejercicios de fuerza pesada en semáforo rojo 🔴."
- **S11 (orquestador):** "Pasa la entrada a `triaje`. Si `triaje` levanta bandera roja, interrumpe el pipeline y emite respuesta de emergencia."

## Tasks

- **F1** (S1,S9-paridad) — Contrato `WeeklyNutritionPlan` + `consolidateGroceryList` (port ADR-002 de `consolidateShoppingList`, cardionutri `weeklyPlanner.schema.ts:199`) + invariante `grocery_parity`. Gate: `npm test` verde. ⏳
- **F2** (S2,S8) — Perfil de usuaria + intolerancias (adaptación cardionutri `allergies.schema.ts`, listas endometriosis: gluten, caseína/lácteos, histamina, legumbres/lectinas, FODMAPs) + estado embarazo/lactancia/anticoagulantes. ⏳
- **F3** (S2-S5,S9-BiologicalState) — `analizador`: fase de ciclo, semáforo 🔴🟡🟢, ventana de riesgo 7–14 días. Determinista. ⏳
- **F4** (S6,S9-WorkoutPrescription) — `entrenador_personal` + invariante `workout_safety` (🔴 ⇒ solo RESTORATIVE, cero hiperpresión). ⏳
- **F5** (S7,S8,S9-SupplementFactSheet) — `fitoterapista` con catálogo consultivo y descargos automáticos. ⏳
- **F6** (S10,S11,S9-AuditReport) — `auditor` gatekeeper + `orquestador` (despacho con cortocircuito por bandera roja) + test de pipeline completo. ⏳
- **F7** — Juicio final: skill `judgment-day` (dual review), reparar lo solicitado, re-testear. ⏳

## Log

- **L1** (2026-11-11, verbatim): "ahora quiero que comiences a hacer todas las fases sin parar y sin preguntarme, lo unico que debes de comprobar antes de pasar a la siguiente fase es que los tests de la fase uno pasen todos, sino pasan arreglas lo necesario, vuelves a testear y pasas a la siguiente fase, hasta terminar, luego al terminar lanzas el skill del dia del juicio, reparas lo que pida y luego probamos"
