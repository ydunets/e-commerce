import { STATUS_CODES } from 'node:http';
import type { ApiErrorResponse } from '@e-commerce/contracts';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import type { FastifyInstance, FastifyReply } from 'fastify';
import { getRequestId } from '#src/shared/app/app-request-context';
import { ExceptionBase } from '#src/shared/exceptions/exception-base';
import { ValidationException } from './validation.js';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  constructor(private readonly adapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const reply = http.getResponse<FastifyReply>();
    const logger = this.adapterHost.httpAdapter.getInstance<FastifyInstance>().log;
    const statusCode =
      exception instanceof ExceptionBase
        ? exception.statusCode
        : exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
    const error = STATUS_CODES[statusCode] ?? 'Internal Server Error';
    const response: ApiErrorResponse = {
      statusCode,
      message: exception instanceof ExceptionBase ? exception.message : error,
      error: exception instanceof ExceptionBase ? exception.error : error,
      correlationId: getRequestId(),
      ...(exception instanceof ValidationException
        ? { subErrors: exception.subErrors }
        : exception instanceof ExceptionBase && exception.metadata !== undefined
          ? { details: exception.metadata }
          : {}),
    };
    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) logger.error(exception);
    else logger.warn(exception);
    reply.status(statusCode).send(response);
  }
}
