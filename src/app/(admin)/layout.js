'use client';

/**
 * @file layout.js
 * @description Super Admin sidebar navigation layout.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '../../context/ThemeContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Loader2 } from 'lucide-react';
import {
  ShieldAlert,
  Users,
  Building2,
  CreditCard,
  FileText,
  LifeBuoy,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  TrendingUp,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navigation = [
    { name: 'Overview', href: '/', icon: ShieldAlert },
    { name: 'Event Moderation', href: '/moderation', icon: CheckCircle2, badge: 'Queue' },
    { name: 'User Management', href: '/users', icon: Users },
    { name: 'Organizations', href: '/organizations', icon: Building2 },
    { name: 'Subscriptions', href: '/subscriptions', icon: CreditCard },
    { name: 'Invoices & Sales', href: '/invoices', icon: FileText },
    { name: 'Support Tickets', href: '/tickets', icon: LifeBuoy },
    { name: 'CMS & Settings', href: '/settings', icon: Settings },
  ];

  const getPageTitle = (path) => {
    if (path === '/') return 'System Administration Console';
    if (path === '/moderation') return '10times Event Moderation & Approvals';
    const clean = path.replace('/', '').replace(/-/g, ' ');
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-300 md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-md">
              SA
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              Visit<span className="text-primary">Admin</span>
            </span>
          </Link>
          <button
            type="button"
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-4.5 w-4.5 flex-shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-border bg-muted/20">
          <button
            onClick={toggleTheme}
            className="flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground mb-3 transition-colors"
          >
            <span className="flex items-center gap-3">
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>

          <div className="flex items-center gap-3 rounded-xl bg-card p-3 border border-border shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary font-bold uppercase text-xs">
              SU
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold truncate text-foreground">{user?.name || 'Super Admin'}</p>
              <span className="text-[10px] text-primary font-bold">
                Global Controller
              </span>
            </div>
            <button
              onClick={logout}
              className="text-muted-foreground hover:text-destructive transition-colors p-1"
              title="Logout"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card/50 backdrop-blur-md px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="md:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-bold text-foreground">
              {getPageTitle(pathname)}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/moderation"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Moderation Queue
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/20">
              <TrendingUp className="h-3 w-3" /> Live Moderation Active
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-muted/10">
          {children}
        </main>
      </div>
    </div>
  );
}
