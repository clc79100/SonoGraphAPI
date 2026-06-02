import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Inject,
  LoggerService,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    let statusCode: number;
    let responseBody: object;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const raw = exception.getResponse();
      responseBody = typeof raw === 'object' ? (raw as object) : { message: raw };
    } else {
      statusCode = 500;
      responseBody = { statusCode: 500, message: 'Internal server error' };
    }

    const stack = exception instanceof Error ? exception.stack : undefined;
    const message =
      exception instanceof Error ? exception.message : String(exception);

    if (statusCode >= 500) {
      this.logger.error(message, stack, 'ExceptionFilter');
    } else {
      this.logger.warn(
        `${req.method} ${req.path} → ${statusCode}: ${message}`,
        'ExceptionFilter',
      );
    }

    res.status(statusCode).json(responseBody);
  }
}
