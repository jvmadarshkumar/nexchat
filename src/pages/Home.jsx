import React from 'react';
import { Link } from 'react-router-dom';
import { Video, Monitor, Presentation, ShieldCheck, CheckSquare, FileText, Users, Sparkles, ArrowRight, Lock, Zap } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function Home({ theme, toggleTheme }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar theme={theme} toggleTheme={toggleTheme} />

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-pink-600/10 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-8 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Community & Workspace Hub</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Connect Communities, Present Ideas & Manage Projects{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              In Real Time
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Experience ultra-smooth audio & video group calls, interactive screen sharing, real-time whiteboards, browser-cached PPT slide deck presentations, and verified project assignments.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/login"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 text-white font-bold text-base shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 transition-all">
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/pricing"
              className="px-8 py-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-semibold text-base hover:bg-slate-850 hover:border-slate-700 transition-all">
              View Pricing Plans
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-20 bg-slate-900/50 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-white">Everything Your Team & Community Needs</h2>
            <p className="text-slate-400 mt-3 text-base">
              Built from the ground up for high productivity, seamless presentations, and multi-platform work verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-indigo-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 group-hover:scale-110 transition-transform">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">WebRTC Video & Community Calls</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Crystal-clear audio and video calling for 1-on-1 chats and community group rooms with zero latency.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-indigo-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5 group-hover:scale-110 transition-transform">
                <Monitor className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">Screen Share & Live Whiteboard</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Present your desktop screen or draw collaboratively with multi-user stroke synchronization during calls.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-indigo-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-5 group-hover:scale-110 transition-transform">
                <Presentation className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">Cached Low-Bandwidth PPT Presenter</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Upload PPT decks cached directly in the browser for ultra-smooth slide transitions even on weak internet connections.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-indigo-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
                <CheckSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">Project Assignments & Proof Submissions</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Assign tasks with external platform instructions. Members complete work and submit screenshot proof for admin approval.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-indigo-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">Super Admin & 2 Co-Admin Hierarchy</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Community creators control group rights, appoint up to 2 Co-Admins, transfer ownership, and manage member permissions.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-indigo-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-5 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">Multi-Format Media & Document Sharing</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Send PDFs, PPTs, Images, Contact vCards (.vcf), and interactive polls/quizzes directly into chats.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800/80 bg-slate-950 text-slate-400 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-extrabold text-xs">
              NX
            </div>
            <span className="font-semibold text-slate-200">NexChat Workspace & Community Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link>
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
          </div>

          <p className="text-xs text-slate-500">© 2026 NexChat Services. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
