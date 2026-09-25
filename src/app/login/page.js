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
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4 font-sans relative overflow-hidden">
      {/* Subtle ambient glows for visual depth */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-red-500/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-red-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-violet-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md rounded-3xl border border-zinc-200/90 bg-white p-8 shadow-xl shadow-zinc-900/5 relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center">
            <img
              src="/logo.png"
              alt="VisitExpo Logo"
              className="h-16 w-16 object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center justify-center gap-1.5">
            Super Admin Console
          </h2>
          <p className="text-xs text-zinc-500">
            Enter credentials to access root platform logs, tenant plans, and MRR metrics
          </p>
        </div>

        {formError && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-700">
            <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0 text-red-600" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-zinc-600 mb-1 uppercase tracking-wider">Admin Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-zinc-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-zinc-50/60 focus:bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                placeholder="admin@visitexpo.in"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-600 mb-1 uppercase tracking-wider">Secret Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-3 h-4.5 w-4.5 text-zinc-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-zinc-50/60 focus:bg-white py-2.5 pl-10 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold py-3 text-sm transition-all shadow-md shadow-red-500/20 mt-6 cursor-pointer disabled:opacity-50"
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
