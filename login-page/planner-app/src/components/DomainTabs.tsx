interface Problem {
  title: string;
  category: string;
  summary: string;
}

interface DomainTabsProps {
  activeDomain: "Traffic" | "Pollution" | "Energy";
  onTabChange: (domain: "Traffic" | "Pollution" | "Energy") => void;
  problems: Problem[];
}

const tabs: DomainTabsProps["activeDomain"][] = ["Traffic", "Pollution", "Energy"];

export default function DomainTabs({ activeDomain, onTabChange, problems }: DomainTabsProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Domain insights</h2>
          <p className="text-sm text-slate-500">Switch between traffic, pollution, and energy views.</p>
        </div>
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                activeDomain === tab
                  ? "bg-sky-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              onClick={() => onTabChange(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        {problems.slice(0, 3).map((problem) => (
          <div key={problem.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">{problem.category}</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">{problem.title}</h3>
            <p className="mt-2 text-slate-600">{problem.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
