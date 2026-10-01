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
import axios from 'axios';
import {
  ShieldAlert,
  Users,
  Building,
  Building2,
  MapPin,
  CreditCard,
  FileText,
  LifeBuoy,
  Mail,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  TrendingUp,
  CheckCircle2,
  ShieldCheck,
  Layers,
  Award,
  Calendar,
  CalendarDays,
  MessageSquare,
  HelpCircle,
  UserPlus
} from 'lucide-react';

import { initSweetAlertInterceptors } from '../../utils/sweetalert.js';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadInquiries, setUnreadInquiries] = useState(0);
  const [pendingCounts, setPendingCounts] = useState({
    pendingOrganizers: 0,
    pendingExhibitors: 0,
    pendingClaims: 0,
    pendingEvents: 0,
    totalPending: 0
  });
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, loading, logout, accessToken, isSuperAdmin, hasPermission } = useAuth();

  useEffect(() => {
    initSweetAlertInterceptors();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!accessToken) return;
    const fetchCounters = async () => {
      try {
        const [contactRes, summaryRes] = await Promise.all([
          axios.get(`${API_URL}/contact?status=new&limit=1`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          }).catch(() => null),
          axios.get(`${API_URL}/admin/pending-summary`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          }).catch(() => null)
        ]);

        if (contactRes?.data?.stats?.new !== undefined) {
          setUnreadInquiries(contactRes.data.stats.new);
        }
        if (summaryRes?.data?.success && summaryRes.data?.data) {
          setPendingCounts(summaryRes.data.data);
        }
      } catch (e) {
        // silent
      }
    };
    fetchCounters();
  }, [accessToken, pathname]);

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
    { name: 'Overview', href: '/', icon: ShieldAlert, permission: 'dashboard.view' },
    {
      name: 'Approval System',
      href: '/moderation',
      icon: CheckCircle2,
      badge: pendingCounts.totalPending > 0 ? `${pendingCounts.totalPending} Pending` : null,
      badgeColor: 'bg-amber-500 text-white animate-pulse',
      permission: 'moderation.view'
    },
    {
      name: 'Events Management',
      href: '/events',
      icon: Calendar,
      badge: pendingCounts.pendingEvents > 0 ? `${pendingCounts.pendingEvents} Draft` : null,
      permission: 'events.view'
    },
    {
      name: 'Venues Directory',
      href: '/venues',
      icon: MapPin,
      badge: 'Profiles',
      badgeColor: 'bg-emerald-500 text-white',
      permission: 'events.view'
    },
    {
      name: 'Organizers',
      href: '/organizers',
      icon: CalendarDays,
      badge: pendingCounts.pendingOrganizers > 0 ? `${pendingCounts.pendingOrganizers} New` : null,
      permission: 'organizers.view'
    },
    {
      name: 'Live Chat Organizers',
      href: '/chat-organizers',
      icon: MessageSquare,
      badge: 'Live',
      badgeColor: 'bg-emerald-500 text-white',
      permission: 'chat_organizers.view'
    },
    {
      name: 'Organizer Support Chat',
      href: '/organizer-support',
      icon: MessageSquare,
      permission: 'chat_organizers.view'
    },
    {
      name: 'Exhibitors',
      href: '/exhibitors',
      icon: Building,
      badge: pendingCounts.pendingExhibitors > 0 ? `${pendingCounts.pendingExhibitors} New` : null,
      permission: 'exhibitors.view'
    },
    {
      name: 'Visitors',
      href: '/visitors',
      icon: Users,
      badge: 'Live',
      permission: 'visitors.view'
    },
    { name: 'Event Categories', href: '/categories', icon: Layers, permission: 'categories.view' },
    { name: 'Attendees & Followers', href: '/attendees', icon: Users, permission: 'attendees.view' },
    { name: 'Our Sponsors', href: '/sponsors', icon: Award, permission: 'sponsors.manage' },
    { name: 'User Management', href: '/users', icon: Users, permission: 'users.view' },
    {
      name: 'Rapid Creation',
      href: '/rapid-creation',
      icon: UserPlus,
      badge: 'Dummy Tools',
      badgeColor: 'bg-emerald-500 text-white',
      permission: 'rapid_creation.access'
    },
    {
      name: 'Subadmins & Roles',
      href: '/subadmins',
      icon: ShieldCheck,
      badge: 'RBAC',
      badgeColor: 'bg-indigo-500 text-white',
      permission: 'subadmins.manage'
    },
    { name: 'Organizations', href: '/organizations', icon: Building2, permission: 'organizations.view' },
    { name: 'Subscriptions', href: '/subscriptions', icon: CreditCard, permission: 'subscriptions.view' },
    { name: 'Invoices & Sales', href: '/invoices', icon: FileText, permission: 'invoices.view' },
    { name: 'Support Tickets', href: '/tickets', icon: LifeBuoy, permission: 'tickets.manage' },
    {
      name: 'Contact Inquiries',
      href: '/contacts',
      icon: Mail,
      badge: unreadInquiries > 0 ? `${unreadInquiries} New` : null,
      permission: 'contacts.manage'
    },
    { name: 'Reviews Moderation', href: '/reviews', icon: MessageSquare, badge: 'Live', permission: 'reviews.manage' },
    { name: 'FAQ Management', href: '/faqs', icon: HelpCircle, badge: 'CMS', permission: 'faqs.manage' },
    { name: 'CMS & Settings', href: '/settings', icon: Settings, permission: 'settings.manage' },
  ];

  const checkNavPermission = (item) => {
    if (isSuperAdmin) return true;
    if (!item || !item.permission) return true;
    if (item.href === '/chat-organizers' || item.href === '/organizer-support') {
      return (
        hasPermission('chat_organizers.view') ||
        hasPermission('chat_organizers.manage') ||
        hasPermission('chat-organizers') ||
        hasPermission('organizers.view')
      );
    }
    return hasPermission(item.permission);
  };

  const visibleNavigation = navigation.filter(checkNavPermission);

  const getPageTitle = (path) => {
    if (path === '/') return 'System Administration Console';
    if (path === '/moderation') return 'Approval & Moderation Command Center';
    if (path === '/events') return 'Events Management & WordPress Sync';
    if (path === '/venues') return 'Venue Profiles & Gallery Media Manager';
    if (path === '/organizers') return 'Organizers & Events Directory';
    if (path === '/chat-organizers') return 'Live Chat Organizers & Inquiries Control';
    if (path === '/organizer-support') return 'Organizer Support Chat';
    if (path === '/exhibitors') return 'Exhibitor Management & Approvals';
    if (path === '/visitors') return 'Visitor Directory & Pass Management';
    if (path === '/categories') return 'Event Categories & Events Directory';
    if (path === '/attendees') return 'Event Attendees & Followers Directory';
    if (path === '/sponsors') return 'Our Sponsors & Exhibitor Partners';
    if (path === '/contacts') return 'Landing Page Contact Inquiries';
    if (path === '/reviews') return 'Reviews Moderation & Landing Showcase';
    if (path === '/faqs') return 'FAQ Management & Landing Showcase';
    if (path === '/rapid-creation') return 'Rapid Dummy User Creation & Impersonation';
    if (path === '/subadmins') return 'Subadmins & Role-Based Access Control (RBAC)';
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
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="VisitExpo Logo"
              className="h-9 w-9 object-contain"
            />
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
          {visibleNavigation.map((item) => {
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
                    item.badgeColor
                      ? item.badgeColor
                      : isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-primary/10 text-primary'
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
              {isSuperAdmin ? 'SU' : (user?.name?.slice(0, 2).toUpperCase() || 'SA')}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold truncate text-foreground">{user?.name || 'Administrator'}</p>
              <span className="text-[10px] text-primary font-bold truncate block">
                {isSuperAdmin ? 'Super Administrator' : (user?.adminRole || 'Sub Administrator')}
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
            {/* <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/20">
              <TrendingUp className="h-3 w-3" /> Live Moderation Active
            </span> */}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-muted/10">
          {(() => {
            const currentItem = navigation.find((n) => n.href === pathname);
            const isAuthorized = checkNavPermission(currentItem);

            if (!isAuthorized) {
              return (
                <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-8 bg-card border border-border rounded-3xl max-w-lg mx-auto shadow-sm space-y-4 my-10">
                  <div className="h-16 w-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
                    <ShieldAlert className="h-8 w-8" />
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="text-lg font-bold text-foreground">Access Restricted</h2>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                      Your subadmin account does not have permission to access <strong>{currentItem?.name || pathname}</strong>.
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono bg-muted/40 px-2.5 py-1 rounded-md inline-block">
                      Required Permission: {currentItem?.permission}
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link
                      href={visibleNavigation[0]?.href || '/'}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow hover:bg-primary/90 transition-all"
                    >
                      Go to Accessible Module
                    </Link>
                  </div>
                </div>
              );
            }

            return children;
          })()}
        </main>
      </div>
    </div>
  );
}
