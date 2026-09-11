import type { SubscribeResponseDto } from '#src/modules/newsletter/dtos/subscribe.response.dto';

export function toSubscribeResponse(): SubscribeResponseDto {
  return { message: 'Subscription successful! Please check your email to confirm.' };
}
