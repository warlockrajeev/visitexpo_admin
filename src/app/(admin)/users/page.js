'use client';

/**
 * @file page.js (User Management)
 * @description Super Admin screen to search system users, edit profile metadata,
 * verify emails, modify RBAC roles, and manage user account suspension and permanent deletion.
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
  Ban
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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

  // Edit User Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: '',
    isVerified: true,
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
  // EDIT USER HANDLERS
  // ==========================================
  const openEditModal = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'visitor',
      isVerified: Boolean(user.isVerified),
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
        isVerified: editForm.isVerified,
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
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> User Directory &amp; Access Control
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Inspect accounts, manage RBAC privileges, toggle user suspensions, and permanently delete accounts.
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
              placeholder="Search user name or email..."
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
                  <th className="px-6 py-4">User Profile</th>
                  <th className="px-6 py-4">Tenant Association</th>
                  <th className="px-6 py-4">Account Status</th>
                  <th className="px-6 py-4">Email Verification</th>
                  <th className="px-6 py-4">System Role</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => {
                  const isSuspended = Boolean(u.isSuspended || u.status === 'suspended');
                  const selfUser = isSelf(u);
                  const rootAdminUser = isRootAdmin(u);

                  return (
                    <tr
                      key={u._id}
                      className={`hover:bg-secondary/40 transition-colors ${
                        isSuspended ? 'bg-rose-500/[0.02]' : ''
                      }`}
                    >
                      {/* User Profile */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                              isSuspended
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : 'bg-primary/10 text-primary border border-primary/20'
                            }`}
                          >
                            {(u.name || u.email || 'U').charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-foreground">{u.name || 'Unnamed User'}</p>
                              {selfUser && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-sm bg-blue-100 text-blue-700">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Tenant Association */}
                      <td className="px-6 py-4 text-muted-foreground">
                        {u.organization?.name || u.company || 'Platform (Root)'}
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

                      {/* Email Verification */}
                      <td className="px-6 py-4">
                        {u.isVerified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500">
                            <CheckCircle className="h-3.5 w-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 px-2.5 py-0.5 text-xs font-medium text-zinc-500">
                            <Clock className="h-3.5 w-3.5" /> Pending
                          </span>
                        )}
                      </td>

                      {/* System Role */}
                      <td className="px-6 py-4 capitalize font-medium text-foreground">
                        <span
                          className={`inline-flex rounded-md px-2.5 py-0.5 text-xs font-bold uppercase ${
                            u.role === 'super_admin'
                              ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                              : u.role === 'organizer'
                              ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                              : u.role === 'exhibitor'
                              ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                              : u.role === 'visitor'
                              ? 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                              : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                          }`}
                        >
                          {u.role?.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Suspend / Reactivate Action */}
                          {isSuspended ? (
                            <button
                              type="button"
                              onClick={() => openSuspendModal(u)}
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
                              onClick={() => openSuspendModal(u)}
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
                            onClick={() => openEditModal(u)}
                            className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground border border-transparent hover:border-border transition-colors cursor-pointer"
                            title="Edit user details & privileges"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          {/* Delete User Action */}
                          <button
                            type="button"
                            onClick={() => openDeleteModal(u)}
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
                Are you sure you want to permanently erase this user account?
              </p>
              <div className="bg-background/80 p-2.5 rounded-lg border border-border space-y-1">
                <p className="text-foreground font-bold">{targetDeleteUser.name}</p>
                <p className="text-muted-foreground font-mono text-[11px]">{targetDeleteUser.email}</p>
                <p className="text-muted-foreground capitalize">Role: {targetDeleteUser.role?.replace('_', ' ')}</p>
              </div>
              <p className="text-[11px] text-zinc-500">
                All login credentials and organization team memberships for this user will be removed immediately.
              </p>
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
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold text-foreground mb-1">Edit User Profile &amp; Access</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Update personal information, RBAC permissions, and access status.
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
