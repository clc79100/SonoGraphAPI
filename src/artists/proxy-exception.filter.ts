import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ProxyError, ProxyErrorCode } from '../proxy/types';

const STATUS_BY_CODE: Record<ProxyErrorCode, number> = {
  no_credentials: HttpStatus.SERVICE_UNAVAILABLE, // 503
  premium_required: HttpStatus.BAD_GATEWAY, // 502
  request_failed: HttpStatus.BAD_GATEWAY, // 502
  not_found: HttpStatus.NOT_FOUND, // 404
};

@Catch(ProxyError)
export class ProxyExceptionFilter implements ExceptionFilter {
  catch(err: ProxyError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const status = STATUS_BY_CODE[err.code] ?? HttpStatus.BAD_GATEWAY;
    res.status(status).json({ statusCode: status, code: err.code, message: err.message });
  }
}
