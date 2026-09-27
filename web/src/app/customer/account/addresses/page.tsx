import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { listAddresses } from '@/lib/db';
import AddressesClient from './AddressesClient';

export const dynamic = 'force-dynamic';

export default async function CustomerAddressesPage() {
  const session = await getSession();
  if (!session || session.role !== 'customer') redirect('/auth/login?next=/customer/account/addresses');

  const addresses = await listAddresses(session.id);
  return (
    <>
      <main className="mx-auto max-w-xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-brand-900">Address book</h1>
        <AddressesClient
          initial={addresses.map((a) => ({
            id: a.id, label: a.label, full_name: a.full_name, phone: a.phone,
            address: a.address, landmark: a.landmark, is_default: a.is_default,
          }))}
        />
      </main>
    </>
  );
}
