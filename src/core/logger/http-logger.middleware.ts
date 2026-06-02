import { Inject, Injectable, LoggerService, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, path } = req;
    const startAt = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - startAt;
      const { statusCode } = res;
      const userId: string | undefined = (req as any).user?.userId;

      this.logger.log(
        `${method} ${path} → ${statusCode} (${durationMs}ms)`,
        JSON.stringify({
          context: 'HTTP',
          meta: { method, path, statusCode, durationMs, userId },
        }),
      );
    });

    next();
  }
}
