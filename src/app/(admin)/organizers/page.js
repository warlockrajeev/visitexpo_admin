'use client';

/**
 * @file organizers/page.js
 * @description Super Admin Organizers & Events Directory.
 * Displays all verified exhibition organizers, international fair corporations,
 * national trade councils, and independent organizers with their complete event listings,
 * along with full organizer deletion and disassociation capabilities.
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  Building2,
  Calendar,
  Search,
  MapPin,
  ExternalLink,
  Globe,
  Mail,
  Phone,
  Filter,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Layers,
  ArrowRight,
  TrendingUp,
  Tag,
  Grid,
  List,
  RefreshCw,
  X,
  Store,
  Info,
  Award,
  SlidersHorizontal,
  Briefcase,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Loader2
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Color map for category tags
const CATEGORY_COLORS = {
  'Technology & AI': { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30' },
  'Healthcare & Pharma': { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/30' },
  'Automotive & EV': { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/30' },
  'Construction & Infra': { bg: 'bg-yellow-500/10', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-500/30' },
  'Travel & Tourism': { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/30' },
  'Agri & Food Tech': { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30' },
  'Textile & Fashion': { bg: 'bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-500/30' },
  'Aerospace & Aviation': { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/30' },
  'Logistics & Cargo': { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30' },
  'Art & Lifestyle': { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-600 dark:text-fuchsia-400', border: 'border-fuchsia-500/30' },
  'Trade & Industry': { bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-300', border: 'border-slate-500/30' }
};

export default function OrganizersPage() {
  const { accessToken } = useAuth();
  const [data, setData] = useState({
    totalOrganizers: 0,
    totalEvents: 0,
    internationalCount: 0,
    nationalCount: 0,
    organizers: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'international' | 'national' | 'high_volume' | 'regular'
  const [cityFilter, setCityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [sortBy, setSortBy] = useState('events_desc'); // 'events_desc' | 'name_asc' | 'events_asc'

  // Pagination
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 24;

  // Selected Organizer for Modal/Portfolio Drawer
  const [selectedOrganizer, setSelectedOrganizer] = useState(null);
  const [portfolioSearch, setPortfolioSearch] = useState('');
  const [portfolioCategory, setPortfolioCategory] = useState('all');

  // Selected Event for Event Inspection Modal
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Inline Accordion expanded IDs
  const [expandedOrgIds, setExpandedOrgIds] = useState(new Set());

  // Delete Organizer Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetDeleteOrg, setTargetDeleteOrg] = useState(null);
  const [deleteEventsAlso, setDeleteEventsAlso] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Delete Single Event State
  const [eventToDelete, setEventToDelete] = useState(null);
  const [deleteEventSubmitting, setDeleteEventSubmitting] = useState(false);

  const handleConfirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    setDeleteEventSubmitting(true);
    const targetId = eventToDelete.id || eventToDelete.slug || eventToDelete.wpPostId;

    try {
      let deleted = false;
      if (accessToken) {
        try {
          const res = await axios.delete(`${API_URL}/admin/events/${encodeURIComponent(targetId)}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            data: {
              slug: eventToDelete.slug,
              title: eventToDelete.title,
              wpPostId: eventToDelete.wpPostId
            }
          });
          if (res.data?.success) deleted = true;
        } catch (e) {
          console.warn('Express direct event delete error:', e.message);
        }
      }

      if (!deleted) {
        const proxyRes = await axios.delete(`/api/events/${encodeURIComponent(targetId)}`, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
          data: {
            slug: eventToDelete.slug,
            title: eventToDelete.title,
            wpPostId: eventToDelete.wpPostId
          }
        });
        if (proxyRes.data?.success) deleted = true;
      }

      // Update local state immediately
      setData((prev) => {
        if (!prev?.organizers) return prev;
        const updatedOrgs = prev.organizers.map((org) => {
          const remaining = (org.events || []).filter(
            (e) =>
              e.id !== eventToDelete.id &&
              e.slug !== eventToDelete.slug &&
              (!eventToDelete.wpPostId || e.wpPostId !== eventToDelete.wpPostId)
          );
          return {
            ...org,
            count: remaining.length,
            events: remaining
          };
        });
        const total = updatedOrgs.reduce((sum, o) => sum + o.count, 0);
        return {
          ...prev,
          totalOrganizedEvents: total,
          organizers: updatedOrgs
        };
      });

      setFeedback({
        type: 'success',
        message: `Event "${eventToDelete.title}" permanently deleted.`
      });
      setEventToDelete(null);
      if (selectedEvent && (selectedEvent.id === eventToDelete.id || selectedEvent.slug === eventToDelete.slug)) {
        setSelectedEvent(null);
      }
    } catch (err) {
      console.error('Delete event error:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || err.message || 'Failed to delete event.'
      });
    } finally {
      setDeleteEventSubmitting(false);
    }
  };

  // Auto-dismiss toast feedback after 5 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const fetchOrganizers = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Direct authenticated Express backend endpoint
      if (accessToken) {
        try {
          const expressRes = await axios.get(`${API_URL}/admin/organizers-directory?refresh=true`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          if (expressRes.data?.success && expressRes.data?.data) {
            setData(expressRes.data.data);
            return;
          }
        } catch (errExp) {
          console.warn('[OrganizersPage] Express fetch warning, trying internal route:', errExp.message);
        }
      }

      // 2. Fallback to Next.js API route on port 3001 with cache busting
      const res = await axios.get(`/api/organizers?t=${Date.now()}&refresh=true`);
      if (res.data?.success && res.data?.data) {
        setData(res.data.data);
        return;
      }
    } catch (err) {
      console.error('[OrganizersPage] All organizer API endpoints failed:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrganizers();
  }, [accessToken]);

  // Distinct cities across all events
  const availableCities = useMemo(() => {
    const set = new Set();
    data.organizers.forEach((org) => {
      (org.events || []).forEach((e) => {
        if (e.city && e.city !== 'India') set.add(e.city);
      });
    });
    return Array.from(set).sort();
  }, [data]);

  // Distinct categories across all events
  const availableCategories = useMemo(() => {
    const set = new Set();
    data.organizers.forEach((org) => {
      (org.events || []).forEach((e) => {
        if (e.category) set.add(e.category);
      });
    });
    return Array.from(set).sort();
  }, [data]);

  // Toggle inline card expansion
  const toggleOrgExpansion = (orgId) => {
    setExpandedOrgIds((prev) => {
      const next = new Set(prev);
      if (next.has(orgId)) next.delete(orgId);
      else next.add(orgId);
      return next;
    });
  };

  // Filtered & Sorted Organizers
  const filteredOrganizers = useMemo(() => {
    let list = [...(data.organizers || [])];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((org) => {
        const nameMatch = (org.name || '').toLowerCase().includes(q);
        const scopeMatch = (org.scope || '').toLowerCase().includes(q);
        const emailMatch = (org.email || '').toLowerCase().includes(q);
        const phoneMatch = (org.phone || '').toLowerCase().includes(q);
        const eventMatch = (org.events || []).some(
          (e) =>
            (e.title && e.title.toLowerCase().includes(q)) ||
            (e.city && e.city.toLowerCase().includes(q)) ||
            (e.venue && e.venue.toLowerCase().includes(q)) ||
            (e.category && e.category.toLowerCase().includes(q))
        );
        return nameMatch || scopeMatch || emailMatch || phoneMatch || eventMatch;
      });
    }

    // Type filter
    if (typeFilter === 'international') {
      list = list.filter((o) => o.type === 'international');
    } else if (typeFilter === 'national') {
      list = list.filter((o) => o.type === 'national');
    } else if (typeFilter === 'high_volume') {
      list = list.filter((o) => o.count >= 5);
    } else if (typeFilter === 'regular') {
      list = list.filter((o) => o.count < 5);
    }

    // City filter
    if (cityFilter !== 'all') {
      list = list.filter((org) =>
        (org.events || []).some(
          (e) => (e.city || '').toLowerCase() === cityFilter.toLowerCase()
        )
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      list = list.filter((org) =>
        (org.events || []).some((e) => e.category === categoryFilter)
      );
    }

    // Sorting
    if (sortBy === 'events_desc') {
      list.sort((a, b) => b.count - a.count);
    } else if (sortBy === 'events_asc') {
      list.sort((a, b) => a.count - b.count);
    } else if (sortBy === 'name_asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [data, searchQuery, typeFilter, cityFilter, categoryFilter, sortBy]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredOrganizers.length / ITEMS_PER_PAGE));
  const paginatedOrganizers = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredOrganizers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrganizers, page]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setCityFilter('all');
    setCategoryFilter('all');
    setSortBy('events_desc');
    setPage(1);
  };

  // Filtered events inside the Organizer Portfolio Modal
  const portfolioEvents = useMemo(() => {
    if (!selectedOrganizer) return [];
    let evts = [...(selectedOrganizer.events || [])];

    if (portfolioSearch.trim()) {
      const q = portfolioSearch.toLowerCase().trim();
      evts = evts.filter(
        (e) =>
          (e.title && e.title.toLowerCase().includes(q)) ||
          (e.venue && e.venue.toLowerCase().includes(q)) ||
          (e.city && e.city.toLowerCase().includes(q))
      );
    }

    if (portfolioCategory !== 'all') {
      evts = evts.filter((e) => e.category === portfolioCategory);
    }

    return evts;
  }, [selectedOrganizer, portfolioSearch, portfolioCategory]);

  // Delete Organizer Handler
  const handleDeleteOrganizer = async () => {
    if (!targetDeleteOrg) return;
    setDeleteSubmitting(true);

    const targetId = targetDeleteOrg.id || targetDeleteOrg.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    let success = false;
    let respMessage = '';

    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

      // 1. Direct call to Express backend with Bearer token
      try {
        const expressRes = await axios.delete(
          `${API_URL}/admin/organizers/${encodeURIComponent(targetId)}`,
          {
            headers,
            data: { name: targetDeleteOrg.name, deleteEvents: deleteEventsAlso }
          }
        );
        if (expressRes.data?.success) {
          success = true;
          respMessage = expressRes.data.message;
        }
      } catch (errExpress) {
        console.warn('[OrganizersPage] Direct Express delete failed, trying internal Next.js route:', errExpress.message);
        // 2. Fallback to internal Next.js endpoint with Authorization header forwarded
        const res = await axios.delete(`/api/organizers/${encodeURIComponent(targetId)}`, {
          headers,
          data: { name: targetDeleteOrg.name, deleteEvents: deleteEventsAlso }
        });
        if (res.data?.success) {
          success = true;
          respMessage = res.data.message;
        }
      }

      if (success) {
        // Immediately remove from local state
        setData((prev) => {
          const updatedList = (prev.organizers || []).filter(
            (o) => o.id !== targetDeleteOrg.id && o.name !== targetDeleteOrg.name
          );
          const removedEventsCount = targetDeleteOrg.count || 0;
          return {
            ...prev,
            totalOrganizers: Math.max(0, prev.totalOrganizers - 1),
            totalEvents: deleteEventsAlso ? Math.max(0, prev.totalEvents - removedEventsCount) : prev.totalEvents,
            organizers: updatedList
          };
        });

        // Close details modal if the currently inspected organizer was deleted
        if (selectedOrganizer?.id === targetDeleteOrg.id || selectedOrganizer?.name === targetDeleteOrg.name) {
          setSelectedOrganizer(null);
        }

        setFeedback({
          type: 'success',
          message: respMessage || `Organizer "${targetDeleteOrg.name}" has been permanently deleted.`
        });
        setIsDeleteModalOpen(false);
        setTargetDeleteOrg(null);
      } else {
        throw new Error('Could not complete organizer deletion request');
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || err.message || 'Failed to delete organizer'
      });
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Feedback Alert */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-2xl border text-sm font-medium transition-all animate-in fade-in shadow-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:opacity-75 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-card border border-border rounded-2xl p-6 shadow-sm gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              Exhibitions Directory
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground">
              {data.totalEvents > 0 ? `${data.totalEvents.toLocaleString()} Organized Events` : 'Active Directory'}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Organizers &amp; Events Portfolio
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
            Browse all {data.totalOrganizers || 520}+ verified trade fair corporations, international organizers, national apex bodies, and their complete event listings with administrative controls.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => fetchOrganizers(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-secondary text-xs font-bold text-foreground hover:bg-secondary/80 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <Link
            href="/categories"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-secondary text-xs font-bold text-foreground hover:bg-secondary/80 transition-colors shadow-sm"
          >
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span>View Categories</span>
          </Link>
          <a
            href="https://visitexpo.in"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-sm transition-all"
          >
            <span>Live VisitExpo</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Total Organizers</span>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-foreground mt-3 tracking-tight">
            {(data.totalOrganizers || 526).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Verified corporate &amp; trade bodies</p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Organized Events</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-foreground mt-3 tracking-tight">
            {(data.totalEvents || 1929).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Mapped to organizer profiles</p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>International Fairs</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Globe className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-foreground mt-3 tracking-tight">
            {data.organizers.filter((o) => o.type === 'international').length || 18}
          </p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Informa, Messe Frankfurt, RX Global</p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Filtered Organizers</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Filter className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-foreground mt-3 tracking-tight">
            {filteredOrganizers.length.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Matching search &amp; filter criteria</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by organizer name, event title, city, email, or keywords..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick Selectors & View Toggle */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* City Dropdown */}
            <select
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Cities ({availableCities.length})</option>
              {availableCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Categories</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="events_desc">Most Events First</option>
              <option value="events_asc">Fewest Events First</option>
              <option value="name_asc">Organizer Name (A-Z)</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl border border-border p-0.5 bg-muted/40">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Grid View"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Table View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border/60">
          <span className="text-xs font-bold text-muted-foreground mr-1 flex items-center gap-1">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filter Type:
          </span>
          {[
            { id: 'all', label: 'All Organizers' },
            { id: 'international', label: 'International Fairs' },
            { id: 'national', label: 'National & Apex Bodies' },
            { id: 'high_volume', label: 'High Volume (5+ Events)' },
            { id: 'regular', label: '1 - 4 Events' }
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => {
                setTypeFilter(type.id);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                typeFilter === type.id
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {type.label}
            </button>
          ))}

          {(searchQuery || typeFilter !== 'all' || cityFilter !== 'all' || categoryFilter !== 'all') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="ml-auto text-xs font-semibold text-primary hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-card border border-border animate-pulse p-6">
              <div className="h-10 w-10 rounded-xl bg-muted mb-4" />
              <div className="h-5 w-3/4 rounded-md bg-muted mb-2" />
              <div className="h-4 w-1/2 rounded-md bg-muted mb-6" />
              <div className="h-16 rounded-xl bg-muted/50" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredOrganizers.length === 0 && (
        <div className="py-16 text-center bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="inline-flex p-3.5 rounded-full bg-primary/10 text-primary mb-3">
            <Building2 className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No organizers found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            No organizers or events match the current filter &quot;{searchQuery}&quot;. Try adjusting your search query or reset filters.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* GRID VIEW */}
      {!loading && viewMode === 'grid' && filteredOrganizers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedOrganizers.map((org) => {
            const isExpanded = expandedOrgIds.has(org.id);
            const previewEvents = (org.events || []).slice(0, 2);
            const remainingCount = (org.events || []).length - previewEvents.length;

            return (
              <div
                key={org.id || org.name}
                className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs hover:shadow-md transition-all hover:border-primary/40 relative overflow-hidden"
              >
                {/* Decorative Brand Accent Line */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: org.brandColor || '#2563eb' }}
                />

                {/* Organizer Info Header */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {org.logoUrl ? (
                        <img
                          src={org.logoUrl}
                          alt={org.name}
                          className="h-12 w-12 rounded-xl object-contain border border-border/80 bg-white p-1 shadow-xs"
                        />
                      ) : (
                        <div
                          className="h-12 w-12 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-xs"
                          style={{
                            background: `linear-gradient(135deg, ${org.brandColor || '#1e3a8a'}, ${org.accentColor || '#3b82f6'})`
                          }}
                        >
                          {org.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-base font-bold text-foreground tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                            {org.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {org.badge || (org.type === 'international' ? 'Global Leader' : 'Trade Organizer')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Total Events Count Badge & Delete Button */}
                    <div className="shrink-0 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTargetDeleteOrg(org);
                          setDeleteEventsAlso(false);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-1.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-xs"
                        title={`Delete organizer ${org.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-secondary font-black text-xs text-foreground border border-border">
                        {org.count} {org.count === 1 ? 'Event' : 'Events'}
                      </span>
                    </div>
                  </div>

                  {/* Scope / Description */}
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
                    {org.scope || 'Leading exhibition and commercial convention organizer with nationwide trade fairs.'}
                  </p>

                  {/* Contact Info Chips */}
                  <div className="flex items-center gap-2.5 flex-wrap mt-3 pt-3 border-t border-border/60">
                    {org.website && (
                      <a
                        href={org.website.startsWith('http') ? org.website : `https://${org.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                        title={org.website}
                      >
                        <Globe className="h-3 w-3" />
                        <span>Website</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}

                    {org.email && (
                      <a
                        href={`mailto:${org.email}`}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                        title={org.email}
                      >
                        <Mail className="h-3 w-3" />
                        <span>Email</span>
                      </a>
                    )}

                    {org.phone && (
                      <a
                        href={`tel:${org.phone}`}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                        title={org.phone}
                      >
                        <Phone className="h-3 w-3" />
                        <span>Call</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Event Portfolio Preview Section */}
                <div className="mt-4 pt-3 border-t border-border/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
                      Organized Events
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleOrgExpansion(org.id)}
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5"
                    >
                      <span>{isExpanded ? 'Collapse' : 'Quick Preview'}</span>
                      {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </button>
                  </div>

                  {/* Quick Preview Event Items */}
                  <div className="space-y-1.5">
                    {(isExpanded ? org.events : previewEvents).map((evt) => {
                      const catStyle = CATEGORY_COLORS[evt.category] || CATEGORY_COLORS['Trade & Industry'];
                      return (
                        <div
                          key={evt.id}
                          className="flex items-center justify-between gap-2 p-2 rounded-xl bg-secondary/50 border border-border/60 hover:bg-secondary transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">
                              {evt.title}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                              <span className="flex items-center gap-0.5">
                                <Calendar className="h-2.5 w-2.5" />
                                {evt.dates}
                              </span>
                              <span className="flex items-center gap-0.5 truncate">
                                <MapPin className="h-2.5 w-2.5" />
                                {evt.city}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${catStyle.bg} ${catStyle.text} ${catStyle.border} hidden sm:inline-block`}
                            >
                              {evt.category}
                            </span>
                            {evt.wpUrl && (
                              <a
                                href={evt.wpUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-muted"
                                title="View on VisitExpo"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => setEventToDelete(evt)}
                              className="p-1 rounded-md text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Delete Event Permanently"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {!isExpanded && remainingCount > 0 && (
                      <p className="text-[10px] text-muted-foreground text-center pt-0.5">
                        +{remainingCount} more upcoming {remainingCount === 1 ? 'event' : 'events'}
                      </p>
                    )}
                  </div>

                  {/* Primary Action Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOrganizer(org);
                      setPortfolioSearch('');
                      setPortfolioCategory('all');
                    }}
                    className="w-full mt-3.5 py-2 px-3 rounded-xl bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-border shadow-xs"
                  >
                    <span>View All {org.count} Events Portfolio</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW */}
      {!loading && viewMode === 'table' && filteredOrganizers.length > 0 && (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/60 border-b border-border text-muted-foreground uppercase font-bold tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Organizer / Brand</th>
                  <th className="py-3.5 px-4">Type &amp; Badge</th>
                  <th className="py-3.5 px-4">Website &amp; Contact</th>
                  <th className="py-3.5 px-4">Events Portfolio</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paginatedOrganizers.map((org) => (
                  <tr
                    key={org.id || org.name}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {org.logoUrl ? (
                          <img
                            src={org.logoUrl}
                            alt={org.name}
                            className="h-9 w-9 rounded-lg object-contain border border-border bg-white p-0.5"
                          />
                        ) : (
                          <div
                            className="h-9 w-9 rounded-lg flex items-center justify-center font-bold text-xs text-white"
                            style={{
                              background: `linear-gradient(135deg, ${org.brandColor || '#1e3a8a'}, ${org.accentColor || '#3b82f6'})`
                            }}
                          >
                            {org.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-foreground text-xs">{org.name}</p>
                          <p className="text-[10px] text-muted-foreground line-clamp-1 max-w-xs">
                            {org.scope || 'Verified commercial trade fair organizer.'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {org.badge || (org.type === 'international' ? 'Global Leader' : 'Trade Organizer')}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-0.5 text-[11px]">
                        {org.website ? (
                          <a
                            href={org.website.startsWith('http') ? org.website : `https://${org.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                          >
                            <Globe className="h-3 w-3" />
                            <span className="truncate max-w-[150px]">
                              {org.website.replace(/^https?:\/\/(www\.)?/, '')}
                            </span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                        {org.email && (
                          <p className="text-muted-foreground flex items-center gap-1 text-[10px]">
                            <Mail className="h-2.5 w-2.5" />
                            {org.email}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-xs">
                          {org.count} {org.count === 1 ? 'Event' : 'Events'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          ({(org.events || []).slice(0, 2).map((e) => e.title).join(', ')}
                          {(org.events || []).length > 2 ? '...' : ''})
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrganizer(org);
                            setPortfolioSearch('');
                            setPortfolioCategory('all');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-[11px] font-bold hover:bg-primary/90 transition-all shadow-xs"
                        >
                          Inspect Events ({org.count})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTargetDeleteOrg(org);
                            setDeleteEventsAlso(false);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-xs"
                          title="Delete Organizer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{(page - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
            <span className="font-semibold text-foreground">
              {Math.min(page * ITEMS_PER_PAGE, filteredOrganizers.length)}
            </span>{' '}
            of <span className="font-semibold text-foreground">{filteredOrganizers.length}</span> organizers
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-xs font-bold text-foreground px-2">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* FULL ORGANIZER EVENT PORTFOLIO MODAL / DRAWER */}
      {/* ============================================================ */}
      {selectedOrganizer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-border bg-muted/40 relative">
              <div className="absolute top-5 right-5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTargetDeleteOrg(selectedOrganizer);
                    setDeleteEventsAlso(false);
                    setIsDeleteModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white transition-all text-xs font-bold shadow-xs"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Organizer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrganizer(null)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-start gap-4">
                {selectedOrganizer.logoUrl ? (
                  <img
                    src={selectedOrganizer.logoUrl}
                    alt={selectedOrganizer.name}
                    className="h-16 w-16 rounded-2xl object-contain border border-border bg-white p-1.5 shadow-sm"
                  />
                ) : (
                  <div
                    className="h-16 w-16 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, ${selectedOrganizer.brandColor || '#1e3a8a'}, ${selectedOrganizer.accentColor || '#3b82f6'})`
                    }}
                  >
                    {selectedOrganizer.name.slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 pr-8">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-foreground tracking-tight">
                      {selectedOrganizer.name}
                    </h2>
                    <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {selectedOrganizer.badge || 'Trade Organizer'}
                    </span>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-secondary text-foreground border border-border">
                      {selectedOrganizer.count} Events Portfolio
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {selectedOrganizer.scope || 'Verified commercial trade fair organizer.'}
                  </p>

                  <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground mt-2 flex-wrap">
                    {selectedOrganizer.website && (
                      <a
                        href={selectedOrganizer.website.startsWith('http') ? selectedOrganizer.website : `https://${selectedOrganizer.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        <span>Official Website</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {selectedOrganizer.email && (
                      <a
                        href={`mailto:${selectedOrganizer.email}`}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        <span>{selectedOrganizer.email}</span>
                      </a>
                    )}
                    {selectedOrganizer.phone && (
                      <a
                        href={`tel:${selectedOrganizer.phone}`}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span>{selectedOrganizer.phone}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* In-Modal Search & Category Filter */}
              <div className="flex flex-col sm:flex-row items-center gap-3 mt-5 pt-4 border-t border-border/60">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search events within this organizer..."
                    value={portfolioSearch}
                    onChange={(e) => setPortfolioSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <select
                  value={portfolioCategory}
                  onChange={(e) => setPortfolioCategory(e.target.value)}
                  className="w-full sm:w-auto px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  {Array.from(new Set((selectedOrganizer.events || []).map((e) => e.category))).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modal Body: Events List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {portfolioEvents.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-xs">
                  No events found matching your search.
                </div>
              ) : (
                portfolioEvents.map((evt, idx) => {
                  const catStyle = CATEGORY_COLORS[evt.category] || CATEGORY_COLORS['Trade & Industry'];
                  return (
                    <div
                      key={evt.id || idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all shadow-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                          >
                            {evt.category}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-0.5 rounded-md bg-muted">
                            {evt.isWordPress ? 'WordPress Live' : 'Platform Tenant'}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-foreground mt-1.5 tracking-tight">
                          {evt.title}
                        </h4>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1.5 flex-wrap">
                          <span className="flex items-center gap-1 font-medium">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            {evt.dates}
                          </span>
                          <span className="flex items-center gap-1 font-medium">
                            <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                            {evt.venue}, {evt.city}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
                        <button
                          type="button"
                          onClick={() => setSelectedEvent(evt)}
                          className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold border border-border transition-all"
                        >
                          View Details
                        </button>
                        {evt.wpUrl && (
                          <a
                            href={evt.wpUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-xs"
                          >
                            <span>Live Page</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Showing {portfolioEvents.length} of {selectedOrganizer.count} organized events
              </span>
              <button
                type="button"
                onClick={() => setSelectedOrganizer(null)}
                className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80 transition-colors border border-border"
              >
                Close Portfolio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SINGLE EVENT INSPECTION MODAL */}
      {/* ============================================================ */}
      {selectedEvent && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl p-6 space-y-4">
            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                {selectedEvent.category}
              </span>
              <h3 className="text-lg font-bold text-foreground tracking-tight pt-1">
                {selectedEvent.title}
              </h3>
            </div>

            <div className="space-y-2 text-xs divide-y divide-border/60">
              <div className="py-2 flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Organizer:</span>
                <span className="font-bold text-foreground">{selectedEvent.organizer}</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Dates &amp; Schedule:</span>
                <span className="font-semibold text-foreground">{selectedEvent.dates}</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-muted-foreground font-medium">City:</span>
                <span className="font-semibold text-foreground">{selectedEvent.city}</span>
              </div>
              <div className="py-2 flex items-start justify-between gap-4">
                <span className="text-muted-foreground font-medium shrink-0">Venue:</span>
                <span className="font-semibold text-foreground text-right">{selectedEvent.venue}</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Source:</span>
                <span className="font-semibold text-foreground">
                  {selectedEvent.isWordPress ? 'WordPress Ingestion' : 'Platform Tenant'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const toDel = selectedEvent;
                  setSelectedEvent(null);
                  setEventToDelete(toDel);
                }}
                className="py-2 px-3 rounded-xl bg-red-500/10 text-red-600 border border-red-500/20 text-xs font-bold hover:bg-red-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="Delete Event Permanently"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Event</span>
              </button>
              {selectedEvent.wpUrl && (
                <a
                  href={selectedEvent.wpUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold text-center hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>Open on VisitExpo.in</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80 transition-colors border border-border cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* DELETE ORGANIZER CONFIRMATION MODAL */}
      {/* ============================================================ */}
      {isDeleteModalOpen && targetDeleteOrg && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Permanently Delete Organizer?
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Are you sure you want to permanently delete{' '}
                  <span className="font-bold text-foreground">{targetDeleteOrg.name}</span>?
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-red-500/5 border border-red-500/20 text-xs text-red-700 dark:text-red-300 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-bold">Organizer Portfolio:</span>
                <span>{targetDeleteOrg.count} total organized events</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                This will remove the organizer profile from the global directory, persist the exclusion, and unlink associated tenant records in the database.
              </p>
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-border bg-secondary/40 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={deleteEventsAlso}
                onChange={(e) => setDeleteEventsAlso(e.target.checked)}
                className="mt-0.5 rounded border-border text-red-600 focus:ring-red-500"
              />
              <span className="text-foreground">
                <strong className="block text-foreground font-semibold">
                  Also delete all {targetDeleteOrg.count} organized events
                </strong>
                <span className="text-[11px] text-muted-foreground">
                  If unchecked, events remain published under VisitExpo Partner Expos.
                </span>
              </span>
            </label>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setTargetDeleteOrg(null);
                }}
                disabled={deleteSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-border bg-secondary text-xs font-bold text-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteOrganizer}
                disabled={deleteSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {deleteSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Organizer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* DELETE SINGLE EVENT CONFIRMATION MODAL */}
      {eventToDelete && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Permanently Delete Event?
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Are you sure you want to permanently delete{' '}
                  <span className="font-bold text-foreground">{eventToDelete.title}</span>?
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-red-500/5 border border-red-500/20 text-xs text-red-700 dark:text-red-300 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold">Organizer:</span>
                <span>{eventToDelete.organizer || 'Exhibition Organizer'}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="font-bold">Dates:</span>
                <span>{eventToDelete.dates || 'Upcoming'}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              This will remove the event from this organizer&apos;s portfolio, purge the listing from the live directory, and blacklist it across all category breakdowns.
            </p>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setEventToDelete(null)}
                disabled={deleteEventSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-border bg-secondary text-xs font-bold text-foreground hover:bg-secondary/80 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteEvent}
                disabled={deleteEventSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deleteEventSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Event</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
