import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAdminAnalytics } from '@/lib/analytics';
import BarList from '@/components/BarList';

export const dynamic = 'force-dynamic';

const peso = (v: number) => `₱${v.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h2 className="font-serif text-lg font-bold text-brand-900">{title}</h2>
      {hint && <p className="mt-0.5 text-xs text-stone-400">{hint}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default async function AdminAnalyticsPage() {
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect('/auth/login?next=/admin/analytics');
  const a = await getAdminAnalytics();

  // Fill missing weeks so trends read continuously even with sparse data.
  function fillWeeks(rows: Array<{ week: string }>): string[] {
    const out: string[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i * 7);
      out.push(d.toISOString().slice(0, 10));
    }
    return Array.from(new Set([...rows.map((r) => r.week), ...out])).sort();
  }
  const weeks = fillWeeks(a.signupTrend);
  const signupByWeek = new Map(a.signupTrend.map((r) => [r.week, r]));
  const revenueByWeek = new Map(a.revenueTrend.map((r) => [r.week, r.revenue]));

  const kpis = [
    { label: 'Customers', value: a.totalCustomers.toLocaleString() },
    { label: 'Artisans', value: a.totalArtisans.toLocaleString() },
    { label: 'Orders', value: a.totalOrders.toLocaleString() },
    { label: 'Revenue', value: peso(a.totalRevenue) },
    { label: 'Avg order value', value: peso(a.avgOrderValue) },
    { label: 'Artisan : customer', value: a.totalCustomers > 0 ? `1 : ${(a.totalCustomers / Math.max(a.totalArtisans, 1)).toFixed(1)}` : '—' },
  ];

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand-900">Analytics &amp; demographics</h1>
      <p className="mt-1 text-sm text-stone-500">Who uses the marketplace, what sells, and where the gaps are.</p>

      {/* KPI cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.label} className="card p-5">
            <p className="text-sm text-stone-500">{k.label}</p>
            <p className="mt-1 text-3xl font-bold text-brand-700">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Trends */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Section title="Signups — last 12 weeks" hint="New customers vs new artisans per week">
          <div className="space-y-1">
            {weeks.map((w) => {
              const r = signupByWeek.get(w);
              const c = r?.customers ?? 0;
              const ar = r?.artisans ?? 0;
              const max = Math.max(...weeks.map((x) => Math.max(signupByWeek.get(x)?.customers ?? 0, signupByWeek.get(x)?.artisans ?? 0)), 1);
              return (
                <div key={w} className="flex items-center gap-2 text-xs">
                  <span className="w-16 shrink-0 text-stone-400">{w.slice(5)}</span>
                  <div className="flex h-4 flex-1 gap-px">
                    <div className="h-full rounded-l bg-brand-500" style={{ width: `${(c / max) * 100}%` }} title={`${c} customers`} />
                    <div className="h-full rounded-r bg-leaf-500" style={{ width: `${(ar / max) * 100}%` }} title={`${ar} artisans`} />
                  </div>
                  <span className="w-12 shrink-0 text-right text-stone-500">{c + ar > 0 ? `${c}/${ar}` : ''}</span>
                </div>
              );
            })}
            <p className="pt-1 text-xs text-stone-400"><span className="font-semibold text-brand-600">■</span> customers · <span className="font-semibold text-leaf-600">■</span> artisans</p>
          </div>
        </Section>

        <Section title="Revenue — last 12 weeks" hint="Gross revenue from non-cancelled orders">
          <BarList
            items={weeks.map((w) => ({ label: w.slice(5), value: revenueByWeek.get(w) ?? 0 }))}
            formatValue={peso}
            emptyText="No revenue recorded yet."
          />
        </Section>
      </div>

      {/* Demographics */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Section title="Where artisans are" hint="Top locations — plan outreach and pickup routes">
          <BarList items={a.artisanLocations.map((r) => ({ label: r.location, value: r.count }))} formatValue={(v) => `${v}`} />
        </Section>
        <Section title="Where customers are" hint="Customer-declared locations — where demand sits">
          <BarList items={a.customerLocations.map((r) => ({ label: r.location, value: r.count }))} formatValue={(v) => `${v}`} />
        </Section>
      </div>

      {/* Supply vs demand */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Section title="Category mix — listings" hint="What artisans offer">
          <BarList items={a.categoryListings.map((r) => ({ label: r.category, value: r.count }))} formatValue={(v) => `${v}`} />
        </Section>
        <Section title="Category mix — actual sales" hint="Revenue and units sold by category">
          <BarList
            items={a.categoryRevenue.map((r) => ({ label: r.category, value: r.revenue, sub: `· ${r.units} sold` }))}
            formatValue={peso}
          />
        </Section>
      </div>

      {/* Operations */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Section title="Payment methods" hint="How customers pay">
          <BarList
            items={a.paymentSplit.map((r) => ({ label: r.method.replace(/_/g, ' '), value: r.count }))}
            formatValue={(v) => `${v}`}
          />
        </Section>
        <Section title="Order statuses" hint="Lifecycle funnel — spot stuck stages">
          <BarList
            items={a.orderStatusCounts.map((r) => ({ label: r.status.replace(/_/g, ' '), value: r.count }))}
            formatValue={(v) => `${v}`}
          />
        </Section>
        <Section title="Ratings" hint="Review stars across all order items">
          {a.ratingDistribution.length === 0 ? (
            <p className="text-sm text-stone-400">No reviews yet.</p>
          ) : (
            <BarList
              items={[5, 4, 3, 2, 1].map((s) => ({
                label: '★'.repeat(s) + '☆'.repeat(5 - s),
                value: a.ratingDistribution.find((r) => r.stars === s)?.count ?? 0,
              }))}
              formatValue={(v) => `${v}`}
            />
          )}
        </Section>
      </div>

      {/* Top products */}
      <div className="mt-6">
        <Section title="Top products — last 90 days" hint="Your best sellers by revenue">
          {a.topProducts.length === 0 ? (
            <p className="text-sm text-stone-400">No sales in the last 90 days.</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {a.topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{i + 1}</span>
                    <span className="truncate text-stone-700">{p.name}</span>
                  </span>
                  <span className="shrink-0 text-stone-500">{p.units} sold · <b className="text-brand-700">{peso(p.revenue)}</b></span>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
