import ReportForm from './ReportForm';

export default function CustomerReportPage() {
  return (
    <main className="min-h-screen bg-[#FCF9F4]">
      {/* PAGE HEADER */}
      <section className="px-4 py-6 md:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="font-serif text-xl font-bold text-[#3D3028] md:text-2xl">
            Report an issue
          </h1>
          <p className="mt-1 text-sm text-[#71675F]">
            Report a listing or artisan that violates our community rules.
          </p>
        </div>
      </section>

      {/* DIVIDER */}
      <div className="h-px w-full bg-gray-300" />

      {/* FORM */}
      <section className="px-4 py-5 md:px-8 md:py-6">
        <div className="mx-auto max-w-xl">
          <ReportForm />
        </div>
      </section>
    </main>
  );
}