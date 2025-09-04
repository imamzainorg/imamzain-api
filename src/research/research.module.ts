import { Module } from '@nestjs/common';
import { ResearchService } from './research.service';
import {
  PublicResearchController,
  PrivateResearchController,
} from './research.controller';

@Module({
  controllers: [PublicResearchController, PrivateResearchController],
  providers: [ResearchService],
  exports: [ResearchService],
})
export class ResearchModule {}
