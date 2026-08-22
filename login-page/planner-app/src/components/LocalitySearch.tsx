"use client";

import { useState } from "react";

export default function LocalitySearch({ onSelect }: { onSelect: (locality: string) => void }) {
  const [query, setQuery] = useState("");

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Locality search</h2>
          <p className="text-sm text-slate-500">Search Hyderabad localities and open a neighbourhood view.</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          className="grow rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
          placeholder="Search Ameerpet, Gachibowli, Kukatpally..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          className="rounded-2xl bg-sky-600 px-5 py-3 text-white transition hover:bg-sky-700"
          onClick={() => onSelect(query || "Ameerpet")}
        >
          Search
        </button>
      </div>
    </div>
  );
}
