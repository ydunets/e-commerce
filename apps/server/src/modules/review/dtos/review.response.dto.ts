import { type Static, Type } from 'typebox';

// Mirrors the GreatFrontend e-commerce reviews API shape (snake_case).
export const reviewResponseDtoSchema = Type.Object({
  id: Type.Integer(),
  user_id: Type.String({ example: 'natali-craig' }),
  name: Type.String({ example: 'Natali Craig' }),
  avatar_url: Type.Union([Type.String(), Type.Null()]),
  rating: Type.Integer({ minimum: 1, maximum: 5 }),
  content: Type.Union([Type.String(), Type.Null()]),
  created_at: Type.String({ example: '2024-03-11' }),
});

export type ReviewResponseDto = Static<typeof reviewResponseDtoSchema>;
