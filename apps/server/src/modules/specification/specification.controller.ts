import { specificationResponseDtoSchema } from '@e-commerce/contracts';
import { Controller, Get } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { ApiContract } from '#src/shared/nest/api-contract';
import { ApplicationDispatcher } from '#src/shared/nest/dispatcher';
import { ListSpecificationsQuery } from './queries/list-specifications/list-specifications.query.js';
import { toSpecificationResponse } from './specification.mapper.js';

const SPECIFICATIONS_PATH = 'api/v1/specifications';

@Controller(SPECIFICATIONS_PATH)
export class SpecificationController {
  constructor(private readonly dispatcher: ApplicationDispatcher) {}

  @Get()
  @ApiOperation({
    description: 'List the product specification content shown on every product page',
    tags: ['specifications'],
  })
  @ApiContract({ response: specificationResponseDtoSchema.array() })
  async list() {
    const specifications = await this.dispatcher.query(new ListSpecificationsQuery());
    return specifications.map(toSpecificationResponse);
  }
}
