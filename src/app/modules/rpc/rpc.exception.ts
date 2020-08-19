import { MappedExceptionItem } from '../../..';
import { status as GrpcStatus } from 'grpc';

export class RpcException {
  NOT_FOUND: MappedExceptionItem = {
    message: 'Register not found',
    code: 1,
    statusCode: GrpcStatus.NOT_FOUND,
  };
}
