// ============================================================
//  TaskFlow — Professional Task Management Frontend
//  OAuth2 PKCE · Spring Authorization Server · React
// ============================================================

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Config ─────────────────────────────────────────────────
const AUTH_URL  = "http://localhost:9000";
const API_URL   = "http://localhost:8080";
const CLIENT_ID = "sample-client";
const REDIRECT  = typeof window !== "undefined"
    ? window.location.origin + window.location.pathname
    : "http://localhost:5173/";

// ─── PKCE Helpers ────────────────────────────────────────────
const rnd = len =>
    btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(len))))
        .replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"");

const sha256b64url = async str => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
      .replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"");
};

const decodeJwt = t => {
  try { return JSON.parse(atob(t.split(".")[1])); }
  catch { return {}; }
};

const fmtTime = ts => new Date(ts * 1000).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
const fmtDate = ts => new Date(ts * 1000).toLocaleDateString([], {month:"short",day:"numeric",year:"numeric"});

// ─── Global Styles ───────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink:      #0a0a0f;
    --ink2:     #1a1a28;
    --ink3:     #2a2a3d;
    --mist:     #f0eff8;
    --mist2:    #e4e2f4;
    --mist3:    #d0cde8;
    --violet:   #5b4aff;
    --violet2:  #7b6aff;
    --violet3:  #a99fff;
    --teal:     #0bbfb0;
    --teal2:    #0d9e91;
    --rose:     #ff4a6b;
    --amber:    #f5a623;
    --text:     #e8e6f8;
    --text2:    #9896b8;
    --text3:    #5a587a;
    --border:   rgba(255,255,255,.07);
    --border2:  rgba(255,255,255,.12);
    --glass:    rgba(255,255,255,.04);
    --glass2:   rgba(255,255,255,.08);
    --shadow:   0 8px 40px rgba(0,0,0,.45);
    --shadow-sm:0 2px 12px rgba(0,0,0,.3);
    --r:        12px;
    --r-sm:     8px;
    --r-lg:     18px;
    --font-display: 'Syne', sans-serif;
    --font-body:    'Instrument Sans', sans-serif;
    --font-mono:    'JetBrains Mono', monospace;
  }

  html { background: var(--ink); color: var(--text); font-family: var(--font-body); font-size: 14px; line-height: 1.6; }
  body { margin: 0; min-height: 100vh; }
  #root { min-height: 100vh; }

  ::selection { background: rgba(91,74,255,.35); color: white; }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--ink3); border-radius: 2px; }

  /* ── Layout ── */
  .app { display: grid; grid-template-columns: 240px 1fr; min-height: 100vh; }

  /* ── Sidebar ── */
  .sidebar {
    background: var(--ink2);
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column;
    position: relative; overflow: hidden;
  }
  .sidebar::before {
    content: '';
    position: absolute; top: -80px; left: -80px;
    width: 280px; height: 280px;
    background: radial-gradient(circle, rgba(91,74,255,.15) 0%, transparent 70%);
    pointer-events: none;
  }

  .sidebar-logo {
    padding: 28px 22px 20px;
    border-bottom: 1px solid var(--border);
    position: relative;
  }
  .logo-row { display: flex; align-items: center; gap: 10px; }
  .logo-icon {
    width: 34px; height: 34px; border-radius: 10px;
    background: linear-gradient(135deg, var(--violet), var(--teal));
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; box-shadow: 0 4px 16px rgba(91,74,255,.4);
  }
  .logo-icon svg { width: 16px; height: 16px; stroke: white; fill: none; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
  .logo-name { font-family: var(--font-display); font-size: 17px; font-weight: 700; letter-spacing: -.3px; color: var(--text); }
  .logo-tag { font-size: 10px; color: var(--text3); letter-spacing: .08em; text-transform: uppercase; font-family: var(--font-mono); margin-top: 2px; }

  .sidebar-nav { padding: 14px 12px; flex: 1; display: flex; flex-direction: column; gap: 2px; }
  .nav-section-label {
    font-size: 10px; font-family: var(--font-mono); letter-spacing: .1em;
    text-transform: uppercase; color: var(--text3); padding: 10px 10px 4px;
  }

  .nav-btn {
    display: flex; align-items: center; gap: 10px; padding: 9px 10px;
    border-radius: var(--r-sm); border: none; background: transparent; cursor: pointer;
    color: var(--text2); font-family: var(--font-body); font-size: 13px; font-weight: 500;
    width: 100%; text-align: left; transition: all .18s; position: relative;
  }
  .nav-btn:hover { background: var(--glass2); color: var(--text); }
  .nav-btn.active {
    background: rgba(91,74,255,.15); color: var(--violet3);
  }
  .nav-btn.active::before {
    content: ''; position: absolute; left: 0; top: 25%; bottom: 25%;
    width: 2px; border-radius: 1px; background: var(--violet2);
  }
  .nav-btn svg { width: 15px; height: 15px; flex-shrink: 0; stroke: currentColor; fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
  .nav-badge { margin-left: auto; background: rgba(91,74,255,.25); color: var(--violet3); font-family: var(--font-mono); font-size: 10px; padding: 1px 6px; border-radius: 99px; }

  .sidebar-user {
    padding: 14px 16px 18px;
    border-top: 1px solid var(--border);
  }
  .user-card { display: flex; align-items: center; gap: 10px; }
  .user-ava {
    width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
    background: linear-gradient(135deg, rgba(91,74,255,.5), rgba(11,191,176,.5));
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-display); font-size: 12px; font-weight: 700; color: white;
    border: 1px solid var(--border2);
  }
  .user-info { flex: 1; min-width: 0; }
  .user-name { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text); }
  .user-role { font-size: 10px; color: var(--text3); font-family: var(--font-mono); }
  .user-logout {
    padding: 5px; background: transparent; border: none; cursor: pointer;
    color: var(--text3); border-radius: 6px; display: flex; align-items: center;
    transition: all .15s;
  }
  .user-logout:hover { color: var(--rose); background: rgba(255,74,107,.1); }
  .user-logout svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

  /* ── Main content ── */
  .main { display: flex; flex-direction: column; overflow-y: auto; background: var(--ink); }
  .main-header {
    padding: 28px 32px 0;
    display: flex; align-items: flex-start; justify-content: space-between;
    flex-wrap: wrap; gap: 14px;
  }
  .page-eyebrow { font-size: 10px; font-family: var(--font-mono); letter-spacing: .1em; text-transform: uppercase; color: var(--text3); margin-bottom: 4px; }
  .page-title { font-family: var(--font-display); font-size: 24px; font-weight: 700; color: var(--text); letter-spacing: -.4px; }
  .page-sub { font-size: 13px; color: var(--text2); margin-top: 3px; }
  .main-body { padding: 24px 32px 40px; flex: 1; }

  /* ── Buttons ── */
  .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: var(--r-sm); border: none; font-family: var(--font-body); font-size: 13px; font-weight: 600; cursor: pointer; transition: all .18s; }
  .btn svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
  .btn-primary { background: var(--violet); color: white; box-shadow: 0 2px 12px rgba(91,74,255,.35); }
  .btn-primary:hover { background: var(--violet2); box-shadow: 0 4px 20px rgba(91,74,255,.5); transform: translateY(-1px); }
  .btn-secondary { background: var(--glass2); color: var(--text2); border: 1px solid var(--border2); }
  .btn-secondary:hover { background: var(--glass); color: var(--text); border-color: var(--border2); }
  .btn-danger { background: rgba(255,74,107,.12); color: var(--rose); border: 1px solid rgba(255,74,107,.2); }
  .btn-danger:hover { background: rgba(255,74,107,.2); }
  .btn-teal { background: rgba(11,191,176,.15); color: var(--teal); border: 1px solid rgba(11,191,176,.2); }
  .btn-teal:hover { background: rgba(11,191,176,.25); }
  .btn:disabled { opacity: .38; cursor: not-allowed; transform: none !important; }
  .btn-icon { padding: 7px; }

  /* ── Chips / Badges ── */
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 600; font-family: var(--font-mono); letter-spacing: .02em; }
  .chip-pending { background: rgba(245,166,35,.12); color: var(--amber); border: 1px solid rgba(245,166,35,.2); }
  .chip-completed { background: rgba(11,191,176,.12); color: var(--teal); border: 1px solid rgba(11,191,176,.2); }
  .chip-admin { background: rgba(255,74,107,.12); color: var(--rose); border: 1px solid rgba(255,74,107,.2); }
  .chip-user { background: rgba(91,74,255,.12); color: var(--violet3); border: 1px solid rgba(91,74,255,.2); }
  .chip-scope { background: rgba(11,191,176,.1); color: var(--teal); border: 1px solid rgba(11,191,176,.15); }

  /* ── Cards ── */
  .card { background: var(--ink2); border: 1px solid var(--border); border-radius: var(--r-lg); }
  .card-sm { background: var(--ink2); border: 1px solid var(--border); border-radius: var(--r); padding: 16px; }

  /* ── Stat grid ── */
  .stat-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
  .stat-card {
    background: var(--ink2); border: 1px solid var(--border); border-radius: var(--r);
    padding: 18px 20px; position: relative; overflow: hidden;
    transition: border-color .2s;
  }
  .stat-card:hover { border-color: var(--border2); }
  .stat-card::after {
    content: ''; position: absolute; top: 0; right: 0;
    width: 80px; height: 80px; border-radius: 50%;
    opacity: .07;
  }
  .stat-card.total::after { background: var(--text); }
  .stat-card.pending::after { background: var(--amber); }
  .stat-card.done::after { background: var(--teal); }
  .stat-label { font-size: 10px; font-family: var(--font-mono); text-transform: uppercase; letter-spacing: .1em; color: var(--text3); margin-bottom: 8px; }
  .stat-value { font-family: var(--font-display); font-size: 36px; font-weight: 800; line-height: 1; }
  .stat-card.total .stat-value { color: var(--text); }
  .stat-card.pending .stat-value { color: var(--amber); }
  .stat-card.done .stat-value { color: var(--teal); }
  .stat-sub { font-size: 11px; color: var(--text3); margin-top: 4px; }

  /* ── Task list ── */
  .task-list { display: flex; flex-direction: column; gap: 6px; }
  .task-item {
    background: var(--ink2); border: 1px solid var(--border); border-radius: var(--r);
    padding: 14px 16px; display: flex; align-items: center; gap: 14px;
    transition: all .18s; cursor: default; position: relative; overflow: hidden;
  }
  .task-item::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
    border-radius: 0 2px 2px 0; opacity: 0; transition: opacity .2s;
  }
  .task-item.status-pending::before { background: var(--amber); }
  .task-item.status-completed::before { background: var(--teal); }
  .task-item:hover { border-color: var(--border2); transform: translateX(2px); }
  .task-item:hover::before { opacity: 1; }

  .task-idx { font-family: var(--font-mono); font-size: 10px; color: var(--text3); width: 26px; flex-shrink: 0; }
  .task-body { flex: 1; min-width: 0; }
  .task-name { font-size: 13px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .task-desc { font-size: 12px; color: var(--text2); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .task-actions { display: flex; gap: 6px; opacity: 0; transition: opacity .15s; }
  .task-item:hover .task-actions { opacity: 1; }
  .task-action-btn { padding: 5px 8px; font-size: 11px; font-weight: 600; border-radius: 6px; border: none; cursor: pointer; font-family: var(--font-body); transition: all .15s; }
  .task-action-btn.edit { background: rgba(91,74,255,.15); color: var(--violet3); }
  .task-action-btn.edit:hover { background: rgba(91,74,255,.3); }
  .task-action-btn.del { background: rgba(255,74,107,.1); color: var(--rose); }
  .task-action-btn.del:hover { background: rgba(255,74,107,.25); }

  /* ── Empty state ── */
  .empty { padding: 64px 20px; text-align: center; }
  .empty-ring {
    width: 64px; height: 64px; border-radius: 50%;
    border: 2px dashed var(--ink3); margin: 0 auto 16px;
    display: flex; align-items: center; justify-content: center;
  }
  .empty-ring svg { width: 24px; height: 24px; stroke: var(--text3); fill: none; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
  .empty-title { font-family: var(--font-display); font-size: 15px; font-weight: 600; color: var(--text2); }
  .empty-sub { font-size: 12px; color: var(--text3); margin-top: 4px; }

  /* ── Header actions area ── */
  .header-actions { display: flex; gap: 8px; align-items: center; }

  /* ── Section header (above list) ── */
  .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .section-title { font-family: var(--font-display); font-size: 13px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: .06em; }

  /* ── Modal ── */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(0,0,0,.7); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .modal {
    background: var(--ink2); border: 1px solid var(--border2); border-radius: var(--r-lg);
    padding: 28px; width: 100%; max-width: 440px;
    box-shadow: var(--shadow);
    animation: modal-in .2s cubic-bezier(.34,1.56,.64,1);
  }
  @keyframes modal-in { from { opacity: 0; transform: scale(.92) translateY(12px); } }
  .modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }
  .modal-title { font-family: var(--font-display); font-size: 18px; font-weight: 700; color: var(--text); }
  .modal-close { background: transparent; border: none; cursor: pointer; color: var(--text3); padding: 4px; border-radius: 6px; transition: all .15s; }
  .modal-close:hover { color: var(--text); background: var(--glass2); }
  .modal-close svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .modal-footer { display: flex; gap: 8px; justify-content: flex-end; margin-top: 24px; }

  /* ── Form ── */
  .field { margin-bottom: 16px; }
  .field-label { display: block; font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--text3); margin-bottom: 6px; font-family: var(--font-mono); }
  .field-input, .field-textarea, .field-select {
    width: 100%; background: var(--ink3); border: 1px solid var(--border2); border-radius: var(--r-sm);
    color: var(--text); font-family: var(--font-body); font-size: 13px; padding: 10px 12px;
    outline: none; transition: border-color .15s;
  }
  .field-input:focus, .field-textarea:focus, .field-select:focus { border-color: var(--violet2); }
  .field-textarea { resize: vertical; min-height: 80px; line-height: 1.5; }
  .field-select { appearance: none; cursor: pointer; }
  .field-select option { background: var(--ink2); }

  /* ── Error ── */
  .err-box { background: rgba(255,74,107,.08); border: 1px solid rgba(255,74,107,.2); border-radius: var(--r-sm); padding: 10px 14px; font-size: 12px; color: var(--rose); margin-bottom: 14px; display: flex; gap: 8px; align-items: flex-start; }
  .err-box svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; flex-shrink: 0; margin-top: 1px; stroke-linecap: round; stroke-linejoin: round; }

  /* ── Loader ── */
  .loader { display: flex; align-items: center; gap: 10px; color: var(--text3); padding: 32px 0; font-size: 13px; }
  .spin { width: 16px; height: 16px; border: 2px solid var(--ink3); border-top-color: var(--violet2); border-radius: 50%; animation: spin .65s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Token page ── */
  .token-raw { background: var(--ink); border: 1px solid var(--border); border-radius: var(--r-sm); padding: 14px; font-family: var(--font-mono); font-size: 11px; color: var(--text2); word-break: break-all; line-height: 1.7; max-height: 130px; overflow-y: auto; }
  .claims-grid { display: grid; grid-template-columns: 120px 1fr; gap: 2px 0; }
  .claim-row { display: contents; }
  .claim-key { padding: 5px 8px 5px 0; font-family: var(--font-mono); font-size: 11px; color: var(--violet3); }
  .claim-val { padding: 5px 0; font-family: var(--font-mono); font-size: 11px; color: var(--text); border-bottom: 1px solid var(--border); }
  .claim-key { border-bottom: 1px solid var(--border); }

  /* ── RBAC page ── */
  .rbac-matrix { border: 1px solid var(--border); border-radius: var(--r); overflow: hidden; }
  .rbac-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--border); transition: background .15s; }
  .rbac-row:last-child { border-bottom: none; }
  .rbac-row:hover { background: var(--glass); }
  .rbac-action-name { font-size: 13px; font-weight: 500; color: var(--text); }
  .rbac-endpoint { font-family: var(--font-mono); font-size: 11px; color: var(--text3); margin-top: 2px; }
  .rbac-right { display: flex; align-items: center; gap: 8px; }
  .access-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .access-dot.yes { background: var(--teal); box-shadow: 0 0 6px var(--teal); }
  .access-dot.no  { background: var(--ink3); }
  .rbac-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: var(--ink2); border-bottom: 1px solid var(--border); }
  .rbac-header-label { font-size: 10px; font-family: var(--font-mono); text-transform: uppercase; letter-spacing: .1em; color: var(--text3); }

  /* ── Login page ── */
  .login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--ink); position: relative; overflow: hidden; }
  .login-bg {
    position: absolute; inset: 0; pointer-events: none;
    background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(91,74,255,.2) 0%, transparent 70%),
                radial-gradient(ellipse 50% 40% at 80% 100%, rgba(11,191,176,.12) 0%, transparent 70%);
  }
  .login-grid {
    position: absolute; inset: 0; pointer-events: none;
    background-image: linear-gradient(var(--border) 1px, transparent 1px),
                      linear-gradient(90deg, var(--border) 1px, transparent 1px);
    background-size: 40px 40px;
    mask-image: radial-gradient(ellipse 60% 60% at 50% 50%, black, transparent);
  }
  .login-card { position: relative; z-index: 1; width: 380px; }
  .login-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 40px; }
  .login-logo-icon { width: 42px; height: 42px; border-radius: 13px; background: linear-gradient(135deg, var(--violet), var(--teal)); display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 32px rgba(91,74,255,.45); }
  .login-logo-icon svg { width: 20px; height: 20px; stroke: white; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .login-logo-text { font-family: var(--font-display); font-size: 22px; font-weight: 800; color: var(--text); letter-spacing: -.5px; }
  .login-headline { font-family: var(--font-display); font-size: 32px; font-weight: 800; color: var(--text); line-height: 1.15; letter-spacing: -.6px; margin-bottom: 12px; }
  .login-sub { font-size: 14px; color: var(--text2); line-height: 1.6; margin-bottom: 36px; }
  .login-panel { background: var(--ink2); border: 1px solid var(--border2); border-radius: var(--r-lg); padding: 28px; }
  .login-flow-label { font-size: 10px; font-family: var(--font-mono); text-transform: uppercase; letter-spacing: .1em; color: var(--text3); margin-bottom: 18px; }
  .login-flow-steps { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }
  .flow-step { display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--text2); }
  .flow-num { width: 20px; height: 20px; border-radius: 50%; background: var(--ink3); border: 1px solid var(--border2); display: flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-size: 10px; color: var(--text3); flex-shrink: 0; }
  .login-btn-main { width: 100%; padding: 13px; font-size: 14px; justify-content: center; border-radius: var(--r-sm); font-weight: 700; font-family: var(--font-display); letter-spacing: .02em; }
  .login-hint { text-align: center; font-size: 11px; color: var(--text3); margin-top: 14px; font-family: var(--font-mono); }

  /* ── Toast ── */
  .toast-wrap { position: fixed; bottom: 24px; right: 24px; z-index: 999; display: flex; flex-direction: column; gap: 8px; }
  .toast {
    background: var(--ink2); border: 1px solid var(--border2); border-radius: var(--r-sm);
    padding: 12px 16px; display: flex; align-items: center; gap: 10px;
    font-size: 13px; min-width: 240px; box-shadow: var(--shadow);
    animation: toast-in .25s cubic-bezier(.34,1.56,.64,1);
  }
  @keyframes toast-in { from { opacity: 0; transform: translateX(20px); } }
  .toast.success { border-color: rgba(11,191,176,.3); }
  .toast.error   { border-color: rgba(255,74,107,.3); }
  .toast-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .toast.success .toast-dot { background: var(--teal); }
  .toast.error   .toast-dot { background: var(--rose); }

  /* ── Divider ── */
  .divider { height: 1px; background: var(--border); margin: 20px 0; }

  /* ── Token page layout ── */
  .token-section { margin-bottom: 24px; }
  .token-section-label { font-size: 10px; font-family: var(--font-mono); text-transform: uppercase; letter-spacing: .1em; color: var(--text3); margin-bottom: 10px; }

  /* ── Info row ── */
  .info-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 6px; }
  .info-key { font-size: 12px; color: var(--text3); min-width: 90px; }
  .info-val { font-size: 13px; color: var(--text); font-weight: 500; }

  /* ── Copy button ── */
  .copy-row { display: flex; align-items: flex-start; gap: 10px; }
  .copy-row .token-raw { flex: 1; }

  /* ── RBAC roles summary ── */
  .roles-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 20px; }

  /* ── Responsive ── */
  @media (max-width: 720px) {
    .app { grid-template-columns: 1fr; }
    .sidebar { display: none; }
    .stat-row { grid-template-columns: 1fr 1fr; }
    .main-header, .main-body { padding-left: 16px; padding-right: 16px; }
  }
`;

// ─── Icon primitives ──────────────────────────────────────────
const I = ({ d, size = 15, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={style}>
      {Array.isArray(d) ? d.map((p,i) => <path key={i} d={p}/>) : <path d={d}/>}
    </svg>
);

const IC = {
  tasks:   "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  token:   "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z",
  shield:  ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", "M9 12l2 2 4-4"],
  logout:  "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  plus:    "M12 5v14M5 12h14",
  refresh: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  close:   "M18 6L6 18M6 6l12 12",
  check:   "M20 6L9 17l-5-5",
  alert:   "M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
  lock:    "M12 22a10 10 0 110-20 10 10 0 010 20zm0-6v-4m0-4h.01",
  pencil:  "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  trash:   "M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2",
  user:    "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  copy:    "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z",
};

// ─── Toast system ─────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  }, []);
  return { toasts, add };
}

function Toasts({ toasts }) {
  return (
      <div className="toast-wrap">
        {toasts.map(t => (
            <div key={t.id} className={`toast ${t.type}`}>
              <div className="toast-dot" />
              <span>{t.msg}</span>
            </div>
        ))}
      </div>
  );
}

// ─── API helpers ──────────────────────────────────────────────
function apiReq(path, token, opts = {}) {
  return fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...opts.headers,
    },
  }).then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    if (r.status === 204) return null;
    return r.json();
  });
}

// ─── Login page ───────────────────────────────────────────────
function LoginPage({ onLogin, error }) {
  return (
      <>
        <style>{STYLES}</style>
        <div className="login-wrap">
          <div className="login-bg" />
          <div className="login-grid" />
          <div className="login-card">
            <div className="login-logo">
              <div className="login-logo-icon">
                <I d={IC.tasks} size={20} />
              </div>
              <div className="login-logo-text">TaskFlow</div>
            </div>

            <div className="login-headline">Work flows<br/>here.</div>
            <div className="login-sub">Secure task management powered by OAuth2 and Spring Security. Sign in to continue.</div>

            <div className="login-panel">
              <div className="login-flow-label">Authorization flow</div>
              <div className="login-flow-steps">
                {["PKCE code challenge generated", "Redirect to auth server :9000", "Exchange code for JWT", "Access API at :8080"].map((s, i) => (
                    <div className="flow-step" key={i}>
                      <div className="flow-num">{i + 1}</div>
                      <span>{s}</span>
                    </div>
                ))}
              </div>

              {error && (
                  <div className="err-box" style={{ marginBottom: 16 }}>
                    <I d={IC.alert} size={14} /> {error}
                  </div>
              )}

              <button className="btn btn-primary login-btn-main" onClick={onLogin}>
                <I d={IC.lock} size={14} />
                Sign in with OAuth2
              </button>
              <div className="login-hint">sample-client · PKCE S256 · openid profile</div>
            </div>
          </div>
        </div>
      </>
  );
}

// ─── Tasks page ───────────────────────────────────────────────
function TasksPage({ tasks, loading, error, isAdmin, onRefresh, onAdd, onEdit, onDelete }) {
  const pending   = tasks.filter(t => t.status === "PENDING").length;
  const completed = tasks.filter(t => t.status === "COMPLETED").length;

  return (
      <>
        <div className="main-header">
          <div>
            <div className="page-eyebrow">workspace</div>
            <div className="page-title">Tasks</div>
            <div className="page-sub">
              {tasks.length} total · {isAdmin ? "Admin access" : "User access"}
            </div>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={onRefresh}>
              <I d={IC.refresh} /> Refresh
            </button>
            <button className="btn btn-primary" onClick={onAdd}>
              <I d={IC.plus} /> New task
            </button>
          </div>
        </div>

        <div className="main-body">
          <div className="stat-row">
            <div className="stat-card total">
              <div className="stat-label">Total</div>
              <div className="stat-value">{tasks.length}</div>
              <div className="stat-sub">all tasks</div>
            </div>
            <div className="stat-card pending">
              <div className="stat-label">Pending</div>
              <div className="stat-value">{pending}</div>
              <div className="stat-sub">in progress</div>
            </div>
            <div className="stat-card done">
              <div className="stat-label">Done</div>
              <div className="stat-value">{completed}</div>
              <div className="stat-sub">completed</div>
            </div>
          </div>

          {error && (
              <div className="err-box" style={{ marginBottom: 16 }}>
                <I d={IC.alert} /> {error}
              </div>
          )}

          {loading && <div className="loader"><div className="spin" /> Fetching tasks…</div>}

          {!loading && tasks.length === 0 && !error && (
              <div className="empty">
                <div className="empty-ring"><I d={IC.tasks} size={22} /></div>
                <div className="empty-title">No tasks yet</div>
                <div className="empty-sub">Create your first task to get started.</div>
              </div>
          )}

          {tasks.length > 0 && (
              <>
                <div className="section-header">
                  <div className="section-title">Task list</div>
                  <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--font-mono)" }}>
                    {isAdmin ? "admin mode" : "user mode"}
                  </div>
                </div>

                <div className="task-list">
                  {tasks.map((task, i) => (
                      <div key={task.id || i} className={`task-item status-${task.status?.toLowerCase()}`}>
                        <span className="task-idx">#{String(i + 1).padStart(2, "0")}</span>
                        <div className="task-body">
                          <div className="task-name">{task.taskName}</div>
                          {task.taskDescription && (
                              <div className="task-desc">{task.taskDescription}</div>
                          )}
                        </div>
                        <span className={`chip chip-${task.status === "COMPLETED" ? "completed" : "pending"}`}>
                    {task.status?.toLowerCase()}
                  </span>
                        {isAdmin && (
                            <div className="task-actions">
                              <button className="task-action-btn edit" onClick={() => onEdit(task)}>Edit</button>
                              <button className="task-action-btn del" onClick={() => onDelete(task)}>Delete</button>
                            </div>
                        )}
                      </div>
                  ))}
                </div>
              </>
          )}
        </div>
      </>
  );
}

// ─── Add / Edit modal ─────────────────────────────────────────
function TaskModal({ token, task, onClose, onDone, toast }) {
  const isEdit = !!task;
  const [name, setName]   = useState(task?.taskName || "");
  const [desc, setDesc]   = useState(task?.taskDescription || "");
  const [status, setStatus] = useState(task?.status || "PENDING");
  const [busy, setBusy]   = useState(false);
  const [err, setErr]     = useState(null);

  const submit = async () => {
    if (!name.trim()) { setErr("Task name is required"); return; }
    setBusy(true); setErr(null);
    try {
      if (isEdit) {
        await apiReq(`/task/${task.id}`, token, {
          method: "PATCH",
          body: JSON.stringify({ taskName: name, taskDescription: desc, status }),
        });
        toast("Task updated", "success");
      } else {
        await apiReq("/task", token, {
          method: "POST",
          body: JSON.stringify({ taskName: name, taskDescription: desc }),
        });
        toast("Task created", "success");
      }
      onDone();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal">
          <div className="modal-head">
            <div className="modal-title">{isEdit ? "Edit task" : "New task"}</div>
            <button className="modal-close" onClick={onClose}><I d={IC.close} size={16} /></button>
          </div>

          {err && <div className="err-box"><I d={IC.alert} size={14} />{err}</div>}

          <div className="field">
            <label className="field-label">Task name *</label>
            <input className="field-input" value={name} onChange={e => setName(e.target.value)}
                   placeholder="What needs to be done?" autoFocus />
          </div>
          <div className="field">
            <label className="field-label">Description</label>
            <textarea className="field-textarea" value={desc} onChange={e => setDesc(e.target.value)}
                      placeholder="Optional details…" />
          </div>
          {isEdit && (
              <div className="field">
                <label className="field-label">Status</label>
                <select className="field-select" value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
          )}

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={busy}>
              {busy ? "Saving…" : isEdit ? "Save changes" : "Create task"}
            </button>
          </div>
        </div>
      </div>
  );
}

// ─── Delete confirm modal ─────────────────────────────────────
function DeleteModal({ token, task, onClose, onDone, toast }) {
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await apiReq(`/task/${task.id}`, token, { method: "DELETE" });
      toast("Task deleted", "success");
      onDone();
    } catch (e) {
      toast(e.message, "error");
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal" style={{ maxWidth: 380 }}>
          <div className="modal-head">
            <div className="modal-title">Delete task?</div>
            <button className="modal-close" onClick={onClose}><I d={IC.close} size={16} /></button>
          </div>
          <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--text)" }}>{task.taskName}</strong> will be permanently deleted. This cannot be undone.
          </p>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-danger" onClick={confirm} disabled={busy}>
              {busy ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
  );
}

// ─── Token inspector ──────────────────────────────────────────
function TokenPage({ token, claims }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(token);
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };

  const claimsToShow = ["sub","iss","iat","exp","roles","scope","jti"];

  return (
      <>
        <div className="main-header">
          <div>
            <div className="page-eyebrow">security</div>
            <div className="page-title">Token inspector</div>
            <div className="page-sub">Decoded JWT from current session</div>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={copy}>
              <I d={IC.copy} /> {copied ? "Copied!" : "Copy JWT"}
            </button>
          </div>
        </div>
        <div className="main-body">
          <div className="token-section">
            <div className="token-section-label">Raw JWT</div>
            <div className="token-raw">{token}</div>
          </div>

          <div className="card-sm" style={{ marginBottom: 20 }}>
            <div className="token-section-label" style={{ marginBottom: 12 }}>Decoded claims</div>
            <div className="claims-grid">
              {claimsToShow.filter(k => claims?.[k] !== undefined).map(k => (
                  <div className="claim-row" key={k}>
                    <div className="claim-key">{k}</div>
                    <div className="claim-val">
                      {k === "iat" || k === "exp"
                          ? `${fmtDate(claims[k])} ${fmtTime(claims[k])}`
                          : Array.isArray(claims[k])
                              ? claims[k].join(", ")
                              : String(claims[k])}
                    </div>
                  </div>
              ))}
            </div>
          </div>

          <div className="card-sm">
            <div className="token-section-label" style={{ marginBottom: 10 }}>Token info</div>
            <div className="info-row"><span className="info-key">Issuer</span><span className="info-val">{claims?.iss || "—"}</span></div>
            <div className="info-row"><span className="info-key">Subject</span><span className="info-val">{claims?.sub || "—"}</span></div>
            <div className="info-row"><span className="info-key">Expires</span><span className="info-val">{claims?.exp ? `${fmtDate(claims.exp)} at ${fmtTime(claims.exp)}` : "—"}</span></div>
            <div className="info-row"><span className="info-key">Issued at</span><span className="info-val">{claims?.iat ? `${fmtDate(claims.iat)} at ${fmtTime(claims.iat)}` : "—"}</span></div>
          </div>
        </div>
      </>
  );
}

// ─── RBAC page ────────────────────────────────────────────────
function RbacPage({ roles }) {
  const endpoints = [
    { label: "View all tasks",    method: "GET",    path: "/task",       roles: ["ROLE_USER","ROLE_ADMIN"] },
    { label: "Create task",       method: "POST",   path: "/task",       roles: ["ROLE_USER","ROLE_ADMIN"] },
    { label: "Update task",       method: "PATCH",  path: "/task/{id}",  roles: ["ROLE_ADMIN"] },
    { label: "Delete task",       method: "DELETE", path: "/task/{id}",  roles: ["ROLE_ADMIN"] },
    { label: "Register user",     method: "POST",   path: "/register",   roles: ["ROLE_SUPER_ADMIN"] },
  ];

  const mColors = { GET:"var(--teal)", POST:"var(--violet2)", PATCH:"var(--amber)", DELETE:"var(--rose)" };

  return (
      <>
        <div className="main-header">
          <div>
            <div className="page-eyebrow">access control</div>
            <div className="page-title">Permissions</div>
            <div className="page-sub">Role-based access for your current token</div>
          </div>
        </div>
        <div className="main-body">
          <div style={{ marginBottom: 20 }}>
            <div className="token-section-label" style={{ marginBottom: 8 }}>Your roles</div>
            <div className="roles-row">
              {roles.length === 0
                  ? <span style={{ fontSize: 12, color: "var(--text3)" }}>No roles in token</span>
                  : roles.map(r => (
                      <span key={r} className={`chip ${r.includes("ADMIN") ? "chip-admin" : "chip-user"}`}>{r}</span>
                  ))}
            </div>
          </div>

          <div className="rbac-matrix">
            <div className="rbac-header">
              <div className="rbac-header-label">Endpoint</div>
              <div className="rbac-header-label">Your access</div>
            </div>
            {endpoints.map(ep => {
              const canAccess = ep.roles.some(r => roles.includes(r));
              return (
                  <div className="rbac-row" key={ep.label}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, color: mColors[ep.method], background: `${mColors[ep.method]}18`, padding: "2px 6px", borderRadius: 4 }}>
                      {ep.method}
                    </span>
                        <span className="rbac-action-name">{ep.label}</span>
                      </div>
                      <div className="rbac-endpoint">{ep.path}</div>
                    </div>
                    <div className="rbac-right">
                      {ep.roles.map(r => (
                          <span key={r} className={`chip ${r.includes("SUPER") ? "chip-admin" : r.includes("ADMIN") ? "chip-admin" : "chip-user"}`}
                                style={{ opacity: roles.includes(r) ? 1 : .3 }}>
                      {r.replace("ROLE_","")}
                    </span>
                      ))}
                      <div className={`access-dot ${canAccess ? "yes" : "no"}`} />
                    </div>
                  </div>
              );
            })}
          </div>
        </div>
      </>
  );
}

// ─── Root app ─────────────────────────────────────────────────
export default function App() {
  const [token,  setToken]  = useState(() => sessionStorage.getItem("tf_token") || null);
  const [claims, setClaims] = useState(() => {
    const t = sessionStorage.getItem("tf_token");
    return t ? decodeJwt(t) : null;
  });
  const [page,   setPage]   = useState("tasks");
  const [tasks,  setTasks]  = useState([]);
  const [loading,setLoading]= useState(false);
  const [error,  setError]  = useState(null);
  const [modal,  setModal]  = useState(null); // null | {type,data}
  const { toasts, add: toast } = useToast();

  // ── OAuth2 callback ──────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code   = params.get("code");
    const state  = params.get("state");
    if (!code) return;

    const savedState   = sessionStorage.getItem("tf_state");
    const codeVerifier = sessionStorage.getItem("tf_verifier");
    if (state !== savedState) { setError("OAuth state mismatch — possible CSRF"); return; }
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
        .then(d => {
          if (d.access_token) {
            sessionStorage.setItem("tf_token", d.access_token);
            setToken(d.access_token);
            setClaims(decodeJwt(d.access_token));
          } else {
            setError(d.error_description || "Token exchange failed");
          }
        })
        .catch(() => setError("Token exchange network error"));
  }, []);

  // ── Login ────────────────────────────────────────────────
  const login = useCallback(async () => {
    const verifier  = rnd(64);
    const challenge = await sha256b64url(verifier);
    const state     = rnd(16);
    sessionStorage.setItem("tf_verifier", verifier);
    sessionStorage.setItem("tf_state",    state);
    const url = new URL(`${AUTH_URL}/oauth2/authorize`);
    url.searchParams.set("response_type",         "code");
    url.searchParams.set("client_id",             CLIENT_ID);
    url.searchParams.set("redirect_uri",          REDIRECT);
    url.searchParams.set("scope",                 "openid profile");
    url.searchParams.set("state",                 state);
    url.searchParams.set("code_challenge",        challenge);
    url.searchParams.set("code_challenge_method", "S256");
    window.location.href = url.toString();
  }, []);

  // ── Logout ───────────────────────────────────────────────
  const logout = useCallback(() => {
    sessionStorage.clear();
    setToken(null); setClaims(null); setTasks([]); setPage("tasks");
  }, []);

  // ── Fetch tasks ──────────────────────────────────────────
  const fetchTasks = useCallback(() => {
    if (!token) return;
    setLoading(true); setError(null);
    apiReq("/task", token)
        .then(setTasks)
        .catch(e => setError(e.message))
        .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (token && page === "tasks") fetchTasks();
  }, [token, page, fetchTasks]);

  // ── Role helpers ─────────────────────────────────────────
  const roles    = claims?.roles ?? [];
  const isAdmin  = Array.isArray(roles) ? roles.includes("ROLE_ADMIN") : false;
  const username = claims?.sub || "user";
  const initials = username.slice(0,2).toUpperCase();

  if (!token) return <LoginPage onLogin={login} error={error} />;

  return (
      <>
        <style>{STYLES}</style>

        <div className="app">
          {/* ── Sidebar ── */}
          <aside className="sidebar">
            <div className="sidebar-logo">
              <div className="logo-row">
                <div className="logo-icon"><I d={IC.tasks} size={16} /></div>
                <div>
                  <div className="logo-name">TaskFlow</div>
                  <div className="logo-tag">v1.0 · OAuth2</div>
                </div>
              </div>
            </div>

            <nav className="sidebar-nav">
              <div className="nav-section-label">Workspace</div>
              {[
                { id: "tasks",  icon: IC.tasks,  label: "Tasks", badge: tasks.length || null },
                { id: "token",  icon: IC.token,  label: "Token inspector" },
                { id: "rbac",   icon: IC.shield, label: "Permissions" },
              ].map(({ id, icon, label, badge }) => (
                  <button key={id} className={`nav-btn ${page === id ? "active" : ""}`} onClick={() => setPage(id)}>
                    <I d={icon} size={15} />
                    {label}
                    {badge != null && <span className="nav-badge">{badge}</span>}
                  </button>
              ))}
            </nav>

            <div className="sidebar-user">
              <div className="user-card">
                <div className="user-ava">{initials}</div>
                <div className="user-info">
                  <div className="user-name">{username}</div>
                  <div className="user-role">{isAdmin ? "admin" : "user"}</div>
                </div>
                <button className="user-logout" title="Sign out" onClick={logout}>
                  <I d={IC.logout} size={13} />
                </button>
              </div>
            </div>
          </aside>

          {/* ── Main ── */}
          <main className="main">
            {page === "tasks" && (
                <TasksPage
                    tasks={tasks} loading={loading} error={error}
                    isAdmin={isAdmin}
                    onRefresh={fetchTasks}
                    onAdd={() => setModal({ type: "add" })}
                    onEdit={t => setModal({ type: "edit", data: t })}
                    onDelete={t => setModal({ type: "delete", data: t })}
                />
            )}
            {page === "token" && <TokenPage token={token} claims={claims} />}
            {page === "rbac"  && <RbacPage roles={Array.isArray(roles) ? roles : [roles]} />}
          </main>
        </div>

        {/* ── Modals ── */}
        {modal?.type === "add" && (
            <TaskModal token={token} task={null} toast={toast}
                       onClose={() => setModal(null)}
                       onDone={() => { setModal(null); fetchTasks(); }} />
        )}
        {modal?.type === "edit" && (
            <TaskModal token={token} task={modal.data} toast={toast}
                       onClose={() => setModal(null)}
                       onDone={() => { setModal(null); fetchTasks(); }} />
        )}
        {modal?.type === "delete" && (
            <DeleteModal token={token} task={modal.data} toast={toast}
                         onClose={() => setModal(null)}
                         onDone={() => { setModal(null); fetchTasks(); }} />
        )}

        <Toasts toasts={toasts} />
      </>
  );
}