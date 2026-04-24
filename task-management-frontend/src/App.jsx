// ─────────────────────────────────────────────────────────────────────────────
//  Task Management System — React Frontend
//  OAuth2 PKCE · Spring Authorization Server (:9000)
//  Resource Server (:8080) · Roles: ROLE_USER / ROLE_ADMIN / ROLE_SUPER_ADMIN
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";

// ── Config ────────────────────────────────────────────────────────────────────
const AUTH_URL  = "http://localhost:9000";
const API_URL   = "http://localhost:8080";
const CLIENT_ID = "sample-client";
const REDIRECT_URI = typeof window !== "undefined"
    ? `${window.location.origin}${window.location.pathname}`
    : "http://localhost:5173/";

// ── PKCE helpers ──────────────────────────────────────────────────────────────
const randomBase64url = (len) =>
    btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(len))))
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

const sha256Base64url = async (str) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
};

// ── JWT helpers ───────────────────────────────────────────────────────────────
const decodeJwt = (token) => {
  try { return JSON.parse(atob(token.split(".")[1])); }
  catch { return {}; }
};

const getRoles = (claims) => {
  const r = claims?.roles;
  if (!r) return [];
  return Array.isArray(r) ? r : [r];
};

const hasRole = (roles, role) => roles.includes(role);
const isAdmin      = (roles) => hasRole(roles, "ROLE_ADMIN") || hasRole(roles, "ROLE_SUPER_ADMIN");
const isSuperAdmin = (roles) => hasRole(roles, "ROLE_SUPER_ADMIN");

// ── API calls ─────────────────────────────────────────────────────────────────
async function apiFetch(url, token, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try { const body = await res.json(); msg = body.message || body.error || msg; } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── Global styles ─────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Inconsolata:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink:      #0e0e0f;
    --ink2:     #2c2c30;
    --ink3:     #6b6b72;
    --paper:    #f5f4f0;
    --paper2:   #eceae4;
    --paper3:   #e2e0d8;
    --wire:     #d8d6ce;
    --accent:   #c84b1f;
    --accent2:  rgba(200,75,31,.1);
    --green:    #1a7a4a;
    --green2:   rgba(26,122,74,.1);
    --blue:     #1a4b7a;
    --blue2:    rgba(26,75,122,.1);
    --amber:    #9a6010;
    --amber2:   rgba(154,96,16,.1);
    --r:        6px;
    --font-display: 'Syne', sans-serif;
    --font-mono:    'Inconsolata', monospace;
  }

  html { background: var(--paper); color: var(--ink); font-family: var(--font-mono); font-size: 14px; line-height: 1.6; }
  body { margin: 0; }
  ::selection { background: rgba(200,75,31,.2); }

  /* ── App shell ── */
  .shell {
    display: grid;
    grid-template-columns: 200px 1fr;
    min-height: 100vh;
  }

  /* ── Sidebar ── */
  .sidebar {
    background: var(--ink);
    color: var(--paper);
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 0;
    height: 100vh;
    overflow: hidden;
  }

  .sb-brand {
    padding: 24px 18px 20px;
    border-bottom: 1px solid rgba(255,255,255,.08);
  }
  .sb-logo {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 17px;
    letter-spacing: -.02em;
    color: #fff;
    line-height: 1;
  }
  .sb-sub {
    font-size: 10px;
    color: rgba(255,255,255,.3);
    letter-spacing: .12em;
    text-transform: uppercase;
    margin-top: 4px;
  }

  .sb-nav {
    flex: 1;
    padding: 12px 10px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .sb-nav-label {
    font-size: 9px;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: rgba(255,255,255,.2);
    padding: 8px 8px 4px;
    font-family: var(--font-mono);
  }

  .nav-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: var(--r);
    border: none;
    background: transparent;
    color: rgba(255,255,255,.5);
    font-family: var(--font-mono);
    font-size: 13px;
    cursor: pointer;
    width: 100%;
    text-align: left;
    transition: background .12s, color .12s;
    position: relative;
  }
  .nav-btn:hover { background: rgba(255,255,255,.06); color: rgba(255,255,255,.8); }
  .nav-btn.active {
    background: rgba(200,75,31,.18);
    color: #e8785a;
  }
  .nav-btn.active::before {
    content: '';
    position: absolute;
    left: 0; top: 25%; bottom: 25%;
    width: 2px;
    background: var(--accent);
    border-radius: 0 1px 1px 0;
  }
  .nav-btn svg { width: 13px; height: 13px; flex-shrink: 0; }
  .nav-count {
    margin-left: auto;
    font-size: 10px;
    background: rgba(255,255,255,.08);
    color: rgba(255,255,255,.35);
    padding: 1px 6px;
    border-radius: 99px;
  }
  .nav-btn.active .nav-count {
    background: rgba(200,75,31,.2);
    color: #e8785a;
  }

  .sb-footer {
    padding: 14px 14px 18px;
    border-top: 1px solid rgba(255,255,255,.08);
  }
  .sb-user-row {
    display: flex;
    align-items: center;
    gap: 9px;
  }
  .sb-avatar {
    width: 28px; height: 28px;
    border-radius: 50%;
    background: rgba(200,75,31,.3);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 11px;
    color: #e8785a;
    flex-shrink: 0;
    border: 1px solid rgba(200,75,31,.4);
  }
  .sb-user-info { flex: 1; min-width: 0; }
  .sb-username {
    font-size: 12px;
    color: rgba(255,255,255,.8);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .sb-role {
    font-size: 9px;
    letter-spacing: .08em;
    text-transform: uppercase;
    margin-top: 1px;
  }
  .role-super { color: #c084fc; }
  .role-admin { color: #60a5fa; }
  .role-user  { color: #4ade80; }

  .logout-btn {
    background: transparent;
    border: none;
    color: rgba(255,255,255,.25);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: color .12s, background .12s;
    display: flex;
  }
  .logout-btn:hover { color: var(--accent); background: rgba(200,75,31,.12); }
  .logout-btn svg { width: 13px; height: 13px; }

  /* ── Main area ── */
  .main {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--paper);
  }

  .page-header {
    padding: 28px 32px 20px;
    border-bottom: 1px solid var(--wire);
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .page-eyebrow {
    font-size: 9px;
    letter-spacing: .16em;
    text-transform: uppercase;
    color: var(--ink3);
    font-family: var(--font-mono);
    margin-bottom: 5px;
  }
  .page-title {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 700;
    color: var(--ink);
    letter-spacing: -.02em;
    line-height: 1;
  }
  .page-desc {
    font-size: 12px;
    color: var(--ink3);
    margin-top: 5px;
    font-family: var(--font-mono);
  }
  .header-actions { display: flex; gap: 8px; align-items: center; }

  .page-body { padding: 24px 32px 48px; flex: 1; }

  /* ── Buttons ── */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: var(--r);
    border: none;
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all .12s;
    letter-spacing: .02em;
  }
  .btn svg { width: 12px; height: 12px; flex-shrink: 0; }
  .btn:disabled { opacity: .35; cursor: not-allowed; }

  .btn-primary { background: var(--ink); color: var(--paper); }
  .btn-primary:hover:not(:disabled) { background: var(--ink2); }

  .btn-accent { background: var(--accent); color: #fff; }
  .btn-accent:hover:not(:disabled) { background: #b03c12; }

  .btn-ghost { background: var(--paper2); color: var(--ink2); border: 1px solid var(--wire); }
  .btn-ghost:hover:not(:disabled) { background: var(--paper3); }

  .btn-danger { background: rgba(200,75,31,.1); color: var(--accent); border: 1px solid rgba(200,75,31,.2); }
  .btn-danger:hover:not(:disabled) { background: rgba(200,75,31,.18); }

  .btn-sm { padding: 5px 10px; font-size: 11px; }

  /* ── Stats ── */
  .stats-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 22px; }
  .stat-card {
    background: #fff;
    border: 1px solid var(--wire);
    border-radius: var(--r);
    padding: 16px 18px;
  }
  .stat-label { font-size: 9px; letter-spacing: .14em; text-transform: uppercase; color: var(--ink3); margin-bottom: 8px; }
  .stat-val { font-family: var(--font-display); font-size: 40px; font-weight: 700; line-height: 1; }
  .s-total .stat-val { color: var(--ink); }
  .s-pending .stat-val { color: var(--amber); }
  .s-done .stat-val { color: var(--green); }

  /* ── Task list ── */
  .task-list { display: flex; flex-direction: column; gap: 4px; }

  .task-row {
    background: #fff;
    border: 1px solid var(--wire);
    border-radius: var(--r);
    padding: 12px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: border-color .12s, box-shadow .12s;
    position: relative;
  }
  .task-row:hover { border-color: var(--ink3); box-shadow: 0 1px 8px rgba(0,0,0,.06); }
  .task-row:hover .task-row-actions { opacity: 1; }

  .task-idx {
    font-size: 10px;
    color: var(--ink3);
    font-family: var(--font-mono);
    width: 22px;
    flex-shrink: 0;
  }
  .task-content { flex: 1; min-width: 0; }
  .task-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--ink);
    font-family: var(--font-display);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .task-desc { font-size: 11px; color: var(--ink3); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 99px;
    font-size: 10px;
    font-family: var(--font-mono);
    letter-spacing: .04em;
    flex-shrink: 0;
  }
  .badge-pending  { background: var(--amber2);  color: var(--amber); border: 1px solid rgba(154,96,16,.2); }
  .badge-done     { background: var(--green2);   color: var(--green); border: 1px solid rgba(26,122,74,.2); }
  .badge-admin    { background: var(--blue2);    color: var(--blue);  border: 1px solid rgba(26,75,122,.2); }
  .badge-super    { background: rgba(192,132,252,.12); color: #7e22ce; border: 1px solid rgba(126,34,206,.2); }
  .badge-user     { background: var(--green2);   color: var(--green); border: 1px solid rgba(26,122,74,.2); }

  .task-row-actions {
    display: flex;
    gap: 5px;
    opacity: 0;
    transition: opacity .12s;
    flex-shrink: 0;
  }

  /* ── Empty ── */
  .empty-state {
    text-align: center;
    padding: 64px 20px;
    border: 1px dashed var(--wire);
    border-radius: var(--r);
    background: #fff;
  }
  .empty-icon { font-size: 32px; margin-bottom: 12px; }
  .empty-title { font-family: var(--font-display); font-size: 16px; color: var(--ink2); margin-bottom: 4px; }
  .empty-sub { font-size: 12px; color: var(--ink3); }

  /* ── Loader / Error ── */
  .loader { display: flex; align-items: center; gap: 8px; color: var(--ink3); padding: 24px 0; font-size: 12px; }
  .spin {
    width: 14px; height: 14px;
    border: 2px solid var(--wire);
    border-top-color: var(--ink);
    border-radius: 50%;
    animation: spin .5s linear infinite;
    flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .error-bar {
    background: rgba(200,75,31,.08);
    border: 1px solid rgba(200,75,31,.2);
    border-radius: var(--r);
    padding: 10px 14px;
    font-size: 12px;
    color: var(--accent);
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .success-bar {
    background: var(--green2);
    border: 1px solid rgba(26,122,74,.2);
    border-radius: var(--r);
    padding: 10px 14px;
    font-size: 12px;
    color: var(--green);
    margin-bottom: 14px;
  }

  /* ── Section header ── */
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  .section-title { font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: var(--ink3); font-family: var(--font-mono); }
  .section-count { font-size: 10px; color: var(--ink3); font-family: var(--font-mono); }

  /* ── Modal / Overlay ── */
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.4);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 200;
    backdrop-filter: blur(4px);
  }
  .modal {
    background: #fff;
    border: 1px solid var(--wire);
    border-radius: 10px;
    padding: 26px;
    width: 100%;
    max-width: 420px;
    box-shadow: 0 20px 60px rgba(0,0,0,.15);
    animation: modal-in .18s ease;
  }
  @keyframes modal-in { from { opacity: 0; transform: scale(.95) translateY(10px); } }
  .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .modal-title { font-family: var(--font-display); font-size: 18px; font-weight: 700; color: var(--ink); }
  .modal-close {
    background: transparent; border: none; cursor: pointer;
    color: var(--ink3); padding: 3px; border-radius: 4px; transition: color .12s;
  }
  .modal-close:hover { color: var(--ink); }
  .modal-close svg { width: 14px; height: 14px; display: block; }
  .modal-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }

  /* ── Form fields ── */
  .field { margin-bottom: 14px; }
  .field-label {
    display: block;
    font-size: 10px;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--ink3);
    margin-bottom: 6px;
    font-family: var(--font-mono);
    font-weight: 500;
  }
  .field-input, .field-textarea, .field-select {
    width: 100%;
    background: var(--paper);
    border: 1px solid var(--wire);
    border-radius: var(--r);
    color: var(--ink);
    font-family: var(--font-mono);
    font-size: 13px;
    padding: 8px 11px;
    outline: none;
    transition: border-color .12s;
  }
  .field-input:focus, .field-textarea:focus, .field-select:focus { border-color: var(--ink); }
  .field-textarea { resize: vertical; min-height: 72px; }
  .field-select { appearance: none; cursor: pointer; }

  /* ── Divider ── */
  .divider { height: 1px; background: var(--wire); margin: 18px 0; }

  /* ── Card panel ── */
  .panel {
    background: #fff;
    border: 1px solid var(--wire);
    border-radius: var(--r);
    padding: 20px;
    margin-bottom: 16px;
  }
  .panel-title { font-family: var(--font-display); font-size: 15px; font-weight: 700; color: var(--ink); margin-bottom: 4px; }
  .panel-sub { font-size: 12px; color: var(--ink3); margin-bottom: 16px; }

  /* ── Login ── */
  .login-wrap {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--ink);
    position: relative;
    overflow: hidden;
  }
  .login-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
    background-size: 40px 40px;
  }
  .login-card {
    position: relative;
    z-index: 1;
    width: 380px;
    padding: 0 20px;
  }
  .login-brand {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 32px;
    color: #fff;
    letter-spacing: -.03em;
    margin-bottom: 4px;
  }
  .login-tagline {
    font-size: 12px;
    color: rgba(255,255,255,.35);
    font-family: var(--font-mono);
    margin-bottom: 36px;
  }
  .login-panel {
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 10px;
    padding: 24px;
  }
  .login-panel-title {
    font-size: 10px;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: rgba(255,255,255,.3);
    margin-bottom: 18px;
    font-family: var(--font-mono);
  }
  .login-steps { display: flex; flex-direction: column; gap: 10px; margin-bottom: 22px; }
  .login-step { display: flex; align-items: center; gap: 10px; font-size: 12px; color: rgba(255,255,255,.45); font-family: var(--font-mono); }
  .step-num {
    width: 18px; height: 18px;
    border-radius: 50%;
    background: rgba(255,255,255,.06);
    border: 1px solid rgba(255,255,255,.1);
    display: flex; align-items: center; justify-content: center;
    font-size: 9px;
    color: rgba(255,255,255,.3);
    flex-shrink: 0;
    font-family: var(--font-mono);
  }
  .login-btn {
    width: 100%;
    padding: 13px;
    font-size: 13px;
    justify-content: center;
    font-family: var(--font-display);
    font-weight: 700;
    letter-spacing: .04em;
    border-radius: var(--r);
    background: var(--accent);
    color: #fff;
    border: none;
    cursor: pointer;
    transition: background .12s;
  }
  .login-btn:hover { background: #b03c12; }
  .login-error {
    background: rgba(200,75,31,.15);
    border: 1px solid rgba(200,75,31,.3);
    border-radius: var(--r);
    padding: 10px 14px;
    font-size: 12px;
    color: #e8785a;
    margin-bottom: 14px;
    font-family: var(--font-mono);
  }

  /* ── Toast ── */
  .toast-stack {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 500;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .toast {
    background: var(--ink);
    color: rgba(255,255,255,.85);
    border-radius: var(--r);
    padding: 10px 14px;
    font-size: 12px;
    font-family: var(--font-mono);
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 220px;
    box-shadow: 0 4px 20px rgba(0,0,0,.3);
    animation: toast-in .18s ease;
    border-left: 3px solid var(--wire);
  }
  .toast.ok   { border-left-color: var(--green); }
  .toast.err  { border-left-color: var(--accent); }
  .toast.warn { border-left-color: var(--amber); }
  @keyframes toast-in { from { opacity: 0; transform: translateX(12px); } }

  /* ── Confirm modal ── */
  .confirm-text { font-size: 13px; color: var(--ink2); line-height: 1.6; font-family: var(--font-mono); }
  .confirm-text strong { color: var(--ink); }

  /* ── Info rows ── */
  .info-table { border: 1px solid var(--wire); border-radius: var(--r); overflow: hidden; }
  .info-row { display: grid; grid-template-columns: 130px 1fr; border-bottom: 1px solid var(--wire); }
  .info-row:last-child { border-bottom: none; }
  .info-key { padding: 9px 12px; font-size: 11px; color: var(--ink3); font-family: var(--font-mono); background: var(--paper2); border-right: 1px solid var(--wire); }
  .info-val { padding: 9px 12px; font-size: 11px; color: var(--ink); font-family: var(--font-mono); word-break: break-all; }

  /* ── Warn notice ── */
  .notice {
    background: var(--amber2);
    border: 1px solid rgba(154,96,16,.2);
    border-radius: var(--r);
    padding: 10px 14px;
    font-size: 12px;
    color: var(--amber);
    margin-bottom: 16px;
    font-family: var(--font-mono);
    line-height: 1.6;
  }

  @media (max-width: 680px) {
    .shell { grid-template-columns: 1fr; }
    .sidebar { display: none; }
    .page-header, .page-body { padding-left: 16px; padding-right: 16px; }
    .stats-row { grid-template-columns: 1fr 1fr; }
  }
`;

// ── SVG Icon helper ───────────────────────────────────────────────────────────
function Icon({ d, size = 16 }) {
  return (
      <svg
          width={size} height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
      >
        {[].concat(d).map((p, i) => <path key={i} d={p} />)}
      </svg>
  );
}

const ICONS = {
  tasks:   "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  users:   ["M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2","M9 11a4 4 0 100-8 4 4 0 000 8z","M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"],
  plus:    "M12 5v14M5 12h14",
  refresh: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  logout:  "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  close:   "M18 6L6 18M6 6l12 12",
  edit:    "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  trash:   "M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2",
  alert:   "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
  shield:  ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z","M9 12l2 2 4-4"],
};

// ── Toast hook ────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type = "ok") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
  }, []);
  return { toasts, push };
}

function ToastStack({ toasts }) {
  return (
      <div className="toast-stack">
        {toasts.map(t => (
            <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>
        ))}
      </div>
  );
}

// ── Login page ────────────────────────────────────────────────────────────────
function LoginPage({ onLogin, error }) {
  return (
      <>
        <style>{STYLES}</style>
        <div className="login-wrap">
          <div className="login-grid" />
          <div className="login-card">
            <div className="login-brand">TaskBoard</div>
            <div className="login-tagline">OAuth2 PKCE · Spring Authorization Server</div>
            <div className="login-panel">
              <div className="login-panel-title">Authorization flow</div>
              <div className="login-steps">
                {["Generate PKCE code challenge","Redirect to Auth Server :9000","Exchange code for JWT","Access resource server :8080"].map((s, i) => (
                    <div className="login-step" key={i}>
                      <div className="step-num">{i+1}</div>
                      <span>{s}</span>
                    </div>
                ))}
              </div>
              {error && <div className="login-error">{error}</div>}
              <button className="login-btn" onClick={onLogin}>
                Sign in with OAuth2 →
              </button>
            </div>
          </div>
        </div>
      </>
  );
}

// ── Task form modal ───────────────────────────────────────────────────────────
function TaskModal({ token, task, onClose, onDone, push }) {
  const isEdit = !!task;
  const [name,   setName]   = useState(task?.taskName || "");
  const [desc,   setDesc]   = useState(task?.taskDescription || "");
  const [status, setStatus] = useState(task?.status || "PENDING");
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState(null);

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Task name is required."); return; }
    setBusy(true); setError(null);
    try {
      if (isEdit) {
        await apiFetch(`${API_URL}/task/${task.id}`, token, {
          method: "PATCH",
          body: JSON.stringify({ taskName: name, taskDescription: desc, status }),
        });
        push("Task updated.", "ok");
      } else {
        await apiFetch(`${API_URL}/task`, token, {
          method: "POST",
          body: JSON.stringify({ taskName: name, taskDescription: desc }),
        });
        push("Task created.", "ok");
      }
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
      <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal">
          <div className="modal-header">
            <div className="modal-title">{isEdit ? "Edit task" : "New task"}</div>
            <button className="modal-close" onClick={onClose}><Icon d={ICONS.close} /></button>
          </div>
          {error && <div className="error-bar"><Icon d={ICONS.alert} />{error}</div>}
          <div className="field">
            <label className="field-label">Name *</label>
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
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={busy}>
              {busy ? "Saving…" : isEdit ? "Save changes" : "Create task"}
            </button>
          </div>
        </div>
      </div>
  );
}

// ── Delete confirm modal ──────────────────────────────────────────────────────
function DeleteModal({ token, task, onClose, onDone, push }) {
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await apiFetch(`${API_URL}/task/${task.id}`, token, { method: "DELETE" });
      push("Task deleted.", "ok");
      onDone();
    } catch (e) {
      push(e.message, "err");
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
      <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal" style={{ maxWidth: 360 }}>
          <div className="modal-header">
            <div className="modal-title">Delete task?</div>
            <button className="modal-close" onClick={onClose}><Icon d={ICONS.close} /></button>
          </div>
          <p className="confirm-text">
            <strong>{task.taskName}</strong> will be permanently deleted. This cannot be undone.
          </p>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-danger" onClick={confirm} disabled={busy}>
              {busy ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
  );
}

// ── Tasks page ────────────────────────────────────────────────────────────────
function TasksPage({ token, roles }) {
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [modal,   setModal]   = useState(null); // null | {type, data?}
  const { toasts, push } = useToast();

  const canEditDelete = hasRole(roles, "ROLE_ADMIN"); // ROLE_ADMIN or ROLE_SUPER_ADMIN

  const fetchTasks = useCallback(() => {
    setLoading(true); setError(null);
    apiFetch(`${API_URL}/task`, token)
        .then(setTasks)
        .catch(e => setError(e.message))
        .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const pending   = tasks.filter(t => t.status === "PENDING").length;
  const completed = tasks.filter(t => t.status === "COMPLETED").length;

  return (
      <>
        <div className="page-header">
          <div>
            <div className="page-eyebrow">workspace</div>
            <div className="page-title">Tasks</div>
            <div className="page-desc">
              {canEditDelete ? "Admin view — full CRUD access" : "Your task list — create only"}
            </div>
          </div>
          <div className="header-actions">
            <button className="btn btn-ghost btn-sm" onClick={fetchTasks}>
              <Icon d={ICONS.refresh} />Refresh
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setModal({ type: "create" })}>
              <Icon d={ICONS.plus} />New task
            </button>
          </div>
        </div>

        <div className="page-body">
          <div className="stats-row">
            <div className="stat-card s-total">
              <div className="stat-label">Total</div>
              <div className="stat-val">{tasks.length}</div>
            </div>
            <div className="stat-card s-pending">
              <div className="stat-label">Pending</div>
              <div className="stat-val">{pending}</div>
            </div>
            <div className="stat-card s-done">
              <div className="stat-label">Done</div>
              <div className="stat-val">{completed}</div>
            </div>
          </div>

          {error && <div className="error-bar"><Icon d={ICONS.alert} />{error}</div>}

          {loading && (
              <div className="loader"><div className="spin" />Fetching tasks…</div>
          )}

          {!loading && tasks.length === 0 && !error && (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <div className="empty-title">No tasks yet</div>
                <div className="empty-sub">Create your first task to get started.</div>
              </div>
          )}

          {tasks.length > 0 && (
              <>
                <div className="section-header">
                  <span className="section-title">Task list</span>
                  <span className="section-count">{tasks.length} items</span>
                </div>
                <div className="task-list">
                  {tasks.map((t, i) => (
                      <div key={t.id} className="task-row">
                        <span className="task-idx">#{String(i+1).padStart(2,"0")}</span>
                        <div className="task-content">
                          <div className="task-name">{t.taskName}</div>
                          {t.taskDescription && <div className="task-desc">{t.taskDescription}</div>}
                        </div>
                        <span className={`badge ${t.status === "COMPLETED" ? "badge-done" : "badge-pending"}`}>
                    {(t.status || "").toLowerCase()}
                  </span>
                        {/* Edit and Delete are only shown to ADMIN / SUPER_ADMIN */}
                        {canEditDelete && (
                            <div className="task-row-actions">
                              <button
                                  className="btn btn-ghost btn-sm"
                                  title="Edit"
                                  onClick={() => setModal({ type: "edit", data: t })}
                              >
                                <Icon d={ICONS.edit} />
                              </button>
                              <button
                                  className="btn btn-danger btn-sm"
                                  title="Delete"
                                  onClick={() => setModal({ type: "delete", data: t })}
                              >
                                <Icon d={ICONS.trash} />
                              </button>
                            </div>
                        )}
                      </div>
                  ))}
                </div>
              </>
          )}
        </div>

        {/* Modals */}
        {modal?.type === "create" && (
            <TaskModal token={token} task={null} push={push}
                       onClose={() => setModal(null)}
                       onDone={() => { setModal(null); fetchTasks(); }} />
        )}
        {modal?.type === "edit" && (
            <TaskModal token={token} task={modal.data} push={push}
                       onClose={() => setModal(null)}
                       onDone={() => { setModal(null); fetchTasks(); }} />
        )}
        {modal?.type === "delete" && (
            <DeleteModal token={token} task={modal.data} push={push}
                         onClose={() => setModal(null)}
                         onDone={() => { setModal(null); fetchTasks(); }} />
        )}

        <ToastStack toasts={toasts} />
      </>
  );
}

// ── User management page (SUPER_ADMIN only) ───────────────────────────────────
function UsersPage({ token, currentUsername, push }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role,     setRole]     = useState("ROLE_USER");
  const [delUser,  setDelUser]  = useState("");
  const [busy,     setBusy]     = useState(false);
  const [delBusy,  setDelBusy]  = useState(false);
  const [error,    setError]    = useState(null);
  const [delError, setDelError] = useState(null);
  const [success,  setSuccess]  = useState(null);

  const createUser = async () => {
    if (!username.trim() || !password.trim()) { setError("Username and password are required."); return; }
    setBusy(true); setError(null); setSuccess(null);
    try {
      // POST /user on the auth server itself, authenticated via Bearer JWT
      await apiFetch(`${AUTH_URL}/user`, token, {
        method: "POST",
        body: JSON.stringify({ username: username.trim(), password, roles: role }),
      });
      setSuccess(`User "${username.trim()}" created successfully.`);
      push(`User "${username.trim()}" created.`, "ok");
      setUsername(""); setPassword(""); setRole("ROLE_USER");
    } catch (e) {
      setError(e.message);
      push(e.message, "err");
    } finally {
      setBusy(false);
    }
  };

  const deleteUser = async () => {
    if (!delUser.trim()) { setDelError("Username is required."); return; }
    if (delUser.trim() === currentUsername) {
      setDelError("You cannot delete your own account."); return;
    }
    setDelBusy(true); setDelError(null);
    try {
      // DELETE /user on the auth server
      await apiFetch(`${AUTH_URL}/user`, token, {
        method: "DELETE",
        body: JSON.stringify({ username: delUser.trim() }),
      });
      push(`User "${delUser.trim()}" deleted.`, "ok");
      setDelUser("");
    } catch (e) {
      setDelError(e.message);
      push(e.message, "err");
    } finally {
      setDelBusy(false);
    }
  };

  return (
      <>
        <div className="page-header">
          <div>
            <div className="page-eyebrow">administration</div>
            <div className="page-title">Users</div>
            <div className="page-desc">Manage accounts on the authorization server</div>
          </div>
        </div>

        <div className="page-body">
          <div className="notice">
            ⚠ Operations here hit the auth server directly at <strong>:9000</strong>. Changes take effect immediately.
          </div>

          {/* Create user */}
          <div className="panel">
            <div className="panel-title">Create account</div>
            <div className="panel-sub">Register a new user with a role assignment.</div>
            {error   && <div className="error-bar"><Icon d={ICONS.alert} />{error}</div>}
            {success && <div className="success-bar">✓ {success}</div>}
            <div className="field">
              <label className="field-label">Username *</label>
              <input className="field-input" value={username}
                     onChange={e => setUsername(e.target.value)} placeholder="e.g. john.doe" />
            </div>
            <div className="field">
              <label className="field-label">Password *</label>
              <input className="field-input" type="password" value={password}
                     onChange={e => setPassword(e.target.value)} placeholder="Minimum 8 characters" />
            </div>
            <div className="field">
              <label className="field-label">Role</label>
              <select className="field-select" value={role} onChange={e => setRole(e.target.value)}>
                <option value="ROLE_USER">ROLE_USER — view + create tasks</option>
                <option value="ROLE_ADMIN">ROLE_ADMIN — edit + delete tasks</option>
                <option value="ROLE_SUPER_ADMIN">ROLE_SUPER_ADMIN — full system access</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={createUser} disabled={busy}>
              <Icon d={ICONS.plus} />
              {busy ? "Creating…" : "Create account"}
            </button>
          </div>

          <div className="divider" />

          {/* Delete user */}
          <div className="panel">
            <div className="panel-title">Delete account</div>
            <div className="panel-sub">Permanently remove a user from the authorization server.</div>
            {delError && <div className="error-bar"><Icon d={ICONS.alert} />{delError}</div>}
            <div className="field">
              <label className="field-label">Username to delete *</label>
              <input className="field-input" value={delUser}
                     onChange={e => setDelUser(e.target.value)} placeholder="Exact username" />
            </div>
            <button className="btn btn-danger" onClick={deleteUser} disabled={delBusy}>
              <Icon d={ICONS.trash} />
              {delBusy ? "Deleting…" : "Delete account"}
            </button>
          </div>
        </div>
      </>
  );
}

// ── Root component ────────────────────────────────────────────────────────────
export default function App() {
  // ── Auth state ──────────────────────────────────────────────
  const [token,  setToken]  = useState(() => sessionStorage.getItem("_tms_at") || null);
  const [claims, setClaims] = useState(() => {
    const t = sessionStorage.getItem("_tms_at");
    return t ? decodeJwt(t) : null;
  });
  const [authError, setAuthError] = useState(null);

  // ── Navigation ───────────────────────────────────────────────
  const [page, setPage] = useState("tasks");

  const { toasts, push } = useToast();

  const roles    = getRoles(claims);
  const username = claims?.sub || "user";

  // ── OAuth2 callback handler ──────────────────────────────────
  useEffect(() => {
    const params       = new URLSearchParams(window.location.search);
    const code         = params.get("code");
    const returnedState = params.get("state");
    if (!code) return;

    const savedState   = sessionStorage.getItem("_tms_state");
    const codeVerifier = sessionStorage.getItem("_tms_verifier");

    // Always clear the URL regardless of outcome
    window.history.replaceState({}, "", window.location.pathname);

    if (returnedState !== savedState) {
      setAuthError("State mismatch — possible CSRF. Please try again.");
      return;
    }

    fetch(`${AUTH_URL}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type:    "authorization_code",
        client_id:     CLIENT_ID,
        redirect_uri:  REDIRECT_URI,
        code,
        code_verifier: codeVerifier,
      }),
    })
        .then(r => r.json())
        .then(data => {
          if (data.access_token) {
            sessionStorage.setItem("_tms_at", data.access_token);
            setToken(data.access_token);
            setClaims(decodeJwt(data.access_token));
          } else {
            setAuthError(data.error_description || data.error || "Token exchange failed.");
          }
        })
        .catch(() => setAuthError("Network error during token exchange."));
  }, []);

  // ── Session expiry watcher ───────────────────────────────────
  useEffect(() => {
    if (!claims?.exp) return;
    const msLeft = claims.exp * 1000 - Date.now();
    if (msLeft <= 0) { handleLogout(); return; }
    const timer = setTimeout(() => {
      push("Session expired. Please sign in again.", "warn");
      handleLogout();
    }, msLeft);
    return () => clearTimeout(timer);
  }, [claims]);

  // ── Login ────────────────────────────────────────────────────
  const handleLogin = useCallback(async () => {
    const verifier  = randomBase64url(64);
    const challenge = await sha256Base64url(verifier);
    const state     = randomBase64url(16);
    sessionStorage.setItem("_tms_verifier", verifier);
    sessionStorage.setItem("_tms_state",    state);

    const url = new URL(`${AUTH_URL}/oauth2/authorize`);
    url.searchParams.set("response_type",         "code");
    url.searchParams.set("client_id",             CLIENT_ID);
    url.searchParams.set("redirect_uri",          REDIRECT_URI);
    url.searchParams.set("scope",                 "openid profile");
    url.searchParams.set("state",                 state);
    url.searchParams.set("code_challenge",        challenge);
    url.searchParams.set("code_challenge_method", "S256");
    window.location.href = url.toString();
  }, []);

  // ── Logout ───────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    sessionStorage.removeItem("_tms_at");
    sessionStorage.removeItem("_tms_verifier");
    sessionStorage.removeItem("_tms_state");
    setToken(null);
    setClaims(null);
    setPage("tasks");
  }, []);

  // ── Role display ─────────────────────────────────────────────
  const primaryRole = isSuperAdmin(roles)
      ? { label: "SUPER_ADMIN", cls: "role-super" }
      : isAdmin(roles)
          ? { label: "ADMIN", cls: "role-admin" }
          : { label: "USER",  cls: "role-user"  };

  // ── Not logged in ────────────────────────────────────────────
  if (!token) {
    return <LoginPage onLogin={handleLogin} error={authError} />;
  }

  // ── Navigation items (role-gated) ────────────────────────────
  const navItems = [
    { id: "tasks", label: "Tasks", icon: ICONS.tasks },
    // Users page only shown to SUPER_ADMIN
    ...(isSuperAdmin(roles) ? [{ id: "users", label: "Users", icon: ICONS.users }] : []),
  ];

  return (
      <>
        <style>{STYLES}</style>

        <div className="shell">
          {/* ── Sidebar ── */}
          <aside className="sidebar">
            <div className="sb-brand">
              <div className="sb-logo">TaskBoard</div>
              <div className="sb-sub">Spring + React</div>
            </div>

            <nav className="sb-nav">
              <div className="sb-nav-label">Navigation</div>
              {navItems.map(item => (
                  <button
                      key={item.id}
                      className={`nav-btn ${page === item.id ? "active" : ""}`}
                      onClick={() => setPage(item.id)}
                  >
                    <Icon d={item.icon} size={13} />
                    {item.label}
                  </button>
              ))}
            </nav>

            <div className="sb-footer">
              {/* Role badge */}
              <div style={{ marginBottom: 10 }}>
              <span className={`badge ${
                  primaryRole.cls === "role-super" ? "badge-super"
                      : primaryRole.cls === "role-admin" ? "badge-admin"
                          : "badge-user"
              }`}>
                {primaryRole.label}
              </span>
              </div>
              <div className="sb-user-row">
                <div className="sb-avatar">{username.slice(0, 2).toUpperCase()}</div>
                <div className="sb-user-info">
                  <div className="sb-username">{username}</div>
                  <div className={`sb-role ${primaryRole.cls}`} style={{ fontSize: 9, letterSpacing: ".08em" }}>
                    {roles.length} role{roles.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <button className="logout-btn" title="Sign out" onClick={handleLogout}>
                  <Icon d={ICONS.logout} size={13} />
                </button>
              </div>
            </div>
          </aside>

          {/* ── Main area ── */}
          <main className="main">
            {page === "tasks" && (
                <TasksPage token={token} roles={roles} />
            )}
            {page === "users" && isSuperAdmin(roles) && (
                <UsersPage token={token} currentUsername={username} push={push} />
            )}
            {page === "users" && !isSuperAdmin(roles) && (
                // Shouldn't normally reach here since nav item is hidden, but guard anyway
                <div className="page-body">
                  <div className="error-bar">
                    <Icon d={ICONS.alert} />Access denied — Super Admin only.
                  </div>
                </div>
            )}
          </main>
        </div>

        <ToastStack toasts={toasts} />
      </>
  );
}