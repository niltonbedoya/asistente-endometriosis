# Fase 11 — Cliente Expo + flujo crítico Local-First

**Objetivo:** scaffold de app Expo en monorepo e integración del primer flujo crítico end-to-end (check-in → triaje → estado biológico/semáforo → persistencia local) usando el núcleo existente.
**Rama:** `main` (work-unit commits).
**Estrategia de entrega:** `auto-chain`.
**Test runner:** `npm test` (Vitest core) + typecheck; tests específicos mobile cuando aplique.
**Puerta por fase:** cada sub-tarea avanza solo si sus tests/typecheck pasan al 100%.

## Specs

- **S1 (scaffold):** Crear app Expo con TypeScript/Expo Router en `apps/mobile` dentro del workspace, sin romper el core existente (`src/core`, `tests`).
- **S2 (integración core):** Metro/TypeScript deben permitir importar `@core/*` desde la app móvil.
- **S3 (almacenamiento):** Implementar adaptador real del puerto `LocalStore` para SQLite cifrado (`op-sqlite` + SQLCipher) con API compatible; en entorno sin runtime nativo se valida con fakes/mocks deterministas y contrato del adaptador.
- **S4 (flujo crítico):** Check-in diario (<30s) → `evaluateSafety`/orquestador → semáforo y estado → persistencia local. Sin llamadas de red; datos clínicos solo en dispositivo.
- **S5 (UI accesible):** Usar tokens/tema clínico ya definidos (estado no solo por color, labels/iconos, targets accesibles).
- **S6 (gate):** Suite core existente sigue verde; nuevos tests del flujo y del adaptador verdes; typecheck verde.

## Tasks

- **T1** — Crear ODD doc y preparar workspace/Expo scaffold base (`apps/mobile`, Expo Router, Metro watch root). Estado: ✅ hecho.
- **T2** — Configurar resolución `@core/*` en app móvil y consumo del core desde pantalla. Estado: ✅ hecho (tsconfig/metro aliases + imports `@core/*` en UI).
- **T3** — Adaptador SQLite cifrado (contrato + implementación + tests deterministas). Estado: ✅ hecho — `EncryptedSqliteLocalStore` + factory op-sqlite/SQLCipher; tests con fake DB validan tabla local, round-trip, upsert, apertura con encryptionKey y no fuga de key en registros.
- **T4** — Flujo crítico check-in/triage/estado/persistencia + UI base accesible. Estado: ✅ hecho — `runDailyCheckInFlow` (triage primero, cortocircuito emergencia, persistencia local, sin red) + pantalla Expo accesible con estado semántico.
- **T5** — Evidencia final (tests/typecheck), commits, push y cierre. Estado: ✅ en cierre (verificación observada abajo).

## Log

- **L1** (2026-11-12, verbatim): "adelante con la fase 11"
- **L2** (2026-11-12): Inicio Fase 11. Se mantiene core en `src/core` para no romper 95 tests existentes; app Expo se añadió como workspace en `apps/mobile`.
- **L3** (2026-11-12): Implementado adaptador `EncryptedSqliteLocalStore` (inyección de driver, UPSERT, init tabla) y factory `createOpSqliteEncryptedStore` para `op-sqlite` + SQLCipher; flujo `runDailyCheckInFlow` con triage determinista primero, persistencia local y sin red; pantalla `apps/mobile/app/index.tsx` con tema clínico accesible. Evidencia observada: `npm run typecheck` limpio, `npm test` → 17 test files, 102 tests passed. Pendiente de runtime real: instalar deps Expo/nativas, ejecutar en simulador/dispositivo y validar SQLCipher/op-sqlite en almacenamiento cifrado efectivo.
