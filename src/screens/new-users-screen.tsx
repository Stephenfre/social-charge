import React, { useMemo } from 'react';
import { FlatList } from 'react-native';
import dayjs from 'dayjs';
import { Avatar, AvatarFallbackText, AvatarImage, Box, Flex, Text } from '~/components/ui';
import { useNewUsers, useStorageImages } from '~/hooks';
import type { UsersRow } from '~/types/user.type';

const getInitials = (firstName?: string | null, lastName?: string | null) => {
  const first = firstName?.trim()?.[0] ?? '';
  const last = lastName?.trim()?.[0] ?? '';
  const initials = `${first}${last}`.toUpperCase();
  return initials || 'NA';
};

const formatName = (user: UsersRow) => {
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
  return name || 'Unnamed user';
};

const formatSignupDate = (createdAt?: string | null) => {
  if (!createdAt) return 'Unknown date';
  return dayjs(createdAt).format('MMM D, YYYY h:mm A');
};

export function NewUsersScreen() {
  const { data: users = [], isLoading } = useNewUsers();

  const avatarPaths = useMemo(
    () => users.map((user) => user.profile_picture).filter(Boolean) as string[],
    [users]
  );

  const { data: avatarUrls } = useStorageImages({
    bucket: 'avatars',
    paths: avatarPaths,
  });

  const avatarMap = useMemo(() => {
    const map = new Map<string, string>();
    avatarPaths.forEach((path, index) => {
      const url = avatarUrls?.[index];
      if (url) map.set(path, url);
    });
    return map;
  }, [avatarPaths, avatarUrls]);

  return (
    <Flex flex className="bg-background-dark">
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListHeaderComponent={
          <Box className="pb-4">
            <Text bold size="xl">
              New Users
            </Text>
            <Text size="sm">Sorted by most recent signups</Text>
          </Box>
        }
        ListEmptyComponent={
          isLoading ? <Text size="md">Loading users...</Text> : <Text size="md">No users yet.</Text>
        }
        renderItem={({ item }) => {
          const name = formatName(item);
          const initials = getInitials(item.first_name, item.last_name);
          const avatarUrl = item.profile_picture ? avatarMap.get(item.profile_picture) : null;

          return (
            <Flex direction="row" align="center" gap={3} className="border-b border-[#1F1F1F] py-3">
              <Avatar size="md" className="bg-slate-600">
                {avatarUrl ? (
                  <AvatarImage source={{ uri: avatarUrl }} alt={`${name} profile`} />
                ) : (
                  <AvatarFallbackText>{initials}</AvatarFallbackText>
                )}
              </Avatar>
              <Flex className="flex-1" gap={1}>
                <Text bold size="md">
                  {name}
                </Text>
                <Text size="sm">{formatSignupDate(item.created_at)}</Text>
              </Flex>
            </Flex>
          );
        }}
      />
    </Flex>
  );
}
