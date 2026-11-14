import { SettingsView } from '@/components/settings-view';
import { useLocation } from 'wouter';

export function SettingsPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="py-2 sm:py-6">
      <SettingsView onBack={() => setLocation('/profile')} />
    </div>
  );
}
