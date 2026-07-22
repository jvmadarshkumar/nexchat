import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, MessageSquare, Shield, Sparkles, UserCheck } from 'lucide-react';
import useChatStore from '../store/useChatStore';

export default function Navbar({ theme, toggleTheme }) {
  const location = useLocation();
  const isAuthenticated = useChatStore((s) => s.isAuthenticated);
  const currentUser = useChatStore((s) => s.currentUser);

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <span className="text-white font-black text-base tracking-tighter">NX</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              NexChat
            </span>
            <span className="text-[10px] tracking-widest uppercase font-semibold text-indigo-400">
              Community & Collaboration
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link
            to="/"
            className={`transition-colors ${isActive('/') ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-100'}`}>
            Home
          </Link>
          <Link
            to="/pricing"
            className={`transition-colors ${isActive('/pricing') ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-100'}`}>
            Pricing
          </Link>
          <Link
            to="/contact"
            className={`transition-colors ${isActive('/contact') ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-100'}`}>
            Contact Us
          </Link>
        </nav>

        {/* Actions & Theme Switcher */}
        <div className="flex items-center gap-3">
          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            title="Toggle Light / Night Mode"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:border-slate-700 transition-all cursor-pointer">
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          {isAuthenticated ? (
            <Link
              to="/app"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-purple-700 transition-all">
              <MessageSquare className="w-4 h-4" />
              <span>Go to App</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-slate-300 hover:text-white text-sm font-medium transition-colors">
                Sign In
              </Link>
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-purple-700 transition-all">
                Register Free
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
