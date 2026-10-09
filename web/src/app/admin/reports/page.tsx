import { listReports } from '@/lib/db';
import ReportsClient from './ReportsClient';

export const dynamic = 'force-dynamic';

export default async function AdminReportsPage() {
  const reports = await listReports();

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand-900">Reports & moderation</h1>
      <ReportsClient
        initial={reports.map((r) => ({
          id: r.id, reporter: r.reporter_name ?? 'Unknown', type: r.reported_type,
          reported_id: r.reported_id, reported_name: r.reported_name ?? `#${r.reported_id}`,
          reason: r.reason, status: r.status, action_taken: r.action_taken,
          created: new Date(r.created_at).toLocaleString(),
        }))}
      />
    </div>
  );
}
