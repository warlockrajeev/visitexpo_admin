'use client';

/**
 * @file page.js
 * @description Dedicated Super Admin Login Console page.
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext.js';
import {
  Mail,
  Key,
  Eye,
  EyeOff,
  Loader2,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function AdminLoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  // Login Portal States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already authenticated as super_admin
  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const res = await login(email, password);
      if (!res.success) {
        setFormError(res.error || 'Authentication failed.');
      } else {
        router.push('/');
      }
    } catch (err) {
      setFormError('An unexpected server error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 font-sans relative overflow-hidden">
      {/* Glowing red/purple administrator glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-red-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-violet-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md p-8 shadow-2xl relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 text-white font-extrabold text-xl shadow-lg shadow-red-600/20">
            VA
          </div>
          <h2 className="text-2xl font-bold text-zinc-50 tracking-tight flex items-center justify-center gap-1.5">
            Super Admin Console
          </h2>
          <p className="text-xs text-zinc-400">
            Enter credentials to access root platform logs, tenant plans, and MRR metrics
          </p>
        </div>

        {formError && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-400">
            <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Admin Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 py-2 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                placeholder="admin@visitexpo.in"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Secret Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 py-2 pl-10 pr-10 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-600 hover:bg-red-550 text-white font-semibold py-2.5 text-sm transition-all shadow-lg shadow-red-600/10 mt-6"
          >
            {submitting ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <>
                Verify Credentials <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
