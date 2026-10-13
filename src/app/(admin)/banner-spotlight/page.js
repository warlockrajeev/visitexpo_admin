'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  MapPin,
  Building,
  Eye,
  Trash2,
  RefreshCw,
  Search,
  Plus,
  Loader2,
  AlertCircle,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Filter,
  ArrowRight,
  TrendingUp,
  Sliders,
  Play,
  Pause
} from 'lucide-react';
import Swal from 'sweetalert2';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')
    ? 'https://api.visitexpo.in/api'
    : 'http://localhost:5000/api');

export default function AdminBannerSpotlightPage() {
  const { accessToken } = useAuth();

  // State
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved' | 'all' | 'rejected'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [directModalOpen, setDirectModalOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(null);

  // Approval form state
  const [approveForm, setApproveForm] = useState({
    priority: 5,
    days: 14,
    badgeText: 'Growth Spotlight',
    adminNotes: 'Approved for homepage hero carousel rotation.'
  });

  // Reject form state
  const [rejectNotes, setRejectNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Direct banner creation state
  const [eventsList, setEventsList] = useState([]);
  const [directForm, setDirectForm] = useState({
    eventId: '',
    headline: '',
    subheadline: '',
    bannerImage: '',
    ctaText: 'Explore Exhibition',
    ctaLink: '',
    badgeText: 'Featured Spotlight',
    priority: 5,
    days: 30
  });

  // Fetch banners list
  const fetchBanners = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const res = await axios.get(`${API_URL}/banners/admin/all`, { headers });
      if (res.data?.success) {
        setBanners(res.data.banners || []);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to load banner requests:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all events for direct banner modal
  const fetchEventsForDirect = async () => {
    if (!accessToken) return;
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const res = await axios.get(`${API_URL}/events?limit=200`, { headers });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setEventsList(res.data.data);
      }
    } catch (err) {
      console.warn('Could not fetch events list:', err.message);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchBanners();
      fetchEventsForDirect();
    }
  }, [accessToken]);

  // Handle Approve Submission
  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBanner) return;
    setActionLoading(true);
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const res = await axios.patch(
        `${API_URL}/banners/admin/${selectedBanner._id}/status`,
        {
          status: 'approved',
          priority: Number(approveForm.priority) || 5,
          days: Number(approveForm.days) || 14,
          badgeText: approveForm.badgeText || 'Growth Spotlight',
          adminNotes: approveForm.adminNotes
        },
        { headers }
      );

      if (res.data?.success) {
        setApproveModalOpen(false);
        Swal.fire({
          icon: 'success',
          title: 'Banner Approved & Activated!',
          text: `"${selectedBanner.headline}" is now live on the VisitExpo Homepage Hero Slider.`,
          confirmButtonColor: '#4f46e5'
        });
        fetchBanners();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Approval Failed',
        text: err.response?.data?.message || err.message
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject Submission
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBanner) return;
    setActionLoading(true);
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const res = await axios.patch(
        `${API_URL}/banners/admin/${selectedBanner._id}/status`,
        {
          status: 'rejected',
          adminNotes: rejectNotes || 'Request does not meet landing page banner guidelines.'
        },
        { headers }
      );

      if (res.data?.success) {
        setRejectModalOpen(false);
        Swal.fire({
          icon: 'info',
          title: 'Request Returned / Rejected',
          text: 'The organizer has been notified with your feedback in their dashboard.',
          confirmButtonColor: '#4f46e5'
        });
        fetchBanners();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Action Failed',
        text: err.response?.data?.message || err.message
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Active/Pause state
  const handleToggleActive = async (banner) => {
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const newActive = !banner.isActive;
      const res = await axios.patch(
        `${API_URL}/banners/admin/${banner._id}/status`,
        {
          isActive: newActive
        },
        { headers }
      );

      if (res.data?.success) {
        Swal.fire({
          icon: 'success',
          title: newActive ? 'Banner Resumed' : 'Banner Paused',
          text: newActive ? 'Banner is active in homepage carousel.' : 'Banner rotation paused from homepage.',
          timer: 1500,
          showConfirmButton: false
        });
        fetchBanners();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || err.message });
    }
  };

  // Delete banner permanently
  const handleDelete = async (id, title) => {
    const result = await Swal.fire({
      title: 'Delete Banner Record?',
      text: `Are you sure you want to delete spotlight for "${title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
      try {
        const headers = { Authorization: `Bearer ${accessToken}` };
        const res = await axios.delete(`${API_URL}/banners/admin/${id}`, { headers });
        if (res.data?.success) {
          Swal.fire({ icon: 'success', title: 'Deleted', text: 'Banner record removed.' });
          fetchBanners();
        }
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Delete Failed', text: err.response?.data?.message || err.message });
      }
    }
  };

  // Direct Banner Creation by Admin
  const handleDirectSubmit = async (e) => {
    e.preventDefault();
    if (!directForm.eventId) {
      Swal.fire({ icon: 'warning', title: 'Select Event', text: 'Please select an event to feature.' });
      return;
    }
    setActionLoading(true);
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const res = await axios.post(`${API_URL}/banners/admin/direct`, directForm, { headers });
      if (res.data?.success) {
        setDirectModalOpen(false);
        Swal.fire({
          icon: 'success',
          title: 'Direct Banner Created!',
          text: 'The event is now active on the Landing Page Hero Slider.',
          confirmButtonColor: '#4f46e5'
        });
        fetchBanners();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Creation Failed', text: err.response?.data?.message || err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Filter banners based on activeTab and searchQuery
  const filteredBanners = banners.filter((b) => {
    if (activeTab === 'pending' && b.status !== 'pending') return false;
    if (activeTab === 'approved' && b.status !== 'approved') return false;
    if (activeTab === 'rejected' && b.status !== 'rejected') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchHeadline = b.headline?.toLowerCase().includes(q);
      const matchEvent = b.event?.title?.toLowerCase().includes(q);
      const matchOrg = b.organizer?.name?.toLowerCase().includes(q) || b.organizer?.company?.toLowerCase().includes(q);
      if (!matchHeadline && !matchEvent && !matchOrg) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-20 p-4 sm:p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Award className="h-3 w-3 text-amber-400" />
              Growth Plan Feature
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              Homepage Hero Carousel Moderation
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Banner Spotlight Moderation
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
            Review, curate, and approve organizer requests to feature flagship exhibitions directly on the public VisitExpo landing page carousel.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchBanners}
            className="p-2.5 rounded-xl border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setDirectModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black px-4 py-2.5 text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Direct Spotlight</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('pending')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-amber-500/10 border-amber-500/40 ring-2 ring-amber-500/20'
              : 'bg-card border-border hover:bg-secondary/40'
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Pending Review</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400 mt-2">{stats.pending || 0}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Awaiting Curation</div>
        </div>

        <div
          onClick={() => setActiveTab('approved')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'approved'
              ? 'bg-emerald-500/10 border-emerald-500/40 ring-2 ring-emerald-500/20'
              : 'bg-card border-border hover:bg-secondary/40'
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Live on Homepage</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 mt-2">{stats.approved || 0}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Active Rotating Banners</div>
        </div>

        <div
          onClick={() => setActiveTab('all')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-indigo-500/10 border-indigo-500/40 ring-2 ring-indigo-500/20'
              : 'bg-card border-border hover:bg-secondary/40'
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Total Submissions</span>
            <Award className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-foreground mt-2">{stats.total || banners.length}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Lifetime Requests</div>
        </div>

        <div
          onClick={() => setActiveTab('rejected')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'rejected'
              ? 'bg-red-500/10 border-red-500/40 ring-2 ring-red-500/20'
              : 'bg-card border-border hover:bg-secondary/40'
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Rejected / Feedback</span>
            <XCircle className="h-4 w-4 text-red-400" />
          </div>
          <div className="text-3xl font-black text-red-400 mt-2">{stats.rejected || 0}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Returned to Organizer</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'pending', label: 'Pending Approval', count: stats.pending },
            { id: 'approved', label: 'Live Banners', count: stats.approved },
            { id: 'all', label: 'All Requests', count: banners.length },
            { id: 'rejected', label: 'Rejected', count: stats.rejected }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-secondary text-muted-foreground'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search event, organizer, headline..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-secondary text-foreground text-xs border border-border focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Main List */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Loading banner spotlights...</p>
          </div>
        ) : filteredBanners.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="h-14 w-14 rounded-full bg-secondary text-muted-foreground mx-auto flex items-center justify-center">
              <Award className="h-6 w-6 opacity-40" />
            </div>
            <h3 className="text-sm font-bold text-foreground">No Banner Requests in this View</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {activeTab === 'pending'
                ? 'All organizer banner spotlight submissions have been moderated.'
                : 'No banner spotlight records match the current filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredBanners.map((b) => {
              const isGrowth = b.organizer?.hasGrowthPlan || b.organizer?.plan === 'growth';

              return (
                <div key={b._id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:bg-secondary/20 transition-colors">
                  {/* Left: Thumbnail & Banner Details */}
                  <div className="flex items-start gap-4">
                    <div className="relative group shrink-0">
                      <img
                        src={b.bannerImage || b.event?.bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400'}
                        alt={b.headline}
                        className="w-32 h-20 sm:w-44 sm:h-26 object-cover rounded-2xl border border-border shadow-xs"
                      />
                      <button
                        onClick={() => {
                          setSelectedBanner(b);
                          setPreviewModalOpen(true);
                        }}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center text-white text-xs font-bold gap-1 cursor-pointer"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Preview</span>
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {/* Badges bar */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status badge */}
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          b.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : b.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {b.status === 'approved' && <CheckCircle2 className="h-3 w-3" />}
                          {b.status === 'pending' && <Clock className="h-3 w-3" />}
                          {b.status === 'rejected' && <XCircle className="h-3 w-3" />}
                          <span className="uppercase">{b.status}</span>
                        </span>

                        {/* Active toggle indicator */}
                        {b.status === 'approved' && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            b.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-500/20 text-zinc-400'
                          }`}>
                            {b.isActive ? '● Live Rotating' : '⏸️ Paused'}
                          </span>
                        )}

                        <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                          Priority: {b.priority || 1}
                        </span>

                        <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Badge: &quot;{b.badgeText || 'Spotlight'}&quot;
                        </span>
                      </div>

                      {/* Headline */}
                      <h3 className="text-base font-bold text-foreground">
                        {b.headline}
                      </h3>

                      {/* Subheadline */}
                      <p className="text-xs text-muted-foreground line-clamp-2 max-w-2xl leading-relaxed">
                        {b.subheadline}
                      </p>

                      {/* Event & Organizer Meta */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-1">
                        <span>Exhibition: <strong className="text-foreground">{b.event?.title || 'Unknown Event'}</strong></span>
                        {b.event?.city && <span>&bull; 📍 {b.event.city}</span>}
                        {b.event?.dates && <span>&bull; 📅 {b.event.dates}</span>}
                        <span>&bull; Organizer: <strong className="text-foreground">{b.organizer?.name || 'Organizer'}</strong> ({b.organizer?.email})</span>
                        {isGrowth && (
                          <span className="text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                            ★ Growth Plan Verified
                          </span>
                        )}
                      </div>

                      {/* Admin feedback note if exists */}
                      {b.adminNotes && (
                        <div className="mt-1 text-[11px] text-muted-foreground bg-secondary/60 p-2 rounded-xl border border-border">
                          <strong>Admin Note:</strong> {b.adminNotes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Moderation Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-end lg:self-center">
                    {/* Live Preview Button */}
                    <button
                      onClick={() => {
                        setSelectedBanner(b);
                        setPreviewModalOpen(true);
                      }}
                      className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      title="Preview on Landing Page"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="hidden sm:inline">Preview</span>
                    </button>

                    {/* Pending Actions: Approve & Reject */}
                    {b.status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedBanner(b);
                            setApproveForm({
                              priority: 5,
                              days: b.requestedDays || 14,
                              badgeText: b.badgeText || 'Growth Spotlight',
                              adminNotes: 'Approved for homepage hero carousel rotation.'
                            });
                            setApproveModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Approve &amp; Activate</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedBanner(b);
                            setRejectNotes('');
                            setRejectModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-all cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}

                    {/* Approved Actions: Toggle Pause & Edit */}
                    {b.status === 'approved' && (
                      <>
                        <button
                          onClick={() => handleToggleActive(b)}
                          className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            b.isActive
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                          }`}
                          title={b.isActive ? 'Pause Rotation' : 'Resume Rotation'}
                        >
                          {b.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          <span className="hidden sm:inline">{b.isActive ? 'Pause' : 'Resume'}</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedBanner(b);
                            setApproveForm({
                              priority: b.priority || 5,
                              days: 14,
                              badgeText: b.badgeText || 'Growth Spotlight',
                              adminNotes: b.adminNotes || ''
                            });
                            setApproveModalOpen(true);
                          }}
                          className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold transition-all cursor-pointer"
                          title="Adjust Settings"
                        >
                          <Sliders className="h-4 w-4" />
                        </button>
                      </>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(b._id, b.headline)}
                      className="p-2 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                      title="Delete record"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* APPROVE MODAL                                                       */}
      {/* =================================================================== */}
      {approveModalOpen && selectedBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-5 p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Admin Moderation
                </span>
                <h3 className="text-base font-black text-foreground">
                  Approve Banner Spotlight
                </h3>
              </div>
              <button
                onClick={() => setApproveModalOpen(false)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-xs text-muted-foreground">
              Event: <strong className="text-foreground">{selectedBanner.event?.title}</strong><br />
              Headline: <strong className="text-foreground">{selectedBanner.headline}</strong>
            </div>

            <form onSubmit={handleApproveSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    Carousel Priority (1 - 10)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={approveForm.priority}
                    onChange={(e) => setApproveForm({ ...approveForm, priority: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-border bg-secondary text-foreground text-xs"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">Higher appears first in slider</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    Active Duration (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={approveForm.days}
                    onChange={(e) => setApproveForm({ ...approveForm, days: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-border bg-secondary text-foreground text-xs"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">Default 14 days</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">
                  Spotlight Badge Text
                </label>
                <input
                  type="text"
                  value={approveForm.badgeText}
                  onChange={(e) => setApproveForm({ ...approveForm, badgeText: e.target.value })}
                  placeholder="e.g. Growth Spotlight, VIP Exhibition"
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-secondary text-foreground text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">
                  Approval Notes / Feedback
                </label>
                <textarea
                  rows={2}
                  value={approveForm.adminNotes}
                  onChange={(e) => setApproveForm({ ...approveForm, adminNotes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-secondary text-foreground text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setApproveModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  <span>Confirm &amp; Activate Live</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* REJECT MODAL                                                        */}
      {/* =================================================================== */}
      {rejectModalOpen && selectedBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl w-full max-w-md overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-black text-foreground text-red-400 flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                <span>Return / Reject Banner Request</span>
              </h3>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Provide feedback to the organizer explaining why this banner request cannot be approved (e.g., image resolution too low, text watermark, incorrect category).
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">
                  Reason for Rejection *
                </label>
                <textarea
                  rows={3}
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="e.g. Please upload a high-resolution 16:9 banner image without heavy promotional text overlay."
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-secondary text-foreground text-xs"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-md disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* LIVE SIMULATION PREVIEW MODAL                                       */}
      {/* =================================================================== */}
      {previewModalOpen && selectedBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 text-white">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  ⚡ Hero Carousel Simulation
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  &bull; {selectedBanner.event?.title}
                </span>
              </div>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Slider Mock Card (Compact Preview) */}
            <div className="rounded-3xl overflow-hidden border border-zinc-700 bg-zinc-900 relative shadow-2xl">
              <div className="relative h-48 sm:h-56 w-full overflow-hidden">
                <img
                  src={selectedBanner.bannerImage || selectedBanner.event?.bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600'}
                  alt={selectedBanner.headline}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/20" />
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/60 to-transparent" />

                <div className="absolute inset-0 flex flex-col justify-end p-5 z-10 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-zinc-950">
                      {selectedBanner.badgeText || 'Growth Spotlight'}
                    </span>
                    {selectedBanner.event?.city && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white backdrop-blur-md">
                        📍 {selectedBanner.event.city}
                      </span>
                    )}
                    {selectedBanner.event?.dates && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white backdrop-blur-md">
                        📅 {selectedBanner.event.dates}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg sm:text-2xl font-black text-white leading-tight">
                    {selectedBanner.headline}
                  </h3>

                  <p className="text-xs sm:text-sm text-zinc-300 line-clamp-2 max-w-2xl leading-relaxed">
                    {selectedBanner.subheadline}
                  </p>

                  <div className="pt-2 flex items-center gap-4">
                    <span className="px-6 py-3 rounded-2xl bg-amber-400 text-zinc-950 font-black text-xs shadow-lg">
                      {selectedBanner.ctaText || 'Explore Exhibition'} &rarr;
                    </span>
                    <span className="text-xs text-zinc-400">
                      Presented by <strong className="text-white">{selectedBanner.organizer?.company || selectedBanner.organizer?.name}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* DIRECT BANNER CREATION BY ADMIN                                     */}
      {/* =================================================================== */}
      {directModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl space-y-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Admin Direct Feature
                </span>
                <h3 className="text-base font-black text-foreground">
                  Create Direct Homepage Banner Spotlight
                </h3>
              </div>
              <button
                onClick={() => setDirectModalOpen(false)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleDirectSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Select Exhibition *</label>
                <select
                  value={directForm.eventId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const evt = eventsList.find(x => String(x._id) === String(id));
                    setDirectForm(prev => ({
                      ...prev,
                      eventId: id,
                      headline: evt?.title || '',
                      subheadline: evt?.description ? evt.description.substring(0, 180) : '',
                      bannerImage: evt?.bannerImage || evt?.featuredImage || '',
                      ctaLink: `/events?highlight=${evt?.slug || id}`
                    }));
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-secondary text-foreground text-xs"
                  required
                >
                  <option value="">-- Choose Exhibition --</option>
                  {eventsList.map(e => (
                    <option key={e._id} value={e._id}>{e.title} {e.city ? `(${e.city})` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Headline *</label>
                <input
                  type="text"
                  value={directForm.headline}
                  onChange={(e) => setDirectForm({ ...directForm, headline: e.target.value })}
                  placeholder="Banner Headline"
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-secondary text-foreground text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Subheadline *</label>
                <textarea
                  rows={2}
                  value={directForm.subheadline}
                  onChange={(e) => setDirectForm({ ...directForm, subheadline: e.target.value })}
                  placeholder="Key highlight pitch..."
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-secondary text-foreground text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Banner Image URL *</label>
                <input
                  type="url"
                  value={directForm.bannerImage}
                  onChange={(e) => setDirectForm({ ...directForm, bannerImage: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-secondary text-foreground text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Badge Text</label>
                  <input
                    type="text"
                    value={directForm.badgeText}
                    onChange={(e) => setDirectForm({ ...directForm, badgeText: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-border bg-secondary text-foreground text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Priority (1-10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={directForm.priority}
                    onChange={(e) => setDirectForm({ ...directForm, priority: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-border bg-secondary text-foreground text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Duration (Days)</label>
                  <input
                    type="number"
                    min={1}
                    value={directForm.days}
                    onChange={(e) => setDirectForm({ ...directForm, days: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-border bg-secondary text-foreground text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setDirectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black shadow-md disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Award className="h-3.5 w-3.5" />}
                  <span>Activate Direct Spotlight</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
