import { Controller, Get, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { MediaService } from './media.service';
import { Roles } from '../../common/decorators/roles.decorator';

// Minimal shape of a Multer memory-storage file (avoids an @types/multer dep).
interface UploadedImage {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname?: string;
}

@ApiTags('admin/media')
@Controller('admin/media')
@Roles(Role.OWNER, Role.MANAGER)
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Get('cloudinary-sign')
  sign(@Query('folder') folder?: string) {
    return this.media.signUpload(folder);
  }

  // Direct upload — works whether or not Cloudinary is configured.
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: UploadedImage) {
    return this.media.upload(file);
  }
}
