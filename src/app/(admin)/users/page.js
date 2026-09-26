'use client';

/**
 * @file page.js (User Management & Comprehensive Profile Dossier)
 * @description Super Admin screen to inspect every detail of system users, search, filter,
 * edit profile metadata, verify phone & email, modify RBAC roles, and manage account suspension/deletion.
 * Clicking any table row opens a comprehensive User Details Dossier slide-over.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  Users,
  Search,
  ShieldCheck,
  X,
  Edit2,
  Loader2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  UserX,
  UserCheck,
  AlertTriangle,
  RefreshCw,
  Ban,
  Eye,
  Copy,
  Check,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Building,
  Briefcase,
  Calendar,
  Shield,
  Key,
  Fingerprint,
  FileText,
  Ticket,
  Store,
  Sparkles,
  Globe,
  Hash,
  ChevronRight,
  Smartphone,
  Layers,
  Database
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Date formatters
function formatFullDate(dateString) {
  if (!dateString) return 'Not recorded';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Invalid date';
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return String(dateString);
  }
}

function formatRelative(dateString) {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 0) return 'Just now';
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    return `${Math.floor(diffMonths / 12)}y ago`;
  } catch {
    return '';
  }
}

export default function UsersManagementPage() {
  const { accessToken, user: currentUser } = useAuth();
  const currentUserId = currentUser?._id || currentUser?.id;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  // Stats
  const [stats, setStats] = useState({ total: 0, active: 0, suspended: 0 });

  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // ==========================================
  // USER DETAILS DOSSIER DRAWER
  // ==========================================
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('overview'); // 'overview' | 'activity' | 'organization' | 'raw'
  const [copiedKey, setCopiedKey] = useState('');

  // Edit User Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: '',
    phone: '',
    city: '',
    company: '',
    designation: '',
    isVerified: true,
    isPhoneVerified: false,
    isSuspended: false,
    suspendReason: ''
  });

  // Suspend / Reactivate Modal
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [targetSuspendUser, setTargetSuspendUser] = useState(null);
  const [suspendReasonInput, setSuspendReasonInput] = useState('');
  const [suspendSubmitting, setSuspendSubmitting] = useState(false);

  // Delete User Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetDeleteUser, setTargetDeleteUser] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Auto-dismiss feedback message after 5 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Copy helper
  const handleCopy = (text, key) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(String(text));
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 2000);
    } catch (err) {
      console.warn('Copy to clipboard failed', err);
    }
  };

  const fetchUsers = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/admin/users`, {
        params: {
          search: searchTerm,
          role: roleFilter,
          status: statusFilter,
          limit: 150
        },
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data && res.data.success) {
        const fetchedDocs = res.data.data.docs || [];
        setUsers(fetchedDocs);
        setStats({
          total: res.data.data.total ?? fetchedDocs.length,
          active: res.data.data.totalActive ?? fetchedDocs.filter(u => !u.isSuspended && u.status !== 'suspended').length,
          suspended: res.data.data.totalSuspended ?? fetchedDocs.filter(u => u.isSuspended || u.status === 'suspended').length
        });
      }
    } catch (err) {
      console.error('Fetch users failed', err);
      setError('Could not retrieve user database. Ensure super admin credentials are valid.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [accessToken, roleFilter, statusFilter]);

  // Trigger search on submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  // Helper checks
  const isSelf = (targetUser) => {
    if (!targetUser) return false;
    return (
      (currentUserId && String(targetUser._id) === String(currentUserId)) ||
      (currentUser?.email && targetUser.email?.toLowerCase() === currentUser.email.toLowerCase())
    );
  };

  const isRootAdmin = (targetUser) => {
    return targetUser?.email?.toLowerCase() === 'admin@visitexpo.in';
  };

  // ==========================================
  // VIEW USER DETAILS HANDLER
  // ==========================================
  const handleOpenDetails = async (user) => {
    setSelectedUser(user);
    // Seed detailData immediately with row user so drawer renders without lag
    setDetailData({
      user,
      stats: {
        eventsCount: 0,
        visitorPassesCount: 0,
        exhibitorStallsCount: 0,
        ordersCount: 0,
        activeTokensCount: Array.isArray(user.refreshTokens) ? user.refreshTokens.length : 0
      },
      activity: {
        events: [],
        visitorPasses: [],
        exhibitorStalls: [],
        orders: []
      }
    });
    setIsDetailOpen(true);
    setActiveDetailTab('overview');
    setDetailLoading(true);

    try {
      const res = await axios.get(`${API_URL}/admin/users/${user._id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data && res.data.success && res.data.data) {
        setDetailData(res.data.data);
        if (res.data.data.user) {
          setSelectedUser(res.data.data.user);
        }
      }
    } catch (err) {
      console.warn('Could not fetch deep user details, using table record', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // ==========================================
  // EDIT USER HANDLERS
  // ==========================================
  const openEditModal = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'visitor',
      phone: user.phone || '',
      city: user.city || '',
      company: user.company || '',
      designation: user.designation || '',
      isVerified: Boolean(user.isVerified),
      isPhoneVerified: Boolean(user.isPhoneVerified),
      isSuspended: Boolean(user.isSuspended || user.status === 'suspended'),
      suspendReason: user.suspendReason || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditSubmitting(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        email: editForm.email.trim().toLowerCase(),
        role: editForm.role,
        phone: editForm.phone.trim(),
        city: editForm.city.trim(),
        company: editForm.company.trim(),
        designation: editForm.designation.trim(),
        isVerified: editForm.isVerified,
        isPhoneVerified: editForm.isPhoneVerified,
        isSuspended: editForm.isSuspended,
        status: editForm.isSuspended ? 'suspended' : 'active',
        suspendReason: editForm.isSuspended ? editForm.suspendReason : ''
      };

      const res = await axios.put(
        `${API_URL}/admin/users/${editingUser._id}`,
        payload,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (res.data && res.data.success) {
        setFeedback({
          type: 'success',
          message: `User account "${editForm.name}" updated successfully.`
        });
        setIsEditModalOpen(false);

        // Update active drawer if open
        if (selectedUser && selectedUser._id === editingUser._id) {
          const updatedUser = { ...selectedUser, ...payload };
          setSelectedUser(updatedUser);
          setDetailData(prev => prev ? { ...prev, user: { ...prev.user, ...payload } } : null);
        }

        fetchUsers();
      }
    } catch (err) {
      console.error('Edit user failed', err);
      const errMsg = err.response?.data?.error || 'Could not update user details.';
      setFeedback({ type: 'error', message: errMsg });
    } finally {
      setEditSubmitting(false);
    }
  };

  // ==========================================
  // SUSPEND / UNSUSPEND HANDLERS
  // ==========================================
  const openSuspendModal = (user) => {
    if (isSelf(user)) {
      setFeedback({ type: 'error', message: 'You cannot suspend your own super admin account.' });
      return;
    }
    if (isRootAdmin(user)) {
      setFeedback({ type: 'error', message: 'The primary super admin account cannot be suspended.' });
      return;
    }
    setTargetSuspendUser(user);
    setSuspendReasonInput(user.suspendReason || '');
    setIsSuspendModalOpen(true);
  };

  const handleSuspendConfirm = async () => {
    if (!targetSuspendUser) return;
    setSuspendSubmitting(true);
    const currentlySuspended = Boolean(targetSuspendUser.isSuspended || targetSuspendUser.status === 'suspended');
    const newSuspendedState = !currentlySuspended;

    try {
      const res = await axios.put(
        `${API_URL}/admin/users/${targetSuspendUser._id}/suspend`,
        {
          suspend: newSuspendedState,
          reason: newSuspendedState ? (suspendReasonInput.trim() || 'Suspended by super administrator') : ''
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (res.data && res.data.success) {
        setFeedback({
          type: 'success',
          message: res.data.message || (newSuspendedState
            ? `Account for ${targetSuspendUser.name} has been suspended.`
            : `Account for ${targetSuspendUser.name} has been reactivated.`)
        });
        setIsSuspendModalOpen(false);

        // Update active drawer if open
        if (selectedUser && selectedUser._id === targetSuspendUser._id) {
          const updatedUser = {
            ...selectedUser,
            isSuspended: newSuspendedState,
            status: newSuspendedState ? 'suspended' : 'active',
            suspendReason: newSuspendedState ? (suspendReasonInput.trim() || 'Suspended by super administrator') : ''
          };
          setSelectedUser(updatedUser);
          setDetailData(prev => prev ? { ...prev, user: { ...prev.user, ...updatedUser } } : null);
        }

        fetchUsers();
      }
    } catch (err) {
      console.error('Suspend toggle failed', err);
      const errMsg = err.response?.data?.error || 'Failed to update user suspension status.';
      setFeedback({ type: 'error', message: errMsg });
    } finally {
      setSuspendSubmitting(false);
    }
  };

  // ==========================================
  // DELETE USER HANDLERS
  // ==========================================
  const openDeleteModal = (user) => {
    if (isSelf(user)) {
      setFeedback({ type: 'error', message: 'You cannot delete your own super admin account.' });
      return;
    }
    if (isRootAdmin(user)) {
      setFeedback({ type: 'error', message: 'The primary super admin account cannot be deleted.' });
      return;
    }
    setTargetDeleteUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!targetDeleteUser) return;
    setDeleteSubmitting(true);
    try {
      const res = await axios.delete(
        `${API_URL}/admin/users/${targetDeleteUser._id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (res.data && res.data.success) {
        setFeedback({
          type: 'success',
          message: `User account "${targetDeleteUser.name}" (${targetDeleteUser.email}) permanently deleted.`
        });
        setIsDeleteModalOpen(false);
        if (selectedUser && selectedUser._id === targetDeleteUser._id) {
          setIsDetailOpen(false);
          setSelectedUser(null);
        }
        fetchUsers();
      }
    } catch (err) {
      console.error('Delete user failed', err);
      const errMsg = err.response?.data?.error || 'Failed to delete user account.';
      setFeedback({ type: 'error', message: errMsg });
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Active user to display in details
  const activeUser = selectedUser || {};
  const activeStats = detailData?.stats || {};
  const activeActivity = detailData?.activity || {};

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-600'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
            )}
            <span className="text-sm font-medium">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header Panel with KPI Stats Chips */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Users className="h-6 w-6 text-primary" /> User Directory &amp; Access Control
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Click on any user entry to inspect their complete dossier, contact details, organization, and registered activity.
          </p>
        </div>

        {/* Quick Stats Chips */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-border bg-background shadow-2xs">
            <span className="text-xs font-semibold text-muted-foreground">Total Users:</span>
            <span className="text-sm font-bold text-foreground">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-emerald-700">Active:</span>
            <span className="text-sm font-bold text-emerald-700">{stats.active}</span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-rose-500/20 bg-rose-500/5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-xs font-semibold text-rose-700">Suspended:</span>
            <span className="text-sm font-bold text-rose-700">{stats.suspended}</span>
          </div>
          <button
            type="button"
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border hover:bg-secondary text-xs font-semibold text-foreground transition-colors cursor-pointer"
            title="Refresh user directory"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Control Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card p-4 rounded-xl border border-border">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 md:max-w-md flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-secondary hover:bg-secondary/80 border border-border px-4 py-2 text-sm font-semibold text-foreground cursor-pointer transition-colors"
          >
            Search
          </button>
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
            >
              <option value="all">All Accounts</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="organizer">Organizer</option>
              <option value="exhibitor">Exhibitor</option>
              <option value="visitor">Visitor</option>
              <option value="event_manager">Event Manager</option>
              <option value="sales_team">Sales Team</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Fetching user directory...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center text-muted-foreground gap-3">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <h3 className="font-semibold text-foreground">Error Connecting</h3>
            <p className="text-sm max-w-md">{error}</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
            <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs font-semibold">No registered users matched query filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-4">User Profile &amp; Contact</th>
                  <th className="px-6 py-4">Tenant / Org</th>
                  <th className="px-6 py-4">Account Status</th>
                  <th className="px-6 py-4">Verification</th>
                  <th className="px-6 py-4">System Role</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => {
                  const isSuspended = Boolean(u.isSuspended || u.status === 'suspended');
                  const selfUser = isSelf(u);
                  const rootAdminUser = isRootAdmin(u);
                  const isSelected = selectedUser && selectedUser._id === u._id;

                  return (
                    <tr
                      key={u._id}
                      onClick={() => handleOpenDetails(u)}
                      className={`cursor-pointer transition-all group ${
                        isSelected
                          ? 'bg-primary/10 border-l-4 border-l-primary'
                          : isSuspended
                          ? 'bg-rose-500/[0.02] hover:bg-rose-500/5 hover:border-l-4 hover:border-l-rose-500'
                          : 'hover:bg-primary/[0.04] hover:border-l-4 hover:border-l-primary'
                      }`}
                    >
                      {/* User Profile & Contact */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm uppercase shrink-0 transition-transform group-hover:scale-105 shadow-2xs ${
                              isSuspended
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : u.role === 'super_admin'
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : u.role === 'organizer'
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : u.role === 'exhibitor'
                                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                : 'bg-primary/10 text-primary border border-primary/20'
                            }`}
                          >
                            {(u.name || u.email || 'U').charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                                {u.name || 'Unnamed User'}
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                              </p>
                              {selfUser && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-sm bg-blue-100 text-blue-700">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                              <span>{u.email}</span>
                              {u.phone && (
                                <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                                  • <Phone className="h-2.5 w-2.5" /> {u.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Tenant Association */}
                      <td className="px-6 py-4 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Building className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                          <span className="font-medium text-foreground truncate max-w-[170px]" title={u.organization?.name || u.company || 'Platform (Root)'}>
                            {u.organization?.name || u.company || 'Platform Root'}
                          </span>
                        </div>
                        {u.designation && (
                          <span className="text-[11px] text-muted-foreground block truncate max-w-[170px]">
                            {u.designation}
                          </span>
                        )}
                      </td>

                      {/* Account Status Badge */}
                      <td className="px-6 py-4">
                        {isSuspended ? (
                          <div className="inline-flex flex-col">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 text-xs font-bold text-rose-600">
                              <Ban className="h-3 w-3" /> Suspended
                            </span>
                            {u.suspendReason && (
                              <span className="text-[10px] text-muted-foreground mt-0.5 max-w-[150px] truncate" title={u.suspendReason}>
                                {u.suspendReason}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                            <CheckCircle className="h-3 w-3" /> Active
                          </span>
                        )}
                      </td>

                      {/* Verification Status */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {u.isVerified ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
                              <CheckCircle className="h-3 w-3" /> Email
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
                              <Clock className="h-3 w-3" /> Email Unverified
                            </span>
                          )}

                          <div>
                            {u.isPhoneVerified ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
                                <Smartphone className="h-3 w-3" /> Phone Verified
                              </span>
                            ) : u.phone ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600">
                                <Smartphone className="h-3 w-3" /> Phone Unverified
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* System Role */}
                      <td className="px-6 py-4 capitalize font-medium text-foreground">
                        <span
                          className={`inline-flex rounded-md px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                            u.role === 'super_admin'
                              ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                              : u.role === 'organizer'
                              ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                              : u.role === 'exhibitor'
                              ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                              : u.role === 'visitor'
                              ? 'bg-zinc-500/10 text-zinc-600 border border-zinc-500/20'
                              : 'bg-zinc-500/10 text-zinc-600 border border-zinc-500/20'
                          }`}
                        >
                          {u.role?.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Inspect Dossier Action */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetails(u);
                            }}
                            className="p-1.5 hover:bg-primary/10 rounded-lg text-primary border border-transparent hover:border-primary/20 transition-colors cursor-pointer"
                            title="View full user dossier"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Suspend / Reactivate Action */}
                          {isSuspended ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openSuspendModal(u);
                              }}
                              disabled={selfUser || rootAdminUser}
                              className={`p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-500/10 border border-emerald-500/20 transition-colors cursor-pointer ${
                                selfUser || rootAdminUser ? 'opacity-30 cursor-not-allowed' : ''
                              }`}
                              title={
                                selfUser
                                  ? 'Cannot modify your own account'
                                  : rootAdminUser
                                  ? 'Root admin account cannot be suspended'
                                  : 'Reactivate user account'
                              }
                            >
                              <UserCheck className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openSuspendModal(u);
                              }}
                              disabled={selfUser || rootAdminUser}
                              className={`p-1.5 rounded-lg text-amber-600 hover:bg-amber-500/10 border border-amber-500/20 transition-colors cursor-pointer ${
                                selfUser || rootAdminUser ? 'opacity-30 cursor-not-allowed' : ''
                              }`}
                              title={
                                selfUser
                                  ? 'Cannot suspend your own account'
                                  : rootAdminUser
                                  ? 'Root admin account cannot be suspended'
                                  : 'Suspend user account'
                              }
                            >
                              <UserX className="h-4 w-4" />
                            </button>
                          )}

                          {/* Edit Details Action */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(u);
                            }}
                            className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground border border-transparent hover:border-border transition-colors cursor-pointer"
                            title="Edit user profile & privileges"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          {/* Delete User Action */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteModal(u);
                            }}
                            disabled={selfUser || rootAdminUser}
                            className={`p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer ${
                              selfUser || rootAdminUser ? 'opacity-30 cursor-not-allowed' : ''
                            }`}
                            title={
                              selfUser
                                ? 'Cannot delete your own account'
                                : rootAdminUser
                                ? 'Root admin account cannot be deleted'
                                : 'Permanently delete user'
                            }
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* ========================================================================= */}
      {/* USER COMPLETE DOSSIER / DETAILS SLIDE-OVER DRAWER                         */}
      {/* ========================================================================= */}
      {isDetailOpen && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div
            className="w-full max-w-2xl lg:max-w-3xl bg-card border-l border-border h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Action Bar */}
            <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Fingerprint className="h-3.5 w-3.5 text-primary" /> User Dossier
                </span>
                <span className="text-xs text-muted-foreground font-mono bg-background px-2 py-0.5 rounded border border-border flex items-center gap-1">
                  ID: {activeUser._id}
                  <button
                    type="button"
                    onClick={() => handleCopy(activeUser._id, 'userId')}
                    className="hover:text-primary transition-colors cursor-pointer ml-1"
                    title="Copy Mongo User ID"
                  >
                    {copiedKey === 'userId' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  </button>
                </span>
                {detailLoading && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1 ml-2">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" /> Syncing...
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Quick Edit */}
                <button
                  type="button"
                  onClick={() => openEditModal(activeUser)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-background hover:bg-secondary border border-border text-foreground transition-colors cursor-pointer"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </button>

                {/* Quick Suspend / Unsuspend */}
                <button
                  type="button"
                  onClick={() => openSuspendModal(activeUser)}
                  disabled={isSelf(activeUser) || isRootAdmin(activeUser)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    activeUser.isSuspended || activeUser.status === 'suspended'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/20'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-600 hover:bg-amber-500/20'
                  } ${isSelf(activeUser) || isRootAdmin(activeUser) ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  {activeUser.isSuspended || activeUser.status === 'suspended' ? (
                    <>
                      <UserCheck className="h-3.5 w-3.5" /> Reactivate
                    </>
                  ) : (
                    <>
                      <UserX className="h-3.5 w-3.5" /> Suspend
                    </>
                  )}
                </button>

                {/* Close Drawer */}
                <button
                  type="button"
                  onClick={() => setIsDetailOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Close dossier"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Profile Hero Header Card */}
              <div className="p-6 rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 shadow-xs relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl uppercase shrink-0 shadow-md ${
                      activeUser.isSuspended || activeUser.status === 'suspended'
                        ? 'bg-rose-100 text-rose-700 border-2 border-rose-300'
                        : activeUser.role === 'super_admin'
                        ? 'bg-red-100 text-red-700 border-2 border-red-300'
                        : activeUser.role === 'organizer'
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                        : activeUser.role === 'exhibitor'
                        ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                        : 'bg-primary/10 text-primary border-2 border-primary/30'
                    }`}
                  >
                    {(activeUser.name || activeUser.email || 'U').charAt(0)}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-bold text-foreground">
                        {activeUser.name || 'Unnamed User'}
                      </h3>
                      {isSelf(activeUser) && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-sm bg-blue-100 text-blue-700">
                          Current Admin Session (You)
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <a href={`mailto:${activeUser.email}`} className="hover:underline hover:text-primary">
                          {activeUser.email}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopy(activeUser.email, 'email')}
                          className="hover:text-primary ml-1 cursor-pointer"
                          title="Copy email"
                        >
                          {copiedKey === 'email' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </span>

                      {activeUser.phone ? (
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          <a href={`tel:${activeUser.phone}`} className="hover:underline hover:text-primary">
                            {activeUser.phone}
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopy(activeUser.phone, 'phone')}
                            className="hover:text-primary ml-1 cursor-pointer"
                            title="Copy phone"
                          >
                            {copiedKey === 'phone' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60 italic">No phone registered</span>
                      )}
                    </div>

                    {/* Role & Status Pills */}
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      {/* Role Pill */}
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                          activeUser.role === 'super_admin'
                            ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                            : activeUser.role === 'organizer'
                            ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                            : activeUser.role === 'exhibitor'
                            ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                            : 'bg-zinc-500/10 text-zinc-600 border border-zinc-500/20'
                        }`}
                      >
                        <Shield className="h-3 w-3" />
                        {activeUser.role?.replace('_', ' ')}
                      </span>

                      {/* Status Pill */}
                      {activeUser.isSuspended || activeUser.status === 'suspended' ? (
                        <span className="inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-bold bg-rose-500/10 border border-rose-500/30 text-rose-600">
                          <Ban className="h-3 w-3" /> Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-600">
                          <CheckCircle className="h-3 w-3" /> Active Account
                        </span>
                      )}

                      {/* Email Verified Pill */}
                      {activeUser.isVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-700">
                          <CheckCircle className="h-3 w-3" /> Email Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-semibold bg-zinc-500/10 text-zinc-600">
                          <Clock className="h-3 w-3" /> Email Pending
                        </span>
                      )}

                      {/* Phone OTP Verified Pill */}
                      {activeUser.isPhoneVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-700">
                          <Smartphone className="h-3 w-3" /> OTP Verified (2Factor.in)
                        </span>
                      ) : activeUser.phone ? (
                        <span className="inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-700">
                          <Smartphone className="h-3 w-3" /> OTP Unverified
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Suspension Alert if suspended */}
                {(activeUser.isSuspended || activeUser.status === 'suspended') && (
                  <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-700 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-600" /> Account is currently suspended
                    </p>
                    <p>
                      <strong>Reason:</strong> {activeUser.suspendReason || 'Suspended by super administrator'}
                    </p>
                    {activeUser.suspendedAt && (
                      <p className="text-[11px] text-rose-600/80">
                        Suspended on: {formatFullDate(activeUser.suspendedAt)} ({formatRelative(activeUser.suspendedAt)})
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Quick KPI Stat Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border border-border bg-card">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-primary" /> Expos Hosted
                  </span>
                  <p className="text-xl font-bold text-foreground mt-1">
                    {activeStats.eventsCount ?? 0}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-card">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                    <Ticket className="h-3 w-3 text-emerald-500" /> Visitor Passes
                  </span>
                  <p className="text-xl font-bold text-foreground mt-1">
                    {activeStats.visitorPassesCount ?? 0}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-card">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                    <Store className="h-3 w-3 text-purple-500" /> Exhibitor Stalls
                  </span>
                  <p className="text-xl font-bold text-foreground mt-1">
                    {activeStats.exhibitorStallsCount ?? 0}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-card">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                    <Key className="h-3 w-3 text-amber-500" /> Active Sessions
                  </span>
                  <p className="text-xl font-bold text-foreground mt-1">
                    {activeStats.activeTokensCount ?? (Array.isArray(activeUser.refreshTokens) ? activeUser.refreshTokens.length : 0)}
                  </p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-border gap-2">
                <button
                  type="button"
                  onClick={() => setActiveDetailTab('overview')}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeDetailTab === 'overview'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" /> Overview &amp; Profile
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDetailTab('organization')}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeDetailTab === 'organization'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Building className="h-3.5 w-3.5" /> Organization &amp; Tenant
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDetailTab('activity')}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeDetailTab === 'activity'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" /> Platform Activity
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDetailTab('raw')}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeDetailTab === 'raw'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Database className="h-3.5 w-3.5" /> Raw MongoDB Record
                </button>
              </div>

              {/* TAB 1: OVERVIEW & PROFILE */}
              {activeDetailTab === 'overview' && (
                <div className="space-y-6">
                  {/* Contact & Personal Metadata Card */}
                  <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" /> Personal Identity &amp; Contact Information
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-semibold">Full Legal Name:</span>
                        <p className="text-foreground font-bold text-sm">{activeUser.name || 'Not provided'}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-muted-foreground font-semibold">Email Address:</span>
                        <p className="text-foreground font-medium flex items-center gap-1.5">
                          {activeUser.email}
                          <button
                            type="button"
                            onClick={() => handleCopy(activeUser.email, 'email-card')}
                            className="hover:text-primary cursor-pointer"
                            title="Copy email"
                          >
                            {copiedKey === 'email-card' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                          </button>
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-muted-foreground font-semibold">Mobile Phone:</span>
                        <p className="text-foreground font-medium flex items-center gap-1.5">
                          {activeUser.phone || 'No phone registered'}
                          {activeUser.phone && (
                            <button
                              type="button"
                              onClick={() => handleCopy(activeUser.phone, 'phone-card')}
                              className="hover:text-primary cursor-pointer"
                              title="Copy phone"
                            >
                              {copiedKey === 'phone-card' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                            </button>
                          )}
                        </p>
                        {activeUser.phone && (
                          <span className={`text-[10px] font-bold ${activeUser.isPhoneVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {activeUser.isPhoneVerified ? '✓ OTP Verified (2Factor.in)' : '⚠️ Mobile OTP Unverified'}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-muted-foreground font-semibold">City / Location:</span>
                        <p className="text-foreground font-medium flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          {activeUser.city || 'Not specified'}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-muted-foreground font-semibold">Company / Brand Name:</span>
                        <p className="text-foreground font-medium flex items-center gap-1">
                          <Building className="h-3.5 w-3.5 text-muted-foreground" />
                          {activeUser.company || activeUser.organization?.name || 'Independent / None'}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-muted-foreground font-semibold">Job Title / Designation:</span>
                        <p className="text-foreground font-medium flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                          {activeUser.designation || 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Security, Credentials & Access Status Card */}
                  <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" /> Security, Permissions &amp; Access Controls
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-semibold">System RBAC Role:</span>
                        <p className="text-foreground font-bold capitalize">
                          {activeUser.role?.replace('_', ' ')}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {activeUser.role === 'super_admin'
                            ? 'Complete platform governance, billing, CMS and system configuration.'
                            : activeUser.role === 'organizer'
                            ? 'Create, manage, and publish trade expos and exhibitor directories.'
                            : activeUser.role === 'exhibitor'
                            ? 'Book exhibition stalls, showcase product catalogs and trade inquiries.'
                            : 'Explore trade directory and claim digital QR visitor passes.'}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-muted-foreground font-semibold">Account State:</span>
                        <p className="text-foreground font-bold">
                          {activeUser.isSuspended || activeUser.status === 'suspended' ? (
                            <span className="text-rose-600 font-bold flex items-center gap-1">
                              <Ban className="h-3.5 w-3.5" /> Suspended (Logins Blocked)
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                              <CheckCircle className="h-3.5 w-3.5" /> Active &amp; Operational
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-muted-foreground font-semibold">Email Verification Status:</span>
                        <p className="text-foreground font-medium">
                          {activeUser.isVerified ? '✓ Confirmed and Verified' : '⚠️ Pending Email Verification'}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-muted-foreground font-semibold">2Factor.in SMS Verification:</span>
                        <p className="text-foreground font-medium">
                          {activeUser.isPhoneVerified
                            ? '✓ Confirmed via 2Factor.in SMS Gateway'
                            : '⚠️ Pending Mobile OTP Verification'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Audit Timestamps Card */}
                  <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" /> System Audit Timeline
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-semibold">Registration Date (Created):</span>
                        <p className="text-foreground font-medium">{formatFullDate(activeUser.createdAt)}</p>
                        <p className="text-[11px] text-muted-foreground">{formatRelative(activeUser.createdAt)}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-muted-foreground font-semibold">Last Record Modification:</span>
                        <p className="text-foreground font-medium">{formatFullDate(activeUser.updatedAt)}</p>
                        <p className="text-[11px] text-muted-foreground">{formatRelative(activeUser.updatedAt)}</p>
                      </div>

                      {activeUser.suspendedAt && (
                        <div className="space-y-1 sm:col-span-2">
                          <span className="text-rose-600 font-semibold">Suspension Timestamp:</span>
                          <p className="text-foreground font-medium">{formatFullDate(activeUser.suspendedAt)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TENANT & ORGANIZATION */}
              {activeDetailTab === 'organization' && (
                <div className="space-y-6">
                  {activeUser.organization ? (
                    <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <Building className="h-4 w-4 text-primary" /> Tenant Organization Dossier
                        </h4>
                        <span className="text-xs text-muted-foreground font-mono bg-background px-2 py-0.5 rounded border border-border">
                          Org ID: {activeUser.organization._id || activeUser.organization}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <span className="text-muted-foreground font-semibold">Organization Name:</span>
                          <p className="text-foreground font-bold text-sm">{activeUser.organization.name || 'Unnamed Org'}</p>
                        </div>

                        {activeUser.organization.website && (
                          <div className="space-y-1">
                            <span className="text-muted-foreground font-semibold">Official Website:</span>
                            <p className="text-foreground font-medium flex items-center gap-1">
                              <a
                                href={activeUser.organization.website.startsWith('http') ? activeUser.organization.website : `https://${activeUser.organization.website}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline flex items-center gap-1"
                              >
                                {activeUser.organization.website}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </p>
                          </div>
                        )}

                        {activeUser.organization.gst && (
                          <div className="space-y-1">
                            <span className="text-muted-foreground font-semibold">GST / Tax Registration:</span>
                            <p className="text-foreground font-mono font-bold">{activeUser.organization.gst}</p>
                          </div>
                        )}

                        {activeUser.organization.contact && (
                          <div className="space-y-1">
                            <span className="text-muted-foreground font-semibold">Official Contact:</span>
                            <p className="text-foreground font-medium">
                              {activeUser.organization.contact.email || ''}{' '}
                              {activeUser.organization.contact.phone ? `(${activeUser.organization.contact.phone})` : ''}
                            </p>
                          </div>
                        )}

                        {activeUser.organization.address && (
                          <div className="space-y-1 sm:col-span-2">
                            <span className="text-muted-foreground font-semibold">Registered Physical Address:</span>
                            <p className="text-foreground font-medium">
                              {[
                                activeUser.organization.address.street,
                                activeUser.organization.address.city,
                                activeUser.organization.address.state,
                                activeUser.organization.address.country,
                                activeUser.organization.address.zipCode
                              ]
                                .filter(Boolean)
                                .join(', ') || 'Address not recorded'}
                            </p>
                          </div>
                        )}

                        {activeUser.organization.description && (
                          <div className="space-y-1 sm:col-span-2">
                            <span className="text-muted-foreground font-semibold">Organization Bio / Profile:</span>
                            <p className="text-foreground text-xs leading-relaxed bg-muted/20 p-3 rounded-lg border border-border">
                              {activeUser.organization.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center rounded-xl border border-dashed border-border bg-muted/10 space-y-2">
                      <Building className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                      <h4 className="text-sm font-bold text-foreground">Independent Platform User</h4>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        This user is registered directly as an independent visitor/exhibitor and is not associated with an enterprise tenant organization.
                      </p>
                      {activeUser.company && (
                        <p className="text-xs text-foreground font-medium mt-2">
                          Self-Reported Company: <strong>{activeUser.company}</strong>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PLATFORM ACTIVITY */}
              {activeDetailTab === 'activity' && (
                <div className="space-y-6">
                  {/* Hosted Events (For Organizers) */}
                  {Array.isArray(activeActivity.events) && activeActivity.events.length > 0 && (
                    <div className="p-5 rounded-xl border border-border bg-card space-y-3">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-primary" /> Organized Expos ({activeActivity.events.length})
                        </span>
                      </h4>
                      <div className="space-y-2">
                        {activeActivity.events.map((ev) => (
                          <div key={ev._id} className="p-3 bg-muted/20 rounded-lg border border-border flex items-center justify-between gap-3 text-xs">
                            <div className="flex-1 truncate">
                              <p className="font-bold text-foreground truncate">{ev.title}</p>
                              <span className="text-muted-foreground text-[11px]">
                                {ev.city || 'City not set'} • {ev.venue || 'Venue not set'}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/10 text-primary shrink-0">
                              {ev.status || 'published'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Registered Passes (For Visitors) */}
                  {Array.isArray(activeActivity.visitorPasses) && activeActivity.visitorPasses.length > 0 && (
                    <div className="p-5 rounded-xl border border-border bg-card space-y-3">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Ticket className="h-4 w-4 text-emerald-500" /> Claimed Visitor Passes ({activeActivity.visitorPasses.length})
                        </span>
                      </h4>
                      <div className="space-y-2">
                        {activeActivity.visitorPasses.map((p) => (
                          <div key={p._id} className="p-3 bg-muted/20 rounded-lg border border-border flex items-center justify-between gap-3 text-xs">
                            <div className="flex-1 truncate">
                              <p className="font-bold text-foreground truncate">{p.event?.title || 'Trade Expo'}</p>
                              <span className="text-muted-foreground text-[11px]">
                                Registered: {formatFullDate(p.createdAt)} • Mode: {p.attendanceType || 'in_person'}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 shrink-0">
                              {p.registrationStatus || 'confirmed'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Exhibitor Stalls */}
                  {Array.isArray(activeActivity.exhibitorStalls) && activeActivity.exhibitorStalls.length > 0 && (
                    <div className="p-5 rounded-xl border border-border bg-card space-y-3">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Store className="h-4 w-4 text-purple-500" /> Exhibitor Booths ({activeActivity.exhibitorStalls.length})
                        </span>
                      </h4>
                      <div className="space-y-2">
                        {activeActivity.exhibitorStalls.map((st) => (
                          <div key={st._id} className="p-3 bg-muted/20 rounded-lg border border-border flex items-center justify-between gap-3 text-xs">
                            <div className="flex-1 truncate">
                              <p className="font-bold text-foreground truncate">{st.event?.title || 'Expo Stall'}</p>
                              <span className="text-muted-foreground text-[11px]">
                                Booth: {st.boothNumber || 'TBD'} • Status: {st.status || 'pending'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty Activity State */}
                  {(!activeActivity.events || activeActivity.events.length === 0) &&
                    (!activeActivity.visitorPasses || activeActivity.visitorPasses.length === 0) &&
                    (!activeActivity.exhibitorStalls || activeActivity.exhibitorStalls.length === 0) && (
                      <div className="p-8 text-center rounded-xl border border-dashed border-border bg-muted/10 space-y-2">
                        <Layers className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                        <h4 className="text-sm font-bold text-foreground">No Platform Activity Records Yet</h4>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                          This user has not yet published expos, claimed visitor passes, or registered exhibitor booths.
                        </p>
                      </div>
                    )}
                </div>
              )}

              {/* TAB 4: RAW MONGODB RECORD */}
              {activeDetailTab === 'raw' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-muted-foreground">MongoDB Document Representation:</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(JSON.stringify(activeUser, null, 2), 'rawJson')}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-border bg-background hover:bg-secondary text-foreground font-semibold cursor-pointer transition-colors"
                    >
                      {copiedKey === 'rawJson' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" /> Copied JSON!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> Copy Raw JSON
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-zinc-950 text-emerald-400 font-mono text-[11px] overflow-x-auto border border-zinc-800 leading-relaxed max-h-[500px]">
                    {JSON.stringify(activeUser, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Bottom Actions Drawer Footer */}
            <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between shrink-0">
              <div className="text-[11px] text-muted-foreground">
                Account ID: <span className="font-mono">{activeUser._id}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(activeUser)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit Profile &amp; Role
                </button>
                <button
                  type="button"
                  onClick={() => setIsDetailOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-border bg-background hover:bg-secondary text-foreground transition-colors cursor-pointer"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. SUSPEND / REACTIVATE CONFIRMATION MODAL                                */}
      {/* ========================================================================= */}
      {isSuspendModalOpen && targetSuspendUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => setIsSuspendModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Icon & Header */}
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  targetSuspendUser.isSuspended || targetSuspendUser.status === 'suspended'
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-amber-500/10 text-amber-600'
                }`}
              >
                {targetSuspendUser.isSuspended || targetSuspendUser.status === 'suspended' ? (
                  <UserCheck className="h-5 w-5" />
                ) : (
                  <UserX className="h-5 w-5" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {targetSuspendUser.isSuspended || targetSuspendUser.status === 'suspended'
                    ? 'Reactivate User Account'
                    : 'Suspend User Account'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {targetSuspendUser.name} • {targetSuspendUser.email}
                </p>
              </div>
            </div>

            {/* Modal Body */}
            {targetSuspendUser.isSuspended || targetSuspendUser.status === 'suspended' ? (
              <div className="p-3.5 bg-emerald-500/5 rounded-xl border border-emerald-500/20 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-emerald-700">Account will be restored to active status.</p>
                <p>The user will immediately regain access to log in and manage their events and dashboard.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3.5 bg-amber-500/5 rounded-xl border border-amber-500/20 text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-amber-700">Suspension will immediately terminate user access.</p>
                  <p>All active sessions will be invalidated, and any login attempts will be rejected.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">
                    Suspension Reason (Optional)
                  </label>
                  <input
                    type="text"
                    value={suspendReasonInput}
                    onChange={(e) => setSuspendReasonInput(e.target.value)}
                    placeholder="e.g. Terms violation, payment default, security check..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setIsSuspendModalOpen(false)}
                disabled={suspendSubmitting}
                className="rounded-lg border border-border hover:bg-secondary px-4 py-2 text-sm font-semibold text-foreground transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSuspendConfirm}
                disabled={suspendSubmitting}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white shadow-md transition-colors cursor-pointer ${
                  targetSuspendUser.isSuspended || targetSuspendUser.status === 'suspended'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {suspendSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : targetSuspendUser.isSuspended || targetSuspendUser.status === 'suspended' ? (
                  <UserCheck className="h-4 w-4" />
                ) : (
                  <UserX className="h-4 w-4" />
                )}
                {targetSuspendUser.isSuspended || targetSuspendUser.status === 'suspended'
                  ? 'Reactivate Account'
                  : 'Suspend Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DELETE USER CONFIRMATION MODAL                                         */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && targetDeleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Icon & Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Permanently Delete User</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>

            {/* Modal Warning Body */}
            <div className="p-3.5 bg-rose-500/5 rounded-xl border border-rose-500/20 text-xs text-muted-foreground space-y-2">
              <p className="font-semibold text-rose-700">
                Are you sure you want to permanently erase this user and all platform data?
              </p>
              <div className="bg-background/80 p-2.5 rounded-lg border border-border space-y-1">
                <p className="text-foreground font-bold">{targetDeleteUser.name}</p>
                <p className="text-muted-foreground font-mono text-[11px]">{targetDeleteUser.email}</p>
                <p className="text-muted-foreground capitalize">Role: {targetDeleteUser.role?.replace('_', ' ')}</p>
              </div>
              <div className="text-[11px] text-zinc-500 space-y-1 pt-1">
                <p className="font-semibold text-zinc-600 dark:text-zinc-400">All data across the entire platform will be purged:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Attendee registrations & event engagements</li>
                  <li>Visitor passes, badges & orders</li>
                  <li>Exhibitor applications & booth assignments</li>
                  <li>Reviews, inquiries, leads & support tickets</li>
                  <li>Account credentials & organization memberships</li>
                </ul>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleteSubmitting}
                className="rounded-lg border border-border hover:bg-secondary px-4 py-2 text-sm font-semibold text-foreground transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteSubmitting}
                className="flex items-center gap-2 rounded-lg bg-destructive hover:bg-destructive/90 px-4 py-2 text-sm font-bold text-destructive-foreground shadow-md transition-colors cursor-pointer"
              >
                {deleteSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. EDIT USER MODAL                                                        */}
      {/* ========================================================================= */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold text-foreground mb-1">Edit User Profile &amp; Access</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Update personal details, contact numbers, RBAC permissions, and access status.
            </p>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Mobile Phone</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="e.g. 9876543210"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">City / Location</label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="e.g. Mumbai, Delhi"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Company / Enterprise</label>
                  <input
                    type="text"
                    value={editForm.company}
                    onChange={(e) => setEditForm(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Company or Brand name"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Designation / Title</label>
                  <input
                    type="text"
                    value={editForm.designation}
                    onChange={(e) => setEditForm(prev => ({ ...prev, designation: e.target.value }))}
                    placeholder="e.g. Managing Director"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">System Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="organizer">Organizer</option>
                    <option value="exhibitor">Exhibitor</option>
                    <option value="visitor">Visitor</option>
                    <option value="event_manager">Event Manager</option>
                    <option value="sales_team">Sales Team</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Email Verification</label>
                  <select
                    value={String(editForm.isVerified)}
                    onChange={(e) => setEditForm(prev => ({ ...prev, isVerified: e.target.value === 'true' }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                  >
                    <option value="true">Verified Account</option>
                    <option value="false">Pending Verification</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">2Factor.in Phone Verification</label>
                <select
                  value={String(editForm.isPhoneVerified)}
                  onChange={(e) => setEditForm(prev => ({ ...prev, isPhoneVerified: e.target.value === 'true' }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                >
                  <option value="true">Verified via SMS OTP</option>
                  <option value="false">Unverified / Pending</option>
                </select>
              </div>

              {/* Account Suspension Control */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-foreground block">Account Access Status</label>
                    <p className="text-[11px] text-muted-foreground">
                      Suspended accounts are blocked from logging in.
                    </p>
                  </div>
                  <select
                    value={String(editForm.isSuspended)}
                    onChange={(e) => setEditForm(prev => ({ ...prev, isSuspended: e.target.value === 'true' }))}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-bold focus:outline-none ${
                      editForm.isSuspended
                        ? 'border-rose-500/30 bg-rose-500/10 text-rose-600'
                        : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                    }`}
                  >
                    <option value="false">Active Account</option>
                    <option value="true">Suspended</option>
                  </select>
                </div>

                {editForm.isSuspended && (
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Reason for Suspension
                    </label>
                    <input
                      type="text"
                      value={editForm.suspendReason}
                      onChange={(e) => setEditForm(prev => ({ ...prev, suspendReason: e.target.value }))}
                      placeholder="Reason displayed to the user upon login attempt"
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={editSubmitting}
                  className="rounded-lg border border-border hover:bg-secondary px-4 py-2 text-sm font-semibold text-foreground transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/90 px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md transition-colors cursor-pointer"
                >
                  {editSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
