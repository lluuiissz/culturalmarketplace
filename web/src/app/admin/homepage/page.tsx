import { getAllSettings } from '@/lib/db';
import HomepageClient from './HomepageClient';

export const dynamic = 'force-dynamic';

export default async function AdminHomepagePage() {
  const settings = await getAllSettings();
  let announcements: Array<{ date: string; type: string; message: string }> = [];
  try { announcements = JSON.parse(settings.homepage_announcements ?? '[]'); } catch { /* ignore */ }

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand-900">Homepage & announcements</h1>
      <HomepageClient
        initial={{
          homepage_banner_title: settings.homepage_banner_title ?? '',
          homepage_banner_subtitle: settings.homepage_banner_subtitle ?? '',
          contact_email: settings.contact_email ?? '',
        }}
        announcements={announcements}
      />
    </div>
  );
}
