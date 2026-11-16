'use client';

/**
 * @file page.js (Activity Monitor)
 * @description Super Admin console to monitor real-time and historical user activities
 * across the platform: page visits, event clicks, interested/followed/saved events,
 * pass requests, searches, logins/registrations, and form interactions/submissions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import Pagination from '../../../components/Pagination.js';
import {
  Activity,
  Search,
  RefreshCw,
  Download,
  Eye,
  Trash2,
  MousePointerClick,
  Globe,
  Heart,
  Bell,
  Bookmark,
  Ticket,
  FileText,
  Edit3,
  ShieldCheck,
  UserCheck,
  Users,
  Calendar,
  MapPin,
  Clock,
  Filter,
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  TrendingUp,
  ChevronRight,
  Monitor,
  Building2,
  Mail,
  Phone,
  ArrowLeft
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const ACTIVITY_TYPE_META = {
  page_visit: {
    label: 'Page Visit',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800',
    icon: Globe
  },
  event_view: {
    label: 'Event Viewed',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
    icon: Eye
  },
  event_click: {
    label: 'Event Click',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    icon: MousePointerClick
  },
  event_interest: {
    label: 'Marked Interested',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
    icon: Heart
  },
  event_follow: {
    label: 'Followed Event',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800',
    icon: Bell
  },
  event_bookmark: {
    label: 'Bookmarked Event',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
    icon: Bookmark
  },
  pass_request: {
    label: 'Pass Request',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    icon: Ticket
  },
  form_submit: {
    label: 'Form Submitted',
    badgeClass: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    icon: FileText
  },
  form_interaction: {
    label: 'Form Started',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
    icon: Edit3
  },
  button_click: {
    label: 'Button / CTA Click',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    icon: MousePointerClick
  },
  search: {
    label: 'Search Query',
    badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800',
    icon: Search
  },
  auth: {
    label: 'Account / Auth',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
    icon: ShieldCheck
  }
};

const ROLE_BADGE_MAP = {
  visitor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  organizer: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  exhibitor: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 dark:border-fuchsia-800',
  guest: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  admin: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  super_admin: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
};

function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return String(dateStr);
  }
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return 'just now';
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}

export default function ActivityMonitorPage() {
  const { accessToken, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('timeline');
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({
    totalActivities: 0,
    pageVisitsCount: 0,
    eventClicksCount: 0,
    engagementsCount: 0,
    formSubmissionsCount: 0,
    uniqueUsersCount: 0
  });
  const [userSummaries, setUserSummaries] = useState([]);
  const [topEvents, setTopEvents] = useState([]);
  const [topPages, setTopPages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [statusBanner, setStatusBanner] = useState(null);

  // Filters & Pagination
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [activityType, setActivityType] = useState('all');
  const [userRole, setUserRole] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [selectedUserFilter, setSelectedUserFilter] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // User-Wise Directory Pagination
  const [usersPage, setUsersPage] = useState(1);
  const [usersLimit, setUsersLimit] = useState(10);
  const [usersTotalItems, setUsersTotalItems] = useState(0);
  const [usersTotalPages, setUsersTotalPages] = useState(1);

  // Inspector modal
  const [inspectedActivity, setInspectedActivity] = useState(null);

  const fetchActivities = useCallback(
    async ({ silent = false } = {}) => {
      if (!accessToken) return;
      if (!silent) setLoading(true);
      try {
        const params = {
          page,
          limit,
          usersPage,
          usersLimit,
          activityType,
          userRole,
          dateRange
        };
        if (appliedSearch.trim()) params.search = appliedSearch.trim();
        if (selectedUserFilter?.userKey) params.userKey = selectedUserFilter.userKey;
        if (selectedUserFilter?.userId) params.userId = selectedUserFilter.userId;
        if (selectedUserFilter?.userEmail) params.userEmail = selectedUserFilter.userEmail;

        const res = await axios.get(`${API_URL}/admin/activity-monitor`, {
          params,
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        const data = res.data?.data || {};
        setActivities(Array.isArray(data.docs) ? data.docs : []);
        setTotalItems(data.total || 0);
        setTotalPages(data.pages || 1);
        setUsersTotalItems(data.usersTotal || 0);
        setUsersTotalPages(data.usersPages || 1);
        if (data.stats) setStats(data.stats);
        setUserSummaries(Array.isArray(data.userSummaries) ? data.userSummaries : []);
        setTopEvents(Array.isArray(data.topEvents) ? data.topEvents : []);
        setTopPages(Array.isArray(data.topPages) ? data.topPages : []);
      } catch (err) {
        if (!silent) {
          setStatusBanner({
            type: 'error',
            message: err.response?.data?.message || 'Failed to load activity monitor logs.'
          });
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [
      accessToken,
      page,
      limit,
      usersPage,
      usersLimit,
      activityType,
      userRole,
      dateRange,
      appliedSearch,
      selectedUserFilter
    ]
  );

  useEffect(() => {
    if (authLoading || !accessToken) return undefined;
    const timer = setTimeout(() => {
      fetchActivities();
    }, 0);
    return () => clearTimeout(timer);
  }, [authLoading, accessToken, fetchActivities]);

  // Live 15s auto-refresh when enabled on timeline
  useEffect(() => {
    if (!autoRefresh || !accessToken) return undefined;
    const interval = setInterval(() => {
      fetchActivities({ silent: true });
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, accessToken, fetchActivities]);

  const handleSyncHistorical = async () => {
    if (!accessToken || syncing) return;
    setSyncing(true);
    setStatusBanner(null);
    try {
      const res = await axios.post(
        `${API_URL}/admin/activity-monitor/sync`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setStatusBanner({
        type: 'success',
        message: res.data?.message || 'Historical activity records synchronized successfully.'
      });
      await fetchActivities();
    } catch (err) {
      setStatusBanner({
        type: 'error',
        message: err.response?.data?.message || 'Failed to sync historical activities.'
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteLog = async (id) => {
    if (!accessToken || !id || deletingId) return;
    setDeletingId(id);
    try {
      await axios.delete(`${API_URL}/admin/activity-monitor/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setActivities((prev) => prev.filter((item) => item._id !== id));
      setTotalItems((prev) => Math.max(0, prev - 1));
      if (inspectedActivity?._id === id) setInspectedActivity(null);
    } catch (err) {
      setStatusBanner({
        type: 'error',
        message: err.response?.data?.message || 'Failed to delete activity entry.'
      });
    } finally {
      setDeletingId('');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setUsersPage(1);
    setAppliedSearch(searchInput);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setAppliedSearch('');
    setActivityType('all');
    setUserRole('all');
    setDateRange('all');
    setSelectedUserFilter(null);
    setPage(1);
    setUsersPage(1);
  };

  const handleSelectUserFromSummary = (u) => {
    setSelectedUserFilter({
      userKey: u.userKey,
      userId: u.userId || null,
      userEmail: u.userEmail || '',
      userName: u.userName || u.userEmail || 'Guest Session',
      userPhone: u.userPhone || '',
      userRole: u.userRole || 'guest',
      userCompany: u.userCompany || '',
      sessionId: u.sessionId || '',
      totalActions: u.totalActions || 0,
      pageVisitsCount: u.pageVisitsCount || 0,
      eventClicksCount: u.eventClicksCount || 0,
      interestedCount: u.interestedCount || 0,
      formsCount: u.formsCount || 0,
      passRequestsCount: u.passRequestsCount || 0,
      lastActionAt: u.lastActionAt,
      firstActionAt: u.firstActionAt,
      lastActionLabel: u.lastActionLabel || '',
      lastPagePath: u.lastPagePath || '/'
    });
    setPage(1);
    setActiveTab('users');
  };

  const handleSelectUserFromActivity = (item) => {
    const uKey = item.userEmail || item.user || item.sessionId || item.userName;
    if (!uKey) return;
    const matched = userSummaries.find(
      (u) =>
        (item.userEmail && u.userEmail === item.userEmail) ||
        (item.user && u.userId === item.user) ||
        (item.sessionId && u.sessionId === item.sessionId)
    );
    if (matched) {
      handleSelectUserFromSummary(matched);
      return;
    }
    setSelectedUserFilter({
      userKey: item.user ? `uid:${item.user}` : uKey,
      userId: item.user || null,
      userEmail: item.userEmail || '',
      userName: item.userName || item.userEmail || 'Guest Visitor',
      userPhone: item.userPhone || '',
      userRole: item.userRole || 'guest',
      userCompany: item.userCompany || '',
      sessionId: item.sessionId || ''
    });
    setPage(1);
    setActiveTab('users');
  };

  const handleExportCsv = () => {
    if (!activities.length) return;
    const headers = [
      'Timestamp',
      'User Name',
      'User Email',
      'User Phone',
      'Role',
      'Company',
      'Activity Type',
      'Action Label',
      'Description',
      'Target Event',
      'Page Path',
      'Form Name',
      'Source'
    ];

    const escapeCsv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = activities.map((row) => [
      formatDateTime(row.createdAt),
      row.userName || 'Guest User',
      row.userEmail || '',
      row.userPhone || '',
      row.userRole || 'guest',
      row.userCompany || '',
      ACTIVITY_TYPE_META[row.activityType]?.label || row.activityType,
      row.actionLabel || '',
      row.description || '',
      row.targetEvent?.title || '',
      row.pagePath || '',
      row.formInfo?.formName || '',
      row.source || 'client'
    ]);

    const csvContent = [headers.map(escapeCsv).join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `visitexpo-activity-monitor-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const statCards = [
    {
      label: 'Total Activities',
      value: stats.totalActivities,
      icon: Activity,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400',
      onClick: () => {
        setActivityType('all');
        setActiveTab('timeline');
        setPage(1);
      }
    },
    {
      label: 'Page Visits & Views',
      value: stats.pageVisitsCount,
      icon: Globe,
      color: 'text-sky-600 bg-sky-50 dark:bg-sky-900/30 dark:text-sky-400',
      onClick: () => {
        setActivityType('page_visit');
        setActiveTab('timeline');
        setPage(1);
      }
    },
    {
      label: 'Event & CTA Clicks',
      value: stats.eventClicksCount,
      icon: MousePointerClick,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400',
      onClick: () => {
        setActivityType('event_click');
        setActiveTab('timeline');
        setPage(1);
      }
    },
    {
      label: 'Interested / Saves',
      value: stats.engagementsCount,
      icon: Heart,
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400',
      onClick: () => {
        setActivityType('engagement_all');
        setActiveTab('timeline');
        setPage(1);
      }
    },
    {
      label: 'Forms & Pass Requests',
      value: stats.formSubmissionsCount,
      icon: FileText,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400',
      onClick: () => {
        setActivityType('forms_all');
        setActiveTab('timeline');
        setPage(1);
      }
    },
    {
      label: 'Tracked Users',
      value: stats.uniqueUsersCount,
      icon: Users,
      color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-400',
      onClick: () => {
        setSelectedUserFilter(null);
        setUsersPage(1);
        setActiveTab('users');
      }
    }
  ];

  const renderActivityTable = ({
    showUserColumn = true,
    emptyTitle = 'No matching user activities found',
    emptySubtitle = 'Live user visits, clicks, searches, and form fills appear here automatically. You can also click Sync Historical Activity to import past pass requests, interests, and registrations.'
  } = {}) => {
    if (loading) {
      return (
        <div className="p-16 text-center text-slate-500 dark:text-slate-400">
          <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-3 text-amber-500" />
          Loading activity monitor feed...
        </div>
      );
    }

    if (activities.length === 0) {
      return (
        <div className="p-16 text-center space-y-3">
          <Activity className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <div className="text-base font-semibold text-slate-800 dark:text-slate-200">{emptyTitle}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">{emptySubtitle}</p>
          {!selectedUserFilter && (
            <button
              type="button"
              onClick={handleSyncHistorical}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              Sync Historical Activity Now
            </button>
          )}
        </div>
      );
    }

    return (
      <>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {showUserColumn && <th className="py-3.5 px-4">User Profile</th>}
                <th className="py-3.5 px-4">Activity Type</th>
                <th className="py-3.5 px-4">Action & Target (Event / Page / Form)</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {activities.map((item) => {
                const typeMeta = ACTIVITY_TYPE_META[item.activityType] || {
                  label: item.activityType,
                  badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                  icon: Activity
                };
                const TypeIcon = typeMeta.icon;
                const roleBadge = ROLE_BADGE_MAP[item.userRole] || ROLE_BADGE_MAP.guest;
                const displayUserName = item.userName || item.userEmail || 'Guest Visitor';
                const userInitial = String(displayUserName).charAt(0).toUpperCase();
                const formFieldEntries =
                  item.formInfo?.fieldsSummary && typeof item.formInfo.fieldsSummary === 'object'
                    ? Object.entries(item.formInfo.fieldsSummary)
                    : [];

                return (
                  <tr
                    key={item._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {showUserColumn && (
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 dark:bg-amber-400 dark:text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
                            {userInitial}
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => handleSelectUserFromActivity(item)}
                              title="Click to view only this user's activity"
                              className="font-semibold text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 text-left truncate max-w-[200px] block cursor-pointer"
                            >
                              {displayUserName}
                            </button>
                            {(item.userEmail || item.userPhone) && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[210px]">
                                {item.userEmail || item.userPhone}
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${roleBadge}`}
                              >
                                {item.userRole || 'guest'}
                              </span>
                              {item.userCompany && (
                                <span className="text-[11px] text-slate-400 truncate max-w-[130px]">
                                  · {item.userCompany}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    )}

                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${typeMeta.badgeClass}`}
                      >
                        <TypeIcon className="w-3.5 h-3.5 shrink-0" />
                        {typeMeta.label}
                      </span>
                      <div className="text-[11px] text-slate-400 mt-1 capitalize">
                        {item.category || 'general'} · {item.source || 'client'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 align-top max-w-[480px]">
                      <div className="font-semibold text-slate-900 dark:text-white break-words">
                        {item.actionLabel}
                      </div>
                      {item.description && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
                          {item.description}
                        </div>
                      )}

                      {item.targetEvent?.title && (
                        <div className="mt-1.5 inline-flex flex-wrap items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/70 dark:bg-amber-900/20 border border-amber-200/70 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200">
                          <Calendar className="w-3 h-3 shrink-0 text-amber-600" />
                          <span className="font-medium">{item.targetEvent.title}</span>
                          {item.targetEvent.city && (
                            <span className="text-[11px] text-amber-700/80 dark:text-amber-300/80 inline-flex items-center gap-0.5">
                              · <MapPin className="w-3 h-3" /> {item.targetEvent.city}
                            </span>
                          )}
                        </div>
                      )}

                      {item.pagePath && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <Monitor className="w-3 h-3 shrink-0 text-slate-400" />
                          <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 truncate max-w-[340px]">
                            {item.pagePath}
                          </code>
                        </div>
                      )}

                      {item.formInfo?.formName && (
                        <div className="mt-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 text-xs space-y-1">
                          <div className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                            <FileText className="w-3 h-3 text-emerald-600" />
                            {item.formInfo.formName}
                            {item.formInfo.status && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                {item.formInfo.status}
                              </span>
                            )}
                          </div>
                          {formFieldEntries.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                              {formFieldEntries.slice(0, 4).map(([k, v]) => (
                                <span
                                  key={k}
                                  className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 truncate max-w-[190px]"
                                >
                                  <span className="font-medium text-slate-400">{k}:</span> {String(v)}
                                </span>
                              ))}
                              {formFieldEntries.length > 4 && (
                                <span className="text-[11px] text-amber-600 font-medium">
                                  +{formFieldEntries.length - 4} more fields
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {formatDateTime(item.createdAt)}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {formatRelativeTime(item.createdAt)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setInspectedActivity(item)}
                          title="Inspect full activity payload"
                          className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLog(item._id)}
                          disabled={deletingId === item._id}
                          title="Delete activity entry"
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 disabled:opacity-40 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(newPage) => setPage(newPage)}
          totalItems={totalItems}
          itemsPerPage={limit}
          onPageSizeChange={(newSize) => {
            setLimit(newSize === 'all' ? Math.max(100, totalItems || 100) : newSize);
            setPage(1);
          }}
          pageSizeOptions={[10, 20, 50, 100]}
          itemLabel="activities"
          alwaysVisible
        />
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-amber-400/20 text-amber-600 dark:text-amber-400">
              <Activity className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Platform Activity Monitor
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">
              <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${autoRefresh ? 'animate-pulse' : ''}`} />
              {autoRefresh ? 'Live Feed' : 'Paused'}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Track which user clicked on events, marked events as interested/followed/saved, requested passes, visited pages, searched, or filled and submitted forms.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setAutoRefresh((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              autoRefresh
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Auto-Refresh (15s): {autoRefresh ? 'ON' : 'OFF'}
          </button>

          <button
            type="button"
            onClick={handleSyncHistorical}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800 disabled:opacity-50 transition cursor-pointer"
          >
            <Database className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Historical Activity'}
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!activities.length}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 disabled:opacity-40 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          <button
            type="button"
            onClick={() => fetchActivities()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusBanner && (
        <div
          className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm ${
            statusBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusBanner.message}</span>
          </div>
          <button type="button" onClick={() => setStatusBanner(null)} className="p-1 hover:opacity-75 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={card.onClick}
              className="text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:border-amber-400/70 transition shadow-xs cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition" />
              </div>
              <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                {Number(card.value || 0).toLocaleString()}
              </div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{card.label}</div>
            </button>
          );
        })}
      </div>

      {/* View Mode Tabs & Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'timeline', label: 'Live Activity Timeline', icon: Activity, count: selectedUserFilter ? stats.totalActivities : totalItems },
              { id: 'users', label: 'User Wise Activity', icon: Users, count: usersTotalItems },
              { id: 'events', label: 'Top Interacted Events', icon: TrendingUp, count: topEvents.length },
              { id: 'pages', label: 'Most Visited Pages', icon: Layers, count: topPages.length }
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    if (tab.id === 'timeline' && selectedUserFilter && activeTab === 'users') {
                      setSelectedUserFilter(null);
                      setPage(1);
                    }
                    setActiveTab(tab.id);
                  }}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      active
                        ? 'bg-white/20 text-white dark:bg-slate-950/20 dark:text-slate-950'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {(appliedSearch || activityType !== 'all' || userRole !== 'all' || dateRange !== 'all' || selectedUserFilter) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Reset All Filters
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search user, email, event title, form, page path..."
              className="w-full pl-9 pr-20 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950 cursor-pointer"
            >
              Search
            </button>
          </div>

          <div className="md:col-span-3">
            <select
              value={activityType}
              onChange={(e) => {
                setActivityType(e.target.value);
                setPage(1);
                setUsersPage(1);
                if (activeTab === 'events' || activeTab === 'pages') {
                  setActiveTab('timeline');
                }
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="all">All Activity Types</option>
              <optgroup label="Events & Engagements">
                <option value="events_all">All Event Interactions</option>
                <option value="event_click">Clicked Event / Action</option>
                <option value="event_view">Viewed Event Page</option>
                <option value="engagement_all">All Saves / Follows / Interests</option>
                <option value="event_interest">Marked Interested</option>
                <option value="event_follow">Followed Event</option>
                <option value="event_bookmark">Bookmarked / Saved Event</option>
              </optgroup>
              <optgroup label="Forms & Pass Requests">
                <option value="forms_all">All Forms & Pass Requests</option>
                <option value="pass_request">Pass Requests</option>
                <option value="form_submit">Form Submissions</option>
                <option value="form_interaction">Form Filling Started</option>
              </optgroup>
              <optgroup label="Navigation & Search">
                <option value="page_visit">Page Visits</option>
                <option value="button_click">Button / Nav Clicks</option>
                <option value="search">Search Queries</option>
                <option value="auth">Signups & Logins</option>
              </optgroup>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={userRole}
              onChange={(e) => {
                setUserRole(e.target.value);
                setPage(1);
                setUsersPage(1);
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="all">All User Roles (incl. Guests)</option>
              <option value="registered">Registered Accounts Only</option>
              <option value="visitor">Visitors</option>
              <option value="organizer">Organizers</option>
              <option value="exhibitor">Exhibitors</option>
              <option value="guest">Guest / Anonymous Visitors</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                setPage(1);
                setUsersPage(1);
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </form>

        {/* Active Selected User Chip */}
        {selectedUserFilter && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
              <UserCheck className="w-3.5 h-3.5" />
              Showing activity only for: {selectedUserFilter.userName || selectedUserFilter.userEmail || 'Selected User'}
              <button
                type="button"
                onClick={() => {
                  setSelectedUserFilter(null);
                  setPage(1);
                }}
                className="hover:text-rose-600 cursor-pointer"
                title="Clear user filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          </div>
        )}
      </div>

      {/* TAB 1: LIVE ACTIVITY TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          {renderActivityTable()}
        </div>
      )}

      {/* TAB 2: USER WISE ACTIVITY */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {selectedUserFilter ? (
            <>
              {/* Selected User Profile Banner */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUserFilter(null);
                      setPage(1);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to All User Profiles
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Showing <strong className="text-slate-900 dark:text-white">{totalItems}</strong> matching activities for this user
                    </span>
                    <button
                      type="button"
                      onClick={handleExportCsv}
                      disabled={!activities.length}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-950 disabled:opacity-40 transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export User CSV
                    </button>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-400 dark:bg-amber-400 dark:text-slate-950 font-bold text-base flex items-center justify-center shrink-0">
                      {String(selectedUserFilter.userName || selectedUserFilter.userEmail || 'U')
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                          {selectedUserFilter.userName || selectedUserFilter.userEmail || 'Guest Session'}
                        </h2>
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase border ${
                            ROLE_BADGE_MAP[selectedUserFilter.userRole] || ROLE_BADGE_MAP.guest
                          }`}
                        >
                          {selectedUserFilter.userRole || 'guest'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {selectedUserFilter.userEmail && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {selectedUserFilter.userEmail}
                          </span>
                        )}
                        {selectedUserFilter.userPhone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {selectedUserFilter.userPhone}
                          </span>
                        )}
                        {selectedUserFilter.userCompany && (
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {selectedUserFilter.userCompany}
                          </span>
                        )}
                        {selectedUserFilter.lastActionAt && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Last active {formatRelativeTime(selectedUserFilter.lastActionAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {typeof selectedUserFilter.totalActions === 'number' && (
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                        Total: {selectedUserFilter.totalActions}
                      </span>
                      <span className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-900/30 font-semibold text-sky-700 dark:text-sky-300">
                        Visits: {selectedUserFilter.pageVisitsCount || 0}
                      </span>
                      <span className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 font-semibold text-amber-800 dark:text-amber-300">
                        Clicks: {selectedUserFilter.eventClicksCount || 0}
                      </span>
                      <span className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-900/30 font-semibold text-rose-700 dark:text-rose-300">
                        Interested: {selectedUserFilter.interestedCount || 0}
                      </span>
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 font-semibold text-emerald-700 dark:text-emerald-300">
                        Forms & Passes: {selectedUserFilter.formsCount || 0}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Selected User's Paginated Activity Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
                {renderActivityTable({
                  showUserColumn: false,
                  emptyTitle: 'No activities recorded for this user with current filters',
                  emptySubtitle: 'Try clearing the activity type, search, or date range filter above to see all actions by this user.'
                })}
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    User Profiles ({usersTotalItems.toLocaleString()})
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Click on any user profile to view only that user&apos;s activity history.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'all', label: 'All Profiles' },
                    { id: 'registered', label: 'Registered Accounts' },
                    { id: 'visitor', label: 'Visitors' },
                    { id: 'organizer', label: 'Organizers' },
                    { id: 'exhibitor', label: 'Exhibitors' },
                    { id: 'guest', label: 'Guests' }
                  ].map((pill) => (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => {
                        setUserRole(pill.id);
                        setUsersPage(1);
                        setPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                        userRole === pill.id
                          ? 'bg-slate-900 text-white border-slate-900 dark:bg-amber-400 dark:text-slate-950 dark:border-amber-400'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="p-14 text-center text-slate-500 dark:text-slate-400">
                  <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-3 text-amber-500" />
                  Loading user profiles...
                </div>
              ) : userSummaries.length === 0 ? (
                <div className="p-12 text-center text-sm text-slate-500">
                  No user profiles match the current filter.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          <th className="py-3.5 px-4">User Profile</th>
                          <th className="py-3.5 px-4">Role</th>
                          <th className="py-3.5 px-4 text-center">Total Actions</th>
                          <th className="py-3.5 px-4 text-center">Page Visits</th>
                          <th className="py-3.5 px-4 text-center">Event Clicks</th>
                          <th className="py-3.5 px-4 text-center">Interested / Saves</th>
                          <th className="py-3.5 px-4 text-center">Forms & Passes</th>
                          <th className="py-3.5 px-4">Latest Activity</th>
                          <th className="py-3.5 px-4 text-right">User Activity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                        {userSummaries.map((u) => {
                          const roleBadge = ROLE_BADGE_MAP[u.userRole] || ROLE_BADGE_MAP.guest;
                          const displayName = u.userName || u.userEmail || 'Guest Session';
                          const initial = String(displayName).charAt(0).toUpperCase();
                          return (
                            <tr
                              key={u.userKey}
                              onClick={() => handleSelectUserFromSummary(u)}
                              className="hover:bg-amber-50/50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                            >
                              <td className="py-3.5 px-4">
                                <div className="flex items-start gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 dark:bg-amber-400 dark:text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
                                    {initial}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 truncate max-w-[210px]">
                                      {displayName}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[220px]">
                                      {u.userEmail || u.userPhone || u.userKey}
                                    </div>
                                    {(u.userCompany || (u.userEmail && u.userPhone)) && (
                                      <div className="text-[11px] text-slate-400 truncate max-w-[220px]">
                                        {[u.userCompany, u.userEmail && u.userPhone ? u.userPhone : '']
                                          .filter(Boolean)
                                          .join(' · ')}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${roleBadge}`}
                                >
                                  {u.userRole || 'guest'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center font-bold text-slate-900 dark:text-white">
                                {u.totalActions}
                              </td>
                              <td className="py-3.5 px-4 text-center text-sky-600 font-semibold">
                                {u.pageVisitsCount}
                              </td>
                              <td className="py-3.5 px-4 text-center text-amber-600 font-semibold">
                                {u.eventClicksCount}
                              </td>
                              <td className="py-3.5 px-4 text-center text-rose-600 font-semibold">
                                {u.interestedCount}
                              </td>
                              <td className="py-3.5 px-4 text-center text-emerald-600 font-semibold">
                                {u.formsCount}
                              </td>
                              <td className="py-3.5 px-4 max-w-[260px]">
                                <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                                  {u.lastActionLabel || 'Activity recorded'}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                                  {formatRelativeTime(u.lastActionAt)} · {u.lastPagePath || '/'}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectUserFromSummary(u);
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-950 cursor-pointer"
                                >
                                  View Activity
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <Pagination
                    currentPage={usersPage}
                    totalPages={usersTotalPages}
                    onPageChange={(newPage) => setUsersPage(newPage)}
                    totalItems={usersTotalItems}
                    itemsPerPage={usersLimit}
                    onPageSizeChange={(newSize) => {
                      setUsersLimit(newSize === 'all' ? Math.max(100, usersTotalItems || 100) : newSize);
                      setUsersPage(1);
                    }}
                    pageSizeOptions={[10, 20, 50, 100]}
                    itemLabel="users"
                    pageSizeLabel="Users per page"
                    alwaysVisible
                  />
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TOP INTERACTED EVENTS */}
      {activeTab === 'events' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          {topEvents.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">
              No event interaction metrics match the current filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-4">Event</th>
                    <th className="py-3.5 px-4 text-center">Total Interactions</th>
                    <th className="py-3.5 px-4 text-center">Clicks & Views</th>
                    <th className="py-3.5 px-4 text-center">Interested</th>
                    <th className="py-3.5 px-4 text-center">Pass Requests</th>
                    <th className="py-3.5 px-4">Last Activity</th>
                    <th className="py-3.5 px-4 text-right">Filter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {topEvents.map((ev) => (
                    <tr key={ev._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{ev.title || ev._id}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          {ev.city && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {ev.city}
                            </span>
                          )}
                          {ev.slug && <code className="text-[11px] text-slate-400">/expo/{ev.slug}</code>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900 dark:text-white">
                        {ev.totalInteractions}
                      </td>
                      <td className="py-3.5 px-4 text-center text-amber-600 font-semibold">{ev.clicksCount}</td>
                      <td className="py-3.5 px-4 text-center text-rose-600 font-semibold">{ev.interestedCount}</td>
                      <td className="py-3.5 px-4 text-center text-emerald-600 font-semibold">{ev.passRequestsCount}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {formatDateTime(ev.latestAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSearchInput(ev.title || ev.slug || '');
                            setAppliedSearch(ev.title || ev.slug || '');
                            setPage(1);
                            setActiveTab('timeline');
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 cursor-pointer"
                        >
                          <Filter className="w-3 h-3" />
                          View Activity
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MOST VISITED PAGES */}
      {activeTab === 'pages' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          {topPages.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">
              No page visit records match the current filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-4">Page Route</th>
                    <th className="py-3.5 px-4">Page Title</th>
                    <th className="py-3.5 px-4 text-center">Total Visits</th>
                    <th className="py-3.5 px-4">Last Visited</th>
                    <th className="py-3.5 px-4 text-right">Filter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {topPages.map((pg) => (
                    <tr key={pg._id || pg.pagePath} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4">
                        <code className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200">
                          {pg.pagePath}
                        </code>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300 max-w-[300px] truncate">
                        {pg.pageTitle || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-sky-600">{pg.visitsCount}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {formatDateTime(pg.lastVisitedAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSearchInput(pg.pagePath || '');
                            setAppliedSearch(pg.pagePath || '');
                            setPage(1);
                            setActiveTab('timeline');
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 cursor-pointer"
                        >
                          <Filter className="w-3 h-3" />
                          Filter Logs
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* INSPECT ACTIVITY MODAL */}
      {inspectedActivity && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setInspectedActivity(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[88vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Activity Log Inspector
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatDateTime(inspectedActivity.createdAt)} · Source: {inspectedActivity.source || 'client'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectedActivity(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-sm">
              {/* User Info */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {inspectedActivity.userName || inspectedActivity.userEmail || 'Guest Visitor'}
                  </div>
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase border ${
                      ROLE_BADGE_MAP[inspectedActivity.userRole] || ROLE_BADGE_MAP.guest
                    }`}
                  >
                    {inspectedActivity.userRole || 'guest'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {inspectedActivity.userEmail || 'Not provided'}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {inspectedActivity.userPhone || 'Not provided'}
                  </div>
                  <div className="flex items-center gap-1.5 sm:col-span-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {inspectedActivity.userCompany || 'No organization linked'}
                  </div>
                </div>
                {(inspectedActivity.user || inspectedActivity.userEmail || inspectedActivity.sessionId || inspectedActivity.userName) && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectUserFromActivity(inspectedActivity);
                      setInspectedActivity(null);
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-400 text-slate-950 hover:bg-amber-300 cursor-pointer"
                  >
                    <Filter className="w-3 h-3" />
                    View Only This User&apos;s Activity
                  </button>
                )}
              </div>

              {/* Action Detail */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Performed Activity
                </div>
                <div className="font-semibold text-slate-900 dark:text-white text-base">
                  {inspectedActivity.actionLabel}
                </div>
                {inspectedActivity.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {inspectedActivity.description}
                  </p>
                )}
              </div>

              {/* Event Detail */}
              {inspectedActivity.targetEvent?.title && (
                <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Target Event
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {inspectedActivity.targetEvent.title}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap gap-3">
                    {inspectedActivity.targetEvent.city && <span>City: {inspectedActivity.targetEvent.city}</span>}
                    {inspectedActivity.targetEvent.category && <span>Category: {inspectedActivity.targetEvent.category}</span>}
                    {inspectedActivity.targetEvent.slug && <span>Slug: /expo/{inspectedActivity.targetEvent.slug}</span>}
                  </div>
                </div>
              )}

              {/* Page & Referrer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-slate-400 uppercase mb-1">Page Path</div>
                  <div className="font-mono text-slate-800 dark:text-slate-200 break-all">
                    {inspectedActivity.pagePath || '/'}
                  </div>
                  {inspectedActivity.pageTitle && (
                    <div className="text-slate-500 mt-1">{inspectedActivity.pageTitle}</div>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-slate-400 uppercase mb-1">Session & Network</div>
                  <div className="text-slate-700 dark:text-slate-300 break-all">
                    Session: <span className="font-mono">{inspectedActivity.sessionId || 'N/A'}</span>
                  </div>
                  <div className="text-slate-500 mt-1">
                    IP: {inspectedActivity.ipAddress || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Form Fields Summary */}
              {inspectedActivity.formInfo?.formName && (
                <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Form Data ({inspectedActivity.formInfo.formName})
                    </span>
                    <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                      {inspectedActivity.formInfo.status || 'submitted'}
                    </span>
                  </div>
                  {inspectedActivity.formInfo.fieldsSummary &&
                  Object.keys(inspectedActivity.formInfo.fieldsSummary).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {Object.entries(inspectedActivity.formInfo.fieldsSummary).map(([k, v]) => (
                        <div
                          key={k}
                          className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200/70 dark:border-emerald-800/60"
                        >
                          <div className="text-[11px] font-semibold text-slate-400">{k}</div>
                          <div className="text-slate-800 dark:text-slate-200 break-words mt-0.5">{String(v)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500">No form fields captured.</div>
                  )}
                </div>
              )}

              {/* Element / Metadata */}
              {(inspectedActivity.elementInfo?.text ||
                inspectedActivity.elementInfo?.href ||
                (inspectedActivity.metadata && Object.keys(inspectedActivity.metadata).length > 0)) && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                  <div className="font-bold uppercase tracking-wider text-slate-400">
                    Technical Details & Metadata
                  </div>
                  {inspectedActivity.elementInfo?.text && (
                    <div>
                      Clicked Element: <code>{inspectedActivity.elementInfo.tag}</code> — &quot;{inspectedActivity.elementInfo.text}&quot;
                    </div>
                  )}
                  {inspectedActivity.elementInfo?.href && (
                    <div className="flex items-center gap-1 break-all">
                      Target Link: <ExternalLink className="w-3 h-3 shrink-0" /> {inspectedActivity.elementInfo.href}
                    </div>
                  )}
                  {inspectedActivity.userAgent && (
                    <div className="text-slate-500 break-all">User-Agent: {inspectedActivity.userAgent}</div>
                  )}
                  {inspectedActivity.metadata && Object.keys(inspectedActivity.metadata).length > 0 && (
                    <pre className="mt-2 p-2.5 rounded-lg bg-slate-900 text-slate-100 text-[11px] overflow-x-auto">
                      {JSON.stringify(inspectedActivity.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
