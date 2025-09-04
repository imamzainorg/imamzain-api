import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';
import { ApiResponse } from '../interfaces/api-response.interface';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Log the error to console for debugging
    console.error('=== ERROR CAUGHT BY GLOBAL FILTER ===');
    console.error('Exception type:', exception?.constructor?.name);
    console.error('Exception:', exception);
    if (exception instanceof Error) {
      console.error('Stack trace:', exception.stack);
    }
    console.error('=====================================');

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (
        exception instanceof BadRequestException &&
        typeof exceptionResponse === 'object'
      ) {
        const validationErrors = (exceptionResponse as any).message;
        if (Array.isArray(validationErrors)) {
          message = validationErrors.join(', ');
        } else {
          message = validationErrors || exception.message;
        }
      } else {
        message = exception.message;
      }
    } else if (exception instanceof PrismaClientKnownRequestError) {
      status = HttpStatus.BAD_REQUEST;
      message = this.handlePrismaError(exception);
    } else if (exception instanceof PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid data provided to database';
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorResponse: ApiResponse = {
      status: 'error',
      message,
    };

    response.status(status).json(errorResponse);
  }

  private handlePrismaError(error: PrismaClientKnownRequestError): string {
    switch (error.code) {
      case 'P2002':
        const field = error.meta?.target as string[];
        return `${field?.join(', ') || 'Field'} already exists`;
      case 'P2025':
        return 'Record not found';
      case 'P2003':
        return 'Foreign key constraint failed';
      case 'P2004':
        return 'Database constraint failed';
      case 'P2014':
        return 'Invalid ID provided';
      case 'P2021':
        return 'Table does not exist';
      case 'P2022':
        return 'Column does not exist';
      default:
        return `Database error: ${error.message}`;
    }
  }
}
