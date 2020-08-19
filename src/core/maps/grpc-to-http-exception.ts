/**
 * Reference:
 * https://github.com/tychota/shitake/blob/master/packages/utils-grpc/mapping.ts
 */

import { status as GrpcStatus } from 'grpc';
import {
  HttpException,
  InternalServerErrorException,
  BadRequestException,
  GatewayTimeoutException,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  ServiceUnavailableException,
  HttpStatus,
} from '@nestjs/common';

export class CustomHttpException extends HttpException {
  public constructor(status: HttpStatus, message?: string | any, error = '') {
    super(
      !message
        ? { statusCode: status, error }
        : { statusCode: status, message, error },
      status,
    );
  }
}
class ClientClosedException extends CustomHttpException {
  public constructor(message?: string | any) {
    super(499, message, 'Client Closed Request');
  }
}

class TooManyRequestsException extends CustomHttpException {
  public constructor(message?: string | any) {
    super(HttpStatus.TOO_MANY_REQUESTS, message, 'Too Many Request');
  }
}

class NotImplementedException extends CustomHttpException {
  public constructor(message?: string | any) {
    super(HttpStatus.NOT_IMPLEMENTED, message, 'Not Implemented');
  }
}

export const GrpcToHttpExceptionMapping = {
  [GrpcStatus.OK]: null,
  [GrpcStatus.CANCELLED]: ClientClosedException,
  [GrpcStatus.UNKNOWN]: InternalServerErrorException,
  [GrpcStatus.INVALID_ARGUMENT]: BadRequestException,
  [GrpcStatus.DEADLINE_EXCEEDED]: GatewayTimeoutException,
  [GrpcStatus.NOT_FOUND]: NotFoundException,
  [GrpcStatus.ALREADY_EXISTS]: ConflictException,
  [GrpcStatus.PERMISSION_DENIED]: ForbiddenException,
  [GrpcStatus.RESOURCE_EXHAUSTED]: TooManyRequestsException,
  [GrpcStatus.FAILED_PRECONDITION]: BadRequestException,
  [GrpcStatus.ABORTED]: ConflictException,
  [GrpcStatus.OUT_OF_RANGE]: BadRequestException,
  [GrpcStatus.UNIMPLEMENTED]: NotImplementedException,
  [GrpcStatus.INTERNAL]: InternalServerErrorException,
  [GrpcStatus.UNAVAILABLE]: ServiceUnavailableException,
  [GrpcStatus.DATA_LOSS]: InternalServerErrorException,
  [GrpcStatus.UNAUTHENTICATED]: UnauthorizedException,
};
