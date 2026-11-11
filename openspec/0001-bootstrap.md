# OpenSpec 0001 — Bootstrap del Proyecto

**Estado:** Implementado (parcial: núcleo de seguridad) · **Fecha:** 2026-11-11
**Fuente:** `D:\Downloads\prompt_maestro_de_inicio (1).md` + `D:\Downloads\readme_del_proyecto.md`

## Alcance de este cambio

1. Entorno Gentle-AI: Git (`main`), `.gitignore` estricto con `.engram/` versionable, `gentle-ai doctor`, Engram como memoria persistente, `agent.cmd` de control, estructura documental (`docs/`, `openspec/`).
2. Documentación viva: `README.md`, `AGENTS.md`, ADR-001, contratos, protocolo de banderas rojas.
3. Núcleo TDD inicial (RED→GREEN observado): contratos Zod de `triaje` + evaluador determinista `evaluateSafety` + invariantes de bandera roja.
4. Adaptación pendiente con **Cardionutri** (bloqueada: falta acceso al repositorio).

## Fuera de alcance (próximos specs)

- `analizador` (ciclicidad + motor predictivo 7–14 días), `planificador` (menús HITL + paridad atómica), `entrenador_personal` (bimodal), `fitoterapista` (catalogo), `auditor` (gatekeeper), cliente Expo, SQLite cifrado, MCPs, edge gateway.

## Trazabilidad

- Pedidos verbatim del usuario: `odd/tasks/bootstrap-endometriosis.md` (`## Specs`).
- Decisiones de arquitectura: `docs/architecture/adr-001-multiagent-architecture.md`.
- Memoria persistente: Engram (`project: proyectocindy`).
