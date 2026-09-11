import type { SubscriberRepository } from '#src/modules/newsletter/database/subscriber.repository.port';
import type { NewsletterMapper } from '#src/modules/newsletter/newsletter.mapper';
import { actionCreatorFactory } from '#src/shared/cqrs/action-creator';

declare global {
  export interface Dependencies {
    newsletterMapper: NewsletterMapper;
    subscriberRepository: SubscriberRepository;
  }
}

export const newsletterActionCreator = actionCreatorFactory('newsletter');
