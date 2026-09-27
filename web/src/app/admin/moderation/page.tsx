import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { sql, usingPg } from '@/lib/dbPg';
import ModerationClient from './ModerationClient';

export const dynamic = 'force-dynamic';

export default async function ModerationPage() {
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect('/auth/login?next=/admin/moderation');

  let items: Array<{ id: number; name: string; image_path: string | null; artisan: string; flagged_reason: string }> = [];
  if (usingPg) {
    const rows = await sql`
      select p.id, p.name, p.image_path, a.name as artisan
      from products p join artisans a on a.id = p.artisan_id
      where p.status = 'pending_review'
      order by p.created_at desc`;
    items = (rows as unknown as Array<{ id: number; name: string; image_path: string | null; artisan: string }>).map((r) => ({
      ...r,
      flagged_reason: 'Uploaded image was flagged for manual review (borderline classification or automatic check unavailable).',
    }));
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand-900">Moderation queue</h1>
      <p className="mt-1 text-sm text-stone-500">
        Products whose images were flagged by the automatic pipeline. Approve to make them live; reject to notify the artisan.
      </p>
      <ModerationClient initial={items} />
    </div>
  );
}
