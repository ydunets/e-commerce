import { Type } from 'typebox';

export const subscribeBodySchema = Type.Object({
  email: Type.String({
    format: 'email',
    example: 'jane@example.com',
    description: 'Visitor email address to subscribe to the newsletter',
  }),
});
