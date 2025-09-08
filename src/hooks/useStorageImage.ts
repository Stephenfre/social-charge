// hooks/useStorageImages.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '~/lib/supabase';

export function useStorageImages({
  bucket,
  paths,
  expiresIn = 60 * 60,
}: {
  bucket: string;
  paths: Array<string | null | undefined>;
  expiresIn?: number;
}) {
  const clean = (paths ?? []).filter(Boolean) as string[];

  return useQuery({
    queryKey: ['storage', bucket, clean],
    enabled: clean.length > 0,
    queryFn: async (): Promise<(string | null)[]> => {
      const results = await Promise.all(
        clean.map(async (p) => {
          const { data, error } = await supabase.storage.from(bucket).createSignedUrl(p, expiresIn);
          if (error || !data?.signedUrl) return null;
          return data.signedUrl;
        })
      );
      return results;
    },
  });
}
