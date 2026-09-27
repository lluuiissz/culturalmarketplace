import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { listApprovedArtisans } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ArtisansPage() {
  const artisans = await listApprovedArtisans();
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-brand-900">Our artisans</h1>
        <p className="mt-2 text-stone-600">Verified makers preserving the cultural heritage of Agusan del Sur.</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {artisans.map((a) => (
            <a key={a.id} href={`/artisans/${a.id}`} className="card p-6 transition-shadow hover:shadow-md">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-2xl">🧑‍🎨</div>
              <h2 className="mt-4 font-serif text-lg font-bold text-brand-900">{a.name}</h2>
              <p className="text-sm text-stone-500">{a.business_name ?? 'Independent artisan'}</p>
              <p className="mt-2 text-sm text-stone-600">{a.craft_type} · {a.location}</p>
              <span className="badge mt-3 bg-leaf-500/10 text-leaf-700">✔ Verified</span>
            </a>
          ))}
        </div>
        {artisans.length === 0 && <p className="mt-10 text-center text-stone-500">No artisans yet.</p>}
      </main>
      <Footer />
    </>
  );
}
