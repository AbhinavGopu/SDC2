interface OverviewCardProps {
  locality: string;
  congestion: number;
  pollution: { pm25: number; pm10: number };
  energy: { demand: number };
}

export default function OverviewCard({ locality, congestion, pollution, energy }: OverviewCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Overview</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">{locality} snapshot</h2>
        </div>
        <div className="rounded-3xl bg-slate-100 px-4 py-3 text-slate-700">
          <p className="text-sm">Traffic congestion index</p>
          <p className="mt-1 text-3xl font-semibold text-sky-600">{congestion.toFixed(1)}%</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Air quality (PM2.5)</p>
          <p className="mt-2 text-xl font-semibold text-amber-600">{pollution.pm25.toFixed(1)} µg/m³</p>
        </div>
        <div className="rounded-3xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Dust level (PM10)</p>
          <p className="mt-2 text-xl font-semibold text-orange-600">{pollution.pm10.toFixed(1)} µg/m³</p>
        </div>
        <div className="rounded-3xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Energy demand</p>
          <p className="mt-2 text-xl font-semibold text-emerald-600">{energy.demand.toFixed(1)} MW</p>
        </div>
      </div>
    </div>
  );
}
