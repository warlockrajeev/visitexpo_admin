'use client';

/**
 * @file visitors/page.js
 * @description Dedicated Super Admin Visitor Directory and Pass Management Console.
 * Allows inspecting all registered visitors across expos, monitoring check-in timestamps,
 * viewing digital badges and QR codes, toggling venue entry, and managing attendance status.
 */

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  Users,
  UserCheck,
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
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Layers,
  AlertCircle,
  Loader2,
  QrCode,
  Download,
  Ticket,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Printer
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function AdminVisitorsPage() {
  const { accessToken } = useAuth();

  // Data States
  const [visitors, setVisitors] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    checkedIn: 0,
    notCheckedIn: 0,
    virtual: 0,
    confirmed: 0,
    pending: 0
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [toast, setToast] = useState(null);

  // Filter & Search States
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'checked_in' | 'not_checked_in' | 'virtual'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('all');
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  // Selected Visitor for Digital Pass Modal
  const [selectedVisitor, setSelectedVisitor] = useState(null);

  // 1. Fetch Stats & Events List
  const fetchAuxiliaryData = async () => {
    if (!accessToken) return;
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const [statsRes, eventsRes] = await Promise.all([
        axios.get(`${API_URL}/visitors/stats`, { headers }),
        axios.get(`${API_URL}/events?limit=100&all=true`)
      ]);

      if (statsRes.data?.success) {
        setStats(statsRes.data.data);
      }
      if (eventsRes.data?.success) {
        setEvents(eventsRes.data.data?.docs || []);
      }
    } catch (err) {
      console.error('[AdminVisitors] Failed to load auxiliary data', err);
    }
  };

  // 2. Fetch Visitors
  const fetchVisitors = async (isRefresh = false) => {
    if (!accessToken) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const params = {
        limit: 300,
        page: 1
      };
      if (selectedEventId !== 'all') params.eventId = selectedEventId;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await axios.get(`${API_URL}/visitors`, { headers, params });
      if (res.data?.success) {
        setVisitors(res.data.data?.docs || []);
      }
    } catch (err) {
      console.error('[AdminVisitors] Failed to load visitors', err);
      setToast({ type: 'error', message: 'Failed to fetch visitors list' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAuxiliaryData();
  }, [accessToken]);

  useEffect(() => {
    fetchVisitors();
    setPage(1);
  }, [accessToken, selectedEventId, searchQuery]);

  // Handle Toggle Check-in
  const handleToggleCheckin = async (visitorId, currentStatus) => {
    setActionLoadingId(visitorId);
    const newStatus = currentStatus === 'checked_in' ? 'not_checked_in' : 'checked_in';

    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const res = await axios.put(
        `${API_URL}/visitors/${visitorId}/status`,
        { checkInStatus: newStatus },
        { headers }
      );

      if (res.data?.success) {
        setToast({
          type: 'success',
          message: newStatus === 'checked_in' ? 'Visitor checked in successfully!' : 'Check-in status reverted.'
        });

        const updatedDoc = res.data.visitor;
        setVisitors(prev =>
          prev.map(v => (v._id === visitorId ? { ...v, checkInStatus: newStatus, checkInTime: updatedDoc.checkInTime } : v))
        );

        if (selectedVisitor?._id === visitorId) {
          setSelectedVisitor(prev => ({ ...prev, checkInStatus: newStatus, checkInTime: updatedDoc.checkInTime }));
        }

        fetchAuxiliaryData();
      }
    } catch (err) {
      console.error('Failed to toggle checkin', err);
      setToast({ type: 'error', message: 'Failed to update check-in status' });
    } finally {
      setActionLoadingId('');
    }
  };

  // Handle Update Registration Status (Confirmed / Pending / Cancelled)
  const handleUpdateRegistrationStatus = async (visitorId, registrationStatus) => {
    setActionLoadingId(visitorId);
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const res = await axios.put(
        `${API_URL}/visitors/${visitorId}/status`,
        { registrationStatus },
        { headers }
      );

      if (res.data?.success) {
        setToast({
          type: 'success',
          message: `Visitor pass registration set to ${registrationStatus.toUpperCase()}!`
        });

        setVisitors(prev =>
          prev.map(v => (v._id === visitorId ? { ...v, registrationStatus } : v))
        );

        if (selectedVisitor?._id === visitorId) {
          setSelectedVisitor(prev => ({ ...prev, registrationStatus }));
        }

        fetchAuxiliaryData();
      }
    } catch (err) {
      console.error('Failed to update status', err);
      setToast({ type: 'error', message: 'Failed to update registration status' });
    } finally {
      setActionLoadingId('');
    }
  };

  // Handle Delete Visitor
  const handleDeleteVisitor = async (visitorId, visitorName) => {
    if (!window.confirm(`Are you sure you want to remove registration for "${visitorName}"?`)) {
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const res = await axios.delete(`${API_URL}/visitors/${visitorId}`, { headers });
      if (res.data?.success) {
        setToast({ type: 'success', message: `Visitor "${visitorName}" deleted successfully.` });
        setVisitors(prev => prev.filter(v => v._id !== visitorId));
        if (selectedVisitor?._id === visitorId) setSelectedVisitor(null);
        fetchAuxiliaryData();
      }
    } catch (err) {
      console.error('Failed to delete visitor', err);
      setToast({ type: 'error', message: 'Failed to delete visitor' });
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredVisitors.length === 0) {
      alert('No visitor records to export.');
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Company', 'Designation', 'Event', 'Mode', 'Check-in Status', 'Check-in Time', 'Reg Status'];
    const rows = filteredVisitors.map(v => [
      `"${v.name || ''}"`,
      `"${v.email || ''}"`,
      `"${v.phone || ''}"`,
      `"${v.company || ''}"`,
      `"${v.designation || ''}"`,
      `"${v.event?.title || ''}"`,
      `"${v.attendanceType || 'in_person'}"`,
      `"${v.checkInStatus || 'not_checked_in'}"`,
      `"${v.checkInTime ? new Date(v.checkInTime).toLocaleString() : ''}"`,
      `"${v.registrationStatus || 'confirmed'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `visitexpo_visitors_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered & Paginated Visitors
  const filteredVisitors = useMemo(() => {
    return visitors.filter(v => {
      const matchesSearch =
        !searchQuery.trim() ||
        v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.phone?.includes(searchQuery) ||
        v.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.event?.title?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesEvent = selectedEventId === 'all' || v.event?._id === selectedEventId || v.event === selectedEventId;

      let matchesTab = true;
      if (activeTab === 'checked_in') matchesTab = v.checkInStatus === 'checked_in';
      else if (activeTab === 'not_checked_in') matchesTab = v.checkInStatus !== 'checked_in';
      else if (activeTab === 'virtual') matchesTab = v.attendanceType === 'virtual';

      return matchesSearch && matchesEvent && matchesTab;
    });
  }, [visitors, searchQuery, selectedEventId, activeTab]);

  const totalPages = Math.ceil(filteredVisitors.length / itemsPerPage) || 1;
  const paginatedVisitors = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredVisitors.slice(start, start + itemsPerPage);
  }, [filteredVisitors, page]);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
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
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-black">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                Visitor Directory & Pass Management
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Track registered expo visitors, verify admission passes, record live venue check-ins, and manage attendee badges.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>

          <button
            onClick={() => {
              fetchVisitors(true);
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
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Registered Visitors</span>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-foreground mt-2">{stats.total}</p>
          <span className="text-[11px] text-muted-foreground">Across all exhibitions</span>
        </div>

        <div
          onClick={() => setActiveTab('checked_in')}
          className={`bg-card border rounded-2xl p-5 shadow-sm cursor-pointer transition-all ${
            activeTab === 'checked_in' ? 'ring-2 ring-emerald-500 border-emerald-500/50' : 'border-border hover:border-emerald-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Checked In at Venue
            </span>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-500 mt-2">{stats.checkedIn}</p>
          <span className="text-[11px] text-muted-foreground">Admitted badges</span>
        </div>

        <div
          onClick={() => setActiveTab('not_checked_in')}
          className={`bg-card border rounded-2xl p-5 shadow-sm cursor-pointer transition-all ${
            activeTab === 'not_checked_in' ? 'ring-2 ring-amber-500 border-amber-500/50' : 'border-border hover:border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Awaiting Check-in
            </span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-500 mt-2">{stats.notCheckedIn}</p>
          <span className="text-[11px] text-muted-foreground">Registered badge holders</span>
        </div>

        <div
          onClick={() => setActiveTab('virtual')}
          className={`bg-card border rounded-2xl p-5 shadow-sm cursor-pointer transition-all ${
            activeTab === 'virtual' ? 'ring-2 ring-purple-500 border-purple-500/50' : 'border-border hover:border-purple-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Virtual Attendees
            </span>
            <Globe className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-2xl font-extrabold text-purple-500 mt-2">{stats.virtual}</p>
          <span className="text-[11px] text-muted-foreground">Digital stream viewers</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/50">
            {[
              { id: 'all', label: 'All Visitors', count: stats.total },
              { id: 'checked_in', label: 'Checked In', count: stats.checkedIn },
              { id: 'not_checked_in', label: 'Awaiting Check-in', count: stats.notCheckedIn },
              { id: 'virtual', label: 'Virtual Passes', count: stats.virtual }
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
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search & Event Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search visitor, email, company..."
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

      {/* Main Visitors Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            Loading visitor records...
          </div>
        ) : paginatedVisitors.length === 0 ? (
          <div className="py-20 text-center text-xs text-muted-foreground space-y-2">
            <Users className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <p className="font-bold text-foreground text-sm">No Visitors Found</p>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try adjusting your search query or filters.' : 'No visitors registered under this view.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/20 font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-4">Visitor Details</th>
                  <th className="px-6 py-4">Registered Event</th>
                  <th className="px-6 py-4">Contact Coordinates</th>
                  <th className="px-6 py-4">Attendance Mode</th>
                  <th className="px-6 py-4">Check-In Status</th>
                  <th className="px-6 py-4">Pass Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedVisitors.map(vis => (
                  <tr key={vis._id} className="hover:bg-secondary/40 transition-colors">
                    {/* Visitor Details */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                          {vis.name?.charAt(0) || 'V'}
                        </div>
                        <div className="max-w-xs">
                          <p className="font-bold text-foreground truncate">{vis.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {vis.designation ? `${vis.designation}, ` : ''}{vis.company || 'Independent Visitor'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Registered Event */}
                    <td className="px-6 py-4">
                      <div className="max-w-[220px]">
                        <p className="font-semibold text-primary truncate">{vis.event?.title || 'Expo Event'}</p>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-2.5 w-2.5" /> {vis.event?.city || 'India'}
                        </span>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="px-6 py-4 space-y-0.5">
                      <div className="flex items-center gap-1 text-foreground font-medium truncate max-w-[180px]">
                        <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="truncate">{vis.email}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground text-[11px]">
                        <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span>{vis.phone}</span>
                      </div>
                    </td>

                    {/* Attendance Mode */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase border ${
                        vis.attendanceType === 'virtual'
                          ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                          : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      }`}>
                        {vis.attendanceType?.replace('_', ' ') || 'in person'}
                      </span>
                    </td>

                    {/* Check-In Status */}
                    <td className="px-6 py-4">
                      {vis.checkInStatus === 'checked_in' ? (
                        <div>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="h-3 w-3" /> Checked In
                          </span>
                          {vis.checkInTime && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {new Date(vis.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
                          <Clock className="h-3 w-3" /> Not Checked In
                        </span>
                      )}
                    </td>

                    {/* Pass Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border ${
                        vis.registrationStatus === 'confirmed'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : vis.registrationStatus === 'cancelled'
                          ? 'bg-destructive/10 text-destructive border-destructive/20'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {vis.registrationStatus || 'confirmed'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleCheckin(vis._id, vis.checkInStatus)}
                          disabled={actionLoadingId === vis._id}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-sm ${
                            vis.checkInStatus === 'checked_in'
                              ? 'bg-secondary text-foreground hover:bg-secondary/80 border border-border'
                              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                          }`}
                          title={vis.checkInStatus === 'checked_in' ? 'Undo Check-in' : 'Check In Visitor'}
                        >
                          {actionLoadingId === vis._id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : vis.checkInStatus === 'checked_in' ? (
                            'Undo Check-in'
                          ) : (
                            'Check In'
                          )}
                        </button>

                        <button
                          onClick={() => setSelectedVisitor(vis)}
                          className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                          title="View Digital Pass Badge"
                        >
                          <Ticket className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteVisitor(vis._id, vis.name)}
                          className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Remove Registration"
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
              Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, filteredVisitors.length)} of {filteredVisitors.length} visitors
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

      {/* Digital Visitor Pass Modal */}
      {selectedVisitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Badge Header with Event Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center relative">
              <button
                onClick={() => setSelectedVisitor(null)}
                className="absolute right-4 top-4 p-1 rounded-full bg-black/20 hover:bg-black/40 text-white"
              >
                <X className="h-4 w-4" />
              </button>
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
                Official Visitor Pass
              </span>
              <h3 className="text-xl font-black mt-2 leading-tight">
                {selectedVisitor.event?.title || 'VisitExpo Global Trade Expo'}
              </h3>
              <p className="text-xs text-blue-100 mt-1 flex items-center justify-center gap-1">
                <MapPin className="h-3 w-3" /> {selectedVisitor.event?.city || 'India'}
              </p>
            </div>

            {/* Badge Card Body */}
            <div className="p-6 text-center space-y-4">
              <div>
                <h4 className="text-2xl font-black text-foreground">{selectedVisitor.name}</h4>
                <p className="text-xs font-semibold text-primary mt-0.5">
                  {selectedVisitor.designation || 'Trade Delegate'}
                </p>
                <p className="text-xs text-muted-foreground">{selectedVisitor.company || 'Visitor'}</p>
              </div>

              {/* QR Code Presentation */}
              <div className="bg-muted/20 border border-border rounded-2xl p-4 inline-block mx-auto">
                <div className="bg-white p-3 rounded-xl shadow-sm inline-block">
                  {/* Mock QR Code Pattern */}
                  <div className="h-32 w-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg text-slate-700">
                    <QrCode className="h-20 w-20 text-slate-800" />
                    <span className="text-[9px] font-mono mt-1 font-bold text-slate-500">
                      {selectedVisitor.qrCode || `VX-${selectedVisitor._id?.slice(-8)}`}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground font-mono mt-2 uppercase">
                  Scan at Entry Gate for Badge Print
                </p>
              </div>

              {/* Coordinates Grid */}
              <div className="grid grid-cols-2 gap-2 text-left text-xs bg-muted/10 p-3 rounded-xl border border-border">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Mode:</span>
                  <p className="font-semibold text-foreground uppercase">{selectedVisitor.attendanceType?.replace('_', ' ') || 'in person'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Admission:</span>
                  <p className="font-semibold text-foreground uppercase">{selectedVisitor.checkInStatus?.replace('_', ' ')}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Email:</span>
                  <p className="font-semibold text-foreground truncate">{selectedVisitor.email}</p>
                </div>
              </div>
            </div>

            {/* Badge Footer Buttons */}
            <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-xl border border-border text-foreground hover:bg-secondary font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Printer className="h-3.5 w-3.5" /> Print Badge
              </button>

              <button
                onClick={() => handleToggleCheckin(selectedVisitor._id, selectedVisitor.checkInStatus)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all shadow ${
                  selectedVisitor.checkInStatus === 'checked_in'
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
              >
                {selectedVisitor.checkInStatus === 'checked_in' ? 'Revert Check-in' : 'Admit Visitor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
