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
let cachedAnalytics: { data: Analytics; expiresAt: number } | null = null;

export async function getAdminAnalytics(): Promise<Analytics> {
  if (cachedAnalytics && Date.now() < cachedAnalytics.expiresAt) {
    return cachedAnalytics.data;
  }

  if (!usingPg) {
    const { demo } = await import('./db');
    const s = demo();
    const customers = s.users.filter((u) => u.role === 'customer');
    const artisans = s.artisans;
    const orders = s.orders;
    const validOrders = orders.filter((o) => o.status !== 'cancelled');
    const totalRevenue = s.order_items
      .filter((oi) => {
        const o = orders.find((oo) => oo.id === oi.order_id);
        return o && o.status !== 'cancelled';
      })
      .reduce((sum, oi) => sum + Number(oi.price) * oi.quantity, 0);

    const avgOrderValue = validOrders.length ? totalRevenue / validOrders.length : 0;

    const aLocMap = new Map<string, number>();
    for (const a of artisans) {
      const loc = a.location?.trim() || 'Unknown';
      aLocMap.set(loc, (aLocMap.get(loc) ?? 0) + 1);
    }
    const artisanLocations = Array.from(aLocMap.entries())
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const cLocMap = new Map<string, number>();
    for (const c of customers) {
      const loc = c.location?.trim() || 'Unknown';
      cLocMap.set(loc, (cLocMap.get(loc) ?? 0) + 1);
    }
    const customerLocations = Array.from(cLocMap.entries())
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const catMap = new Map<string, number>();
    for (const p of s.products) {
      const cat = p.category?.trim() || 'Uncategorized';
      catMap.set(cat, (catMap.get(cat) ?? 0) + 1);
    }
    const categoryListings = Array.from(catMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const catRevMap = new Map<string, { revenue: number; units: number }>();
    for (const oi of s.order_items) {
      const o = orders.find((oo) => oo.id === oi.order_id);
      if (!o || o.status === 'cancelled') continue;
      const p = s.products.find((prod) => prod.id === oi.product_id);
      const cat = p?.category?.trim() || 'Uncategorized';
      const cur = catRevMap.get(cat) ?? { revenue: 0, units: 0 };
      cur.revenue += Number(oi.price) * oi.quantity;
      cur.units += oi.quantity;
      catRevMap.set(cat, cur);
    }
    const categoryRevenue = Array.from(catRevMap.entries())
      .map(([category, d]) => ({ category, revenue: d.revenue, units: d.units }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    const payMap = new Map<string, number>();
    for (const o of orders) {
      const m = o.payment_method || 'cod';
      payMap.set(m, (payMap.get(m) ?? 0) + 1);
    }
    const paymentSplit = Array.from(payMap.entries())
      .map(([method, count]) => ({ method, count }))
      .sort((a, b) => b.count - a.count);

    const statusMap = new Map<string, number>();
    for (const o of orders) {
      statusMap.set(o.status, (statusMap.get(o.status) ?? 0) + 1);
    }
    const orderStatusCounts = Array.from(statusMap.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    const starsMap = new Map<number, number>();
    for (const oi of s.order_items) {
      if (oi.review_rating != null && oi.review_rating > 0) {
        starsMap.set(oi.review_rating, (starsMap.get(oi.review_rating) ?? 0) + 1);
      }
    }
    const ratingDistribution = [1, 2, 3, 4, 5].map((stars) => ({
      stars,
      count: starsMap.get(stars) ?? 0,
    }));

    const prodRevMap = new Map<number, { id: number; name: string; units: number; revenue: number }>();
    for (const oi of s.order_items) {
      const o = orders.find((oo) => oo.id === oi.order_id);
      if (!o || o.status === 'cancelled') continue;
      const cur = prodRevMap.get(oi.product_id) ?? { id: oi.product_id, name: oi.product_name, units: 0, revenue: 0 };
      cur.units += oi.quantity;
      cur.revenue += Number(oi.price) * oi.quantity;
      prodRevMap.set(oi.product_id, cur);
    }
    const topProducts = Array.from(prodRevMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const demoResult: Analytics = {
      totalCustomers: customers.length,
      totalArtisans: artisans.length,
      totalOrders: orders.length,
      totalRevenue,
      avgOrderValue,
      signupTrend: [
        { week: '2026-09-01', customers: 2, artisans: 1 },
        { week: '2026-09-08', customers: 3, artisans: 2 },
        { week: '2026-09-15', customers: 4, artisans: 1 },
        { week: '2026-09-22', customers: 5, artisans: 2 },
      ],
      artisanLocations,
      customerLocations,
      categoryListings,
      categoryRevenue,
      paymentSplit,
      orderStatusCounts,
      ratingDistribution,
      topProducts,
      revenueTrend: [
        { week: '2026-09-01', revenue: Math.round(totalRevenue * 0.2) },
        { week: '2026-09-08', revenue: Math.round(totalRevenue * 0.25) },
        { week: '2026-09-15', revenue: Math.round(totalRevenue * 0.25) },
        { week: '2026-09-22', revenue: Math.round(totalRevenue * 0.3) },
      ],
    };

    cachedAnalytics = { data: demoResult, expiresAt: Date.now() + 30_000 };
    return demoResult;
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
  const result: Analytics = {
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

  cachedAnalytics = { data: result, expiresAt: Date.now() + 30_000 };
  return result;
}
