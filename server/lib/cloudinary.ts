import { v2 as cloudinary } from 'cloudinary';

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn('Cloudinary credentials not configured. File uploads will not work.');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
  resource_type: string;
  created_at: string;
}

export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    public_id?: string;
    resource_type?: 'image' | 'video' | 'raw' | 'auto';
    transformation?: any;
  } = {}
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || 'bauhaus-cms',
      public_id: options.public_id,
      resource_type: options.resource_type || 'auto',
      transformation: options.transformation,
    };

    cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        reject(error);
      } else if (result) {
        resolve(result as CloudinaryUploadResult);
      } else {
        reject(new Error('Upload failed'));
      }
    }).end(buffer);
  });
}

export async function uploadImageWithThumbnail(
  buffer: Buffer,
  options: {
    folder?: string;
    public_id?: string;
  } = {}
): Promise<{ original: CloudinaryUploadResult; thumbnail: string }> {
  const result = await uploadToCloudinary(buffer, {
    folder: options.folder || 'bauhaus-cms/images',
    public_id: options.public_id,
    resource_type: 'image',
  });

  const thumbnailUrl = cloudinary.url(result.public_id, {
    transformation: [
      { width: 300, height: 300, crop: 'fill' },
      { quality: 'auto' },
      { format: 'auto' },
    ],
  });

  return {
    original: result,
    thumbnail: thumbnailUrl,
  };
}

export async function deleteFromCloudinary(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

export function getOptimizedUrl(publicId: string, options: { width?: number; height?: number; quality?: string; format?: string } = {}): string {
  return cloudinary.url(publicId, {
    transformation: [
      { width: options.width, height: options.height, crop: options.width || options.height ? 'fill' : undefined },
      { quality: options.quality || 'auto' },
      { format: options.format || 'auto' },
    ],
  });
}

export default cloudinary;
