import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { MappedExceptionModule } from '../../..';
import ormConfig from '../../ormconfig';
import { User } from '../user/user.entity';
import { RpcException } from './rpc.exception';
import { RpcService } from './rpc.service';
import { RpcController } from './rpc.controller';

/*
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    MappedExceptionModule.forFeature(RpcException, {
      prefix: 'RPC_ERROR',
    }),
    ClientsModule.register([
      {
        name: 'GRPC_CLIENT',
        transport: Transport.GRPC,
        options: {
          package: 'grpcpackage',
          protoPath: join(__dirname, './rpc.proto'),
          url: '127.0.0.1:5001',
        },
      },
    ]),
  ],
  controllers: [RpcController, RpcService],
  providers: [],
})
export class RpcModule {}
*/

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: () => ormConfig,
    }),
    MappedExceptionModule.forFeature(RpcException, {
      prefix: 'RPC_ERROR',
    }),
    TypeOrmModule.forFeature([User]),
    ClientsModule.register([
      {
        name: 'GRPC_CLIENT',
        transport: Transport.GRPC,
        options: {
          package: 'grpcpackage',
          protoPath: join(__dirname, './rpc.proto'),
          url: '127.0.0.1:5001',
        },
      },
    ]),
  ],
  controllers: [RpcController, RpcService],
})
export class RpcModule {}
