import { v2 as cloudinary } from "cloudinary";
import { copyFile, mkdir, unlink } from "fs/promises";
import path from "path";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export function sanitizePublicId(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase()
    .substring(0, 100);
}

/** When Cloudinary env is missing, store under ./uploads and serve via GET /uploads/... */
async function uploadToLocalDisk(
  filePath: string,
  folder: string,
  publicId: string
): Promise<string> {
  const ext = path.extname(filePath) || ".bin";
  const safeBase = sanitizePublicId(publicId) || `file_${Date.now()}`;
  const destDir = path.join(process.cwd(), "uploads", folder);
  await mkdir(destDir, { recursive: true });
  const destPath = path.join(destDir, `${safeBase}${ext}`);
  await copyFile(filePath, destPath);
  try {
    await unlink(filePath);
  } catch {}

  const port = String(process.env.PORT || 3000);
  const base =
    (process.env.API_BASE_URL || "").replace(/\/$/, "") ||
    `http://localhost:${port}`;
  return `${base}/uploads/${folder}/${path.basename(destPath)}`;
}

export async function uploadToCloudinary(
  filePath: string,
  folder: string,
  publicId?: string
): Promise<string> {
  if (!isCloudinaryConfigured()) {
    return uploadToLocalDisk(filePath, folder, publicId ?? `upload_${Date.now()}`);
  }

  const options: Record<string, unknown> = {
    folder,
    resource_type: "image",
    quality: "auto",
    fetch_format: "auto",
  };
  if (publicId) {
    options.public_id = publicId;
  }

  const result = await cloudinary.uploader.upload(
    filePath,
    options as unknown as Parameters<typeof cloudinary.uploader.upload>[1]
  );

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