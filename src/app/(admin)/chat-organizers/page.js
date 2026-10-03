'use client';

/**
 * @file chat-organizers/page.js
 * @description Super Admin control center to monitor and manage which organizers have enabled the Live Chat feature.
 * Allows instant live chat toggling, status inspection, conversation thread audits, and chat greeting configuration.
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  showSweetSuccess,
  showSweetError,
  showSweetConfirm,
  showSweetInfo
} from '../../../utils/sweetalert.js';
import {
  MessageSquare,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  Mail,
  Phone,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  X,
  SlidersHorizontal,
  Sliders,
  Settings,
  ShieldCheck,
  AlertCircle,
  Check,
  Clock,
  Send,
  User,
  Radio,
  Power,
  Grid,
  List,
  Eye,
  Sparkles,
  Layers,
  ArrowUpDown,
  BellRing,
  HelpCircle,
  ArrowRight
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ChatOrganizersPage() {
  const { accessToken, isSuperAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [organizers, setOrganizers] = useState([]);
  const [stats, setStats] = useState({
    totalOrganizers: 0,
    chatEnabledCount: 0,
    chatOnlineCount: 0,
    chatOfflineCount: 0,
    chatDisabledCount: 0,
    totalConversations: 0,
    totalUnread: 0
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState('all'); // 'all' | 'enabled' | 'online' | 'disabled' | 'has_inquiries'
  const [sortBy, setSortBy] = useState('enabled_first'); // 'enabled_first' | 'conversations_desc' | 'events_desc' | 'name_asc'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [togglingId, setTogglingId] = useState(null);

  // Inquiries Inspection Drawer
  const [inspectionOrganizer, setInspectionOrganizer] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [activeConversation, setActiveConversation] = useState(null);

  // Quick Edit Modal
  const [editingOrganizer, setEditingOrganizer] = useState(null);
  const [editFormData, setEditFormData] = useState({
    isChatEnabled: false,
    chatStatus: 'online',
    chatWelcomeMessage: '',
    chatAutoReply: true
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Load Organizers Data
  const fetchData = async (isSilent = false) => {
    if (!accessToken) return;
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await axios.get(`${API_URL}/chat/admin/organizers`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (res.data?.success) {
        setOrganizers(res.data.organizers || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load chat organizers:', err);
      if (!isSilent) {
        showSweetError(err.response?.data?.message || 'Failed to load organizers chat data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [accessToken]);

  // Handle Instant Toggle
  const handleToggleChat = async (organizer, forcedState = null) => {
    const nextState = forcedState !== null ? forcedState : !organizer.isChatEnabled;
    const actionLabel = nextState ? 'Enable' : 'Disable';

    const confirmed = await showSweetConfirm({
      title: `${actionLabel} Live Chat?`,
      text: nextState
        ? `This will turn ON live chat inquiries for "${organizer.name}". Visitors and exhibitors will be able to start instant chats.`
        : `This will turn OFF live chat for "${organizer.name}". Visitors will no longer see the chat trigger.`,
      icon: nextState ? 'question' : 'warning',
      confirmButtonText: `${actionLabel} Live Chat`,
      isDanger: !nextState
    });

    if (!confirmed) return;

    setTogglingId(organizer.id);

    // Optimistic UI update
    setOrganizers((prev) =>
      prev.map((org) => {
        if (org.id === organizer.id) {
          return {
            ...org,
            isChatEnabled: nextState,
            chatStatus: nextState ? (org.chatStatus || 'online') : 'offline'
          };
        }
        return org;
      })
    );

    try {
      const res = await axios.patch(
        `${API_URL}/chat/admin/organizers/${organizer.id}/toggle`,
        {
          isChatEnabled: nextState,
          chatStatus: nextState ? 'online' : 'offline'
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      if (res.data?.success) {
        showSweetSuccess(
          `Live chat has been ${nextState ? 'enabled' : 'disabled'} for ${organizer.name}`,
          'Chat Status Updated'
        );
        // Refresh silently to keep stats in sync
        fetchData(true);
      }
    } catch (err) {
      console.error('Toggle failed:', err);
      showSweetError(err.response?.data?.message || 'Failed to update organizer chat settings');
      // Revert optimistic update
      fetchData(true);
    } finally {
      setTogglingId(null);
    }
  };

  // Open Inspection Drawer
  const handleInspectInquiries = async (organizer) => {
    setInspectionOrganizer(organizer);
    setConversations([]);
    setActiveConversation(null);
    setLoadingConversations(true);

    try {
      const res = await axios.get(`${API_URL}/chat/admin/organizers/${organizer.id}/conversations`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data?.success) {
        setConversations(res.data.conversations || []);
        if (res.data.conversations?.length > 0) {
          setActiveConversation(res.data.conversations[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
      showSweetError('Failed to load conversation history for this organizer');
    } finally {
      setLoadingConversations(false);
    }
  };

  // Open Settings Modal
  const handleOpenEditModal = (organizer) => {
    setEditingOrganizer(organizer);
    setEditFormData({
      isChatEnabled: !!organizer.isChatEnabled,
      chatStatus: organizer.chatStatus || 'online',
      chatWelcomeMessage:
        organizer.chatWelcomeMessage ||
        'Hello! Welcome to our exhibition desk. How can we assist you today?',
      chatAutoReply: organizer.chatAutoReply !== false
    });
  };

  // Save Settings Modal
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!editingOrganizer) return;

    setSavingSettings(true);
    try {
      const res = await axios.patch(
        `${API_URL}/chat/admin/organizers/${editingOrganizer.id}/toggle`,
        editFormData,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      if (res.data?.success) {
        showSweetSuccess('Organizer chat configuration saved successfully!');
        setEditingOrganizer(null);
        fetchData(true);
      }
    } catch (err) {
      console.error('Save failed:', err);
      showSweetError(err.response?.data?.message || 'Failed to update chat configuration');
    } finally {
      setSavingSettings(false);
    }
  };

  // Filter & Sort Logic
  const filteredOrganizers = useMemo(() => {
    let result = [...organizers];

    // Status Tab Filter
    if (statusTab === 'enabled') {
      result = result.filter((o) => o.isChatEnabled);
    } else if (statusTab === 'online') {
      result = result.filter((o) => o.isChatEnabled && o.chatStatus === 'online');
    } else if (statusTab === 'disabled') {
      result = result.filter((o) => !o.isChatEnabled);
    } else if (statusTab === 'has_inquiries') {
      result = result.filter((o) => o.totalConversations > 0);
    }

    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.name?.toLowerCase().includes(q) ||
          o.email?.toLowerCase().includes(q) ||
          o.phone?.toLowerCase().includes(q) ||
          o.company?.toLowerCase().includes(q) ||
          o.organizationName?.toLowerCase().includes(q)
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'enabled_first') {
        if (a.isChatEnabled && !b.isChatEnabled) return -1;
        if (!a.isChatEnabled && b.isChatEnabled) return 1;
        if (a.chatStatus === 'online' && b.chatStatus !== 'online') return -1;
        if (a.chatStatus !== 'online' && b.chatStatus === 'online') return 1;
        return (b.totalConversations || 0) - (a.totalConversations || 0);
      }
      if (sortBy === 'conversations_desc') {
        return (b.totalConversations || 0) - (a.totalConversations || 0);
      }
      if (sortBy === 'events_desc') {
        return (b.eventsCount || 0) - (a.eventsCount || 0);
      }
      if (sortBy === 'name_asc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return 0;
    });

    return result;
  }, [organizers, statusTab, searchQuery, sortBy]);

  return (
    <div className="min-h-screen space-y-6 pb-20">
      {/* Top Banner & Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-700 to-indigo-800 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-10 h-48 w-48 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
              <span>Organizer Live Communication Center</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Live Chat Feature Status & Inquiries
            </h1>
            <p className="text-sm md:text-base text-emerald-100/90 max-w-2xl leading-relaxed">
              Track which exhibition organizers have enabled direct live chat desk for visitors &
              exhibitors. Toggle live features, audit conversation threads, and adjust welcome
              greetings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 px-4 py-2.5 text-sm font-semibold transition backdrop-blur-md active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh Directory'}</span>
            </button>

            <Link
              href="/organizers"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 px-4 py-2.5 text-sm font-semibold shadow-md transition active:scale-95"
            >
              <Building2 className="h-4 w-4 text-emerald-700" />
              <span>Full Organizers Directory</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {/* Total Organizers */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm hover:border-primary/40 transition">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Organizers</span>
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {stats.totalOrganizers}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
            <span>Verified accounts & groups</span>
          </div>
        </div>

        {/* Chat Enabled */}
        <div
          onClick={() => setStatusTab('enabled')}
          className={`cursor-pointer rounded-xl border p-4 shadow-sm transition ${
            statusTab === 'enabled'
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-border bg-card hover:border-emerald-500/50'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Chat Enabled</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.chatEnabledCount}
          </div>
          <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1 font-medium">
            {stats.totalOrganizers > 0
              ? `${Math.round((stats.chatEnabledCount / stats.totalOrganizers) * 100)}% of organizers`
              : '0%'}
          </div>
        </div>

        {/* Online Now */}
        <div
          onClick={() => setStatusTab('online')}
          className={`cursor-pointer rounded-xl border p-4 shadow-sm transition ${
            statusTab === 'online'
              ? 'border-teal-500 bg-teal-500/10'
              : 'border-border bg-card hover:border-teal-500/50'
          }`}
        >
          <div className="flex items-center justify-between text-teal-600 dark:text-teal-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Online Now</span>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
            </span>
          </div>
          <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
            {stats.chatOnlineCount}
          </div>
          <div className="text-[11px] text-teal-700/80 dark:text-teal-400/80 mt-1">
            Active for instant replies
          </div>
        </div>

        {/* Chat Disabled */}
        <div
          onClick={() => setStatusTab('disabled')}
          className={`cursor-pointer rounded-xl border p-4 shadow-sm transition ${
            statusTab === 'disabled'
              ? 'border-amber-500 bg-amber-500/10'
              : 'border-border bg-card hover:border-amber-500/50'
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Chat Disabled</span>
            <XCircle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {stats.chatDisabledCount}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Can enable with 1-click
          </div>
        </div>

        {/* Total Inquiries */}
        <div
          onClick={() => setStatusTab('has_inquiries')}
          className={`cursor-pointer rounded-xl border p-4 shadow-sm transition ${
            statusTab === 'has_inquiries'
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-border bg-card hover:border-indigo-500/50'
          }`}
        >
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Conversations</span>
            <MessageSquare className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {stats.totalConversations}
          </div>
          <div className="text-[11px] text-indigo-700/80 dark:text-indigo-400/80 mt-1">
            Total active chat threads
          </div>
        </div>

        {/* Unread Inquiries */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm hover:border-rose-500/50 transition">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Unread Alerts</span>
            <BellRing className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {stats.totalUnread}
          </div>
          <div className="text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-1">
            Awaiting organizer reply
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/60 rounded-xl">
            <button
              onClick={() => setStatusTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusTab === 'all'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Organizers ({stats.totalOrganizers})
            </button>
            <button
              onClick={() => setStatusTab('enabled')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusTab === 'enabled'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Chat Enabled ({stats.chatEnabledCount})</span>
            </button>
            <button
              onClick={() => setStatusTab('online')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusTab === 'online'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-teal-400"></span>
              <span>Online Now ({stats.chatOnlineCount})</span>
            </button>
            <button
              onClick={() => setStatusTab('disabled')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusTab === 'disabled'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400'
              }`}
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Chat Disabled ({stats.chatDisabledCount})</span>
            </button>
            <button
              onClick={() => setStatusTab('has_inquiries')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusTab === 'has_inquiries'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>With Inquiries ({organizers.filter((o) => o.totalConversations > 0).length})</span>
            </button>
          </div>

          {/* View mode switcher */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted/60 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md text-xs font-medium transition ${
                  viewMode === 'table'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Table View"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md text-xs font-medium transition ${
                  viewMode === 'grid'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Grid View"
              >
                <Grid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search organizer name, email, phone, company, or organization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2 text-sm w-full sm:w-auto">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-sm focus:outline-none cursor-pointer"
              >
                <option value="enabled_first">Enabled & Online First</option>
                <option value="conversations_desc">Most Inquiries</option>
                <option value="events_desc">Most Events / Expos</option>
                <option value="name_asc">Alphabetical (A - Z)</option>
              </select>
            </div>

            {(searchQuery || statusTab !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusTab('all');
                }}
                className="text-xs text-primary hover:underline whitespace-nowrap px-2 py-1"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-16 flex flex-col items-center justify-center space-y-4 shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading organizer chat directory and metrics...
          </p>
        </div>
      ) : filteredOrganizers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center space-y-3">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <h3 className="text-lg font-semibold text-foreground">No Organizers Found</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            No organizers match the current search query or status filter. Try clearing filters or
            searching for another name.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusTab('all');
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition"
          >
            Clear All Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3.5 px-4">Organizer</th>
                  <th className="py-3.5 px-4">Company / Entity</th>
                  <th className="py-3.5 px-4 text-center">Expos Managed</th>
                  <th className="py-3.5 px-4 text-center">Chat Feature Status</th>
                  <th className="py-3.5 px-4">Welcome Greeting</th>
                  <th className="py-3.5 px-4 text-center">Inquiries</th>
                  <th className="py-3.5 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrganizers.map((org) => {
                  const isToggling = togglingId === org.id;

                  return (
                    <tr
                      key={org.id}
                      className={`hover:bg-muted/40 transition-colors ${
                        org.isChatEnabled ? 'bg-emerald-500/[0.02]' : ''
                      }`}
                    >
                      {/* Organizer Name & Contact */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-emerald-500/20 to-indigo-500/20 border border-border flex items-center justify-center font-bold text-sm text-foreground">
                              {org.organizationLogo ? (
                                <img
                                  src={org.organizationLogo}
                                  alt={org.name}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                (org.name || 'O').charAt(0).toUpperCase()
                              )}
                            </div>
                            {/* Status Indicator Dot */}
                            {org.isChatEnabled && (
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card ${
                                  org.chatStatus === 'online'
                                    ? 'bg-emerald-500'
                                    : 'bg-amber-500'
                                }`}
                                title={`Chat Status: ${org.chatStatus}`}
                              />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground truncate max-w-[200px]">
                                {org.name}
                              </span>
                              {org.isVerified && (
                                <ShieldCheck
                                  className="h-4 w-4 text-emerald-500 flex-shrink-0"
                                  title="Verified Organizer"
                                />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                              {org.email || 'No email provided'}
                            </div>
                            {org.phone && (
                              <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Phone className="h-3 w-3" />
                                <span>{org.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Company / Entity */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <span className="font-medium text-foreground block">
                            {org.company || org.organizationName || 'Independent'}
                          </span>
                          {org.organizationWebsite && (
                            <a
                              href={
                                org.organizationWebsite.startsWith('http')
                                  ? org.organizationWebsite
                                  : `https://${org.organizationWebsite}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <span>Website</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Expos Managed Count */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{org.eventsCount || 0}</span>
                        </span>
                      </td>

                      {/* Live Chat Feature Toggle & Status */}
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1.5">
                          {/* Live Switch Button */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleChat(org)}
                              disabled={isToggling}
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 ${
                                org.isChatEnabled ? 'bg-emerald-600' : 'bg-zinc-300 dark:bg-zinc-700'
                              }`}
                              role="switch"
                              aria-checked={org.isChatEnabled}
                              title={
                                org.isChatEnabled
                                  ? 'Click to Disable Chat'
                                  : 'Click to Enable Chat'
                              }
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                  org.isChatEnabled ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>

                            <span
                              className={`text-xs font-bold ${
                                org.isChatEnabled
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-zinc-500'
                              }`}
                            >
                              {org.isChatEnabled ? 'ENABLED' : 'DISABLED'}
                            </span>
                          </div>

                          {/* Online / Offline status badge */}
                          {org.isChatEnabled && (
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium border ${
                                org.chatStatus === 'online'
                                  ? 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/30'
                                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  org.chatStatus === 'online'
                                    ? 'bg-teal-500'
                                    : 'bg-amber-500'
                                }`}
                              />
                              <span>
                                {org.chatStatus === 'online' ? 'Online Desk' : 'Offline Mode'}
                              </span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Welcome Greeting */}
                      <td className="py-4 px-4 max-w-[260px]">
                        <div
                          className="text-xs text-muted-foreground line-clamp-2 bg-muted/40 p-2 rounded-lg border border-border/50 cursor-pointer hover:border-primary/50 transition"
                          onClick={() => handleOpenEditModal(org)}
                          title="Click to edit greeting message"
                        >
                          "{org.chatWelcomeMessage || 'Default welcome message'}"
                        </div>
                      </td>

                      {/* Inquiries / Conversations Count */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                              org.totalConversations > 0
                                ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            <MessageSquare className="h-3 w-3" />
                            <span>{org.totalConversations} Inquiries</span>
                          </span>

                          {org.unreadMessages > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              <BellRing className="h-2.5 w-2.5" />
                              <span>{org.unreadMessages} unread</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleInspectInquiries(org)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background hover:bg-muted px-2.5 py-1.5 text-xs font-medium text-foreground transition active:scale-95 shadow-sm"
                            title="Inspect Conversation Threads"
                          >
                            <Eye className="h-3.5 w-3.5 text-indigo-500" />
                            <span className="hidden sm:inline">Inspect</span>
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(org)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background hover:bg-muted px-2.5 py-1.5 text-xs font-medium text-foreground transition active:scale-95 shadow-sm"
                            title="Configure Chat Settings"
                          >
                            <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="hidden sm:inline">Settings</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrganizers.map((org) => {
            const isToggling = togglingId === org.id;

            return (
              <div
                key={org.id}
                className={`rounded-2xl border p-5 bg-card shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${
                  org.isChatEnabled
                    ? 'border-emerald-500/40 bg-gradient-to-b from-emerald-500/[0.03] to-transparent'
                    : 'border-border'
                }`}
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-indigo-500/20 border border-border flex items-center justify-center font-bold text-base text-foreground">
                          {org.organizationLogo ? (
                            <img
                              src={org.organizationLogo}
                              alt={org.name}
                              className="h-12 w-12 rounded-xl object-cover"
                            />
                          ) : (
                            (org.name || 'O').charAt(0).toUpperCase()
                          )}
                        </div>
                        {org.isChatEnabled && (
                          <span
                            className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-card ${
                              org.chatStatus === 'online' ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-foreground text-base leading-tight">
                            {org.name}
                          </h4>
                          {org.isVerified && (
                            <ShieldCheck className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">
                          {org.company || org.organizationName || 'Independent Organizer'}
                        </p>
                      </div>
                    </div>

                    {/* Enable Toggle Switch */}
                    <div className="flex flex-col items-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleChat(org)}
                        disabled={isToggling}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                          org.isChatEnabled ? 'bg-emerald-600' : 'bg-zinc-300 dark:bg-zinc-700'
                        }`}
                        role="switch"
                        aria-checked={org.isChatEnabled}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            org.isChatEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span
                        className={`text-[10px] font-bold ${
                          org.isChatEnabled
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-zinc-500'
                        }`}
                      >
                        {org.isChatEnabled ? 'CHAT ON' : 'CHAT OFF'}
                      </span>
                    </div>
                  </div>

                  {/* Contact Snippets */}
                  <div className="space-y-1.5 text-xs text-muted-foreground border-y border-border/50 py-3">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground/70 flex-shrink-0" />
                      <span className="truncate">{org.email || 'No email registered'}</span>
                    </div>
                    {org.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground/70 flex-shrink-0" />
                        <span>{org.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Greeting Box */}
                  <div className="rounded-xl bg-muted/40 p-3 border border-border/50 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Welcome Greeting
                    </span>
                    <p className="text-xs text-foreground/80 line-clamp-2 italic">
                      "{org.chatWelcomeMessage || 'Default welcome message'}"
                    </p>
                  </div>

                  {/* Metrics Badges */}
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-muted/60 p-2">
                      <span className="block text-muted-foreground text-[10px]">Expos</span>
                      <span className="font-bold text-foreground">{org.eventsCount || 0}</span>
                    </div>
                    <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-700 dark:text-indigo-400">
                      <span className="block text-[10px]">Total Inquiries</span>
                      <span className="font-bold">{org.totalConversations}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleInspectInquiries(org)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background hover:bg-muted py-2 text-xs font-semibold text-foreground transition shadow-sm"
                  >
                    <Eye className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Inquiries ({org.totalConversations})</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(org)}
                    className="inline-flex items-center justify-center p-2 rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition shadow-sm"
                    title="Edit Settings"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* SIDE DRAWER: INQUIRIES & CONVERSATION INSPECTION */}
      {/* ============================================================ */}
      {inspectionOrganizer && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="relative w-full max-w-2xl bg-card border-l border-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/40">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary">
                  {inspectionOrganizer.name?.charAt(0).toUpperCase() || 'O'}
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base">
                    {inspectionOrganizer.name} - Inquiries Audit
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {conversations.length} conversation threads found
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectionOrganizer(null)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {loadingConversations ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-xs text-muted-foreground">Loading inquiry threads...</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center space-y-3 border border-dashed border-border rounded-xl p-8">
                  <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
                  <h4 className="font-semibold text-foreground text-sm">No Inquiries Yet</h4>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    This organizer has not received any direct chat inquiries from visitors or exhibitors yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {conversations.map((conv) => {
                    const isSelected = activeConversation?._id === conv._id;

                    return (
                      <div
                        key={conv._id}
                        className={`rounded-xl border p-4 transition ${
                          isSelected
                            ? 'border-primary bg-primary/[0.03] shadow-sm'
                            : 'border-border bg-card hover:border-border/80'
                        }`}
                      >
                        {/* Conversation Header */}
                        <div
                          className="flex items-start justify-between gap-3 cursor-pointer"
                          onClick={() => setActiveConversation(isSelected ? null : conv)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold text-xs">
                              {conv.participantName?.charAt(0).toUpperCase() || 'P'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground text-sm">
                                  {conv.participantName || 'Anonymous Visitor'}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                  {conv.participantRole || 'visitor'}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {conv.participantEmail || 'No email'}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(conv.lastMessageAt || conv.createdAt).toLocaleDateString(
                                undefined,
                                {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }
                              )}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                conv.status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400'
                              }`}
                            >
                              {conv.status?.toUpperCase() || 'ACTIVE'}
                            </span>
                          </div>
                        </div>

                        {/* Event Context */}
                        {conv.eventTitle && (
                          <div className="mt-3 flex items-center gap-1.5 text-xs text-primary bg-primary/5 p-2 rounded-lg">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="font-medium">Expo: {conv.eventTitle}</span>
                          </div>
                        )}

                        {/* Last Message Snippet */}
                        <div className="mt-2 text-xs text-muted-foreground line-clamp-2 bg-muted/30 p-2.5 rounded-lg border border-border/40">
                          {conv.lastMessage || 'No messages'}
                        </div>

                        {/* Expanded Full Message Transcript */}
                        {isSelected && Array.isArray(conv.messages) && (
                          <div className="mt-4 pt-4 border-t border-border space-y-3">
                            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Message Transcript ({conv.messages.length})
                            </h5>
                            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                              {conv.messages.map((msg, idx) => {
                                const isOrg = msg.senderRole === 'organizer';
                                return (
                                  <div
                                    key={idx}
                                    className={`flex flex-col text-xs p-3 rounded-xl max-w-[85%] ${
                                      isOrg
                                        ? 'ml-auto bg-primary text-primary-foreground'
                                        : 'mr-auto bg-muted text-foreground'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-3 text-[10px] opacity-75 mb-1">
                                      <span className="font-semibold">{msg.senderName || (isOrg ? 'Organizer' : 'Visitor')}</span>
                                      <span>
                                        {new Date(msg.timestamp).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                    </div>
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-border bg-muted/40 flex justify-end">
              <button
                onClick={() => setInspectionOrganizer(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-700 dark:text-rose-400 transition"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* QUICK EDIT MODAL: CHAT SETTINGS */}
      {/* ============================================================ */}
      {editingOrganizer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/40">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  <Settings className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base">
                    Configure Live Chat Settings
                  </h3>
                  <p className="text-xs text-muted-foreground">{editingOrganizer.name}</p>
                </div>
              </div>

              <button
                onClick={() => setEditingOrganizer(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveSettings} className="p-6 space-y-5">
              {/* Feature Enable Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20">
                <div>
                  <label className="text-sm font-semibold text-foreground block">
                    Live Chat Feature
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Enable or disable the live chat desk for visitors & exhibitors
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setEditFormData((prev) => ({
                      ...prev,
                      isChatEnabled: !prev.isChatEnabled
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    editFormData.isChatEnabled ? 'bg-emerald-600' : 'bg-zinc-300 dark:bg-zinc-700'
                  }`}
                  role="switch"
                  aria-checked={editFormData.isChatEnabled}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      editFormData.isChatEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Status Radio (Online / Offline) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Current Desk Status
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setEditFormData((prev) => ({ ...prev, chatStatus: 'online' }))
                    }
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                      editFormData.chatStatus === 'online'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    <span className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-sm">Online (Ready)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEditFormData((prev) => ({ ...prev, chatStatus: 'offline' }))
                    }
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                      editFormData.chatStatus === 'offline'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    <span className="h-3 w-3 rounded-full bg-amber-500" />
                    <span className="text-sm">Offline Desk</span>
                  </button>
                </div>
              </div>

              {/* Welcome Greeting Message */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Custom Welcome Greeting
                </label>
                <textarea
                  rows={3}
                  value={editFormData.chatWelcomeMessage}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      chatWelcomeMessage: e.target.value
                    }))
                  }
                  placeholder="Enter greeting message shown to visitors upon opening chat..."
                  className="w-full p-3 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                />
                <p className="text-[11px] text-muted-foreground">
                  Visitors and exhibitors will see this as the introductory message in the chat drawer.
                </p>
              </div>

              {/* Auto Reply Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20">
                <div>
                  <label className="text-sm font-semibold text-foreground block">
                    Automatic Out-of-Office Reply
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Send automated response when desk is offline or organizer is away
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setEditFormData((prev) => ({
                      ...prev,
                      chatAutoReply: !prev.chatAutoReply
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    editFormData.chatAutoReply ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-700'
                  }`}
                  role="switch"
                  aria-checked={editFormData.chatAutoReply}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      editFormData.chatAutoReply ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingOrganizer(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold hover:bg-primary/90 transition shadow-md disabled:opacity-50"
                >
                  {savingSettings ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Save Configuration</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
