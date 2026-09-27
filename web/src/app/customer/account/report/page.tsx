import ReportForm from './ReportForm';

export default function CustomerReportPage() {
  return (
    <>
      <main className="mx-auto max-w-xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-brand-900">Report an issue</h1>
        <p className="mt-1 text-stone-500">Report a listing or artisan that violates our community rules.</p>
        <ReportForm />
      </main>
    </>
  );
}
