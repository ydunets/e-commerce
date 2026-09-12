import { Controller, Get } from '@nestjs/common';
import { RouteSchema } from '@nestjs/platform-fastify';
import { ApplicationDispatcher } from '#src/shared/nest/dispatcher';
import { ListSpecificationsQuery } from './queries/list-specifications/list-specifications.query.js';
import { toSpecificationResponse } from './specification.mapper.js';

const SPECIFICATIONS_PATH = 'api/v1/specifications';

@Controller(SPECIFICATIONS_PATH)
export class SpecificationController {
  constructor(private readonly dispatcher: ApplicationDispatcher) {}

  @Get()
  @RouteSchema({
    description: 'List the product specification content shown on every product page',
    tags: ['specifications'],
  })
  async list() {
    const specifications = await this.dispatcher.query(new ListSpecificationsQuery());
    return specifications.map(toSpecificationResponse);
  }
}
