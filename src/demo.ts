export const demoHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AgentWatch Dashboard</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: { sans: ['Inter', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] }
                }
            }
        }
    </script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #05070a; --surface: rgba(13, 17, 23, 0.7); --surface-2: rgba(17, 24, 32, 0.8);
            --border: rgba(255, 255, 255, 0.08); --border-hover: rgba(255, 255, 255, 0.2);
            --text: #F0F6FC; --text-dim: #8B949E; --text-muted: #484F58;
            --accent: #58A6FF;
            --green: #3FB950; --red: #F85149; --amber: #D29922; --cyan: #39D2C0; --purple: #BC8CFF;
        }
        body { background: var(--bg); color: var(--text); font-family: 'Inter', system-ui, sans-serif; position: relative; }
        body::before { content: ""; position: fixed; inset: 0; background: radial-gradient(circle at 50% 0%, rgba(88,166,255,0.03), transparent 60%); z-index: -1; pointer-events: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: var(--bg); }
        ::-webkit-scrollbar-thumb { background: #1C2128; border-radius: 2px; }
        .stat-card { background: var(--surface); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid var(--border); border-radius: 12px; padding: 20px; transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), border-color 0.3s ease, box-shadow 0.3s ease; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
        .stat-card:hover { border-color: var(--border-hover); transform: translateY(-2px); box-shadow: 0 8px 30px rgba(88,166,255,0.05); }
        .data-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
        .data-table th { text-align: left; padding: 12px 14px; border-bottom: 1px solid var(--border); color: var(--text-muted); font-weight: 500; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; user-select: none; transition: color 0.2s; }
        .data-table th:hover { color: var(--text-dim); }
        .data-table td { padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.2s; }
        .data-table tr { transition: transform 0.2s ease, background 0.2s ease; }
        .data-table tbody tr:hover { transform: scale(1.005); }
        .data-table tbody tr:hover td { background: rgba(255,255,255,0.04); }
        .data-table tbody tr:hover td:first-child { border-top-left-radius: 6px; border-bottom-left-radius: 6px; }
        .data-table tbody tr:hover td:last-child { border-top-right-radius: 6px; border-bottom-right-radius: 6px; }
        .provider-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05); }
        .provider-openai { background: rgba(63,185,80,0.1); color: var(--green); border: 1px solid rgba(63,185,80,0.2); }
        .provider-anthropic { background: rgba(188,140,255,0.1); color: var(--purple); border: 1px solid rgba(188,140,255,0.2); }
        .provider-groq { background: rgba(88,166,255,0.1); color: var(--accent); border: 1px solid rgba(88,166,255,0.2); }
        .provider-xai { background: rgba(210,153,34,0.1); color: var(--amber); border: 1px solid rgba(210,153,34,0.2); }
        .provider-gemini { background: rgba(57,210,192,0.1); color: var(--cyan); border: 1px solid rgba(57,210,192,0.2); }
        .provider-azure { background: rgba(88,166,255,0.1); color: var(--accent); border: 1px solid rgba(88,166,255,0.2); }
        .provider-bedrock { background: rgba(255,153,0,0.1); color: #FF9900; border: 1px solid rgba(255,153,0,0.2); }
        .anomaly-card { background: var(--surface); backdrop-filter: blur(8px); border: 1px solid var(--border); border-radius: 10px; padding: 14px 18px; transition: transform 0.2s, box-shadow 0.2s; }
        .anomaly-card:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
        .anomaly-runaway { border-left: 3px solid var(--red); box-shadow: -4px 0 15px rgba(248,81,73,0.1); }
        .anomaly-warning { border-left: 3px solid var(--amber); box-shadow: -4px 0 15px rgba(210,153,34,0.1); }
        .chart-container { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; backdrop-filter: blur(12px); box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
        .bar-chart-bar { transition: height 0.8s cubic-bezier(0.16,1,0.3,1), opacity 0.3s; }
        .bar-chart-bar:hover { opacity: 0.8; }
        .loading { opacity: 0.5; pointer-events: none; transition: opacity 0.3s; }
        .sidebar-link { display: flex; align-items: center; padding: 8px 12px; border-radius: 6px; font-size: 13px; font-weight: 500; color: var(--text-dim); cursor: pointer; transition: all 0.2s ease; margin-bottom: 2px; }
        .sidebar-link:hover { color: var(--text); background: rgba(255,255,255,0.06); transform: translateX(2px); }
        .sidebar-link.active { color: var(--text); background: rgba(88,166,255,0.1); font-weight: 600; border-left: 2px solid var(--accent); padding-left: 10px; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseGlow { 0% { box-shadow: 0 0 0 0 rgba(63, 185, 80, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(63, 185, 80, 0); } 100% { box-shadow: 0 0 0 0 rgba(63, 185, 80, 0); } }
        .fade-in { animation: fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
        .pulse-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--green); animation: pulseGlow 2s infinite; }
    </style>
</head>
<body class="min-h-screen flex text-[13px] bg-[var(--bg)]">
    <!-- Sidebar -->
    <aside class="w-64 shrink-0 flex flex-col border-r border-[var(--border)] sticky top-0 h-screen" style="background:var(--surface);">
        <div class="h-14 flex items-center px-4 border-b border-[var(--border)]">
            <a href="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity" style="text-decoration:none;">
                <div class="logo-icon flex items-center justify-center rounded-lg" style="width:28px;height:28px;background:rgba(96,165,250,0.08);border:1px solid rgba(96,165,250,0.2);">
                    <svg width="18" height="18" viewBox="0 0 100 100" fill="white">
                        <path d="M50 12 L64 40 L36 40 Z"/>
                        <path d="M15 48 L48 48 L50 52 L52 48 L85 48 L85 60 L74 60 L86 84 L70 84 L58 60 L42 60 L30 84 L14 84 L26 60 L15 60 Z"/>
                    </svg>
                </div>
                <span class="font-bold tracking-tight text-white flex items-center text-sm">Agent<span style="color:var(--accent);">Watch</span></span>
            </a>
        </div>

        <div class="flex-1 overflow-y-auto px-3 pb-4 space-y-6">
            <div>
                <div class="px-2 mb-2 text-[11px] font-semibold tracking-wider uppercase" style="color:var(--text-muted);">Observe</div>
                <div class="space-y-0.5">
                    <div class="sidebar-link active" onclick="showTab('sessions',this)"><svg class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>Sessions</div>
                    <div class="sidebar-link" onclick="showTab('trend',this)"><svg class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>Spend Trend</div>
                    <div class="sidebar-link" onclick="showTab('providers',this)"><svg class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>Providers</div>
                    <div class="sidebar-link" onclick="showTab('teams',this)"><svg class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>Spend by Team</div>
                    <div class="sidebar-link" onclick="showTab('advancedAnalytics',this)"><svg class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>Advanced Analytics ✦</div>
                </div>
            </div>

            <div>
                <div class="px-2 mb-2 text-[11px] font-semibold tracking-wider uppercase" style="color:var(--text-muted);">Protect & Control</div>
                    <div class="sidebar-link" onclick="showTab('policies',this)"><svg class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>Policies ✦</div>
                    <div class="sidebar-link" onclick="showTab('anomalies',this)"><svg class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>Anomalies ✦</div>
                    <div class="sidebar-link" onclick="showTab('budgets',this)"><svg class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>Teams & Budgets ✦</div>
                    <div class="sidebar-link" onclick="showTab('keys',this)"><svg class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>Access Control ✦</div>
                    <div class="sidebar-link" onclick="showTab('audit',this)"><svg class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>Audit Logs ✦</div>
                    <div class="sidebar-link" onclick="showTab('enterprise',this)"><svg class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>Enterprise Hub ✦</div>
                </div>
            </div>
            
            <div>
                <div class="px-2 mb-2 text-[11px] font-semibold tracking-wider uppercase" style="color:var(--text-muted);">Account</div>
                <div class="space-y-0.5">
                    <div class="sidebar-link" onclick="showTab('billing',this)"><svg class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>Billing</div>
                    <div class="sidebar-link" onclick="showTab('settings',this)"><svg class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>Settings</div>
                </div>
            </div>
        </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0">
        <header class="h-14 flex items-center justify-between px-6 border-b border-[var(--border)] sticky top-0 z-50" style="background:rgba(5,7,10,0.85);backdrop-filter:blur(12px);">
            <div class="flex items-center gap-3">
                <span class="text-[10px] font-mono px-2 py-0.5 rounded" style="background:rgba(63,185,80,0.1);border:1px solid rgba(63,185,80,0.2);color:var(--green);">DEMO / <span id="currentSectionTitle">SESSIONS</span></span>
            </div>
            <div class="flex items-center gap-2 sm:gap-3">
                <span id="lastUpdated" class="hidden sm:inline text-[11px] font-mono" style="color:var(--text-muted);"></span>
                <span id="keyDisplay" class="hidden sm:inline text-[11px] font-mono px-2 py-1 rounded" style="background:rgba(255,255,255,0.05);border:1px solid var(--border);color:var(--text-muted);"></span>
                <button onclick="refreshAll()" class="text-[11px] sm:text-[12px] px-2 sm:px-3 py-1.5 rounded" style="background:rgba(255,255,255,0.05);border:1px solid var(--border);color:var(--text-dim);cursor:pointer;transition:background 0.2s;">Refresh</button>
            </div>
        </header>

        <div class="p-6 max-w-7xl mx-auto w-full">
            <!-- Summary Stats -->
            <div id="summaryGrid" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 fade-in">
                <div class="stat-card">
                    <div class="text-[11px] font-mono uppercase tracking-wider mb-2" style="color:var(--text-muted);">Total Spend</div>
                    <div class="text-2xl font-bold" style="color:var(--text);" id="statCost">--</div>
                </div>
                <div class="stat-card">
                    <div class="text-[11px] font-mono uppercase tracking-wider mb-2" style="color:var(--text-muted);">Requests</div>
                    <div class="text-2xl font-bold" style="color:var(--text);" id="statRequests">--</div>
                </div>
                <div class="stat-card">
                    <div class="text-[11px] font-mono uppercase tracking-wider mb-2" style="color:var(--text-muted);">Sessions</div>
                    <div class="text-2xl font-bold" style="color:var(--text);" id="statSessions">--</div>
                </div>
                <div class="stat-card">
                    <div class="text-[11px] font-mono uppercase tracking-wider mb-2" style="color:var(--text-muted);">Error Rate</div>
                    <div class="text-2xl font-bold" style="color:var(--text);" id="statErrors">--</div>
                </div>
            </div>

        <!-- Sessions Tab -->
        <div id="tab-sessions" class="fade-in">
            <div class="chart-container overflow-x-auto">
                <div class="flex items-center justify-between mb-4">
                    <div class="text-sm font-semibold">Session Cost Breakdown</div>
                    <div class="text-[11px] font-mono" style="color:var(--text-muted);">Last 7 days</div>
                </div>
                <table class="data-table" id="sessionsTable">
                    <thead>
                        <tr>
                            <th onclick="sortTable('sessionsTable',0)">Session</th>
                            <th onclick="sortTable('sessionsTable',1)">Team</th>
                            <th onclick="sortTable('sessionsTable',2)">Provider</th>
                            <th onclick="sortTable('sessionsTable',3)">Model</th>
                            <th onclick="sortTable('sessionsTable',4,'num')">Cost</th>
                            <th onclick="sortTable('sessionsTable',5,'num')">Requests</th>
                            <th onclick="sortTable('sessionsTable',6,'num')">Tokens</th>
                        </tr>
                    </thead>
                    <tbody id="sessionsBody">
                        <tr><td colspan="7" class="text-center py-8" style="color:var(--text-muted);">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Policies Tab -->
        <div id="tab-policies" class="hidden fade-in relative" style="min-height: 400px;">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-lg font-bold">Policy Enforcement</h2>
                    <p class="text-[13px] text-[var(--text-dim)]">Create rules to block or alert on specific requests.</p>
                </div>
                <button onclick="alert('Action disabled in demo mode.')" class="px-3 py-1.5 rounded text-sm font-semibold flex items-center gap-2" style="background:var(--accent);color:#080A12;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Create Policy
                </button>
            </div>
            
            <div class="chart-container overflow-x-auto">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Policy Name</th>
                            <th>Action</th>
                            <th>Condition</th>
                            <th>Created</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody id="policiesBody">
                        <tr><td colspan="5" class="text-center py-8" style="color:var(--text-muted);">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Anomalies Tab -->
        <div id="tab-anomalies" class="hidden fade-in">
            <div class="space-y-3" id="anomaliesList">
                <div class="text-center py-8" style="color:var(--text-muted);">Loading...</div>
            </div>
        </div>

        <!-- Spend Trend Tab -->
        <div id="tab-trend" class="hidden fade-in">
            <div class="chart-container">
                <div class="flex items-center justify-between mb-6">
                    <div class="text-sm font-semibold">Monthly Spend</div>
                </div>
                <div id="trendChart" class="flex items-end gap-2" style="height:200px;">
                    <div class="text-center w-full py-8" style="color:var(--text-muted);">Loading...</div>
                </div>
            </div>
        </div>

        <!-- Providers Tab -->
        <div id="tab-providers" class="hidden fade-in">
            <div class="chart-container overflow-x-auto">
                <table class="data-table" id="providersTable">
                    <thead>
                        <tr>
                            <th onclick="sortTable('providersTable',0)">Provider</th>
                            <th onclick="sortTable('providersTable',1)">Top Model</th>
                            <th onclick="sortTable('providersTable',2,'num')">Total Cost</th>
                            <th onclick="sortTable('providersTable',3,'num')">Requests</th>
                            <th onclick="sortTable('providersTable',4,'num')">Avg Latency</th>
                            <th onclick="sortTable('providersTable',5,'num')">Errors</th>
                        </tr>
                    </thead>
                    <tbody id="providersBody">
                        <tr><td colspan="6" class="text-center py-8" style="color:var(--text-muted);">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Teams Tab -->
        <div id="tab-teams" class="hidden fade-in">
            <div class="chart-container overflow-x-auto">
                <table class="data-table" id="teamsTable">
                    <thead>
                        <tr>
                            <th onclick="sortTable('teamsTable',0)">Team</th>
                            <th onclick="sortTable('teamsTable',1,'num')">Requests</th>
                            <th onclick="sortTable('teamsTable',2,'num')">Total Tokens</th>
                            <th onclick="sortTable('teamsTable',3,'num')">Total Cost</th>
                        </tr>
                    </thead>
                    <tbody id="teamsBody">
                        <tr><td colspan="4" class="text-center py-8" style="color:var(--text-muted);">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Team Budgets Tab -->
        <div id="tab-budgets" class="hidden fade-in">
            <div class="flex justify-between items-center mb-4">
                <div class="text-sm font-semibold">Registered Teams</div>
                <button onclick="alert('Demo mode: actions disabled')" class="px-3 py-1.5 rounded text-[12px] font-semibold border border-[var(--border)] hover:bg-[var(--surface-2)]">+ Create Team</button>
            </div>
            <div class="chart-container overflow-x-auto">
                <table class="data-table" id="manageTeamsTable">
                    <thead>
                        <tr>
                            <th onclick="sortTable('manageTeamsTable',0)">Team Name</th>
                            <th onclick="sortTable('manageTeamsTable',1)">Created At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="manageTeamsBody">
                        <tr><td colspan="3" class="text-center py-8" style="color:var(--text-muted);">No teams configured</td></tr>
                    </tbody>
                </table>
            </div>

            <div class="flex justify-between items-center mb-4 mt-8">
                <div class="text-sm font-semibold">Team Budgets</div>
                <button onclick="alert('Demo mode: actions disabled')" class="px-3 py-1.5 rounded text-[12px] font-semibold" style="background:var(--accent);color:#080A12;">+ Set Budget</button>
            </div>
            <div class="chart-container overflow-x-auto">
                <table class="data-table" id="budgetsTable">
                    <thead>
                        <tr>
                            <th onclick="sortTable('budgetsTable',0)">Team</th>
                            <th onclick="sortTable('budgetsTable',1,'num')">Budget (USD)</th>
                            <th onclick="sortTable('budgetsTable',2,'num')">Current Spend</th>
                            <th onclick="sortTable('budgetsTable',3,'num')">% Used</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="budgetsBody">
                        <tr><td colspan="5" class="text-center py-8" style="color:var(--text-muted);">No budgets configured</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Access Control Tab -->
        <div id="tab-keys" class="hidden fade-in">
            <div class="flex justify-between items-center mb-4">
                <div class="text-sm font-semibold">Developer Keys</div>
                <button onclick="alert('Demo mode: actions disabled')" class="px-3 py-1.5 rounded text-[12px] font-semibold" style="background:var(--accent);color:#080A12;">+ Generate Key</button>
            </div>
            <div class="chart-container overflow-x-auto">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Team ID</th>
                            <th>Key Prefix</th>
                            <th>Status</th>
                            <th>Created At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="keysBody">
                        <tr><td colspan="7" class="text-center py-8" style="color:var(--text-muted);">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        </div>

        <!-- Audit Logs Tab -->
        <div id="tab-audit" class="hidden fade-in relative">
            <div class="flex items-center justify-between mb-4">
                <div class="text-sm font-semibold">Audit Logs ✦</div>
                <button onclick="alert('Export disabled in demo mode.')" class="text-[11px] px-2 py-1 rounded border border-[var(--border)] hover:bg-[var(--surface)]">Export CSV</button>
            </div>
            <div class="chart-container overflow-x-auto">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Action</th>
                            <th>User/Agent</th>
                            <th>Resource</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="auditBody">
                        <tr><td colspan="5" class="text-center py-8" style="color:var(--text-muted);">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Advanced Analytics Tab -->
        <div id="tab-advancedAnalytics" class="hidden fade-in relative" style="min-height: 400px;">
            <div class="text-center py-16">
                <h3 class="text-xl font-bold mb-2">Advanced Analytics</h3>
                <p class="text-sm text-[var(--text-dim)] mb-6">Deep dive into token usage, latency distribution, and cost per million tokens.</p>
                <div class="inline-block p-4 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] text-sm">
                    Action disabled in demo mode. Analytics Demo.
                </div>
            </div>
        </div>

        <!-- Enterprise Hub Tab -->
        <div id="tab-enterprise" class="hidden fade-in relative" style="min-height: 400px;">
            <div class="text-center py-16">
                <h3 class="text-xl font-bold mb-2">Enterprise Hub</h3>
                <p class="text-sm text-[var(--text-dim)] mb-6">SSO/SAML configuration, dedicated support, and custom SLAs.</p>
                <div class="inline-block p-4 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] text-sm">
                    Action disabled in demo mode. Enterprise Demo to view.
                </div>
            </div>
        </div>

        <!-- Settings Tab -->
        <div id="tab-settings" class="hidden fade-in relative" style="min-height: 400px;">
            <div class="max-w-2xl">
                <h2 class="text-lg font-bold mb-6">Account Settings</h2>
                
                <div class="chart-container mb-6">
                    <h3 class="text-base font-bold mb-4">General</h3>
                    <div class="mb-4">
                        <label class="block text-xs font-mono text-[var(--text-muted)] mb-1">Company Name</label>
                        <input type="text" value="Demo Inc" disabled class="w-full bg-[rgba(0,0,0,0.2)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-dim)] cursor-not-allowed">
                    </div>
                </div>

                <div class="chart-container mb-6 relative overflow-hidden">
                    <h3 class="text-base font-bold mb-2">Security & Reliability</h3>
                    <p class="text-[13px] text-[var(--text-dim)] mb-6">Configure how AgentWatch handles infrastructure outages.</p>
                    <div class="space-y-4">
                        <label class="flex items-start gap-3 cursor-not-allowed opacity-70">
                            <input type="radio" checked disabled class="mt-1">
                            <div>
                                <div class="font-bold text-[13px] mb-1 text-[var(--text-bright)]">Fail Open (Uptime Priority)</div>
                                <div class="text-[12px] text-[var(--text-muted)]">If AgentWatch goes down, proxy requests directly to LLM providers. (Default)</div>
                            </div>
                        </label>
                        <label class="flex items-start gap-3 cursor-not-allowed opacity-70">
                            <input type="radio" disabled class="mt-1">
                            <div>
                                <div class="font-bold text-[13px] mb-1" style="color:var(--text-bright);">Fail Closed (Security Priority)</div>
                                <div class="text-[12px] text-[var(--text-muted)]">If AgentWatch goes down, block all requests to enforce budget limits.</div>
                            </div>
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <!-- Billing Tab -->
        <div id="tab-billing" class="hidden fade-in">
            <div class="flex justify-between items-center mb-6">
                <div class="text-sm font-semibold">Billing & Subscription</div>
                <div class="px-3 py-1.5 rounded-full text-[11px] font-mono border border-[var(--border)] bg-[rgba(255,255,255,0.02)] text-[var(--text-dim)]">Current Plan: <span id="currentPlan" class="text-white font-semibold">Free Tier</span></div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="chart-container relative overflow-hidden">
                    <h3 class="text-lg font-bold mb-2">Upgrade Plan</h3>
                    <p class="text-[13px] text-[var(--text-dim)] mb-6">Upgrade to the Pro tier for 500,000 requests/mo, caching.</p>
                    
                    <div class="border border-[var(--accent)] rounded-xl p-5 mb-6 relative overflow-hidden bg-[rgba(88,166,255,0.05)]">
                        <div class="flex justify-between items-center mb-4">
                            <div>
                                <h4 class="text-lg font-bold text-[var(--text)]">Pro Plan</h4>
                                <p class="text-xs text-[var(--text-muted)]">Billed monthly</p>
                            </div>
                            <div class="text-right">
                                <span class="text-2xl font-bold text-[var(--accent)]">$99</span>
                                <span class="text-xs text-[var(--text-muted)]">/mo</span>
                            </div>
                        </div>
                        <ul class="space-y-2 text-[13px] text-[var(--text-dim)]">
                            <li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg> 500,000 Requests / mo</li>
                            <li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg> Edge Prompt Caching</li>
                        </ul>
                    </div>

                    <div class="flex flex-col gap-3">
                        <button onclick="alert('Demo mode: payments disabled')" class="w-full py-3 rounded-lg text-sm font-bold transition-all" style="background:var(--accent);color:#080A12;">
                            Subscribe (Disabled in OSS)
                        </button>
                    </div>
                </div>

                <div class="chart-container">
                    <h3 class="text-sm font-semibold mb-4">Payment History</h3>
                    <div class="flex flex-col items-center justify-center h-40 text-center">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mb-3 opacity-30">
                            <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                            <line x1="2" y1="10" x2="22" y2="10"></line>
                        </svg>
                        <p class="text-[12px] text-[var(--text-dim)]">No recent payments found.</p>
                        <p class="text-[11px] text-[var(--text-muted)] mt-1">Your transaction history will appear here.</p>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <script>
    let currentTab = 'sessions';
    let sessionsData = [];
    const sectionTitles = {
        sessions: 'SESSIONS', trend: 'SPEND TREND', providers: 'PROVIDERS', teams: 'SPEND BY TEAM',
        anomalies: 'ANOMALIES', budgets: 'TEAMS & BUDGETS', keys: 'ACCESS CONTROL', audit: 'AUDIT LOGS', billing: 'BILLING'
    };

    function esc(str) {
        if (str == null) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    const AUTH_KEY = 'demo_mode';
    const display = document.getElementById('keyDisplay');
    if (display) { display.innerHTML = 'DEMO MODE'; display.style.color = 'var(--accent)'; }

    async function tryApi(path) {
        if (path.includes('/summary')) return { total_cost: 245.80, total_requests: 142050, total_sessions: 845, error_rate: 0.012 };
        if (path.includes('/sessions')) return [
            { session_id: 'sess_live_1a2b3c4d5e6f7g8h', team: 'Frontend', provider: 'openai', model: 'gpt-5.5', estimated_cost_usd: 12.45, request_count: 520, total_tokens: 1250000 },
            { session_id: 'sess_live_8h7g6f5e4d3c2b1a', team: 'Data Science', provider: 'anthropic', model: 'claude-sonnet-4.6', estimated_cost_usd: 4.20, request_count: 140, total_tokens: 450000 },
            { session_id: 'sess_live_qwe123asd456zxc7', team: 'Backend', provider: 'openai', model: 'gpt-5.4-mini', estimated_cost_usd: 28.90, request_count: 1200, total_tokens: 3800000 }
        ];
        if (path.includes('/anomalies')) return [
            { session_id: 'sess_live_qwe123asd456zxc7', alert_type: 'runaway_detected', team: 'Data Science', iteration_index: 45, growth_ratio: 3.5, request_started_at: new Date(Date.now() - 1800000).toISOString() },
            { session_id: 'sess_live_8h7g6f5e4d3c2b1a', alert_type: 'warning', team: 'Frontend', iteration_index: 12, growth_ratio: 1.8, request_started_at: new Date(Date.now() - 86400000).toISOString() }
        ];
        if (path.includes('/spend-trend')) return [
            { month: '2026-01', total_cost: 45.20 }, { month: '2026-02', total_cost: 82.50 }, { month: '2026-03', total_cost: 120.10 },
            { month: '2026-04', total_cost: 165.40 }, { month: '2026-05', total_cost: 210.80 }, { month: '2026-06', total_cost: 245.80 }
        ];
        if (path.includes('/providers')) return [
            { provider: 'openai', estimated_cost_usd: 180.50, model: 'gpt-5.5', request_count: 85000, avg_latency_ms: 450, error_count: 12 },
            { provider: 'anthropic', estimated_cost_usd: 45.20, model: 'claude-sonnet-4.6', request_count: 35000, avg_latency_ms: 380, error_count: 2 },
            { provider: 'gemini', estimated_cost_usd: 20.10, model: 'gemini-2.5-flash', request_count: 22050, avg_latency_ms: 310, error_count: 0 }
        ];
        if (path.includes('/keys')) return [
            { name: 'Production Proxy', role: 'admin', team_id: 'team_frontend', key_prefix: 'aw_live_prod...', status: 'active', created_at: new Date(Date.now() - 5000000000).toISOString() },
            { name: 'CI/CD Pipeline', role: 'developer', team_id: null, key_prefix: 'aw_live_ci...', status: 'active', created_at: new Date(Date.now() - 1000000000).toISOString() }
        ];
        if (path.includes('/teams')) return [
            { team: 'Frontend', request_count: 52000, total_tokens: 45000000, estimated_cost_usd: 120.40 },
            { team: 'Data Science', request_count: 14000, total_tokens: 89000000, estimated_cost_usd: 85.10 },
            { team: 'Marketing Agents', request_count: 8500, total_tokens: 12000000, estimated_cost_usd: 40.30 }
        ];
        if (path.includes('/audit')) return [
            { action: 'key_created', details: { name: 'CI/CD Pipeline', role: 'developer' }, created_at: new Date(Date.now() - 1000000000).toISOString() },
            { action: 'budget_updated', details: { team: 'Data Science', monthly_budget_usd: 500 }, created_at: new Date(Date.now() - 2000000000).toISOString() }
        ];
        return null;
    }

    function loadSummary() {
        return tryApi('/summary').then(data => {
            if (!data) return;
            document.getElementById('statCost').textContent = '$' + (data.total_cost || 0).toFixed(2);
            document.getElementById('statRequests').textContent = (data.total_requests || 0).toLocaleString();
            document.getElementById('statSessions').textContent = (data.total_sessions || 0).toLocaleString();
            document.getElementById('statErrors').textContent = ((data.error_rate || 0) * 100).toFixed(2) + '%';
        });
    }

    function loadSessions() {
        tryApi('/sessions').then(data => {
            sessionsData = Array.isArray(data) ? data : [];
            renderSessions(sessionsData);
        });
    }

    function renderSessions(data) {
        const tbody = document.getElementById('sessionsBody');
        if (!data.length) { tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8" style="color:var(--text-muted);">No sessions found</td></tr>'; return; }
        tbody.innerHTML = data.map(s => '<tr>'
            + '<td class="font-mono text-xs">' + esc((s.session_id || 'direct').slice(0, 16)) + '</td>'
            + '<td>' + esc(s.team || '-') + '</td>'
            + '<td><span class="provider-badge provider-' + esc(s.provider) + '">' + esc(s.provider) + '</span></td>'
            + '<td class="font-mono text-xs">' + esc(s.model || '-') + '</td>'
            + '<td class="font-mono font-semibold" style="color:var(--green);">$' + (s.estimated_cost_usd || 0).toFixed(4) + '</td>'
            + '<td class="font-mono">' + (s.request_count || 0) + '</td>'
            + '<td class="font-mono">' + (s.total_tokens || 0).toLocaleString() + '</td></tr>').join('');
    }

    function loadPolicies() {
        const tbody = document.getElementById('policiesBody');
        tbody.innerHTML = '<tr><td class="font-medium">Block gpt-5.5 series</td><td><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-900/30 text-red-400">BLOCK</span></td><td class="font-mono text-xs" style="color:var(--text-dim);">model == "gpt-5.5"</td><td class="text-xs" style="color:var(--text-muted);">2 days ago</td><td><button onclick="alert(&quot;Action disabled in demo mode.&quot;)" class="text-xs text-[var(--red)] hover:underline opacity-50 cursor-not-allowed">Delete</button></td></tr>' +
                          '<tr><td class="font-medium">Block anthropic</td><td><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-900/30 text-red-400">BLOCK</span></td><td class="font-mono text-xs" style="color:var(--text-dim);">provider == "anthropic"</td><td class="text-xs" style="color:var(--text-muted);">1 week ago</td><td><button onclick="alert(&quot;Action disabled in demo mode.&quot;)" class="text-xs text-[var(--red)] hover:underline opacity-50 cursor-not-allowed">Delete</button></td></tr>' +
                          '<tr><td class="font-medium">Alert on expensive</td><td><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-900/30 text-amber-400">ALERT</span></td><td class="font-mono text-xs" style="color:var(--text-dim);">model == "gpt-5.5-pro"</td><td class="text-xs" style="color:var(--text-muted);">1 month ago</td><td><button onclick="alert(&quot;Action disabled in demo mode.&quot;)" class="text-xs text-[var(--red)] hover:underline opacity-50 cursor-not-allowed">Delete</button></td></tr>';
        return Promise.resolve();
    }

    function loadAnomalies() {
        tryApi('/anomalies').then(data => {
            const list = Array.isArray(data) ? data : [];
            const el = document.getElementById('anomaliesList');
            if (!list.length) { el.innerHTML = '<div class="text-center py-8" style="color:var(--text-muted);">No anomalies detected</div>'; return; }
            el.innerHTML = list.map(a => '<div class="anomaly-card anomaly-' + (a.alert_type === 'runaway_detected' ? 'runaway' : 'warning') + '">'
                + '<div class="flex items-center justify-between"><div class="flex items-center gap-3">'
                + '<span class="text-xs font-mono font-semibold" style="color:' + (a.alert_type === 'runaway_detected' ? 'var(--red)' : 'var(--amber)') + ';">' + (a.alert_type === 'runaway_detected' ? 'RUNAWAY' : 'WARNING') + '</span>'
                + '<span class="font-mono text-xs">' + esc((a.session_id || '').slice(0, 16)) + '</span>'
                + '<span class="text-xs" style="color:var(--text-muted);">' + esc(a.team || '') + '</span></div>'
                + '<div class="text-right"><div class="text-xs font-mono" style="color:var(--text-muted);">iter ' + a.iteration_index + ' · ' + a.growth_ratio + 'x growth</div>'
                + '<div class="text-[10px] font-mono" style="color:var(--text-muted);">' + new Date(a.request_started_at).toLocaleString() + '</div></div></div></div>').join('');
        });
    }

    function loadTrend() {
        tryApi('/spend-trend').then(data => {
            const months = Array.isArray(data) ? data : [];
            const el = document.getElementById('trendChart');
            const maxCost = Math.max(...months.map(m => m.total_cost || 0), 0.01);
            el.innerHTML = months.map(m => {
                const h = Math.max(4, ((m.total_cost || 0) / maxCost) * 180);
                return '<div class="flex flex-col items-center gap-1 flex-1">'
                    + '<div class="text-[10px] font-mono font-semibold" style="color:var(--green);">$' + (m.total_cost || 0).toFixed(2) + '</div>'
                    + '<div class="bar-chart-bar w-full rounded-t" style="height:' + h + 'px;background:var(--accent);min-width:20px;max-width:40px;"></div>'
                    + '<div class="text-[10px] font-mono" style="color:var(--text-muted);">' + m.month.slice(5) + '</div></div>';
            }).join('');
        });
    }

    function loadProviders() {
        tryApi('/providers').then(data => {
            const providers = Array.isArray(data) ? data : [];
            const tbody = document.getElementById('providersBody');
            if (!providers.length) { tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8" style="color:var(--text-muted);">No provider data</td></tr>'; return; }
            tbody.innerHTML = providers.map(p => '<tr>'
                + '<td><span class="provider-badge provider-' + esc(p.provider) + '">' + esc(p.provider) + '</span></td>'
                + '<td><span class="text-xs font-mono" style="color:var(--text-dim);">' + esc(p.model || '-') + '</span></td>'
                + '<td><span class="font-mono text-xs font-semibold" style="color:var(--green);">$' + (p.estimated_cost_usd || 0).toFixed(4) + '</span></td>'
                + '<td><span class="font-mono text-sm">' + (p.request_count || 0) + '</span></td>'
                + '<td><span class="font-mono text-sm">' + (p.avg_latency_ms || 0) + 'ms</span></td>'
                + '<td><span class="font-mono text-sm" style="color:' + ((p.error_count || 0) > 0 ? 'var(--red)' : 'var(--green)') + ';">' + (p.error_count || 0) + '</span></td></tr>').join('');
        });
    }

    function loadTeams() {
        tryApi('/teams').then(data => {
            const teams = Array.isArray(data) ? data : [];
            const tbody = document.getElementById('teamsBody');
            if (!teams.length) { tbody.innerHTML = '<tr><td colspan="4" class="text-center py-8" style="color:var(--text-muted);">No team data</td></tr>'; return; }
            tbody.innerHTML = teams.map(t => '<tr>'
                + '<td><span class="font-mono text-xs font-semibold" style="color:var(--accent);">' + esc(t.team) + '</span></td>'
                + '<td><span class="font-mono text-sm">' + (t.request_count || 0) + '</span></td>'
                + '<td><span class="font-mono text-sm">' + (t.total_tokens || 0).toLocaleString() + '</span></td>'
                + '<td><span class="font-mono text-xs font-semibold" style="color:var(--green);">$' + (t.estimated_cost_usd || 0).toFixed(4) + '</span></td></tr>').join('');
        });
    }

    function loadKeys() {
        return tryApi('/keys').then(data => {
            const keys = Array.isArray(data) ? data : [];
            const tbody = document.getElementById('keysBody');
            if (!keys.length) { tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8" style="color:var(--text-muted);">No developer keys found</td></tr>'; return; }
            tbody.innerHTML = keys.map(k => '<tr>'
                + '<td><div class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg> <span class="font-semibold">' + esc(k.name) + '</span></div></td>'
                + '<td><span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded ' + (k.role === 'admin' ? 'bg-purple-900/30 text-purple-400' : 'bg-blue-900/30 text-blue-400') + '">' + esc(k.role) + '</span></td>'
                + '<td><span class="font-mono text-xs font-semibold ' + (k.team_id ? 'text-[var(--cyan)]' : 'text-[var(--text-muted)]') + '">' + (k.team_id ? esc(k.team_id) : 'Global') + '</span></td>'
                + '<td><span class="font-mono text-xs text-[var(--text-muted)]">' + esc(k.key_prefix) + '</span></td>'
                + '<td><span class="text-xs text-[var(--green)]">' + esc(k.status) + '</span></td>'
                + '<td><span class="text-xs text-[var(--text-muted)]">' + new Date(k.created_at).toLocaleDateString() + '</span></td>'
                + '<td><button onclick="alert(&quot;Demo mode: actions disabled&quot;)" class="text-xs text-[var(--red)] hover:underline opacity-50 cursor-not-allowed">Revoke</button></td></tr>').join('');
        });
    }

    function showTab(tab, el) {
        document.querySelectorAll('[id^="tab-"]').forEach(t => t.classList.add('hidden'));
        document.querySelectorAll('.sidebar-link').forEach(t => t.classList.remove('active'));
        document.getElementById('tab-' + tab).classList.remove('hidden');
        el.classList.add('active');
        currentTab = tab;
        document.getElementById('currentSectionTitle').textContent = sectionTitles[tab] || tab.toUpperCase();
    }

    function sortTable(tableId, colIdx, type) {
        const table = document.getElementById(tableId);
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const dir = table.dataset.sortDir === 'asc' ? 'desc' : 'asc';
        table.dataset.sortDir = dir;
        rows.sort((a, b) => {
            let va = a.cells[colIdx]?.textContent?.trim() || '';
            let vb = b.cells[colIdx]?.textContent?.trim() || '';
            if (type === 'num') { va = parseFloat(va.replace(/[$,]/g, '')) || 0; vb = parseFloat(vb.replace(/[$,]/g, '')) || 0; }
            if (dir === 'asc') return va > vb ? 1 : -1;
            return va < vb ? 1 : -1;
        });
        rows.forEach(r => tbody.appendChild(r));
    }

    function loadAuditLogs() {
        const tbody = document.getElementById('auditBody');
        tbody.innerHTML = '<tr><td class="font-mono text-xs text-[var(--text-dim)]">Just now</td><td><span class="text-[11px] font-bold px-2 py-0.5 rounded bg-[var(--surface-2)]">policy_created</span></td><td class="text-xs font-mono">dashboard_user</td><td class="text-xs font-mono">rule_block_gpt4</td><td class="text-xs" style="color:var(--text-muted);">{"action":"block"}</td></tr>' +
                          '<tr><td class="font-mono text-xs text-[var(--text-dim)]">2 hours ago</td><td><span class="text-[11px] font-bold px-2 py-0.5 rounded bg-[var(--surface-2)]">key_created</span></td><td class="text-xs font-mono">dashboard_user</td><td class="text-xs font-mono">key_frontend_prod</td><td class="text-xs" style="color:var(--text-muted);">{"role":"developer"}</td></tr>' +
                          '<tr><td class="font-mono text-xs text-[var(--text-dim)]">Yesterday</td><td><span class="text-[11px] font-bold px-2 py-0.5 rounded bg-[var(--surface-2)]">anomaly_detected</span></td><td class="text-xs font-mono">system</td><td class="text-xs font-mono">sess_abc123</td><td class="text-xs" style="color:var(--text-muted);">{"reason":"Agent exceeded 50 requests"}</td></tr>';
        return Promise.resolve();
    }

    function refreshAll() {
        document.getElementById('lastUpdated').textContent = 'Refreshing...';
        Promise.all([loadSummary(), loadSessions(), loadTrend(), loadProviders(), loadTeams(), loadPolicies(), loadAnomalies(), loadKeys(), loadAuditLogs()])
            .then(() => { document.getElementById('lastUpdated').textContent = 'Updated ' + new Date().toLocaleTimeString(); })
            .catch(() => { document.getElementById('lastUpdated').textContent = 'Refresh failed'; });
    }

    refreshAll();
    setInterval(refreshAll, 60000);
    </script>
</body>
</html>`;
