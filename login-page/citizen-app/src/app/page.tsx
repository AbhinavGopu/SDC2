'use client';

import { useState, useEffect } from 'react';

const HYD_LOCATIONS = [
  { label: 'Ameerpet Metro Station, Ameerpet', locality: 'Ameerpet' },
  { label: 'Bio-diversity junction, Gachibowli', locality: 'Gachibowli' },
  { label: 'Kukatpally Y-Junction, Kukatpally', locality: 'Kukatpally' },
  { label: 'Clock Tower, Secunderabad', locality: 'Secunderabad' },
  { label: 'Cyber Towers, Madhapur', locality: 'Madhapur' },
  { label: 'Road No. 12, Banjara Hills', locality: 'Banjara Hills' },
  { label: 'Road No. 36 Metro Station, Jubilee Hills', locality: 'Jubilee Hills' },
  { label: 'Begumpet Flyover, Begumpet', locality: 'Begumpet' },
  { label: 'Uppal Metro Station, Uppal', locality: 'Uppal' },
  { label: 'Dilsukhnagar Bus Depot, Dilsukhnagar', locality: 'Dilsukhnagar' },
];

interface RecentComplaint {
  id: number;
  citizen_name: string;
  locality: string;
  category: string;
  severity: string;
  status: string;
  created_at: string;
}

function decodeToken(token: string) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch (e) {
    return null;
  }
}

export default function Home() {
  const [description, setDescription] = useState('');
  const [locationIndex, setLocationIndex] = useState(0);
  const [status, setStatus] = useState('');
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoAdded, setPhotoAdded] = useState(false);
  const [videoAdded, setVideoAdded] = useState(false);
  
  const [recentComplaints, setRecentComplaints] = useState<RecentComplaint[]>([]);

  // Auth State
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const currentLocation = HYD_LOCATIONS[locationIndex];

  // Fetch recent complaints on mount and after submission
  async function fetchRecentComplaints() {
    try {
      const response = await fetch('http://127.0.0.1:8000/citizen/complaints/recent');
      if (response.ok) {
        const data = await response.json();
        setRecentComplaints(data);
      }
    } catch (err) {
      console.error('Error fetching recent complaints:', err);
    }
  }

  useEffect(() => {
    setIsMounted(true);
    
    // Check if we came from a logout redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get('logout') === 'true') {
      localStorage.removeItem('token');
      // Clean query params
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      return;
    }
    
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      const decoded = decodeToken(storedToken);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setToken(storedToken);
        setUserRole(decoded.role);
        setUserEmail(decoded.sub);
      } else {
        localStorage.removeItem('token');
      }
    }
  }, []);

  useEffect(() => {
    if (token && userRole === 'citizen') {
      fetchRecentComplaints();
    }
  }, [token, userRole]);

  // Handle cross-dashboard redirect
  useEffect(() => {
    if (userRole === 'planner' && token) {
      window.location.href = `http://localhost:3001/?token=${token}`;
    }
  }, [userRole, token]);

  async function handleAutoLogin(role: 'citizen' | 'planner') {
    setIsLoggingIn(true);
    try {
      const email = role === 'citizen' ? 'citizen1@hyderabad.local' : 'planner1@hyderabad.local';
      const password = role === 'citizen' ? 'citizen123' : 'planner123';
      
      const response = await fetch('http://127.0.0.1:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.detail || 'Login failed');
      }

      const decoded = decodeToken(result.access_token);
      if (!decoded) {
        throw new Error('Invalid session token received.');
      }

      localStorage.setItem('token', result.access_token);
      setToken(result.access_token);
      setUserRole(decoded.role);
      setUserEmail(decoded.sub);

      if (decoded.role === 'planner') {
        window.location.href = `http://localhost:3001/?token=${result.access_token}`;
      }
    } catch (err: any) {
      alert(err.message || 'Auto-login failed. Please ensure the backend is running.');
    } finally {
      setIsLoggingIn(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    setToken(null);
    setUserRole(null);
    setUserEmail(null);
  }

  function guessCategory(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('power') || lower.includes('electricity') || lower.includes('transformer') || lower.includes('load') || lower.includes('blackout') || lower.includes('light')) {
      return 'energy';
    }
    if (lower.includes('smoke') || lower.includes('dust') || lower.includes('air') || lower.includes('pollution') || lower.includes('pm25') || lower.includes('pm10') || lower.includes('smog') || lower.includes('emission')) {
      return 'pollution';
    }
    return 'traffic';
  }

  async function handleSubmit() {
    if (!description.trim()) {
      setStatus('Please enter a description of the issue.');
      return;
    }

    setIsSubmitting(true);
    setStatus('');
    setTrackingId(null);

    const formData = new FormData();
    formData.append('citizen_name', userEmail ? userEmail.split('@')[0] : 'Anonymous Citizen');
    formData.append('contact_email', userEmail || 'anonymous@hyderabad.local');
    formData.append('locality', currentLocation.locality);
    formData.append('category', guessCategory(description));
    formData.append('description', description);
    formData.append('severity', 'medium');

    try {
      const response = await fetch('http://127.0.0.1:8000/citizen/complaints', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.detail?.[0]?.msg || 'Submission failed');
      }

      setTrackingId(`HYD-${result.id}`);
      setDescription('');
      setPhotoAdded(false);
      setVideoAdded(false);
      fetchRecentComplaints(); // Refresh lists!
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  const cycleLocation = () => {
    setLocationIndex((prev) => (prev + 1) % HYD_LOCATIONS.length);
  };

  // SSR Safe Check
  if (!isMounted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></span>
          <span className="text-sm font-semibold">Loading Hyderabad Citizen Portal...</span>
        </div>
      </main>
    );
  }

  // Redirecting if role is planner
  if (userRole === 'planner') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-900 text-white relative">
        <div className="text-center p-8 bg-slate-800/80 border border-slate-700 rounded-2xl glass-panel max-w-md w-full shadow-2xl relative z-10 mx-4">
          <span className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-2xl mx-auto mb-4 animate-bounce">🔑</span>
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Redirecting to Planner</h1>
          <p className="text-sm text-slate-400 mb-6">You are authenticated as a Planner ({userEmail}). Redirecting to your workspace...</p>
          <div className="flex justify-center gap-3">
            <button onClick={handleLogout} className="px-4 py-2 border border-slate-600 rounded-md hover:bg-slate-700 text-sm cursor-pointer">
              Logout
            </button>
            <a href="http://localhost:3001" className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-md text-sm cursor-pointer">
              Go Now
            </a>
          </div>
        </div>
      </main>
    );
  }

  // Loading Sign In Screen
  if (isLoggingIn) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></span>
          <span className="text-sm font-semibold">Configuring and entering your workspace...</span>
        </div>
      </main>
    );
  }

  // Not Logged In screen
  if (!token || userRole !== 'citizen') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans">
        <div className="glow-orb glow-cyan" style={{ opacity: 0.15 }}></div>
        <div className="glow-orb glow-purple" style={{ opacity: 0.15 }}></div>

        <div className="w-full max-w-md p-6 relative z-10">
          <div className="bg-white/80 border border-slate-200 rounded-2xl p-8 shadow-xl glass-panel text-slate-800 text-center">
            <header className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 mb-3">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-700">Hyderabad Smart City</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Portal Entry</h1>
              <p className="text-sm text-slate-500 mt-1">Select your role to enter</p>
            </header>

            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => handleAutoLogin('citizen')}
                className="w-full flex items-center gap-4 p-4 border border-slate-200 hover:border-sky-500 rounded-xl bg-white hover:bg-sky-50/20 text-left transition cursor-pointer group"
              >
                <span className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-2xl group-hover:scale-110 transition shrink-0">👤</span>
                <div>
                  <h3 className="font-semibold text-slate-900 text-base">Enter as Citizen</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Report community hazards, view live ward complaints</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAutoLogin('planner')}
                className="w-full flex items-center gap-4 p-4 border border-slate-200 hover:border-indigo-500 rounded-xl bg-white hover:bg-indigo-50/20 text-left transition cursor-pointer group"
              >
                <span className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl group-hover:scale-110 transition shrink-0">💼</span>
                <div>
                  <h3 className="font-semibold text-slate-900 text-base">Enter as City Planner</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Analyze ward metrics, route interventions</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden mockup-container">
      <div className="glow-orb glow-cyan" style={{ opacity: 0.12 }}></div>
      <div className="glow-orb glow-purple" style={{ opacity: 0.12 }}></div>

      {/* Left Column: Form intake */}
      <div className="w-full lg:w-[40%] xl:w-[35%] flex flex-col justify-between p-6 lg:p-10 border-r border-[var(--border)] glass-panel relative z-10">
        <div className="flex flex-col gap-6">
          <header>
            <div className="flex justify-between items-start gap-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 mb-3">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-700">Hyderabad Citizen Portal</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs text-red-600 hover:text-red-800 font-semibold px-2.5 py-1 rounded border border-red-200 hover:bg-red-50 transition cursor-pointer"
              >
                Logout
              </button>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">Report a Local Hazard</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-2">
              Submit community issues (traffic bottleneck, pollution spike, energy hazard) and have them auto-routed to ward planners.
            </p>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">Authenticated as: {userEmail}</p>
          </header>

          <div className="glass-card border border-[var(--border)] rounded-xl p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-slate-700">Describe what's happening</label>
              <textarea
                rows={4}
                placeholder="E.g., Severe traffic backlog due to signal malfunction near the metro pillar..."
                className="w-full text-slate-900 border border-slate-200 rounded-md focus:border-[var(--border-accent)] focus:ring-1 focus:ring-[var(--border-accent)] bg-white/80"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-slate-700">Add attachments</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setPhotoAdded(!photoAdded); setStatus(''); }}
                  className="flex-1 cursor-pointer"
                  style={{ borderColor: photoAdded ? 'var(--border-accent)' : 'var(--border)', background: photoAdded ? 'rgba(56,189,248,0.1)' : '' }}
                >
                  <i className="ti ti-photo text-[16px] mr-1.5" aria-hidden="true"></i>
                  {photoAdded ? 'Photo Attached' : 'Attach Photo'}
                </button>
                <button
                  type="button"
                  onClick={() => { setVideoAdded(!videoAdded); setStatus(''); }}
                  className="flex-1 cursor-pointer"
                  style={{ borderColor: videoAdded ? 'var(--border-accent)' : 'var(--border)', background: videoAdded ? 'rgba(56,189,248,0.1)' : '' }}
                >
                  <i className="ti ti-video text-[16px] mr-1.5" aria-hidden="true"></i>
                  {videoAdded ? 'Video Attached' : 'Attach Video'}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-slate-700">Ward Locality Pin</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-white/60 border border-slate-200 rounded-md px-3 py-2 flex items-center gap-2 truncate">
                  <i className="ti ti-map-pin text-[16px] text-[var(--text-accent)] shrink-0" aria-hidden="true"></i>
                  <span className="text-[13px] text-[var(--text-secondary)] truncate">
                    {currentLocation.label}
                  </span>
                </div>
                <button type="button" onClick={cycleLocation} className="shrink-0 px-3 cursor-pointer">
                  <i className="ti ti-map-pin-cog text-[16px]" aria-hidden="true"></i>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="primary-btn w-full text-white font-semibold py-3 rounded-md transition disabled:opacity-50 mt-2 cursor-pointer"
            >
              {isSubmitting ? 'Submitting Report...' : 'Submit Report'}
            </button>
          </div>
        </div>

        <div className="mt-6">
          {status && (
            <p className="text-[13px] text-red-800 bg-red-50 p-3 rounded-md border border-red-200 text-center mb-3">
              {status}
            </p>
          )}

          {trackingId && (
            <div className="p-3.5 bg-[var(--bg-success)] rounded-md flex items-center gap-2.5 border border-emerald-200">
              <i className="ti ti-circle-check text-[18px] text-[var(--text-success)]" aria-hidden="true"></i>
              <span className="text-[13px] text-[var(--text-success)] font-medium">
                Tracking ID #{trackingId} · sent to your ward planner
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Full width dashboard/reports */}
      <div className="flex-1 p-6 lg:p-10 flex flex-col justify-start relative z-10 max-w-[1200px] mx-auto w-full">
        <header className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Live Ward Feeds</h2>
            <p className="text-sm text-[var(--text-secondary)]">Overview of reports submitted across municipal segments.</p>
          </div>
          <button type="button" onClick={fetchRecentComplaints} className="px-3.5 py-2 cursor-pointer">
            <i className="ti ti-refresh text-[15px] mr-1.5" aria-hidden="true"></i>Refresh
          </button>
        </header>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recentComplaints.length === 0 ? (
            <div className="md:col-span-2 xl:col-span-3 glass-card border border-[var(--border)] rounded-xl p-10 text-center">
              <i className="ti ti-folder-off text-[32px] text-[var(--text-muted)] mb-3 block" aria-hidden="true"></i>
              <p className="text-[15px] text-slate-800 font-medium">No complaints filed yet</p>
              <p className="text-[13px] text-[var(--text-secondary)] mt-1">Be the first to submit a community issue from the left panel.</p>
            </div>
          ) : (
            recentComplaints.map((item) => (
              <div key={item.id} className="glass-card border border-[var(--border)] rounded-xl p-4 flex flex-col justify-between gap-3 hover:border-slate-300 transition">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] font-semibold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-sky-700 font-mono">
                      #HYD-{item.id}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      item.category === 'energy' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                      item.category === 'pollution' ? 'bg-teal-50 text-teal-800 border border-teal-200' :
                      'bg-sky-50 text-sky-800 border border-sky-200'
                    }`}>
                      {item.category}
                    </span>
                  </div>
                  <p className="text-[13px] text-slate-700 leading-relaxed italic">
                    "Issue submitted by {item.citizen_name} under {item.severity} severity rating."
                  </p>
                </div>
                <div className="border-t border-slate-200 pt-2.5 flex justify-between items-center text-[12px] text-slate-600">
                  <div className="flex items-center gap-1">
                    <i className="ti ti-map-pin text-[13px] text-sky-600" aria-hidden="true"></i>
                    <span>{item.locality}</span>
                  </div>
                  <span className="capitalize text-slate-600">{item.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
