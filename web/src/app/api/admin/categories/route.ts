import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { addCategory, deleteCategoryDb, logActivity } from '@/lib/db';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ status: 'error' }, { status: 401 });

  const { action, id, name, type } = (await req.json()) as { action: string; id?: number; name?: string; type?: 'product' | 'experience' };

  if (action === 'add') {
    if (!name?.trim()) return NextResponse.json({ status: 'error', message: 'Category name is required.' }, { status: 400 });
    const added = await addCategory(name.trim(), type === 'experience' ? 'experience' : 'product');
    if (!added.ok) {
      return NextResponse.json({ status: 'error', message: `"${name.trim()}" already exists (names are case-insensitive).` }, { status: 409 });
    }
    await logActivity({ userId: session.id, role: 'admin', userName: session.name, action: 'category_add', description: `Admin added category "${name}"` });
  } else if (action === 'delete' && id) {
    const result = await deleteCategoryDb(id);
    if (!result.ok) {
      return NextResponse.json(
        { status: 'error', message: `Cannot delete — ${result.products} product${result.products === 1 ? '' : 's'} still use this category. Move them to another category first.` },
        { status: 409 },
      );
    }
    await logActivity({ userId: session.id, role: 'admin', userName: session.name, action: 'category_delete', description: `Admin deleted category #${id}` });
  } else {
    return NextResponse.json({ status: 'error', message: 'Unknown action.' }, { status: 400 });
  }
  return NextResponse.json({ status: 'success' });
}
