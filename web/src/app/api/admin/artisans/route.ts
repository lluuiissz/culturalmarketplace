import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateArtisan, deleteArtisan, logActivity } from '@/lib/db';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ status: 'error' }, { status: 401 });

  const { action, id, ...fields } = (await req.json()) as { action: string; id: number; [k: string]: unknown };

  if (action === 'update') {
    await updateArtisan(id, fields as { name?: string; email?: string; phone?: string; location?: string; craft_type?: string; business_name?: string; bio?: string });
    await logActivity({ userId: session.id, role: 'admin', userName: session.name, action: 'artisan_update', description: `Admin updated artisan #${id}` });
  } else if (action === 'delete') {
    await deleteArtisan(id);
    await logActivity({ userId: session.id, role: 'admin', userName: session.name, action: 'artisan_delete', description: `Admin deleted artisan #${id}` });
  } else {
    return NextResponse.json({ status: 'error', message: 'Unknown action.' }, { status: 400 });
  }
  return NextResponse.json({ status: 'success' });
}
