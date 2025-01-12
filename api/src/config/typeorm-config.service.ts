import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
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
