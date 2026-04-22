import { v2 as cloudinary } from "cloudinary";
import { unlink } from "fs/promises";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export function sanitizePublicId(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase()
    .substring(0, 100);
}

export async function uploadToCloudinary(
  filePath: string,
  folder: string,
  publicId?: string
): Promise<string> {
  const options: any = {
    folder,
    resource_type: "image",
    quality: "auto",
    fetch_format: "auto",
  };
  if (publicId) {
    options.public_id = publicId;
  }

  const result = await cloudinary.uploader.upload(filePath, options);

  // Clean up local temp file
  try {
    await unlink(filePath);
  } catch {}

  return result.secure_url;
}

export async function deleteFromCloudinary(publicUrl: string): Promise<void> {
  // Extract public_id from secure_url
  const regex = /\/upload\/(?:v\d+\/)?(.+)$/;
  const match = publicUrl.match(regex);
  if (!match?.[1]) return;

  const publicId = match[1];
  await cloudinary.uploader.destroy(publicId);
}

export default cloudinary;