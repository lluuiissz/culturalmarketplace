import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateArtisanProfile } from '@/lib/db';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'artisan') return NextResponse.json({ status: 'error' }, { status: 401 });

  const body = (await req.json()) as {
    name?: string; phone?: string; location?: string; bio?: string; business_name?: string; craft_type?: string;
  };
  await updateArtisanProfile(session.id, body);
  return NextResponse.json({ status: 'success' });
}
