import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema.js';
import path from 'path';

let clientInstance = null;
let dbInstance = null;

export function getDbClient() {
  if (clientInstance) {
    return clientInstance;
  }

  const url = process.env.TURSO_DATABASE_URL || 'file:gate_compass.db';
  const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

  // For local file, ensure path is clean if not relative
  clientInstance = createClient({
    url,
    authToken,
  });

  return clientInstance;
}

export function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const client = getDbClient();
  dbInstance = drizzle(client, { schema });
  return dbInstance;
}

export { schema };
