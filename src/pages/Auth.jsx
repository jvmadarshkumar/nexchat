/**
 * Auth.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Interactive Login, Signup & Email OTP verification portal powered by React Hook Form.
 * Integrates slide transitions, validation schemas, and real SMTP routing controls.
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import useChatStore from '../store/useChatStore';
import { loginUser, registerUser, verifyOtp } from '../utils/mockApi';

const PROFILE_COLORS = [
  { value: '#6366F1', label: 'Indigo' },
  { value: '#7C3AED', label: 'Violet' },
  { value: '#0EA5E9', label: 'Sky' },
  { value: '#10B981', label: 'Emerald' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#F59E0B', label: 'Amber' },
];

export default function Auth() {
  const navigate = useNavigate();
  const loginStore = useChatStore((s) => s.login);

  // States: step: 'auth' | 'otp'
  const [step, setStep] = useState('auth');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  
  // Registration parameters cached locally for OTP verification
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [selectedColor, setSelectedColor] = useState('#6366F1');
  
  // Developer helper for when no Brevo API key is specified
  const [mockOtpHelper, setMockOtpHelper] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Main login/signup forms
  const {
    register: registerAuth,
    handleSubmit: handleAuthSubmit,
    reset: resetAuthForm,
    formState: { errors: authErrors },
  } = useForm();

  // Separate form configuration for OTP verification to keep schemas clean
  const {
    register: registerOtp,
    handleSubmit: handleOtpSubmit,
    reset: resetOtpForm,
    formState: { errors: otpErrors },
  } = useForm();

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setAuthError(null);
    setMockOtpHelper(null);
    resetAuthForm();
  };

  const handleGoBackToAuth = () => {
    setStep('auth');
    setAuthError(null);
    setMockOtpHelper(null);
    resetOtpForm();
  };

  // Main login or register submission
  const onAuthSubmit = async (data) => {
    setLoading(true);
    setAuthError(null);
    try {
      if (isLogin) {
        // Authenticate directly
        const res = await loginUser({ email: data.email.trim(), password: data.password.trim() });
        loginStore(res.user, res.token);
        navigate('/');
      } else {
        // Request OTP registration flow
        const res = await registerUser({
          name: data.name.trim(),
          email: data.email.trim(),
          password: data.password.trim(),
          color: selectedColor,
        });

        setRegisteredEmail(data.email);
        
        // Handle Brevo SMTP bypass helper
        if (res.isFallback) {
          setMockOtpHelper(res.otp);
        }

        // Toggle to OTP entry card
        setStep('otp');
        setLoading(false);
        resetOtpForm();
      }
    } catch (err) {
      console.error('[Auth] Submit failed:', err);
      setAuthError(err.response?.data?.error || 'Operation failed. Please verify credentials.');
      setLoading(false);
    }
  };

  // OTP Verification code submission
  const onOtpSubmit = async (data) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await verifyOtp({
        email: registeredEmail,
        otp: data.otp,
      });

      // Verification successful - log user in
      loginStore(res.user, res.token);
      navigate('/');
    } catch (err) {
      console.error('[Auth] OTP verification failed:', err);
      setAuthError(err.response?.data?.error || 'Verification failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center p-4 bg-slate-950 relative overflow-hidden select-none">
      {/* Background radial glow */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[100px] pointer-events-none" />

      {/* Card Wrapper */}
      <div className="w-full max-w-md z-10 animate-scale-in">
        
        {/* Logo and title */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-3 animate-pulse">
            <span className="text-white font-black text-xl tracking-tight">NX</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Welcome to NexChat</h1>
          <p className="text-slate-500 text-sm mt-1.5 text-center px-4">
            {step === 'otp'
              ? `Confirm verification sent to ${registeredEmail}`
              : isLogin
              ? 'Sign in to access your workspaces'
              : 'Create an account to start collaborating'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 shadow-2xl shadow-black/60 backdrop-blur-md">
          {/* Error Banner */}
          {authError && (
            <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs rounded-xl px-4 py-3 mb-6 animate-shake">
              <span className="text-rose-400 shrink-0 font-bold">⚠️</span>
              <p className="leading-normal">{authError}</p>
            </div>
          )}

          {/* Developer SMTP Fallback Banner */}
          {step === 'otp' && mockOtpHelper && (
            <div className="flex flex-col gap-1.5 bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs rounded-xl px-4 py-3.5 mb-6">
              <div className="flex items-center gap-1.5 font-semibold">
                <span className="text-amber-400">⚡</span>
                <span>Developer Testing Fallback</span>
              </div>
              <p className="leading-relaxed text-slate-400">
                Brevo API key is not configured. Your 6-digit OTP verification code generated by the server is:{' '}
                <span className="text-indigo-400 font-bold tracking-wider text-sm select-all">{mockOtpHelper}</span>
              </p>
            </div>
          )}

          {/* STEP 1: LOGIN / SIGNUP FORMS */}
          {step === 'auth' && (
            <div className={isLogin ? 'animate-slide-in-left' : 'animate-slide-in-right'}>
              <form onSubmit={handleAuthSubmit(onAuthSubmit)} className="flex flex-col gap-5" noValidate>
                
                {/* Name (Signup only) */}
                {!isLogin && (
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="auth-name" className="text-xs font-semibold text-slate-400">DISPLAY NAME</label>
                    <input
                      id="auth-name"
                      type="text"
                      placeholder="e.g. Alex Code"
                      className={`bg-slate-850/50 text-slate-100 text-sm rounded-xl px-4 py-3 border focus:outline-none transition-all
                        ${authErrors.name
                          ? 'border-rose-500/60 focus:ring-1 focus:ring-rose-500/40 animate-shake'
                          : 'border-slate-800 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/40'}`}
                      {...registerAuth('name', {
                        required: 'Display name is required.',
                        minLength: { value: 3, message: 'Name must be at least 3 characters.' }
                      })}
                    />
                    {authErrors.name && <p className="text-[11px] text-rose-400">⚠ {authErrors.name.message}</p>}
                  </div>
                )}

                {/* Email Address */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="auth-email" className="text-xs font-semibold text-slate-400">EMAIL ADDRESS</label>
                  <input
                    id="auth-email"
                    type="email"
                    placeholder="name@company.com"
                    className={`bg-slate-850/50 text-slate-100 text-sm rounded-xl px-4 py-3 border focus:outline-none transition-all
                      ${authErrors.email
                        ? 'border-rose-500/60 focus:ring-1 focus:ring-rose-500/40 animate-shake'
                        : 'border-slate-800 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/40'}`}
                    {...registerAuth('email', {
                      required: 'Email address is required.',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Please enter a valid email address.'
                      }
                    })}
                  />
                  {authErrors.email && <p className="text-[11px] text-rose-400">⚠ {authErrors.email.message}</p>}
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="auth-password" className="text-xs font-semibold text-slate-400">PASSWORD</label>
                  <div className="relative flex items-center">
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={`w-full bg-slate-850/50 text-slate-100 text-sm rounded-xl pl-4 pr-10 py-3 border focus:outline-none transition-all
                        ${authErrors.password
                          ? 'border-rose-500/60 focus:ring-1 focus:ring-rose-500/40 animate-shake'
                          : 'border-slate-800 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/40'}`}
                      {...registerAuth('password', {
                        required: 'Password is required.',
                        minLength: { value: 6, message: 'Password must be at least 6 characters.' }
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-slate-400 hover:text-slate-200 transition-colors p-1"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {authErrors.password && <p className="text-[11px] text-rose-400">⚠ {authErrors.password.message}</p>}
                </div>

                {/* Accent Color selection (Signup only) */}
                {!isLogin && (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-slate-400">AVATAR ACCENT COLOR</span>
                    <div className="flex items-center gap-2.5 mt-1">
                      {PROFILE_COLORS.map((col) => (
                        <button
                          key={col.value}
                          type="button"
                          title={col.label}
                          onClick={() => setSelectedColor(col.value)}
                          className="w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
                          style={{ backgroundColor: col.value }}>
                          {selectedColor === col.value && (
                            <span className="w-2 h-2 rounded-full bg-white shadow" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer
                    bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25
                    hover:from-indigo-400 hover:to-indigo-500 active:scale-[0.98]
                    disabled:opacity-40 disabled:cursor-not-allowed">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
                      </svg>
                      Sending OTP…
                    </span>
                  ) : isLogin ? (
                    'Sign In to Workspace'
                  ) : (
                    'Request Verification Code'
                  )}
                </button>
              </form>

              {/* Toggle switch link */}
              <div className="text-center mt-6">
                <button
                  onClick={toggleForm}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer">
                  {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: OTP VERIFICATION CODE PANEL */}
          {step === 'otp' && (
            <div className="animate-slide-in-right">
              <form onSubmit={handleOtpSubmit(onOtpSubmit)} className="flex flex-col gap-5" noValidate>
                <div className="flex flex-col gap-2">
                  <label htmlFor="otp-input" className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
                    Enter 6-Digit OTP Code
                  </label>
                  <p className="text-xs text-slate-500 text-center mb-2">
                    Check your mailbox for the activation code.
                  </p>
                  
                  <input
                    id="otp-input"
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    autoFocus
                    className={`bg-slate-850/50 text-slate-100 text-center font-bold tracking-[8px] text-lg rounded-xl px-4 py-3.5 border focus:outline-none transition-all
                      ${otpErrors.otp
                        ? 'border-rose-500/60 focus:ring-1 focus:ring-rose-500/40 animate-shake'
                        : 'border-slate-800 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/40'}`}
                    {...registerOtp('otp', {
                      required: 'OTP verification code is required.',
                      pattern: {
                        value: /^[0-9]{6}$/,
                        message: 'Verification code must be exactly 6 numeric digits.'
                      }
                    })}
                  />
                  {otpErrors.otp && (
                    <p className="text-[11px] text-rose-400 text-center mt-1">⚠ {otpErrors.otp.message}</p>
                  )}
                </div>

                {/* Submit Code */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer
                    bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25
                    hover:from-indigo-400 hover:to-indigo-500 active:scale-[0.98]
                    disabled:opacity-40 disabled:cursor-not-allowed">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
                      </svg>
                      Verifying Code…
                    </span>
                  ) : (
                    'Verify Code & Access Workspace'
                  )}
                </button>
              </form>

              {/* Helper Links */}
              <div className="flex items-center justify-between mt-6 px-1">
                <button
                  onClick={handleGoBackToAuth}
                  className="text-xs text-slate-500 hover:text-slate-400 transition-colors cursor-pointer">
                  ← Edit Signup Info
                </button>
                
                <button
                  onClick={handleAuthSubmit(onAuthSubmit)}
                  disabled={loading}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer disabled:opacity-40">
                  Resend OTP
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
