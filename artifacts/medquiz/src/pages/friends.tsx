import { FriendsView } from '@/components/friends-view';
import { useStore } from '@/lib/store';

export function FriendsPage() {
  const { me } = useStore();
  if (!me) return null;

  return (
    <div className="mx-auto max-w-4xl w-full">
      <FriendsView me={me} />
    </div>
  );
}
