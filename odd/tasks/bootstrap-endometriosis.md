# Bootstrap: Asistente Adaptativo y Predictivo para Calidad de Vida en Endometriosis

**Objetivo:** inicializar el entorno completo del proyecto según `D:\Downloads\prompt_maestro_de_inicio (1).md` y el README base, con estructura Gentle-AI (SDD/TDD/ODD/RDD + Engram).
**Rama:** `main` (repositorio nuevo; main es la rama de feature en arranque greenfield).
**Estrategia de entrega:** `auto-chain` (commits por work-unit en main; PR cuando exista remoto).
**Test runner:** `npm test` (Vitest + Zod).

## Specs

- **S1** (Infra Git, verbatim): "Inicializar el repositorio Git local: `git init`." / "Establecer la rama principal: `git branch -M main`." / "Vincular con el repositorio remoto configurado en GitHub." (remoto pendiente: usuario aún no lo dio).
- **S2** (verbatim .gitignore): "`node_modules/`, `.expo/`, `dist/`, `build/`" — "`.env`, `.env.local`, `*.pem`, `wrangler.toml` (secretos)" — "Bases de datos locales de prueba: `*.db`, `*.sqlite`, `*.sqlite3`" — "Excepciones explícitas: permitir `.engram/` para sincronización de contexto compartido entre sesiones."
- **S3** (Gentle-AI, verbatim): "Ejecutar la configuración de agentes mediante `gentle-ai` seleccionando la persona **Gentleman**" / "Validar el estado del entorno ejecutando `gentle-ai doctor`" — hecho: 5 passed, 2 warnings (engram duplicado en PATH; MCP config solo para agente `antigravity`). Engram MCP funciona en sesión (proyecto `proyectocindy` resuelto).
- **S4** (Engram, verbatim): "Configurar **Engram™** como capa de persistencia contextual entre sesiones del agente." / "tras cada hito, sincronizar memorias con `engram sync` en la carpeta versionable `.engram/`."
- **S5** (Documental, verbatim): "Crear el directorio `docs/` con las subcarpetas `docs/architecture/`, `docs/contracts/` y `docs/safety/`." / "Crear el directorio `openspec/` para registrar especificaciones evolutivas".
- **S6** (agent.cmd, verbatim): "Generar en la raíz el archivo ejecutable `agent.cmd` ... que automatice: Comprobación de salud: `gentle-ai doctor`. Sincronización de memoria: `engram sync`. Ejecución de la suite de pruebas TDD: `npm test`. Lanzamiento del entorno en modo desarrollo y proxy local."
- **S7** (Dominio): Check-in diario <30s (EVA 0–10, energía 1–5, distensión, sangrado); calendario semafórico 🔴🟡🟢; motor predictivo 7–14 días; nutrición HITL con lista de compra atómica; entrenamiento bimodal (restaurativo 🔴 / fuerza 🟢🟡); fitoquímica consultiva; Red Flag Circuit Breaker + descargos obligatorios.
- **S8** (Agentes y contratos): `orquestador`, `triaje` (`SafetyEvaluation`), `analizador` (`BiologicalState`), `planificador` (`WeeklyNutritionPlan`), `entrenador_personal` (`WorkoutPrescription`), `fitoterapista` (`SupplementFactSheet`), `auditor` (`AuditReport`) — esquemas Zod en `src/core/contracts/`.
- **S9** (TDD, verbatim): "El proyecto se rige por el ciclo **RED-GREEN-REFACTOR**. No se creará ninguna función o agente sin su test previo que falle". Tests de contratos en `tests/contracts/`; invariantes: `triaje_safety`, `grocery_parity`, `workout_safety`; mocks deterministas en `tests/mocks/`.
- **S10** (Tarea de comienzo, verbatim): "Escribir la primera suite de pruebas TDD para `triaje` y la validación de contratos en `tests/contracts/triaje.test.ts`. Ejecutar `npm test` para constatar el estado **RED** antes de implementar el código de los agentes."
- **S11** (Docs Gentle-AI): `AGENTS.md` (guía de agentes OpenCode con persona Gentleman) y `README.md` adaptado a lo que aconseja Gentle-AI (badges, estructura, metodologías, aviso legal).

## Tasks

- **T1** (S1,S2,S4) — Infra: `git init` main, `.gitignore`, estructura, `package.json`, `tsconfig.json`, `vitest.config.ts`. Ruta: inline. Estado: ✅ hecho — commit `c475ba8`.
- **T2** (S5,S6,S11) — Documentación: `README.md`, `AGENTS.md`, `agent.cmd`, ADR-001, `docs/contracts/`, `docs/safety/`, `openspec/0001-bootstrap.md`. Ruta: inline. Estado: ✅ hecho — commit `c53a62e`.
- **T3** (S8,S9,S10) — TDD RED→GREEN: RED observado (`npm test` → 2 ficheros fallidos por módulos inexistentes), GREEN observado (16/16 tests, `npm run typecheck` limpio): esquemas `safetyEvaluationSchema`/`triageInputSchema` + `evaluateSafety` determinista. Ruta: inline. Estado: ✅ hecho — commit `285b154`.
- **T4** (S3,S4) — Engram: `mem_save` obs 216 (arquitectura bootstrap), `engram sync` ejecutado (`.engram/` con chunks + manifest). Ruta: inline. Estado: ✅ hecho.
- **T5** (S7 restante: analizador/planificador/entrenador/fitoterapista/auditor + invariantes grocery_parity, workout_safety) — Próximo hito (más allá del bootstrap; requiere decisión de mezcla con Cardionutri). Estado: ⏳ pendiente (bloqueado por decisión cardionutri).
- **T6** — Vincular remoto GitHub (S1 pendiente: falta URL). Estado: ⏳ pendiente (bloqueado por datos del usuario).

## Log

- **L1** (2026-11-11, verbatim): "D:\Downloads\prompt_maestro_de_inicio (1).md D:\Downloads\readme_del_proyecto.md te paso estos dos ficheros para comenzar un proyecto nuevo. usa todas las herramientas de Gentle-AI (ODD, TDD, SDD, engram, etc), hay que crear todos los documentos necesarios para el proyecto, incluyendo agents.md readme.md adaptado a lo que Gentle-AI aconseja, etc, pero ademas debes de hacer un analisis importante porque quiero adaptar este proyecto como una mezcla entre este proyecto y cardionutri, dime que necesitas para acceder a cardionutri en github y poder hacer una adaptacion de lo que pedimos en este proyecto con cardionutri. pero siempre enfocado a lo que este proyecto manda, la endiometriosis. comencemos"
- **L2** (2026-11-11): Bootstrap ejecutado inline (criterio Task Size: cambios understood y mecánicos, sin unidades paralelas independientes que disparen Writer trigger). T1–T4 completados con evidencia observada: RED (2 failed) → GREEN (16 passed) → typecheck limpio. Commits: `c475ba8` (chore infra), `c53a62e` (docs), `285b154` (feat triaje). Avisos `gentle-ai doctor` no bloqueantes: engram duplicado en PATH (C:\Users\NILTO\AppData\Local\engram\bin y C:\Users\NILTO\go\bin — limpieza sugerida) y MCP config persistida solo para agente `antigravity`. Pendiente: T5 (resto de agentes), T6 (remoto GitHub). Cardionutri: pendiente de acceso (URL pública con clone basta; repo privado requiere `gh auth` o PAT de lectura).
