import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    
    return {
      type: 'postgres',
      // url: 'postgresql://postgres:postgres@localhost:5432/tradeprodb',//process.env.DATABASE_URL,
      // url: this.configService.get<string>('POSTGRES_URL'),
      //       username: this.configService.get<string>('POSTGRES_USER'),
      //       password: this.configService.get<string>('POSTGRES_PASSWORD'),

      database: this.configService.get('DB_NAME'),
            host: this.configService.get('DB_HOST'),
            port: this.configService.get('DB_PORT'),
            username: this.configService.get('DB_USER'),
            password: this.configService.get('DB_PASSWORD'),
      dropSchema: false,
      keepConnectionAlive: true,
      logging: this.configService.get('NODE_ENV') !== 'production',
      entities: ['**/*.entity.js'],
      cli: {
        entitiesDir: 'src',
        subscribersDir: 'subscriber',
      },
    } as TypeOrmModuleOptions;
  }
}
