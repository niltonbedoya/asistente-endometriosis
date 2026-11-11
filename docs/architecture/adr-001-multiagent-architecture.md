# ADR-001: Arquitectura Multiagente Jerárquica con Gatekeeper de Seguridad

**Estado:** Aceptada · **Fecha:** 2026-11-11 · **Contexto:** Bootstrap del proyecto

## Decisión

El sistema se estructura como orquestador central + fast-path de seguridad + pipeline especializado + auditor independiente:

```
[Cliente móvil/PWA] → orquestador (Engram host)
  → triaje (circuit breaker, fast-path) — si EMERGENCY_REDIRECT, corta todo
  → pipeline: analizador → planificador / entrenador_personal / fitoterapista
  → auditor (QA & compliance gatekeeper)
  → respuesta final
```

## Justificación

1. **Seguridad primero:** en un asistente de salud, la barrera de triaje debe ser determinista y estar antes de cualquier generación. No depende del LLM: reglas clínicas codificadas (banderas rojas).
2. **Contratos tipados:** cada agente es un límite de esquema Zod. El `auditor` rechaza cualquier artefacto que viole contrato, descargos o invariantes. Esto hace verificable el pipeline completo con tests offline.
3. **Local-First:** los datos clínicos viven en SQLite cifrado en el dispositivo; el orquestador ejecuta en el cliente. El edge (Cloudflare Worker) solo custodia credenciales de modelos y aplica rate limiting — nunca almacena historiales.
4. **Dual-tier de modelos:** Llama 3.x para rutinas (check-ins, parsing), Gemini Flash para razonamiento estructurado (predicción, planificación). El cambio de tier es invisible para los contratos.

## Consecuencias

- Toda nueva capacidad entra como agente con contrato Zod + tests de contrato + invariante de seguridad si aplica.
- El `triaje` es puro y determinista: su lógica crítica no usa LLM.
- La paridad atómica menú/compra es responsabilidad del `planificador` y se valida en el `auditor`.

## Alternativas rechazadas

- **Monolito con funciones:** no permite auditar límites entre dominios ni aislar la capa de seguridad.
- **Microservicios en la nube:** rompe Local-First y exige mover datos clínicos fuera del dispositivo.
