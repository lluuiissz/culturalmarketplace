import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ProductRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/customer/browse/${id}`);
}
