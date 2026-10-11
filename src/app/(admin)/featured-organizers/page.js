'use client';

/**
 * @file featured-organizers/page.js
 * @description Super Admin page to curate homepage Featured Organizers,
 * review incoming Enterprise organizer applications, and manually add/edit featured partners.
 */

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import Swal from 'sweetalert2';
import {
  Award,
  Crown,
  Building2,
  Building,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Edit3,
  Trash2,
  Eye,
  Globe,
  Upload,
  RefreshCw,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Check,
  Loader2,
  Phone,
  Mail,
  Tag,
  Palette
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const PRESET_COLORS = [
  { name: 'Navy Blue', brand: '#002D62', accent: '#00A3E0' },
  { name: 'Royal Blue', brand: '#1E40AF', accent: '#3B82F6' },
  { name: 'Crimson Red', brand: '#DC2626', accent: '#F59E0B' },
  { name: 'Deep Indigo', brand: '#1E3A8A', accent: '#0284C7' },
  { name: 'Sky Tech', brand: '#0284C7', accent: '#0EA5E9' },
  { name: 'Ruby Dark', brand: '#B91C1C', accent: '#EF4444' },
  { name: 'Emerald Green', brand: '#047857', accent: '#10B981' },
  { name: 'Amber Bronze', brand: '#B45309', accent: '#F59E0B' },
  { name: 'Violet Purple', brand: '#4338CA', accent: '#6366F1' },
  { name: 'Forest Green', brand: '#15803D', accent: '#22C55E' }
];

const CATEGORIES = [
  'Trade & Industry',
  'Technology & AI',
  'Healthcare & Pharma',
  'Automotive & EV',
  'Construction & Infra',
  'Agri & Food Tech',
  'Travel & Tourism',
  'Textile & Fashion',
  'Consumer & Retail'
];

export default function AdminFeaturedOrganizersPage() {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({
    totalFeatured: 0,
    activeCount: 0,
    pendingCount: 0,
    rejectedCount: 0
  });

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'applications' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  // Approval / Rejection Modal State
  const [approvalModalItem, setApprovalModalItem] = useState(null);
  const [approvalBadge, setApprovalBadge] = useState('Enterprise Partner');
  const [approvalOrder, setApprovalOrder] = useState(1);
  const [approvalCount, setApprovalCount] = useState(10);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [processingStatus, setProcessingStatus] = useState(false);

  // Rejection Modal State
  const [rejectionModalItem, setRejectionModalItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    website: '',
    logoUrl: '',
    brandColor: '#002D62',
    accentColor: '#00A3E0',
    badge: 'Featured Organizer',
    scope: '',
    category: 'Trade & Industry',
    eventsCount: 0,
    displayOrder: 1,
    isActive: true
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/featured-organizers/admin/all`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
      });
      if (res.data?.success) {
        setItems(res.data.data || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to fetch featured organizers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [accessToken]);

  // Filtered lists
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Tab matching
      if (activeTab === 'live') {
        if (item.status !== 'approved') return false;
      } else if (activeTab === 'applications') {
        if (item.status === 'approved' && !item.applicantUser) return false;
        // include pending or applications with applicantUser
        if (!item.applicantUser && item.status !== 'pending') return false;
      }

      // Status dropdown filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'active' && (!item.isActive || item.status !== 'approved')) return false;
        if (statusFilter === 'inactive' && (item.isActive || item.status !== 'approved')) return false;
        if (['pending', 'approved', 'rejected'].includes(statusFilter) && item.status !== statusFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (item.name || '').toLowerCase().includes(q);
        const shortMatch = (item.shortName || '').toLowerCase().includes(q);
        const emailMatch = (item.applicantEmail || '').toLowerCase().includes(q);
        const badgeMatch = (item.badge || '').toLowerCase().includes(q);
        if (!nameMatch && !shortMatch && !emailMatch && !badgeMatch) return false;
      }

      return true;
    });
  }, [items, activeTab, statusFilter, searchQuery]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      shortName: '',
      website: '',
      logoUrl: '',
      brandColor: '#002D62',
      accentColor: '#00A3E0',
      badge: 'Featured Organizer',
      scope: '',
      category: 'Trade & Industry',
      eventsCount: 0,
      displayOrder: (stats.totalFeatured || 0) + 1,
      isActive: true
    });
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      shortName: item.shortName || '',
      website: item.website || '',
      logoUrl: item.logoUrl || '',
      brandColor: item.brandColor || '#002D62',
      accentColor: item.accentColor || '#00A3E0',
      badge: item.badge || 'Featured Organizer',
      scope: item.scope || '',
      category: item.category || 'Trade & Industry',
      eventsCount: item.eventsCount || 0,
      displayOrder: item.displayOrder || 1,
      isActive: item.isActive !== undefined ? item.isActive : true
    });
    setIsFormModalOpen(true);
  };

  // Handle Logo Upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      Swal.fire({ icon: 'error', title: 'Invalid File', text: 'Please select an image file.' });
      return;
    }

    const uploadPayload = new FormData();
    uploadPayload.append('file', file);

    try {
      setUploadingLogo(true);
      const res = await axios.post(`${API_URL}/upload`, uploadPayload, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        }
      });
      if (res.data?.success && res.data.url) {
        setFormData((prev) => ({ ...prev, logoUrl: res.data.url }));
        Swal.fire({
          icon: 'success',
          title: 'Logo Uploaded',
          text: 'Image uploaded successfully!',
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: err.response?.data?.error || 'Could not upload image.'
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  // Save (Create or Update) Featured Organizer
  const handleSaveOrganizer = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Organizer name is required.' });
      return;
    }

    try {
      setSavingItem(true);
      if (editingItem) {
        // Update
        const res = await axios.put(`${API_URL}/featured-organizers/admin/${editingItem._id}`, formData, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
        });
        if (res.data?.success) {
          Swal.fire({
            icon: 'success',
            title: 'Updated Successfully',
            text: 'Featured organizer details updated.',
            timer: 1500,
            showConfirmButton: false
          });
          setIsFormModalOpen(false);
          fetchData();
        }
      } else {
        // Create
        const res = await axios.post(`${API_URL}/featured-organizers/admin`, formData, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
        });
        if (res.data?.success) {
          Swal.fire({
            icon: 'success',
            title: 'Added Successfully',
            text: 'Featured organizer added to directory.',
            timer: 1500,
            showConfirmButton: false
          });
          setIsFormModalOpen(false);
          fetchData();
        }
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error Saving',
        text: err.response?.data?.error || 'Failed to save featured organizer.'
      });
    } finally {
      setSavingItem(false);
    }
  };

  // Toggle Active switch
  const handleToggleActive = async (item) => {
    try {
      const res = await axios.patch(
        `${API_URL}/featured-organizers/admin/${item._id}/toggle-active`,
        {},
        { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} }
      );
      if (res.data?.success) {
        setItems((prev) =>
          prev.map((it) => (it._id === item._id ? { ...it, isActive: res.data.isActive } : it))
        );
        setStats((prev) => ({
          ...prev,
          activeCount: res.data.isActive ? prev.activeCount + 1 : prev.activeCount - 1
        }));
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Could not toggle active state.' });
    }
  };

  // Delete Organizer
  const handleDeleteOrganizer = async (item) => {
    const confirm = await Swal.fire({
      title: 'Delete Featured Organizer?',
      text: `Remove "${item.name}" from featured organizers list? This will remove them from the homepage carousel.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await axios.delete(`${API_URL}/featured-organizers/admin/${item._id}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
      });
      if (res.data?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Deleted',
          text: 'Organizer removed from featured list.',
          timer: 1500,
          showConfirmButton: false
        });
        fetchData();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Delete Failed', text: err.response?.data?.error || 'Failed to delete.' });
    }
  };

  // Open Approval Modal
  const handleOpenApproveModal = (item) => {
    setApprovalModalItem(item);
    setApprovalBadge(item.badge || 'Enterprise Partner');
    setApprovalOrder(item.displayOrder || 1);
    setApprovalCount(item.eventsCount || 10);
    setApprovalNotes('');
  };

  // Confirm Approval
  const handleConfirmApproval = async () => {
    if (!approvalModalItem) return;
    try {
      setProcessingStatus(true);
      const res = await axios.patch(
        `${API_URL}/featured-organizers/admin/${approvalModalItem._id}/status`,
        {
          status: 'approved',
          badge: approvalBadge,
          displayOrder: Number(approvalOrder),
          eventsCount: Number(approvalCount),
          adminReviewNotes: approvalNotes,
          isActive: true
        },
        { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} }
      );
      if (res.data?.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Application Approved!',
          text: `"${approvalModalItem.name}" is now featured on the VisitExpo homepage!`,
          confirmButtonColor: '#FFCC00',
          confirmButtonText: 'Done'
        });
        setApprovalModalItem(null);
        fetchData();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Approval Failed',
        text: err.response?.data?.error || 'Could not approve application.'
      });
    } finally {
      setProcessingStatus(false);
    }
  };

  // Open Rejection Modal
  const handleOpenRejectModal = (item) => {
    setRejectionModalItem(item);
    setRejectionReason('');
  };

  // Confirm Rejection
  const handleConfirmRejection = async () => {
    if (!rejectionModalItem) return;
    try {
      setProcessingStatus(true);
      const res = await axios.patch(
        `${API_URL}/featured-organizers/admin/${rejectionModalItem._id}/status`,
        {
          status: 'rejected',
          adminReviewNotes: rejectionReason,
          isActive: false
        },
        { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} }
      );
      if (res.data?.success) {
        Swal.fire({
          icon: 'info',
          title: 'Application Status Updated',
          text: 'The organizer has been notified with your feedback.',
          timer: 2000,
          showConfirmButton: false
        });
        setRejectionModalItem(null);
        fetchData();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Rejection Failed',
        text: err.response?.data?.error || 'Could not update status.'
      });
    } finally {
      setProcessingStatus(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
              <Award className="h-7 w-7 text-amber-500" />
              Featured Organizers Management
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
              <Crown className="h-3 w-3" />
              Enterprise Tier
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Curate homepage featured organizers, review applications from Enterprise partners, and manage live branding showcase.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            title="Refresh Data"
            className="h-10 w-10 rounded-xl border border-border bg-card hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Featured Organizer</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Approved Featured</span>
            <Award className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground">{stats.totalFeatured}</div>
          <span className="text-[11px] text-muted-foreground">In verified directory</span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Active on Homepage</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{stats.activeCount}</div>
          <span className="text-[11px] text-muted-foreground">Live on carousel track</span>
        </div>

        <div
          onClick={() => setActiveTab('applications')}
          className={`p-4 rounded-2xl border shadow-xs space-y-1 cursor-pointer transition-all ${
            stats.pendingCount > 0
              ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/15 ring-2 ring-amber-500/20'
              : 'bg-card border-border hover:bg-secondary/40'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 font-bold">
            <span>Enterprise Applications</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{stats.pendingCount}</div>
          <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
            {stats.pendingCount > 0 ? 'Pending Super Admin review' : 'No pending reviews'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Hidden / Rejected</span>
            <AlertCircle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-muted-foreground">
            {stats.rejectedCount + (stats.totalFeatured - stats.activeCount)}
          </div>
          <span className="text-[11px] text-muted-foreground">Inactive or needs changes</span>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-border">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'live'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Live Showcase ({stats.totalFeatured})
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'applications'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Enterprise Applications</span>
            {stats.pendingCount > 0 && (
              <span className="h-4 min-w-4 px-1 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                {stats.pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Records ({items.length})
          </button>
        </div>

        {/* Search & Status Filter */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-56 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search organizer..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border bg-card text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-hidden"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-hidden"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-3xl p-8 space-y-4">
          <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
            <Building2 className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">No Featured Organizers Found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery ? 'Try clearing your search query or filters.' : 'Click "Add Featured Organizer" to create one directly.'}
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
          >
            <Plus className="h-4 w-4" />
            Add First Organizer
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Table / Cards View */}
          <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-muted-foreground font-semibold">
                  <th className="py-3 px-4 w-12 text-center">Order</th>
                  <th className="py-3 px-4">Organizer Card Preview</th>
                  <th className="py-3 px-4">Brand &amp; Details</th>
                  <th className="py-3 px-4">Badge &amp; Category</th>
                  <th className="py-3 px-4 text-center">Event Count</th>
                  <th className="py-3 px-4 text-center">Homepage Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.map((item) => {
                  const isApp = Boolean(item.applicantUser);
                  const isPendingReview = item.status === 'pending';

                  return (
                    <tr
                      key={item._id}
                      className={`hover:bg-secondary/20 transition-colors ${
                        isPendingReview ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      {/* Order Column */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-muted-foreground">
                        #{item.displayOrder || 1}
                      </td>

                      {/* Mini 10times Card Preview */}
                      <td className="py-3.5 px-4">
                        <div className="w-24 h-20 bg-white rounded-lg flex flex-col items-center justify-center p-1.5 border border-zinc-200/90 shadow-2xs relative select-none">
                          {item.eventsCount > 0 && (
                            <span className="absolute top-1 right-1 text-[7px] font-bold px-1 py-0.2 rounded-full bg-zinc-100 text-zinc-600">
                              {item.eventsCount}
                            </span>
                          )}
                          <div className="flex-1 flex items-center justify-center w-full px-1">
                            {item.logoUrl ? (
                              <img
                                src={item.logoUrl}
                                alt={item.name}
                                className="max-h-9 max-w-[70px] object-contain rounded-xs"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-center">
                                <span
                                  className="text-[10px] font-black tracking-tight"
                                  style={{ color: item.brandColor || '#002D62' }}
                                >
                                  {item.shortName || item.name}
                                </span>
                                <span className="text-[6.5px] text-zinc-400 uppercase font-semibold">
                                  {item.badge || 'Organizer'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Name & Organization details */}
                      <td className="py-3.5 px-4 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-foreground text-sm">
                            {item.name}
                          </span>
                          {isApp && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              <Crown className="h-2.5 w-2.5" />
                              Enterprise Application
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-[11px]">
                          {item.shortName && (
                            <span>Short: <strong className="text-foreground">{item.shortName}</strong></span>
                          )}
                          {item.website && (
                            <a
                              href={item.website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              <Globe className="h-3 w-3" />
                              <span>Website</span>
                            </a>
                          )}
                          {item.applicantEmail && (
                            <span className="text-muted-foreground">
                              Email: <strong>{item.applicantEmail}</strong>
                            </span>
                          )}
                        </div>

                        {/* Brand Swatches */}
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/10 inline-block shadow-2xs"
                            style={{ backgroundColor: item.brandColor || '#002D62' }}
                            title={`Brand Color: ${item.brandColor}`}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/10 inline-block shadow-2xs"
                            style={{ backgroundColor: item.accentColor || '#00A3E0' }}
                            title={`Accent Color: ${item.accentColor}`}
                          />
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {item.brandColor} / {item.accentColor}
                          </span>
                        </div>
                      </td>

                      {/* Badge Tagline & Category */}
                      <td className="py-3.5 px-4 space-y-1">
                        <div>
                          <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-secondary text-foreground border border-border">
                            {item.badge || 'Featured'}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground block">
                          {item.category || 'Trade & Industry'}
                        </span>
                      </td>

                      {/* Event Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-sm font-black font-mono text-foreground">
                          {item.eventsCount || 0}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">Events</span>
                      </td>

                      {/* Active Status Switch / Status Pill */}
                      <td className="py-3.5 px-4 text-center">
                        {isPendingReview ? (
                          <div className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/30 animate-pulse">
                            <Clock className="h-3 w-3" />
                            Pending Review
                          </div>
                        ) : item.status === 'rejected' ? (
                          <div className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20">
                            <AlertCircle className="h-3 w-3" />
                            Rejected
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleToggleActive(item)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                item.isActive ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                  item.isActive ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                            <span className="text-[10px] font-bold text-muted-foreground">
                              {item.isActive ? 'Active Live' : 'Hidden'}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPendingReview ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenApproveModal(item)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                              >
                                <Check className="h-3 w-3" />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenRejectModal(item)}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 font-bold text-xs transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(item)}
                                title="Edit Details"
                                className="h-8 w-8 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground flex items-center justify-center transition-colors cursor-pointer border border-border"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteOrganizer(item)}
                                title="Delete Organizer"
                                className="h-8 w-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 flex items-center justify-center transition-colors cursor-pointer border border-rose-500/20"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 1: ADD / EDIT FEATURED ORGANIZER
      ========================================== */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="max-w-3xl w-full bg-card border border-border rounded-3xl shadow-2xl overflow-hidden my-8">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {editingItem ? 'Edit Featured Organizer' : 'Add New Featured Organizer'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Configure branding, badges, order, and live homepage card representation.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOrganizer} className="p-6 space-y-6">
              {/* Live Preview Inside Modal */}
              <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Real-time Card Preview
                  </span>
                  <span className="text-xs text-foreground font-semibold">
                    Matches VisitExpo homepage carousel card
                  </span>
                </div>

                <div className="w-32 h-26 bg-white rounded-xl flex flex-col items-center justify-center p-2 border border-zinc-200/90 shadow-md relative select-none">
                  <span className="absolute top-1.5 right-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                    {formData.eventsCount || 0}
                  </span>
                  <div className="flex-1 flex items-center justify-center w-full px-1">
                    {formData.logoUrl ? (
                      <img
                        src={formData.logoUrl}
                        alt="Preview"
                        className="max-h-12 max-w-[90px] object-contain rounded-xs"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center">
                        <span
                          className="text-xs font-black tracking-tight"
                          style={{ color: formData.brandColor || '#002D62' }}
                        >
                          {formData.shortName || formData.name || 'Brand Name'}
                        </span>
                        <span className="text-[8px] text-zinc-400 uppercase tracking-wider font-semibold">
                          {formData.badge || 'Organizer'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Full Organizer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Informa Markets, Messe Frankfurt"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Short Display Name
                  </label>
                  <input
                    type="text"
                    value={formData.shortName}
                    onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                    placeholder="e.g. Informa, Messe Frankfurt, IES"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Website URL</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://informamarkets.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Tagline Badge</label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="e.g. Global Leader, German Fairs"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Logo Upload & URL */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">Logo Asset</label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-bold cursor-pointer transition-colors">
                    {uploadingLogo ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 text-primary" />
                        <span>Upload File</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-muted-foreground">or URL:</span>
                  <input
                    type="url"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    placeholder="https://.../logo.png"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Brand Colors */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">Brand Palette</label>
                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_COLORS.map((col) => (
                    <button
                      key={col.name}
                      type="button"
                      onClick={() => setFormData({ ...formData, brandColor: col.brand, accentColor: col.accent })}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-border text-[10px] hover:border-foreground/40 transition-colors cursor-pointer"
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.brand }} />
                      <span>{col.name}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.brandColor}
                      onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                      className="h-8 w-10 rounded-lg border border-border cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={formData.brandColor}
                      onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                      className="flex-1 text-xs font-mono font-bold bg-transparent border border-border rounded-lg px-2 py-1"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.accentColor}
                      onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                      className="h-8 w-10 rounded-lg border border-border cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={formData.accentColor}
                      onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                      className="flex-1 text-xs font-mono font-bold bg-transparent border border-border rounded-lg px-2 py-1"
                    />
                  </div>
                </div>
              </div>

              {/* Order & Event Count & Active Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Display Order</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Live Event Count</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.eventsCount}
                    onChange={(e) => setFormData({ ...formData, eventsCount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="inline-flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-secondary/30 border border-border">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 rounded-sm border-border text-primary focus:ring-primary"
                    />
                    <span className="text-xs font-bold text-foreground">Active on Homepage</span>
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingItem}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {savingItem ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingItem ? 'Save Changes' : 'Create Featured Organizer'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 2: APPROVE ENTERPRISE APPLICATION
      ========================================== */}
      {approvalModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="max-w-lg w-full bg-card border border-border rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-4 ring-emerald-500/20">
                <Check className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Approve Featured Placement
                </h3>
                <p className="text-xs text-muted-foreground">
                  Confirm badge and homepage carousel order for <strong>{approvalModalItem.name}</strong>.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Tagline / Badge Text</label>
                <input
                  type="text"
                  value={approvalBadge}
                  onChange={(e) => setApprovalBadge(e.target.value)}
                  placeholder="e.g. Enterprise Partner, Global Leader"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Carousel Order</label>
                  <input
                    type="number"
                    min={1}
                    value={approvalOrder}
                    onChange={(e) => setApprovalOrder(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Display Event Count</label>
                  <input
                    type="number"
                    min={0}
                    value={approvalCount}
                    onChange={(e) => setApprovalCount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Approval Note / Message to Organizer</label>
                <textarea
                  rows={2}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Welcome to Featured Organizers on VisitExpo! Your corporate card is now live."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setApprovalModalItem(null)}
                className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                disabled={processingStatus}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {processingStatus ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Approving...</span>
                  </>
                ) : (
                  <span>Approve &amp; Activate on Homepage</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 3: REJECT APPLICATION WITH FEEDBACK
      ========================================== */}
      {rejectionModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="max-w-md w-full bg-card border border-border rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 ring-4 ring-rose-500/20">
                <AlertCircle className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Reject Application
                </h3>
                <p className="text-xs text-muted-foreground">
                  Provide feedback so <strong>{rejectionModalItem.name}</strong> can update and resubmit.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Reason for Rejection / Revision Note</label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Please provide a higher-resolution corporate logo with transparent background and verify official corporate website."
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectionModalItem(null)}
                className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                disabled={processingStatus}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {processingStatus ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Send Rejection Note</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
