// utils/storage.ts
export function extractSupabasePathFromUrl(url: string | undefined | null) {
  if (!url) return null;
  const signed = /\/object\/sign\/([^/]+)\/(.+?)(?:\?|$)/.exec(url);
  if (signed) return { bucket: signed[1], path: signed[2] };
  const pub = /\/object\/public\/([^/]+)\/(.+)$/.exec(url);
  if (pub) return { bucket: pub[1], path: pub[2] };
  return null;
}

export function isCoverUnchanged(
  currentUri: string | undefined | null,
  originalPath?: string,
  originalUrl?: string
) {
  if (!currentUri) return !originalPath && !originalUrl;

  // 1) If current is a Supabase URL, compare its path with the original path
  const parsed = extractSupabasePathFromUrl(currentUri);
  if (parsed?.path && originalPath) {
    return parsed.path === originalPath;
  }

  // 2) Fallback: exact string equality with the original URL (e.g., same signed URL)
  if (originalUrl && currentUri === originalUrl) return true;

  // Otherwise assume changed (e.g., file://… or a different remote URL)
  return false;
}
