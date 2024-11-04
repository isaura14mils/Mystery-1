import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    cb(null, `${uniqueId}${path.extname(file.originalname)}`);
  }
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export class ImageService {
  async uploadImage(file: Express.Multer.File): Promise<string> {
    const optimizedFilename = `optimized-${file.filename}`;
    const outputPath = path.join(__dirname, '../../uploads', optimizedFilename);

    await sharp(file.path)
      .resize(800, 600, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
      .toFile(outputPath);

    return `/uploads/${optimizedFilename}`;
  }

  async generateRevealedImage(
    originalPath: string,
    revealPercentage: number
  ): Promise<Buffer> {
    const image = sharp(path.join(__dirname, '../..', originalPath));
    const metadata = await image.metadata();

    const revealWidth = Math.floor((metadata.width || 800) * (revealPercentage / 100));

    return image
      .extract({
        left: 0,
        top: 0,
        width: revealWidth,
        height: metadata.height || 600
      })
      .toBuffer();
  }
}