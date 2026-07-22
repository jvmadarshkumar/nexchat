import React, { useState } from 'react';
import { Mail, MapPin, Phone, Send, CheckCircle2, MessageSquare, Clock, Globe } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function Contact({ theme, toggleTheme }) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSubmitted(true);
  };

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
            <Mail className="w-3.5 h-3.5" />
            <span>Get in Touch With Us</span>
          </div>
          <h1 className={`text-4xl font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>We'd Love to Hear From You</h1>
          <p className={`mt-4 text-base leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Have questions about NexChat, need technical support, or want to deploy NexChat for your institution or company? Reach out to our official team anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-6">
            {/* Email Card */}
            <div className={`p-6 rounded-2xl border flex items-start gap-4 transition-all ${
              isLight ? 'bg-white border-slate-200 hover:border-indigo-500/50 shadow-sm' : 'bg-slate-900 border-slate-800 hover:border-indigo-500/40'
            }`}>
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-sm font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Official Email</h3>
                <a href="mailto:jvmadarshkumar@gmail.com" className={`text-base font-bold transition-colors mt-1 block select-all ${
                  isLight ? 'text-slate-900 hover:text-indigo-600' : 'text-slate-100 hover:text-indigo-400'
                }`}>
                  jvmadarshkumar@gmail.com
                </a>
                <p className="text-xs text-slate-500 mt-1">Direct support & developer inquiry</p>
              </div>
            </div>

            {/* Address Card */}
            <div className={`p-6 rounded-2xl border flex items-start gap-4 transition-all ${
              isLight ? 'bg-white border-slate-200 hover:border-purple-500/50 shadow-sm' : 'bg-slate-900 border-slate-800 hover:border-purple-500/40'
            }`}>
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-sm font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Headquarters Address</h3>
                <p className={`text-sm font-medium mt-1 leading-relaxed select-all ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                  Lovely Professional University,<br />
                  Jalandhar-Delhi G.T. Road, Phagwara,<br />
                  Punjab (India) - 144411
                </p>
                <div className="flex items-center gap-1.5 text-xs text-purple-500 mt-2 font-medium">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Campus Tech Hub</span>
                </div>
              </div>
            </div>

            {/* Phone Card */}
            <div className={`p-6 rounded-2xl border flex items-start gap-4 transition-all ${
              isLight ? 'bg-white border-slate-200 hover:border-emerald-500/50 shadow-sm' : 'bg-slate-900 border-slate-800 hover:border-emerald-500/40'
            }`}>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-sm font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Phone & WhatsApp Support</h3>
                <a href="tel:+917903680308" className={`text-base font-bold transition-colors mt-1 block select-all ${
                  isLight ? 'text-slate-900 hover:text-emerald-600' : 'text-slate-100 hover:text-emerald-400'
                }`}>
                  +91 7903680308
                </a>
                <p className="text-xs text-slate-500 mt-1">Available Monday – Saturday, 9 AM – 7 PM IST</p>
              </div>
            </div>
          </div>

          {/* Contact Form Column */}
          <div className="lg:col-span-7">
            <div className={`p-8 rounded-3xl border shadow-2xl backdrop-blur-md transition-all ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800/80'
            }`}>
              <h2 className={`text-xl font-bold mb-6 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>Send Us a Direct Message</h2>

              {submitted ? (
                <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3 animate-scale-in">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Message Delivered Successfully!</h3>
                  <p className={`text-sm max-w-md mx-auto ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    Thank you for contacting NexChat. Our team will review your message and reply to <span className="font-semibold text-emerald-500">{form.email}</span> shortly.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                    className="mt-4 px-5 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition-colors">
                    Send Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className={`block text-xs font-semibold uppercase mb-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Your Full Name</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. Adarsh Kumar"
                        className={`w-full text-sm rounded-xl px-4 py-3 border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                          isLight 
                            ? 'bg-slate-50 text-slate-900 border-slate-200' 
                            : 'bg-slate-850/60 text-slate-100 border-slate-800'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold uppercase mb-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Email Address</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="you@domain.com"
                        className={`w-full text-sm rounded-xl px-4 py-3 border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                          isLight 
                            ? 'bg-slate-50 text-slate-900 border-slate-200' 
                            : 'bg-slate-850/60 text-slate-100 border-slate-800'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold uppercase mb-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Subject</label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      placeholder="e.g. Enterprise Deployment Inquiry"
                      className={`w-full text-sm rounded-xl px-4 py-3 border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                        isLight 
                          ? 'bg-slate-50 text-slate-900 border-slate-200' 
                          : 'bg-slate-850/60 text-slate-100 border-slate-800'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold uppercase mb-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Your Message</label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="How can we assist your community or organization?"
                      className={`w-full text-sm rounded-xl px-4 py-3 border focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none ${
                        isLight 
                          ? 'bg-slate-50 text-slate-900 border-slate-200' 
                          : 'bg-slate-850/60 text-slate-100 border-slate-800'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-purple-700 transition-all cursor-pointer">
                    <Send className="w-4 h-4" />
                    <span>Submit Inquiry</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
