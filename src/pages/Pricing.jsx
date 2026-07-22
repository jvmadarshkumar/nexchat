import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Zap, Shield, Sparkles, Star } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function Pricing({ theme, toggleTheme }) {
  const isLight = theme === 'light';

  return (
    <div className={`min-h-screen font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200 ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      <Navbar theme={theme} toggleTheme={toggleTheme} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold uppercase tracking-wider mb-4 ${
            isLight ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
          }`}>
            <Zap className="w-3.5 h-3.5" />
            <span>Transparent & Affordable Plans</span>
          </div>
          <h1 className={`text-4xl font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>Flexible Plans Built for Everyone</h1>
          <p className={`mt-4 text-base leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Start completely free for public community messaging, group calls, and project tasks, or upgrade for unlimited storage and custom enterprise deployment.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {/* Card 1: Free Community */}
          <div className={`p-8 rounded-3xl border flex flex-col justify-between transition-all ${
            isLight ? 'bg-white border-slate-200 hover:border-slate-300 shadow-sm' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>Free Community</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-300'
                }`}>Forever Free</span>
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className={`text-4xl font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>$0</span>
                <span className={`${isLight ? 'text-slate-500' : 'text-slate-400'} text-sm`}>/ month</span>
              </div>
              <p className={`${isLight ? 'text-slate-600' : 'text-slate-400'} text-sm mb-6`}>Ideal for public communities, student groups, and individual collaborators.</p>

              <ul className={`space-y-3 text-sm mb-8 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Unlimited Direct Messages & Group Channels</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>WebRTC Audio & Video Calls</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Screen Sharing & Live Whiteboard</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Cached PPT Deck Presenter</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Project Task Assignment & Proof Verification</span>
                </li>
              </ul>
            </div>

            <Link
              to="/login"
              className={`w-full text-center py-3.5 rounded-xl font-semibold text-sm transition-colors block ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}>
              Get Started Free
            </Link>
          </div>

          {/* Card 2: Pro Workspace (Featured) */}
          <div className={`p-8 rounded-3xl border-2 relative flex flex-col justify-between shadow-2xl scale-105 ${
            isLight ? 'bg-white border-indigo-500 shadow-indigo-500/5' : 'bg-slate-900/90 border-indigo-500/80 shadow-indigo-500/20'
          }`}>
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold uppercase tracking-wider shadow-md">
              Most Popular
            </div>

            <div>
              <div className="flex items-center justify-between mb-4 mt-2">
                <h3 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Pro Workspace</h3>
                <Star className="w-5 h-5 text-indigo-500 fill-indigo-500" />
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className={`text-4xl font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>$12</span>
                <span className={`${isLight ? 'text-slate-500' : 'text-slate-400'} text-sm`}>/ seat / month</span>
              </div>
              <p className={`${isLight ? 'text-slate-600' : 'text-slate-400'} text-sm mb-6`}>Built for growing teams, companies, and institutional departments.</p>

              <ul className={`space-y-3 text-sm mb-8 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Everything in Free Community</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Unlimited MongoDB Cloud Storage</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Up to 2 Co-Admins per Community</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Priority Audio/Video WebRTC Mesh</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Advanced Task Submission Analytics</span>
                </li>
              </ul>
            </div>

            <Link
              to="/login"
              className="w-full text-center py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all block">
              Start 14-Day Free Trial
            </Link>
          </div>

          {/* Card 3: Enterprise Dedicated */}
          <div className={`p-8 rounded-3xl border flex flex-col justify-between transition-all ${
            isLight ? 'bg-white border-slate-200 hover:border-slate-300 shadow-sm' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>Enterprise</h3>
                <Shield className="w-5 h-5 text-purple-500" />
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className={`text-4xl font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>Custom</span>
              </div>
              <p className={`${isLight ? 'text-slate-600' : 'text-slate-400'} text-sm mb-6`}>For large universities, enterprises, and custom cloud deployments.</p>

              <ul className={`space-y-3 text-sm mb-8 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>Dedicated MongoDB Atlas Cluster</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>Custom Domain & SSL Setup</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>24/7 Dedicated Phone & WhatsApp Support</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>Custom Compliance & Security Audits</span>
                </li>
              </ul>
            </div>

            <Link
              to="/contact"
              className={`w-full text-center py-3.5 rounded-xl font-semibold text-sm transition-colors block ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-880 hover:bg-slate-700 text-white'
              }`}>
              Contact Sales
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
