import { describe, expect, it } from 'vitest';
import {
  EncryptedSqliteLocalStore,
  createOpSqliteEncryptedStore,
  type SqliteDatabase,
  type SqliteStatementResult,
} from '@core/memory/encrypted-sqlite-store';

class FakeDb implements SqliteDatabase {
  readonly statements: Array<{ sql: string; params: unknown[] }> = [];
  private readonly rows = new Map<string, string>();

  async execute(sql: string, params: unknown[] = []): Promise<SqliteStatementResult> {
    this.statements.push({ sql, params });
    if (sql.startsWith('CREATE TABLE')) return { rows: [] };
    if (sql.startsWith('INSERT INTO')) {
      this.rows.set(String(params[0]), String(params[1]));
      return { rows: [] };
    }
    if (sql.startsWith('SELECT value FROM')) {
      const value = this.rows.get(String(params[0]));
      return { rows: value ? [{ value }] : [] };
    }
    if (sql.startsWith('DELETE FROM')) {
      this.rows.delete(String(params[0]));
      return { rows: [] };
    }
    return { rows: [] };
  }
}

describe('EncryptedSqliteLocalStore', () => {
  it('creates the local table and round-trips JSON values', async () => {
    const db = new FakeDb();
    const store = new EncryptedSqliteLocalStore({ db, tableName: 'local_store' });
    await store.set('check-in:today', { pain_score: 4, energy_level: 3 });
    expect(await store.get('check-in:today')).toEqual({ pain_score: 4, energy_level: 3 });
    expect(db.statements[0]?.sql).toContain('CREATE TABLE IF NOT EXISTS local_store');
  });

  it('returns null for missing keys and supports delete', async () => {
    const db = new FakeDb();
    const store = new EncryptedSqliteLocalStore({ db });
    expect(await store.get('missing')).toBeNull();
    await store.set('a', 1);
    await store.delete('a');
    expect(await store.get('a')).toBeNull();
  });

  it('overwrites existing keys atomically via UPSERT', async () => {
    const db = new FakeDb();
    const store = new EncryptedSqliteLocalStore({ db });
    await store.set('profile', { intolerances: ['GLUTEN'] });
    await store.set('profile', { intolerances: ['GLUTEN', 'FODMAP'] });
    expect(await store.get('profile')).toEqual({ intolerances: ['GLUTEN', 'FODMAP'] });
    expect(db.statements.filter((s) => s.sql.includes('ON CONFLICT')).length).toBe(2);
  });

  it('factory opens op-sqlite with encryption key and never persists key in records', async () => {
    let opened: Record<string, unknown> | null = null;
    const db = new FakeDb();
    const store = createOpSqliteEncryptedStore(
      {
        open(params) {
          opened = params as unknown as Record<string, unknown>;
          return db;
        },
      },
      { name: 'endometriosis.db', location: 'default', encryptionKey: 'device-secret-key', tableName: 'local_store' },
    );
    await store.set('k', 'v');
    expect(opened).toEqual({ name: 'endometriosis.db', location: 'default', encryptionKey: 'device-secret-key' });
    expect(JSON.stringify(db.statements)).not.toContain('device-secret-key');
  });
});
