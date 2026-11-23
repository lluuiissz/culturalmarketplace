import { unstable_cache } from 'next/cache';
import { sql, usingPg } from './dbPg';

export interface OverviewKpis {
  revenueToday: number;
  revenue7d: number;
  revenuePrev7d: number;
  orders7d: number;
  ordersPrev7d: number;
  newCustomers7d: number;
  newArtisans7d: number;
}
export interface DailyPoint { day: string; revenue: number; orders: number; customers: number; artisans: number }
export interface TopProduct { id: number; name: string; units: number; revenue: number }
export interface RecentOrder { id: number; status: string; total: number; method: string; createdAt: string }
export interface StatusCount { status: string; count: number }
export interface AttentionCounts {
  pendingArtisans: number;
  pendingReports: number;
  investigatingReports: number;
}
export interface CategoryRevenue { category: string; revenue: number; units: number }
export interface PaymentCount { method: string; count: number }

// One query: per-day revenue, orders and signups for the last 14 days (Manila time).
async function loadDailySeries(): Promise<{ days: DailyPoint[]; kpis: OverviewKpis }> {
  const emptyKpis: OverviewKpis = {
    revenueToday: 0, revenue7d: 0, revenuePrev7d: 0, orders7d: 0,
    ordersPrev7d: 0, newCustomers7d: 0, newArtisans7d: 0,
  };
  if (!usingPg) return { days: [], kpis: emptyKpis };
  const rows = (await sql`
    with days as (
      select d::date as day
      from generate_series(
        ((now() at time zone 'Asia/Manila')::date - 13)::timestamp,
        (now() at time zone 'Asia/Manila')::date::timestamp,
        interval '1 day') d
    ),
    order_totals as (
      select o.id, o.created_at, sum(oi.price * oi.quantity) as amount
      from orders o join order_items oi on oi.order_id = o.id
      where o.status <> 'cancelled' and o.created_at >= now() - interval '15 days'
      group by o.id, o.created_at
    ),
    ord as (
      select (created_at at time zone 'Asia/Manila')::date as day,
             count(*) as orders,
             sum(amount) as revenue
      from order_totals
      group by 1
    ),
    cu as (
      select (created_at at time zone 'Asia/Manila')::date as day, count(*) as n
      from users where role = 'customer' and created_at >= now() - interval '15 days'
      group by 1
    ),
    ar as (
      select (created_at at time zone 'Asia/Manila')::date as day, count(*) as n
      from artisans where created_at >= now() - interval '15 days'
      group by 1
    ),
    order_summary as (
      select
        coalesce(sum(amount) filter (where created_at >= (date_trunc('day', now() at time zone 'Asia/Manila') at time zone 'Asia/Manila')), 0) as revenue_today,
        coalesce(sum(amount) filter (where created_at >= now() - interval '7 days'), 0) as revenue_7d,
        coalesce(sum(amount) filter (where created_at >= now() - interval '14 days' and created_at < now() - interval '7 days'), 0) as revenue_prev_7d,
        count(*) filter (where created_at >= now() - interval '7 days') as orders_7d,
        count(*) filter (where created_at >= now() - interval '14 days' and created_at < now() - interval '7 days') as orders_prev_7d
      from order_totals
    ),
    signup_summary as (
      select
        (select count(*) from users where role = 'customer' and created_at >= now() - interval '7 days') as customers,
        (select count(*) from artisans where created_at >= now() - interval '7 days') as artisans
    )
    select to_char(days.day, 'YYYY-MM-DD') as day,
           coalesce(ord.revenue, 0) as revenue,
           coalesce(ord.orders, 0) as orders,
           coalesce(cu.n, 0) as customers,
           coalesce(ar.n, 0) as artisans,
           order_summary.revenue_today,
           order_summary.revenue_7d,
           order_summary.revenue_prev_7d,
           order_summary.orders_7d,
           order_summary.orders_prev_7d,
           signup_summary.customers as new_customers_7d,
           signup_summary.artisans as new_artisans_7d
    from days
    left join ord on ord.day = days.day
    left join cu on cu.day = days.day
    left join ar on ar.day = days.day
    cross join order_summary
    cross join signup_summary
    order by days.day`) as unknown as Array<{
      day: string; revenue: string; orders: string; customers: string; artisans: string;
      revenue_today: string; revenue_7d: string; revenue_prev_7d: string;
      orders_7d: string; orders_prev_7d: string; new_customers_7d: string; new_artisans_7d: string;
    }>;
  const first = rows[0] as Record<string, unknown> | undefined;
  return {
    days: rows.map((r) => ({
      day: r.day,
      revenue: Number(r.revenue ?? 0),
      orders: Number(r.orders ?? 0),
      customers: Number(r.customers ?? 0),
      artisans: Number(r.artisans ?? 0),
    })),
    kpis: first ? {
      revenueToday: Number(first.revenue_today ?? 0),
      revenue7d: Number(first.revenue_7d ?? 0),
      revenuePrev7d: Number(first.revenue_prev_7d ?? 0),
      orders7d: Number(first.orders_7d ?? 0),
      ordersPrev7d: Number(first.orders_prev_7d ?? 0),
      newCustomers7d: Number(first.new_customers_7d ?? 0),
      newArtisans7d: Number(first.new_artisans_7d ?? 0),
    } : emptyKpis,
  };
}

async function loadTopProducts(): Promise<TopProduct[]> {
  if (!usingPg) return [];
  const rows = (await sql`
    select p.id, p.name, sum(oi.quantity) as units, sum(oi.price * oi.quantity) as revenue
    from order_items oi
    join products p on p.id = oi.product_id
    join orders o on o.id = oi.order_id
    where o.status <> 'cancelled' and o.created_at >= now() - interval '30 days'
    group by p.id, p.name order by revenue desc nulls last limit 5`) as unknown as Array<{ id: number; name: string; units: string; revenue: string }>;
  return rows.map((r) => ({ id: Number(r.id), name: r.name, units: Number(r.units ?? 0), revenue: Number(r.revenue ?? 0) }));
}

async function loadCategoryRevenue(): Promise<CategoryRevenue[]> {
  if (!usingPg) return [];
  const rows = (await sql`
    select coalesce(nullif(trim(p.category),''),'Uncategorized') as category,
           sum(oi.price * oi.quantity) as revenue, sum(oi.quantity) as units
    from order_items oi
    join products p on p.id = oi.product_id
    join orders o on o.id = oi.order_id
    where o.status <> 'cancelled' and o.created_at >= now() - interval '30 days'
    group by 1 order by revenue desc nulls last limit 6`) as unknown as Array<{ category: string; revenue: string; units: string }>;
  return rows.map((r) => ({ category: r.category, revenue: Number(r.revenue ?? 0), units: Number(r.units ?? 0) }));
}

async function loadPaymentSplit(): Promise<PaymentCount[]> {
  if (!usingPg) return [];

  const rows = (await sql`
    select
      coalesce(
        nullif(trim(payment_method), ''),
        'not specified'
      ) as method,
      count(*) as count
    from orders
    where status <> 'cancelled'
      and created_at >= now() - interval '30 days'
    group by 1
    order by count desc
  `) as unknown as Array<{
    method: string | null;
    count: string | number;
  }>;

  return rows.map((r) => ({
    method: String(r.method ?? 'not specified'),
    count: Number(r.count ?? 0),
  }));
}


async function loadOrdersSnapshot(): Promise<{
  statuses: StatusCount[];
  recent: RecentOrder[];
}> {
  if (!usingPg) return { statuses: [], recent: [] };

  const [st, rc] = await Promise.all([
    sql`
      select
        coalesce(nullif(trim(status), ''), 'unknown') as status,
        count(*) as count
      from orders
      group by 1
      order by count desc
    `,
        sql`
      select
        id,
        coalesce(nullif(trim(status), ''), 'unknown') as status,
        total_amount,
        coalesce(nullif(trim(payment_method), ''), 'not specified') as payment_method,
        created_at
      from orders
     where created_at is not null
order by created_at desc
limit 5
    `,
  ]);

  return {
    statuses: (
      st as unknown as Array<{ status: string | null; count: string | number }>
    ).map((r) => ({
      status: String(r.status ?? 'unknown'),
      count: Number(r.count ?? 0),
    })),

    recent: (
      rc as unknown as Array<{
        id: number | string;
        status: string | null;
        total_amount: string | number | null;
        payment_method: string | null;
        created_at: string | Date | null;
      }>
    ).map((r) => ({
      id: Number(r.id),
      status: String(r.status ?? 'unknown'),
      total: Number(r.total_amount ?? 0),
      method: String(r.payment_method ?? 'not specified'),
      createdAt: r.created_at
  ? new Date(r.created_at).toISOString()
  : '',
    })),
  };
}


async function loadAttention(): Promise<AttentionCounts> {
  if (!usingPg) return { pendingArtisans: 0, pendingReports: 0, investigatingReports: 0 };
  const rows = await sql`select
    (select count(*) from artisans where verification_status = 'pending') as pending_artisans,
    (select count(*) from reports where status = 'pending') as pending_reports,
    (select count(*) from reports where status = 'investigating') as investigating_reports`;
  const r = rows[0] as Record<string, unknown>;
  return {
    pendingArtisans: Number(r.pending_artisans ?? 0),
    pendingReports: Number(r.pending_reports ?? 0),
    investigatingReports: Number(r.investigating_reports ?? 0),
  };
}

export const getDailySeries = unstable_cache(loadDailySeries, ['dash-daily-series'], { revalidate: 120 });
export const getTopProducts30d = unstable_cache(loadTopProducts, ['dash-top-products'], { revalidate: 300 });
export const getCategoryRevenue30d = unstable_cache(loadCategoryRevenue, ['dash-category-revenue'], { revalidate: 300 });
export const getPaymentSplit30d = unstable_cache(loadPaymentSplit, ['dash-payment-split'], { revalidate: 300 });
export const getOrdersSnapshot = unstable_cache(loadOrdersSnapshot, ['dash-orders-snapshot'], { revalidate: 30 });
export const getAttentionCounts = unstable_cache(loadAttention, ['dash-attention'], { revalidate: 30 });