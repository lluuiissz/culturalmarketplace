import { notFound } from 'next/navigation';
import { getArtisanFull, listArtisanProducts } from '@/lib/db';
import ArtisanReviewClient from './ArtisanReviewClient';

export const dynamic = 'force-dynamic';

export default async function AdminArtisanReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artisan = await getArtisanFull(Number(id));
  if (!artisan) notFound();
  const products = await listArtisanProducts(artisan.id);

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-brand-900">Review: {artisan.name}</h1>
      <ArtisanReviewClient
        artisan={{
          id: artisan.id, name: artisan.name, email: artisan.email, phone: artisan.phone,
          location: artisan.location, craft_type: artisan.craft_type, business_name: artisan.business_name,
          bio: artisan.bio, status: artisan.verification_status,
          id_number: artisan.id_number ?? null, dob: artisan.dob ?? null,
          has_id_docs: Boolean(artisan.id_document_path), has_proof: Boolean(artisan.proof_of_craft_path),
        }}
        productCount={products.length}
      />
    </div>
  );
}
