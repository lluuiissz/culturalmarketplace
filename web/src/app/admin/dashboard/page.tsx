import { Suspense, cache } from 'react';
import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import { adminStats, listActivityLogs } from '@/lib/db';
import {
  getDailySeries, getTopProducts30d, getOrdersSnapshot, getAttentionCounts,
  getCategoryRevenue30d, getPaymentSplit30d,
} from '@/lib/dashboardOverview';
import MiniChart from '@/components/MiniChart';
import AxisChart from '@/components/charts/AxisChart';
import DonutChart from '@/components/charts/DonutChart';
import { ArrowRight, LayoutDashboard } from 'lucide-react';

export const dynamic = 'force-dynamic';

const peso = (v: number) => `₱${v.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;
const dayLabel = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

const getStats = unstable_cache(async () => adminStats(), ['dash-admin-stats'], { revalidate: 30 });
const getLogs = unstable_cache(async () => listActivityLogs(8), ['dash-activity'], { revalidate: 15 });

// Per-request de-duplication so sections that share data don't fetch it twice.
const getSeries = cache(() => getDailySeries());
const getSnapshot = cache(() => getOrdersSnapshot());

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-abaca-100 ${className}`} />;
}

function Panel({
  title, subtitle, action, children,
}: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-abaca-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-serif text-xl font-bold text-brand-900">{title}</h2>
          {subtitle && <p className="mt-1 text-sm leading-5 text-charcoal-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4 min-w-0 max-w-full overflow-hidden border-t border-abaca-200 pt-4">{children}</div>
    </div>
  );
}

function Insight({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 flex gap-2 rounded-xl border border-ochre-300 bg-ochre-50 px-3 py-2.5 text-xs leading-5 text-charcoal-700">
      <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-ochre-600" />
      <p>{children}</p>
    </div>
  );
}

function Delta({ now, prev }: { now: number; prev: number }) {
  if (prev === 0) return now > 0 ? <span className="text-xs font-bold text-crimson-700">new activity</span> : null;
  const pct = ((now - prev) / prev) * 100;
  const up = pct >= 0;
  return (
    <span className={`text-xs font-bold ${up ? 'text-crimson-700' : 'text-charcoal-600'}`}>
      {up ? '▲' : '▼'} {Math.abs(pct).toFixed(0)}% vs previous 7 days
    </span>
  );
}

const ICONS = {
  currency: 'M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  trend: 'M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941',
  bag: 'M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z',
  userPlus: 'M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z',
} as const;

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

const STATUS_COLORS = ['#9E2A2B', '#C5832B', '#5C6370'];
const PAYMENT_COLORS = ['#9E2A2B', '#C5832B', '#5C6370'];

async function AttentionSection() {
  const a = await getAttentionCounts();
  const items = [
    { label: 'Artisan applications to review', count: a.pendingArtisans, href: '/admin/artisans?filter=pending' },
    { label: 'New cultural reports', count: a.pendingReports, href: '/admin/reports' },
    { label: 'Reports under investigation', count: a.investigatingReports, href: '/admin/reports' },
  ].filter((i) => i.count > 0);

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-abaca-200 bg-white px-4 py-3 text-sm text-charcoal-700 shadow-sm">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ochre-100 text-sm font-bold text-charcoal-900">0</span>
        <span><b className="text-charcoal-900">Watchlist clear.</b> Nothing requires curator action.</span>
      </div>
    );
  }
  return (
    <section className="rounded-2xl border border-ochre-300 bg-white px-4 py-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-crimson-700">
        <span className="h-px w-5 bg-ochre-500" />
        Curator watchlist
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((i) => (
          <Link key={i.label} href={i.href} className="group flex min-w-52 items-center gap-3 rounded-xl border border-ochre-200 bg-canvas px-3 py-2.5 text-xs text-charcoal-700 transition-colors hover:border-crimson-500 hover:bg-crimson-50">
            <b className="font-serif text-lg text-crimson-700">{i.count}</b>
            <span className="flex-1">{i.label}</span>
            <ArrowRight size={14} className="text-charcoal-400 transition group-hover:translate-x-1 group-hover:text-crimson-700" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}

async function KpiSection() {
  const [stats, seriesData] = await Promise.all([getStats(), getSeries()]);
  const { days: series, kpis: k } = seriesData;

  const rev14 = series.map((d) => d.revenue);
  const ord14 = series.map((d) => d.orders);
  const sign14 = series.map((d) => d.customers + d.artisans);

  const cards: Array<{
    label: string; value: string | number; href: string; icon: string;
    values: number[]; variant: 'line' | 'area' | 'bars'; caption: string; note?: React.ReactNode;
  }> = [
    { label: 'Revenue today', value: peso(k.revenueToday), href: '/admin/orders', icon: ICONS.currency,
      values: rev14, variant: 'bars', caption: 'Daily revenue · last 14 days' },
    { label: 'Revenue · 7 days', value: peso(k.revenue7d), href: '/admin/analytics', icon: ICONS.trend,
      values: rev14.slice(-7), variant: 'area', caption: 'Daily revenue · last 7 days',
      note: <Delta now={k.revenue7d} prev={k.revenuePrev7d} /> },
    { label: 'Orders · 7 days', value: k.orders7d, href: '/admin/orders', icon: ICONS.bag,
      values: ord14.slice(-7), variant: 'bars', caption: 'Orders per day · last 7 days',
      note: <Delta now={k.orders7d} prev={k.ordersPrev7d} /> },
    { label: 'New signups · 7 days', value: k.newCustomers7d + k.newArtisans7d, href: '/admin/analytics', icon: ICONS.userPlus,
      values: sign14, variant: 'line', caption: 'Signups per day · last 14 days',
      note: <span className="text-xs text-charcoal-500">{k.newCustomers7d} patrons · {k.newArtisans7d} artisans</span> },
    { label: 'Total revenue (paid)', value: peso(Number(stats.revenue)), href: '/admin/orders', icon: ICONS.currency,
      values: rev14, variant: 'area', caption: 'Recent trend · last 14 days' },
    { label: 'Total orders', value: stats.orders, href: '/admin/orders', icon: ICONS.bag,
      values: ord14, variant: 'line', caption: 'Recent trend · last 14 days' },
  ];

  const totals = [
    { label: 'Patrons', value: stats.customers, href: '/admin/customers' },
    { label: 'Artisans', value: stats.artisans, href: '/admin/artisans' },
    { label: 'Products', value: stats.products, href: '/admin/products' },
  ];

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="group relative min-h-44 overflow-hidden rounded-2xl border border-abaca-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-crimson-400 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ochre-100 text-ochre-800">
                <Icon path={c.icon} />
              </span>
              <ArrowRight size={16} className="mt-1 text-charcoal-400 transition group-hover:translate-x-1 group-hover:text-crimson-700" aria-hidden="true" />
            </div>
            <p className="mt-4 text-sm font-medium text-charcoal-500">{c.label}</p>
            <p className="mt-1 truncate font-serif text-3xl font-bold text-brand-900">{c.value}</p>
            <div className="mt-1 min-h-4">{c.note}</div>
            <MiniChart values={c.values} variant={c.variant} className="mt-3 text-crimson-600" />
            <p className="mt-1 text-[10px] uppercase tracking-wider text-charcoal-500">{c.caption}</p>
          </Link>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-2xl border border-abaca-200 bg-white shadow-sm">
        {totals.map((t) => (
          <Link key={t.label} href={t.href} className="border-r border-abaca-200 px-4 py-3 text-center text-xs uppercase tracking-wider text-charcoal-500 last:border-r-0 hover:bg-ochre-50">
            <span className="block font-serif text-lg font-bold text-brand-900">{t.value}</span>
            {t.label}
          </Link>
        ))}
      </div>
    </>
  );
}

async function RevenueChartPanel() {
  const { days } = await getSeries();
  const labels = days.map((d) => dayLabel(d.day));
  const values = days.map((d) => d.revenue);
  const total = values.reduce((s, v) => s + v, 0);
  const peak = Math.max(...values, 0);
  const peakDay = peak > 0 ? labels[values.indexOf(peak)] : null;
  return (
    <Panel
      title="Revenue trend" subtitle="Gross revenue per day, last 14 days (cancelled orders excluded)"
      action={<span className="text-sm font-semibold text-crimson-700">{peso(total)}</span>}
    >
      <AxisChart
        labels={labels}
        series={[{ name: 'Revenue', values, color: '#9E2A2B' }]}
        formatY={(v) => `₱${v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : Math.round(v)}`}
        formatTip={peso}
        ariaLabel="Daily revenue, last 14 days"
      />
      {peakDay && <Insight>Total {peso(total)} · average {peso(total / Math.max(days.length, 1))} per day · best day was {peakDay} with {peso(peak)}.</Insight>}
    </Panel>
  );
}

async function OrdersPerDayPanel() {
  const { days } = await getSeries();
  const labels = days.map((d) => dayLabel(d.day));
  const values = days.map((d) => d.orders);
  const total = values.reduce((s, v) => s + v, 0);
  const last7 = values.slice(-7).reduce((s, v) => s + v, 0);
  const prev7 = values.slice(0, 7).reduce((s, v) => s + v, 0);
  return (
    <Panel title="Orders per day" subtitle="Number of orders placed each day, last 14 days"
      action={<span className="text-sm font-semibold text-crimson-700">{total} orders</span>}>
      <AxisChart labels={labels} series={[{ name: 'Orders', values, color: '#9E2A2B' }]} variant="bars" ariaLabel="Orders per day, last 14 days" />
      {total > 0 && <Insight>{last7} orders in the last 7 days vs {prev7} in the 7 days before.</Insight>}
    </Panel>
  );
}

async function SignupsPanel() {
  const { days } = await getSeries();
  const labels = days.map((d) => dayLabel(d.day));
  const customers = days.map((d) => d.customers);
  const artisans = days.map((d) => d.artisans);
  const c = customers.reduce((s, v) => s + v, 0);
  const a = artisans.reduce((s, v) => s + v, 0);
  return (
    <Panel title="New signups" subtitle="Patrons vs artisans joining each day, last 14 days"
      action={<span className="text-sm font-semibold text-crimson-700">{c + a} joined</span>}>
      <AxisChart
        labels={labels}
        series={[
          { name: 'Patrons', values: customers, color: '#9E2A2B' },
          { name: 'Artisans', values: artisans, color: '#C5832B' },
        ]}
        variant="bars" ariaLabel="Signups per day, patrons and artisans"
      />
      {c + a > 0 && <Insight>{c} new patrons and {a} new artisans in 14 days.</Insight>}
    </Panel>
  );
}

async function StatusPanel() {
  const { statuses } = await getSnapshot();
  const slices = statuses.map((s, i) => ({ label: s.status.replace(/_/g, ' '), value: s.count, color: STATUS_COLORS[i % STATUS_COLORS.length] }));
  const top = slices[0];
  const total = slices.reduce((s, x) => s + x.value, 0);
  return (
    <Panel title="Order status" subtitle="Where all orders currently stand"
      action={<Link href="/admin/orders" className="text-xs font-semibold text-crimson-700 hover:underline">View all →</Link>}>
      <DonutChart slices={slices} centerLabel="orders" />
      {top && total > 0 && <Insight>Most orders are <b>{top.label}</b> ({((top.value / total) * 100).toFixed(0)}%).</Insight>}
    </Panel>
  );
}

async function CategoryPanel() {
  const cats = await getCategoryRevenue30d();
  const max = Math.max(...cats.map((c) => c.revenue), 1);
  const COLORS = ['bg-crimson-600', 'bg-ochre-600', 'bg-charcoal-500'];
  return (
    <Panel title="Sales by category" subtitle="Revenue per craft category, last 30 days">
      {cats.length === 0 ? (
        <p className="py-6 text-center text-sm text-charcoal-500">No sales in the last 30 days.</p>
      ) : (
        <>
          <div className="space-y-3">
            {cats.map((c, i) => (
              <div key={c.category}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate text-charcoal-700">{c.category}</span>
                  <span className="shrink-0 text-charcoal-500"><b className="text-charcoal-900">{peso(c.revenue)}</b> · {c.units} sold</span>
                </div>
                <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-abaca-100">
                  <div className={`h-full rounded-full ${COLORS[i % COLORS.length]}`} style={{ width: `${Math.max((c.revenue / max) * 100, 3)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <Insight><b>{cats[0].category}</b> is the best-selling category.</Insight>
        </>
      )}
    </Panel>
  );
}

async function PaymentPanel() {
  const pay = await getPaymentSplit30d();
  const slices = pay.map((p, i) => ({ label: p.method.replace(/_/g, ' '), value: p.count, color: PAYMENT_COLORS[i % PAYMENT_COLORS.length] }));
  const total = slices.reduce((s, x) => s + x.value, 0);
  return (
    <Panel title="Payment methods" subtitle="How customers paid, last 30 days">
      <DonutChart slices={slices} centerLabel="orders" />
      {slices[0] && total > 0 && <Insight><b className="capitalize">{slices[0].label}</b> is the most used ({((slices[0].value / total) * 100).toFixed(0)}%).</Insight>}
    </Panel>
  );
}

async function TopProductsPanel() {
  const top = await getTopProducts30d();
  const max = Math.max(...top.map((p) => p.revenue), 1);
  return (
    <Panel title="Top products" subtitle="Best sellers by revenue, last 30 days"
      action={<Link href="/admin/analytics" className="text-xs font-semibold text-crimson-700 hover:underline">Analytics →</Link>}>
      {top.length === 0 ? (
        <p className="py-6 text-center text-sm text-charcoal-500">No sales in the last 30 days.</p>
      ) : (
        <div className="space-y-3">
          {top.map((p, i) => (
            <div key={p.id}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ochre-100 text-xs font-bold text-ochre-900">{i + 1}</span>
                  <span className="truncate text-charcoal-700">{p.name}</span>
                </span>
                <span className="shrink-0 text-charcoal-500">{p.units} · <b className="text-charcoal-900">{peso(p.revenue)}</b></span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-abaca-100">
                <div className="h-full rounded-full bg-crimson-600" style={{ width: `${Math.max((p.revenue / max) * 100, 3)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

async function RecentOrdersPanel() {
  const { recent } = await getSnapshot();
  return (
    <Panel title="Latest orders" subtitle="The 5 most recent orders"
      action={<Link href="/admin/orders" className="text-xs font-semibold text-crimson-700 hover:underline">View all →</Link>}>
      {recent.length === 0 ? (
        <p className="py-6 text-center text-sm text-charcoal-500">No orders yet.</p>
      ) : (
        <div className="divide-y divide-abaca-200">
          {recent.map((o) => (
            <div key={o.id} className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3">
  <div className="min-w-0">
    <span className="font-semibold text-charcoal-900">#{o.id}</span>
    <span className="ml-2 break-words text-xs text-charcoal-500">
      {o.status.replace(/_/g, ' ')} · {o.method.replace(/_/g, ' ')}
    </span>
  </div>
  <div className="flex items-center justify-between gap-2 sm:shrink-0 sm:flex-col sm:items-end">
                <div className="font-semibold text-crimson-700">{peso(o.total)}</div>
                <div className="text-xs text-charcoal-500">{new Date(o.createdAt).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' })}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

async function ActivityPanel() {
  const logs = await getLogs();
  return (
    <Panel title="Recent activity" subtitle="Latest actions on the platform"
      action={<Link href="/admin/activity" className="text-xs font-semibold text-crimson-700 hover:underline">All logs →</Link>}>
      {logs.length === 0 ? (
        <p className="py-6 text-center text-sm text-charcoal-500">No activity yet.</p>
      ) : (
        <div className="divide-y divide-abaca-200">
          {logs.map((l) => (
            <div key={l.id} className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-start sm:justify-between sm:gap-3">
  <div className="min-w-0 break-words">
    <span className="font-semibold text-charcoal-900">{l.user_name}</span>
    <span className="ml-2 text-charcoal-500">{l.description}</span>
  </div>
  <span className="text-xs text-charcoal-500 sm:shrink-0 sm:text-right">
    {new Date(l.created_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}
  </span>
</div>
          ))}
        </div>
      )}
    </Panel>
  );
}

export default function AdminDashboard() {
  return (
    <div className="mx-auto w-full max-w-7xl pb-8 font-sans">
      {/* DASHBOARD HEADER */}
      <header className="relative isolate overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#4b1717] via-[#7f2422] to-[#9E2A2B] px-6 py-7 text-white shadow-lg sm:px-9 sm:py-9">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 opacity-[0.12]"
          style={{ backgroundImage: "url('/images/kalinga-weave.svg')", backgroundSize: '240px' }}
        />

        <div
          aria-hidden="true"
          className="absolute -right-20 -top-32 -z-10 h-80 w-80 rounded-full border border-white/10"
        />

        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-ochre-200">
              <LayoutDashboard size={15} aria-hidden="true" />
              Administration
            </p>

            <h1 className="mt-3 font-serif text-3xl font-bold leading-tight sm:text-4xl">
              Platform Overview
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/75 sm:text-base">
              Monitor marketplace performance, review important activities,
              and keep track of your platform operations.
            </p>
          </div>

          <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-ochre-100">
            Dashboard Analytics
          </div>
        </div>
      </header>

      {/* DASHBOARD CONTENT */}
      <div className="mt-6">
        <Suspense fallback={<Skeleton className="h-14" />}>
          <AttentionSection />
        </Suspense>
      </div>

      <div className="mt-6">
        <Suspense
          fallback={
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-44" />
              ))}
            </div>
          }
        >
          <KpiSection />
        </Suspense>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<Skeleton className="h-80" />}>
            <RevenueChartPanel />
          </Suspense>
        </div>

        <Suspense fallback={<Skeleton className="h-80" />}>
          <StatusPanel />
        </Suspense>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<Skeleton className="h-80" />}>
          <OrdersPerDayPanel />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-80" />}>
          <SignupsPanel />
        </Suspense>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Suspense fallback={<Skeleton className="h-72" />}>
          <CategoryPanel />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-72" />}>
          <PaymentPanel />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-72" />}>
          <TopProductsPanel />
        </Suspense>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<Skeleton className="h-64" />}>
          <RecentOrdersPanel />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-64" />}>
          <ActivityPanel />
        </Suspense>
      </div>
    </div>
  );
}