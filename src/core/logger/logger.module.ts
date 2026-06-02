import { Global, Module } from '@nestjs/common';
import { WinstonModule, utilities as nestWinstonUtils } from 'nest-winston';
import * as winston from 'winston';
import { envs } from '../../config/envs';

function buildTransports(): winston.transport[] {
  const { NODE_ENV, APPLICATIONINSIGHTS_CONNECTION_STRING } = envs;

  if (NODE_ENV === 'test') {
    return [new winston.transports.Console({ silent: true })];
  }

  if (NODE_ENV === 'production') {
    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      }),
    ];

    if (APPLICATIONINSIGHTS_CONNECTION_STRING) {
      // Importación dinámica para evitar que el módulo cargue App Insights
      // antes de que main.ts lo inicialice con .setup().start().
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { AzureApplicationInsightsLogger } = require('winston-azure-application-insights');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const appInsights = require('applicationinsights');
      transports.push(
        new AzureApplicationInsightsLogger({ client: appInsights.defaultClient }),
      );
    }

    return transports;
  }

  // development (default)
  return [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        nestWinstonUtils.format.nestLike('Sonograph', {
          colors: true,
          prettyPrint: true,
        }),
      ),
    }),
  ];
}

@Global()
@Module({
  imports: [
    WinstonModule.forRoot({
      transports: buildTransports(),
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}
