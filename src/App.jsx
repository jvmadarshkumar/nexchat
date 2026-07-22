/**
 * App.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Root application:
 *  - Sets up React Router DOM with ProtectedRoutes
 *  - Routes:
 *      /login     → Authenticate (Login & Signup)
 *      /          → Dashboard (Protected)
 *      /settings  → Settings (Protected)
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useChatStore from './store/useChatStore';
import Dashboard from './pages/Dashboard';
import Settings  from './pages/Settings';
import Auth      from './pages/Auth';
import apiClient from './utils/mockApi';

import Home from './pages/Home';
import Contact from './pages/Contact';
import Pricing from './pages/Pricing';

// ─── Protected Route Wrapper ──────────────────────────────────────────────────
// Redirects unauthenticated users to the /login screen.

function ProtectedRoute({ children }) {
  const isAuthenticated = useChatStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// ─── App Shell ─────────────────────────────────────────────────────────────────

function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 font-sans antialiased text-slate-100 selection:bg-indigo-500 selection:text-white">
      {children}
    </div>
  );
}

// ─── Root App ──────────────────────────────────────────────────────────────────

export default function App() {
  const token = useChatStore((s) => s.token);
  const setCurrentUser = useChatStore((s) => s.setCurrentUser);
  const logout = useChatStore((s) => s.logout);
  const [loading, setLoading] = useState(!!token);
  const [theme, setTheme] = useState(localStorage.getItem('nexchat_theme') || 'dark');

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('nexchat_theme', next);
  };

  // If a token is stored locally, fetch current user info before rendering.
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let active = true;
    apiClient.get('/users/me')
      .then((data) => {
        if (active) {
          setCurrentUser(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('[App] Token validation failed:', err);
        if (active) {
          if (err.response?.status === 401) {
            logout(); // Clear stale session only on 401
          }
          setLoading(false);
        }
      });

    return () => { active = false; };
  }, [token, setCurrentUser, logout]);

  if (loading) {
    return (
      <div className="min-h-screen w-screen bg-slate-950 flex flex-col items-center justify-center gap-6 select-none overflow-hidden relative">
        {/* Glow backdrop decorative */}
        <div className="absolute w-[300px] h-[300px] bg-gradient-to-tr from-indigo-500/10 to-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Outer concentric pulsing waves wrapper */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-indigo-500/30 blur-md animate-loading-wave-1" />
          <div className="absolute inset-0 rounded-full bg-purple-500/30 blur-md animate-loading-wave-2" />
          <div className="absolute inset-0 rounded-full bg-pink-500/20 blur-md animate-loading-wave-3" />

          {/* Slow rotating ring */}
          <div className="absolute inset-2 rounded-full border border-indigo-500/30 border-t-indigo-500 animate-spin-slow" />

          {/* Glowing central Logo container */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-indigo-500/40 relative z-10">
            <span className="text-white font-black text-sm tracking-tighter animate-pulse">NX</span>
          </div>
        </div>

        {/* Text description with letter glow */}
        <div className="flex flex-col items-center gap-1.5 z-10">
          <p className="text-indigo-400 text-xs tracking-widest uppercase font-bold animate-text-glow">Connecting to NexChat</p>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Please wait…</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          {/* Public Marketing Landing Pages */}
          <Route path="/" element={<Home theme={theme} toggleTheme={toggleTheme} />} />
          <Route path="/contact" element={<Contact theme={theme} toggleTheme={toggleTheme} />} />
          <Route path="/pricing" element={<Pricing theme={theme} toggleTheme={toggleTheme} />} />

          {/* Guest login portal */}
          <Route path="/login" element={<Auth />} />

          {/* Protected Chat Workspace Dashboard */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <Dashboard theme={theme} toggleTheme={toggleTheme} />
              </ProtectedRoute>
            }
          />

          {/* Profile settings panel */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings theme={theme} toggleTheme={toggleTheme} />
              </ProtectedRoute>
            }
          />

          {/* Redirect catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
