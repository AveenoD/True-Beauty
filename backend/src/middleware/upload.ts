import multer from "multer";
import path from "path";
import os from "os";
import { sanitizePublicId } from "../utils/cloudinary";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function createUploadMiddleware(folder: string, fieldName = "file") {
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, os.tmpdir());
    },
    filename: (_req, file, cb) => {
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      cb(null, `${timestamp}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  });

  const fileFilter = (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(new Error("Only image files (JPEG, PNG, WebP, GIF, AVIF) are allowed"));
      return;
    }
    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE },
  }).single(fieldName);
}

export function uploadProfilePhoto() {
  return createUploadMiddleware("admin_profiles", "profilePhoto");
}

export function uploadProductImage() {
  return createUploadMiddleware("products", "image");
}

export function uploadCategoryImage() {
  return createUploadMiddleware("categories", "image");
}