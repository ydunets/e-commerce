import { z } from 'zod';

export const subscribeResponseDtoSchema = z.object({
  message: z.string().meta({
    example: 'Subscription successful! Please check your email to confirm.',
  }),
});

export type SubscribeResponseDto = z.infer<typeof subscribeResponseDtoSchema>;
