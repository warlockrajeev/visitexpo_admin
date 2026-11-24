'use client';

/**
 * @file page.js (Booth Request Queries Admin Console)
 * @description Super Admin console to view, filter, update status/notes, inspect event organizer details,
 * and send count-only Booth Request summary notifications to event organizers (without sharing requester PII).
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  Building2,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Loader2,
  Trash2,
  RefreshCw,
  Phone,
  Mail,
  User,
  MapPin,
  Filter,
  Eye,
  Calendar,
  Inbox,
  MessageSquare,
  Store,
  Briefcase,
  Send,
  ShieldCheck,
  Globe,
  History,
  Layers,
  BadgeCheck,
  ExternalLink
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const STATUS_META = {
  new: { label: 'New Query', badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' },
  in_progress: { label: 'In Progress', badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30' },
  responded: { label: 'Responded', badge: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30' },
  approved: { label: 'Approved', badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
  rejected: { label: 'Rejected', badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30' },
  archived: { label: 'Archived', badge: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30' }
};

const CATEGORY_META = {
  stall: { label: 'Book Stall Space', badge: 'bg-amber-400/20 text-amber-700 dark:text-amber-300 border-amber-400/40' },
  visitor_pass: { label: 'Visitor Entry Pass', badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' },
  general: { label: 'General Inquiry', badge: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30' }
};

const SOURCE_LABELS = {
  event: 'Event Listing',
  organization: 'Organization Profile',
  claimed_user: 'Claimed Organizer',
  featured_organizer: 'Featured Organizer',
  created_user: 'Event Creator',
  none: 'Not Saved'
};

export default function AdminBoothRequestsPage() {
  const { accessToken } = useAuth();

  const [activeTab, setActiveTab] = useState('queries'); // 'queries' | 'events' | 'history'
  const [requests, setRequests] = useState([]);
  const [eventSummaries, setEventSummaries] = useState([]);
  const [notificationLogs, setNotificationLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    in_progress: 0,
    responded: 0,
    approved: 0,
    eventsWithRequests: 0,
    organizerAlertsSent: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Query detail modal state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalStatus, setModalStatus] = useState('new');
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [saveNotice, setSaveNotice] = useState('');

  // Notify Organizer (Count-Only) modal state
  const [notifyTarget, setNotifyTarget] = useState(null);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyOrgName, setNotifyOrgName] = useState('');
  const [notifyScope, setNotifyScope] = useState('all'); // 'all' | 'stall'
  const [notifySubject, setNotifySubject] = useState('');
  const [notifyNote, setNotifyNote] = useState('');
  const [saveEmailToEvent, setSaveEmailToEvent] = useState(true);
  const [sendingNotify, setSendingNotify] = useState(false);
  const [notifyFeedback, setNotifyFeedback] = useState({ type: '', text: '' });
  const [eventHistoryLogs, setEventHistoryLogs] = useState([]);

  const fetchBoothRequests = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (categoryFilter !== 'all') params.set('requestCategory', categoryFilter);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());

      const res = await axios.get(`${API_URL}/booth-requests/admin/all?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (res.data?.success) {
        setRequests(res.data.data || []);
        setEventSummaries(res.data.eventSummaries || []);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to load booth requests:', err);
      setError(err.response?.data?.error || 'Could not retrieve booth request queries.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, statusFilter, categoryFilter, searchTerm]);

  const fetchNotificationLogs = useCallback(
    async (eventSlugFilter = '') => {
      if (!accessToken) return;
      if (!eventSlugFilter) setLogsLoading(true);
      try {
        const params = new URLSearchParams();
        if (eventSlugFilter) params.set('eventSlug', eventSlugFilter);
        params.set('limit', eventSlugFilter ? '10' : '60');

        const res = await axios.get(
          `${API_URL}/booth-requests/admin/notifications?${params.toString()}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (res.data?.success) {
          if (eventSlugFilter) {
            setEventHistoryLogs(res.data.data || []);
          } else {
            setNotificationLogs(res.data.data || []);
          }
        }
      } catch (err) {
        console.error('Failed to load notification logs:', err);
      } finally {
        if (!eventSlugFilter) setLogsLoading(false);
      }
    },
    [accessToken]
  );

  useEffect(() => {
    fetchBoothRequests();
  }, [accessToken, statusFilter, categoryFilter]);

  useEffect(() => {
    if (activeTab === 'history' && accessToken) {
      fetchNotificationLogs();
    }
  }, [activeTab, accessToken, fetchNotificationLogs]);

  const eventSummaryBySlug = useMemo(() => {
    const map = new Map();
    for (const s of eventSummaries) {
      if (s.eventSlug) map.set(String(s.eventSlug).toLowerCase(), s);
    }
    return map;
  }, [eventSummaries]);

  const filteredEventSummaries = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return eventSummaries;
    return eventSummaries.filter((ev) => {
      const hay = [
        ev.eventTitle,
        ev.eventSlug,
        ev.eventCity,
        ev.eventVenue,
        ev.organizerDetails?.name,
        ev.organizerDetails?.email
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [eventSummaries, searchTerm]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBoothRequests();
  };

  const handleOpenDetail = (reqItem) => {
    setSelectedRequest(reqItem);
    setModalStatus(reqItem.status || 'new');
    setAdminNotes(reqItem.adminNotes || '');
    setSaveNotice('');
  };

  const buildDefaultSubject = (title, count, scope) => {
    const label = scope === 'stall' ? 'Booth / Stall Request' : 'Booth & Event Request';
    const plural = count === 1 ? '' : 's';
    return `${count} ${label}${plural} Received for ${title} — VisitExpo`;
  };

  const handleOpenNotifyModal = (summaryOrRequest) => {
    const slugKey = String(summaryOrRequest?.eventSlug || '').toLowerCase();
    const summary =
      eventSummaryBySlug.get(slugKey) || {
        eventId: summaryOrRequest?.eventId || summaryOrRequest?.event || null,
        eventSlug: slugKey,
        eventTitle: summaryOrRequest?.eventTitle || slugKey,
        eventVenue: summaryOrRequest?.eventVenue || '',
        eventCity: summaryOrRequest?.eventCity || '',
        eventDateRange: summaryOrRequest?.eventBoothSummary?.eventDateRange || '',
        totalRequests: summaryOrRequest?.eventBoothSummary?.totalRequests ?? 1,
        stallCount: summaryOrRequest?.eventBoothSummary?.stallCount ?? (summaryOrRequest?.requestCategory === 'stall' ? 1 : 0),
        visitorPassCount:
          summaryOrRequest?.eventBoothSummary?.visitorPassCount ??
          (summaryOrRequest?.requestCategory === 'visitor_pass' ? 1 : 0),
        generalCount:
          summaryOrRequest?.eventBoothSummary?.generalCount ??
          (summaryOrRequest?.requestCategory === 'general' ? 1 : 0),
        organizerDetails: summaryOrRequest?.organizerDetails || {
          name: '',
          email: '',
          phone: '',
          website: '',
          source: 'none',
          isClaimed: false
        },
        notificationSummary: summaryOrRequest?.eventBoothSummary?.notificationSummary || null
      };

    const initialScope = summary.totalRequests > 0 ? 'all' : 'stall';
    const initialCount = initialScope === 'stall' ? summary.stallCount : summary.totalRequests;

    setNotifyTarget(summary);
    setNotifyEmail(summary.organizerDetails?.email || '');
    setNotifyOrgName(summary.organizerDetails?.name || '');
    setNotifyScope(initialScope);
    setNotifySubject(buildDefaultSubject(summary.eventTitle, initialCount, initialScope));
    setNotifyNote('');
    setSaveEmailToEvent(true);
    setNotifyFeedback({ type: '', text: '' });
    setEventHistoryLogs([]);
    if (slugKey) {
      fetchNotificationLogs(slugKey);
    }
  };

  const handleScopeChange = (nextScope) => {
    if (!notifyTarget) return;
    setNotifyScope(nextScope);
    const nextCount = nextScope === 'stall' ? notifyTarget.stallCount : notifyTarget.totalRequests;
    setNotifySubject(buildDefaultSubject(notifyTarget.eventTitle, nextCount, nextScope));
  };

  const handleSendOrganizerNotification = async (e) => {
    e.preventDefault();
    if (!notifyTarget) return;

    const cleanEmail = notifyEmail.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setNotifyFeedback({ type: 'error', text: 'Please enter a valid organizer email address.' });
      return;
    }

    const reportedCount =
      notifyScope === 'stall' ? notifyTarget.stallCount : notifyTarget.totalRequests;
    if (reportedCount <= 0) {
      setNotifyFeedback({
        type: 'error',
        text: 'Selected count scope has 0 active requests. Switch to "All Active Requests".'
      });
      return;
    }

    setSendingNotify(true);
    setNotifyFeedback({ type: '', text: '' });
    try {
      const res = await axios.post(
        `${API_URL}/booth-requests/admin/notify-organizer`,
        {
          eventSlug: notifyTarget.eventSlug,
          eventId: notifyTarget.eventId,
          recipientEmail: cleanEmail,
          organizerName: notifyOrgName.trim(),
          countScope: notifyScope,
          customSubject: notifySubject.trim(),
          customNote: notifyNote.trim(),
          saveOrganizerEmailToEvent: saveEmailToEvent
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (res.data?.success) {
        const savedNote = res.data?.data?.savedToEvent
          ? ' Organizer email was also saved to this event.'
          : '';
        setNotifyFeedback({
          type: 'success',
          text: `${res.data.message || 'Count summary email sent to organizer.'}${savedNote}`
        });
        fetchBoothRequests();
        fetchNotificationLogs(notifyTarget.eventSlug);
        if (activeTab === 'history') fetchNotificationLogs();
      }
    } catch (err) {
      setNotifyFeedback({
        type: 'error',
        text: err.response?.data?.error || 'Failed to send organizer notification email.'
      });
    } finally {
      setSendingNotify(false);
    }
  };

  const handleQuickStatusChange = async (id, nextStatus) => {
    try {
      const res = await axios.put(
        `${API_URL}/booth-requests/admin/${id}`,
        { status: nextStatus },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data?.success) {
        setRequests((prev) =>
          prev.map((r) => (r._id === id ? { ...r, ...res.data.data } : r))
        );
        if (selectedRequest?._id === id) {
          setSelectedRequest((prev) => (prev ? { ...prev, ...res.data.data } : prev));
          setModalStatus(nextStatus);
        }
        fetchBoothRequests();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status.');
    }
  };

  const handleSaveDetail = async () => {
    if (!selectedRequest) return;
    setSaving(true);
    setSaveNotice('');
    try {
      const res = await axios.put(
        `${API_URL}/booth-requests/admin/${selectedRequest._id}`,
        { status: modalStatus, adminNotes },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data?.success) {
        setRequests((prev) =>
          prev.map((r) => (r._id === selectedRequest._id ? { ...r, ...res.data.data } : r))
        );
        setSelectedRequest((prev) => (prev ? { ...prev, ...res.data.data } : prev));
        setSaveNotice('Saved successfully');
        fetchBoothRequests();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this booth request query?')) return;
    setDeletingId(id);
    try {
      await axios.delete(`${API_URL}/booth-requests/admin/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setRequests((prev) => prev.filter((r) => r._id !== id));
      if (selectedRequest?._id === id) setSelectedRequest(null);
      fetchBoothRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete booth request.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const activePreviewCount = notifyTarget
    ? notifyScope === 'stall'
      ? notifyTarget.stallCount
      : notifyTarget.totalRequests
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold mb-2">
            <Store className="w-3.5 h-3.5" />
            Admin Booth Desk
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Booth Request Queries</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            View booth inquiries with event organizer contacts and send count-only request alerts to organizers (requester details stay private).
          </p>
        </div>

        <button
          onClick={() => {
            fetchBoothRequests();
            if (activeTab === 'history') fetchNotificationLogs();
          }}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Queries
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Total Requests</span>
            <Inbox className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{stats.total || 0}</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-amber-500/30">
          <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
            <span>New Queries</span>
            <AlertCircle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{stats.new || 0}</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-blue-500/30">
          <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
            <span>In Progress</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{stats.in_progress || 0}</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-violet-500/30">
          <div className="flex items-center justify-between text-xs font-bold text-violet-600 dark:text-violet-400">
            <span>Responded</span>
            <MessageSquare className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{stats.responded || 0}</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-emerald-500/30">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span>Approved</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{stats.approved || 0}</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-indigo-500/30">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
            <span>Organizer Alerts</span>
            <Send className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl font-black text-foreground">{stats.organizerAlertsSent || 0}</p>
            <span className="text-[11px] font-semibold text-muted-foreground">
              {stats.eventsWithRequests || 0} events
            </span>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab('queries')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'queries'
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-sm'
              : 'bg-card border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <Inbox className="w-3.5 h-3.5" />
          All Booth Requests
          <span className="px-1.5 py-0.5 rounded-md bg-white/15 dark:bg-black/15 text-[10px]">
            {stats.total || requests.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'events'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-card border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          By Event &amp; Notify Organizer
          <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-[10px]">
            {eventSummaries.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-card border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Sent Count Alerts Log
          <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-[10px]">
            {stats.organizerAlertsSent || 0}
          </span>
        </button>
      </div>

      {/* Filters & Search (shown for queries and events tabs) */}
      {activeTab !== 'history' && (
        <div className="p-4 rounded-2xl bg-card border border-border flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  activeTab === 'events'
                    ? 'Search by event name, venue, city, organizer name or organizer email...'
                    : 'Search by expo, company, requester name, email or message...'
                }
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold hover:opacity-90 cursor-pointer"
            >
              Search
            </button>
          </form>

          {activeTab === 'queries' && (
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                <Filter className="w-3.5 h-3.5" />
                Filters:
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-background border border-border text-xs font-bold text-foreground focus:outline-none"
              >
                <option value="all">All Request Types</option>
                <option value="stall">Book Stall Space</option>
                <option value="visitor_pass">Visitor Entry Pass</option>
                <option value="general">General Inquiry</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-background border border-border text-xs font-bold text-foreground focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="new">New Query</option>
                <option value="in_progress">In Progress</option>
                <option value="responded">Responded</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: ALL BOOTH REQUESTS */}
      {activeTab === 'queries' && (
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          {error ? (
            <div className="p-8 text-center text-rose-500 text-sm font-semibold">{error}</div>
          ) : loading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              <span className="text-xs font-bold">Loading booth request queries...</span>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-bold text-foreground">No booth request queries found</p>
              <p className="text-xs text-muted-foreground">
                Requests submitted via the &quot;Request Booth&quot; modal on expo pages will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                    <th className="py-3.5 px-4">Expo &amp; Venue</th>
                    <th className="py-3.5 px-4">Event Organizer</th>
                    <th className="py-3.5 px-4">Requester</th>
                    <th className="py-3.5 px-4">Company &amp; Role</th>
                    <th className="py-3.5 px-4">Request Type</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Submitted</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {requests.map((item) => {
                    const sMeta = STATUS_META[item.status] || STATUS_META.new;
                    const cMeta = CATEGORY_META[item.requestCategory] || CATEGORY_META.stall;
                    const org = item.organizerDetails || {};
                    const evSummary = item.eventBoothSummary || {};
                    const wasNotified = Boolean(evSummary.notificationSummary?.sentCount);

                    return (
                      <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4 max-w-[220px]">
                          <p className="font-extrabold text-foreground line-clamp-1">
                            {item.eventTitle || item.eventSlug}
                          </p>
                          {(item.eventCity || item.eventVenue) && (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 line-clamp-1">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span>{[item.eventVenue, item.eventCity].filter(Boolean).join(', ')}</span>
                            </p>
                          )}
                          <div className="mt-1.5 flex flex-wrap items-center gap-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[10px] font-extrabold">
                              {evSummary.totalRequests || 1} total on event
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 max-w-[220px]">
                          <p className="font-bold text-foreground flex items-center gap-1.5 line-clamp-1">
                            <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span>{org.name || 'Organizer not set'}</span>
                            {org.isClaimed && (
                              <BadgeCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" title="Claimed Event" />
                            )}
                          </p>
                          {org.email ? (
                            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 mt-0.5 break-all">
                              <Mail className="w-3 h-3 shrink-0" />
                              <span>{org.email}</span>
                            </p>
                          ) : (
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                              No email saved — click Notify to add
                            </p>
                          )}
                          {org.phone && (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 shrink-0" />
                              <span>{org.phone}</span>
                            </p>
                          )}
                          {wasNotified && (
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 shrink-0" />
                              <span>
                                Count ({evSummary.notificationSummary.lastReportedCount}) sent
                              </span>
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-bold text-foreground flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{item.name}</span>
                          </p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span>{item.email}</span>
                          </p>
                          {item.phone && (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 shrink-0" />
                              <span>{item.phone}</span>
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-bold text-foreground flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>{item.company || '—'}</span>
                          </p>
                          {item.designation && (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Briefcase className="w-3 h-3 shrink-0" />
                              <span>{item.designation}</span>
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black border ${cMeta.badge}`}>
                            {cMeta.label}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <select
                            value={item.status || 'new'}
                            onChange={(e) => handleQuickStatusChange(item._id, e.target.value)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border bg-transparent cursor-pointer ${sMeta.badge}`}
                          >
                            <option value="new" className="text-zinc-900 bg-white">New Query</option>
                            <option value="in_progress" className="text-zinc-900 bg-white">In Progress</option>
                            <option value="responded" className="text-zinc-900 bg-white">Responded</option>
                            <option value="approved" className="text-zinc-900 bg-white">Approved</option>
                            <option value="rejected" className="text-zinc-900 bg-white">Rejected</option>
                            <option value="archived" className="text-zinc-900 bg-white">Archived</option>
                          </select>
                        </td>

                        <td className="py-3.5 px-4 text-[11px] text-muted-foreground whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(item.createdAt)}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenNotifyModal(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] transition-colors cursor-pointer"
                              title="Send count-only booth request email to organizer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Notify
                            </button>
                            <button
                              onClick={() => handleOpenDetail(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              disabled={deletingId === item._id}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors cursor-pointer disabled:opacity-50"
                              title="Delete query"
                            >
                              {deletingId === item._id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BY EVENT & NOTIFY ORGANIZER */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-foreground">
                  Count-Only Organizer Outreach System
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Send an email to each event&apos;s organizer reporting how many booth requests arrived for their expo. Requester names, emails, phones, companies, and messages are never included.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <span className="text-xs font-bold">Loading event summaries...</span>
              </div>
            ) : filteredEventSummaries.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Layers className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                <p className="text-sm font-bold text-foreground">No events with booth requests found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                      <th className="py-3.5 px-4">Event Details</th>
                      <th className="py-3.5 px-4">Event Organizer &amp; Email</th>
                      <th className="py-3.5 px-4">Request Count</th>
                      <th className="py-3.5 px-4">Last Alert Sent</th>
                      <th className="py-3.5 px-4 text-right">Send Count Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs">
                    {filteredEventSummaries.map((ev) => {
                      const org = ev.organizerDetails || {};
                      const notif = ev.notificationSummary;
                      return (
                        <tr key={ev.eventSlug} className="hover:bg-muted/30 transition-colors">
                          <td className="py-4 px-4 max-w-[260px]">
                            <p className="font-extrabold text-foreground text-sm line-clamp-1">
                              {ev.eventTitle}
                            </p>
                            {(ev.eventVenue || ev.eventCity) && (
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 line-clamp-1">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span>{[ev.eventVenue, ev.eventCity].filter(Boolean).join(', ')}</span>
                              </p>
                            )}
                            {ev.eventDateRange && (
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3 shrink-0" />
                                <span>{ev.eventDateRange}</span>
                              </p>
                            )}
                          </td>

                          <td className="py-4 px-4 max-w-[260px]">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-foreground">
                                {org.name || 'Organizer name not set'}
                              </span>
                              {org.isClaimed && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                                  <BadgeCheck className="w-3 h-3" />
                                  Claimed
                                </span>
                              )}
                            </div>

                            {org.email ? (
                              <div className="mt-1 space-y-0.5">
                                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 break-all">
                                  <Mail className="w-3 h-3 shrink-0" />
                                  <span>{org.email}</span>
                                </p>
                                <span className="inline-block text-[10px] text-muted-foreground">
                                  Source: {SOURCE_LABELS[org.source] || 'Database'}
                                </span>
                              </div>
                            ) : (
                              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
                                No email on file — enter in Send modal
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                              {org.phone && (
                                <span className="inline-flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {org.phone}
                                </span>
                              )}
                              {org.website && (
                                <a
                                  href={org.website.startsWith('http') ? org.website : `https://${org.website}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                  <Globe className="w-3 h-3" />
                                  Website
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center justify-center min-w-[36px] h-9 px-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-black text-base">
                                {ev.totalRequests}
                              </span>
                              <div className="space-y-0.5 text-[11px]">
                                <p className="font-bold text-foreground">
                                  Stall Space: <span className="text-amber-600 dark:text-amber-400">{ev.stallCount}</span>
                                </p>
                                <p className="text-muted-foreground">
                                  Visitor: {ev.visitorPassCount} &bull; General: {ev.generalCount}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            {notif ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Sent {notif.sentCount}x (Count: {notif.lastReportedCount})
                                </span>
                                <p className="text-[11px] text-muted-foreground break-all">
                                  To: {notif.lastSentTo}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {formatDate(notif.lastSentAt)}
                                </p>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">
                                Not notified yet
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleOpenNotifyModal(ev)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-sm transition-colors cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Send Count ({ev.totalRequests})
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SENT COUNT ALERTS HISTORY */}
      {activeTab === 'history' && (
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          {logsLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              <span className="text-xs font-bold">Loading organizer notification history...</span>
            </div>
          ) : notificationLogs.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <History className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-bold text-foreground">No organizer count alerts sent yet</p>
              <p className="text-xs text-muted-foreground">
                When you send a count-only booth request summary email to an organizer, it will be logged here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                    <th className="py-3.5 px-4">Event</th>
                    <th className="py-3.5 px-4">Sent To Organizer</th>
                    <th className="py-3.5 px-4">Count Reported</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Sent By</th>
                    <th className="py-3.5 px-4">Sent At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {notificationLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 max-w-[230px]">
                        <p className="font-extrabold text-foreground line-clamp-1">{log.eventTitle}</p>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{log.subject}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-foreground">{log.organizerName || 'Event Organizer'}</p>
                        <p className="text-[11px] text-indigo-600 dark:text-indigo-400">{log.organizerEmail}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-black text-xs">
                          {log.reportedCount} {log.countScope === 'stall' ? 'Stall Only' : 'Total Requests'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {log.status === 'sent' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
                            <CheckCircle2 className="w-3 h-3" />
                            Sent
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-600 text-[10px] font-black" title={log.errorMessage}>
                            <AlertCircle className="w-3 h-3" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">{log.sentByAdmin || 'admin'}</td>
                      <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-5 bg-zinc-950 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  {(CATEGORY_META[selectedRequest.requestCategory] || CATEGORY_META.stall).label}
                </span>
                <h2 className="text-lg font-black mt-0.5">{selectedRequest.eventTitle || selectedRequest.eventSlug}</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Submitted {formatDate(selectedRequest.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Event Organizer Details Card */}
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 text-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Event Organizer Details
                  </span>
                  <p className="font-extrabold text-foreground text-sm flex items-center gap-1.5">
                    <span>{selectedRequest.organizerDetails?.name || 'Organizer not set'}</span>
                    {selectedRequest.organizerDetails?.isClaimed && (
                      <BadgeCheck className="w-4 h-4 text-emerald-500" />
                    )}
                  </p>
                  <p className="text-indigo-700 dark:text-indigo-300 font-semibold flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {selectedRequest.organizerDetails?.email || 'No organizer email saved yet'}
                    </span>
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                    {selectedRequest.organizerDetails?.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {selectedRequest.organizerDetails.phone}
                      </span>
                    )}
                    {selectedRequest.organizerDetails?.website && (
                      <a
                        href={
                          selectedRequest.organizerDetails.website.startsWith('http')
                            ? selectedRequest.organizerDetails.website
                            : `https://${selectedRequest.organizerDetails.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <Globe className="w-3 h-3" />
                        Website
                      </a>
                    )}
                    <span>
                      Total Event Requests:{' '}
                      <strong className="text-foreground">
                        {selectedRequest.eventBoothSummary?.totalRequests || 1}
                      </strong>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const target = selectedRequest;
                    setSelectedRequest(null);
                    handleOpenNotifyModal(target);
                  }}
                  className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-sm cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send Count to Organizer
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-1">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">Requester (Admin Only)</span>
                  <p className="font-bold text-foreground text-sm">{selectedRequest.name}</p>
                  <p className="text-muted-foreground">{selectedRequest.email}</p>
                  {selectedRequest.phone && <p className="text-muted-foreground">{selectedRequest.phone}</p>}
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-1">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">Company &amp; Role</span>
                  <p className="font-bold text-foreground text-sm">{selectedRequest.company || 'Not specified'}</p>
                  <p className="text-muted-foreground">{selectedRequest.designation || 'No designation provided'}</p>
                  {(selectedRequest.eventCity || selectedRequest.eventVenue) && (
                    <p className="text-muted-foreground pt-1">
                      {[selectedRequest.eventVenue, selectedRequest.eventCity].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-foreground">Booth / Event Query Details</label>
                <div className="p-4 rounded-2xl bg-muted/30 border border-border text-sm text-foreground whitespace-pre-wrap">
                  {selectedRequest.message || 'No additional requirements message provided.'}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Status</label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-bold text-foreground"
                  >
                    <option value="new">New Query</option>
                    <option value="in_progress">In Progress</option>
                    <option value="responded">Responded</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Last Reviewed By</label>
                  <div className="px-3.5 py-2.5 rounded-xl bg-muted/30 border border-border text-sm text-muted-foreground">
                    {selectedRequest.reviewedByAdmin || 'Not reviewed yet'}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Admin Internal Notes</label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add pricing shared, stall allocation notes, or follow-up details..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-xs font-bold text-emerald-500">{saveNotice}</span>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleSaveDetail}
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs shadow-sm cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFY ORGANIZER (COUNT-ONLY) MODAL */}
      {notifyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-indigo-950 via-zinc-950 to-zinc-900 text-white flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-400">
                  <Send className="w-3 h-3" />
                  Notify Event Organizer &bull; Count Only
                </div>
                <h2 className="text-lg font-black mt-0.5">{notifyTarget.eventTitle}</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {[notifyTarget.eventVenue, notifyTarget.eventCity].filter(Boolean).join(', ') || notifyTarget.eventSlug}
                  {notifyTarget.eventDateRange ? ` • ${notifyTarget.eventDateRange}` : ''}
                </p>
              </div>
              <button
                onClick={() => setNotifyTarget(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendOrganizerNotification} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
              {/* Privacy Shield Notice */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-emerald-700 dark:text-emerald-300">
                    Count-Only Email — Full Requester Details Are NOT Sent
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    This email notifies the organizer that <strong>{activePreviewCount}</strong> booth request{activePreviewCount === 1 ? '' : 's'} arrived for their event. Requester names, emails, phone numbers, company names, and inquiry messages are strictly excluded.
                  </p>
                </div>
              </div>

              {/* Count Scope Selector */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Request Count To Send
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleScopeChange('all')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      notifyScope === 'all'
                        ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/25'
                        : 'border-border bg-muted/30 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-foreground">All Active Requests</span>
                      <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                        {notifyTarget.totalRequests}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Stall: {notifyTarget.stallCount} &bull; Visitor: {notifyTarget.visitorPassCount} &bull; General: {notifyTarget.generalCount}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleScopeChange('stall')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      notifyScope === 'stall'
                        ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/25'
                        : 'border-border bg-muted/30 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-foreground">Stall Space Only</span>
                      <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                        {notifyTarget.stallCount}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Counts only Book Stall Space inquiries
                    </p>
                  </button>
                </div>
              </div>

              {/* Organizer Contact Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Organizer Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                    placeholder="organizer@company.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                  {notifyTarget.organizerDetails?.source && notifyTarget.organizerDetails.source !== 'none' && (
                    <p className="text-[10px] text-muted-foreground">
                      Auto-filled from {SOURCE_LABELS[notifyTarget.organizerDetails.source] || 'Event'}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Organizer Name</label>
                  <input
                    type="text"
                    value={notifyOrgName}
                    onChange={(e) => setNotifyOrgName(e.target.value)}
                    placeholder="Event Organizer / Company Name"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveEmailToEvent}
                  onChange={(e) => setSaveEmailToEvent(e.target.checked)}
                  className="rounded border-border text-indigo-600 focus:ring-indigo-500"
                />
                <span>Save this organizer email &amp; name to the event record for future notifications</span>
              </label>

              {/* Subject & Optional Admin Note */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Email Subject</label>
                  <input
                    type="text"
                    value={notifySubject}
                    onChange={(e) => setNotifySubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Optional Note from Admin <span className="text-muted-foreground font-normal">(no requester details)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={notifyNote}
                    onChange={(e) => setNotifyNote(e.target.value)}
                    placeholder="e.g. Reply to this email or claim your VisitExpo organizer profile to connect with these exhibitors."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
              </div>

              {/* Email Preview */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Count-Only Email Preview
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Zero Requester PII
                  </span>
                </div>
                <p className="text-muted-foreground">
                  <strong className="text-foreground">To:</strong> {notifyEmail || '—'}
                </p>
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Subject:</strong> {notifySubject}
                </p>
                <div className="p-3 rounded-xl bg-background border border-border space-y-1.5 text-foreground">
                  <p className="font-bold">Hello {notifyOrgName.trim() || 'Event Organizer'},</p>
                  <p className="text-muted-foreground leading-relaxed">
                    Your event <strong className="text-foreground">{notifyTarget.eventTitle}</strong> has received{' '}
                    <strong className="text-amber-600 dark:text-amber-400">
                      {activePreviewCount} {notifyScope === 'stall' ? 'booth / stall request' : 'booth & event request'}
                      {activePreviewCount === 1 ? '' : 's'}
                    </strong>{' '}
                    on VisitExpo.
                  </p>
                  {notifyNote.trim() && (
                    <p className="text-[11px] italic text-indigo-600 dark:text-indigo-400 border-l-2 border-indigo-500 pl-2">
                      {notifyNote.trim()}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Full requester details remain private on VisitExpo. Claim your event or contact support@visitexpo.in to unlock leads.
                  </p>
                </div>
              </div>

              {/* Recent Alerts For This Event */}
              {eventHistoryLogs.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Previous Alerts Sent For This Event
                  </span>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto">
                    {eventHistoryLogs.slice(0, 4).map((log) => (
                      <div
                        key={log._id}
                        className="px-3 py-2 rounded-xl bg-muted/30 border border-border flex items-center justify-between text-[11px]"
                      >
                        <div className="truncate pr-2">
                          <span className="font-bold text-foreground">{log.organizerEmail}</span>
                          <span className="text-muted-foreground">
                            {' '}
                            &bull; Count: <strong>{log.reportedCount}</strong> ({log.countScope})
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback banner */}
              {notifyFeedback.text && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    notifyFeedback.type === 'success'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {notifyFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{notifyFeedback.text}</span>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setNotifyTarget(null)}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={sendingNotify || activePreviewCount <= 0}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-sm cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {sendingNotify ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send Count ({activePreviewCount}) to Organizer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
