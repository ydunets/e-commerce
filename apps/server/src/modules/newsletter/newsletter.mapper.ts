import type { SubscribeResponseDto } from '#src/modules/newsletter/dtos/subscribe.response.dto.ts';

export interface NewsletterMapper {
  toSubscribeResponse(): SubscribeResponseDto;
}

export default function newsletterMapper(): NewsletterMapper {
  return {
    toSubscribeResponse(): SubscribeResponseDto {
      return { message: 'Subscription successful! Please check your email to confirm.' };
    },
  };
}
