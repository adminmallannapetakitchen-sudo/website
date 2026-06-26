import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import { join, resolve } from 'path';

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
const MAX_BYTES = 5 * 1024 * 1024;

@Injectable()
export class MediaService {
  private readonly logger = new Logger('MediaService');
  private ready = false;

  constructor(private readonly config: ConfigService) {
    const name = this.config.get<string>('cloudinary.cloudName');
    const key = this.config.get<string>('cloudinary.apiKey');
    const secret = this.config.get<string>('cloudinary.apiSecret');
    if (name && key && secret) {
      cloudinary.config({ cloud_name: name, api_key: key, api_secret: secret, secure: true });
      this.ready = true;
    }
  }

  isReady() {
    return this.ready;
  }

  /**
   * Direct image upload. Cloudinary when configured (production path),
   * otherwise writes into the web app's /public/uploads so it works locally
   * with zero setup (served same-origin by Next — no next/image remote-domain
   * config needed).
   */
  async upload(file: { buffer: Buffer; mimetype: string; size: number; originalname?: string }) {
    if (!file?.buffer) throw new BadRequestException('No file uploaded');
    const ext = ALLOWED_MIME[file.mimetype];
    if (!ext) throw new BadRequestException('Only JPG, PNG, WebP or GIF images are allowed');
    if (file.size > MAX_BYTES) throw new BadRequestException('Image must be 5MB or smaller');

    if (this.ready) {
      const url: string = await new Promise((res, rej) => {
        cloudinary.uploader
          .upload_stream({ folder: 'menu', resource_type: 'image' }, (err, result) => {
            if (err || !result) return rej(err ?? new Error('Cloudinary upload failed'));
            res(result.secure_url);
          })
          .end(file.buffer);
      });
      return { url };
    }

    // Production must use Cloudinary. The local-disk fallback writes to the
    // API container's ephemeral filesystem and returns a /uploads/<file> URL
    // that the (separate) web host can't serve — so the image 404s. Fail loudly
    // here instead of silently producing a broken image.
    if (process.env.NODE_ENV === 'production') {
      this.logger.error('Image upload attempted but Cloudinary is not configured (CLOUDINARY_* env vars).');
      throw new BadRequestException(
        'Image storage is not configured. Please set the Cloudinary keys before uploading images.',
      );
    }

    const dir = this.localUploadDir();
    mkdirSync(dir, { recursive: true });
    const filename = `${Date.now()}-${randomUUID()}.${ext}`;
    await writeFile(join(dir, filename), file.buffer);
    this.logger.log(`[LOCAL MEDIA] saved ${filename} → ${dir}`);
    return { url: `/uploads/${filename}` };
  }

  /** Best-effort resolve of apps/web/public/uploads regardless of CWD. */
  private localUploadDir(): string {
    const candidates = [
      resolve(process.cwd(), '..', 'web', 'public', 'uploads'), // cwd = apps/api
      resolve(process.cwd(), 'apps', 'web', 'public', 'uploads'), // cwd = repo root
      resolve(__dirname, '..', '..', '..', '..', 'web', 'public', 'uploads'), // dist/modules/media
    ];
    for (const c of candidates) {
      if (existsSync(resolve(c, '..'))) return c; // .../web/public exists
    }
    return candidates[0];
  }

  signUpload(folder = 'menu') {
    if (!this.ready) {
      return { skipped: true, message: 'Cloudinary not configured — upload to /public locally' };
    }
    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      this.config.get<string>('cloudinary.apiSecret')!,
    );
    return {
      timestamp,
      signature,
      folder,
      apiKey: this.config.get<string>('cloudinary.apiKey'),
      cloudName: this.config.get<string>('cloudinary.cloudName'),
    };
  }
}
