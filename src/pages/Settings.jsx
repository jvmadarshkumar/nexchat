/**
 * Settings.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Profile edit page powered by React Hook Form.
 *
 * Validation rules:
 *  - name: required, minLength 3
 *  - bio:  optional, maxLength 100
 *
 * On submit:
 *  1. Calls patchProfile (mock API)
 *  2. Updates Zustand store via updateProfile()
 *  3. Navigates back to /
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import useChatStore from '../store/useChatStore';
import apiClient, { patchProfile } from '../utils/mockApi';
import { Camera, Loader2, Trash2 } from 'lucide-react';

// ─── Back arrow icon ──────────────────────────────────────────────────────────

const IconBack = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
    className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

// ─── Small check icon for success toast ──────────────────────────────────────

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
    className="w-4 h-4 text-emerald-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

// ─── Field wrapper ────────────────────────────────────────────────────────────

const Field = ({ label, htmlFor, children, error, hint }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={htmlFor} className="text-sm font-medium text-slate-300">
      {label}
    </label>
    {children}
    {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    {error  && <p id={`${htmlFor}-error`} className="text-xs text-rose-400 flex items-center gap-1">⚠ {error}</p>}
  </div>
);

// ─── Settings Page ────────────────────────────────────────────────────────────

export default function Settings() {
  const navigate      = useNavigate();
  const currentUser   = useChatStore((s) => s.currentUser);
  const setCurrentUser = useChatStore((s) => s.setCurrentUser);
  const updateProfile = useChatStore((s) => s.updateProfile);

  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ── React Hook Form setup ────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      name: currentUser?.name || '',
      bio:  currentUser?.bio || '',
    },
  });

  const bioValue = watch('bio', currentUser?.bio || '');

  // ── Auto-fetch user details on direct navigation/refresh ──────────────────
  useEffect(() => {
    if (!currentUser) {
      apiClient.get('/users/me')
        .then((user) => {
          setCurrentUser(user);
          setAvatarUrl(user.avatar || '');
          reset({
            name: user.name,
            bio: user.bio || '',
          });
        })
        .catch((err) => {
          console.error('[Settings] Fetch user failed:', err);
          navigate('/login');
        });
    } else {
      reset({
        name: currentUser.name,
        bio: currentUser.bio || '',
      });
      setAvatarUrl(currentUser.avatar || '');
    }
  }, [currentUser, setCurrentUser, navigate, reset]);

  // ── Avatar Upload Handler ────────────────────────────────────────────────
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await apiClient.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAvatarUrl(res.fileUrl);
    } catch (err) {
      console.error('[Settings] Avatar upload failed:', err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const hasAvatarChanged = avatarUrl !== (currentUser?.avatar || '');
  const canSave = isDirty || hasAvatarChanged;

  // ── Submit handler ───────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    setSaving(true);
    try {
      // 1. Save profile updates to backend
      await patchProfile({ name: data.name, bio: data.bio, avatar: avatarUrl });
      // 2. Update global Zustand store
      updateProfile(data.name, data.bio, avatarUrl);
      // 3. Show success feedback briefly, then navigate home
      setSuccess(true);
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      console.error('[Settings] Save failed:', err);
      setSaving(false);
    }
  };

  const userColor = currentUser?.color || '#6366F1';
  const userNameText = currentUser?.name || 'User';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Top nav bar */}
      <nav className="flex items-center gap-3 px-6 py-4 border-b border-slate-800/60 bg-slate-900/70 backdrop-blur-sm">
        <button
          id="back-btn"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-100 transition-colors group">
          <span className="w-7 h-7 rounded-lg bg-slate-800 group-hover:bg-slate-700 flex items-center justify-center transition-colors">
            <IconBack />
          </span>
          Back to NexChat
        </button>
        <div className="flex-1" />
        {/* NexChat logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="text-white font-extrabold text-xs">NX</span>
          </div>
          <span className="text-slate-300 font-semibold text-sm">NexChat</span>
        </div>
      </nav>

      {/* Page body */}
      <div className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Card */}
          <div className="bg-slate-900/70 border border-slate-800/60 rounded-2xl p-8 shadow-2xl shadow-black/40 backdrop-blur-sm">

            {/* Header / Profile Photo Upload */}
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-6 border-b border-slate-800/80">
              <div className="relative group shrink-0">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-xl font-bold text-white overflow-hidden shadow-lg ring-4 ring-slate-800"
                  style={{ background: `linear-gradient(135deg, ${userColor}CC, ${userColor}66)` }}>
                  {uploadingAvatar ? (
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  ) : avatarUrl && (avatarUrl.startsWith('/') || avatarUrl.startsWith('http') || avatarUrl.includes('.')) ? (
                    <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    (avatarUrl || userNameText).slice(0, 2).toUpperCase()
                  )}
                </div>
                <label className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-md transition-colors hover:scale-105 active:scale-95">
                  <Camera className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
                {avatarUrl && (avatarUrl.startsWith('/') || avatarUrl.startsWith('http') || avatarUrl.includes('.')) && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    title="Remove profile picture"
                    className="absolute -top-1.5 -right-1.5 p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-md transition-colors hover:scale-105 active:scale-95">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="text-center sm:text-left space-y-1">
                <h1 className="text-xl font-bold text-slate-100">Edit Profile</h1>
                <p className="text-xs text-slate-500">Upload a profile photo, edit display name and bio</p>
              </div>
            </div>

            {/* Success banner */}
            {success && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm rounded-xl px-4 py-3 mb-6 animate-pulse-once">
                <IconCheck />
                Profile saved! Redirecting…
              </div>
            )}

            {/* Form */}
            <form id="profile-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>

              {/* Name field */}
              <Field
                label="Display Name"
                htmlFor="input-name"
                error={errors.name?.message}
                hint="Minimum 3 characters">
                <input
                  id="input-name"
                  type="text"
                  autoComplete="name"
                  placeholder="e.g. Alex Code"
                  className={`bg-slate-800/60 text-slate-100 text-sm rounded-xl px-4 py-3
                    border placeholder:text-slate-600 focus:outline-none transition-all
                    ${errors.name
                      ? 'border-rose-500/60 focus:ring-1 focus:ring-rose-500/40'
                      : 'border-slate-700/50 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/40'}`}
                  {...register('name', {
                    required: 'Display name is required.',
                    minLength: { value: 3, message: 'Name must be at least 3 characters.' },
                    maxLength: { value: 40, message: 'Name must be under 40 characters.' },
                  })}
                />
              </Field>

              {/* Bio field */}
              <Field
                label="Bio"
                htmlFor="input-bio"
                error={errors.bio?.message}
                hint={`${bioValue?.length ?? 0} / 100 characters`}>
                <textarea
                  id="input-bio"
                  rows={3}
                  placeholder="Tell your team a little about yourself…"
                  className={`bg-slate-800/60 text-slate-100 text-sm rounded-xl px-4 py-3
                    border placeholder:text-slate-600 focus:outline-none resize-none transition-all
                    ${errors.bio
                      ? 'border-rose-500/60 focus:ring-1 focus:ring-rose-500/40'
                      : 'border-slate-700/50 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/40'}`}
                  {...register('bio', {
                    maxLength: { value: 100, message: 'Bio must be under 100 characters.' },
                  })}
                />
              </Field>

              {/* Divider */}
              <div className="h-px bg-slate-800/60 my-1" />

              {/* Actions */}
              <div className="flex items-center gap-3 justify-end">
                <button
                  id="cancel-btn"
                  type="button"
                  onClick={() => navigate('/')}
                  className="px-5 py-2.5 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800
                    rounded-xl transition-all duration-200">
                  Cancel
                </button>
                <button
                  id="save-profile-btn"
                  type="submit"
                  disabled={saving || !canSave || success}
                  className="px-6 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200
                    bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25
                    hover:from-indigo-400 hover:to-indigo-500 active:scale-95
                    disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100">
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
                      </svg>
                      Saving…
                    </span>
                  ) : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Help text */}
          <p className="text-center text-xs text-slate-600 mt-5">
            Changes are visible to all workspace members immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
