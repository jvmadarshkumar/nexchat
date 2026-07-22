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
      <div className="min-h-screen w-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse">
          <span className="text-white font-black text-xs">NX</span>
        </div>
        <p className="text-slate-500 text-xs tracking-wider uppercase font-semibold">Connecting to NexChat…</p>
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
