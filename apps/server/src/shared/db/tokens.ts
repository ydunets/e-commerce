import type postgres from 'postgres';

export const DATABASE = Symbol('Database');
export type Database = ReturnType<typeof postgres>;
