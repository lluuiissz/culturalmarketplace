import { notFound, redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getSession } from '@/lib/auth';
import { getOrder, getOrderItems, getProduct, getArtisan, getUser } from '@/lib/db';
import OfficialReceiptTicketView from '@/components/OfficialReceiptTicketView';

export const dynamic = 'force-dynamic';

export default async function OrderSuccessPage({ params }: { params: Promise<{ orderId: string }> }) {
  const session = await getSession();
  if (!session) redirect('/auth/login');

  const { orderId } = await params;
  const order = await getOrder(Number(orderId));
  if (!order) notFound();

  if (session.role !== 'admin' && order.customer_id !== session.id) {
    notFound();
  }

  const [items, customerUser] = await Promise.all([
    getOrderItems(order.id),
    getUser(order.customer_id),
  ]);

  const artisanIds = Array.from(new Set(items.map((i) => i.artisan_id)));
  const productIds = Array.from(new Set(items.map((i) => i.product_id)));

  const [artisans, products] = await Promise.all([
    Promise.all(artisanIds.map((id) => getArtisan(id))),
    Promise.all(productIds.map((id) => getProduct(id))),
  ]);

  const artisanMap: Record<number, { name: string; business_name: string | null; phone: string | null; email: string | null }> = {};
  for (const a of artisans) {
    if (a) artisanMap[a.id] = { name: a.name, business_name: a.business_name, phone: a.phone, email: a.email };
  }

  const productMap: Record<number, { tutorial_location?: string | null; tutorial_lat?: number | null; tutorial_lng?: number | null; image_path?: string | null }> = {};
  for (const p of products) {
    if (p) productMap[p.id] = { tutorial_location: p.tutorial_location, tutorial_lat: p.tutorial_lat, tutorial_lng: p.tutorial_lng, image_path: p.image_path };
  }

  const customer = {
    name: customerUser?.name || session.name,
    email: customerUser?.email || session.email,
  };

  return (
    <>
      <div className="print:hidden">
        <Header />
      </div>

      <main className="mx-auto max-w-3xl px-4 py-10 print:p-0 print:max-w-none">
        <OfficialReceiptTicketView
          order={order}
          items={items}
          customer={customer}
          artisanMap={artisanMap}
          productMap={productMap}
          showCelebration={true}
        />
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </>
  );
}
