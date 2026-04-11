import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

export type Orientation = 'h' | 'v';

export async function getAlbumOrientations(
  albumId: string,
  imageNumbers: number[]
): Promise<Record<number, Orientation>> {
  const basePath = path.join(process.cwd(), 'public', 'images', 'photos', albumId, 'thumbnail');
  const results: Record<number, Orientation> = {};

  await Promise.all(imageNumbers.map(async (num) => {
    const filename = num.toString().padStart(3, '0') + '.webp';
    const filePath = path.join(basePath, filename);
    if (fs.existsSync(filePath)) {
      const { width, height } = await sharp(filePath).metadata();
      results[num] = (width! >= height!) ? 'h' : 'v';
    }
  }));

  return results;
}
