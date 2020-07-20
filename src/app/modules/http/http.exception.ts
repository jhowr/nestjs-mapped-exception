import { HttpStatus } from '@nestjs/common';
import { MappedExceptionItem } from '../../..';

export class HttpException {
  NOT_FOUND: MappedExceptionItem = {
    message: 'Register not found',
    code: 1,
    statusCode: HttpStatus.NOT_FOUND,
  };
}
