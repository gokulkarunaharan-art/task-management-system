import { useState, useEffect, useCallback } from "react";

// ─── Config ────────────────────────────────────────────────────────────────
const AUTH_URL   = "http://localhost:9000";
const API_URL    = "http://localhost:8080";
const CLIENT_ID  = "sample-client";
const REDIRECT   = window.location.origin + window.location.pathname;

// ─── OAuth2 PKCE helpers ────────────────────────────────────────────────────
function randomBase64(len) {
  const arr = crypto.getRandomValues(new Uint8Array(len));
  return btoa(String.fromCharCode(...arr)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
async function sha256Base64url(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function parseJwt(token) {
  try { return JSON.parse(atob(token.split(".")[1])); }
  catch { return {}; }
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:    #0e0f11;
    --sur:   #16181c;
    --sur2:  #1e2127;
    --bord:  #2a2d35;
    --bord2: #383c47;
    --txt:   #e8eaf0;
    --txt2:  #8b90a0;
    --txt3:  #555a68;
    --acc:   #7c6af7;
    --acc2:  #a99cf9;
    --grn:   #4ade80;
    --red:   #f87171;
    --yel:   #facc15;
    --r:     10px;
    --r-sm:  6px;
    --font:  'DM Sans', sans-serif;
    --mono:  'DM Mono', monospace;
  }
  body { background: var(--bg); color: var(--txt); font-family: var(--font); font-size: 14px; line-height: 1.6; }
  h1 { font-size: 22px; font-weight: 500; }
  h2 { font-size: 16px; font-weight: 500; }
  h3 { font-size: 14px; font-weight: 500; }
  p  { color: var(--txt2); }

  .layout   { display: flex; min-height: 100vh; }
  .sidebar  { width: 220px; flex-shrink: 0; background: var(--sur); border-right: 1px solid var(--bord); display: flex; flex-direction: column; }
  .main     { flex: 1; padding: 32px; overflow-y: auto; }

  .logo     { padding: 24px 20px 20px; border-bottom: 1px solid var(--bord); }
  .logo-mark { display: flex; align-items: center; gap: 10px; }
  .logo-sq  { width: 28px; height: 28px; background: var(--acc); border-radius: 7px; display: flex; align-items: center; justify-content: center; }
  .logo-sq svg { width: 14px; height: 14px; fill: white; }
  .logo h1  { font-size: 15px; font-weight: 500; color: var(--txt); }

  .nav      { padding: 12px 10px; flex: 1; }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: var(--r-sm); cursor: pointer; color: var(--txt2); font-size: 13px; font-weight: 400; transition: background .15s, color .15s; border: none; background: transparent; width: 100%; text-align: left; }
  .nav-item:hover  { background: var(--sur2); color: var(--txt); }
  .nav-item.active { background: rgba(124,106,247,.15); color: var(--acc2); }
  .nav-item svg    { width: 15px; height: 15px; flex-shrink: 0; }

  .user-panel { padding: 14px 14px 18px; border-top: 1px solid var(--bord); }
  .user-row   { display: flex; align-items: center; gap: 10px; }
  .avatar     { width: 30px; height: 30px; border-radius: 50%; background: rgba(124,106,247,.25); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 500; color: var(--acc2); flex-shrink: 0; }
  .user-info  { flex: 1; min-width: 0; }
  .user-name  { font-size: 12px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .user-role  { font-size: 11px; color: var(--txt3); }
  .logout-btn { background: transparent; border: none; cursor: pointer; color: var(--txt3); padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
  .logout-btn:hover { color: var(--red); }
  .logout-btn svg { width: 14px; height: 14px; }

  .page-header  { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; gap: 16px; flex-wrap: wrap; }
  .page-title   { font-size: 20px; font-weight: 500; }
  .page-sub     { font-size: 13px; color: var(--txt2); margin-top: 2px; }

  .btn          { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: var(--r-sm); font-size: 13px; font-weight: 500; cursor: pointer; transition: background .15s, opacity .15s; border: none; font-family: var(--font); }
  .btn-primary  { background: var(--acc); color: white; }
  .btn-primary:hover { background: #6b59e6; }
  .btn-ghost    { background: transparent; border: 1px solid var(--bord2); color: var(--txt2); }
  .btn-ghost:hover  { background: var(--sur2); color: var(--txt); }
  .btn-danger   { background: rgba(248,113,113,.12); border: 1px solid rgba(248,113,113,.3); color: var(--red); }
  .btn-danger:hover { background: rgba(248,113,113,.2); }
  .btn:disabled { opacity: .4; cursor: not-allowed; }
  .btn svg      { width: 14px; height: 14px; }

  .badge       { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 500; }
  .badge-green { background: rgba(74,222,128,.12); color: var(--grn); border: 1px solid rgba(74,222,128,.2); }
  .badge-yel   { background: rgba(250,204,21,.12);  color: var(--yel); border: 1px solid rgba(250,204,21,.2); }
  .badge-acc   { background: rgba(124,106,247,.15); color: var(--acc2); border: 1px solid rgba(124,106,247,.25); }
  .badge-admin { background: rgba(248,113,113,.12); color: var(--red);  border: 1px solid rgba(248,113,113,.2); }

  .card        { background: var(--sur); border: 1px solid var(--bord); border-radius: var(--r); padding: 20px; }
  .card-sm     { background: var(--sur); border: 1px solid var(--bord); border-radius: var(--r-sm); padding: 14px 16px; }

  .stat-grid   { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-bottom: 28px; }
  .stat-card   { background: var(--sur2); border-radius: var(--r-sm); padding: 14px 16px; }
  .stat-label  { font-size: 11px; color: var(--txt3); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 6px; }
  .stat-value  { font-size: 24px; font-weight: 500; font-family: var(--mono); }

  .task-list   { display: flex; flex-direction: column; gap: 8px; }
  .task-item   { background: var(--sur); border: 1px solid var(--bord); border-radius: var(--r-sm); padding: 14px 16px; display: flex; align-items: center; gap: 14px; transition: border-color .15s; }
  .task-item:hover { border-color: var(--bord2); }
  .task-name   { font-size: 13px; font-weight: 500; flex: 1; min-width: 0; }
  .task-desc   { font-size: 12px; color: var(--txt2); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .task-num    { font-family: var(--mono); font-size: 11px; color: var(--txt3); width: 28px; flex-shrink: 0; }
  .task-actions { display: flex; gap: 6px; opacity: 0; transition: opacity .15s; }
  .task-item:hover .task-actions { opacity: 1; }

  .modal-bg    { position: absolute; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 100; min-height: 400px; }
  .modal       { background: var(--sur); border: 1px solid var(--bord2); border-radius: var(--r); padding: 24px; width: 100%; max-width: 420px; }
  .modal h2    { margin-bottom: 18px; }
  .modal-btns  { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }

  .form-group  { margin-bottom: 14px; }
  .form-label  { font-size: 12px; color: var(--txt2); margin-bottom: 5px; display: block; font-weight: 500; }
  input[type=text], textarea, select {
    width: 100%; background: var(--sur2); border: 1px solid var(--bord); border-radius: var(--r-sm);
    color: var(--txt); font-family: var(--font); font-size: 13px; padding: 8px 11px;
    transition: border-color .15s; outline: none;
  }
  input[type=text]:focus, textarea:focus, select:focus { border-color: var(--acc); }
  textarea { resize: vertical; min-height: 72px; line-height: 1.5; }

  .error-box   { background: rgba(248,113,113,.1); border: 1px solid rgba(248,113,113,.25); border-radius: var(--r-sm); padding: 10px 14px; font-size: 13px; color: var(--red); margin-bottom: 14px; }
  .empty-state { padding: 48px 0; text-align: center; color: var(--txt3); }
  .empty-icon  { font-size: 32px; margin-bottom: 10px; }
  .empty-msg   { font-size: 13px; }

  .login-page  { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); }
  .login-card  { width: 360px; }
  .login-card .logo-mark { justify-content: center; margin-bottom: 32px; }
  .login-card .logo h1   { font-size: 18px; }
  .login-intro { text-align: center; margin-bottom: 28px; }
  .login-intro h2 { font-size: 20px; margin-bottom: 6px; color: var(--txt); }
  .login-intro p  { font-size: 13px; }
  .login-btn   { width: 100%; padding: 11px; font-size: 14px; justify-content: center; border-radius: var(--r-sm); }
  .login-note  { text-align: center; margin-top: 14px; font-size: 12px; color: var(--txt3); }

  .rbac-section { margin-bottom: 28px; }
  .rbac-title   { font-size: 13px; font-weight: 500; color: var(--txt2); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--bord); }
  .rbac-row     { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--bord); }
  .rbac-row:last-child { border-bottom: none; }
  .rbac-action  { font-size: 13px; }
  .rbac-desc    { font-size: 12px; color: var(--txt2); }
  .rbac-chips   { display: flex; gap: 6px; flex-shrink: 0; }

  .token-box   { background: var(--sur2); border: 1px solid var(--bord); border-radius: var(--r-sm); padding: 12px; font-family: var(--mono); font-size: 11px; color: var(--txt2); word-break: break-all; line-height: 1.6; max-height: 120px; overflow-y: auto; }
  .claim-grid  { display: grid; grid-template-columns: auto 1fr; gap: 4px 16px; font-size: 12px; font-family: var(--mono); }
  .claim-key   { color: var(--acc2); }
  .claim-val   { color: var(--txt); }

  .loading     { display: flex; align-items: center; gap: 8px; color: var(--txt2); font-size: 13px; padding: 20px 0; }
  .spinner     { width: 16px; height: 16px; border: 2px solid var(--bord2); border-top-color: var(--acc); border-radius: 50%; animation: spin .7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

// ─── Icons (inline SVG) ─────────────────────────────────────────────────────
const Icon = ({ d, size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
);
const Icons = {
  tasks:  "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  add:    "M12 5v14M5 12h14",
  logout: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  token:  "M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4",
  shield: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  trash:  "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  close:  "M6 18L18 6M6 6l12 12",
  refresh:"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
};

// ─── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [token, setToken]     = useState(() => sessionStorage.getItem("access_token") || null);
  const [claims, setClaims]   = useState(() => {
    const t = sessionStorage.getItem("access_token");
    return t ? parseJwt(t) : null;
  });
  const [page, setPage]       = useState("tasks");
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  // ── Handle OAuth2 redirect callback ──────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code   = params.get("code");
    const state  = params.get("state");
    if (!code) return;

    const savedState    = sessionStorage.getItem("oauth_state");
    const codeVerifier  = sessionStorage.getItem("code_verifier");
    if (state !== savedState) { setError("OAuth state mismatch"); return; }

    window.history.replaceState({}, "", window.location.pathname);

    fetch(`${AUTH_URL}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type:    "authorization_code",
        client_id:     CLIENT_ID,
        redirect_uri:  REDIRECT,
        code,
        code_verifier: codeVerifier,
      }),
    })
        .then(r => r.json())
        .then(data => {
          if (data.access_token) {
            sessionStorage.setItem("access_token", data.access_token);
            setToken(data.access_token);
            setClaims(parseJwt(data.access_token));
          } else {
            setError(data.error_description || "Token exchange failed");
          }
        })
        .catch(() => setError("Token exchange failed"));
  }, []);

  // ── Login: start PKCE flow ────────────────────────────────────────────────
  const login = useCallback(async () => {
    const verifier  = randomBase64(64);
    const challenge = await sha256Base64url(verifier);
    const state     = randomBase64(16);
    sessionStorage.setItem("code_verifier", verifier);
    sessionStorage.setItem("oauth_state",   state);

    const url = new URL(`${AUTH_URL}/oauth2/authorize`);
    url.searchParams.set("response_type",          "code");
    url.searchParams.set("client_id",              CLIENT_ID);
    url.searchParams.set("redirect_uri",           REDIRECT);
    url.searchParams.set("scope",                  "openid profile");
    url.searchParams.set("state",                  state);
    url.searchParams.set("code_challenge",         challenge);
    url.searchParams.set("code_challenge_method",  "S256");
    window.location.href = url.toString();
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    sessionStorage.clear();
    setToken(null);
    setClaims(null);
    setTasks([]);
    setPage("tasks");
  }, []);

  // ── Fetch tasks ───────────────────────────────────────────────────────────
  const fetchTasks = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    fetch(`${API_URL}/task`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
        .then(data => setTasks(data))
        .catch(e => setError(e.message))
        .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { if (token && page === "tasks") fetchTasks(); }, [token, page, fetchTasks]);

  // ── Role helpers ──────────────────────────────────────────────────────────
  const roles    = claims?.roles || [];
  const isAdmin  = roles.includes("ROLE_ADMIN");
  const username = claims?.sub || "user";
  const initials = username.slice(0, 2).toUpperCase();

  if (!token) return <LoginPage onLogin={login} error={error} />;

  return (
      <>
        <style>{css}</style>
        <div className="layout">
          <aside className="sidebar">
            <div className="logo">
              <div className="logo-mark">
                <div className="logo-sq">
                  <svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="white" strokeWidth="2" fill="none"/></svg>
                </div>
                <h1>TaskFlow</h1>
              </div>
            </div>

            <nav className="nav">
              {[
                { id: "tasks",  icon: Icons.tasks,  label: "Tasks" },
                { id: "token",  icon: Icons.token,  label: "Token inspector" },
                { id: "rbac",   icon: Icons.shield, label: "Permissions" },
              ].map(({ id, icon, label }) => (
                  <button key={id} className={`nav-item ${page === id ? "active" : ""}`} onClick={() => setPage(id)}>
                    <Icon d={icon} /> {label}
                  </button>
              ))}
            </nav>

            <div className="user-panel">
              <div className="user-row">
                <div className="avatar">{initials}</div>
                <div className="user-info">
                  <div className="user-name">{username}</div>
                  <div className="user-role">{isAdmin ? "Admin" : "User"}</div>
                </div>
                <button className="logout-btn" title="Sign out" onClick={logout}>
                  <Icon d={Icons.logout} size={14} />
                </button>
              </div>
            </div>
          </aside>

          <main className="main">
            {page === "tasks"  && <TasksPage tasks={tasks} loading={loading} error={error} isAdmin={isAdmin} onRefresh={fetchTasks} onAdd={() => setShowAdd(true)} token={token} onTasksChange={fetchTasks} />}
            {page === "token"  && <TokenPage token={token} claims={claims} />}
            {page === "rbac"   && <RbacPage  isAdmin={isAdmin} roles={roles} />}
          </main>
        </div>

        {showAdd && <AddTaskModal token={token} onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); fetchTasks(); }} />}
      </>
  );
}

// ─── Login Page ──────────────────────────────────────────────────────────────
function LoginPage({ onLogin, error }) {
  return (
      <>
        <style>{css}</style>
        <div className="login-page">
          <div className="login-card">
            <div className="logo-mark">
              <div className="logo-sq" style={{ width: 36, height: 36, borderRadius: 9 }}>
                <svg viewBox="0 0 24 24" width="18" height="18"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="white" strokeWidth="2" fill="none"/></svg>
              </div>
              <h1 style={{ fontSize: 18 }}>TaskFlow</h1>
            </div>
            <div className="login-intro">
              <h2>Sign in to continue</h2>
              <p>You'll be redirected to the authorization server.</p>
            </div>
            {error && <div className="error-box">{error}</div>}
            <button className="btn btn-primary login-btn" onClick={onLogin}>
              <Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" size={14} />
              Continue with OAuth2
            </button>
            <p className="login-note">Uses PKCE authorization code flow · port 9000</p>
          </div>
        </div>
      </>
  );
}

// ─── Tasks Page ───────────────────────────────────────────────────────────────
function TasksPage({ tasks, loading, error, isAdmin, onRefresh, onAdd, token, onTasksChange }) {
  const total     = tasks.length;
  const pending   = tasks.filter(t => t.status === "PENDING").length;
  const completed = tasks.filter(t => t.status === "COMPLETED").length;

  return (
      <>
        <div className="page-header">
          <div>
            <h2 className="page-title">Tasks</h2>
            <p className="page-sub">Manage your team's work queue</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" onClick={onRefresh}>
              <Icon d={Icons.refresh} /> Refresh
            </button>
            <button className="btn btn-primary" onClick={onAdd}>
              <Icon d={Icons.add} /> Add task
            </button>
          </div>
        </div>

        <div className="stat-grid">
          <div className="stat-card"><div className="stat-label">Total</div><div className="stat-value" style={{ color: "var(--txt)" }}>{total}</div></div>
          <div className="stat-card"><div className="stat-label">Pending</div><div className="stat-value" style={{ color: "var(--yel)" }}>{pending}</div></div>
          <div className="stat-card"><div className="stat-label">Done</div><div className="stat-value" style={{ color: "var(--grn)" }}>{completed}</div></div>
        </div>

        {error   && <div className="error-box">{error}</div>}
        {loading && <div className="loading"><span className="spinner" /> Fetching tasks…</div>}

        {!loading && tasks.length === 0 && !error && (
            <div className="empty-state">
              <div className="empty-icon">○</div>
              <div className="empty-msg">No tasks yet. Add one to get started.</div>
            </div>
        )}

        <div className="task-list">
          {tasks.map((task, i) => (
              <div className="task-item" key={i}>
                <span className="task-num">#{String(i + 1).padStart(2, "0")}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="task-name">{task.taskName}</div>
                  {task.taskDescription && <div className="task-desc">{task.taskDescription}</div>}
                </div>
                <span className={`badge ${task.status === "COMPLETED" ? "badge-green" : "badge-yel"}`}>
              {task.status?.toLowerCase()}
            </span>
                {isAdmin && (
                    <div className="task-actions">
                      <span style={{ fontSize: 11, color: "var(--txt3)" }}>admin actions</span>
                    </div>
                )}
              </div>
          ))}
        </div>
      </>
  );
}

// ─── Add Task Modal ───────────────────────────────────────────────────────────
function AddTaskModal({ token, onClose, onAdded }) {
  const [name, setName]   = useState("");
  const [desc, setDesc]   = useState("");
  const [busy, setBusy]   = useState(false);
  const [err,  setErr]    = useState(null);

  const submit = () => {
    if (!name.trim()) { setErr("Task name is required"); return; }
    setBusy(true);
    fetch(`${API_URL}/task`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ taskName: name, taskDescription: desc }),
    })
        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
        .then(onAdded)
        .catch(e => setErr(e.message))
        .finally(() => setBusy(false));
  };

  return (
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, minHeight: 400 }}>
        <div style={{ background: "var(--sur)", border: "1px solid var(--bord2)", borderRadius: "var(--r)", padding: 24, width: "100%", maxWidth: 400 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <h2 style={{ fontSize: 16, fontWeight: 500 }}>New task</h2>
            <button className="btn btn-ghost" style={{ padding: "4px 8px" }} onClick={onClose}><Icon d={Icons.close} size={14} /></button>
          </div>
          {err && <div className="error-box">{err}</div>}
          <div className="form-group">
            <label className="form-label">Task name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="What needs to be done?" autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional details…" />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={busy}>
              {busy ? "Saving…" : "Add task"}
            </button>
          </div>
        </div>
      </div>
  );
}

// ─── Token Inspector Page ─────────────────────────────────────────────────────
function TokenPage({ token, claims }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(token); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  const interestingClaims = ["sub", "iss", "iat", "exp", "roles", "scope"];

  return (
      <>
        <div className="page-header">
          <div>
            <h2 className="page-title">Token inspector</h2>
            <p className="page-sub">Decoded JWT from your current session</p>
          </div>
          <button className="btn btn-ghost" onClick={copy}>{copied ? "Copied!" : "Copy token"}</button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: "var(--txt2)", marginBottom: 6, fontWeight: 500 }}>Raw JWT</div>
          <div className="token-box">{token}</div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 14, color: "var(--txt2)", fontSize: 12, textTransform: "uppercase", letterSpacing: ".05em" }}>Claims</h3>
          <div className="claim-grid">
            {interestingClaims.filter(k => claims?.[k] !== undefined).map(k => (
                <>
                  <span className="claim-key" key={k + "-k"}>{k}</span>
                  <span className="claim-val" key={k + "-v"}>
                {k === "iat" || k === "exp"
                    ? new Date(claims[k] * 1000).toLocaleString()
                    : Array.isArray(claims[k])
                        ? claims[k].join(", ")
                        : String(claims[k])}
              </span>
                </>
            ))}
          </div>
        </div>
      </>
  );
}

// ─── RBAC Page ────────────────────────────────────────────────────────────────
function RbacPage({ isAdmin, roles }) {
  const actions = [
    { action: "View tasks",        desc: "GET /task",        roles: ["ROLE_USER", "ROLE_ADMIN"] },
    { action: "Create task",       desc: "POST /task",       roles: ["ROLE_USER", "ROLE_ADMIN"] },
    { action: "Update task",       desc: "PUT /task/{id}",   roles: ["ROLE_ADMIN"] },
    { action: "Delete task",       desc: "DELETE /task/{id}",roles: ["ROLE_ADMIN"] },
    { action: "View all users",    desc: "GET /admin/users", roles: ["ROLE_ADMIN"] },
    { action: "Change task status",desc: "PATCH /task/{id}", roles: ["ROLE_ADMIN"] },
  ];

  return (
      <>
        <div className="page-header">
          <div>
            <h2 className="page-title">Role-based permissions</h2>
            <p className="page-sub">What your current token can access</p>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "var(--txt2)", marginBottom: 8, fontWeight: 500 }}>Your roles</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {roles.length === 0
                  ? <span style={{ color: "var(--txt3)", fontSize: 13 }}>No roles found in token</span>
                  : roles.map(r => (
                      <span key={r} className={`badge ${r.includes("ADMIN") ? "badge-admin" : "badge-acc"}`}>{r}</span>
                  ))}
            </div>
          </div>
          <div style={{ background: "var(--sur2)", borderRadius: "var(--r-sm)", padding: "10px 14px", fontSize: 13 }}>
            {isAdmin
                ? <span style={{ color: "var(--grn)" }}>Full access — you have the ROLE_ADMIN authority</span>
                : <span style={{ color: "var(--txt2)" }}>Limited access — you have ROLE_USER. Admin endpoints will return 403.</span>}
          </div>
        </div>

        <div className="card">
          <div className="rbac-title">Endpoint permissions</div>
          {actions.map(({ action, desc, roles: allowed }) => {
            const canAccess = allowed.some(r => roles.includes(r));
            return (
                <div className="rbac-row" key={action}>
                  <div>
                    <div className="rbac-action" style={{ color: canAccess ? "var(--txt)" : "var(--txt3)" }}>{action}</div>
                    <div className="rbac-desc">{desc}</div>
                  </div>
                  <div className="rbac-chips">
                    {allowed.map(r => (
                        <span key={r} className={`badge ${r.includes("ADMIN") ? "badge-admin" : "badge-acc"}`} style={{ opacity: roles.includes(r) ? 1 : .35 }}>
                    {r.replace("ROLE_", "")}
                  </span>
                    ))}
                  </div>
                </div>
            );
          })}
        </div>
      </>
  );
}
