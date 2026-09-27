import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { saveSettings, getAllSettings, logActivity } from '@/lib/db';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ status: 'error' }, { status: 401 });

  const body = (await req.json()) as {
    settings?: Record<string, string>;
    announcement?: { type: string; message: string };
  };

  if (body.settings) {
    await saveSettings(body.settings);
    await logActivity({ userId: session.id, role: 'admin', userName: session.name, action: 'settings_update', description: `Admin updated ${Object.keys(body.settings).length} setting(s)` });
  }

  if (body.announcement) {
    const current = await getAllSettings();
    let list: Array<{ date: string; type: string; message: string }> = [];
    try { list = JSON.parse(current.homepage_announcements ?? '[]'); } catch { /* ignore */ }
    list.unshift({ date: new Date().toISOString(), type: body.announcement.type, message: body.announcement.message });
    await saveSettings({ homepage_announcements: JSON.stringify(list.slice(0, 20)) });
    await logActivity({ userId: session.id, role: 'admin', userName: session.name, action: 'announcement_send', description: `Admin posted announcement: ${body.announcement.message.slice(0, 60)}` });
  }

  return NextResponse.json({ status: 'success' });
}
