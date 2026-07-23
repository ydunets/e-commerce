import type { SubscriberRepository } from '#src/modules/newsletter/database/subscriber.repository.port.ts';
import type { NewsletterMapper } from '#src/modules/newsletter/newsletter.mapper.ts';
import { actionCreatorFactory } from '#src/shared/cqrs/action-creator.ts';

declare global {
  export interface Dependencies {
    newsletterMapper: NewsletterMapper;
    subscriberRepository: SubscriberRepository;
  }
}

export const newsletterActionCreator = actionCreatorFactory('newsletter');
