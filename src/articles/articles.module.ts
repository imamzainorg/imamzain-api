import { Module } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import {
  PublicArticlesController,
  PrivateArticlesController,
} from './articles.controller';

@Module({
  controllers: [PublicArticlesController, PrivateArticlesController],
  providers: [ArticlesService],
  exports: [ArticlesService],
})
export class ArticlesModule {}
