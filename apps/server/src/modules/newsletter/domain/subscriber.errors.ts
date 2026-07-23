import { ConflictException } from '#src/shared/exceptions/index.ts';

/**
 * Raised by the repository on a unique-email conflict. The subscribe handler
 * catches and swallows this rather than letting it reach the client as a 409,
 * per ADR 0001 (re-subscribing is harmless; a 409 would enable enumeration).
 */
export class SubscriberAlreadyExistsException extends ConflictException {
  constructor(email: string) {
    super(`Subscriber with email ${email} already exists`);
  }
}
