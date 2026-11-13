'use client';

/**
 * @file page.js (Booth Request Queries Admin Console)
 * @description Super Admin console to view, filter, update status/notes, and manage Booth Request queries submitted from expo pages.
 */

import React, { useState, useEffect, useCallback } from 'react';
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
  Briefcase
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

export default function AdminBoothRequestsPage() {
  const { accessToken } = useAuth();

  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ total: 0, new: 0, in_progress: 0, responded: 0, approved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalStatus, setModalStatus] = useState('new');
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [saveNotice, setSaveNotice] = useState('');

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
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to load booth requests:', err);
      setError(err.response?.data?.error || 'Could not retrieve booth request queries.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, statusFilter, categoryFilter, searchTerm]);

  useEffect(() => {
    fetchBoothRequests();
  }, [accessToken, statusFilter, categoryFilter]);

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

  const handleQuickStatusChange = async (id, nextStatus) => {
    try {
      const res = await axios.put(
        `${API_URL}/booth-requests/admin/${id}`,
        { status: nextStatus },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data?.success) {
        setRequests((prev) => prev.map((r) => (r._id === id ? res.data.data : r)));
        if (selectedRequest?._id === id) {
          setSelectedRequest(res.data.data);
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
        setRequests((prev) => prev.map((r) => (r._id === selectedRequest._id ? res.data.data : r)));
        setSelectedRequest(res.data.data);
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
            Direct stall space bookings, visitor badge requests, and expo inquiries routed to VisitExpo Admin.
          </p>
        </div>

        <button
          onClick={fetchBoothRequests}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Queries
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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

        <div className="p-4 rounded-2xl bg-card border border-emerald-500/30 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span>Approved</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{stats.approved || 0}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="p-4 rounded-2xl bg-card border border-border flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by expo, company, requester name, email or message..."
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
      </div>

      {/* Table / List */}
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
              Requests submitted via the "Request Booth" modal on expo pages will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                  <th className="py-3.5 px-4">Expo & Venue</th>
                  <th className="py-3.5 px-4">Requester</th>
                  <th className="py-3.5 px-4">Company & Role</th>
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
                  return (
                    <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 max-w-[230px]">
                        <p className="font-extrabold text-foreground line-clamp-1">{item.eventTitle || item.eventSlug}</p>
                        {(item.eventCity || item.eventVenue) && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 line-clamp-1">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span>{[item.eventVenue, item.eventCity].filter(Boolean).join(', ')}</span>
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

      {/* Detail Modal */}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-1">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">Requester</span>
                  <p className="font-bold text-foreground text-sm">{selectedRequest.name}</p>
                  <p className="text-muted-foreground">{selectedRequest.email}</p>
                  {selectedRequest.phone && <p className="text-muted-foreground">{selectedRequest.phone}</p>}
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-1">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">Company & Role</span>
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
    </div>
  );
}

