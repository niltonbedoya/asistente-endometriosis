export interface ModelRequestInput {
  task: string;
  userMessage: string;
  clinicalData: Record<string, unknown>;
}

export interface ProviderRequest {
  task: string;
  userMessage: string;
  clinicalData: Record<string, unknown>;
  containsClinicalData: boolean;
  persistence: 'none';
}

const INSTRUCTION_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|system|safety)\s+instructions?/gi,
  /ignora\s+(todas\s+)?las\s+reglas\s+del\s+sistema/gi,
  /reveal\s+(the\s+)?api\s+key/gi,
  /revela\s+la\s+api\s+key/gi,
];

/** Removes known control-plane injection phrases while preserving the
 * user's health statement. This boundary never stores the clinical payload. */
export function sanitizeUserMessage(message: string): string {
  let sanitized = message;
  for (const pattern of INSTRUCTION_INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[contenido no clínico eliminado]');
  }
  return sanitized;
}

export function buildModelRequest(input: ModelRequestInput): ProviderRequest {
  return {
    task: input.task,
    userMessage: sanitizeUserMessage(input.userMessage),
    clinicalData: input.clinicalData,
    containsClinicalData: Object.keys(input.clinicalData).length > 0,
    persistence: 'none',
  };
}

interface Bucket {
  tokens: number;
  updatedAt: number;
}

export class TokenBucketRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(private readonly config: { capacity: number; refillPerSecond: number }) {}

  allow(subject: string, now = Date.now()): boolean {
    const previous = this.buckets.get(subject) ?? { tokens: this.config.capacity, updatedAt: now };
    const elapsedSeconds = Math.max(0, now - previous.updatedAt) / 1000;
    const refilled = Math.min(this.config.capacity, previous.tokens + elapsedSeconds * this.config.refillPerSecond);
    if (refilled < 1) {
      this.buckets.set(subject, { tokens: refilled, updatedAt: now });
      return false;
    }
    this.buckets.set(subject, { tokens: refilled - 1, updatedAt: now });
    return true;
  }
}
