import { listCustomers } from '@/lib/db';
import CustomersClient from './CustomersClient';

export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage() {
  const customers = await listCustomers();
  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand-900">Customers</h1>
      <CustomersClient
        initial={customers.map((c) => ({
          id: c.id, name: c.name, email: c.email, phone: c.phone, location: c.location,
          order_count: c.order_count, status: c.status,
        }))}
      />
    </div>
  );
}
