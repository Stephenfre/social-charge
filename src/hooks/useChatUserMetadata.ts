import { useEffect, useMemo, useState } from 'react';
import { supabase } from '~/lib/supabase';

type ChatUserMetadata = {
  avatarPathByUserId: Map<string, string | null>;
  roleByUserId: Map<string, string | null>;
};

export function useChatUserMetadata(userIds: string[]): ChatUserMetadata {
  const [avatarPathByUserId, setAvatarPathByUserId] = useState<Map<string, string | null>>(
    () => new Map()
  );
  const [roleByUserId, setRoleByUserId] = useState<Map<string, string | null>>(() => new Map());

  const missingUserIds = useMemo(() => {
    const ids = new Set<string>();
    userIds.forEach((userId) => {
      if (!avatarPathByUserId.has(userId) || !roleByUserId.has(userId)) {
        ids.add(userId);
      }
    });
    return Array.from(ids);
  }, [userIds, avatarPathByUserId, roleByUserId]);

  useEffect(() => {
    if (missingUserIds.length === 0) return;
    let isActive = true;

    const loadMetadata = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, profile_picture, role')
        .in('id', missingUserIds);
      if (error || !isActive) return;

      setAvatarPathByUserId((prev) => {
        const next = new Map(prev);
        data?.forEach((row) => {
          next.set(row.id, row.profile_picture ?? null);
        });
        missingUserIds.forEach((id) => {
          if (!next.has(id)) next.set(id, null);
        });
        return next;
      });

      setRoleByUserId((prev) => {
        const next = new Map(prev);
        data?.forEach((row) => {
          next.set(row.id, row.role ?? null);
        });
        missingUserIds.forEach((id) => {
          if (!next.has(id)) next.set(id, null);
        });
        return next;
      });
    };

    loadMetadata();

    return () => {
      isActive = false;
    };
  }, [missingUserIds]);

  return { avatarPathByUserId, roleByUserId };
}
