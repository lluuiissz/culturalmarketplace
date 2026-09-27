import { sql, usingPg } from './dbPg';

// Demographic + operational analytics for the admin console.
// Every query is one round-trip; all results are plain arrays ready to render.
export interface Analytics {
  totalCustomers: number;
  totalArtisans: number;
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  // Signups per week, last 12 weeks (customers vs artisans)
  signupTrend: Array<{ week: string; customers: number; artisans: number }>;
  // Where artisans are located (top 8) — placement & outreach decisions
  artisanLocations: Array<{ location: string; count: number }>;
  // Where customers are located (top 8) — demand-side demographics
  customerLocations: Array<{ location: string; count: number }>;
  // Category mix of listings vs what actually sells (revenue by category)
  categoryListings: Array<{ category: string; count: number }>;
  categoryRevenue: Array<{ category: string; revenue: number; units: number }>;
  // Payment method split — informs payment/partnership decisions
  paymentSplit: Array<{ method: string; count: number }>;
  // Order lifecycle funnel + delivery outcome
  orderStatusCounts: Array<{ status: string; count: number }>;
  // Ratings distribution — quality signal
  ratingDistribution: Array<{ stars: number; count: number }>;
  // Top sellers by revenue (last 90 days)
  topProducts: Array<{ id: number; name: string; units: number; revenue: number }>;
  // Revenue per week, last 12 weeks
  revenueTrend: Array<{ week: string; revenue: number }>;
}

const WEEKS = 12;

export async function getAdminAnalytics(): Promise<Analytics> {
  if (!usingPg) {
    // Demo store: return honest zeros rather than fake numbers.
    return {
      totalCustomers: 0, totalArtisans: 0, totalOrders: 0, totalRevenue: 0, avgOrderValue: 0,
      signupTrend: [], artisanLocations: [], customerLocations: [],
      categoryListings: [], categoryRevenue: [], paymentSplit: [],
      orderStatusCounts: [], ratingDistribution: [], topProducts: [], revenueTrend: [],
    };
  }

  const [totals, signups, aLoc, cLoc, catList, catRev, pay, oStatus, ratings, top, revTrend] = await Promise.all([
    sql`select
          (select count(*) from users where role='customer') as customers,
          (select count(*) from artisans) as artisans,
          (select count(*) from orders) as orders,
          (select coalesce(sum(oi.price * oi.quantity),0) from order_items oi join orders o on o.id=oi.order_id where o.status <> 'cancelled') as revenue,
          (select coalesce(avg(o.total_amount),0) from orders o where o.status <> 'cancelled') as aov`,
    sql`select date_trunc('week', u.created_at) as week,
              count(*) filter (where u.role='customer') as customers,
              count(*) filter (where u.role='artisan') as artisans
        from users u
        where u.created_at >= now() - (${WEEKS} || ' weeks')::interval
        group by 1 order by 1`,
    sql`select coalesce(nullif(trim(min(location)),''),'Unknown') as location, count(*) as count
        from artisans group by lower(coalesce(nullif(trim(location),''),'Unknown')) order by count desc limit 8`,
    sql`select coalesce(nullif(trim(min(u.location)),''),'Unknown') as location, count(*) as count
        from users u where u.role='customer' group by lower(coalesce(nullif(trim(u.location),''),'Unknown')) order by count desc limit 8`,
    sql`select coalesce(nullif(trim(category),''),'Uncategorized') as category, count(*) as count
        from products group by 1 order by count desc limit 8`,
    sql`select coalesce(nullif(trim(p.category),''),'Uncategorized') as category,
              sum(oi.price * oi.quantity) as revenue, sum(oi.quantity) as units
        from order_items oi
        join products p on p.id = oi.product_id
        join orders o on o.id = oi.order_id
        where o.status <> 'cancelled'
        group by 1 order by revenue desc nulls last limit 8`,
    sql`select payment_method as method, count(*) as count from orders group by 1 order by count desc`,
    sql`select status, count(*) as count from orders group by 1 order by count desc`,
    sql`select review_rating as stars, count(*) as count from order_items where review_rating is not null group by 1 order by 1`,
    sql`select p.id, p.name, sum(oi.quantity) as units, sum(oi.price * oi.quantity) as revenue
        from order_items oi join products p on p.id = oi.product_id
        join orders o on o.id = oi.order_id
        where o.status <> 'cancelled' and oi.created_at >= now() - interval '90 days'
        group by p.id, p.name order by revenue desc nulls last limit 5`,
    sql`select date_trunc('week', o.created_at) as week, coalesce(sum(oi.price*oi.quantity),0) as revenue
        from orders o join order_items oi on oi.order_id = o.id
        where o.status <> 'cancelled' and o.created_at >= now() - (${WEEKS} || ' weeks')::interval
        group by 1 order by 1`,
  ]);

  const t = totals[0] as Record<string, unknown>;
  return {
    totalCustomers: Number(t.customers ?? 0),
    totalArtisans: Number(t.artisans ?? 0),
    totalOrders: Number(t.orders ?? 0),
    totalRevenue: Number(t.revenue ?? 0),
    avgOrderValue: Number(t.aov ?? 0),
    signupTrend: (signups as unknown as Array<{ week: string | Date; customers: string; artisans: string }>).map((r) => ({
      week: new Date(r.week).toISOString().slice(0, 10),
      customers: Number(r.customers), artisans: Number(r.artisans),
    })),
    artisanLocations: (aLoc as unknown as Array<{ location: string; count: string }>).map((r) => ({ location: r.location, count: Number(r.count) })),
    customerLocations: (cLoc as unknown as Array<{ location: string; count: string }>).map((r) => ({ location: r.location, count: Number(r.count) })),
    categoryListings: (catList as unknown as Array<{ category: string; count: string }>).map((r) => ({ category: r.category, count: Number(r.count) })),
    categoryRevenue: (catRev as unknown as Array<{ category: string; revenue: string; units: string }>).map((r) => ({ category: r.category, revenue: Number(r.revenue ?? 0), units: Number(r.units ?? 0) })),
    paymentSplit: (pay as unknown as Array<{ method: string; count: string }>).map((r) => ({ method: r.method, count: Number(r.count) })),
    orderStatusCounts: (oStatus as unknown as Array<{ status: string; count: string }>).map((r) => ({ status: r.status, count: Number(r.count) })),
    ratingDistribution: (ratings as unknown as Array<{ stars: string; count: string }>).map((r) => ({ stars: Number(r.stars), count: Number(r.count) })),
    topProducts: (top as unknown as Array<{ id: number; name: string; units: string; revenue: string }>).map((r) => ({ id: Number(r.id), name: r.name, units: Number(r.units ?? 0), revenue: Number(r.revenue ?? 0) })),
    revenueTrend: (revTrend as unknown as Array<{ week: string | Date; revenue: string }>).map((r) => ({
      week: new Date(r.week).toISOString().slice(0, 10), revenue: Number(r.revenue ?? 0),
    })),
  };
}
