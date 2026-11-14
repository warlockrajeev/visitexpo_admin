'use client';

/**
 * @file reports/page.js
 * @description Super Admin Expo Reports & Multi-Format Data Export Center.
 * Enables administrators to select any individual expo, multiple expos, or all expos
 * across the platform, inspect their complete datasets, and download reports in
 * CSV (.csv), Microsoft Excel (.xlsx), or Printable A4 PDF (.pdf) format.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import Pagination from '../../../components/Pagination.js';
import {
  exportExpoReportsToExcel,
  exportExpoReportsToCSV,
  exportExpoReportsToPDF
} from '../../../utils/exportExpoReport.js';
import {
  showSweetSuccess,
  showSweetError,
  showSweetWarning
} from '../../../utils/sweetalert.js';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Printer,
  Search,
  RefreshCw,
  RotateCcw,
  Calendar,
  MapPin,
  Building2,
  Users,
  UserCheck,
  Target,
  Award,
  Ticket,
  Send,
  CheckSquare,
  Square,
  Eye,
  X,
  Loader2,
  CheckCircle2,
  Filter,
  ChevronDown,
  ExternalLink,
  Mail,
  Phone,
  Globe,
  Layers
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const REPORTS_EVALUATION_TIME = Date.now();

const MODULE_OPTIONS = [
  { key: 'visitors', label: 'Visitors & Passes', icon: UserCheck },
  { key: 'attendees', label: 'Interested & Followers', icon: Users },
  { key: 'leads', label: 'CRM Buyer Leads', icon: Target },
  { key: 'exhibitors', label: 'Exhibitors & Booths', icon: Building2 },
  { key: 'sponsors', label: 'Sponsors & Partners', icon: Award },
  { key: 'orders', label: 'Ticket Orders & Revenue', icon: Ticket },
  { key: 'campaigns', label: 'Marketing Campaigns', icon: Send }
];

function getEventEndDate(value) {
  if (!value) return null;
  const dateOnlyMatch =
    typeof value === 'string'
      ? value.match(/^(\d{4}-\d{2}-\d{2})(?:T00:00:00(?:\.000)?Z)?$/)
      : null;
  const parsed = dateOnlyMatch ? new Date(`${dateOnlyMatch[1]}T00:00:00`) : new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  if (parsed.getHours() === 0 && parsed.getMinutes() === 0) {
    parsed.setHours(23, 59, 59, 999);
  }
  return parsed;
}

export default function AdminExpoReportsPage() {
  const { accessToken, loading: authLoading } = useAuth();

  // Master data state
  const [expos, setExpos] = useState([]);
  const [summary, setSummary] = useState({
    totalExpos: 0,
    publishedExpos: 0,
    draftExpos: 0,
    claimedExpos: 0,
    wpSyncedExpos: 0,
    totalVisitors: 0,
    totalCheckedIn: 0,
    totalAttendees: 0,
    totalLeads: 0,
    totalExhibitors: 0,
    totalSponsors: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Export loading states
  const [exportingKey, setExportingKey] = useState(''); // e.g., 'bulk-xlsx', 'single-csv-<id>'

  // Quick Single-Expo Selector state
  const [quickSelectedExpoId, setQuickSelectedExpoId] = useState('');
  const [quickDropdownOpen, setQuickDropdownOpen] = useState(false);
  const [quickSearchText, setQuickSearchText] = useState('');

  // Multi-select checkboxes state
  const [selectedExpoIds, setSelectedExpoIds] = useState([]);

  // Included Data Modules state
  const [includedModules, setIncludedModules] = useState({
    visitors: true,
    attendees: true,
    leads: true,
    exhibitors: true,
    sponsors: true,
    orders: true,
    campaigns: true
  });

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'published' | 'draft' | 'claimed' | 'with_data'
  const [sortBy, setSortBy] = useState('records_desc'); // 'records_desc' | 'visitors_desc' | 'leads_desc' | 'date_asc' | 'title_asc'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Inspector Modal State
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectedReport, setInspectedReport] = useState(null);
  const [inspectTab, setInspectTab] = useState('overview');

  // Fetch all expos & summary metrics
  const fetchExpoReports = useCallback(async (isSilent = false) => {
    if (!accessToken) return;
    if (!isSilent && expos.length === 0) setLoading(true);
    setRefreshing(true);

    try {
      const res = await axios.get(`${API_URL}/admin/expo-reports`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data?.success && res.data?.data) {
        const list = res.data.data.expos || [];
        const sum = res.data.data.summary || {};
        setExpos(list);
        setSummary(prev => ({ ...prev, ...sum }));
        try {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(
              'visitexpo_admin_expo_reports_cache',
              JSON.stringify({ expos: list, summary: sum })
            );
          }
        } catch {}
      }
    } catch (err) {
      console.warn('Failed to load expo reports:', err?.message || err);
      if (!isSilent) {
        showSweetError(err.response?.data?.error || 'Failed to load expo reports from server.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, expos.length]);

  useEffect(() => {
    let hasCachedReports = false;
    try {
      if (typeof window !== 'undefined') {
        const cached = sessionStorage.getItem('visitexpo_admin_expo_reports_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed?.expos) && parsed.expos.length > 0) {
            setExpos(parsed.expos);
            if (parsed.summary) setSummary(prev => ({ ...prev, ...parsed.summary }));
            setLoading(false);
            hasCachedReports = true;
          }
        }
      }
    } catch {}

    if (authLoading) return;
    if (!accessToken) {
      setLoading(false);
      return;
    }

    fetchExpoReports(hasCachedReports);
  }, [accessToken, authLoading]);

  // Distinct categories & cities for filter dropdowns
  const availableCategories = useMemo(() => {
    const set = new Set();
    expos.forEach(e => {
      if (e.category) set.add(e.category);
      if (Array.isArray(e.categories)) e.categories.forEach(c => c && set.add(c));
    });
    return Array.from(set).sort();
  }, [expos]);

  const availableCities = useMemo(() => {
    const set = new Set();
    expos.forEach(e => {
      if (e.city && e.city.trim()) set.add(e.city.trim());
    });
    return Array.from(set).sort();
  }, [expos]);

  const concludedExpos = useMemo(() => {
    return expos.filter(event => {
      const eventStatus = String(event.status || '').toLowerCase();
      if (['completed', 'ended', 'archived', 'expired'].includes(eventStatus)) return true;

      const endDate = getEventEndDate(event.endDate || event.startDate);
      return endDate ? endDate.getTime() < REPORTS_EVALUATION_TIME : false;
    });
  }, [expos]);

  // Filtered & sorted expos
  const filteredExpos = useMemo(() => {
    const list = expos.filter(ev => {
      if (statusFilter === 'published' && ev.status !== 'published') return false;
      if (statusFilter === 'draft' && ev.status !== 'draft') return false;
      if (statusFilter === 'claimed' && !ev.isClaimed) return false;
      if (statusFilter === 'with_data' && (ev.metrics?.totalRecords || 0) === 0) return false;

      if (categoryFilter !== 'all') {
        const cats = Array.isArray(ev.categories) ? ev.categories : [ev.category];
        if (!cats.some(c => c && c.toLowerCase() === categoryFilter.toLowerCase())) return false;
      }

      if (cityFilter !== 'all') {
        if ((ev.city || '').toLowerCase() !== cityFilter.toLowerCase()) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (ev.title || '').toLowerCase().includes(q);
        const matchCity = (ev.city || '').toLowerCase().includes(q);
        const matchVenue = (ev.venue || '').toLowerCase().includes(q);
        const matchOrg = (ev.orgName || '').toLowerCase().includes(q);
        const matchSlug = (ev.slug || '').toLowerCase().includes(q);
        if (!matchTitle && !matchCity && !matchVenue && !matchOrg && !matchSlug) return false;
      }

      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === 'records_desc') {
        return (b.metrics?.totalRecords || 0) - (a.metrics?.totalRecords || 0);
      }
      if (sortBy === 'visitors_desc') {
        return (b.metrics?.visitorsCount || 0) - (a.metrics?.visitorsCount || 0);
      }
      if (sortBy === 'leads_desc') {
        return (b.metrics?.leadsCount || 0) - (a.metrics?.leadsCount || 0);
      }
      if (sortBy === 'title_asc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'date_asc') {
        const da = a.startDate ? new Date(a.startDate).getTime() : Number.MAX_SAFE_INTEGER;
        const db = b.startDate ? new Date(b.startDate).getTime() : Number.MAX_SAFE_INTEGER;
        return da - db;
      }
      return 0;
    });
  }, [expos, statusFilter, categoryFilter, cityFilter, searchQuery, sortBy]);

  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery.trim() !== '' ||
      categoryFilter !== 'all' ||
      cityFilter !== 'all' ||
      statusFilter !== 'all' ||
      sortBy !== 'records_desc'
    );
  }, [searchQuery, categoryFilter, cityFilter, statusFilter, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setCityFilter('all');
    setStatusFilter('all');
    setSortBy('records_desc');
    setCurrentPage(1);
  };

  // Pagination
  const totalPages = Math.ceil(filteredExpos.length / itemsPerPage) || 1;
  const paginatedExpos = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredExpos.slice(start, start + itemsPerPage);
  }, [filteredExpos, currentPage]);

  // Quick selector options
  const quickFilteredExpos = useMemo(() => {
    if (!quickSearchText.trim()) return expos.slice(0, 80);
    const q = quickSearchText.toLowerCase().trim();
    return expos
      .filter(
        e =>
          (e.title || '').toLowerCase().includes(q) ||
          (e.city || '').toLowerCase().includes(q) ||
          (e.orgName || '').toLowerCase().includes(q)
      )
      .slice(0, 80);
  }, [expos, quickSearchText]);

  const selectedQuickExpo = useMemo(() => {
    if (!quickSelectedExpoId) return null;
    return expos.find(e => String(e._id) === String(quickSelectedExpoId)) || null;
  }, [expos, quickSelectedExpoId]);

  // Selection helpers
  const isAllPageSelected = useMemo(() => {
    if (paginatedExpos.length === 0) return false;
    return paginatedExpos.every(e => selectedExpoIds.includes(String(e._id)));
  }, [paginatedExpos, selectedExpoIds]);

  const isAllFilteredSelected = useMemo(() => {
    if (filteredExpos.length === 0) return false;
    return filteredExpos.every(e => selectedExpoIds.includes(String(e._id)));
  }, [filteredExpos, selectedExpoIds]);

  const toggleSelectExpo = (id) => {
    const strId = String(id);
    setSelectedExpoIds(prev =>
      prev.includes(strId) ? prev.filter(item => item !== strId) : [...prev, strId]
    );
  };

  const toggleSelectPage = () => {
    const pageIds = paginatedExpos.map(e => String(e._id));
    if (isAllPageSelected) {
      setSelectedExpoIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedExpoIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      setSelectedExpoIds([]);
    } else {
      setSelectedExpoIds(filteredExpos.map(e => String(e._id)));
    }
  };

  const toggleModule = (key) => {
    setIncludedModules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Core Export Handler (uses in-memory master list + compact granular payload for fast 2,660+ expo exports)
  const handleDownloadReport = async ({ targetIds = [], exportAll = false, format = 'xlsx', actionKey = 'export' }) => {
    if (!accessToken) return;
    if (!exportAll && (!Array.isArray(targetIds) || targetIds.length === 0)) {
      showSweetWarning('Please select at least one expo to download its report.');
      return;
    }

    setExportingKey(actionKey);
    try {
      let reportsData = [];

      if (targetIds.length === 1 && !exportAll) {
        const res = await axios.get(`${API_URL}/admin/expo-reports/${targetIds[0]}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.data?.success && res.data?.data) {
          reportsData = [res.data.data];
        }
      } else {
        // Resolve target expos from already-loaded in-memory expos list
        const targetSet = new Set((targetIds || []).map(String));
        const selectedExposList =
          exportAll && targetSet.size === 0
            ? expos
            : expos.filter(e => targetSet.has(String(e._id)));

        const wantsGranular = Object.values(includedModules).some(Boolean);
        // Only expos with actual granular records or sponsors need detailed sub-arrays
        const activeIds = selectedExposList
          .filter(e => {
            const m = e.metrics || {};
            return (m.totalRecords || 0) > 0 || (m.sponsorsCount || 0) > 0;
          })
          .map(e => String(e._id));

        let granularMap = {};
        if (wantsGranular && activeIds.length > 0) {
          const isFullActiveSet = exportAll || selectedExposList.length === expos.length;
          const res = await axios.post(
            `${API_URL}/admin/expo-reports/export-data`,
            {
              eventIds: isFullActiveSet && activeIds.length > 300 ? [] : activeIds,
              exportAll: isFullActiveSet && activeIds.length > 300,
              granularOnly: true
            },
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (res.data?.success && res.data?.data && typeof res.data.data === 'object') {
            granularMap = res.data.data;
          }
        }

        reportsData = selectedExposList.map(e => {
          const g = granularMap[String(e._id)] || {};
          return {
            expo: e,
            metrics: e.metrics || {},
            visitors: g.visitors || [],
            attendees: g.attendees || [],
            leads: g.leads || [],
            exhibitors: g.exhibitors || [],
            sponsors: g.sponsors || [],
            orders: g.orders || [],
            tickets: g.tickets || [],
            campaigns: g.campaigns || [],
            reviews: g.reviews || []
          };
        });
      }

      if (!reportsData || reportsData.length === 0) {
        showSweetWarning('No expo report data found for the selected criteria.');
        return;
      }

      // Yield briefly so the UI loading spinner renders smoothly before workbook generation
      await new Promise(resolve => setTimeout(resolve, 25));

      if (format === 'xlsx') {
        exportExpoReportsToExcel(reportsData, includedModules);
        showSweetSuccess(
          reportsData.length === 1
            ? `Downloaded Excel (.xlsx) report for "${reportsData[0]?.expo?.title}".`
            : `Downloaded Excel (.xlsx) workbook for ${reportsData.length} expos.`
        );
      } else if (format === 'csv') {
        exportExpoReportsToCSV(reportsData, includedModules);
        showSweetSuccess(
          reportsData.length === 1
            ? `Downloaded CSV (.csv) report for "${reportsData[0]?.expo?.title}".`
            : `Downloaded CSV (.csv) report for ${reportsData.length} expos.`
        );
      } else if (format === 'pdf') {
        exportExpoReportsToPDF(reportsData, includedModules);
      }
    } catch (err) {
      console.warn('Report export failed:', err?.message || err);
      showSweetError(err.response?.data?.error || 'Failed to generate and download the expo report.');
    } finally {
      setExportingKey('');
    }
  };

  const handleDownloadExhibitorsList = async (format) => {
    if (!accessToken) return;

    const actionKey = `exhibitors-list-${format}`;
    setExportingKey(actionKey);
    try {
      const res = await axios.post(
        `${API_URL}/admin/expo-reports/export-data`,
        { exportAll: true, granularOnly: true },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.data?.success || !res.data?.data || typeof res.data.data !== 'object') {
        throw new Error(res.data?.error || 'Could not load exhibitor records.');
      }

      const reportsData = Object.entries(res.data.data)
        .map(([eventId, details]) => {
          const expo = expos.find(event => String(event._id) === String(eventId));
          if (!expo) return null;
          return { expo, exhibitors: Array.isArray(details?.exhibitors) ? details.exhibitors : [] };
        })
        .filter(report => report && report.exhibitors.length > 0);
      const exhibitorCount = reportsData.reduce((count, report) => count + report.exhibitors.length, 0);

      if (exhibitorCount === 0) {
        showSweetWarning('No exhibitor records found to download.');
        return;
      }

      const dateStamp = new Date().toISOString().slice(0, 10);
      const fileName = `VisitExpo_Exhibitors_List_${dateStamp}.${format}`;
      const modules = {
        visitors: false,
        attendees: false,
        leads: false,
        exhibitors: true,
        sponsors: false,
        orders: false,
        campaigns: false
      };

      if (format === 'csv') {
        exportExpoReportsToCSV(reportsData, modules, fileName);
      } else {
        exportExpoReportsToExcel(reportsData, modules, fileName);
      }
      showSweetSuccess(`Downloaded exhibitor list with ${exhibitorCount} records.`);
    } catch (err) {
      console.warn('Exhibitor list export failed:', err?.message || err);
      showSweetError(err.response?.data?.error || err.message || 'Failed to download the exhibitor list.');
    } finally {
      setExportingKey('');
    }
  };

  // Open Single-Expo Data Inspector Modal
  const handleInspectExpo = async (expoId) => {
    if (!accessToken || !expoId) return;
    setInspectModalOpen(true);
    setInspectLoading(true);
    setInspectTab('overview');
    setInspectedReport(null);

    try {
      const res = await axios.get(`${API_URL}/admin/expo-reports/${expoId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data?.success && res.data?.data) {
        setInspectedReport(res.data.data);
      } else {
        throw new Error('Could not load expo report details.');
      }
    } catch (err) {
      console.warn('Failed to inspect expo:', err?.message || err);
      showSweetError(err.response?.data?.error || 'Could not load detailed data for this expo.');
      setInspectModalOpen(false);
    } finally {
      setInspectLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Upcoming';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return String(dateStr);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Executive Header */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-primary mb-2">
              <span>Exhibition Intelligence &amp; Data Export Center</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Expo Reports &amp; Data Downloads
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-3xl">
              Select any individual exhibition, multiple expos, or the entire platform catalog to inspect and download complete datasets (Visitors, Interested Attendees, CRM Buyer Leads, Exhibitors, Sponsors, Ticket Orders &amp; Campaigns) in <span className="font-bold text-foreground">CSV</span>, <span className="font-bold text-foreground">Excel (.xlsx)</span>, or <span className="font-bold text-foreground">A4 PDF</span> format.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => fetchExpoReports(false)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/60 hover:bg-secondary px-3.5 py-2.5 text-xs font-bold text-foreground transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-primary' : ''}`} />
              <span>Refresh Data</span>
            </button>

            <button
              type="button"
              disabled={!!exportingKey || filteredExpos.length === 0}
              onClick={() =>
                handleDownloadReport({
                  targetIds: filteredExpos.map(e => String(e._id)),
                  exportAll: !hasActiveFilters,
                  format: 'csv',
                  actionKey: 'all-csv'
                })
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3.5 py-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 transition-colors disabled:opacity-50"
            >
              {exportingKey === 'all-csv' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              <span>Export All CSV ({filteredExpos.length})</span>
            </button>

            <button
              type="button"
              disabled={!!exportingKey || filteredExpos.length === 0}
              onClick={() =>
                handleDownloadReport({
                  targetIds: filteredExpos.map(e => String(e._id)),
                  exportAll: !hasActiveFilters,
                  format: 'xlsx',
                  actionKey: 'all-xlsx'
                })
              }
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 px-4 py-2.5 text-xs font-extrabold text-primary-foreground shadow-sm shadow-primary/20 transition-all disabled:opacity-50"
            >
              {exportingKey === 'all-xlsx' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              <span>Export All Excel ({filteredExpos.length})</span>
            </button>

            <button
              type="button"
              disabled={!!exportingKey || filteredExpos.length === 0}
              onClick={() =>
                handleDownloadReport({
                  targetIds: filteredExpos.map(e => String(e._id)),
                  exportAll: !hasActiveFilters,
                  format: 'pdf',
                  actionKey: 'all-pdf'
                })
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-3.5 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 transition-colors disabled:opacity-50"
            >
              {exportingKey === 'all-pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
              <span>Export All PDF</span>
            </button>
          </div>
        </div>

        {/* Quick Single-Expo Spotlight Selector Bar */}
        <div className="mt-5 pt-5 border-t border-border">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1 max-w-2xl relative">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5">
                Quick Select Specific Expo for Instant Download
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setQuickDropdownOpen(prev => !prev)}
                  className="w-full flex items-center justify-between gap-2 rounded-xl border border-border bg-background px-3.5 py-2.5 text-left text-xs font-semibold text-foreground hover:border-primary/50 transition-colors"
                >
                  <span className="truncate">
                    {selectedQuickExpo
                      ? `${selectedQuickExpo.title} — ${selectedQuickExpo.city || 'India'} (${formatDate(selectedQuickExpo.startDate)})`
                      : `Choose any expo from ${expos.length} platform exhibitions...`}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>

                {quickDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
                    <div className="p-2.5 border-b border-border flex items-center gap-2 bg-muted/30">
                      <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                      <input
                        type="text"
                        value={quickSearchText}
                        onChange={(e) => setQuickSearchText(e.target.value)}
                        placeholder="Type expo name, city, or organizer..."
                        className="w-full bg-transparent text-xs text-foreground focus:outline-none"
                        autoFocus
                      />
                      {quickSearchText && (
                        <button
                          type="button"
                          onClick={() => setQuickSearchText('')}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-border/50">
                      {quickFilteredExpos.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground">
                          No matching expos found.
                        </div>
                      ) : (
                        quickFilteredExpos.map(ev => (
                          <button
                            key={ev._id}
                            type="button"
                            onClick={() => {
                              setQuickSelectedExpoId(String(ev._id));
                              setQuickDropdownOpen(false);
                            }}
                            className={`w-full px-3.5 py-2.5 text-left text-xs hover:bg-secondary/70 transition-colors flex items-center justify-between gap-3 ${
                              String(quickSelectedExpoId) === String(ev._id) ? 'bg-primary/10 font-bold' : ''
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="font-bold text-foreground truncate">{ev.title}</p>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {ev.city || 'India'} • {ev.venue || 'Exhibition Venue'} • {formatDate(ev.startDate)}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-foreground">
                              {ev.metrics?.totalRecords || 0} records
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!quickSelectedExpoId || !!exportingKey}
                onClick={() => handleInspectExpo(quickSelectedExpoId)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary hover:bg-secondary/80 px-3.5 py-2.5 text-xs font-bold text-foreground transition-colors disabled:opacity-40"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Inspect Data</span>
              </button>

              <button
                type="button"
                disabled={!quickSelectedExpoId || !!exportingKey}
                onClick={() =>
                  handleDownloadReport({
                    targetIds: [quickSelectedExpoId],
                    format: 'csv',
                    actionKey: `quick-csv-${quickSelectedExpoId}`
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3.5 py-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 transition-colors disabled:opacity-40"
              >
                {exportingKey === `quick-csv-${quickSelectedExpoId}` ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                <span>Download CSV</span>
              </button>

              <button
                type="button"
                disabled={!quickSelectedExpoId || !!exportingKey}
                onClick={() =>
                  handleDownloadReport({
                    targetIds: [quickSelectedExpoId],
                    format: 'xlsx',
                    actionKey: `quick-xlsx-${quickSelectedExpoId}`
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-2.5 text-xs font-bold text-amber-600 dark:text-amber-400 transition-colors disabled:opacity-40"
              >
                {exportingKey === `quick-xlsx-${quickSelectedExpoId}` ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                )}
                <span>Download Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                disabled={!quickSelectedExpoId || !!exportingKey}
                onClick={() =>
                  handleDownloadReport({
                    targetIds: [quickSelectedExpoId],
                    format: 'pdf',
                    actionKey: `quick-pdf-${quickSelectedExpoId}`
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-3.5 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 transition-colors disabled:opacity-40"
              >
                {exportingKey === `quick-pdf-${quickSelectedExpoId}` ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileText className="h-3.5 w-3.5" />
                )}
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Platform-Wide KPI Summary Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-muted-foreground">Total Expos</span>
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-foreground">{summary.totalExpos}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {summary.publishedExpos} Published • {summary.claimedExpos} Claimed
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-muted-foreground">Visitors</span>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-foreground">{summary.totalVisitors}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {summary.totalCheckedIn} Checked-In Passes
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-muted-foreground">Attendees &amp; Followers</span>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-foreground">{summary.totalAttendees}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Interested &amp; Following</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-muted-foreground">CRM Buyer Leads</span>
            <Target className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-foreground">{summary.totalLeads}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Captured Expo Inquiries</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-muted-foreground">Exhibitors &amp; Sponsors</span>
            <Building2 className="h-4 w-4 text-purple-500" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-foreground">{summary.totalExhibitors}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{summary.totalSponsors} Official Sponsors</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-muted-foreground">Ticket Revenue</span>
            <Ticket className="h-4 w-4 text-rose-500" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-foreground">
            ₹{(summary.totalRevenue || 0).toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">{summary.totalOrders} Ticket Orders</p>
        </div>
      </div>

      {/* Focused downloads for concluded events and the platform exhibitor directory */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
            <Download className="h-4 w-4 text-primary" />
            Special Reports &amp; Downloads
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Download reports for concluded events or a consolidated list of exhibitors across all events.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-xs font-extrabold text-foreground">
                  <Calendar className="h-4 w-4 text-amber-500" />
                  Expired / Concluded Events
                </h3>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {concludedExpos.length} event{concludedExpos.length === 1 ? '' : 's'} with an elapsed end date or concluded status.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  disabled={!!exportingKey || concludedExpos.length === 0}
                  onClick={() =>
                    handleDownloadReport({
                      targetIds: concludedExpos.map(event => String(event._id)),
                      format: 'csv',
                      actionKey: 'concluded-events-csv'
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] font-bold text-emerald-600 transition-colors hover:bg-emerald-500/20 disabled:opacity-40 dark:text-emerald-400"
                >
                  {exportingKey === 'concluded-events-csv' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  CSV
                </button>
                <button
                  type="button"
                  disabled={!!exportingKey || concludedExpos.length === 0}
                  onClick={() =>
                    handleDownloadReport({
                      targetIds: concludedExpos.map(event => String(event._id)),
                      format: 'xlsx',
                      actionKey: 'concluded-events-xlsx'
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
                >
                  {exportingKey === 'concluded-events-xlsx' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
                  Excel
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-xs font-extrabold text-foreground">
                  <Building2 className="h-4 w-4 text-purple-500" />
                  Exhibitors List
                </h3>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Export exhibitor contacts, booth details, status, and associated event information.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  disabled={!!exportingKey || expos.length === 0}
                  onClick={() => handleDownloadExhibitorsList('csv')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] font-bold text-emerald-600 transition-colors hover:bg-emerald-500/20 disabled:opacity-40 dark:text-emerald-400"
                >
                  {exportingKey === 'exhibitors-list-csv' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  CSV
                </button>
                <button
                  type="button"
                  disabled={!!exportingKey || expos.length === 0}
                  onClick={() => handleDownloadExhibitorsList('xlsx')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
                >
                  {exportingKey === 'exhibitors-list-xlsx' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
                  Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Included Data Modules Selector Bar */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span>Included Report Data Sheets / Sections</span>
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Expo Overview &amp; KPI Summary are always included. Toggle which granular datasets to include in your CSV, Excel, or PDF download:
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <button
              type="button"
              onClick={() =>
                setIncludedModules({
                  visitors: true,
                  attendees: true,
                  leads: true,
                  exhibitors: true,
                  sponsors: true,
                  orders: true,
                  campaigns: true
                })
              }
              className="font-bold text-primary hover:underline"
            >
              Select All Modules
            </button>
            <span className="text-muted-foreground">•</span>
            <button
              type="button"
              onClick={() =>
                setIncludedModules({
                  visitors: false,
                  attendees: false,
                  leads: false,
                  exhibitors: false,
                  sponsors: false,
                  orders: false,
                  campaigns: false
                })
              }
              className="font-bold text-muted-foreground hover:text-foreground"
            >
              Overview Only
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {MODULE_OPTIONS.map(mod => {
            const active = includedModules[mod.key];
            const Icon = mod.icon;
            return (
              <button
                key={mod.key}
                type="button"
                onClick={() => toggleModule(mod.key)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                  active
                    ? 'border-primary/40 bg-primary/10 text-foreground shadow-xs'
                    : 'border-border bg-background text-muted-foreground opacity-60 hover:opacity-100'
                }`}
              >
                {active ? (
                  <CheckSquare className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Square className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <Icon className="h-3.5 w-3.5" />
                <span>{mod.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters, Search & Bulk Selection Bar */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search expo by title, city, venue, organizer, or slug..."
              className="w-full rounded-xl border border-border bg-background pl-10 pr-9 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground"
          >
            <option value="all">All Categories</option>
            {availableCategories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* City Filter */}
          <select
            value={cityFilter}
            onChange={(e) => {
              setCityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground"
          >
            <option value="all">All Cities</option>
            {availableCities.map(city => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground"
          >
            <option value="all">All Expos ({expos.length})</option>
            <option value="with_data">Expos With Activity / Data</option>
            <option value="published">Published Only</option>
            <option value="draft">Draft Only</option>
            <option value="claimed">Claimed by Organizer</option>
          </select>

          {/* Sort Order */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground"
          >
            <option value="records_desc">Sort: Most Total Records</option>
            <option value="visitors_desc">Sort: Most Visitors</option>
            <option value="leads_desc">Sort: Most CRM Leads</option>
            <option value="date_asc">Sort: Start Date</option>
            <option value="title_asc">Sort: Title (A–Z)</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary hover:bg-secondary/80 px-3 py-2 text-xs font-bold text-foreground transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Multi-Select Bulk Action Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-border">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <button
              type="button"
              onClick={toggleSelectAllFiltered}
              className="inline-flex items-center gap-1.5 font-bold text-foreground hover:text-primary transition-colors"
            >
              {isAllFilteredSelected ? (
                <CheckSquare className="h-4 w-4 text-primary" />
              ) : (
                <Square className="h-4 w-4 text-muted-foreground" />
              )}
              <span>
                {isAllFilteredSelected
                  ? `All ${filteredExpos.length} Filtered Expos Selected`
                  : `Select All ${filteredExpos.length} Filtered Expos`}
              </span>
            </button>

            {selectedExpoIds.length > 0 && (
              <>
                <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-extrabold text-primary">
                  {selectedExpoIds.length} Selected
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedExpoIds([])}
                  className="text-[11px] font-bold text-rose-500 hover:underline"
                >
                  Clear Selection
                </button>
              </>
            )}
          </div>

          {selectedExpoIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-muted-foreground mr-1">
                Download Selected ({selectedExpoIds.length}):
              </span>
              <button
                type="button"
                disabled={!!exportingKey}
                onClick={() =>
                  handleDownloadReport({
                    targetIds: selectedExpoIds,
                    format: 'csv',
                    actionKey: 'selected-csv'
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 transition-colors disabled:opacity-50"
              >
                {exportingKey === 'selected-csv' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                <span>CSV ({selectedExpoIds.length})</span>
              </button>

              <button
                type="button"
                disabled={!!exportingKey}
                onClick={() =>
                  handleDownloadReport({
                    targetIds: selectedExpoIds,
                    format: 'xlsx',
                    actionKey: 'selected-xlsx'
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 px-3.5 py-1.5 text-xs font-extrabold text-primary-foreground shadow-xs transition-colors disabled:opacity-50"
              >
                {exportingKey === 'selected-xlsx' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                )}
                <span>Excel .xlsx ({selectedExpoIds.length})</span>
              </button>

              <button
                type="button"
                disabled={!!exportingKey}
                onClick={() =>
                  handleDownloadReport({
                    targetIds: selectedExpoIds,
                    format: 'pdf',
                    actionKey: 'selected-pdf'
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 transition-colors disabled:opacity-50"
              >
                {exportingKey === 'selected-pdf' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Printer className="h-3.5 w-3.5" />
                )}
                <span>PDF ({selectedExpoIds.length})</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Expos Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-xs font-semibold">Aggregating data across all platform exhibitions...</p>
          </div>
        ) : filteredExpos.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-2">
            <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="text-sm font-bold text-foreground">No exhibitions match your current filters</p>
            <p className="text-xs text-muted-foreground">Try clearing your search or resetting the filters above.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30 font-extrabold text-muted-foreground uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-3.5 w-10">
                      <button
                        type="button"
                        onClick={toggleSelectPage}
                        title="Select / Deselect current page"
                        className="flex items-center justify-center text-muted-foreground hover:text-foreground"
                      >
                        {isAllPageSelected ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3.5">Exhibition &amp; Venue</th>
                    <th className="px-4 py-3.5">Organizer</th>
                    <th className="px-3 py-3.5 text-center">Visitors</th>
                    <th className="px-3 py-3.5 text-center">Attendees &amp; Leads</th>
                    <th className="px-3 py-3.5 text-center">Exhibitors &amp; Sponsors</th>
                    <th className="px-3 py-3.5 text-right">Orders &amp; Revenue</th>
                    <th className="px-4 py-3.5 text-right">Download Expo Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedExpos.map((ev) => {
                    const idStr = String(ev._id);
                    const isChecked = selectedExpoIds.includes(idStr);
                    const m = ev.metrics || {};

                    return (
                      <tr
                        key={idStr}
                        className={`hover:bg-secondary/40 transition-colors ${
                          isChecked ? 'bg-primary/5' : ''
                        }`}
                      >
                        <td className="px-4 py-4 align-middle">
                          <button
                            type="button"
                            onClick={() => toggleSelectExpo(idStr)}
                            className="flex items-center justify-center text-muted-foreground hover:text-foreground"
                          >
                            {isChecked ? (
                              <CheckSquare className="h-4 w-4 text-primary" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </button>
                        </td>

                        <td className="px-4 py-4 max-w-xs">
                          <div className="flex items-start gap-3">
                            {ev.banner ? (
                              <img
                                src={ev.banner}
                                alt={ev.title}
                                className="h-11 w-16 rounded-lg object-cover border border-border shrink-0 bg-muted"
                              />
                            ) : (
                              <div className="h-11 w-16 rounded-lg bg-primary/10 text-primary font-extrabold flex items-center justify-center shrink-0 text-xs border border-primary/20">
                                EXPO
                              </div>
                            )}
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => handleInspectExpo(idStr)}
                                className="font-extrabold text-foreground hover:text-primary text-left line-clamp-1 transition-colors"
                              >
                                {ev.title}
                              </button>
                              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                <span className="inline-flex items-center rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                                  {ev.category || 'Trade Show'}
                                </span>
                                <span
                                  className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                                    ev.status === 'published'
                                      ? 'bg-emerald-500/10 text-emerald-500'
                                      : 'bg-amber-500/10 text-amber-500'
                                  }`}
                                >
                                  {ev.status || 'published'}
                                </span>
                                {ev.isClaimed && (
                                  <span className="inline-flex items-center gap-0.5 rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-500">
                                    <CheckCircle2 className="h-2.5 w-2.5" /> Claimed
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                                <span className="inline-flex items-center gap-1 truncate max-w-[180px]">
                                  <MapPin className="h-3 w-3 shrink-0" />
                                  {ev.city || 'India'}
                                </span>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1 whitespace-nowrap">
                                  <Calendar className="h-3 w-3 shrink-0" />
                                  {formatDate(ev.startDate)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <p className="font-bold text-foreground line-clamp-1">
                            {ev.orgName || 'Verified Organizer'}
                          </p>
                          {ev.orgEmail ? (
                            <p className="text-[11px] text-muted-foreground truncate max-w-[170px]">
                              {ev.orgEmail}
                            </p>
                          ) : (
                            <p className="text-[11px] text-muted-foreground/60">Directory Listing</p>
                          )}
                        </td>

                        <td className="px-3 py-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center justify-center rounded-lg bg-emerald-500/10 px-2.5 py-1 font-extrabold text-emerald-600 dark:text-emerald-400">
                            {m.visitorsCount || 0}
                          </span>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {m.checkedInCount || 0} Checked In
                          </p>
                        </td>

                        <td className="px-3 py-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <span
                              title="Interested & Followers"
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-500/10 px-2 py-0.5 font-extrabold text-blue-600 dark:text-blue-400"
                            >
                              {m.attendeesCount || 0} <span className="text-[9px] font-semibold">Att</span>
                            </span>
                            <span
                              title="CRM Buyer Leads"
                              className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-0.5 font-extrabold text-amber-600 dark:text-amber-400"
                            >
                              {m.leadsCount || 0} <span className="text-[9px] font-semibold">Leads</span>
                            </span>
                          </div>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {m.interestedCount || 0} Int • {m.followersCount || 0} Fol
                          </p>
                        </td>

                        <td className="px-3 py-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center justify-center rounded-lg bg-purple-500/10 px-2.5 py-1 font-extrabold text-purple-600 dark:text-purple-400">
                            {m.exhibitorsCount || 0}
                          </span>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {m.sponsorsCount || 0} Sponsors
                          </p>
                        </td>

                        <td className="px-3 py-4 text-right whitespace-nowrap">
                          <p className="font-extrabold text-foreground">
                            ₹{(m.ticketRevenue || 0).toLocaleString('en-IN')}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {m.ordersCount || 0} Orders • {m.campaignsCount || 0} Campaigns
                          </p>
                        </td>

                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleInspectExpo(idStr)}
                              title="Inspect full expo data"
                              className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/70 hover:bg-secondary px-2.5 py-1.5 text-[11px] font-bold text-foreground transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span className="hidden xl:inline">Inspect</span>
                            </button>

                            <button
                              type="button"
                              disabled={!!exportingKey}
                              onClick={() =>
                                handleDownloadReport({
                                  targetIds: [idStr],
                                  format: 'csv',
                                  actionKey: `row-csv-${idStr}`
                                })
                              }
                              title="Download CSV report for this expo"
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1.5 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 transition-colors disabled:opacity-50"
                            >
                              {exportingKey === `row-csv-${idStr}` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Download className="h-3 w-3" />
                              )}
                              <span>CSV</span>
                            </button>

                            <button
                              type="button"
                              disabled={!!exportingKey}
                              onClick={() =>
                                handleDownloadReport({
                                  targetIds: [idStr],
                                  format: 'xlsx',
                                  actionKey: `row-xlsx-${idStr}`
                                })
                              }
                              title="Download Multi-Sheet Excel (.xlsx) report for this expo"
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1.5 text-[11px] font-extrabold text-amber-600 dark:text-amber-400 transition-colors disabled:opacity-50"
                            >
                              {exportingKey === `row-xlsx-${idStr}` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <FileSpreadsheet className="h-3 w-3" />
                              )}
                              <span>Excel</span>
                            </button>

                            <button
                              type="button"
                              disabled={!!exportingKey}
                              onClick={() =>
                                handleDownloadReport({
                                  targetIds: [idStr],
                                  format: 'pdf',
                                  actionKey: `row-pdf-${idStr}`
                                })
                              }
                              title="Print / Download A4 PDF report for this expo"
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1.5 text-[11px] font-extrabold text-rose-600 dark:text-rose-400 transition-colors disabled:opacity-50"
                            >
                              {exportingKey === `row-pdf-${idStr}` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <FileText className="h-3 w-3" />
                              )}
                              <span>PDF</span>
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
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredExpos.length}
              itemsPerPage={itemsPerPage}
              itemLabel="expos"
              onPageChange={setCurrentPage}
              alwaysVisible={filteredExpos.length > 0}
            />
          </>
        )}
      </div>

      {/* Single-Expo Full Data Inspector Modal */}
      {inspectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border px-6 py-4 bg-muted/20">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-extrabold uppercase text-primary">
                    Expo Data Inspector
                  </span>
                  {inspectedReport?.expo?.category && (
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                      {inspectedReport.expo.category}
                    </span>
                  )}
                </div>
                <h3 className="mt-1 text-base font-extrabold text-foreground truncate">
                  {inspectedReport?.expo?.title || 'Loading Expo Report...'}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {inspectedReport && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        exportExpoReportsToCSV([inspectedReport], includedModules);
                        showSweetSuccess(`Downloaded CSV for "${inspectedReport.expo?.title}".`);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        exportExpoReportsToExcel([inspectedReport], includedModules);
                        showSweetSuccess(`Downloaded Excel (.xlsx) for "${inspectedReport.expo?.title}".`);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 px-3 py-1.5 text-xs font-extrabold text-primary-foreground"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      <span>Excel (.xlsx)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => exportExpoReportsToPDF([inspectedReport], includedModules)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Print / PDF</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setInspectModalOpen(false)}
                  className="rounded-xl border border-border bg-secondary p-1.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {inspectLoading || !inspectedReport ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs font-semibold">Fetching complete expo dataset...</p>
              </div>
            ) : (
              <>
                {/* Modal Sub-Navigation Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border px-6 py-2.5 bg-background">
                  {[
                    { id: 'overview', label: 'Overview & Metadata' },
                    { id: 'visitors', label: `Visitors (${inspectedReport.visitors?.length || 0})` },
                    { id: 'attendees', label: `Attendees & Followers (${inspectedReport.attendees?.length || 0})` },
                    { id: 'leads', label: `CRM Leads (${inspectedReport.leads?.length || 0})` },
                    { id: 'exhibitors', label: `Exhibitors (${inspectedReport.exhibitors?.length || 0})` },
                    { id: 'sponsors', label: `Sponsors (${inspectedReport.sponsors?.length || 0})` },
                    { id: 'orders', label: `Orders (${inspectedReport.orders?.length || 0})` },
                    { id: 'campaigns', label: `Campaigns (${inspectedReport.campaigns?.length || 0})` }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setInspectTab(tab.id)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${
                        inspectTab === tab.id
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Modal Tab Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                  {inspectTab === 'overview' && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="rounded-xl border border-border bg-muted/20 p-3.5">
                          <span className="text-[10px] font-bold uppercase text-muted-foreground">Visitors</span>
                          <p className="mt-1 text-xl font-extrabold text-foreground">
                            {inspectedReport.metrics?.visitorsCount || 0}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {inspectedReport.metrics?.checkedInCount || 0} Checked In
                          </p>
                        </div>
                        <div className="rounded-xl border border-border bg-muted/20 p-3.5">
                          <span className="text-[10px] font-bold uppercase text-muted-foreground">
                            Interested &amp; Followers
                          </span>
                          <p className="mt-1 text-xl font-extrabold text-foreground">
                            {inspectedReport.metrics?.attendeesCount || 0}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {inspectedReport.metrics?.interestedCount || 0} Int • {inspectedReport.metrics?.followersCount || 0} Fol
                          </p>
                        </div>
                        <div className="rounded-xl border border-border bg-muted/20 p-3.5">
                          <span className="text-[10px] font-bold uppercase text-muted-foreground">CRM Leads</span>
                          <p className="mt-1 text-xl font-extrabold text-foreground">
                            {inspectedReport.metrics?.leadsCount || 0}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {inspectedReport.metrics?.qualifiedLeadsCount || 0} Qualified
                          </p>
                        </div>
                        <div className="rounded-xl border border-border bg-muted/20 p-3.5">
                          <span className="text-[10px] font-bold uppercase text-muted-foreground">Ticket Revenue</span>
                          <p className="mt-1 text-xl font-extrabold text-foreground">
                            ₹{(inspectedReport.metrics?.ticketRevenue || 0).toLocaleString('en-IN')}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {inspectedReport.metrics?.ordersCount || 0} Orders
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-border p-4 space-y-2.5">
                          <h4 className="font-extrabold uppercase text-[11px] text-primary">
                            Exhibition &amp; Venue Details
                          </h4>
                          <div className="grid grid-cols-3 gap-2">
                            <span className="text-muted-foreground">Venue:</span>
                            <span className="col-span-2 font-semibold text-foreground">
                              {inspectedReport.expo?.venue || 'N/A'}
                            </span>
                            <span className="text-muted-foreground">City &amp; Country:</span>
                            <span className="col-span-2 font-semibold text-foreground">
                              {inspectedReport.expo?.city || 'India'}, {inspectedReport.expo?.country || 'India'}
                            </span>
                            <span className="text-muted-foreground">Dates:</span>
                            <span className="col-span-2 font-semibold text-foreground">
                              {formatDate(inspectedReport.expo?.startDate)} – {formatDate(inspectedReport.expo?.endDate)}
                            </span>
                            <span className="text-muted-foreground">Timings:</span>
                            <span className="col-span-2 font-semibold text-foreground">
                              {inspectedReport.expo?.timings || '09:00 AM - 06:00 PM'}
                            </span>
                            <span className="text-muted-foreground">Ticketing:</span>
                            <span className="col-span-2 font-semibold text-foreground">
                              {inspectedReport.expo?.isFreeEvent !== false
                                ? 'Free Registration'
                                : `Paid (${inspectedReport.expo?.currency || 'INR'} ${inspectedReport.expo?.paidTicketPrice || 0})`}
                            </span>
                          </div>
                        </div>

                        <div className="rounded-xl border border-border p-4 space-y-2.5">
                          <h4 className="font-extrabold uppercase text-[11px] text-primary">
                            Organizer &amp; Platform Details
                          </h4>
                          <div className="grid grid-cols-3 gap-2">
                            <span className="text-muted-foreground">Organizer:</span>
                            <span className="col-span-2 font-semibold text-foreground">
                              {inspectedReport.expo?.orgName || 'Verified Organizer'}
                            </span>
                            <span className="text-muted-foreground">Email:</span>
                            <span className="col-span-2 font-semibold text-foreground break-all">
                              {inspectedReport.expo?.orgEmail || 'N/A'}
                            </span>
                            <span className="text-muted-foreground">Phone:</span>
                            <span className="col-span-2 font-semibold text-foreground">
                              {inspectedReport.expo?.orgPhone || 'N/A'}
                            </span>
                            <span className="text-muted-foreground">Website:</span>
                            <span className="col-span-2 font-semibold text-foreground break-all">
                              {inspectedReport.expo?.website || inspectedReport.expo?.wpUrl || 'N/A'}
                            </span>
                            <span className="text-muted-foreground">Status:</span>
                            <span className="col-span-2 font-semibold text-foreground uppercase">
                              {inspectedReport.expo?.status} ({inspectedReport.expo?.isClaimed ? 'Claimed' : 'Unclaimed'})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {inspectTab === 'visitors' && (
                    <div className="overflow-x-auto rounded-xl border border-border">
                      {(inspectedReport.visitors || []).length === 0 ? (
                        <p className="p-8 text-center text-muted-foreground">No registered visitors for this expo.</p>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-border bg-muted/30 text-[10px] font-extrabold uppercase text-muted-foreground">
                              <th className="p-3">#</th>
                              <th className="p-3">Visitor Name</th>
                              <th className="p-3">Email &amp; Phone</th>
                              <th className="p-3">Company &amp; Designation</th>
                              <th className="p-3">Check-In</th>
                              <th className="p-3">Registered</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {inspectedReport.visitors.map((v, i) => (
                              <tr key={v._id || i}>
                                <td className="p-3 text-muted-foreground">{i + 1}</td>
                                <td className="p-3 font-bold text-foreground">{v.name}</td>
                                <td className="p-3">
                                  <div>{v.email}</div>
                                  <div className="text-[11px] text-muted-foreground">{v.phone}</div>
                                </td>
                                <td className="p-3">
                                  <div>{v.company || '—'}</div>
                                  <div className="text-[11px] text-muted-foreground">{v.designation || ''}</div>
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                                      v.checkInStatus === 'checked_in'
                                        ? 'bg-emerald-500/10 text-emerald-500'
                                        : 'bg-secondary text-muted-foreground'
                                    }`}
                                  >
                                    {v.checkInStatus === 'checked_in' ? 'Checked In' : 'Registered'}
                                  </span>
                                </td>
                                <td className="p-3 text-muted-foreground">{formatDate(v.createdAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {inspectTab === 'attendees' && (
                    <div className="overflow-x-auto rounded-xl border border-border">
                      {(inspectedReport.attendees || []).length === 0 ? (
                        <p className="p-8 text-center text-muted-foreground">
                          No interested attendees or followers recorded for this expo.
                        </p>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-border bg-muted/30 text-[10px] font-extrabold uppercase text-muted-foreground">
                              <th className="p-3">#</th>
                              <th className="p-3">Name</th>
                              <th className="p-3">Email &amp; Phone</th>
                              <th className="p-3">Company</th>
                              <th className="p-3">Engagement</th>
                              <th className="p-3">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {inspectedReport.attendees.map((att, i) => (
                              <tr key={att._id || i}>
                                <td className="p-3 text-muted-foreground">{i + 1}</td>
                                <td className="p-3 font-bold text-foreground">{att.userName}</td>
                                <td className="p-3">
                                  <div>{att.userEmail}</div>
                                  <div className="text-[11px] text-muted-foreground">{att.userPhone}</div>
                                </td>
                                <td className="p-3">{att.userCompany || '—'}</td>
                                <td className="p-3">
                                  <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-500">
                                    {att.type || 'interested'}
                                  </span>
                                </td>
                                <td className="p-3 text-muted-foreground">{formatDate(att.createdAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {inspectTab === 'leads' && (
                    <div className="overflow-x-auto rounded-xl border border-border">
                      {(inspectedReport.leads || []).length === 0 ? (
                        <p className="p-8 text-center text-muted-foreground">No CRM buyer leads for this expo.</p>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-border bg-muted/30 text-[10px] font-extrabold uppercase text-muted-foreground">
                              <th className="p-3">#</th>
                              <th className="p-3">Lead Name</th>
                              <th className="p-3">Email &amp; Phone</th>
                              <th className="p-3">Company</th>
                              <th className="p-3">Source</th>
                              <th className="p-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {inspectedReport.leads.map((ld, i) => (
                              <tr key={ld._id || i}>
                                <td className="p-3 text-muted-foreground">{i + 1}</td>
                                <td className="p-3 font-bold text-foreground">{ld.name}</td>
                                <td className="p-3">
                                  <div>{ld.email}</div>
                                  <div className="text-[11px] text-muted-foreground">{ld.phone}</div>
                                </td>
                                <td className="p-3">{ld.company || '—'}</td>
                                <td className="p-3">{ld.source || 'website'}</td>
                                <td className="p-3 uppercase font-bold text-amber-500">{ld.status || 'new'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {inspectTab === 'exhibitors' && (
                    <div className="overflow-x-auto rounded-xl border border-border">
                      {(inspectedReport.exhibitors || []).length === 0 ? (
                        <p className="p-8 text-center text-muted-foreground">No exhibitors recorded for this expo.</p>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-border bg-muted/30 text-[10px] font-extrabold uppercase text-muted-foreground">
                              <th className="p-3">#</th>
                              <th className="p-3">Company Name</th>
                              <th className="p-3">Booth #</th>
                              <th className="p-3">Contact</th>
                              <th className="p-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {inspectedReport.exhibitors.map((ex, i) => (
                              <tr key={ex._id || i}>
                                <td className="p-3 text-muted-foreground">{i + 1}</td>
                                <td className="p-3 font-bold text-foreground">{ex.name}</td>
                                <td className="p-3 font-mono font-bold">{ex.boothNumber || 'TBD'}</td>
                                <td className="p-3">
                                  <div>{ex.contactEmail || '—'}</div>
                                  <div className="text-[11px] text-muted-foreground">{ex.contactPhone || ''}</div>
                                </td>
                                <td className="p-3 uppercase font-bold text-emerald-500">{ex.status || 'approved'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {inspectTab === 'sponsors' && (
                    <div className="overflow-x-auto rounded-xl border border-border">
                      {(inspectedReport.sponsors || []).length === 0 ? (
                        <p className="p-8 text-center text-muted-foreground">No sponsors recorded for this expo.</p>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-border bg-muted/30 text-[10px] font-extrabold uppercase text-muted-foreground">
                              <th className="p-3">#</th>
                              <th className="p-3">Sponsor Name</th>
                              <th className="p-3">Tier</th>
                              <th className="p-3">Website</th>
                              <th className="p-3">Contact</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {inspectedReport.sponsors.map((sp, i) => (
                              <tr key={sp._id || i}>
                                <td className="p-3 text-muted-foreground">{i + 1}</td>
                                <td className="p-3 font-bold text-foreground">{sp.name}</td>
                                <td className="p-3 uppercase font-bold text-primary">{sp.tier || 'Sponsor'}</td>
                                <td className="p-3">{sp.website || '—'}</td>
                                <td className="p-3">{sp.contactName || sp.contactEmail || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {inspectTab === 'orders' && (
                    <div className="overflow-x-auto rounded-xl border border-border">
                      {(inspectedReport.orders || []).length === 0 ? (
                        <p className="p-8 text-center text-muted-foreground">No ticket orders recorded for this expo.</p>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-border bg-muted/30 text-[10px] font-extrabold uppercase text-muted-foreground">
                              <th className="p-3">#</th>
                              <th className="p-3">Order #</th>
                              <th className="p-3">Buyer</th>
                              <th className="p-3">Amount</th>
                              <th className="p-3">Status</th>
                              <th className="p-3">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {inspectedReport.orders.map((ord, i) => (
                              <tr key={ord._id || i}>
                                <td className="p-3 text-muted-foreground">{i + 1}</td>
                                <td className="p-3 font-mono font-bold text-foreground">{ord.orderNumber}</td>
                                <td className="p-3">
                                  <div className="font-bold">{ord.buyer?.name}</div>
                                  <div className="text-[11px] text-muted-foreground">{ord.buyer?.email}</div>
                                </td>
                                <td className="p-3 font-extrabold">
                                  {ord.currency || 'INR'} {(ord.totalAmount || 0).toLocaleString('en-IN')}
                                </td>
                                <td className="p-3 uppercase font-bold text-emerald-500">{ord.status}</td>
                                <td className="p-3 text-muted-foreground">{formatDate(ord.createdAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {inspectTab === 'campaigns' && (
                    <div className="overflow-x-auto rounded-xl border border-border">
                      {(inspectedReport.campaigns || []).length === 0 ? (
                        <p className="p-8 text-center text-muted-foreground">
                          No marketing campaigns recorded for this expo.
                        </p>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-border bg-muted/30 text-[10px] font-extrabold uppercase text-muted-foreground">
                              <th className="p-3">#</th>
                              <th className="p-3">Campaign Title</th>
                              <th className="p-3">Channel</th>
                              <th className="p-3">Sent / Delivered</th>
                              <th className="p-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {inspectedReport.campaigns.map((cmp, i) => (
                              <tr key={cmp._id || i}>
                                <td className="p-3 text-muted-foreground">{i + 1}</td>
                                <td className="p-3 font-bold text-foreground">{cmp.title}</td>
                                <td className="p-3 uppercase">{cmp.channel}</td>
                                <td className="p-3">
                                  {cmp.sentCount || 0} / {cmp.deliveredCount || 0}
                                </td>
                                <td className="p-3 uppercase font-bold">{cmp.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
