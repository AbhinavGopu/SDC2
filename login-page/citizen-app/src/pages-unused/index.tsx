import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Hyderabad Traffic Planner Citizen</title>
      </Head>
      <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-10 shadow-lg">
          <h1 className="text-4xl font-bold mb-4">Hyderabad Traffic Planner</h1>
          <p className="text-lg text-slate-600">
            Citizen portal for traffic, pollution, and energy issue reporting in Hyderabad.
          </p>
          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border border-slate-200 p-6">
              <h2 className="text-2xl font-semibold">Phase 1</h2>
              <p className="mt-2 text-slate-700">A lightweight Next.js citizen landing page scaffold.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
