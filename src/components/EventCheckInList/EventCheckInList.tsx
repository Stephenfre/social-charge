import { useAuth } from '~/providers/AuthProvider';
import { UserEventCheckInList } from '../UserEventCheckInList/UserEventCheckInList';
import { HostEventCheckInList } from '../HostEventCheckInList/HostEventCheckInList';

export function EventCheckInList() {
  const { user } = useAuth();

  console.log(user?.role);

  return <>{user?.role === 'user' ? <UserEventCheckInList /> : <HostEventCheckInList />}</>;
}
