import imageCompression from 'browser-image-compression';
import { createClient } from './supabase/client';
import { STORAGE_BUCKET } from './constants';
import { isMockMode } from './mock/flag';

const MAX_INPUT_BYTES = 5 * 1024 * 1024; // 5MB

export class ImageError extends Error {}

export async function compressToWebp(file: File): Promise<Blob> {
  if (file.size > MAX_INPUT_BYTES) {
    throw new ImageError('이미지는 5MB 이하만 가능합니다.');
  }
  if (!file.type.startsWith('image/')) {
    throw new ImageError('이미지 파일만 업로드할 수 있습니다.');
  }
  return imageCompression(file, {
    maxSizeMB: 0.6,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: 'image/webp',
  });
}

export async function uploadImage(techniqueId: string, file: File): Promise<string> {
  const blob = await compressToWebp(file);
  const path = `${techniqueId}.webp`;
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, blob, { upsert: true, contentType: 'image/webp' });
  if (error) throw new ImageError(error.message);
  return path;
}

export function publicImageUrl(path: string): string {
  if (isMockMode()) return path;
  const supabase = createClient();
  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function deleteImage(path: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);
  if (error) throw new ImageError(error.message);
}
