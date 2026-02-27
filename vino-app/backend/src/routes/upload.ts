import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

export const uploadRouter = Router();

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
}

async function uploadToCloudinary(base64Image: string): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || cloudName === 'stub') {
    return 'https://placehold.co/400x600/722F37/white?text=Wine+Label';
  }

  const formData = new URLSearchParams();
  formData.append('file', base64Image);
  formData.append('upload_preset', 'unsigned_preset');

  const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    logger.error('Cloudinary upload failed', { err });
    throw new Error('Image upload failed');
  }

  const data = (await res.json()) as CloudinaryUploadResponse;
  return data.secure_url;
}

// POST /api/upload
uploadRouter.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { imageBase64 } = req.body;
  if (!imageBase64) {
    res.status(400).json({ error: 'imageBase64 is required' });
    return;
  }

  try {
    const url = await uploadToCloudinary(imageBase64);
    res.json({ url });
  } catch (err) {
    logger.error('Upload error', { err });
    res.status(500).json({ error: 'Failed to upload image' });
  }
});
