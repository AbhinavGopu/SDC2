"use client";

import { useState } from "react";

export default function AgentConstraintChat({ locality }: { locality: string }) {
  const [prompt, setPrompt] = useState("");
  const [responses, setResponses] = useState<string[]>([]);

  const handleSubmit = () => {
    if (!prompt.trim()) {
      return;
    }

    setResponses((current) => [
      `AI draft for ${locality}: evaluate signal timing, adjust rerouting strategies, and check budget constraints.`,
      ...current,
    ]);
    setPrompt("");
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Agent chat</h2>
        <p className="mt-1 text-sm text-slate-500">Enter constraints and generate a recommendation draft for the selected locality.</p>
      </div>
      <div className="mt-5 space-y-4">
        <textarea
          rows={4}
          className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
          placeholder="Budget ₹50 crores, no major closures during exams, keep changes inside the ward..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          className="rounded-2xl bg-sky-600 px-5 py-3 text-white transition hover:bg-sky-700"
          onClick={handleSubmit}
        >
          Generate recommendation
        </button>
      </div>
      <div className="mt-6 space-y-4">
        {responses.length === 0 ? (
          <p className="text-sm text-slate-500">No recommendations generated yet.</p>
        ) : (
          responses.map((response, index) => (
            <div key={index} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-slate-700">{response}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
