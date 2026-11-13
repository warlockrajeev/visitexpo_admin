'use client';

/**
 * @file page.js (Speaker, Delegation & Travel Requests Admin Console)
 * @description Super Admin console to review, approve/reject, add notes, and manage Speaker Applications,
 * Corporate Group & VIP Delegations, and Partner Hotel & Flight Discount requests submitted from expo pages.
 */

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  Mic,
  Users,
  Plane,
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
  Building2,
  Briefcase,
  Sparkles,
  ExternalLink
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const STATUS_META = {
  new: { label: 'Pending Review', badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' },
  in_progress: { label: 'In Progress', badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30' },
  approved: { label: 'Approved', badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
  rejected: { label: 'Rejected', badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30' },
  archived: { label: 'Archived', badge: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30' }
};

const TYPE_META = {
  speaker: {
    label: 'Speaker Request',
    badge: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
    icon: Mic
  },
  delegation: {
    label: 'VIP Delegation',
    badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
    icon: Users
  },
  travel_discount: {
    label: 'Hotel & Flight Discount',
    badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
    icon: Plane
  }
};

export default function AdminEventRequestsPage() {
  const { accessToken } = useAuth();

  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    speaker: 0,
    delegation: 0,
    travel_discount: 0,
    approved: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalStatus, setModalStatus] = useState('new');
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [saveNotice, setSaveNotice] = useState('');

  const fetchEventRequests = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (typeFilter !== 'all') params.set('requestType', typeFilter);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());

      const res = await axios.get(`${API_URL}/event-requests/admin/all?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (res.data?.success) {
        setRequests(res.data.data || []);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to load event requests:', err);
      setError(err.response?.data?.error || 'Could not retrieve speaker, delegation, and travel requests.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, statusFilter, typeFilter, searchTerm]);

  useEffect(() => {
    fetchEventRequests();
  }, [accessToken, statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEventRequests();
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
        `${API_URL}/event-requests/admin/${id}`,
        { status: nextStatus },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data?.success) {
        setRequests((prev) => prev.map((r) => (r._id === id ? res.data.data : r)));
        fetchEventRequests();
      }
    } catch (err) {
      console.error('Status update error:', err);
    }
  };

  const handleSaveDetail = async () => {
    if (!selectedRequest) return;
    setSaving(true);
    setSaveNotice('');
    try {
      const res = await axios.put(
        `${API_URL}/event-requests/admin/${selectedRequest._id}`,
        { status: modalStatus, adminNotes },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data?.success) {
        setSelectedRequest(res.data.data);
        setRequests((prev) => prev.map((r) => (r._id === selectedRequest._id ? res.data.data : r)));
        setSaveNotice(
          selectedRequest.requestType === 'speaker' && modalStatus === 'approved'
            ? 'Approved! Speaker is now live on the Expo Speakers tab.'
            : 'Updated successfully!'
        );
        fetchEventRequests();
      }
    } catch (err) {
      setSaveNotice(err.response?.data?.error || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this request permanently?')) return;
    setDeletingId(id);
    try {
      await axios.delete(`${API_URL}/event-requests/admin/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setRequests((prev) => prev.filter((r) => r._id !== id));
      if (selectedRequest?._id === id) setSelectedRequest(null);
      fetchEventRequests();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return '—';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-amber-500" />
            Speaker, VIP Delegation &amp; Travel Requests
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review keynote speaker proposals (approved speakers appear automatically on expo pages), corporate group delegations, and hotel/flight discount requests.
          </p>
        </div>

        <button
          onClick={fetchEventRequests}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition-colors cursor-pointer self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Requests
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Total</span>
            <Sparkles className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{stats.total || 0}</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-amber-500/30">
          <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
            <span>Pending Review</span>
            <AlertCircle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{stats.new || 0}</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-purple-500/30">
          <div className="flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
            <span>Speakers</span>
            <Mic className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{stats.speaker || 0}</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-blue-500/30">
          <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
            <span>Delegations</span>
            <Users className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{stats.delegation || 0}</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-rose-500/30">
          <div className="flex items-center justify-between text-xs font-bold text-rose-600 dark:text-rose-400">
            <span>Hotel &amp; Flight</span>
            <Plane className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{stats.travel_discount || 0}</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-emerald-500/30">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span>Approved</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{stats.approved || 0}</p>
        </div>
      </div>

      {/* Category Pills + Search + Status Filter */}
      <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'All Requests' },
            { id: 'speaker', label: 'Speaker Applications' },
            { id: 'delegation', label: 'Corporate & VIP Delegations' },
            { id: 'travel_discount', label: 'Partner Hotel & Flight Discounts' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTypeFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                typeFilter === tab.id
                  ? 'bg-zinc-900 dark:bg-amber-400 text-white dark:text-zinc-950 shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by expo, speaker topic, applicant name, company or email..."
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

          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <Filter className="w-3.5 h-3.5" />
              Status:
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-background border border-border text-xs font-bold text-foreground focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="new">Pending Review</option>
              <option value="in_progress">In Progress</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {error ? (
          <div className="p-8 text-center text-rose-500 text-sm font-semibold">{error}</div>
        ) : loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            <span className="text-xs font-bold">Loading requests...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Sparkles className="w-10 h-10 text-muted-foreground/40 mx-auto" />
            <p className="text-sm font-bold text-foreground">No requests found</p>
            <p className="text-xs text-muted-foreground">
              Speaker applications, corporate VIP delegations, and partner hotel/flight discount requests submitted on expo pages will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Expo &amp; Venue</th>
                  <th className="py-3.5 px-4">Applicant</th>
                  <th className="py-3.5 px-4">Company &amp; Summary</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Submitted</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {requests.map((item) => {
                  const sMeta = STATUS_META[item.status] || STATUS_META.new;
                  const tMeta = TYPE_META[item.requestType] || TYPE_META.speaker;
                  const TypeIcon = tMeta.icon;
                  const highlightSummary =
                    item.requestType === 'speaker'
                      ? item.sessionTopic || item.sessionFormat || 'Keynote Proposal'
                      : item.requestType === 'delegation'
                      ? `${item.teamSize || '5+'} Delegates${item.delegationInterests ? ` • ${item.delegationInterests}` : ''}`
                      : `${item.travelPreference || 'Hotel & Flight'} • ${item.guestsCount || '1'} Guests`;

                  return (
                    <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${tMeta.badge}`}>
                          <TypeIcon className="w-3 h-3" />
                          {tMeta.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-[220px]">
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

                      <td className="py-3.5 px-4 max-w-[260px]">
                        <p className="font-bold text-foreground flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">{item.company || '—'}</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{highlightSummary}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={item.status || 'new'}
                          onChange={(e) => handleQuickStatusChange(item._id, e.target.value)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border bg-transparent cursor-pointer ${sMeta.badge}`}
                        >
                          <option value="new" className="text-zinc-900 bg-white">Pending Review</option>
                          <option value="in_progress" className="text-zinc-900 bg-white">In Progress</option>
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
                            Review
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            disabled={deletingId === item._id}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors cursor-pointer disabled:opacity-50"
                            title="Delete request"
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

      {/* Detail Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-5 bg-zinc-950 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  {(TYPE_META[selectedRequest.requestType] || TYPE_META.speaker).label}
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
                  <span className="text-[10px] font-black uppercase text-muted-foreground">Applicant Contact</span>
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

              {/* Type-Specific Request Details */}
              {selectedRequest.requestType === 'speaker' && (
                <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-2.5 text-xs">
                  <div className="font-black uppercase text-purple-600 dark:text-purple-400 text-[10px]">
                    Keynote Speaker Proposal Details
                  </div>
                  <div>
                    <span className="font-bold text-foreground">Topic:</span>{' '}
                    <span className="text-foreground">{selectedRequest.sessionTopic || '—'}</span>
                  </div>
                  {selectedRequest.sessionFormat && (
                    <div>
                      <span className="font-bold text-foreground">Session Format:</span>{' '}
                      <span className="text-muted-foreground">{selectedRequest.sessionFormat}</span>
                    </div>
                  )}
                  {selectedRequest.speakerBio && (
                    <div>
                      <span className="font-bold text-foreground">Bio &amp; Credentials:</span>
                      <p className="text-muted-foreground mt-0.5 whitespace-pre-wrap">{selectedRequest.speakerBio}</p>
                    </div>
                  )}
                  {selectedRequest.linkedinUrl && (
                    <div>
                      <a
                        href={selectedRequest.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 font-bold hover:underline"
                      >
                        <span>Speaker Profile / LinkedIn</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {selectedRequest.requestType === 'delegation' && (
                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-2.5 text-xs">
                  <div className="font-black uppercase text-blue-600 dark:text-blue-400 text-[10px]">
                    Corporate Group &amp; VIP Delegation Details
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="font-bold text-foreground">Delegation Size:</span>{' '}
                      <span className="text-muted-foreground">{selectedRequest.teamSize || '—'}</span>
                    </div>
                    {selectedRequest.preferredDates && (
                      <div>
                        <span className="font-bold text-foreground">Preferred Dates:</span>{' '}
                        <span className="text-muted-foreground">{selectedRequest.preferredDates}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-foreground">Sourcing Goals &amp; Objectives:</span>
                    <p className="text-muted-foreground mt-0.5 whitespace-pre-wrap">{selectedRequest.delegationInterests || '—'}</p>
                  </div>
                </div>
              )}

              {selectedRequest.requestType === 'travel_discount' && (
                <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-2.5 text-xs">
                  <div className="font-black uppercase text-rose-600 dark:text-rose-400 text-[10px]">
                    Partner Hotel &amp; Flight Discount Details
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="font-bold text-foreground">Preference:</span>{' '}
                      <span className="text-muted-foreground">{selectedRequest.travelPreference || '—'}</span>
                    </div>
                    <div>
                      <span className="font-bold text-foreground">Rooms / Travelers:</span>{' '}
                      <span className="text-muted-foreground">{selectedRequest.guestsCount || '—'}</span>
                    </div>
                    {selectedRequest.checkInDate && (
                      <div>
                        <span className="font-bold text-foreground">Check-In / Arrival:</span>{' '}
                        <span className="text-muted-foreground">{selectedRequest.checkInDate}</span>
                      </div>
                    )}
                    {selectedRequest.checkOutDate && (
                      <div>
                        <span className="font-bold text-foreground">Check-Out / Departure:</span>{' '}
                        <span className="text-muted-foreground">{selectedRequest.checkOutDate}</span>
                      </div>
                    )}
                    {selectedRequest.departureCity && (
                      <div>
                        <span className="font-bold text-foreground">Origin City:</span>{' '}
                        <span className="text-muted-foreground">{selectedRequest.departureCity}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedRequest.message && (
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground">Additional Message / Notes</label>
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border text-sm text-foreground whitespace-pre-wrap">
                    {selectedRequest.message}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Status</label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-bold text-foreground"
                  >
                    <option value="new">Pending Review</option>
                    <option value="in_progress">In Progress</option>
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
                <label className="text-xs font-bold text-foreground">Admin Notes (Corporate Code / Response Info)</label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add speaker confirmation details, VIP concierge assignment, or hotel/flight corporate discount codes..."
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

