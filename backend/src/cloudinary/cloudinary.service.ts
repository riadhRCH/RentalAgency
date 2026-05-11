import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    resourceType: 'image' | 'video' | 'auto' = 'auto',
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { resource_type: resourceType },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      upload.end(file.buffer);
    });
  }

  async uploadImage(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return this.uploadFile(file, 'image');
  }

  async uploadVideo(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return this.uploadFile(file, 'video');
  }

  async deleteFile(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<any> {
    return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  }

  extractPublicId(url: string): string | null {
    try {
      const parsed = new URL(url);
      if (!parsed.hostname.includes('cloudinary')) return null;
      const parts = parsed.pathname.split('/');
      const uploadIndex = parts.indexOf('upload');
      if (uploadIndex === -1) return null;
      const publicIdParts = parts.slice(uploadIndex + 2);
      const publicIdWithExt = publicIdParts.join('/');
      return publicIdWithExt.replace(/\.[^.]+$/, '');
    } catch {
      return null;
    }
  }

  async deleteFilesFromUrls(urls: string[], resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<void> {
    for (const url of urls) {
      const publicId = this.extractPublicId(url);
      if (publicId) {
        try {
          await this.deleteFile(publicId, resourceType);
        } catch {}
      }
    }
  }
}
