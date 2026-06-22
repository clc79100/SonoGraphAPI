import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Inject,
  LoggerService,
} from '@nestjs/common';
import { Response } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ProxyError, ProxyErrorCode } from '../proxy/types';

const STATUS_BY_CODE: Record<ProxyErrorCode, number> = {
  no_credentials: HttpStatus.SERVICE_UNAVAILABLE, // 503
  premium_required: HttpStatus.BAD_GATEWAY, // 502
  request_failed: HttpStatus.BAD_GATEWAY, // 502
  not_found: HttpStatus.NOT_FOUND, // 404
};

@Catch(ProxyError)
export class ProxyExceptionFilter implements ExceptionFilter {
  constructor(@Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService) {}

  catch(err: ProxyError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const status = STATUS_BY_CODE[err.code] ?? HttpStatus.BAD_GATEWAY;
    this.logger.error(
      `ProxyError [${err.code}]: ${err.message}`,
      undefined,
      'ProxyExceptionFilter',
    );
    res.status(status).json({ statusCode: status, code: err.code, message: err.message });
  }
}
