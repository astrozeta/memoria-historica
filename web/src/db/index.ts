import {drizzle} from 'drizzle-orm/node-postgres';
import {Pool} from 'pg';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // No lanzamos aquí en el módulo top-level para no romper builds sin BD configurada.
  // El error se manifestará al primer query si la URL falta.
  console.warn(
    '[db] DATABASE_URL no está definida. La conexión fallará al primer query.'
  );
}

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

const pool =
  global.__pgPool ??
  new Pool({
    connectionString,
    max: 10
  });

if (process.env.NODE_ENV !== 'production') {
  global.__pgPool = pool;
}

export const db = drizzle(pool, {schema});
export {schema};
