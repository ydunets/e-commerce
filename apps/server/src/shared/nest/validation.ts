import type { ApiErrorSubError } from '@e-commerce/contracts';
import { HttpStatus, StandardSchemaValidationPipe } from '@nestjs/common';
import { ExceptionBase } from '#src/shared/exceptions/exception-base';

export class ValidationException extends ExceptionBase {
  readonly statusCode = HttpStatus.BAD_REQUEST;
  readonly error = 'Bad Request';
  constructor(readonly subErrors: ApiErrorSubError[]) {
    super('Validation error');
  }
}

export function createValidationPipe() {
  return new StandardSchemaValidationPipe({
    exceptionFactory: (issues) =>
      new ValidationException(
        issues.map((issue) => ({
          path: (issue.path ?? [])
            .map((segment) => {
              const key = typeof segment === 'object' ? segment.key : segment;
              return `/${String(key).replaceAll('~', '~0').replaceAll('/', '~1')}`;
            })
            .join(''),
          message: issue.message,
        })),
      ),
  });
}
