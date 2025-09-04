import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import {
  PublicCategoriesController,
  PrivateCategoriesController,
} from './categories.controller';

@Module({
  controllers: [PublicCategoriesController, PrivateCategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
