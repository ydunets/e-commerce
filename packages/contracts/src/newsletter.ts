import { type Static, Type } from 'typebox';

export const subscribeResponseDtoSchema = Type.Object({
  message: Type.String({
    example: 'Subscription successful! Please check your email to confirm.',
  }),
});

export type SubscribeResponseDto = Static<typeof subscribeResponseDtoSchema>;
