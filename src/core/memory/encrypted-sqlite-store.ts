import type { LocalStore } from './local-store';

export interface SqliteStatementResult {
  rows?: { _array: Array<Record<string, unknown>> } | Array<Record<string, unknown>>;
}

export interface SqliteDatabase {
  execute(sql: string, params?: unknown[]): Promise<SqliteStatementResult> | SqliteStatementResult;
  executeAsync?(sql: string, params?: unknown[]): Promise<SqliteStatementResult>;
  close?(): Promise<void> | void;
}

export interface SqliteStoreOptions {
  db: SqliteDatabase;
  tableName?: string;
  encryptionKey?: string;
}

function rowsArray(result: SqliteStatementResult): Array<Record<string, unknown>> {
  const rows = result.rows as { _array?: Array<Record<string, unknown>> } | Array<Record<string, unknown>> | undefined;
  if (!rows) return [];
  if (Array.isArray(rows)) return rows;
  return rows._array ?? [];
}

/**
 * Local-first encrypted SQLite adapter for the LocalStore port.
 * The injected db must be opened with SQLCipher/encryption enabled by the
 * platform-specific factory (e.g. op-sqlite). This class never transmits
 * data and only performs local reads/writes.
 */
export class EncryptedSqliteLocalStore implements LocalStore {
  private readonly tableName: string;
  private readonly ready: Promise<void>;

  constructor(private readonly options: SqliteStoreOptions) {
    this.tableName = options.tableName ?? 'local_store';
    this.ready = this.init();
  }

  private async exec(sql: string, params: unknown[] = []): Promise<SqliteStatementResult> {
    const db = this.options.db;
    if (db.executeAsync) return db.executeAsync(sql, params);
    return db.execute(sql, params);
  }

  private async init(): Promise<void> {
    await this.exec(
      `CREATE TABLE IF NOT EXISTS ${this.tableName} (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)`,
    );
  }

  async get<T>(key: string): Promise<T | null> {
    await this.ready;
    const result = await this.exec(`SELECT value FROM ${this.tableName} WHERE key = ?`, [key]);
    const row = rowsArray(result)[0];
    if (!row || typeof row.value !== 'string') return null;
    return JSON.parse(row.value) as T;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.ready;
    await this.exec(
      `INSERT INTO ${this.tableName} (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [key, JSON.stringify(value)],
    );
  }

  async delete(key: string): Promise<void> {
    await this.ready;
    await this.exec(`DELETE FROM ${this.tableName} WHERE key = ?`, [key]);
  }
}

export interface OpSqliteOpenParams {
  name: string;
  location?: string;
  encryptionKey?: string;
}

export interface OpSqliteModule {
  open(params: OpSqliteOpenParams): SqliteDatabase;
}

/** Factory for op-sqlite + SQLCipher. The encryption key must come from a
 * secure device store and never be hardcoded. */
export function createOpSqliteEncryptedStore(
  module: OpSqliteModule,
  params: OpSqliteOpenParams & { tableName?: string },
): EncryptedSqliteLocalStore {
  const db = module.open({
    name: params.name,
    location: params.location,
    encryptionKey: params.encryptionKey,
  });
  return new EncryptedSqliteLocalStore({ db, tableName: params.tableName, encryptionKey: params.encryptionKey });
}
