import { Module } from '@nestjs/common';
import { BooksService } from './books.service';
import {
  PublicBooksController,
  PrivateBooksController,
} from './books.controller';

@Module({
  controllers: [PublicBooksController, PrivateBooksController],
  providers: [BooksService],
  exports: [BooksService],
})
export class BooksModule {}
