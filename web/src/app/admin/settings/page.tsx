import { getAllSettings } from '@/lib/db';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const settings = await getAllSettings();
  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand-900">Platform settings</h1>
      <SettingsClient
        initial={{
          platform_name: settings.platform_name ?? '',
          commission_rate: settings.commission_rate ?? '5',
          contact_email: settings.contact_email ?? '',
          shipping_fee: settings.shipping_fee ?? '',
          terms_conditions: settings.terms_conditions ?? '',
          privacy_policy: settings.privacy_policy ?? '',
        }}
      />
    </div>
  );
}
