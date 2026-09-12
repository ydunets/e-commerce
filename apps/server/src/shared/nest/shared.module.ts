import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import env from '#src/config/env';
import { getDb } from '#src/shared/db/postgres';
import { DATABASE } from '#src/shared/db/tokens';
import { ApplicationDispatcher } from './dispatcher.js';
import { ApiExceptionFilter } from './exception.filter.js';

export const CONFIGURATION = Symbol('Configuration');

@Module({
  imports: [CqrsModule],
  providers: [
    { provide: CONFIGURATION, useValue: env },
    { provide: DATABASE, useFactory: getDb },
    ApplicationDispatcher,
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
  ],
  exports: [CONFIGURATION, DATABASE, ApplicationDispatcher, CqrsModule],
})
export class SharedModule {}
