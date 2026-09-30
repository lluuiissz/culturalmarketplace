import { notFound } from 'next/navigation';
import { getArtisanFull, listArtisanProducts } from '@/lib/db';
import { getVerificationDocUrl } from '@/lib/storage';
import { evaluateVerificationRules, rulesSummary } from '@/lib/verificationRules';
import ArtisanReviewClient from './ArtisanReviewClient';

export const dynamic = 'force-dynamic';

export default async function AdminArtisanReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artisan = await getArtisanFull(Number(id));
  if (!artisan) notFound();
  const products = await listArtisanProducts(artisan.id);

  // Deterministic rule evaluation (study Objective 2) — computed from stored data.
  const rules = evaluateVerificationRules(artisan);
  const summary = rulesSummary(rules);

  // Signed URLs (5 min) for every submitted evidence image.
  const evidenceSources = [
    { key: 'id_front', label: 'ID front', path: artisan.id_document_path },
    { key: 'id_back', label: 'ID back', path: artisan.id_document_back_path },
    { key: 'proof', label: 'Proof of craft', path: artisan.proof_of_craft_path },
    { key: 'sample1', label: 'Product sample 1', path: artisan.product_sample_1_path },
    { key: 'sample2', label: 'Product sample 2', path: artisan.product_sample_2_path },
    { key: 'selfie', label: 'Live selfie', path: artisan.selfie_path },
  ];
  const evidence = await Promise.all(
    evidenceSources.map(async (e) => ({
      key: e.key,
      label: e.label,
      submitted: Boolean(e.path),
      url: e.path ? await getVerificationDocUrl(e.path) : null,
    })),
  );

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
        rules={rules}
        ruleSummary={summary}
        evidence={evidence}
      />
    </div>
  );
}
