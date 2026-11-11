# ADR-002: Estrategia de Adaptación Cardionutri → Asistente Endometriosis

**Estado:** Propuesta (pendiente de autorización de implementación) · **Fecha:** 2026-11-11
**Fuente de evidencia:** mapeo read-only de `niltonbedoya/cardionutri` (clon en `../refs/cardionutri`, privado mismo dueño).

## Decisión

La mezcla toma de Cardionutri **solo su andamiaje técnico verificado**; la lógica clínica del dominio endometriosis **no se toca** y manda siempre (contratos Zod, `auditor`, triaje determinista, Local-First).

## 1. Qué TRANSFIERE (REUSE) — evidencia path:line verificada

| De Cardionutri | Para el asistente | Nota de adaptación |
| :--- | :--- | :--- |
| Paridad atómica menú→compra: `consolidateShoppingList` (`src/schemas/weeklyPlanner.schema.ts:199-284`: fusión de ingredientes entre días, escalado de cantidades, preserva `checked`, `recipeSources`) | Núcleo del invariante `grocery_parity` del `planificador` | Portar a TypeScript puro con Vitest + Zod; sumar HITL: toda mutación conversacional del menú recalcula la lista |
| Enum de pasillos de supermercado (`weeklyPlanner.schema.ts:3-22`) | `grocery_list.category` del contrato `WeeklyNutritionPlan` | Dominio-neutral, directo |
| Estructura de alergias/intolerancias + directiva "VETO CLÍNICO ABSOLUTO" en prompts (`src/schemas/allergies.schema.ts:10-90`) | `metadatos de tolerancia digestiva` (gluten, caseína, histamina, FODMAPs) | Reemplazar listas UE/cardio por la lista de la especificación endometriosis |
| Gatekeeper legal: `MEDICAL_DISCLAIMER_TEXT` + modal `mode="gatekeeper"` (`legalTerms.schema.ts:14`, `App.tsx:61-65`) | Descargos obligatorios + concepto `auditor` | Portar el patrón disclaimer-primero al cliente |
| Estilo de contratos Zod (`z.infer`) y repositorios locales con `safeParse` al leer (`weeklyPlannerRepository.ts:14-38`) | Convención ya establecida en `src/core/contracts/` | Motor de storage será SQLite cifrado (op-sqlite/SQLCipher) según spec, no AsyncStorage |

## 2. Qué NO TRANSFIERE — conflictos con las invariantes del proyecto

1. **IA en la nube para datos clínicos (`CONFLICT`):** `aiService.ts` envía perfil e imágenes a Gemini REST y Ollama Cloud (`aiService.ts:330,439`), con clave de Gemini expuesta al cliente (`EXPO_PUBLIC_GEMINI_API_KEY`, línea 12). **Infringe Local-First.** La arquitectura del asistente lo resuelve: el Edge Gateway (Cloudflare Worker) custodia las credenciales; el dispositivo jamás habla directo al proveedor con datos clínicos; el `triaje` es determinista sin LLM.
2. **Rutas Supabase entrelazadas (`CONFLICT`):** todo repositorio ramifica sobre `isSupabaseConfigured` aunque esté desactivado (`supabase.ts:10`). No se copian: el asistente no tendrá rutas de nube que seccionar.
3. **Semáforo por biomarcadores cardio (`ADAPT`, no transfiere tal cual):** `clinicalThresholds.ts` (LDL, ácido úrico, eGFR, glucosa) es otro dominio. El semáforo 🔴🟡🟢 del asistente se construye sobre EVA, energía, distensión y sangrado (check-in) + fase del ciclo. Se reutiliza solo la estructura de umbrales→color.
4. **Jest (`CONFLICT`):** la metodología del proyecto es Vitest (ya en toolchain). Los patrones de test se reutilizan como concepto.
5. **Menú familiar/niños y ahorro (`IRRELEVANT`):** fuera del dominio endometriosis.

## 3. Orden de adaptación propuesto (T5, sujeto a autorización)

1. **S1:** Portar `consolidateShoppingList` + pasillos con RED→GREEN en `tests/invariants/grocery_parity.test.ts` y contrato `WeeklyNutritionPlan` — es el módulo con mayor valor directo y menor riesgo.
2. **S2:** Perfil de usuaria + intolerancias (adaptación del `UserProfile`/`AllergiesProfile` a listas endometriosis).
3. **S3:** `analizador` (ciclicidad + semáforo + ventana predictiva) — lógica propia del dominio, sin base en Cardionutri.
4. **S4:** `entrenador_personal` + invariante `workout_safety`.
5. **S5:** `fitoterapista` + descargos.
6. **S6:** `auditor` gatekeeper + orquestador.

## 4. Incidencia de seguridad detectada en Cardionutri (fuera de este repo)

`src/services/aiService.ts:13-15` contiene un **bearer token de Ollama hardcodeado** (verificado). Recomendaciones al dueño del repo: rotar/revocar ese token en la consola de Ollama y moverlo a variable de entorno no versionada. No afecta al asistente de endometriosis (no se copia ese servicio), pero conviene corregirlo en el origen.
