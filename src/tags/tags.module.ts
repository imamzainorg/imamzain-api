import { Module } from '@nestjs/common';
import { TagsService } from './tags.service';
import { PublicTagsController, PrivateTagsController } from './tags.controller';

@Module({
  controllers: [PublicTagsController, PrivateTagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
