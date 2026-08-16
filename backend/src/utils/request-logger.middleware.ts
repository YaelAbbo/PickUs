import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const start = Date.now();

    this.logger.log(`[REQUEST START] ${method} ${originalUrl} (${ip})`);

    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - start;
      const contentLength = res.get('content-length') || 0;

      this.logger.log(
        `[REQUEST END] ${method} ${originalUrl} ${statusCode} - ${duration}ms (${contentLength}b)`,
      );
    });

    next();
  }
}
