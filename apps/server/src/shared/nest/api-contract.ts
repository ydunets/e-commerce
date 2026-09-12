import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import type { z } from 'zod';

interface ApiContractOptions {
  response: z.ZodType;
  errors?: number[];
}

/** Responses are documentation only; Nest infers request schemas from parameter decorators. */
export function ApiContract({ response, errors = [] }: ApiContractOptions) {
  return applyDecorators(
    ApiResponse({ status: HttpStatus.OK, standardSchema: response }),
    ...[...errors, HttpStatus.INTERNAL_SERVER_ERROR].map((status) =>
      ApiResponse({ status, schema: { $ref: '#/components/schemas/ApiErrorResponse' } }),
    ),
  );
}
