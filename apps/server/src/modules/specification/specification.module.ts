import { Module } from '@nestjs/common';
import { SharedModule } from '#src/shared/nest/shared.module';
import { PostgresSpecificationRepository } from './database/specification.repository.js';
import { SPECIFICATION_REPOSITORY } from './database/specification.repository.port.js';
import { ListSpecificationsHandler } from './queries/list-specifications/list-specifications.handler.js';
import { SpecificationController } from './specification.controller.js';

@Module({
  imports: [SharedModule],
  controllers: [SpecificationController],
  providers: [
    ListSpecificationsHandler,
    { provide: SPECIFICATION_REPOSITORY, useClass: PostgresSpecificationRepository },
  ],
})
export class SpecificationModule {}
