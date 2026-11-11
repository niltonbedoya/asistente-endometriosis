# AGENTS.md — Asistente Endometriosis

Guía operativa para agentes de IA (OpenCode / Gentle-AI) trabajando en este repositorio.

## 1. Proyecto en una línea

Asistente **predictivo y adaptativo** para calidad de vida en endometriosis: predicción de brotes cíclicos, nutrición antiinflamatoria con lista de compra atómica (HITL), entrenamiento bimodal (restaurativo/fuerza) y fitoquímica consultiva. **Local-First**: los datos clínicos nunca salen del dispositivo.

## 2. Metodologías obligatorias

- **ODD**: toda feature nueva se registra en `odd/tasks/<feature>.md` antes del primer write. Specs `S#` citan el pedido del usuario verbatim; el `## Log` crece hacia abajo. Nada se marca como hecho sin evidencia observada (nunca inventar commits ni resultados de tests).
- **SDD**: los contratos Zod en `src/core/contracts/` son la fuente de verdad. Un cambio de contrato implica: actualizar schema → actualizar tests de contrato → actualizar `docs/contracts/contracts.md` → registrar en `openspec/`.
- **TDD estricto (RED → GREEN → REFACTOR)**: ninguna función se implementa sin su test previo que falle. Correr `npm test` y observar el fallo antes de escribir código de producción. Nunca escribir `it.skip` para saltarse el RED.
- **RDD**: los cambios de código se cierran con su línea de riesgo (`Risk: item N (reason)` o `Risk: none`) y quedan sujetos al review del ecosistema Gentle-AI.

## 3. Invariantes de seguridad (NO negociables)

1. **Bandera roja ⇒ interrupción inmediata.** Si `triaje` devuelve `EMERGENCY_REDIRECT`, ningún agente del pipeline genera recomendaciones ordinarias. Test: `tests/invariants/triaje_safety.test.ts`.
2. **Paridad atómica menú/compra.** Todo ingrediente de `WeeklyNutritionPlan` aparece exactamente en `grocery_list`. Cualquier mutación del menú recalcula la lista. Test: `tests/invariants/grocery_parity.test.ts`.
3. **Semáforo 🔴 ⇒ cero hiperpresión abdominal ni fuerza pesada.** `entrenador_personal` solo emite modo `RESTORATIVE`. Test: `tests/invariants/workout_safety.test.ts`.
4. **Descargos obligatorios** ante embarazo, lactancia o anticoagulantes en toda salida de `fitoterapista`.
5. **Nunca prescribir dosis farmacológicas cerradas.** Fitoquímica es consultiva (dianas, biodisponibilidad, precauciones).
6. **Local-First:** ningún test ni código de producción envía datos clínicos a la red. Los mocks de LLM/MCP son deterministas y offline.

## 4. Agentes del dominio

Ver tabla y contratos en `README.md` y `docs/contracts/contracts.md`. Cada agente: input tipado (Zod) → salida tipada (Zod) → validación del `auditor` antes de llegar a la usuaria.

## 5. Convenciones técnicas

- TypeScript strict; alias `@core/*` y `@tests/*` (ver `tsconfig.json`).
- Tests en `tests/` (nunca colocalizados en `src/`); mocks en `tests/mocks/`.
- Commits: Conventional Commits, unidades revisables (~400 líneas). Sin Co-Authored-By ni atribución de IA.
- `.engram/` es versionable (excepción del `.gitignore`); sincronizar con `engram sync` tras cada hito.
- Estado del entorno: `gentle-ai doctor`; control central: `./agent.cmd`.

## 6. Aviso deontológico permanente

Este software no diagnostica, no prescribe y no sustituye atención médica. Cualquier agente que genere contenido con apariencia de diagnóstico o prescripción debe ser rechazado por el `auditor`.
