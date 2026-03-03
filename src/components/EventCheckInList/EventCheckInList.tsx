import React from 'react';
import { View } from 'react-native';
import { useAuth } from '~/providers/AuthProvider';
import { UserEventCheckInList } from '../UserEventCheckInList/UserEventCheckInList';
import { HostEventCheckInList } from '../HostEventCheckInList/HostEventCheckInList';

export const EventCheckInList = React.forwardRef<React.ComponentRef<typeof View>>(function EventCheckInList(
  _props,
  ref
) {
  const { user } = useAuth();

  return (
    <View ref={ref} style={{ flex: 1 }}>
      {user?.role === 'user' ? <UserEventCheckInList /> : <HostEventCheckInList />}
    </View>
  );
});

EventCheckInList.displayName = 'EventCheckInList';
