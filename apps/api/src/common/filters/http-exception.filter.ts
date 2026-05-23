import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: any = { message: 'Internal server error' };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse();
      body = typeof resp === 'string' ? { message: resp } : resp;
    } else if (exception instanceof Error) {
      // Info: never leak raw error messages / stack details to clients on a
      // 5xx. Log the full error server-side; respond generically (detailed
      // message only outside production for local debugging).
      this.logger.error(exception.message, exception.stack);
      body = {
        message:
          process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : exception.message,
      };
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...body,
    });
  }
}
