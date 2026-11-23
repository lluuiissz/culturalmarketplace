import ArtisanRegistrationForm from '@/components/ArtisanRegistrationForm';
import { listArtisanUiTranslations } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ArtisanRegisterPage() {
  const messages = await listArtisanUiTranslations('ceb');
  return <ArtisanRegistrationForm messages={messages} />;
}
