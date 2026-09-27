import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { listArtisanProducts } from '@/lib/db';
import ExperiencesClient from './ExperiencesClient';

export const dynamic = 'force-dynamic';

export default async function ArtisanExperiencesPage() {
  const session = await getSession();
  if (!session || session.role !== 'artisan') redirect('/auth/login?next=/artisan/experiences');

  const products = await listArtisanProducts(session.id);
  const tutorials = products.filter((p) => p.has_tutorial);

  return (
    <>
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-brand-900">Experiences & workshops</h1>
        <p className="mt-1 text-stone-500">Manage session dates for your bookable crafts.</p>
        <ExperiencesClient
          initial={tutorials.map((p) => ({
            id: p.id, name: p.name, price: Number(p.tutorial_price ?? p.price),
            capacity: p.tutorial_capacity, status: p.tutorial_status ?? 'accept_bookings',
            dates: p.tutorial_dates ?? [],
          }))}
        />
        {tutorials.length === 0 && (
          <p className="mt-8 text-stone-500">
            No workshops yet — tick “Offer a workshop” when creating a product to make it bookable.
          </p>
        )}
      </main>
    </>
  );
}
