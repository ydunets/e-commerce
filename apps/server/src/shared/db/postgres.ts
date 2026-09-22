import postgres from 'postgres';
import { LogLevel } from '#src/config/env';
import { env } from '#src/config/index';

let sql: ReturnType<typeof postgres> | null = null;

/** Returns the singleton DB connection, creating it lazily on first call. */
export function getDb(): ReturnType<typeof postgres> {
  if (!sql) {
    sql = postgres(env.db.url, {
      debug: (conn: number, query: string, params: unknown[], paramTypes: unknown[]) => {
        if (env.log.level === LogLevel.debug) {
          // oxlint-disable-next-line no-console -- needed for debugging
          console.debug(`
    SQL::
      Executing query: "${query.trim()}"
      Params: ${JSON.stringify(params)}
      Param Types: ${JSON.stringify(paramTypes)}
      Connection: ${conn}
    `);
        }
      },
    });
  }
  return sql;
}

export async function closeDbConnection() {
  if (sql) {
    await sql.end({ timeout: 5 });
    sql = null;
  }
}

export const joinConditions = (
  xs: (postgres.PendingQuery<postgres.Row[]> | false | undefined | null | '')[],
  joiner?: postgres.PendingQuery<postgres.Row[]>,
) => {
  const db = getDb();
  const join = joiner ?? db`AND`;
  const filtered = xs.filter(Boolean) as postgres.PendingQuery<postgres.Row[]>[];

  if (filtered.length === 0) {
    return db``;
  }

  return filtered.reduce(
    (acc, fragment, i) => (i === 0 ? db`WHERE ${fragment}` : db`${acc} ${join} ${fragment}`),
    db``,
  );
};
