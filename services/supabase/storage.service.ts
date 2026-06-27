import { supabase, ensureSupabaseUserId } from './client';

const BUCKET = 'project-images';

// Cache source-URI -> uploaded public URL so repeated saves of the same image
// (e.g. while editing) don't re-upload it.
const _cache = new Map<string, string>();

async function uriToBlob(uri: string): Promise<Blob> {
  const res = await fetch(uri);
  return await res.blob();
}

function extFor(blob: Blob): string {
  if (blob.type.includes('png')) return 'png';
  if (blob.type.includes('webp')) return 'webp';
  return 'jpg';
}

export const supabaseStorage = {
  /**
   * Upload a local image (blob:/data: URI) to the user's folder in Storage and
   * return its public URL. Already-remote URLs pass through. Returns null on any
   * failure (no session / bucket missing) so callers fall back to the local URI.
   */
  async uploadImageCached(uri: string | null, keyHint: string): Promise<string | null> {
    if (!uri) return null;
    if (/^https?:\/\//.test(uri)) return uri;     // already a cloud URL
    const cached = _cache.get(uri);
    if (cached) return cached;

    const ownerId = await ensureSupabaseUserId();
    if (!ownerId) return null;

    try {
      const blob = await uriToBlob(uri);
      const path = `${ownerId}/${keyHint}-${Date.now()}.${extFor(blob)}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
        contentType: blob.type || 'image/jpeg',
        upsert: true,
      });
      if (error) return null;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const url = data.publicUrl;
      _cache.set(uri, url);
      return url;
    } catch {
      return null;
    }
  },
};
