import {neon} from '@neondatabase/serverless';
import {drizzle as drizzleNeonHttp} from 'drizzle-orm/neon-http';
import {drizzle as drizzleNodePg} from 'drizzle-orm/node-postgres';
import {Pool} from 'pg';
import * as schema from './schema';

// Resolución del driver y la URL:
//   - En producción (Netlify Functions con @netlify/database aprovisionado),
//     se inyecta NETLIFY_DB_URL y NETLIFY_DB_DRIVER. El driver `serverless`
//     debe usar Neon HTTP (no TCP), porque cada invocación es Lambda y las
//     conexiones TCP persistentes no funcionan bien.
//   - En desarrollo local con `netlify dev` se inyecta también NETLIFY_DB_URL.
//   - Para desarrollo sin Netlify (Postgres local, Neon directo) se acepta
//     DATABASE_URL y se usa el driver `pg` clásico con pool reutilizable.

const connectionString =
  process.env.NETLIFY_DB_URL ?? process.env.DATABASE_URL;

const useServerless =
  process.env.NETLIFY_DB_DRIVER === 'serverless' ||
  // Heurística: si estamos en Netlify y la URL viene de allí, asumir serverless.
  (!!process.env.NETLIFY_DB_URL && !process.env.DATABASE_URL);

if (!connectionString) {
  console.warn(
    '[db] Ni NETLIFY_DB_URL ni DATABASE_URL están definidas. La conexión fallará al primer query.'
  );
}

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function buildDb() {
  if (!connectionString) {
    // Construir igualmente para que tipos funcionen; fallará al ejecutar.
    return drizzleNodePg(new Pool({connectionString: ''}), {schema});
  }
  if (useServerless) {
    const sql = neon(connectionString);
    return drizzleNeonHttp(sql, {schema});
  }
  // Driver pg con pool global para reutilizar conexiones en dev.
  const pool =
    globalThis.__pgPool ?? new Pool({connectionString, max: 10});
  if (process.env.NODE_ENV !== 'production') {
    globalThis.__pgPool = pool;
  }
  return drizzleNodePg(pool, {schema});
}

export const db = buildDb();
export {schema};
