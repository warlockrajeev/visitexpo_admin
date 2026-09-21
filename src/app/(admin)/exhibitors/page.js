'use client';

/**
 * @file exhibitors/page.js
 * @description Dedicated Super Admin Exhibitor Management and Approval Console.
 * Allows viewing all exhibitors across events, approving/rejecting onboarding requests,
 * modifying booth allocations, viewing staff badges, and tracking company profiles.
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  Building,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Trash2,
  Check,
  X,
  Globe,
  Mail,
  Phone,
  ExternalLink,
  Users,
  MapPin,
  Calendar,
  Layers,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  Building2,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Edit3
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function AdminExhibitorsPage() {
  const { accessToken } = useAuth();

  // Data States
  const [exhibitors, setExhibitors] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    inPerson: 0,
    virtual: 0
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: '' }

  // Filter & Search States
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('all');
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  // Detail Modal / Drawer
  const [selectedExhibitor, setSelectedExhibitor] = useState(null);
  const [editingBooth, setEditingBooth] = useState(false);
  const [boothInput, setBoothInput] = useState('');

  // 1. Fetch Stats & Events List
  const fetchAuxiliaryData = async () => {
    if (!accessToken) return;
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const [statsRes, eventsRes] = await Promise.all([
        axios.get(`${API_URL}/exhibitors/stats`, { headers }),
        axios.get(`${API_URL}/events?limit=100&all=true`)
      ]);

      if (statsRes.data?.success) {
        setStats(statsRes.data.data);
      }
      if (eventsRes.data?.success) {
        setEvents(eventsRes.data.data?.docs || []);
      }
    } catch (err) {
      console.error('[AdminExhibitors] Failed to load stats/events', err);
    }
  };

  // 2. Fetch Exhibitors
  const fetchExhibitors = async (isRefresh = false) => {
    if (!accessToken) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const params = {
        limit: 200,
        page: 1
      };
      if (selectedEventId !== 'all') params.eventId = selectedEventId;
      if (activeTab !== 'all') params.status = activeTab;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await axios.get(`${API_URL}/exhibitors`, { headers, params });
      if (res.data?.success) {
        setExhibitors(res.data.data?.docs || []);
      }
    } catch (err) {
      console.error('[AdminExhibitors] Failed to load exhibitors', err);
      setToast({ type: 'error', message: 'Failed to fetch exhibitors list' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAuxiliaryData();
  }, [accessToken]);

  useEffect(() => {
    fetchExhibitors();
    setPage(1);
  }, [accessToken, activeTab, selectedEventId, searchQuery]);

  // Handle Approve / Reject / Revert
  const handleStatusUpdate = async (exhibitorId, status) => {
    setActionLoadingId(exhibitorId);
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const res = await axios.put(
        `${API_URL}/admin/exhibitors/${exhibitorId}/status`,
        { status },
        { headers }
      );

      if (res.data?.success) {
        setToast({
          type: 'success',
          message: `Exhibitor status set to ${status.toUpperCase()} successfully!`
        });

        // Update local state immediately
        setExhibitors(prev =>
          prev.map(ex => (ex._id === exhibitorId ? { ...ex, status } : ex))
        );

        // If drawer open, sync it
        if (selectedExhibitor?._id === exhibitorId) {
          setSelectedExhibitor(prev => ({ ...prev, status }));
        }

        // Refresh stats
        fetchAuxiliaryData();
      }
    } catch (err) {
      console.error('[AdminExhibitors] Status update failed', err);
      setToast({
        type: 'error',
        message: err.response?.data?.error || 'Failed to update exhibitor status'
      });
    } finally {
      setActionLoadingId('');
    }
  };

  // Handle Booth Allocation Save
  const handleSaveBoothNumber = async (exhibitorId) => {
    if (!boothInput.trim()) return;
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const res = await axios.put(
        `${API_URL}/exhibitors/${exhibitorId}`,
        { boothNumber: boothInput.trim() },
        { headers }
      );

      if (res.data?.success) {
        setToast({ type: 'success', message: 'Booth allocation updated!' });
        setExhibitors(prev =>
          prev.map(ex => (ex._id === exhibitorId ? { ...ex, boothNumber: boothInput.trim() } : ex))
        );
        if (selectedExhibitor?._id === exhibitorId) {
          setSelectedExhibitor(prev => ({ ...prev, boothNumber: boothInput.trim() }));
        }
        setEditingBooth(false);
      }
    } catch (err) {
      console.error('Failed to update booth', err);
      setToast({ type: 'error', message: 'Failed to update booth allocation' });
    }
  };

  // Handle Delete Exhibitor
  const handleDeleteExhibitor = async (exhibitorId, companyName) => {
    if (!window.confirm(`Are you sure you want to remove exhibitor "${companyName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const res = await axios.delete(`${API_URL}/exhibitors/${exhibitorId}`, { headers });
      if (res.data?.success) {
        setToast({ type: 'success', message: `Exhibitor "${companyName}" removed successfully.` });
        setExhibitors(prev => prev.filter(e => e._id !== exhibitorId));
        if (selectedExhibitor?._id === exhibitorId) {
          setSelectedExhibitor(null);
        }
        fetchAuxiliaryData();
      }
    } catch (err) {
      console.error('Failed to delete exhibitor', err);
      setToast({ type: 'error', message: 'Error deleting exhibitor' });
    }
  };

  // Filtered & Paginated Exhibitors
  const filteredExhibitors = useMemo(() => {
    return exhibitors.filter(ex => {
      const matchesSearch =
        !searchQuery.trim() ||
        ex.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.boothNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.event?.title?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTab = activeTab === 'all' || ex.status === activeTab;
      const matchesEvent = selectedEventId === 'all' || ex.event?._id === selectedEventId || ex.event === selectedEventId;

      return matchesSearch && matchesTab && matchesEvent;
    });
  }, [exhibitors, searchQuery, activeTab, selectedEventId]);

  const totalPages = Math.ceil(filteredExhibitors.length / itemsPerPage) || 1;
  const paginatedExhibitors = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredExhibitors.slice(start, start + itemsPerPage);
  }, [filteredExhibitors, page]);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-xs font-semibold animate-in slide-in-from-bottom-5 duration-200 ${
          toast.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
            : 'bg-destructive/10 border-destructive/30 text-destructive'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                Exhibitor Management & Approvals
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review onboarding requests, approve booths across expos, assign stall numbers, and monitor representatives.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              fetchExhibitors(true);
              fetchAuxiliaryData();
            }}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Exhibitors</span>
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-extrabold text-foreground mt-2">{stats.total}</p>
          <span className="text-[11px] text-muted-foreground">Registered booth partners</span>
        </div>

        <div
          onClick={() => setActiveTab('pending')}
          className={`bg-card border rounded-2xl p-5 shadow-sm cursor-pointer transition-all ${
            activeTab === 'pending' ? 'ring-2 ring-amber-500 border-amber-500/50' : 'border-border hover:border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Pending Approval
            </span>
            <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
          </div>
          <p className="text-2xl font-extrabold text-amber-500 mt-2">{stats.pending}</p>
          <span className="text-[11px] text-muted-foreground">Requires admin review</span>
        </div>

        <div
          onClick={() => setActiveTab('approved')}
          className={`bg-card border rounded-2xl p-5 shadow-sm cursor-pointer transition-all ${
            activeTab === 'approved' ? 'ring-2 ring-emerald-500 border-emerald-500/50' : 'border-border hover:border-emerald-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Approved Booths
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-500 mt-2">{stats.approved}</p>
          <span className="text-[11px] text-muted-foreground">Active in event catalogue</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Virtual / Hybrid
            </span>
            <Globe className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-2xl font-extrabold text-purple-500 mt-2">{stats.virtual}</p>
          <span className="text-[11px] text-muted-foreground">{stats.inPerson} In-person booths</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/50">
            {[
              { id: 'all', label: 'All Exhibitors', count: stats.total },
              { id: 'pending', label: 'Pending Approval', count: stats.pending, badgeColor: 'bg-amber-500 text-white' },
              { id: 'approved', label: 'Approved', count: stats.approved },
              { id: 'rejected', label: 'Rejected', count: stats.rejected }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    tab.id === 'pending' && tab.count > 0
                      ? 'bg-amber-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search & Event Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search company, email, booth..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <select
              value={selectedEventId}
              onChange={e => setSelectedEventId(e.target.value)}
              className="px-3 py-1.5 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary max-w-[200px]"
            >
              <option value="all">All Events ({events.length})</option>
              {events.map(ev => (
                <option key={ev._id} value={ev._id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Exhibitors Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            Loading exhibitors list...
          </div>
        ) : paginatedExhibitors.length === 0 ? (
          <div className="py-20 text-center text-xs text-muted-foreground space-y-2">
            <Building className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <p className="font-bold text-foreground text-sm">No Exhibitors Found</p>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try adjusting your search query or filters.' : 'No exhibitors registered under this category.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/20 font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-4">Company Profile</th>
                  <th className="px-6 py-4">Target Expo Event</th>
                  <th className="px-6 py-4">Booth & Mode</th>
                  <th className="px-6 py-4">Contact Credentials</th>
                  <th className="px-6 py-4">Staff Badges</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedExhibitors.map(ex => (
                  <tr key={ex._id} className="hover:bg-secondary/40 transition-colors">
                    {/* Company Profile */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {ex.logo ? (
                          <img
                            src={ex.logo}
                            alt={ex.name}
                            className="h-9 w-9 rounded-lg object-contain bg-background border border-border p-0.5 shrink-0"
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black shrink-0">
                            {ex.name?.charAt(0) || 'E'}
                          </div>
                        )}
                        <div className="max-w-xs">
                          <p className="font-bold text-foreground truncate">{ex.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{ex.description || 'Official exhibitor'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Target Event */}
                    <td className="px-6 py-4">
                      <div className="max-w-[220px]">
                        <p className="font-semibold text-primary truncate">{ex.event?.title || 'Expo Event'}</p>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-2.5 w-2.5" /> {ex.event?.city || 'India'}
                        </span>
                      </div>
                    </td>

                    {/* Booth & Mode */}
                    <td className="px-6 py-4">
                      <p className="font-semibold text-foreground">{ex.boothNumber || 'TBD'}</p>
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase mt-1 ${
                        ex.attendanceType === 'virtual'
                          ? 'bg-pink-500/10 text-pink-500 border border-pink-500/20'
                          : ex.attendanceType === 'hybrid'
                          ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                          : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                      }`}>
                        {ex.attendanceType?.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Contact Info */}
                    <td className="px-6 py-4 space-y-0.5">
                      <div className="flex items-center gap-1 text-foreground font-medium truncate max-w-[180px]">
                        <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="truncate">{ex.contactEmail}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground text-[11px]">
                        <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span>{ex.contactPhone}</span>
                      </div>
                    </td>

                    {/* Staff Badges */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {ex.staff?.length || 0} Badges
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${
                        ex.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : ex.status === 'rejected'
                          ? 'bg-destructive/10 text-destructive border-destructive/20'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse'
                      }`}>
                        {ex.status === 'approved' && <CheckCircle2 className="h-3 w-3" />}
                        {ex.status === 'rejected' && <XCircle className="h-3 w-3" />}
                        {ex.status === 'pending' && <Clock className="h-3 w-3" />}
                        {ex.status === 'pending' ? 'Pending Admin' : ex.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {ex.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(ex._id, 'approved')}
                              disabled={actionLoadingId === ex._id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg text-xs font-bold shadow-sm transition-all"
                              title="Approve Booth Application"
                            >
                              {actionLoadingId === ex._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(ex._id, 'rejected')}
                              disabled={actionLoadingId === ex._id}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 rounded-lg text-xs font-bold transition-all"
                              title="Reject Application"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </>
                        )}

                        {ex.status === 'rejected' && (
                          <button
                            onClick={() => handleStatusUpdate(ex._id, 'pending')}
                            className="text-[11px] text-primary hover:underline px-2 py-1 font-semibold"
                          >
                            Revert to Pending
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedExhibitor(ex);
                            setBoothInput(ex.boothNumber || '');
                            setEditingBooth(false);
                          }}
                          className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                          title="View Exhibitor Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <Link
                          href={`/moderation/exhibitors/${ex._id}`}
                          className="p-1 text-primary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Inspect Full Approval Dossier"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>

                        <button
                          onClick={() => handleDeleteExhibitor(ex._id, ex.name)}
                          className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Remove Exhibitor"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border bg-muted/10 text-xs">
            <span className="text-muted-foreground">
              Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, filteredExhibitors.length)} of {filteredExhibitors.length} exhibitors
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="p-1 rounded-lg border border-border text-foreground hover:bg-secondary disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 font-bold text-foreground">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="p-1 rounded-lg border border-border text-foreground hover:bg-secondary disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Exhibitor Profile Drawer / Modal */}
      {selectedExhibitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm p-0">
          <div className="w-full max-w-lg h-full bg-card border-l border-border shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div>
              <div className="p-6 border-b border-border flex items-start justify-between bg-muted/20">
                <div className="flex items-center gap-3">
                  {selectedExhibitor.logo ? (
                    <img
                      src={selectedExhibitor.logo}
                      alt={selectedExhibitor.name}
                      className="h-12 w-12 rounded-xl object-contain bg-background border border-border p-1"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg">
                      {selectedExhibitor.name?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{selectedExhibitor.name}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mt-1 border ${
                      selectedExhibitor.status === 'approved'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : selectedExhibitor.status === 'rejected'
                        ? 'bg-destructive/10 text-destructive border-destructive/20'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}>
                      {selectedExhibitor.status === 'pending' ? 'Pending Admin Review' : selectedExhibitor.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/moderation/exhibitors/${selectedExhibitor._id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-bold hover:bg-primary/20 transition-all"
                    title="Open Full Approval Inspection Dossier"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Full Dossier
                  </Link>
                  <button
                    onClick={() => setSelectedExhibitor(null)}
                    className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Body */}
              <div className="p-6 space-y-6 text-xs">
                {/* About Company */}
                <div>
                  <h4 className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider mb-2">Company Overview</h4>
                  <p className="text-foreground leading-relaxed bg-muted/20 p-3 rounded-xl border border-border">
                    {selectedExhibitor.description || 'No description provided.'}
                  </p>
                </div>

                {/* Booth & Target Event Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/10 p-3 rounded-xl border border-border">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Assigned Booth</span>
                    {editingBooth ? (
                      <div className="flex items-center gap-1 mt-1">
                        <input
                          type="text"
                          value={boothInput}
                          onChange={e => setBoothInput(e.target.value)}
                          className="w-20 px-2 py-1 bg-background border border-border rounded text-xs text-foreground"
                        />
                        <button
                          onClick={() => handleSaveBoothNumber(selectedExhibitor._id)}
                          className="px-2 py-1 bg-primary text-primary-foreground rounded text-[10px] font-bold"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mt-1">
                        <p className="font-bold text-foreground text-sm">{selectedExhibitor.boothNumber || 'Not Allocated'}</p>
                        <button
                          onClick={() => setEditingBooth(true)}
                          className="text-primary hover:underline text-[10px] flex items-center gap-0.5"
                        >
                          <Edit3 className="h-3 w-3" /> Edit
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="bg-muted/10 p-3 rounded-xl border border-border">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Attendance Mode</span>
                    <p className="font-bold text-foreground text-sm mt-1 uppercase">
                      {selectedExhibitor.attendanceType?.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                {/* Target Event */}
                <div className="bg-muted/10 p-4 rounded-xl border border-border space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Target Expo Event</span>
                  <p className="font-bold text-primary text-sm">{selectedExhibitor.event?.title || 'Expo Event'}</p>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {selectedExhibitor.event?.city} {selectedExhibitor.event?.venue && `• ${selectedExhibitor.event.venue}`}
                  </p>
                </div>

                {/* Contact Coordinates */}
                <div>
                  <h4 className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider mb-2">Direct Contact</h4>
                  <div className="space-y-2 bg-muted/10 p-3 rounded-xl border border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email:</span>
                      <span className="font-semibold text-foreground">{selectedExhibitor.contactEmail}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Phone:</span>
                      <span className="font-semibold text-foreground">{selectedExhibitor.contactPhone}</span>
                    </div>
                    {selectedExhibitor.website && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Website:</span>
                        <a href={selectedExhibitor.website} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                          {selectedExhibitor.website} <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Staff Representatives */}
                <div>
                  <h4 className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider mb-2">
                    Staff Representatives ({selectedExhibitor.staff?.length || 0})
                  </h4>
                  {selectedExhibitor.staff && selectedExhibitor.staff.length > 0 ? (
                    <div className="space-y-2">
                      {selectedExhibitor.staff.map((st, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card">
                          <div>
                            <p className="font-bold text-foreground">{st.name}</p>
                            <p className="text-[11px] text-muted-foreground">{st.email}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-semibold">{st.phone || 'Representative'}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">No staff representatives registered yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-6 border-t border-border bg-card flex items-center justify-between gap-3">
              {selectedExhibitor.status === 'pending' ? (
                <>
                  <button
                    onClick={() => handleStatusUpdate(selectedExhibitor._id, 'rejected')}
                    className="flex-1 py-2.5 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 font-bold transition-all text-center"
                  >
                    Reject Application
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedExhibitor._id, 'approved')}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all text-center shadow-md"
                  >
                    Approve Booth
                  </button>
                </>
              ) : selectedExhibitor.status === 'approved' ? (
                <>
                  <button
                    onClick={() => handleStatusUpdate(selectedExhibitor._id, 'rejected')}
                    className="flex-1 py-2.5 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 font-bold transition-all text-center"
                  >
                    Revoke Approval
                  </button>
                  <button
                    onClick={() => setSelectedExhibitor(null)}
                    className="flex-1 py-2.5 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 font-bold transition-all text-center"
                  >
                    Close Drawer
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleStatusUpdate(selectedExhibitor._id, 'pending')}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold transition-all text-center"
                  >
                    Revert to Pending Review
                  </button>
                  <button
                    onClick={() => setSelectedExhibitor(null)}
                    className="flex-1 py-2.5 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 font-bold transition-all text-center"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
