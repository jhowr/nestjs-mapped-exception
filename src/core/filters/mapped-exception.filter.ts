import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { throwError } from 'rxjs';
import { QueryFailedError } from 'typeorm';
import { isArray } from 'util';
import { MappedExceptionError } from '../mapped-exception-error.class';
import console from 'console';
import { GrpcToHttpExceptionMapping } from '../maps/grpc-to-http-exception';
import { RpcException } from '@nestjs/microservices';

enum ErrorLayerEnum {
  DATABASE,
  VALIDATION,
  APPLICATION,
  EXCEPTION,
}

@Catch()
export class MappedExceptionFilter implements ExceptionFilter {
  private defaultApplicationErrorPrefix =
    process.env.EXCEPTION_ERROR_PREFIX || 'APPLICATION_ERR';

  private defaultDatabaseErrorPrefix =
    process.env.EXCEPTION_DATABASE_ERROR_PREFIX || 'DATABASE_ERR';

  private defaultValidationErrorPrefix =
    process.env.EXCEPTION_VALIDATION_ERROR_PREFIX || 'VALIDATION_ERR';

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const {
      status = HttpStatus.INTERNAL_SERVER_ERROR,
      message,
      code,
    } = this.getStatusAndMessage(exception);

    const contextType: any = host.getType();

    if (contextType === 'http') {
      return this.handleRestContext(request, response, status, message, code);
    }

    if (contextType === 'rpc') {
      return this.handleRpcContext(status, code, message);
    }

    if (contextType === 'graphql') {
      return this.graphqlFormatError(status, message, code);
    }
  }

  private getStatusAndMessage(
    exception,
  ): { status: number; message: string; code: string } {
    const errorLayer = this.identifyErrorLayer(exception);

    if (errorLayer === ErrorLayerEnum.DATABASE) {
      return {
        code: this.defaultDatabaseErrorPrefix,
        message: exception.message,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }

    if (errorLayer === ErrorLayerEnum.VALIDATION) {
      let message: string;

      if (exception?.response?.message) {
        if (isArray(exception?.response?.message)) {
          message = exception?.response?.message[0];
        } else {
          message = exception?.response?.message;
        }
      } else {
        message = exception?.message || '';
      }

      return {
        code: this.defaultValidationErrorPrefix,
        message: message,
        status: HttpStatus.BAD_REQUEST,
      };
    }

    if (errorLayer === ErrorLayerEnum.EXCEPTION) {
      const { code, message, statusCode } = exception.exception;

      return {
        code: code.toString(),
        message,
        status: statusCode,
      };
    }

    if (errorLayer === ErrorLayerEnum.APPLICATION) {
      if (exception instanceof HttpException) {
        return {
          code: this.defaultApplicationErrorPrefix,
          message: exception.message,
          status: exception.getStatus(),
        };
      } else if (exception instanceof RpcException) {
        const error: any = exception.getError();
        return {
          code: this.defaultApplicationErrorPrefix,
          message: error.message,
          status: error.code,
        };
      } else if (exception.code && exception.details) {
        const error = new GrpcToHttpExceptionMapping[exception.code](
          exception.details,
        );
        return {
          code: this.defaultApplicationErrorPrefix,
          message: error.message,
          status: error.status,
        };
      }

      return {
        code: this.defaultApplicationErrorPrefix,
        message: exception.message,
        status: exception.status || HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  private handleRestContext(
    request: any,
    response: any,
    status: number,
    message: string,
    code: string,
  ) {
    return response.code(status).send({
      message,
      code,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private handleRpcContext(
    grpcCode: number,
    code: string,
    message: string = '',
  ): any {
    const rpcException = new RpcException({
      message: ` [${code}] ${message}`,
      code: grpcCode,
    });

    return throwError(rpcException.getError());
  }

  private graphqlFormatError(status: number, message: string, code: string) {
    return new HttpException(
      {
        message,
        code,
        statusCode: status,
      },
      status,
    );
  }

  private identifyErrorLayer(exception): ErrorLayerEnum {
    if (
      exception instanceof QueryFailedError ||
      exception.constructor.name === 'QueryFailedError'
    ) {
      return ErrorLayerEnum.DATABASE;
    }

    if (
      exception instanceof BadRequestException ||
      exception.constructor.name === 'BadRequestException'
    ) {
      return ErrorLayerEnum.VALIDATION;
    }

    if (
      exception instanceof MappedExceptionError ||
      exception.constructor.name === 'MappedExceptionError'
    ) {
      return ErrorLayerEnum.EXCEPTION;
    }

    return ErrorLayerEnum.APPLICATION;
  }
}
