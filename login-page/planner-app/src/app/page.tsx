'use client';

import { useState, useEffect } from 'react';

interface ChatMessage {
  prompt: string;
  response: string;
}

function decodeToken(token: string) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch (e) {
    return null;
  }
}

export default function Page() {
  const [searchText, setSearchText] = useState('Gachibowli, Hyderabad');
  const [activeWardId, setActiveWardId] = useState(2); // default Gachibowli
  const [wardName, setWardName] = useState('Gachibowli');
  const [congestion, setCongestion] = useState(78);
  const [aqi, setAqi] = useState(142);
  const [openComplaints, setOpenComplaints] = useState(11);
  const [activeDomain, setActiveDomain] = useState<'Traffic' | 'Pollution' | 'Energy'>('Traffic');
  const [newConstraint, setNewConstraint] = useState('');
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      prompt: 'Fix the Bio-diversity junction bottleneck, budget under ₹50 lakh, no road closures on weekdays.',
      response: '🔧 Intervention Proposed: Deploy Adaptive Traffic Signal Control (ATSC) at Bio-diversity junction.\n💰 Budget Estimate: ₹45.0 Lakhs (Approved; satisfies your constraints).\n📅 Timeline: 10 days. Execution Plan: Off-peak nighttime installations. Calibration done during live traffic without weekday closures.\n📈 Expected Outcome: reduces average vehicle delay by 18-22% and queue length by 15%.\n🏢 Responsible Authority: Routed to Hyderabad Traffic Police.'
    }
  ]);
  const [wardList, setWardList] = useState<{ id: number; name: string }[]>([
    { id: 1, name: 'Ameerpet' },
    { id: 2, name: 'Gachibowli' },
    { id: 3, name: 'Kukatpally' },
    { id: 4, name: 'Secunderabad' },
    { id: 5, name: 'Madhapur' },
    { id: 6, name: 'Banjara Hills' },
    { id: 7, name: 'Jubilee Hills' },
    { id: 8, name: 'Begumpet' },
    { id: 9, name: 'Uppal' },
    { id: 10, name: 'Dilsukhnagar' }
  ]);
  const [wardProblems, setWardProblems] = useState<Record<'Traffic' | 'Pollution' | 'Energy', { text: string; priority: 'High' | 'Medium' | 'Low' }[]>>({
    Traffic: [],
    Pollution: [],
    Energy: []
  });

  const [showSuggestions, setShowSuggestions] = useState(false);

  // Auth State
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Sort and filter search suggestions from wardList in alphabetical order
  const sortedWards = [...wardList].sort((a, b) => a.name.localeCompare(b.name));
  const cleanSearch = searchText.replace(/,\s*hyderabad/gi, '').trim().toLowerCase();
  const activeWardNameClean = wardName.toLowerCase();
  const suggestions = (cleanSearch && cleanSearch !== activeWardNameClean)
    ? sortedWards.filter(w => w.name.toLowerCase().includes(cleanSearch))
    : sortedWards;

  useEffect(() => {
    setIsMounted(true);
    
    // Check URL search params for token first (SSO)
    const params = new URLSearchParams(window.location.search);
    const ssoToken = params.get('token');
    
    let storedToken = ssoToken || localStorage.getItem('token');
    
    if (ssoToken) {
      localStorage.setItem('token', ssoToken);
      // Clean search params from the address bar
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
    
    if (storedToken) {
      const decoded = decodeToken(storedToken);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setToken(storedToken);
        setUserRole(decoded.role);
        setUserEmail(decoded.sub);
        if (decoded.ward_id) {
          const wId = parseInt(decoded.ward_id, 10);
          if (!isNaN(wId) && wId > 0) {
            setActiveWardId(wId);
          }
        }
      } else {
        localStorage.removeItem('token');
        window.location.href = 'http://localhost:3000';
      }
    } else {
      window.location.href = 'http://localhost:3000';
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowSuggestions(false);
        setSearchText(wardName + ', Hyderabad');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wardName]);

  // Fetch all wards on mount
  useEffect(() => {
    if (token && userRole === 'planner') {
      async function fetchWards() {
        try {
          const response = await fetch('http://127.0.0.1:8000/locality/wards');
          if (response.ok) {
            const data = await response.json();
            setWardList(data);
          }
        } catch (err) {
          console.error('Error fetching wards:', err);
        }
      }
      fetchWards();
    }
  }, [token, userRole]);

  // Fetch Ward stats from the API when activeWardId changes
  useEffect(() => {
    if (token && userRole === 'planner') {
      async function fetchWardData() {
        try {
          const response = await fetch(`http://127.0.0.1:8000/locality/ward/${activeWardId}`);
          if (response.ok) {
            const data = await response.json();
            setWardName(data.ward.name);
            setCongestion(Math.round(data.latest_metric?.congestion_index || 70));
            const pm25 = data.latest_metric?.pm25 || 70;
            setAqi(Math.round(pm25 * 2.0)); // simple mock formula
            setOpenComplaints(data.open_complaints || 0);
          }
        } catch (err) {
          console.error('Error fetching ward data:', err);
        }
      }
      fetchWardData();
    }
  }, [activeWardId, token, userRole]);

  // Fetch Ward problems when activeWardId changes
  useEffect(() => {
    if (token && userRole === 'planner') {
      async function fetchWardProblems() {
        try {
          const response = await fetch(`http://127.0.0.1:8000/locality/ward/${activeWardId}/problems`);
          if (response.ok) {
            const data = await response.json();
            setWardProblems(data);
          }
        } catch (err) {
          console.error('Error fetching ward problems:', err);
        }
      }
      fetchWardProblems();
    }
  }, [activeWardId, token, userRole]);

  // Handle cross-dashboard redirect
  useEffect(() => {
    if (userRole === 'citizen') {
      const timer = setTimeout(() => {
        window.location.href = 'http://localhost:3000';
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [userRole]);

  const handleSearch = (textToSearch: string) => {
    const query = textToSearch.toLowerCase().trim();
    const found = wardList.find(w => query.includes(w.name.toLowerCase()) || w.name.toLowerCase().includes(query));
    if (found) {
      setActiveWardId(found.id);
      setSearchText(found.name + ', Hyderabad');
    } else {
      alert('Ward not found. Please try searching one of: ' + wardList.map(w => w.name).join(', '));
    }
  };

  const handleMyWard = () => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      const decoded = decodeToken(storedToken);
      if (decoded && decoded.ward_id) {
        const wId = parseInt(decoded.ward_id, 10);
        if (!isNaN(wId) && wId > 0) {
          setActiveWardId(wId);
          const found = wardList.find(w => w.id === wId);
          setSearchText((found ? found.name : 'Gachibowli') + ', Hyderabad');
          return;
        }
      }
    }
    setActiveWardId(2);
    setSearchText('Gachibowli, Hyderabad');
  };

  const handleAskAgent = async () => {
    if (!newConstraint.trim()) return;

    const promptText = newConstraint.trim();
    // Add user message immediately
    setChatHistory((prev) => [
      { prompt: promptText, response: 'Thinking...' },
      ...prev
    ]);
    setNewConstraint('');

    try {
      const response = await fetch('http://127.0.0.1:8000/agent/recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ward_id: activeWardId,
          prompt: promptText
        })
      });
      if (response.ok) {
        const data = await response.json();
        setChatHistory((prev) => {
          const updated = [...prev];
          if (updated.length > 0 && updated[0].prompt === promptText) {
            updated[0] = { prompt: promptText, response: data.response };
          }
          return updated;
        });
      } else {
        const errorData = await response.json();
        setChatHistory((prev) => {
          const updated = [...prev];
          if (updated.length > 0 && updated[0].prompt === promptText) {
            updated[0] = { prompt: promptText, response: `⚠️ Error: ${errorData.detail || 'Failed to get recommendation.'}` };
          }
          return updated;
        });
      }
    } catch (err) {
      console.error('Error calling agent:', err);
      setChatHistory((prev) => {
        const updated = [...prev];
        if (updated.length > 0 && updated[0].prompt === promptText) {
          updated[0] = { prompt: promptText, response: '⚠️ Error connecting to agent backend.' };
        }
        return updated;
      });
    }
  };

  function handleLogout() {
    localStorage.removeItem('token');
    setToken(null);
    setUserRole(null);
    setUserEmail(null);
    window.location.href = 'http://localhost:3000/?logout=true';
  }

  const currentProblems = wardProblems[activeDomain] || [];

  // SSR Safe Check
  if (!isMounted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
          <span className="text-sm font-semibold">Loading Hyderabad Traffic Planner Dashboard...</span>
        </div>
      </main>
    );
  }

  // Redirecting if role is citizen
  if (userRole === 'citizen') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-55 text-slate-800 relative">
        <div className="text-center p-8 bg-white border border-slate-200 rounded-2xl glass-panel max-w-md w-full shadow-2xl relative z-10 mx-4">
          <span className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 flex items-center justify-center font-bold text-2xl mx-auto mb-4 animate-bounce">🔑</span>
          <h1 className="text-2xl font-bold text-slate-955 mb-2">Redirecting to Citizen Portal</h1>
          <p className="text-sm text-slate-600 mb-6">You are authenticated as a Citizen ({userEmail}). Redirecting to your portal...</p>
          <div className="flex justify-center gap-3">
            <button onClick={handleLogout} className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 text-sm cursor-pointer">
              Logout
            </button>
            <a href="http://localhost:3000" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-550 text-white font-semibold rounded-md text-sm cursor-pointer">
              Go Now
            </a>
          </div>
        </div>
      </main>
    );
  }

  // Fallback Redirecting screen if no token
  if (!token || userRole !== 'planner') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-900 text-white relative">
        <div className="text-center p-8 bg-slate-800/80 border border-slate-700 rounded-2xl glass-panel max-w-md w-full shadow-2xl relative z-10 mx-4">
          <span className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></span>
          <h1 className="text-xl font-bold text-slate-100 mb-2">Redirecting to Login</h1>
          <p className="text-sm text-slate-400">Please sign in via the unified Hyderabad Smart City Portal on port 3000.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 lg:p-10 relative overflow-hidden flex flex-col gap-6 planner-container">
      <div className="glow-orb glow-indigo" style={{ opacity: 0.1 }}></div>
      <div className="glow-orb glow-sky" style={{ opacity: 0.1 }}></div>

      {/* Top Header Row */}
      <header className="relative z-10 flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white/40 border border-[var(--border)] rounded-2xl p-6 glass-panel">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 mb-2">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-700">Hyderabad Traffic Planner AI</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">Ward Decision Dashboard</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Constraint-aware agent workspace for analyzing traffic metrics and routing infrastructure interventions.
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">Authenticated as: {userEmail} · Assigned Ward ID: {activeWardId}</p>
        </div>

        {/* Search, My Ward & Logout Control */}
        <div className="flex gap-2 items-center shrink-0 w-full md:w-auto md:max-w-xl">
          <div className="relative flex-1 md:w-64 search-container">
            <i className="ti ti-search text-[16px] text-[var(--text-muted)] absolute left-3 top-[12px]" aria-hidden="true"></i>
            <input
              type="text"
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => {
                setSearchText('');
                setShowSuggestions(true);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchText)}
              className="w-full !pl-10 pr-3 py-2 text-slate-900 border border-[var(--border)] rounded-md bg-white/60 focus:border-[var(--border-accent)]"
              placeholder="Search Hyderabad ward..."
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-[100] left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-md border border-sky-200 bg-white shadow-xl text-sm text-left">
                {suggestions.map((ward) => (
                  <li
                    key={ward.id}
                    onClick={() => {
                      setActiveWardId(ward.id);
                      setSearchText(ward.name + ', Hyderabad');
                      setShowSuggestions(false);
                    }}
                    className="cursor-pointer px-4 py-2 hover:bg-sky-600 hover:text-white text-slate-800 transition-colors flex items-center gap-2 group"
                  >
                    <i className="ti ti-map-pin text-[14px] text-sky-500 group-hover:text-white transition-colors" aria-hidden="true"></i>
                    <span>{ward.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button type="button" onClick={handleMyWard} className="whitespace-nowrap shrink-0 cursor-pointer">
            <i className="ti ti-map-pin text-[14px] mr-1" aria-hidden="true"></i>My ward
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="whitespace-nowrap shrink-0 px-3.5 py-2 rounded-md border border-red-250 text-red-650 hover:bg-red-50 hover:text-red-700 font-semibold text-[13px] transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Grid Workspace - Full Screen Spread */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] xl:grid-cols-[1.2fr_0.8fr] relative z-10 w-full flex-1">
        
        {/* Left Column: Stats & Issues */}
        <div className="flex flex-col gap-6">
          {/* Overview Metrics Cards */}
          <div className="glass-panel border border-[var(--border)] rounded-2xl p-6">
            <h2 className="font-semibold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <i className="ti ti-chart-bar text-[18px] text-[var(--text-accent)]" aria-hidden="true"></i>
              {wardName} Municipal Overview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-card border border-[var(--border)] rounded-xl p-4 text-left">
                <p className="text-[12px] text-[var(--text-secondary)] m-0 mb-1 leading-tight uppercase tracking-wider font-semibold">Congestion Index</p>
                <p className="text-[32px] font-bold m-0 text-[var(--text-danger)] mt-1">{congestion}</p>
                <p className="text-[11px] text-slate-500 mt-2">Peak-hour buildup vs. ward baseline</p>
              </div>
              <div className="glass-card border border-[var(--border)] rounded-xl p-4 text-left">
                <p className="text-[12px] text-[var(--text-secondary)] m-0 mb-1 leading-tight uppercase tracking-wider font-semibold">Air Quality (AQI)</p>
                <p className="text-[32px] font-bold m-0 text-[var(--text-warning)] mt-1">{aqi}</p>
                <p className="text-[11px] text-slate-500 mt-2">Particulate levels (PM2.5/10)</p>
              </div>
              <div className="glass-card border border-[var(--border)] rounded-xl p-4 text-left">
                <p className="text-[12px] text-[var(--text-secondary)] m-0 mb-1 leading-tight uppercase tracking-wider font-semibold">Open Ward Complaints</p>
                <p className="text-[32px] font-bold m-0 text-slate-900 mt-1">{openComplaints}</p>
                <p className="text-[11px] text-slate-500 mt-2">Awaiting authority dispatch</p>
              </div>
            </div>
          </div>

          {/* Domain Tabs & Problems List */}
          <div className="glass-panel border border-[var(--border)] rounded-2xl p-6 flex-1 flex flex-col">
            <h2 className="font-semibold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <i className="ti ti-alert-triangle text-[18px] text-amber-500" aria-hidden="true"></i>
              Top Problem Log
            </h2>
            <div className="flex border-b border-[var(--border)] mb-4">
              {(['Traffic', 'Pollution', 'Energy'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveDomain(tab)}
                  className={`tab-btn flex-1 text-center pb-2.5 text-[15px] ${
                    activeDomain === tab ? 'active' : ''
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 flex-1 justify-start">
              {currentProblems.map((prob, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3.5 glass-card border border-[var(--border)] rounded-xl hover:border-slate-300 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-[12px] flex items-center justify-center font-bold text-[var(--text-accent)] shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-[14px] text-slate-800 font-medium leading-snug">
                      {prob.text}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                      prob.priority === 'High'
                        ? 'bg-[var(--bg-danger)] text-[var(--text-danger)] border border-red-200'
                        : prob.priority === 'Medium'
                        ? 'bg-[var(--bg-warning)] text-[var(--text-warning)] border border-amber-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {prob.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Agent Console */}
        <div className="glass-panel border border-[var(--border)] rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex flex-col gap-4 flex-1">
            <div>
              <h2 className="font-semibold text-lg text-slate-900 flex items-center gap-2">
                <i className="ti ti-messages text-[18px] text-[var(--text-accent)]" aria-hidden="true"></i>
                Planner Agent Workspace
              </h2>
              <p className="text-[13px] text-[var(--text-secondary)] mt-1">
                Inject custom budget limits, spatial constraints, or timelines to generate drafted intervention actions.
              </p>
            </div>

            {/* Chat message dialog list - Scrollable, taking up main space */}
            <div className="flex-1 overflow-y-auto max-h-[480px] flex flex-col gap-4 pr-1 scrollbar-thin">
              {chatHistory.map((chat, idx) => (
                <div key={idx} className="flex flex-col gap-2.5 border-b border-slate-200 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-[11px] flex items-center justify-center font-bold text-slate-800 shrink-0 mt-0.5">U</span>
                    <div className="glass-card border border-[var(--border)] rounded-xl p-3 text-[13px] text-slate-800 italic flex-1">
                      "{chat.prompt}"
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-sky-50 border border-sky-200 text-[11px] flex items-center justify-center font-bold text-sky-700 shrink-0 mt-0.5">A</span>
                    <div className="text-[13px] text-sky-900 leading-relaxed font-mono whitespace-pre-line bg-sky-50/50 border border-sky-200/60 p-3.5 rounded-xl flex-1">
                      {chat.response}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User input fields */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
            <input
              type="text"
              value={newConstraint}
              onChange={(e) => setNewConstraint(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskAgent()}
              placeholder="E.g., Budget limit ₹20 lakhs, execution within 5 days..."
              className="flex-1 px-4 py-3 text-[13px] text-slate-900 border border-[var(--border)] rounded-xl focus:border-[var(--border-accent)] bg-white/60"
            />
            <button
              type="button"
              onClick={handleAskAgent}
              className="primary-btn shrink-0 w-11 h-11 flex items-center justify-center text-white rounded-xl transition cursor-pointer"
            >
              <i className="ti ti-arrow-right text-[18px]" aria-hidden="true"></i>
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
