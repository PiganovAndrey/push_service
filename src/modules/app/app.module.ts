import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from '../../config/winston.config';
import configuration from 'src/config/configuration';
import { SessionGuard } from 'src/guards/session.guard';
import { APP_GUARD, APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { LoggingInterceptor } from 'src/common/interceptors/LoggingInterceptor';
import { PushModule } from '../push/push.module';
import { ClientsModule, Transport } from '@nestjs/microservices';

const configService = new ConfigService();
const KAFKA_BROKERS = configService.get<string>('KAFKA_BROKERS');

@Module({
    imports: [
        DatabaseModule,
        PushModule,
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration]
        }),
        WinstonModule.forRoot({
            transports: winstonConfig.transports,
            format: winstonConfig.format,
            level: winstonConfig.level
        }),
        ClientsModule.register([
            {
                name: 'AUTH_SERVICE',
                transport: Transport.KAFKA,
                options: {
                    client: {
                        clientId: 'auth-service',
                        brokers: [KAFKA_BROKERS]
                    },
                    consumer: {
                        groupId: 'auth-consumer-10',
                        retry: {
                            retries: 5,
                            restartOnFailure: async () => {
                                console.error('Consumer crashed, restarting...');
                                return true;
                              },
                        }
                    }
                }
            }
        ])
    ],
    providers: [
        Reflector,
        { provide: APP_GUARD, useClass: SessionGuard },
        { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor }
    ]
})
export class AppModule {}
