import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { AttachmentsService } from './attachments.service';
import { AttachmentsController } from './attachments.controller';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
      },
    }),
  ],
  controllers: [AttachmentsController],
  providers: [AttachmentsService],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}
