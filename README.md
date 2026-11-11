# Asistente Integral Predictivo para Endometriosis

[![Built with Gentle-AI](https://raw.githubusercontent.com/Gentleman-Programming/gentle-ai/main/docs/assets/brand/built-with-gentle-ai.png)](https://github.com/Gentleman-Programming/gentle-ai)
[![Methodology: SDD & TDD & ODD](https://img.shields.io/badge/Methodology-SDD%20%26%20TDD%20%26%20ODD-blue.svg)](docs/architecture/)
[![Memory: Engram](https://img.shields.io/badge/Memory-Engram%E2%84%A2-purple.svg)](docs/engram.md)
[![Privacy: Local-First](https://img.shields.io/badge/Privacy-Local--First-green.svg)](#privacidad-y-seguridad-local-first)

> Asistente predictivo, adaptativo y privado enfocado en la mitigación del dolor, nutrición antiinflamatoria sincronizada, entrenamiento bimodal y soporte de calidad de vida para personas con endometriosis y enfermedades asociadas.

---

## 1. Visión y Propósito del Sistema

La **endometriosis** es una enfermedad inflamatoria crónica, multisistémica y estrógeno-dependiente que requiere un abordaje multidisciplinar preventivo. Este sistema sustituye la reactividad tradicional por un modelo de **acompañamiento predictivo** enfocado en cinco pilares:

1. **Predicción Cíclica y Brotes:** anticipación de ventanas de vulnerabilidad inflamatoria (horizonte 7–14 días) cruzando el ciclo ovárico/menstrual con el histórico diario de sintomatología.
2. **Nutrición Antiinflamatoria Interactiva (HITL):** menús semanales adaptados a la fase del ciclo con generación atómica de la lista de la compra y bucle conversacional para sustituciones y *batch cooking*.
3. **Movilidad y Fuerza Bimodal:** prescripción biomecánica adaptada al estado inflamatorio diario: rutinas restaurativas y descompresión de suelo pélvico en días 🔴 vs. entrenamiento de fuerza en ventanas 🟢/🟡.
4. **Fitoquímica Consultiva:** base de conocimiento indexada sobre micronutrientes y biodisponibilidad con validación de advertencias; estrictamente informativo, nunca prescriptivo.
5. **Privacidad Rigurosa (Local-First):** la información clínica, analíticas escaneadas y registros de dolor residen y se procesan exclusivamente en el dispositivo.

## 2. Arquitectura Multiagente Jerárquica

Orquestador central + fast-path de seguridad (`triaje`, circuit breaker) + pipeline especializado (`analizador`, `planificador`, `entrenador_personal`, `fitoterapista`) + `auditor` QA Gatekeeper. Coordinada con el framework **Gentle-AI** y **Engram™** como memoria persistente.

| Agente | Rol | Salida (contrato Zod) |
| :--- | :--- | :--- |
| `orquestador` | Coordinador, enrutador, host de memoria | Respuesta consolidada y auditada |
| `triaje` | Circuit Breaker y guardrails médicos | `SafetyEvaluation` |
| `analizador` | Telemetría, ciclicidad y predicción | `BiologicalState` |
| `planificador` | Nutrición antiinflamatoria y HITL grocery | `WeeklyNutritionPlan` |
| `entrenador_personal` | Movilidad y fuerza adaptada | `WorkoutPrescription` |
| `fitoterapista` | Catálogo consultivo de fitoquímica | `SupplementFactSheet` |
| `auditor` | Gatekeeper de calidad y cumplimiento | `AuditReport` |

Contratos completos: [`docs/contracts/contracts.md`](docs/contracts/contracts.md). Protocolo de seguridad: [`docs/safety/red-flag-protocol.md`](docs/safety/red-flag-protocol.md).

## 3. Stack Tecnológico

| Capa | Solución | Justificación |
| :--- | :--- | :--- |
| Cliente multiplataforma | React Native + Expo (TypeScript), monorepo | iOS nativo, Android nativo y PWA Offline-First |
| Almacenamiento local | SQLite cifrado con SQLCipher (`op-sqlite`) | Confidencialidad total: Local-First |
| OCR on-device | Google ML Kit / Apple Vision | Informes médicos sin enviar imágenes a la red |
| Memoria de agentes | Engram™ (Gentle-AI) | Contexto, decisiones y trazabilidad entre sesiones |
| Edge Gateway | Cloudflare Workers | Credenciales API, rate limiting, OWASP Top 10 for LLM |
| Modelos | Dual-tier: Llama 3.x (base) + Gemini Flash (pro) | Coste, latencia y razonamiento estructurado |
| Testing | Vitest + Zod | TDD estricto: contratos, invariantes y mocks deterministas |

## 4. Estructura del Proyecto

```
├── .engram/                    # Memorias sincronizadas de Engram™ (versionable)
├── docs/
│   ├── architecture/           # ADRs y diagramas
│   ├── contracts/              # Interfaces Zod de los agentes
│   └── safety/                 # Triaje clínico y banderas rojas
├── openspec/                   # Especificaciones evolutivas y registro ODD
├── odd/tasks/                  # Documentos de feature ODD (planes y logs vivos)
├── src/
│   ├── core/
│   │   ├── contracts/          # Esquemas Zod (inputs/outputs de cada agente)
│   │   ├── agents/             # Lógica de agentes
│   │   ├── orquestador/        # Máquina de estados y despacho
│   │   └── memory/             # Adaptadores Engram y almacenamiento local
│   ├── database/               # SQLite local y migraciones
│   ├── mcp/                    # Clientes/servidores MCP
│   └── ui/                     # Vistas React Native / Expo
├── tests/
│   ├── contracts/              # Tests de esquemas Zod (TDD)
│   ├── invariants/             # Invariantes clínicas y de seguridad
│   └── mocks/                  # Fixtures deterministas de LLM y MCP
├── agent.cmd                   # Script de control CLI
├── package.json
└── README.md
```

## 5. Instalación y Puesta en Marcha

**Prerrequisitos:** Node.js >= 20, Git, CLI `gentle-ai` y `engram` instalados.

```bash
npm install          # 1. Dependencias
gentle-ai doctor     # 2. Salud del entorno
npm test             # 3. Suite TDD (Vitest)
./agent.cmd --dev    # 4. Entorno de desarrollo
```

## 6. Flujo de Trabajo: ODD + SDD + TDD + RDD

- **ODD (Organic-Driven Development):** cada feature vive en `odd/tasks/<feature>.md` (specs `S#` verbatim, tasks, log) y se trabaja en unidades con commits revisables.
- **SDD (Spec-Driven):** las especificaciones evolutivas viven en `openspec/`; los contratos Zod son la fuente de verdad de las interfaces.
- **TDD estricto (RED → GREEN → REFACTOR):** ninguna función o agente se crea sin su test previo que falle. Invariantes clínicas deterministas (`triaje_safety`, `grocery_parity`, `workout_safety`) y mocks sin red ni tokens.
- **RDD (Receipt-Driven Review):** el cambio es revisado por el ecosistema Gentle-AI antes de cerrarse; los recibos y el riesgo quedan trazados.

## 7. Aviso Legal y Deontológico

Software exclusivamente educativo, informativo y de organización del estilo de vida para personas con endometriosis. **No constituye un dispositivo médico de diagnóstico ni realiza prescripciones farmacológicas.** Ante síntomas de alarma (dolor súbito 10/10, sangrado abundante anormal, signos peritoneales, síncope o fiebre), el sistema activa su protocolo de seguridad y redirige prioritariamente a la usuaria a un centro médico de urgencias.
