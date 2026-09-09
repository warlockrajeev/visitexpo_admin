'use client';

/**
 * @file page.js
 * @description Super Admin Dashboard index page showing platform-wide health, revenue MRR, and Moderation Queue status.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import {
  Building2,
  Users,
  Calendar,
  CreditCard,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle,
  AlertTriangle,
  Key,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Store,
  User,
  Megaphone,
  Bell,
  Phone,
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAuth } from '../../context/AuthContext.js';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Mock datasets for global platform analytics
const platformRevenueData = [
  { month: 'Jan', revenue: 12000 },
  { month: 'Feb', revenue: 19000 },
  { month: 'Mar', revenue: 32000 },
  { month: 'Apr', revenue: 28000 },
  { month: 'May', revenue: 45000 },
  { month: 'Jun', revenue: 58000 }
];

const subPlanDistribution = [
  { name: 'Free Tier', value: 45, color: '#94a3b8' },
  { name: 'Growth Plan', value: 90, color: 'var(--color-primary)' },
  { name: 'Enterprise', value: 35, color: '#10b981' }
];

const recentTenants = [
  { id: 1, name: 'Eco Fair 2026', owner: 'Amit Rawat', org: 'EcoWorld Ltd', plan: 'growth', status: 'active', signed: '2 hours ago' },
  { id: 2, name: 'Auto Show Asia', owner: 'Sarah Chen', org: 'Motors Asia Co', plan: 'enterprise', status: 'active', signed: '1 day ago' },
  { id: 3, name: 'Medical Expo 2026', owner: 'Dr. John', org: 'MedConnect Group', plan: 'growth', status: 'active', signed: '3 days ago' },
  { id: 4, name: 'Real Estate Summit', owner: 'Rohit Malhotra', org: 'Malhotra Realtors', plan: 'free', status: 'suspended', signed: '1 week ago' },
  { id: 5, name: 'EduCon India', owner: 'Neha Gupta', org: 'Gupta Foundations', plan: 'free', status: 'active', signed: '2 weeks ago' }
];

export default function AdminOverview() {
  const { user, accessToken } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!accessToken) return;
      try {
        const res = await axios.get(`${API_URL}/admin/dashboard`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.data && res.data.success) {
          setMetrics(res.data.analytics);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [accessToken]);

  const totalPending = loading
    ? 0
    : (metrics?.kpis?.pendingOrganizers || 0) +
      (metrics?.kpis?.pendingExhibitors || 0) +
      (metrics?.kpis?.pendingClaims || 0) +
      (metrics?.kpis?.pendingEvents || 0);

  const newInquiries = metrics?.kpis?.newContactInquiries || 0;

  const adminKPIs = [
    {
      title: 'Pending Moderation',
      value: loading ? '...' : String(totalPending),
      desc: loading
        ? 'Loading queues...'
        : `${metrics?.kpis?.pendingEvents || 0} Events, ${metrics?.kpis?.pendingClaims || 0} Claims`,
      icon: CheckCircle2,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      href: '/moderation'
    },
    {
      title: 'Client Inquiries',
      value: loading ? '...' : String(newInquiries),
      desc: newInquiries > 0 ? `${newInquiries} unread form leads` : 'All inquiries handled',
      icon: Mail,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
      badge: newInquiries > 0 ? `${newInquiries} New` : null,
      href: '/contacts'
    },
    {
      title: 'Registered Users',
      value: loading ? '...' : String(metrics?.kpis?.totalUsers || 0),
      desc: 'Across all client teams',
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      href: '/users'
    },
    {
      title: 'Total Organizations',
      value: loading ? '...' : String(metrics?.kpis?.totalOrganizations || 0),
      desc: 'Active platform tenants',
      icon: Building2,
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
      href: '/organizations'
    },
    {
      title: 'Platform MRR',
      value: loading ? '...' : `₹${(metrics?.kpis?.totalRevenue || 0).toLocaleString()}`,
      desc: 'Subscriptions billing base',
      icon: DollarSign,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      href: '/invoices'
    }
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Organizer':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-500 border border-amber-500/20">
            <Building2 className="h-3 w-3" />
            Organizer
          </span>
        );
      case 'Exhibitor':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-pink-500/10 px-2 py-0.5 text-[11px] font-bold text-pink-500 border border-pink-500/20">
            <Store className="h-3 w-3" />
            Exhibitor
          </span>
        );
      case 'Visitor':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-bold text-blue-500 border border-blue-500/20">
            <User className="h-3 w-3" />
            Visitor
          </span>
        );
      case 'Advertiser':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-[11px] font-bold text-purple-400 border border-purple-500/20">
            <Megaphone className="h-3 w-3" />
            Advertiser
          </span>
        );
      case 'Subscriber':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-500 border border-emerald-500/20">
            <Bell className="h-3 w-3" />
            Subscriber
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-500/10 px-2 py-0.5 text-[11px] font-bold text-zinc-400 border border-zinc-500/20">
            {role || 'Other'}
          </span>
        );
    }
  };

  const getSourceBadge = (source) => {
    switch (source) {
      case 'advertise_modal':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-purple-400 border border-purple-500/20">
            Ad Modal
          </span>
        );
      case 'newsletter':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
            Newsletter
          </span>
        );
      case 'landing_contact':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground border border-border">
            Landing Form
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-500 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            New
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-500 border border-amber-500/20">
            <Clock className="h-3 w-3" />
            In Progress
          </span>
        );
      case 'responded':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-500 border border-blue-500/20">
            <CheckCircle2 className="h-3 w-3" />
            Responded
          </span>
        );
      default:
        return null;
    }
  };

  const subDistribution = metrics?.packagesBreakdown
    ? [
        { name: 'Free Tier', value: metrics.packagesBreakdown.free || 0, color: '#94a3b8' },
        { name: 'Growth Plan', value: metrics.packagesBreakdown.growth || 0, color: 'var(--color-primary)' },
        { name: 'Enterprise', value: metrics.packagesBreakdown.enterprise || 0, color: '#10b981' }
      ]
    : subPlanDistribution;

  const totalPaidBase = loading
    ? 0
    : (metrics?.packagesBreakdown?.free || 0) +
      (metrics?.packagesBreakdown?.growth || 0) +
      (metrics?.packagesBreakdown?.enterprise || 0);

  return (
    <div className="space-y-6">
      {/* Overview Greeting */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome to Super Admin Console</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time operational status, tenant billing, and moderation approval queue.</p>
        </div>
        <Link
          href="/moderation"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all w-fit"
        >
          <CheckCircle2 className="h-4 w-4" /> Moderation Queue {loading ? '' : `(${totalPending} Pending)`}
        </Link>
      </div>

      {/* Moderation Alert Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white font-bold shadow-md flex-shrink-0 mt-0.5">
              <ShieldCheck className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">
                Moderation Action Required
              </span>
              <h3 className="text-sm font-bold text-foreground">
                {loading ? 'Analyzing moderation queues...' : `${metrics?.kpis?.pendingEvents || 0} Event Onboarding Submissions & ${metrics?.kpis?.pendingClaims || 0} Ownership Claims Awaiting Approval`}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review organizer profiles, 1920x1080 banners, SEO score grades, and domain email verification documents.
              </p>
            </div>
          </div>

          <Link
            href="/moderation"
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow transition-all whitespace-nowrap"
          >
            Review Moderation Queue <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Contact Inquiries Alert (if any new inquiries) */}
      {metrics?.kpis?.newContactInquiries > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-xs">
              <Mail className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                Landing Page Inquiries
              </span>
              <p className="text-xs font-bold text-foreground">
                {metrics.kpis.newContactInquiries} New message{metrics.kpis.newContactInquiries > 1 ? 's' : ''} received from the landing page contact section.
              </p>
            </div>
          </div>
          <Link
            href="/contacts"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-xs transition-all whitespace-nowrap"
          >
            <span>View Inquiries</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {adminKPIs.map((kpi, idx) => (
          <Link
            key={idx}
            href={kpi.href || '#'}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 block group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase group-hover:text-foreground transition-colors">{kpi.title}</span>
              <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-foreground">{kpi.value}</span>
                {kpi.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse">
                    {kpi.badge}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{kpi.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts Panels */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Monthly Platform Revenue */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-foreground">SaaS Platform Subscription MRR Growth</h3>
              <p className="text-xs text-muted-foreground">Historical recurring billing aggregates</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-emerald-500 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full">
              <TrendingUp className="h-3.5 w-3.5" /> +25% MRR YoY
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformRevenueData}>
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="revenue" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription level ratios */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-foreground">Subscribed Tiers</h3>
            <p className="text-xs text-muted-foreground">Active organizational distributions</p>
          </div>
          <div className="h-44 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {subDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold text-foreground">{loading ? '...' : String(totalPaidBase)}</span>
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Paid Base</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1 mt-2">
            {subDistribution.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center">
                <span className="h-2 w-2 rounded-full mb-1" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] text-muted-foreground truncate w-full">{item.name}</span>
                <span className="text-xs font-bold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Client-Side Form Submissions Section */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Mail className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-base text-foreground">Recent Client Form Submissions</h3>
              {newInquiries > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 animate-pulse">
                  {newInquiries} New
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Direct inquiries, exhibitor onboarding requests, advertise inquiries, and newsletter alerts submitted via the client application.
            </p>
          </div>
          <Link
            href="/contacts"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs transition-all self-start sm:self-auto cursor-pointer"
          >
            <span>View All Inquiries</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground text-xs">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span>Loading client form inquiries...</span>
          </div>
        ) : (!metrics?.recentInquiries || metrics.recentInquiries.length === 0) ? (
          <div className="text-center py-12 text-muted-foreground text-xs space-y-2">
            <Mail className="h-8 w-8 mx-auto text-muted-foreground/40" />
            <p className="font-semibold text-foreground">No client form submissions yet</p>
            <p className="text-[11px] max-w-sm mx-auto">
              Submissions from the landing page contact form, advertising modal, and newsletter alerts will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/20 font-bold text-muted-foreground uppercase tracking-wider text-[11px]">
                  <th className="px-6 py-3.5">Sender &amp; Role</th>
                  <th className="px-6 py-3.5">Contact Info</th>
                  <th className="px-6 py-3.5">Message Snippet</th>
                  <th className="px-6 py-3.5">Received</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {metrics.recentInquiries.map((item) => (
                  <tr key={item._id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 uppercase text-xs">
                          {item.name ? item.name.charAt(0) : 'V'}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{item.name}</p>
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            {getRoleBadge(item.role)}
                            {getSourceBadge(item.source)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <a
                          href={`mailto:${item.email}`}
                          className="font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1"
                        >
                          <span>{item.email}</span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </a>
                        {item.phone && (
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{item.phone}</span>
                            <a
                              href={`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold text-emerald-500 hover:underline inline-flex items-center gap-0.5"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="h-2.5 w-2.5" />
                              <span>WA</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="line-clamp-2 text-muted-foreground leading-relaxed">
                        {item.message}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <Link
                        href="/contacts"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-[11px] border border-border transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Inspect</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tenants lists */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-bold text-foreground">Recent Organization Tenants</h3>
          <p className="text-xs text-muted-foreground">New event organizations added onto the platform</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/20 font-bold text-muted-foreground uppercase tracking-wider">
                <th className="px-6 py-4">Tenant Name</th>
                <th className="px-6 py-4">Owner Contact</th>
                <th className="px-6 py-4">Selected Plan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-secondary/40 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-foreground">{tenant.name}</p>
                    <span className="text-[11px] text-muted-foreground">{tenant.org}</span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground font-semibold">{tenant.owner}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase ${
                      tenant.plan === 'enterprise' 
                        ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20'
                        : tenant.plan === 'growth'
                        ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                        : 'bg-slate-500/10 text-slate-500 ring-1 ring-slate-500/20'
                    }`}>
                      {tenant.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {tenant.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-500">
                        <CheckCircle className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-1 text-[11px] font-bold text-rose-500">
                        <AlertTriangle className="h-3 w-3" /> Suspended
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{tenant.signed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
