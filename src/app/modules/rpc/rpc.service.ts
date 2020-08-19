import {
  Controller,
  HttpException as NestHttpException,
  HttpStatus,
  Injectable,
  UseFilters,
} from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MappedException, MappedExceptionFilter } from '../../..';
import { User } from '../user/user.entity';
import { RpcException as LocalRpcException } from './rpc.exception';
import { status as GrpcStatus } from 'grpc';

@Controller()
@UseFilters(new MappedExceptionFilter())
@Injectable()
export class RpcService {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    private readonly exception: MappedException<LocalRpcException>,
  ) {}

  @GrpcMethod('RpcService', 'databaseError')
  async databaseError() {
    return await this.repository.findOne('uuid');
  }

  @GrpcMethod('RpcService', 'create')
  async create(data: User) {
    const created = this.repository.create(data);
    return await this.repository.save(created);
  }

  @GrpcMethod('RpcService', 'applicationError')
  async applicationError() {
    throw new RpcException({
      code: GrpcStatus.ALREADY_EXISTS,
      message: 'This is an application error',
    });
  }

  @GrpcMethod('RpcService', 'exceptionError')
  async exceptionError() {
    this.exception.ERRORS.NOT_FOUND.throw();
  }

  @GrpcMethod('RpcService', 'httpException')
  async httpException() {
    throw new NestHttpException(
      'Testing HTTP exception',
      HttpStatus.I_AM_A_TEAPOT,
    );
  }
}
