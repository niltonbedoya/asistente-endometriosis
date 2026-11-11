# Protocolo de Banderas Rojas (Red Flag Circuit Breaker)

**Agente responsable:** `triaje` · **Naturaleza:** determinista, sin LLM · **Invariante:** `tests/invariants/triaje_safety.test.ts`

## 1. Activadores de emergencia (cualquiera dispara `EMERGENCY_REDIRECT`)

| Banda roja | Señal en check-in o mensaje |
| :--- | :--- |
| Dolor súbito 10/10 | `pain_score = 10` de inicio súbito o mencionado en texto |
| Sangrado abundante anormal | `bleeding_level` alto fuera de patrón habitual, o descripción de hemorragia |
| Signos peritoneales | abdomen rígido, dolor a la palpación, reacción de defensa |
| Síncope | pérdida de conciencia, desmayo, mareo intenso súbito |
| Fiebre activa | temperatura elevada reportada junto a dolor pélvico |

## 2. Comportamiento del circuit breaker

1. `triaje` devuelve `status: 'EMERGENCY_REDIRECT'`, `alert_level: 'CRITICAL'` con `emergency_reasons` poblados.
2. El `orquestador` **corta el pipeline**: `analizador`, `planificador`, `entrenador_personal` y `fitoterapista` no se ejecutan.
3. Se despliega la derivación inmediata a urgencias con instrucciones claras (acudir a un centro médico ahora; acompañarse si es posible).
4. La respuesta se registra en memoria local para contexto posterior; **nunca se envía al edge**.

## 3. Descargos obligatorios (activación automática)

- Embarazo posible → advertencia de consulta médica antes de cualquier suplemento o cambio de dieta.
- Lactancia → igual criterio.
- Anticoagulantes → advertencia de interacción para compuestos con efecto antiagregante/anticoagulante (Omega-3, cúrcuma, NAC).

## 4. Límites del sistema

- No diagnostica ni cuantifica gravedad más allá de la señal declarada.
- Ante duda (`WARNING`), reduce la agresividad de recomendaciones y sugiere consulta, sin bloquear el pipeline.
- La usuaria siempre tiene vía directa de emergencia fuera de la app.

## 5. Tests que protegen este protocolo

- `tests/invariants/triaje_safety.test.ts`: cada banda roja produce `EMERGENCY_REDIRECT`; input seguro produce `SAFE`.
- `tests/contracts/triaje.test.ts`: el schema Zod rechaza estados incompletos (p. ej. `EMERGENCY_REDIRECT` sin razones).
