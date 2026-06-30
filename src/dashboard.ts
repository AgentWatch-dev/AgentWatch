import { EXACT_MATCH_PRICING } from "./pricing";

const allModels = Object.keys(EXACT_MATCH_PRICING).filter(k => k !== "default").sort();
const modelOptions = allModels.map(m => `<option value="${m}">${m}</option>`).join('\n                            ');

export const dashboardHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AgentWatch Dashboard</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: { sans: ['Inter', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] }
                }
            }
        }
    </script>
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"></noscript>
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
        
        body.pro-theme {
            --accent: #D29922; /* Premium Gold */
        }
        body.pro-theme .stat-card {
            background: linear-gradient(180deg, rgba(210,153,34,0.03) 0%, rgba(13,17,23,0) 100%);
            border-color: rgba(210,153,34,0.15);
        }
        body.pro-theme .stat-card:hover {
            border-color: rgba(210,153,34,0.4);
            box-shadow: 0 4px 24px rgba(210,153,34,0.08);
            transform: translateY(-2px);
        }
        body.pro-theme header {
            border-bottom: 1px solid rgba(210,153,34,0.2) !important;
            box-shadow: 0 4px 30px rgba(210,153,34,0.05);
        }
        body.pro-theme .logo-icon {
            background: rgba(210,153,34,0.1) !important;
            border: 1px solid rgba(210,153,34,0.3) !important;
        }
        body.pro-theme .pro-badge {
            display: inline-flex !important;
        }
        body.enterprise-theme {
            --accent: #A855F7; /* Premium Purple */
        }
        body.enterprise-theme .stat-card {
            background: linear-gradient(180deg, rgba(168,85,247,0.03) 0%, rgba(13,17,23,0) 100%);
            border-color: rgba(168,85,247,0.2);
        }
        body.enterprise-theme .stat-card:hover {
            border-color: rgba(168,85,247,0.5);
            box-shadow: 0 4px 24px rgba(168,85,247,0.15);
            transform: translateY(-2px);
        }
        body.enterprise-theme header {
            border-bottom: 1px solid rgba(168,85,247,0.3) !important;
            box-shadow: 0 4px 30px rgba(168,85,247,0.1);
        }
        body.enterprise-theme .logo-icon {
            background: rgba(168,85,247,0.15) !important;
            border: 1px solid rgba(168,85,247,0.4) !important;
        }
        body.enterprise-theme .pro-badge {
            display: inline-flex !important;
            background: rgba(168,85,247,0.15) !important;
            border: 1px solid rgba(168,85,247,0.4) !important;
            color: #A855F7 !important;
        }
        .pro-badge { display: none; }
        body:not(.pro-theme) .pro-feature { display: none !important; }
    </style>
</head>
<body class="min-h-screen flex flex-col md:flex-row text-[13px] bg-[var(--bg)]">
    <!-- Sidebar -->
    <aside class="w-full md:w-64 shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-[var(--border)] relative md:sticky top-0 md:h-screen h-auto z-40" style="background:var(--surface);">
        <div class="h-14 flex items-center justify-between px-4 border-b border-[var(--border)]">
            <a href="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity" style="text-decoration:none;">
                <div class="logo-icon flex items-center justify-center rounded-lg" style="width:28px;height:28px;background:rgba(96,165,250,0.08);border:1px solid rgba(96,165,250,0.2);">
                    <svg width="18" height="18" viewBox="0 0 100 100" fill="white">
                        <path d="M50 12 L64 40 L36 40 Z"/>
                        <path d="M15 48 L48 48 L50 52 L52 48 L85 48 L85 60 L74 60 L86 84 L70 84 L58 60 L42 60 L30 84 L14 84 L26 60 L15 60 Z"/>
                    </svg>
                </div>
                <span class="font-bold tracking-tight text-white flex items-center text-sm">
                    Agent<span style="color:var(--accent);">Watch</span>
                    
                </span>
            </a>
            <button onclick="document.getElementById('sidebarMenu').classList.toggle('hidden')" class="md:hidden p-2 text-[var(--text-muted)] hover:text-white transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
        </div>

        <div id="sidebarMenu" class="hidden md:block flex-1 overflow-y-auto px-3 py-4 md:py-0 md:pb-4 space-y-6">
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
                <div class="space-y-0.5">
                    <div class="sidebar-link" onclick="showTab('policies',this)"><svg class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>Policies ✦</div>
                    <div class="sidebar-link" onclick="showTab('anomalies',this)"><svg class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>Anomalies ✦</div>
                    <div class="sidebar-link" onclick="showTab('budgets',this)"><svg class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>Teams & Budgets ✦</div>
                    <div class="sidebar-link" onclick="showTab('keys',this)"><svg class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>Access Control ✦</div>
                    <div class="sidebar-link" onclick="showTab('audit',this)"><svg class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>Audit Logs ✦</div>
                    <div class="sidebar-link" onclick="showTab('enterprise',this)" style="display:none" id="enterpriseTab"><svg class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>Enterprise Hub ✦</div>
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
        <header class="h-14 flex items-center justify-between px-6 border-b border-[var(--border)] sticky top-0 z-50" style="background:rgba(8,10,18,0.95);backdrop-filter:blur(12px);">
            <div class="flex items-center gap-3">
                <span class="text-[10px] font-mono px-2 py-0.5 rounded" style="background:rgba(63,185,80,0.1);border:1px solid rgba(63,185,80,0.2);color:var(--green);">DASHBOARD / <span id="currentSectionTitle">SESSIONS</span></span>
            </div>
            <div class="flex items-center gap-2 sm:gap-3">
                <span id="lastUpdated" class="hidden sm:inline text-[11px] font-mono" style="color:var(--text-muted);"></span>
                <span id="keyDisplay" class="hidden sm:inline text-[11px] font-mono px-2 py-1 rounded" style="background:rgba(255,255,255,0.05);border:1px solid var(--border);color:var(--text-muted);"></span>
                <button id="logoutBtn" onclick="logout()" class="text-[11px] sm:text-[12px] px-2 sm:px-3 py-1.5 rounded" style="background:rgba(248,81,73,0.1);border:1px solid rgba(248,81,73,0.2);color:var(--red);cursor:pointer;">Sign Out</button>
                <button onclick="refreshAll()" class="text-[11px] sm:text-[12px] px-2 sm:px-3 py-1.5 rounded" style="background:rgba(255,255,255,0.05);border:1px solid var(--border);color:var(--text-dim);cursor:pointer;">Refresh</button>
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
                <button onclick="document.getElementById('createPolicyModal').classList.remove('hidden')" class="px-3 py-1.5 rounded text-sm font-semibold flex items-center gap-2" style="background:var(--accent);color:#080A12;">
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

        <!-- Create Policy Modal -->
        <div id="createPolicyModal" class="hidden fixed inset-0 z-50 flex items-center justify-center fade-in" style="background:rgba(5,7,10,0.85);backdrop-filter:blur(8px);">
            <div class="stat-card w-full max-w-md transform transition-all scale-95 origin-center" style="animation: fadeInUp 0.3s cubic-bezier(0.16,1,0.3,1) forwards;">
                <h3 class="text-lg font-bold mb-4">Create New Policy</h3>
                <div class="mb-4">
                    <label class="block text-[12px] font-mono text-[var(--text-muted)] mb-1">Policy Name</label>
                    <input type="text" id="newPolicyName" placeholder="e.g. Block expensive models" class="w-full bg-[var(--surface)] border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" style="color:var(--text-bright); background: rgba(0,0,0,0.2);">
                </div>
                <div class="mb-4">
                    <label class="block text-[12px] font-mono text-[var(--text-muted)] mb-1">Match Model (Optional)</label>
                    <select id="newPolicyModel" class="w-full bg-[var(--surface)] border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" style="color:var(--text-bright); background: rgba(0,0,0,0.2);">
                        <option value="">Any Model (Apply to all)</option>
                        ${modelOptions}
                    </select>
                </div>
                
                    
                    <div class="mt-4 flex justify-end">
                        <button onclick="saveSettings('security', this)" class="px-4 py-2 rounded text-sm font-semibold transition-all" style="background:var(--accent);color:#080A12;">Save Security Policy</button>
                    </div>
                </div>

                <!-- Performance -->
                <div class="chart-container relative overflow-hidden">
                    <h3 class="text-base font-bold mb-2">Performance</h3>
                    <p class="text-[13px] text-[var(--text-dim)] mb-4">Optimize response times with edge caching.</p>
                    
                    <div class="mb-4">
                        <label class="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" id="cacheEnabled" class="w-4 h-4 accent-[var(--accent)]">
                            <div>
                                <span class="text-sm font-medium">Edge Prompt Caching</span>
                                
                                <p class="text-xs text-[var(--text-muted)] mt-0.5">Cache identical prompts at the edge for faster responses and lower costs.</p>
                            </div>
                        </label>
                    </div>

                    <div class="mt-4 flex justify-end">
                        <button onclick="saveSettings('performance', this)" class="px-4 py-2 rounded text-sm font-semibold transition-all" style="background:var(--accent);color:#080A12;">Save Performance Settings</button>
                    </div>
                </div>

                <!-- Global Alert Preferences -->
                <div class="chart-container relative overflow-hidden">
                    <h3 class="text-base font-bold mb-2">Global Alert Preferences</h3>
                    <p class="text-[13px] text-[var(--text-dim)] mb-4">Configure default thresholds and where you want to receive notifications.</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block text-[12px] font-mono text-[var(--text-muted)] mb-1">Alert Email Address</label>
                            <input type="email" id="alertEmail" placeholder="team@company.com" class="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" style="color:var(--text-bright);">
                        </div>
                        <div>
                            <label class="block text-[12px] font-mono text-[var(--text-muted)] mb-1">Default Warning Threshold (%)</label>
                            <input type="number" id="alertThreshold" placeholder="80" class="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" style="color:var(--text-bright);">
                        </div>
                    </div>

                    <div class="mb-4">
                        <label class="block text-[12px] font-mono text-[var(--text-muted)] mb-1">Slack Webhook URL </label>
                        <input type="text" id="slackWebhookUrl" placeholder="https://hooks.slack.com/services/..." class="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" style="color:var(--text-bright);">
                    </div>

                    <div class="flex gap-3">
                        <button onclick="saveSettings('alerts', this)" class="px-4 py-2 rounded text-sm font-semibold transition-all" style="background:var(--accent);color:#080A12;">Save Alert Settings</button>
                    </div>
                </div>

                <!-- Data & Privacy -->
                <div class="chart-container relative overflow-hidden">
                    <h3 class="text-base font-bold mb-2">Data & Privacy</h3>
                    <p class="text-[13px] text-[var(--text-dim)] mb-4">Manage how long your session logs and metadata are retained.</p>
                    
                    <div class="mb-6">
                        <label class="block text-[12px] font-mono text-[var(--text-muted)] mb-2">Data Retention Policy </label>
                        <select id="dataRetention" class="w-full md:w-1/2 bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" style="color:var(--text-bright);">
                            <option value="0">Zero Data Retention (Log metadata only)</option>
                            <option value="7">7 Days</option>
                            <option value="30">30 Days</option>
                        </select>
                    </div>

                    <div class="flex gap-3">
                        <button onclick="saveSettings('privacy', this)" class="px-4 py-2 rounded text-sm font-semibold transition-all" style="background:var(--accent);color:#080A12;">Save Privacy Policy</button>
                        <button onclick="exportData(this)" class="px-4 py-2 rounded text-sm text-[var(--text-dim)] hover:text-[var(--text)] border border-[var(--border)] bg-[rgba(255,255,255,0.02)] transition-all flex items-center gap-2">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            Export Session Logs
                        </button>
                    </div>
                </div>

                <!-- Danger Zone -->
                <div class="chart-container relative overflow-hidden border-red-900/30">
                    <h3 class="text-base font-bold mb-2" style="color:var(--red);">Danger Zone</h3>
                    <p class="text-[13px] text-[var(--text-dim)] mb-6">Destructive actions for your workspace.</p>
                    
                    <div class="flex flex-col gap-4">
                        <div class="flex items-center justify-between p-4 rounded-lg border border-red-900/20 bg-red-900/5">
                            <div>
                                <div class="font-semibold text-sm" style="color:var(--red);">Reset Workspace Data</div>
                                <div class="text-xs mt-1" style="color:var(--text-muted);">Permanently delete all session logs, analytics, and spending history. API Keys and Teams will remain.</div>
                            </div>
                            <button onclick="dangerAction(this, 'Data reset')" class="px-4 py-2 rounded text-sm font-semibold border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-all whitespace-nowrap">Reset Data</button>
                        </div>

                        <div class="flex items-center justify-between p-4 rounded-lg border border-red-900/20 bg-red-900/5">
                            <div>
                                <div class="font-semibold text-sm" style="color:var(--red);">Delete Workspace</div>
                                <div class="text-xs mt-1" style="color:var(--text-muted);">Permanently delete this workspace and all associated data. This action cannot be undone.</div>
                            </div>
                            <button onclick="dangerAction(this, 'Workspace deleted')" class="px-4 py-2 rounded text-sm font-semibold border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-all whitespace-nowrap">Delete Workspace</button>
                        </div>
                    </div>
                </div>

            </div>
            <div id="settingsStatus" class="mt-4 text-xs font-mono h-4 text-center"></div>
        </div>
    </main>

    <!-- Key Generation Modal -->
    <div id="keyModal" class="hidden fixed inset-0 z-50 flex items-center justify-center" style="background:rgba(8,10,18,0.8);backdrop-filter:blur(4px);">
        <div class="stat-card w-full max-w-md">
            <h3 class="text-lg font-bold mb-4">Generate Developer Key</h3>
            <div class="mb-4">
                <label class="block text-[12px] font-mono text-[var(--text-muted)] mb-1">Key Name</label>
                <input type="text" id="newKeyName" placeholder="e.g. CI/CD Agent" class="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]">
            </div>
            <div class="mb-4">
                <label class="block text-[12px] font-mono text-[var(--text-muted)] mb-1">Role</label>
                <select id="newKeyRole" class="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]">
                    <option value="developer">Developer</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
            <div class="mb-6">
                <label class="block text-[12px] font-mono text-[var(--text-muted)] mb-1">Team ID (Optional)</label>
                <select id="newKeyTeam" class="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]">
                    <option value="" selected>Global (No Team)</option>
                </select>
                <p class="text-[10px] text-[var(--text-muted)] mt-1">If set, API requests using this key will be strictly scoped to this team, overriding client headers.</p>
            </div>
            <div class="flex justify-end gap-3">
                <button onclick="document.getElementById('keyModal').classList.add('hidden')" class="px-4 py-2 rounded text-sm text-[var(--text-dim)] hover:text-[var(--text)]">Cancel</button>
                <button onclick="generateKey()" class="px-4 py-2 rounded text-sm font-semibold" style="background:var(--accent);color:#080A12;">Generate</button>
            </div>
        </div>
    </div>
    
    <!-- Budget Modal -->
    <div id="budgetModal" class="hidden fixed inset-0 z-50 flex items-center justify-center" style="background:rgba(8,10,18,0.8);backdrop-filter:blur(4px);">
        <div class="stat-card w-full max-w-md">
            <h3 class="text-lg font-bold mb-4">Set Team Budget</h3>
            <div class="mb-4">
                <label class="block text-[12px] font-mono text-[var(--text-muted)] mb-1">Team Name</label>
                <select id="bTeamName" class="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]">
                    <option value="" disabled selected>Select a team...</option>
                </select>
            </div>
            <div class="mb-4">
                <label class="block text-[12px] font-mono text-[var(--text-muted)] mb-1">Monthly Budget (USD)</label>
                <input type="number" id="bMonthlyUsd" placeholder="500.00" step="0.01" class="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]">
            </div>
            <div class="mb-4">
                <label class="block text-[12px] font-mono text-[var(--text-muted)] mb-1">Alert Threshold (%)</label>
                <input type="number" id="bAlertPct" placeholder="80" value="80" class="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]">
            </div>
            <div class="mb-6 flex items-center gap-2">
                <input type="checkbox" id="bHardStop" class="rounded bg-[var(--surface-2)] border border-[var(--border)]">
                <label for="bHardStop" class="text-[12px] font-mono text-[var(--text-muted)]">Enable Hard Stop (Enforce limit at edge)</label>
            </div>
            <div class="flex justify-end gap-3">
                <button onclick="document.getElementById('budgetModal').classList.add('hidden')" class="px-4 py-2 rounded text-sm text-[var(--text-dim)] hover:text-[var(--text)]">Cancel</button>
                <button onclick="saveTeamBudget()" class="px-4 py-2 rounded text-sm font-semibold" style="background:var(--accent);color:#080A12;">Save Budget</button>
            </div>
        </div>
    </div>
    
    <!-- Token Display Modal -->
    <div id="tokenModal" class="hidden fixed inset-0 z-50 flex items-center justify-center" style="background:rgba(8,10,18,0.8);backdrop-filter:blur(4px);">
        <div class="stat-card w-full max-w-md">
            <h3 class="text-lg font-bold mb-2">Key Generated Successfully</h3>
            <p class="text-sm text-[var(--amber)] mb-4 font-semibold">Copy this key now. You won't be able to see it again.</p>
            <div class="mb-6 p-3 rounded font-mono text-sm break-all" style="background:var(--surface-2);border:1px solid var(--border);" id="newTokenDisplay"></div>
            <div class="flex justify-end">
                <button onclick="document.getElementById('tokenModal').classList.add('hidden')" class="px-4 py-2 rounded text-sm font-semibold" style="background:var(--surface-2);border:1px solid var(--border);">Done</button>
            </div>
        </div>
    </div>

    <script>
    let currentTab = 'sessions';

    // HTML escape function to prevent XSS
    function esc(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(new RegExp(String.fromCharCode(60), 'g'), '&lt;')
            .replace(new RegExp(String.fromCharCode(62), 'g'), '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    let sessionsData = [];
    let AUTH_KEY = localStorage.getItem('agentwatch_key') || '';

    // Redirect to /login if no key
    if (!AUTH_KEY) {
        window.location.href = '/login';
    }

    window.logout = function() {
        localStorage.removeItem('agentwatch_key');
        window.location.href = '/login';
    };

    document.getElementById('logoutBtn')?.addEventListener('click', window.logout);

    // Show masked key in nav
    if (AUTH_KEY) {
        const display = document.getElementById('keyDisplay');
        if (display) {
            display.textContent = AUTH_KEY.slice(0, 10) + '...' + AUTH_KEY.slice(-4);
            display.classList.remove('hidden');
        }
    }

    // Global state for team dropdown
    window.availableTeams = new Set();
    window.updateTeamDropdown = function() {
        const selects = document.querySelectorAll('#bTeamName, #newKeyTeam');
        selects.forEach(select => {
            if (!select) return;
            const currentVal = select.value;
            const isKeyModal = select.id === 'newKeyTeam';
            
            select.innerHTML = isKeyModal ? '<option value="">Global (No Team)</option>' : '<option value="" disabled selected>Select a team...</option>';
            
            if (window.availableTeams.size === 0 && !isKeyModal) {
                select.innerHTML += '<option value="" disabled>No teams found. Create a team first.</option>';
            } else {
                Array.from(window.availableTeams).sort().forEach(t => {
                    const opt = document.createElement('option');
                    opt.value = t;
                    opt.textContent = t;
                    select.appendChild(opt);
                });
                if (window.availableTeams.has(currentVal)) {
                    select.value = currentVal;
                } else if (!isKeyModal) {
                    select.value = "";
                }
            }
        });
    };

    async function tryApi(path) {
        if (!AUTH_KEY) return null;
        try {
            const sep = path.includes('?') ? '&' : '?';
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);
            const resp = await fetch('/v1' + path + sep + '_cb=' + Date.now(), {
                headers: { 'Authorization': 'Bearer ' + AUTH_KEY },
                signal: controller.signal
            });
            clearTimeout(timeout);
            if (!resp.ok) {
                if (resp.status === 401) { window.location.href = '/login'; return null; }
                return null;
            }
            return await resp.json();
        } catch { return null; }
    }

    function loadSummary() {
        return tryApi('/dashboard/summary?days=30').then(data => {
            if (!data) return;
            document.getElementById('statCost').textContent = '$' + (data.total_cost || 0).toFixed(2);
            document.getElementById('statRequests').textContent = (data.total_requests || 0).toLocaleString();
            document.getElementById('statSessions').textContent = (data.total_sessions || 0).toLocaleString();
            document.getElementById('statErrors').textContent = (data.error_rate || 0).toFixed(2) + '%';
            
        });
    }

    function loadSessions() {
        tryApi('/dashboard/sessions?days=7').then(data => {
            sessionsData = Array.isArray(data) ? data : [];
            renderSessions(sessionsData);
        });
    }

    function renderSessions(data) {
        const tbody = document.getElementById('sessionsBody');
        if (!data.length) {
            const maskedKey = AUTH_KEY ? AUTH_KEY.slice(0, 12) + '...' + AUTH_KEY.slice(-4) : 'YOUR_KEY';
            tbody.innerHTML = '<tr><td colspan="7" style="padding:40px 20px;text-align:center;">'
                + '<div style="font-size:14px;font-weight:600;margin-bottom:8px;color:var(--text);">No requests yet</div>'
                + '<div style="font-size:12px;color:var(--text-muted);margin-bottom:16px;">Send your first request to see data here. It takes 2 minutes.</div>'
                + '<div style="background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:16px;text-align:left;font-family:monospace;font-size:11px;max-width:500px;margin:0 auto;line-height:1.8;">'
                + '<span style="color:var(--text-muted);"># Python</span><br>'
                + '<span style="color:var(--accent);">from</span> openai <span style="color:var(--accent);">import</span> OpenAI<br>'
                + 'client = OpenAI(<br>'
                + '&nbsp;&nbsp;base_url=<span style="color:var(--green);">"http://localhost:8787/v1/proxy/openai"</span>,<br>'
                + '&nbsp;&nbsp;api_key=<span style="color:var(--green);">"' + esc(maskedKey) + ':sk-..."</span><br>'
                + ')</div>'
                + '</td></tr>';
            return;
        }
        tbody.innerHTML = data.map(s => '<tr>'
            + '<td class="font-mono text-xs">' + esc((s.session_id || 'direct').slice(0, 16)) + '</td>'
            + '<td>' + esc(s.team || '-') + '</td>'
            + '<td><span class="provider-badge provider-' + esc(s.provider) + '">' + esc(s.provider) + '</span></td>'
            + '<td class="font-mono text-xs">' + esc(s.model || '-') + '</td>'
            + '<td class="font-mono font-semibold" style="color:var(--green);">$' + (s.estimated_cost_usd || 0).toFixed(4) + '</td>'
            + '<td class="font-mono">' + (s.request_count || 0) + '</td>'
            + '<td class="font-mono">' + (s.total_tokens || 0).toLocaleString() + '</td>'
            + '</tr>').join('');
    }

    function loadPolicies() {
        if (!document.body.classList.contains('pro-theme')) {
            document.getElementById('policiesBody').innerHTML = 
                '<tr><td class="font-medium">Block gpt-5.5 series</td><td><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-900/30 text-red-400">BLOCK</span></td><td class="font-mono text-xs" style="color:var(--text-dim);">model == "gpt-5.5"</td><td class="text-xs" style="color:var(--text-muted);">2 days ago</td><td></td></tr>';
            return Promise.resolve();
        }
        return tryApi('/rules').then(data => {
            const list = Array.isArray(data) ? data : [];
            const tbody = document.getElementById('policiesBody');
            if (!list.length) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8" style="color:var(--text-muted);">No policies configured</td></tr>';
                return;
            }
            tbody.innerHTML = list.map(r => '<tr>'
                + '<td><div class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> <span class="font-semibold">' + esc(r.name) + '</span></div></td>'
                + '<td><span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded ' + (r.action === 'block' ? 'bg-red-900/30 text-red-400' : 'bg-amber-900/30 text-amber-400') + '">' + esc(r.action) + '</span></td>'
                + '<td><span class="font-mono text-xs text-[var(--text-dim)]">' + (r.condition && r.condition.model ? 'model == "' + esc(r.condition.model) + '"' : 'All Requests') + '</span></td>'
                + '<td><span class="text-xs text-[var(--text-muted)]">Active</span></td>'
                + '<td><button onclick="window.deletePolicy(' + r.id + ')" class="text-xs text-[var(--red)] hover:underline">Delete</button></td>'
                + '</tr>').join('');
        });
    }

    window.createPolicy = async function() {
        const name = document.getElementById('newPolicyName').value.trim();
        const model = document.getElementById('newPolicyModel').value.trim();
        const action = document.getElementById('newPolicyAction').value;
        if (!name) return alert('Policy name is required');
        
        try {
            const resp = await fetch('/v1/rules', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + AUTH_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    enabled: true,
                    priority: 100,
                    condition: model ? { model: model } : {},
                    action: action
                })
            });
            if (!resp.ok) throw new Error(await resp.text());
            
            document.getElementById('createPolicyModal').classList.add('hidden');
            document.getElementById('newPolicyName').value = '';
            document.getElementById('newPolicyModel').value = '';
            
            loadPolicies();
            loadAuditLogs();
        } catch(err) {
            alert('Failed to create policy: ' + err.message);
        }
    };

    window.deletePolicy = async function(id) {
        if (!confirm('Are you sure you want to delete this policy?')) return;
        try {
            const resp = await fetch('/v1/rules?id=' + id, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + AUTH_KEY }
            });
            if (!resp.ok) throw new Error(await resp.text());
            loadPolicies();
            loadAuditLogs();
        } catch(err) {
            alert('Failed to delete policy: ' + err.message);
        }
    };

    function loadAnomalies() {
        if (!document.body.classList.contains('pro-theme')) {
            document.getElementById('anomaliesList').innerHTML = 
                '<div class="anomaly-card anomaly-warning"><div class="flex items-center justify-between"><div class="flex items-center gap-3"><span class="text-xs font-mono font-semibold" style="color:var(--amber);">WARNING</span><span class="font-mono text-xs">sess_abc123def456</span><span class="text-xs" style="color:var(--text-muted);">marketing-team</span></div><div class="text-right"><div class="text-xs font-mono" style="color:var(--text-muted);">iter 45 · 2.5x growth</div><div class="text-[10px] font-mono" style="color:var(--text-muted);">Just now</div></div></div></div>' +
                '<div class="anomaly-card anomaly-runaway"><div class="flex items-center justify-between"><div class="flex items-center gap-3"><span class="text-xs font-mono font-semibold" style="color:var(--red);">RUNAWAY</span><span class="font-mono text-xs">sess_xyz987qwe654</span><span class="text-xs" style="color:var(--text-muted);">eng-team</span></div><div class="text-right"><div class="text-xs font-mono" style="color:var(--text-muted);">iter 112 · 15.0x growth</div><div class="text-[10px] font-mono" style="color:var(--text-muted);">2 hours ago</div></div></div></div>';
            return Promise.resolve();
        }
        return tryApi('/dashboard/anomalies?days=7').then(data => {
            const list = Array.isArray(data) ? data : [];
            const el = document.getElementById('anomaliesList');
            if (!list.length) {
                el.innerHTML = '<div class="text-center py-8" style="color:var(--text-muted);">No anomalies detected</div>';
                return;
            }
            el.innerHTML = list.map(a => '<div class="anomaly-card anomaly-' + (a.alert_type === 'runaway_detected' ? 'runaway' : 'warning') + '">'
                + '<div class="flex items-center justify-between">'
                + '<div class="flex items-center gap-3">'
                + '<span class="text-xs font-mono font-semibold" style="color:' + (a.alert_type === 'runaway_detected' ? 'var(--red)' : 'var(--amber)') + ';">'
                + (a.alert_type === 'runaway_detected' ? 'RUNAWAY' : 'WARNING') + '</span>'
                + '<span class="font-mono text-xs">' + esc((a.session_id || '').slice(0, 16)) + '</span>'
                + '<span class="text-xs" style="color:var(--text-muted);">' + esc(a.team || '') + '</span>'
                + '</div>'
                + '<div class="text-right">'
                + '<div class="text-xs font-mono" style="color:var(--text-muted);">iter ' + a.iteration_index + ' · ' + a.growth_ratio + 'x growth</div>'
                + '<div class="text-[10px] font-mono" style="color:var(--text-muted);">' + new Date(a.request_started_at).toLocaleString() + '</div>'
                + '</div></div></div>').join('');
        });
    }

    function loadTrend() {
        tryApi('/dashboard/spend-trend?days=30').then(data => {
            const list = Array.isArray(data) ? data : [];
            const el = document.getElementById('trendChart');
            if (!list.length) {
                el.innerHTML = '<div class="w-full text-center py-8" style="color:var(--text-muted);">No spend data</div>';
                return;
            }
            
            const maxCost = Math.max(...list.map(m => m.total_cost || 0), 10);
            const magnitude = Math.pow(10, Math.floor(Math.log10(maxCost)));
            const step = magnitude >= 100 ? magnitude / 2 : 50;
            const gridMax = Math.ceil(maxCost / step) * step;
            const gridMid = gridMax / 2;

            let html = '<div class="relative w-full h-[240px] flex flex-col pt-6 pb-8 px-4 pl-14">';
            
            // Grid lines
            html += '<div class="absolute inset-0 flex flex-col justify-between pt-6 pb-8 pr-4 pl-14 pointer-events-none z-0">';
            html += '<div class="w-full h-[1px] bg-[var(--border)] opacity-30 relative"><span class="absolute -left-12 -top-2 text-[10px] font-mono text-[var(--text-muted)]">$' + gridMax.toLocaleString() + '</span></div>';
            html += '<div class="w-full h-[1px] bg-[var(--border)] opacity-30 relative"><span class="absolute -left-12 -top-2 text-[10px] font-mono text-[var(--text-muted)]">$' + gridMid.toLocaleString() + '</span></div>';
            html += '<div class="w-full h-[1px] bg-[var(--border)] opacity-50 relative"><span class="absolute -left-12 -top-2 text-[10px] font-mono text-[var(--text-muted)]">$0</span></div>';
            html += '</div>';

            // Bars Container
            html += '<div class="relative z-10 w-full h-full flex items-end justify-around gap-2">';

            const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

            html += list.map(d => {
                const hPct = Math.max(2, ((d.total_cost || 0) / gridMax) * 100);
                const monthIdx = parseInt((d.month || '').slice(5)) - 1;
                const monthName = (monthIdx >= 0 && monthIdx < 12) ? monthNames[monthIdx] : (d.month || '');
                
                return '<div class="flex flex-col items-center group relative w-12 md:w-16 h-full justify-end">'
                    + '<div class="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-2 py-1 rounded text-xs font-mono font-bold z-20 whitespace-nowrap shadow-lg" style="background:var(--surface);border:1px solid var(--border);color:var(--green);pointer-events:none;">'
                    + '$' + (d.total_cost || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})
                    + '</div>'
                    + '<div class="w-full rounded-t-md transition-all duration-300 cursor-pointer shadow-[0_0_15px_rgba(88,166,255,0.1)] group-hover:shadow-[0_0_20px_rgba(88,166,255,0.3)] group-hover:brightness-125" style="height:' + hPct + '%;background:linear-gradient(180deg, rgba(88,166,255,0.8), rgba(88,166,255,0.05)); border-top: 2px solid var(--accent);"></div>'
                    + '<div class="absolute -bottom-6 text-[10px] font-mono font-semibold" style="color:var(--text-muted);">' + esc(monthName) + '</div>'
                    + '</div>';
            }).join('');
            
            html += '</div></div>';
            el.innerHTML = html;
        });
    }

    function loadProviders() {
        tryApi('/dashboard/providers?days=30').then(data => {
            const providers = Array.isArray(data) ? data : [];
            const tbody = document.getElementById('providersBody');
            if (!providers.length) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8" style="color:var(--text-muted);">No provider data</td></tr>';
                return;
            }
            tbody.innerHTML = providers.map(p => '<tr>'
                + '<td><span class="provider-badge provider-' + esc(p.provider) + '">' + esc(p.provider) + '</span></td>'
                + '<td><span class="text-xs font-mono" style="color:var(--text-dim);">' + esc(p.model || '-') + '</span></td>'
                + '<td><span class="font-mono text-xs font-semibold" style="color:var(--green);">$' + (p.estimated_cost_usd || 0).toFixed(4) + '</span></td>'
                + '<td><span class="font-mono text-sm">' + (p.request_count || 0) + '</span></td>'
                + '<td><span class="font-mono text-sm">' + (p.avg_latency_ms || 0) + 'ms</span></td>'
                + '<td><span class="font-mono text-sm">' + (p.avg_proxy_overhead_ms || 0) + 'ms</span></td>'
                + '<td><span class="font-mono text-sm" style="color:' + ((p.error_count || 0) > 0 ? 'var(--red)' : 'var(--green)') + ';">' + (p.error_count || 0) + '</span></td>'
                + '</tr>').join('');
        });
    }

    function loadTeams() {
        tryApi('/dashboard/teams?days=30').then(data => {
            const teams = Array.isArray(data) ? data : [];
            teams.forEach(t => { if (t.team) window.availableTeams.add(t.team); });
            if (window.updateTeamDropdown) window.updateTeamDropdown();
            
            const tbody = document.getElementById('teamsBody');
            if (!teams.length) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center py-8" style="color:var(--text-muted);">No team data</td></tr>';
                return;
            }
            tbody.innerHTML = teams.map(t => '<tr>'
                + '<td><span class="font-mono text-xs font-semibold" style="color:var(--accent);">' + esc(t.team) + '</span></td>'
                + '<td><span class="font-mono text-sm">' + (t.request_count || 0) + '</span></td>'
                + '<td><span class="font-mono text-sm">' + (t.total_tokens || 0).toLocaleString() + '</span></td>'
                + '<td><span class="font-mono text-xs font-semibold" style="color:var(--green);">$' + (t.estimated_cost_usd || 0).toFixed(4) + '</span></td>'
                + '</tr>').join('');
        });
    }

    function loadBudgets() {
        if (!document.body.classList.contains('pro-theme')) {
            document.getElementById('budgetsBody').innerHTML = 
                '<tr><td><span class="font-mono text-xs font-semibold" style="color:var(--accent);">engineering</span></td><td><span class="font-mono text-sm">$500.00</span> <span class="text-[10px] text-[var(--red)] border border-[var(--red)] px-1 rounded ml-1">HARD STOP</span></td><td><span class="font-mono text-sm">$450.00</span></td><td><div class="flex items-center gap-2"><div class="w-16 h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden"><div class="h-full bg-[var(--amber)]" style="width:90%"></div></div><span class="font-mono text-[11px]">90%</span></div></td><td><span class="text-xs font-bold text-[var(--amber)] px-2 py-0.5 rounded bg-[rgba(251,191,36,0.1)]">WARNING</span></td></tr>' +
                '<tr><td><span class="font-mono text-xs font-semibold" style="color:var(--accent);">marketing</span></td><td><span class="font-mono text-sm">$100.00</span></td><td><span class="font-mono text-sm">$25.50</span></td><td><div class="flex items-center gap-2"><div class="w-16 h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden"><div class="h-full bg-[var(--green)]" style="width:25%"></div></div><span class="font-mono text-[11px]">25%</span></div></td><td><span class="text-xs font-bold text-[var(--green)] px-2 py-0.5 rounded bg-[rgba(52,211,153,0.1)]">OK</span></td></tr>';
            return Promise.resolve();
        }
        return fetch('/v1/teams/budgets', {
            headers: { 'Authorization': 'Bearer ' + AUTH_KEY }
        }).then(async r => {
            if (!r.ok) {
                const text = await r.text();
                throw new Error(text);
            }
            return r.json();
        }).then(data => {
            const budgets = Array.isArray(data) ? data : [];
            const tbody = document.getElementById('budgetsBody');
            if (!budgets.length) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8" style="color:var(--text-muted);">No budgets configured</td></tr>';
                return;
            }
            tbody.innerHTML = budgets.map(b => {
                let statusHtml = '';
                if (b.status === 'exceeded') statusHtml = '<span class="text-xs font-bold text-[var(--red)] px-2 py-0.5 rounded bg-[rgba(248,113,113,0.1)]">EXCEEDED</span>';
                else if (b.status === 'warning') statusHtml = '<span class="text-xs font-bold text-[var(--amber)] px-2 py-0.5 rounded bg-[rgba(251,191,36,0.1)]">WARNING</span>';
                else statusHtml = '<span class="text-xs font-bold text-[var(--green)] px-2 py-0.5 rounded bg-[rgba(52,211,153,0.1)]">OK</span>';
                
                return '<tr>'
                    + '<td><span class="font-mono text-xs font-semibold" style="color:var(--accent);">' + esc(b.team) + '</span></td>'
                    + '<td><span class="font-mono text-sm">$' + (b.monthly_budget_usd || 0).toFixed(2) + '</span>' + (b.hard_stop ? ' <span class="text-[10px] text-[var(--red)] border border-[var(--red)] px-1 rounded ml-1">HARD STOP</span>' : '') + '</td>'
                    + '<td><span class="font-mono text-sm">$' + (b.current_spend || 0).toFixed(4) + '</span></td>'
                    + '<td><div class="flex items-center gap-2"><div class="w-16 h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden"><div class="h-full ' + (b.pct_used >= 100 ? 'bg-[var(--red)]' : b.pct_used >= 80 ? 'bg-[var(--amber)]' : 'bg-[var(--green)]') + '" style="width:' + Math.min(100, b.pct_used) + '%"></div></div><span class="font-mono text-[11px]">' + b.pct_used + '%</span></div></td>'
                    + '<td>' + statusHtml + '</td>'
                    + '</tr>';
            }).join('');
        }).catch(e => {
            console.error(e);
            document.getElementById('budgetsBody').innerHTML = '<tr><td colspan="5" class="text-center py-8" style="color:var(--red);">Error loading budgets: ' + esc(e.message) + '</td></tr>';
        });
    }

    window.saveTeamBudget = async function() {
        const team = document.getElementById('bTeamName').value;
        const monthlyUsd = parseFloat(document.getElementById('bMonthlyUsd').value);
        const alertPct = parseInt(document.getElementById('bAlertPct').value, 10);
        const hardStop = document.getElementById('bHardStop').checked;

        if (!team || isNaN(monthlyUsd)) {
            alert('Team name and monthly budget are required.');
            return;
        }

        try {
            const resp = await fetch('/v1/teams/budgets', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + AUTH_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ team: team, monthly_budget_usd: monthlyUsd, alert_threshold_pct: alertPct || 80, hard_stop: hardStop })
            });
            if (!resp.ok) throw new Error(await resp.text());
            
            document.getElementById('budgetModal').classList.add('hidden');
            document.getElementById('bTeamName').value = '';
            document.getElementById('bMonthlyUsd').value = '';
            
            loadBudgets();
        } catch (e) {
            alert('Error saving budget: ' + e.message);
        }
    }

    window.createTeam = async function() {
        const teamName = document.getElementById('newExplicitTeamName').value;
        try {
            const resp = await fetch('/v1/dashboard/manage-teams', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + AUTH_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: teamName })
            });
            if (!resp.ok) throw new Error(await resp.text());
            
            document.getElementById('createTeamModal').classList.add('hidden');
            document.getElementById('newExplicitTeamName').value = '';
            
            loadExplicitTeams();
            loadAuditLogs();
        } catch (err) {
            alert('Failed to create team: ' + err.message);
        }
    };

    window.deleteTeam = async function(teamName) {
        if (!confirm("Are you sure you want to delete team '" + teamName + "'?")) return;
        try {
            const resp = await fetch('/v1/dashboard/manage-teams/' + encodeURIComponent(teamName), {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + AUTH_KEY }
            });
            if (!resp.ok) throw new Error(await resp.text());
            
            // Remove from local set
            window.availableTeams.delete(teamName);
            if (window.updateTeamDropdown) window.updateTeamDropdown();
            
            loadExplicitTeams();
            loadAuditLogs();
        } catch (err) {
            alert('Failed to delete team: ' + err.message);
        }
    };

    function loadExplicitTeams() {
        return tryApi('/dashboard/manage-teams').then(data => {
            const teams = Array.isArray(data) ? data : [];
            teams.forEach(t => { if (t.name) window.availableTeams.add(t.name); });
            if (window.updateTeamDropdown) window.updateTeamDropdown();
            
            const tbody = document.getElementById('manageTeamsBody');
            if (!teams.length) {
                tbody.innerHTML = '<tr><td colspan="3" class="text-center py-8" style="color:var(--text-muted);">No teams configured</td></tr>';
                return;
            }
            tbody.innerHTML = teams.map(t => '<tr>'
                + '<td><span class="font-mono text-xs font-semibold" style="color:var(--accent);">' + esc(t.name) + '</span></td>'
                + '<td><span class="text-xs text-[var(--text-muted)]">' + new Date(t.created_at).toLocaleDateString() + '</span></td>'
                + '<td><button onclick="window.deleteTeam(\\'' + esc(t.name).replace(/'/g, "\\'") + '\\')" class="text-xs text-red-500 hover:text-red-400">Delete</button></td>'
                + '</tr>').join('');
        }).catch(err => console.error("Failed to load explicit teams:", err));
    }

    function loadKeys() {
        if (!document.body.classList.contains('pro-theme')) {
            document.getElementById('keysBody').innerHTML = 
                '<tr><td class="font-medium">production-api</td><td><span class="px-2 py-0.5 rounded text-[10px] font-bold" style="background:var(--surface-2);color:var(--text-dim);">admin</span></td><td><span class="text-xs font-mono" style="color:var(--text-muted);">engineering</span></td><td class="font-mono text-xs" style="color:var(--accent);">sk_live_***</td><td><span class="text-xs font-bold text-[var(--green)] px-2 py-0.5 rounded bg-[rgba(52,211,153,0.1)]">active</span></td><td class="text-xs" style="color:var(--text-muted);">Oct 12, 2023</td><td><button disabled class="text-xs px-2 py-1 rounded border border-[var(--border)] opacity-50">Revoke</button></td></tr>' +
                '<tr><td class="font-medium">ci-runner</td><td><span class="px-2 py-0.5 rounded text-[10px] font-bold" style="background:var(--surface-2);color:var(--text-dim);">viewer</span></td><td><span class="text-xs font-mono" style="color:var(--text-muted);">qa-team</span></td><td class="font-mono text-xs" style="color:var(--accent);">sk_test_***</td><td><span class="text-xs font-bold text-[var(--green)] px-2 py-0.5 rounded bg-[rgba(52,211,153,0.1)]">active</span></td><td class="text-xs" style="color:var(--text-muted);">Nov 05, 2023</td><td><button disabled class="text-xs px-2 py-1 rounded border border-[var(--border)] opacity-50">Revoke</button></td></tr>';
            return Promise.resolve();
        }
        return tryApi('/dashboard/keys').then(data => {
            const keys = Array.isArray(data) ? data : [];
            keys.forEach(k => { if (k.team_id) window.availableTeams.add(k.team_id); });
            if (window.updateTeamDropdown) window.updateTeamDropdown();
            
            const tbody = document.getElementById('keysBody');
            if (keys.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8" style="color:var(--text-muted);">No developer keys found</td></tr>';
                return;
            }
            tbody.innerHTML = keys.map(k => '<tr>'
                + '<td><div class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg> <span class="font-semibold">' + esc(k.name) + '</span></div></td>'
                + '<td><span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded ' + (k.role === 'admin' ? 'bg-purple-900/30 text-purple-400' : 'bg-blue-900/30 text-blue-400') + '">' + esc(k.role) + '</span></td>'
                + '<td><span class="font-mono text-xs font-semibold ' + (k.team_id ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]') + '">' + (k.team_id ? esc(k.team_id) : 'Global') + '</span></td>'
                + '<td><span class="font-mono text-xs text-[var(--text-muted)]">' + esc(k.key_prefix) + '</span></td>'
                + '<td><span class="text-xs text-[var(--green)]">active</span></td>'
                + '<td><span class="text-xs text-[var(--text-muted)]">' + new Date(k.created_at).toLocaleDateString() + '</span></td>'
                + '<td><button onclick="revokeKey(&quot;' + esc(k.key_prefix) + '&quot;)" class="text-xs text-[var(--red)] hover:underline">Revoke</button></td>'
                + '</tr>').join('');
        });
    }

    window.revokeKey = async function(prefix) {
        if (!confirm('Are you sure you want to revoke this key?')) return;
        try {
            const resp = await fetch('/v1/dashboard/keys', {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + AUTH_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({ key_prefix: prefix })
            });
            if (resp.ok) {
                loadKeys();
                loadAuditLogs();
            } else alert('Failed to revoke key');
        } catch (e) {
            alert('Error: ' + e.message);
        }
    }

    window.generateKey = async function() {
        const name = document.getElementById('newKeyName').value;
        const role = document.getElementById('newKeyRole').value;
        const team_id = document.getElementById('newKeyTeam').value;
        try {
            const resp = await fetch('/v1/dashboard/keys', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + AUTH_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, role, team_id })
            });
            if (!resp.ok) throw new Error(await resp.text());
            const data = await resp.json();
            
            document.getElementById('keyModal').classList.add('hidden');
            document.getElementById('newKeyName').value = '';
            
            const tokenEl = document.getElementById('newTokenDisplay');
            tokenEl.textContent = data.token;
            document.getElementById('tokenModal').classList.remove('hidden');
            
            loadKeys();
            loadAuditLogs();
        } catch (err) {
            alert('Failed to generate key: ' + err.message);
        }
    }

    function loadAuditLogs() {
        if (!document.body.classList.contains('pro-theme')) {
            document.getElementById('auditBody').innerHTML = 
                '<tr><td class="text-xs font-mono" style="color:var(--text-muted);">2 mins ago</td><td><span class="text-[11px] font-bold px-2 py-0.5 rounded bg-[var(--surface-2)]">budget.updated</span></td><td class="text-xs font-mono">admin@company.com</td><td class="text-xs font-mono">team: engineering</td><td class="text-xs" style="color:var(--text-muted);">Changed monthly_budget_usd from 1000 to 1500</td></tr>' +
                '<tr><td class="text-xs font-mono" style="color:var(--text-muted);">1 hour ago</td><td><span class="text-[11px] font-bold px-2 py-0.5 rounded bg-[var(--surface-2)]">key.created</span></td><td class="text-xs font-mono">system_api</td><td class="text-xs font-mono">key: sk_live_***</td><td class="text-xs" style="color:var(--text-muted);">Created new admin key for deployment</td></tr>' +
                '<tr><td class="text-xs font-mono" style="color:var(--text-muted);">Yesterday</td><td><span class="text-[11px] font-bold px-2 py-0.5 rounded bg-[var(--surface-2)]">team.created</span></td><td class="text-xs font-mono">admin@company.com</td><td class="text-xs font-mono">team: marketing</td><td class="text-xs" style="color:var(--text-muted);">Created team with default policies</td></tr>';
            return Promise.resolve();
        }
        return tryApi('/dashboard/audit_logs').then(data => {
            const logs = Array.isArray(data) ? data : [];
            const tbody = document.getElementById('auditBody');
            if (logs.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8" style="color:var(--text-muted);">No audit logs found</td></tr>';
                return;
            }
            tbody.innerHTML = logs.map(l => '<tr>'
                + '<td class="text-xs font-mono" style="color:var(--text-muted);">' + new Date(l.timestamp).toLocaleString() + '</td>'
                + '<td><span class="text-[11px] font-bold px-2 py-0.5 rounded bg-[var(--surface-2)]">' + esc(l.action) + '</span></td>'
                + '<td class="text-xs font-mono">' + esc(l.actor || "system") + '</td>'
                + '<td class="text-xs font-mono">' + esc(l.resource || "-") + '</td>'
                + '<td class="text-xs" style="color:var(--text-muted);">' + esc(l.metadata ? JSON.stringify(l.metadata) : "") + '</td>'
                + '</tr>').join('');
        });
    }

    function showTab(tab, el) {
        document.querySelectorAll('[id^="tab-"]').forEach(t => t.classList.add('hidden'));
        document.querySelectorAll('.sidebar-link').forEach(t => t.classList.remove('active'));
        document.getElementById('tab-' + tab).classList.remove('hidden');
        if (el) el.classList.add('active');
        currentTab = tab;
        const titleEl = document.getElementById('currentSectionTitle');
        if (titleEl && el) {
            titleEl.textContent = el.textContent.trim().toUpperCase().replace(' ✦', '');
        }
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
            if (type === 'num') {
                va = parseFloat(va.replace(/[$,]/g, '')) || 0;
                vb = parseFloat(vb.replace(/[$,]/g, '')) || 0;
            }
            if (dir === 'asc') return va > vb ? 1 : -1;
            return va < vb ? 1 : -1;
        });

        rows.forEach(r => tbody.appendChild(r));
    }

    let dashboardAppliedPromo = null;

    async function checkDashboardPromo() {
        try {
            const resp = await fetch('/v1/promos/status');
            const data = await resp.json();
            if (data.enabled) {
                const banner = document.getElementById('dashboardPromoBanner');
                if (banner) banner.classList.remove('hidden');
                const input = document.getElementById('dashboardPromoInput');
                if (input) input.classList.remove('hidden');
            }
        } catch (err) {}
    }

    async function applyDashboardPromo() {
        const input = document.getElementById('dashboardPromoCodeInput');
        const btn = document.getElementById('dashboardPromoApplyBtn');
        const errorEl = document.getElementById('dashboardPromoError');
        const code = input.value.trim();
        if (!code) return;

        btn.textContent = 'Validating...';
        btn.disabled = true;
        errorEl.classList.add('hidden');

        try {
            const resp = await fetch('/v1/promos/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
            const data = await resp.json();

            if (data.valid) {
                dashboardAppliedPromo = data;
                document.getElementById('dashboardPromoPrice').classList.remove('hidden');
                document.getElementById('dashboardDiscountedPrice').classList.remove('hidden');
                document.getElementById('dashboardNormalPrice').classList.add('hidden');
                document.getElementById('dashboardDiscountedPrice').textContent = '$' + data.discountedPrice.toFixed(2);
                document.getElementById('dashboardPromoPrice').textContent = '$' + (parseInt(data.discount) === 50 ? '99' : '99');
                errorEl.classList.add('hidden');
            } else {
                const errorMsg = typeof data.error === 'object' ? (data.error.message || 'Invalid promo code') : (data.error || 'Invalid promo code');
                errorEl.textContent = errorMsg;
                errorEl.classList.remove('hidden');
                dashboardAppliedPromo = null;
            }
        } catch (err) {
            errorEl.textContent = 'Failed to validate promo code';
            errorEl.classList.remove('hidden');
        } finally {
            btn.textContent = 'Apply';
            btn.disabled = false;
        }
    }

    async function loadPlan() {
        try {
            const planData = await tryApi('/dashboard/plan');
            if (planData) {
                if (planData.plan === 'pro' || planData.plan === 'enterprise') {
                    document.body.classList.add('pro-theme');
                    if (planData.plan === 'enterprise') {
                        document.body.classList.add('enterprise-theme');
                        document.querySelectorAll('.pro-badge').forEach(b => b.textContent = 'ENT');
                    } else {
                        document.body.classList.remove('enterprise-theme');
                        document.querySelectorAll('.pro-badge').forEach(b => b.textContent = 'PRO');
                    }
                } else {
                    document.body.classList.remove('pro-theme');
                    document.body.classList.remove('enterprise-theme');
                }

                const planEl = document.getElementById('currentPlan');
                if (planEl) {
                    planEl.textContent = 'Community Edition';
                }

                if (planData.plan === 'enterprise') {
                    var entTab = document.getElementById('enterpriseTab');
                    if (entTab) entTab.style.display = 'flex';
                }

                const upgradeContainer = document.getElementById('billingUpgradeContainer');
                if (upgradeContainer) {
                    if (planData.plan === 'pro') {
                        upgradeContainer.innerHTML = \`
                            <h3 class="text-lg font-bold mb-2">Upgrade to Enterprise</h3>
                            <p class="text-[13px] text-[var(--text-dim)] mb-6">Get unlimited requests, custom SSO, dedicated support, and on-premise deployment options.</p>
                            
                            <div class="border border-[var(--border)] rounded-xl p-5 mb-6 relative overflow-hidden bg-[rgba(255,255,255,0.02)]">
                                <div class="flex justify-between items-center mb-4">
                                    <div>
                                        <h4 class="text-lg font-bold text-[var(--text)]">Enterprise Plan</h4>
                                        <p class="text-xs text-[var(--text-muted)]">Custom billing</p>
                                    </div>
                                    <div class="text-right">
                                        <span class="text-2xl font-bold text-[var(--accent)]">Custom</span>
                                    </div>
                                </div>
                                <ul class="space-y-2 text-[13px] text-[var(--text-dim)]">
                                    <li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg> Unlimited Requests</li>
                                    <li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg> Single Sign-On (SSO)</li>
                                    <li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg> Custom Data Retention</li>
                                    <li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg> Dedicated Support Channel</li>
                                    <li class="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg> On-Premise Deployment</li>
                                </ul>
                            </div>

                            <div class="flex flex-col gap-3">
                                <button onclick="window.location.href='#'" class="w-full py-3 rounded-lg text-sm font-bold transition-all" style="background:var(--accent);color:#080A12;">
                                    Contact Sales
                                </button>
                            </div>
                        \`;
                    } else if (planData.plan === 'enterprise') {
                        upgradeContainer.innerHTML = \`
                            <h3 class="text-lg font-bold mb-2">Enterprise Plan Active</h3>
                            <p class="text-[13px] text-[var(--text-dim)] mb-6">You are on the highest tier. For support or custom configuration, contact your account manager.</p>
                            
                            <div class="flex flex-col gap-3">
                                <button onclick="window.location.href='mailto:hello@localhost'" class="w-full py-3 rounded-lg text-sm font-bold transition-all" style="background:var(--surface-2);color:var(--text);">
                                    Contact Support
                                </button>
                            </div>
                        \`;
                    }
                }
                // Update dynamic pricing if available
                if (planData.pricing) {
                    const priceEl = document.querySelector('#billingUpgradeContainer .text-2xl.font-bold');
                                        const requestLimitEl = document.querySelector('#billingUpgradeContainer .space-y-2 li:first-child');
                                    }

                // Show promo banner if enabled and user is on free plan
                if (planData.plan === 'free') {
                    checkDashboardPromo();
                }

                const usageEl = document.getElementById('usageCount');
                const isUnlimited = planData.requestLimit === null || planData.requestLimit === undefined || planData.requestLimit === Infinity;
                if (usageEl) {
                    usageEl.textContent = planData.requestCount.toLocaleString() + ' / ' + (isUnlimited ? '∞' : planData.requestLimit.toLocaleString());
                }
                const barEl = document.getElementById('usageBar');
                if (barEl && !isUnlimited) {
                    const pct = Math.min(100, (planData.requestCount / planData.requestLimit) * 100);
                    barEl.style.width = pct + '%';
                } else if (barEl && isUnlimited) {
                    barEl.style.width = '100%';
                }
            }
        } catch {}
    }

    async function loadEnterprise() {
        try {
            const slaData = await tryApi('/dashboard/sla');
            if (slaData) {
                const slaEl = document.getElementById('slaStatus');
                if (slaEl) {
                    var uptimePct = (slaData.actualUptime).toFixed(3);
                    var targetPct = (slaData.targetUptime).toFixed(1);
                    var avgLatency = slaData.latency ? slaData.latency.avgMs.toFixed(0) : 0;
                    var p99Latency = slaData.latency ? slaData.latency.p99Ms.toFixed(0) : 0;
                    var downtime = (slaData.actualDowntimeMinutes || 0).toFixed(1);
                    var isBreached = !slaData.downtimeWithinBudget;

                    slaEl.innerHTML = '<div class="flex justify-between text-[12px]"><span class="text-[var(--text-dim)]">Uptime</span><span class="text-white">' + uptimePct + '%</span></div>' +
                        '<div class="flex justify-between text-[12px]"><span class="text-[var(--text-dim)]">Target</span><span class="text-white">' + targetPct + '%</span></div>' +
                        '<div class="flex justify-between text-[12px]"><span class="text-[var(--text-dim)]">Avg Latency</span><span class="text-white">' + avgLatency + 'ms</span></div>' +
                        '<div class="flex justify-between text-[12px]"><span class="text-[var(--text-dim)]">P99 Latency</span><span class="text-white">' + p99Latency + 'ms</span></div>' +
                        '<div class="flex justify-between text-[12px]"><span class="text-[var(--text-dim)]">Downtime</span><span style="color:' + (isBreached ? 'var(--red)' : 'var(--green)') + ';">' + downtime + ' min</span></div>';
                }
            }
        } catch {}
        try {
            var residencyData = await tryApi('/residency');
            if (residencyData) {
                var resEl = document.getElementById('residencyStatus');
                if (resEl) {
                    resEl.innerHTML = '<div class="flex justify-between text-[12px]"><span class="text-[var(--text-dim)]">Region</span><span class="text-white">' + esc(residencyData.region.toUpperCase()) + '</span></div>' +
                        '<div class="flex justify-between text-[12px]"><span class="text-[var(--text-dim)]">Enforced</span><span style="color:' + (residencyData.data_residency_enforced ? 'var(--green)' : 'var(--text-muted)') + ';">' + (residencyData.data_residency_enforced ? 'Yes' : 'No') + '</span></div>';
                }
            }
        } catch {}
        try {
            var ssoData = await tryApi('/dashboard/sso-status');
            var ssoEl = document.getElementById('ssoStatus');
            if (ssoEl) {
                if (ssoData && ssoData.configured) {
                    ssoEl.innerHTML = '<div class="flex justify-between text-[12px]"><span class="text-[var(--text-dim)]">Status</span><span style="color:var(--green);">Configured</span></div>' +
                        '<div class="flex justify-between text-[12px]"><span class="text-[var(--text-dim)]">Protocol</span><span class="text-white">SAML 2.0</span></div>' +
                        '<div class="text-[11px] text-[var(--text-muted)]">XML signature verification enabled.</div>';
                } else {
                    ssoEl.innerHTML = '<div class="flex justify-between text-[12px]"><span class="text-[var(--text-dim)]">Status</span><span style="color:var(--text-muted);">Not configured</span></div>' +
                        '<div class="text-[11px] text-[var(--text-muted)]">Configure your Identity Provider (Okta, Azure AD, etc.) with the SP metadata URL.</div>';
                }
            }
        } catch {}
    }

    async function downloadSoc2(event) {
        event.preventDefault();
        const btn = event.currentTarget;
        const originalText = btn.textContent;
        btn.textContent = 'Generating Export...';
        btn.style.pointerEvents = 'none';
        btn.style.opacity = '0.7';

        try {
            const response = await fetch('/v1/dashboard/compliance/soc2', {
                headers: { 'Authorization': 'Bearer ' + AUTH_KEY }
            });
            
            if (!response.ok) throw new Error('Failed to download');
            
            const htmlText = await response.text();
            const blob = new Blob([htmlText], { type: 'text/html' });
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'AgentWatch_SOC2_Export_' + new Date().toISOString().split('T')[0] + '.html';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (e) {
            alert('Error generating SOC 2 export. Please try again.');
        } finally {
            btn.textContent = originalText;
            btn.style.pointerEvents = 'auto';
            btn.style.opacity = '1';
        }
    }

    async function loadPaymentHistory() {
        try {
            const data = await tryApi('/dashboard/payments');
            if (data && data.payments && data.payments.length > 0) {
                const container = document.getElementById('paymentHistoryContent');
                if (container) {
                    container.className = 'flex flex-col gap-2';
                    container.innerHTML = data.payments.map(function(p) {
                        return '<div class="flex justify-between items-center py-2 border-b border-[var(--border)]">'
                            + '<div>'
                            + '<p class="text-[13px] text-[var(--text)]">' + esc(p.promo_code || 'Payment') + '</p>'
                            + '<p class="text-[11px] text-[var(--text-muted)]">' + new Date(p.created_at).toLocaleDateString() + '</p>'
                            + '</div>'
                            + '<span class="text-[13px] font-mono text-[var(--accent)]">$' + (p.discount_amount || 0) + '</span>'
                            + '</div>';
                    }).join('');
                }
            }
        } catch (e) { /* ignore */ }
    }

    async function refreshAll() {
        if (!AUTH_KEY) return;
        document.getElementById('lastUpdated').textContent = 'Refreshing...';
        try {
            await loadPlan();
            await Promise.allSettled([loadSummary(), loadSessions(), loadPolicies(), loadAnomalies(), loadTrend(), loadProviders(), loadTeams(), loadBudgets(), loadExplicitTeams(), loadKeys(), loadAuditLogs(), loadSettings(), loadAdvancedAnalytics(), loadEnterprise(), loadPaymentHistory()]);
            document.getElementById('lastUpdated').textContent = 'Updated ' + new Date().toLocaleTimeString();
        } catch (e) {
            document.getElementById('lastUpdated').textContent = 'Refresh failed';
        }
    }

    async function payWithRazorpay() {
        // Load Razorpay dynamically if not already loaded
        if (!window.Razorpay) {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }

        const amountUsd = 99; // Hardcoded for Pro Plan
        
        const statusEl = document.getElementById('paymentStatus');
        statusEl.textContent = 'Initializing payment...';
        statusEl.style.color = 'var(--text-dim)';
        
        // Use USD (cents) — discount applied by backend if promo code provided
        const amountCents = amountUsd * 100;
        let description = 'Pro Subscription ($99/mo)';
        if (dashboardAppliedPromo) {
            description = 'Pro Subscription - 50% OFF first month ($49.50/mo)';
        }

        try {
            const body = { amount: amountCents, currency: 'USD' };
            if (dashboardAppliedPromo) body.promo_code = dashboardAppliedPromo.code || 'PH50';

            const resp = await fetch('/v1/payments/create-order', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + AUTH_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!resp.ok) throw new Error(await resp.text());
            const data = await resp.json();

            const options = {
                "key": data.key_id,
                "amount": data.amount,
                "currency": data.currency,
                "name": "AgentWatch",
                "description": description,
                "order_id": data.order_id,
                "handler": async function (response) {
                    statusEl.textContent = 'Verifying payment...';
                    try {
                        const verifyResp = await fetch('/v1/payments/verify', {
                            method: 'POST',
                            headers: {
                                'Authorization': 'Bearer ' + AUTH_KEY,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });
                        
                        if (!verifyResp.ok) throw new Error(await verifyResp.text());
                        
                        statusEl.textContent = 'Payment successful! Credits added.';
                        statusEl.style.color = 'var(--green)';
                    } catch (err) {
                        statusEl.textContent = 'Payment verification failed: ' + err.message;
                        statusEl.style.color = 'var(--red)';
                    }
                },
                "theme": {
                    "color": "#58A6FF"
                }
            };
            
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response){
                statusEl.textContent = 'Payment failed: ' + response.error.description;
                statusEl.style.color = 'var(--red)';
            });
            rzp.open();
            statusEl.textContent = 'Waiting for payment...';

        } catch (err) {
            statusEl.textContent = 'Failed to create order: ' + err.message;
            statusEl.style.color = 'var(--red)';
        }
    }

    function loadSettings() {
        tryApi('/dashboard/settings').then(data => {
            if (data) {
                document.getElementById('slackWebhookUrl').value = data.webhookUrl || '';
                document.getElementById('alertEmail').value = data.alertEmail || '';
                document.getElementById('alertThreshold').value = data.alertThreshold || 80;
                document.getElementById('dataRetention').value = data.dataRetention || 0;
                
                 else {
                    document.getElementById('policyFailOpen').checked = true;
                }

                if (data.cacheEnabled) {
                    document.getElementById('cacheEnabled').checked = true;
                }
            }
        });
    }

    async function saveSettings(type, btn) {
        const originalText = btn.textContent;
        btn.textContent = 'Saving...';
        const statusEl = document.getElementById('settingsStatus');
        
        let payload = {};
        if (type === 'alerts') {
            payload = {
                alertEmail: document.getElementById('alertEmail').value,
                alertThreshold: parseInt(document.getElementById('alertThreshold').value) || 80,
                webhookUrl: document.getElementById('slackWebhookUrl').value.trim()
            };
        } else if (type === 'privacy') {
            payload = {
                dataRetention: parseInt(document.getElementById('dataRetention').value) || 0
            };
        } else if (type === 'security') {
            payload = {
                
            };
        } else if (type === 'performance') {
            payload = {
                cacheEnabled: document.getElementById('cacheEnabled').checked
            };
        }

        try {
            const resp = await fetch('/v1/dashboard/settings', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + AUTH_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!resp.ok) {
                const err = await resp.json();
                throw new Error(err.error || err.message || 'Failed to save');
            }
            btn.textContent = 'Saved!';
            statusEl.textContent = 'Settings updated successfully.';
            statusEl.style.color = 'var(--green)';
            setTimeout(() => { btn.textContent = originalText; statusEl.textContent = ''; }, 2000);
        } catch (e) {
            btn.textContent = originalText;
            statusEl.textContent = e.message;
            statusEl.style.color = 'var(--red)';
        }
    }

    async function exportData(btn) {
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Exporting...';
        const statusEl = document.getElementById('settingsStatus');
        
        try {
            const resp = await fetch('/v1/dashboard/settings/export', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + AUTH_KEY }
            });
            if (!resp.ok) {
                const err = await resp.json();
                throw new Error(err.error || err.message || 'Export failed');
            }
            
            const blob = await resp.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'agentwatch_logs.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
            
            btn.innerHTML = originalText;
            statusEl.textContent = 'Export complete.';
            statusEl.style.color = 'var(--green)';
            setTimeout(() => statusEl.textContent = '', 3000);
        } catch (e) {
            btn.innerHTML = originalText;
            statusEl.textContent = e.message;
            statusEl.style.color = 'var(--red)';
        }
    }

    async function dangerAction(btn, action) {
        if (!confirm('Are you absolutely sure? This action cannot be undone.')) return;
        const originalText = btn.textContent;
        btn.textContent = 'Processing...';
        const statusEl = document.getElementById('settingsStatus');
        
        const endpoint = action === 'Data reset' ? '/v1/dashboard/settings/reset' : '/v1/dashboard/settings/delete';
        
        try {
            const resp = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + AUTH_KEY }
            });
            if (!resp.ok) {
                const err = await resp.json();
                throw new Error(err.error || err.message || 'Action failed');
            }
            if (action === 'Workspace deleted') {
                localStorage.removeItem('agentwatch_key');
                window.location.reload();
                return;
            }
            btn.textContent = originalText;
            statusEl.textContent = action + ' successfully.';
            statusEl.style.color = 'var(--red)';
            setTimeout(() => statusEl.textContent = '', 3000);
        } catch (e) {
            btn.textContent = originalText;
            statusEl.textContent = e.message;
            statusEl.style.color = 'var(--red)';
        }
    }

    let chartsInstance = {};
    Chart.defaults.color = '#7D8590';
    Chart.defaults.font.family = 'Inter';

    function initOrUpdateChart(id, type, data, options) {
        if (chartsInstance[id]) chartsInstance[id].destroy();
        const ctx = document.getElementById(id).getContext('2d');
        chartsInstance[id] = new Chart(ctx, { type, data, options });
    }

    function loadAdvancedAnalytics() {
        tryApi('/dashboard/analytics/advanced').then(data => {
            if (!data || data.error) {
                // Mock chart data for background
                initOrUpdateChart('chartTraffic', 'line', { labels:['','','','',''], datasets:[{data:[10,20,15,30,25],borderColor:'#484F58'}] }, {responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{display:false},y:{display:false}}});
                initOrUpdateChart('chartCostByModel', 'bar', { labels:['A','B','C'], datasets:[{data:[10,20,15],backgroundColor:'#484F58'}] }, {responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{display:false},y:{display:false}}});
                initOrUpdateChart('chartLatency', 'bar', { labels:['X','Y'], datasets:[{data:[100,200],backgroundColor:'#484F58'}] }, {responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{display:false},y:{display:false}}});
                initOrUpdateChart('chartTokens', 'doughnut', { labels:['P','C'], datasets:[{data:[70,30],backgroundColor:['#484F58','#2a2f35'],borderWidth:0}] }, {responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}}});
                return;
            }
            
            
            initOrUpdateChart('chartTraffic', 'line', {
                labels: data.traffic.map(d => d.date),
                datasets: [{ label: 'Requests', data: data.traffic.map(d => d.requests), borderColor: '#58A6FF', tension: 0.4, fill: true, backgroundColor: 'rgba(88, 166, 255, 0.1)' }]
            }, { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } } });

            initOrUpdateChart('chartCostByModel', 'bar', {
                labels: data.costByModel.map(d => d.model),
                datasets: [{ label: 'Cost ($)', data: data.costByModel.map(d => d.cost), backgroundColor: ['#D29922', '#3FB950', '#8957E5', '#58A6FF'], borderRadius: 4 }]
            }, { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } } });

            initOrUpdateChart('chartLatency', 'bar', {
                labels: data.latencyByProvider.map(d => d.provider),
                datasets: [{ label: 'Latency (ms)', data: data.latencyByProvider.map(d => d.avgLatency), backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4 }]
            }, { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { grid: { display: false } } } });

            initOrUpdateChart('chartTokens', 'doughnut', {
                labels: ['Prompt Tokens', 'Completion Tokens'],
                datasets: [{ data: [data.tokens.promptTokens, data.tokens.completionTokens], backgroundColor: ['#58A6FF', '#8957E5'], borderWidth: 0 }]
            }, { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, cutout: '75%' });
        });
    }

    if (AUTH_KEY) {
        refreshAll();
        // Set up promo apply button
        const promoApplyBtn = document.getElementById('dashboardPromoApplyBtn');
        if (promoApplyBtn) {
            promoApplyBtn.addEventListener('click', applyDashboardPromo);
        }
    }
    setInterval(refreshAll, 60000);
    </script>
</body>
</html>`;