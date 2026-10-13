'use client';

/**
 * @file page.js
 * @description Super Admin Reporting Dashboard for Organizer Email Promotions (Growth Plan).
 * Monitors email campaigns dispatched to leads, visitors, followers, and interested users via promotion@client.visitexpo.in.
 */

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  Search,
  Filter,
  Download,
  RefreshCw,
  ExternalLink,
  Eye,
  Server,
  TrendingUp,
  ShieldCheck,
  Calendar,
  Sparkles,
  X,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Award
} from 'lucide-react';
import Swal from 'sweetalert2';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function AdminEmailPromotionsPage() {
  const { accessToken } = useAuth();

  // Data states
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    totalTargeted: 0,
    totalDelivered: 0,
    totalFailed: 0,
    uniqueOrganizers: 0,
    growthOrganizersCount: 0,
    deliveryRate: 100,
    audienceTotals: { leads: 0, visitors: 0, followers: 0, interested: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, totalCount: 0 });

  // SMTP Testing
  const [smtpChecking, setSmtpChecking] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState(null);

  // Detail Modal
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('overview'); // 'overview' | 'preview' | 'recipients'

  // Fetch campaigns and stats
  const fetchPromotionsReport = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const params = {
        page,
        limit: 15,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search.trim() || undefined
      };

      const res = await axios.get(`${API_URL}/admin/email-promotions`, {
        params,
        headers
      });

      if (res.data?.success) {
        setCampaigns(res.data.campaigns || []);
        if (res.data.stats) setStats(res.data.stats);
        if (res.data.pagination) setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load email promotions report:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPromotionsReport();
  }, [page, statusFilter, accessToken]);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPromotionsReport();
  };

  // Test live connection to promotion@client.visitexpo.in
  const handleTestSmtp = async () => {
    setSmtpChecking(true);
    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const res = await axios.get(`${API_URL}/admin/email-promotions/verify-smtp`, { headers });
      setSmtpStatus(res.data);
      if (res.data?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Promotional SMTP Connected!',
          html: `
            <div style="text-align: left; font-size: 13px; line-height: 1.6;">
              <p><strong>Sender Email:</strong> ${res.data.user}</p>
              <p><strong>Mail Host:</strong> ${res.data.host}:${res.data.port} (SSL/TLS)</p>
              <p><strong>Response Latency:</strong> ${res.data.latencyMs} ms</p>
              <p style="color: #10b981; font-weight: bold;">Status: Authenticated & Ready for High-Volume Promotions</p>
            </div>
          `,
          confirmButtonColor: '#4f46e5'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'SMTP Check Failed',
          text: res.data?.error || 'Could not authenticate promotional SMTP account',
          confirmButtonColor: '#ef4444'
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Connection Error',
        text: err.response?.data?.error || err.message,
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setSmtpChecking(false);
    }
  };

  // Open Campaign Details Modal
  const handleOpenDetail = async (campaignId) => {
    setDetailLoading(true);
    setActiveModalTab('overview');
    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const res = await axios.get(`${API_URL}/admin/email-promotions/${campaignId}`, { headers });
      if (res.data?.success) {
        setSelectedCampaign(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load campaign details:', err);
      Swal.fire({
        icon: 'error',
        title: 'Failed to load details',
        text: err.response?.data?.error || 'Could not fetch campaign log'
      });
    } finally {
      setDetailLoading(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const token = accessToken || (typeof window !== 'undefined' ? localStorage.getItem('visitexpo_admin_token') : '');
    const exportUrl = `${API_URL}/admin/email-promotions/export-csv${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    window.open(exportUrl, '_blank');
  };

  // Filtered campaigns client-side for audience tag if chosen
  const displayedCampaigns = useMemo(() => {
    if (audienceFilter === 'all') return campaigns;
    return campaigns.filter(c => {
      const auds = c.targetAudience?.audienceTypes || [];
      return auds.includes(audienceFilter);
    });
  }, [campaigns, audienceFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Mail className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              Organizer Email Promotions Report
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
              Growth Plan Feature
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Audit, inspect, and monitor promotional email broadcasts sent by organizers to verified leads, trade visitors, followers, and interested users.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleTestSmtp}
            disabled={smtpChecking}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-secondary hover:bg-secondary/80 text-foreground border border-border shadow-sm transition-all active:scale-95 disabled:opacity-50"
            title="Verify live connection to promotion@client.visitexpo.in on nexus.herosite.pro"
          >
            {smtpChecking ? (
              <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
            ) : (
              <Server className="h-4 w-4 text-emerald-500" />
            )}
            <span>Test Promotion SMTP</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-secondary hover:bg-secondary/80 text-foreground border border-border shadow-sm transition-all active:scale-95"
          >
            <Download className="h-4 w-4 text-indigo-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => fetchPromotionsReport(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-primary text-black hover:opacity-90 shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* SMTP Active Gateway Banner */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-card border border-indigo-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Send className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">Dedicated Promotion Gateway:</span>
              <code className="text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">
                promotion@client.visitexpo.in
              </code>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Active SMTP Host" />
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Host: <strong>nexus.herosite.pro:465</strong> (cPanel SSL Relay) &bull; Reserved exclusively for Organizers with the <strong>Growth Plan</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-semibold text-muted-foreground">Gateway Deliverability:</span>
          <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
            {stats.deliveryRate}% Success
          </span>
        </div>
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Total Campaigns</span>
            <Send className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {stats.totalCampaigns}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {stats.uniqueOrganizers} unique organizers
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Emails Delivered</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-500">
            {stats.totalDelivered.toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {stats.totalFailed > 0 ? `${stats.totalFailed} bounced/failed` : 'Zero delivery errors'}
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Delivery Rate</span>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {stats.deliveryRate}%
          </div>
          <div className="text-[11px] text-muted-foreground">
            Verified cPanel SMTP relay
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Growth Organizers</span>
            <Award className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-500">
            {stats.growthOrganizersCount}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Entitled to email promotions
          </div>
        </div>
      </div>

      {/* Audience Reach Breakdown Pills */}
      <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
        <div className="text-xs font-bold text-foreground mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <span>Audience Delivery Distribution Across Platform:</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-secondary/50 border border-border/60">
            <div className="text-muted-foreground font-medium text-[11px]">CRM Leads Reached</div>
            <div className="text-lg font-black text-foreground mt-0.5">
              {(stats.audienceTotals?.leads || 0).toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-secondary/50 border border-border/60">
            <div className="text-muted-foreground font-medium text-[11px]">Registered Visitors</div>
            <div className="text-lg font-black text-foreground mt-0.5">
              {(stats.audienceTotals?.visitors || 0).toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-secondary/50 border border-border/60">
            <div className="text-muted-foreground font-medium text-[11px]">Event Followers</div>
            <div className="text-lg font-black text-foreground mt-0.5">
              {(stats.audienceTotals?.followers || 0).toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-secondary/50 border border-border/60">
            <div className="text-muted-foreground font-medium text-[11px]">Interested Attendees</div>
            <div className="text-lg font-black text-foreground mt-0.5">
              {(stats.audienceTotals?.interested || 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border border-border p-4 rounded-2xl">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns by title, subject, organizer, or exhibition..."
            className="w-full bg-secondary/60 border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </form>

        <div className="flex items-center gap-2">
          {/* Status selector */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-secondary border border-border rounded-xl px-3 py-2.5 text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed / Sent</option>
            <option value="sending">Sending</option>
            <option value="draft">Drafts</option>
            <option value="failed">Failed</option>
          </select>

          {/* Audience selector */}
          <select
            value={audienceFilter}
            onChange={(e) => setAudienceFilter(e.target.value)}
            className="bg-secondary border border-border rounded-xl px-3 py-2.5 text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
          >
            <option value="all">All Audiences</option>
            <option value="leads">Targeted Leads</option>
            <option value="visitors">Targeted Visitors</option>
            <option value="followers">Targeted Followers</option>
            <option value="interested">Targeted Interested</option>
          </select>
        </div>
      </div>

      {/* Campaigns Report Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/60 border-b border-border text-muted-foreground font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Date / Time</th>
                <th className="py-3.5 px-4">Organizer</th>
                <th className="py-3.5 px-4">Exhibition Event</th>
                <th className="py-3.5 px-4">Campaign Title &amp; Subject</th>
                <th className="py-3.5 px-4">Audiences</th>
                <th className="py-3.5 px-4 text-center">Delivered / Total</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
                    <span>Loading organizer email promotion reports...</span>
                  </td>
                </tr>
              ) : displayedCampaigns.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-muted-foreground">
                    <Mail className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="font-bold text-foreground">No email promotion records found</p>
                    <p className="text-[11px] mt-1">Organizers with the Growth Plan will appear here once they dispatch promotional email campaigns.</p>
                  </td>
                </tr>
              ) : (
                displayedCampaigns.map((c) => {
                  const sentDate = c.sentAt ? new Date(c.sentAt) : new Date(c.createdAt);
                  const targeted = c.targetAudience?.recipientCount || c.sentCount || 0;
                  const delivered = c.deliveredCount || (c.status === 'completed' ? targeted : 0);
                  const successRate = targeted > 0 ? Math.round((delivered / targeted) * 100) : 100;
                  const organizerPlan = c.createdBy?.plan || 'free';
                  const isGrowth = c.createdBy?.hasGrowthPlan || organizerPlan === 'growth';

                  return (
                    <tr key={c._id} className="hover:bg-secondary/30 transition-colors">
                      {/* Date */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-semibold text-foreground">
                          {sentDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {sentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Organizer */}
                      <td className="py-4 px-4 max-w-[200px]">
                        <div className="font-bold text-foreground truncate">
                          {c.createdBy?.name || 'Unknown Organizer'}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {c.createdBy?.email}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isGrowth
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              : 'bg-secondary text-muted-foreground border border-border'
                          }`}>
                            {isGrowth ? 'Growth Plan' : organizerPlan.toUpperCase()}
                          </span>
                        </div>
                      </td>

                      {/* Exhibition */}
                      <td className="py-4 px-4 max-w-[200px]">
                        <div className="font-semibold text-foreground truncate">
                          {c.event?.title || 'General Exhibition'}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          📍 {c.event?.city || 'India'}
                        </div>
                      </td>

                      {/* Campaign Title & Subject */}
                      <td className="py-4 px-4 max-w-[240px]">
                        <div className="font-bold text-foreground truncate">
                          {c.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate" title={c.content?.subject}>
                          ✉️ {c.content?.subject || c.title}
                        </div>
                      </td>

                      {/* Target Audiences */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[160px]">
                          {(c.targetAudience?.audienceTypes || ['leads', 'visitors']).map((type) => (
                            <span
                              key={type}
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-secondary text-foreground border border-border capitalize"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Delivered / Total */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="font-black text-foreground">
                          {delivered} <span className="text-muted-foreground font-normal">/ {targeted}</span>
                        </div>
                        <div className="w-20 bg-secondary rounded-full h-1.5 mx-auto mt-1 overflow-hidden">
                          <div
                            className={`h-full ${successRate >= 90 ? 'bg-emerald-500' : successRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${successRate}%` }}
                          />
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                          c.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : c.status === 'sending'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse'
                            : c.status === 'failed'
                            ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                            : 'bg-secondary text-muted-foreground border border-border'
                        }`}>
                          {c.status === 'completed' ? 'Delivered' : c.status.toUpperCase()}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenDetail(c._id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all active:scale-95"
                        >
                          <Eye className="h-3.5 w-3.5 text-indigo-400" />
                          <span>View Report</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-secondary/30 border-t border-border text-xs">
            <span className="text-muted-foreground">
              Showing page <strong>{page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.totalCount} total campaigns)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-border bg-card hover:bg-secondary disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg border border-border bg-card hover:bg-secondary disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Campaign Details & Audit Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-secondary/30">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    Email Promotion Audit Report
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    ID: {selectedCampaign._id}
                  </span>
                </div>
                <h2 className="text-xl font-black text-foreground">
                  {selectedCampaign.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 px-6 border-b border-border bg-secondary/10">
              <button
                onClick={() => setActiveModalTab('overview')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                  activeModalTab === 'overview'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Overview &amp; Metrics
              </button>
              <button
                onClick={() => setActiveModalTab('preview')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                  activeModalTab === 'preview'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Rendered Email Preview
              </button>
              <button
                onClick={() => setActiveModalTab('recipients')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                  activeModalTab === 'recipients'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Recipient Delivery Log ({selectedCampaign.recipientsLog?.length || 0})
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {activeModalTab === 'overview' && (
                <div className="space-y-6">
                  {/* Key Stats Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
                      <span className="text-muted-foreground font-medium text-[11px] block">Total Targeted</span>
                      <span className="text-xl font-black text-foreground mt-1 block">
                        {selectedCampaign.targetAudience?.recipientCount || selectedCampaign.sentCount || 0}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
                      <span className="text-muted-foreground font-medium text-[11px] block">Delivered</span>
                      <span className="text-xl font-black text-emerald-400 mt-1 block">
                        {selectedCampaign.deliveredCount || selectedCampaign.sentCount || 0}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
                      <span className="text-muted-foreground font-medium text-[11px] block">Delivery Success</span>
                      <span className="text-xl font-black text-foreground mt-1 block">
                        {selectedCampaign.sentCount > 0
                          ? Math.round(((selectedCampaign.deliveredCount || selectedCampaign.sentCount) / selectedCampaign.sentCount) * 100)
                          : 100}%
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
                      <span className="text-muted-foreground font-medium text-[11px] block">SMTP Relay</span>
                      <span className="text-xs font-bold font-mono text-indigo-400 mt-1 block truncate">
                        {selectedCampaign.senderEmail || 'promotion@client.visitexpo.in'}
                      </span>
                    </div>
                  </div>

                  {/* Organizer & Event Meta Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-2">
                      <h4 className="font-bold text-foreground flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span>Organizer Profile</span>
                      </h4>
                      <div className="space-y-1 text-muted-foreground">
                        <div><strong>Name:</strong> {selectedCampaign.createdBy?.name}</div>
                        <div><strong>Email:</strong> {selectedCampaign.createdBy?.email}</div>
                        <div><strong>Organization:</strong> {selectedCampaign.createdBy?.company || selectedCampaign.createdBy?.organization || 'Registered Entity'}</div>
                        <div><strong>Plan Tier:</strong> <span className="uppercase font-bold text-indigo-400">{selectedCampaign.createdBy?.plan || 'Growth'}</span></div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-2">
                      <h4 className="font-bold text-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>Associated Exhibition</span>
                      </h4>
                      <div className="space-y-1 text-muted-foreground">
                        <div><strong>Title:</strong> {selectedCampaign.event?.title || 'Custom Campaign'}</div>
                        <div><strong>City:</strong> {selectedCampaign.event?.city || 'India'}</div>
                        <div><strong>Venue:</strong> {selectedCampaign.event?.venue?.name || selectedCampaign.event?.venue || 'Exhibition Grounds'}</div>
                        <div><strong>Dates:</strong> {selectedCampaign.event?.dates || 'Scheduled'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Email Content Details */}
                  <div className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-3">
                    <h4 className="font-bold text-foreground">Email Parameters</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-muted-foreground">
                      <div>
                        <strong className="text-foreground">Subject Line:</strong>
                        <p className="mt-0.5 text-xs text-foreground bg-card p-2 rounded-lg border border-border">
                          {selectedCampaign.content?.subject || selectedCampaign.title}
                        </p>
                      </div>
                      <div>
                        <strong className="text-foreground">Headline:</strong>
                        <p className="mt-0.5 text-xs text-foreground bg-card p-2 rounded-lg border border-border">
                          {selectedCampaign.content?.headline || selectedCampaign.content?.subject || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <strong className="text-foreground">Call To Action (CTA):</strong>
                        <p className="mt-0.5 text-xs text-foreground bg-card p-2 rounded-lg border border-border">
                          {selectedCampaign.content?.ctaText || 'View Passes'} &bull; <span className="text-indigo-400 font-mono">{selectedCampaign.content?.ctaUrl || 'Event Page'}</span>
                        </p>
                      </div>
                      <div>
                        <strong className="text-foreground">Target Audience Distribution:</strong>
                        <div className="mt-0.5 flex flex-wrap gap-1.5">
                          {selectedCampaign.targetAudience?.breakdown ? (
                            <>
                              <span className="px-2 py-0.5 rounded bg-card border border-border">Leads: {selectedCampaign.targetAudience.breakdown.leads || 0}</span>
                              <span className="px-2 py-0.5 rounded bg-card border border-border">Visitors: {selectedCampaign.targetAudience.breakdown.visitors || 0}</span>
                              <span className="px-2 py-0.5 rounded bg-card border border-border">Followers: {selectedCampaign.targetAudience.breakdown.followers || 0}</span>
                              <span className="px-2 py-0.5 rounded bg-card border border-border">Interested: {selectedCampaign.targetAudience.breakdown.interested || 0}</span>
                            </>
                          ) : (
                            <span>All selected groups</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeModalTab === 'preview' && (
                <div className="space-y-3">
                  <div className="p-3 bg-secondary/50 rounded-xl border border-border flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Sender: <strong className="text-foreground">{selectedCampaign.senderEmail || 'promotion@client.visitexpo.in'}</strong>
                    </span>
                    <span className="text-muted-foreground">
                      Subject: <strong className="text-foreground">{selectedCampaign.content?.subject || selectedCampaign.title}</strong>
                    </span>
                  </div>

                  <div className="border border-border rounded-2xl p-6 bg-card max-w-xl mx-auto space-y-4">
                    {selectedCampaign.content?.bannerUrl && (
                      <img
                        src={selectedCampaign.content.bannerUrl}
                        alt="Campaign Banner"
                        className="w-full h-44 object-cover rounded-xl"
                      />
                    )}
                    <div className="space-y-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-500">
                        Official Trade Promotion
                      </span>
                      <h3 className="text-xl font-black text-foreground">
                        {selectedCampaign.content?.headline || selectedCampaign.content?.subject || selectedCampaign.title}
                      </h3>
                      <div className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {selectedCampaign.content?.body}
                      </div>
                      <div className="pt-4 text-center">
                        <span className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md">
                          {selectedCampaign.content?.ctaText || 'Explore Exhibition Passes'} &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeModalTab === 'recipients' && (
                <div className="space-y-3">
                  <div className="overflow-x-auto border border-border rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-secondary/60 border-b border-border text-muted-foreground font-bold">
                        <tr>
                          <th className="py-2.5 px-4">Recipient Name</th>
                          <th className="py-2.5 px-4">Email Address</th>
                          <th className="py-2.5 px-4">Audience Segment</th>
                          <th className="py-2.5 px-4 text-center">Delivery Status</th>
                          <th className="py-2.5 px-4 text-right">Sent Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {(!selectedCampaign.recipientsLog || selectedCampaign.recipientsLog.length === 0) ? (
                          <tr>
                            <td colSpan="5" className="py-8 text-center text-muted-foreground">
                              No individual recipient delivery logs recorded for this campaign.
                            </td>
                          </tr>
                        ) : (
                          selectedCampaign.recipientsLog.map((r, idx) => (
                            <tr key={idx} className="hover:bg-secondary/20">
                              <td className="py-3 px-4 font-semibold text-foreground">
                                {r.name || 'Valued Attendee'}
                              </td>
                              <td className="py-3 px-4 font-mono text-muted-foreground">
                                {r.email}
                              </td>
                              <td className="py-3 px-4">
                                <span className="capitalize px-2 py-0.5 rounded bg-secondary text-foreground text-[10px] font-semibold border border-border">
                                  {r.audienceType || 'visitor'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  r.status === 'sent'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}>
                                  {r.status === 'sent' ? '✓ Delivered' : '✗ Failed'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right text-muted-foreground text-[11px]">
                                {r.sentAt ? new Date(r.sentAt).toLocaleTimeString() : 'Delivered'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-secondary/30 flex items-center justify-end">
              <button
                onClick={() => setSelectedCampaign(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
