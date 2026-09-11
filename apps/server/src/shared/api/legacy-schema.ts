import type { TUnsafe } from 'typebox';
import { z } from 'zod';

/** Temporary JSON Schema boundary; remove after the final legacy schema consumer migrates. */
export function toLegacySchema<Schema extends z.ZodType>(schema: Schema, io: 'input' | 'output') {
  const { $schema: _dialect, ...jsonSchema } = z.toJSONSchema(schema, { target: 'draft-07', io });
  // Fastify still infers route types through TypeBox. Only its phantom static type is adapted;
  // runtime validation and serialization receive Zod's authoritative JSON Schema unchanged.
  return jsonSchema as typeof jsonSchema & TUnsafe<z.output<Schema>>;
}
