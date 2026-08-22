interface Problem {
  title: string;
  category: string;
  summary: string;
}

export default function TopProblemsPanel({ problems }: { problems: Problem[] }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Top problems</h2>
          <p className="text-sm text-slate-500">Problems backed by seeded data for the selected locality.</p>
        </div>
      </div>
      <div className="mt-6 space-y-4">
        {problems.map((problem) => (
          <div key={problem.title} className="rounded-3xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-slate-700">{problem.category}</span>
            </div>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">{problem.title}</h3>
            <p className="mt-2 text-slate-600">{problem.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
