import { listActivityLogs } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminActivityPage() {
  const logs = await listActivityLogs(200);
  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand-900">Activity logs</h1>
      <div className="card mt-6 divide-y divide-stone-100">
        {logs.map((l) => (
          <div key={l.id} className="p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="badge mr-2 bg-stone-100 text-stone-600">{l.user_role}</span>
                <span className="font-semibold text-stone-700">{l.user_name}</span>
                <span className="ml-2 text-stone-500">{l.description}</span>
              </div>
              <span className="text-xs text-stone-400">{new Date(l.created_at).toLocaleString()}</span>
            </div>
          </div>
        ))}
        {logs.length === 0 && <p className="p-6 text-sm text-stone-500">No logs.</p>}
      </div>
    </div>
  );
}
