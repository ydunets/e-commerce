import type { SubscribeResponseDto } from '@e-commerce/contracts';
import { apiPost } from './client';

export function subscribeToNewsletter(
  email: string,
  baseUrl = '',
): Promise<SubscribeResponseDto> {
  return apiPost<SubscribeResponseDto>(
    '/v1/newsletter/subscriptions',
    { email },
    baseUrl,
  );
}
