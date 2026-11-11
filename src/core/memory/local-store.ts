export interface LocalStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
}

/** Deterministic adapter used by tests and development. Production adapters
 * implement this port with encrypted SQLite; no cloud persistence is allowed. */
export class InMemoryLocalStore implements LocalStore {
  private readonly values = new Map<string, unknown>();

  async get<T>(key: string): Promise<T | null> {
    return (this.values.get(key) as T | undefined) ?? null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.values.set(key, JSON.parse(JSON.stringify(value)) as T);
  }

  async delete(key: string): Promise<void> {
    this.values.delete(key);
  }
}
