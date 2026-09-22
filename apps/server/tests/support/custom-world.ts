import { type IWorldOptions, setWorldConstructor, World } from '@cucumber/cucumber';
import type * as messages from '@cucumber/messages';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { LightMyRequestResponse } from 'fastify';
import type postgres from 'postgres';

export interface TestContext {
  latestResponse?: LightMyRequestResponse;
  [key: string]: unknown;
}

export interface ICustomWorld extends World {
  debug: boolean;
  feature?: messages.Pickle;
  testName?: string;
  startTime?: Date;
  db: ReturnType<typeof postgres>;
  server: NestFastifyApplication;
  context: TestContext;
}

export class CustomWorld extends World implements ICustomWorld {
  // oxlint-disable-next-line no-useless-constructor -- needed
  constructor(options: IWorldOptions) {
    super(options);
  }

  debug = false;
  server = undefined as unknown as NestFastifyApplication;
  db = undefined as unknown as ReturnType<typeof postgres>;
  context: TestContext = {};
}

setWorldConstructor(CustomWorld);
