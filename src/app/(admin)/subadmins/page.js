'use client';

/**
 * @file subadmins/page.js
 * @description Subadmin & Role-Based Access Control (RBAC) Management Console.
 * Allows Super Administrators to provision subadmins, assign role titles,
 * configure granular module permissions, toggle active/suspended status, and reset credentials.
 */

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Edit,
  Key,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  X,
  Check,
  SlidersHorizontal,
  Calendar,
  CreditCard,
  Building2,
  LifeBuoy,
  Mail,
  HelpCircle,
  MessageSquare,
  Zap,
  Layers,
  Settings,
  Shield,
  UserCheck,
  UserX
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function SubadminsManagementPage() {
  const { accessToken, user: currentUser, isSuperAdmin } = useAuth();

  // Data states
  const [subadmins, setSubadmins] = useState([]);
  const [counts, setCounts] = useState({ total: 0, active: 0, suspended: 0, superAdmins: 0 });
  const [modules, setModules] = useState([]);
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'suspended'

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingSubadminId, setEditingSubadminId] = useState(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    adminRole: 'Event Operations Lead',
    status: 'active',
    phone: '',
    permissions: []
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Password Reset Modal State
  const [pwModal, setPwModal] = useState({ isOpen: false, subadmin: null, newPassword: '', loading: false });
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Feedback notifications
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Fetch subadmins and permissions schema
  const fetchSubadminsData = async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    try {
      const [subadminsRes, schemaRes] = await Promise.all([
        axios.get(`${API_URL}/admin/subadmins`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        }),
        axios.get(`${API_URL}/admin/subadmins/permissions-schema`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
      ]);

      if (subadminsRes.data?.success) {
        setSubadmins(subadminsRes.data.subadmins || []);
        if (subadminsRes.data.counts) {
          setCounts(subadminsRes.data.counts);
        }
      }

      if (schemaRes.data?.success) {
        setModules(schemaRes.data.modules || []);
        setPresets(schemaRes.data.presets || []);
      }
    } catch (err) {
      console.error('Error loading subadmin system:', err);
      showFeedback('error', err.response?.data?.error || 'Failed to fetch subadmins directory.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchSubadminsData();
    }
  }, [accessToken]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingSubadminId(null);
    setShowPassword(false);

    // Default permissions from first preset or operations preset
    const defaultPreset = presets.find(p => p.id === 'operations_manager') || presets[0];
    setForm({
      name: '',
      email: '',
      password: 'Pass@' + Math.floor(100000 + Math.random() * 900000),
      adminRole: defaultPreset ? defaultPreset.name : 'Event Operations Lead',
      status: 'active',
      phone: '',
      permissions: defaultPreset ? [...defaultPreset.permissions] : []
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (subadmin) => {
    setModalMode('edit');
    setEditingSubadminId(subadmin._id);
    setShowPassword(false);
    setForm({
      name: subadmin.name || '',
      email: subadmin.email || '',
      password: '', // Leave blank unless changing
      adminRole: subadmin.adminRole || 'Sub Administrator',
      status: subadmin.status || (subadmin.isSuspended ? 'suspended' : 'active'),
      phone: subadmin.phone || '',
      permissions: Array.isArray(subadmin.permissions) ? [...subadmin.permissions] : []
    });
    setIsModalOpen(true);
  };

  // Toggle individual permission checkbox
  const handleTogglePermission = (permId) => {
    setForm(prev => {
      const exists = prev.permissions.includes(permId);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter(p => p !== permId)
          : [...prev.permissions, permId]
      };
    });
  };

  // Toggle whole category permissions
  const handleToggleCategory = (categoryPerms) => {
    const ids = categoryPerms.map(p => p.id);
    const allSelected = ids.every(id => form.permissions.includes(id));

    setForm(prev => {
      if (allSelected) {
        // Deselect all in category
        return {
          ...prev,
          permissions: prev.permissions.filter(p => !ids.includes(p))
        };
      } else {
        // Select all in category
        const merged = Array.from(new Set([...prev.permissions, ...ids]));
        return { ...prev, permissions: merged };
      }
    });
  };

  // Apply Role Preset template
  const handleApplyPreset = (preset) => {
    setForm(prev => ({
      ...prev,
      adminRole: preset.name,
      permissions: [...preset.permissions]
    }));
    showFeedback('success', `Applied "${preset.name}" permission template (${preset.permissions.length} permissions)`);
  };

  // Select / Deselect All Permissions
  const handleSelectAllPermissions = (select) => {
    if (select) {
      const allIds = modules.flatMap(m => m.permissions.map(p => p.id));
      setForm(prev => ({ ...prev, permissions: allIds }));
    } else {
      setForm(prev => ({ ...prev, permissions: [] }));
    }
  };

  // Generate a random strong password
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm(prev => ({ ...prev, password: res }));
    setShowPassword(true);
  };

  // Submit Subadmin Form (Create or Edit)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      showFeedback('error', 'Name and email are required.');
      return;
    }

    if (modalMode === 'create' && (!form.password || form.password.length < 6)) {
      showFeedback('error', 'Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        const res = await axios.post(
          `${API_URL}/admin/subadmins`,
          {
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
            adminRole: form.adminRole.trim(),
            permissions: form.permissions,
            phone: form.phone.trim(),
            status: form.status
          },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (res.data?.success) {
          showFeedback('success', res.data.message || 'Subadmin created successfully!');
          setIsModalOpen(false);
          fetchSubadminsData(true);
        }
      } else {
        const payload = {
          name: form.name.trim(),
          adminRole: form.adminRole.trim(),
          permissions: form.permissions,
          phone: form.phone.trim(),
          status: form.status
        };
        if (form.password && form.password.trim().length >= 6) {
          payload.password = form.password.trim();
        }

        const res = await axios.put(
          `${API_URL}/admin/subadmins/${editingSubadminId}`,
          payload,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (res.data?.success) {
          showFeedback('success', res.data.message || 'Subadmin updated successfully!');
          setIsModalOpen(false);
          fetchSubadminsData(true);
        }
      }
    } catch (err) {
      console.error('Submit subadmin error:', err);
      showFeedback('error', err.response?.data?.error || 'Failed to save subadmin.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle active/suspended status directly from table
  const handleToggleStatus = async (subadmin) => {
    if (subadmin.role === 'super_admin') {
      showFeedback('error', 'Cannot suspend a Super Administrator account.');
      return;
    }

    const newStatus = subadmin.status === 'suspended' || subadmin.isSuspended ? 'active' : 'suspended';
    try {
      const res = await axios.put(
        `${API_URL}/admin/subadmins/${subadmin._id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data?.success) {
        showFeedback('success', `Subadmin "${subadmin.name}" is now ${newStatus.toUpperCase()}`);
        setSubadmins(prev =>
          prev.map(s => (s._id === subadmin._id ? { ...s, status: newStatus, isSuspended: newStatus === 'suspended' } : s))
        );
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to update subadmin status.');
    }
  };

  // Delete Subadmin
  const handleDeleteSubadmin = async (subadmin) => {
    if (subadmin.role === 'super_admin') {
      showFeedback('error', 'Super Administrator accounts cannot be deleted.');
      return;
    }
    if (!confirm(`Are you sure you want to permanently delete subadmin "${subadmin.name}" (${subadmin.email})?`)) {
      return;
    }

    try {
      const res = await axios.delete(`${API_URL}/admin/subadmins/${subadmin._id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data?.success) {
        showFeedback('success', res.data.message || 'Subadmin deleted successfully.');
        setSubadmins(prev => prev.filter(s => s._id !== subadmin._id));
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to delete subadmin.');
    }
  };

  // Reset Password Modal
  const handleOpenPwModal = (subadmin) => {
    setPwModal({
      isOpen: true,
      subadmin,
      newPassword: 'Pass@' + Math.floor(100000 + Math.random() * 900000),
      loading: false
    });
    setShowResetPassword(true);
  };

  const handleSavePasswordReset = async () => {
    if (!pwModal.newPassword || pwModal.newPassword.length < 6) {
      showFeedback('error', 'Password must be at least 6 characters.');
      return;
    }

    setPwModal(prev => ({ ...prev, loading: true }));
    try {
      const res = await axios.put(
        `${API_URL}/admin/subadmins/${pwModal.subadmin._id}`,
        { password: pwModal.newPassword },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data?.success) {
        showFeedback('success', `Password updated successfully for ${pwModal.subadmin.name}!`);
        setPwModal({ isOpen: false, subadmin: null, newPassword: '', loading: false });
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to reset password.');
      setPwModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Filtered Subadmins
  const filteredSubadmins = useMemo(() => {
    return subadmins.filter(sub => {
      // Status filter
      if (statusFilter === 'active' && (sub.status === 'suspended' || sub.isSuspended)) return false;
      if (statusFilter === 'suspended' && sub.status !== 'suspended' && !sub.isSuspended) return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        sub.name?.toLowerCase().includes(q) ||
        sub.email?.toLowerCase().includes(q) ||
        sub.adminRole?.toLowerCase().includes(q)
      );
    });
  }, [subadmins, statusFilter, searchQuery]);

  const totalAllPermsCount = useMemo(() => {
    return modules.reduce((acc, m) => acc + (m.permissions?.length || 0), 0);
  }, [modules]);

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="rounded-3xl border border-border bg-gradient-to-br from-card via-card to-indigo-950/20 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 ring-1 ring-indigo-500/20">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground">
                  Subadmins & Roles (RBAC)
                </h1>
                <p className="text-xs text-muted-foreground">
                  Role-Based Access Control command center for VisitExpo administrative team.
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
              Create subadmin accounts, assign custom or template role presets, and specify granular module permissions
              (Events, Moderation, Billing, Categories, Users) so team members only access what they need.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchSubadminsData(false)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-bold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              Create Subadmin
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border/60">
          <div className="rounded-2xl border border-border/80 bg-background/60 p-4 backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Subadmins</span>
              <Users className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-foreground">{counts.total}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Provisioned team members</p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-background/60 p-4 backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Active Subadmins</span>
              <UserCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">{counts.active}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Full console access granted</p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-background/60 p-4 backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Suspended</span>
              <UserX className="h-4 w-4 text-rose-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">{counts.suspended}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Temporarily deactivated</p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-background/60 p-4 backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Super Admins</span>
              <Shield className="h-4 w-4 text-purple-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-purple-600 dark:text-purple-400">{counts.superAdmins}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Global Controller account</p>
          </div>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between animate-in fade-in-50 duration-200 ${
          feedback.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
            : 'bg-destructive/10 border-destructive/30 text-destructive'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Preset Role Templates Showcase */}
      <div className="rounded-3xl border border-border bg-card p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" /> 1-Click Role Presets
            </h3>
            <p className="text-xs text-muted-foreground">
              Standardized security profiles you can instantly apply when provisioning new subadmins.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {presets.map(preset => (
            <div
              key={preset.id}
              className="rounded-2xl border border-border/80 bg-background/50 p-4 flex flex-col justify-between space-y-3 hover:border-primary/40 transition-all"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${preset.badgeColor}`}>
                    {preset.badge}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    {preset.permissions.length} perms
                  </span>
                </div>
                <h4 className="text-xs font-bold text-foreground leading-snug">{preset.name}</h4>
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </div>

              <button
                onClick={() => {
                  handleOpenCreateModal();
                  handleApplyPreset(preset);
                }}
                className="w-full text-center text-xs font-bold text-primary hover:bg-primary/10 py-1.5 rounded-xl border border-primary/20 transition-all cursor-pointer"
              >
                Use Template →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Directory & Management Table */}
      <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm space-y-4 p-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search subadmin by name, email, or role title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-background pl-10 pr-9 py-2 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 border border-border rounded-xl p-1 bg-background">
            {[
              { id: 'all', label: 'All Accounts' },
              { id: 'active', label: 'Active Only' },
              { id: 'suspended', label: 'Suspended' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-border">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs font-semibold">Loading subadmin team directory...</p>
            </div>
          ) : filteredSubadmins.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mx-auto">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground">No administrative accounts found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No subadmins matched your search query. Click "Create Subadmin" to provision a new team member.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-muted-foreground">
              <thead className="bg-muted/40 uppercase text-[10px] font-bold text-foreground/80 tracking-wider border-b border-border">
                <tr>
                  <th className="px-5 py-3.5">Subadmin Identity</th>
                  <th className="px-5 py-3.5">Assigned Role Title</th>
                  <th className="px-5 py-3.5">Module Permissions</th>
                  <th className="px-5 py-3.5">Access Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSubadmins.map(sub => {
                  const isSuper = sub.role === 'super_admin';
                  const isSuspended = sub.status === 'suspended' || sub.isSuspended;
                  const permsCount = isSuper ? totalAllPermsCount : (sub.permissions?.length || 0);

                  return (
                    <tr key={sub._id} className="hover:bg-muted/20 transition-colors">
                      {/* Identity */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-2xl flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0 ${
                            isSuper
                              ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                              : isSuspended
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              : 'bg-primary/15 text-primary border border-primary/30'
                          }`}>
                            {sub.name?.slice(0, 2).toUpperCase() || 'SA'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-foreground text-sm">
                                {sub.name}
                              </span>
                              {isSuper && (
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                                  Super Admin
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                              {sub.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Assigned Role */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${
                          isSuper
                            ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20'
                            : 'bg-secondary text-foreground border-border'
                        }`}>
                          <Shield className="h-3.5 w-3.5 text-primary" />
                          {isSuper ? 'Global System Controller' : (sub.adminRole || 'Sub Administrator')}
                        </span>
                      </td>

                      {/* Permissions Granted */}
                      <td className="px-5 py-4">
                        {isSuper ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Full Root Access ({totalAllPermsCount} modules)
                          </span>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-muted/60 text-foreground border border-border">
                              <Key className="h-3 w-3 text-indigo-500" />
                              {permsCount} of {totalAllPermsCount} permissions
                            </span>
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {(sub.permissions || []).slice(0, 3).map((p, i) => (
                                <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground border border-border/50">
                                  {p}
                                </span>
                              ))}
                              {(sub.permissions || []).length > 3 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground">
                                  +{(sub.permissions || []).length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {isSuper ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Permanent Active
                          </span>
                        ) : isSuspended ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active Access
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        {isSuper ? (
                          <span className="text-[11px] text-muted-foreground italic pr-2">
                            Protected Super Admin
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit Permissions */}
                            <button
                              onClick={() => handleOpenEditModal(sub)}
                              className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer"
                              title="Edit Subadmin & Permissions"
                            >
                              <Edit className="h-4 w-4" />
                            </button>

                            {/* Reset Password */}
                            <button
                              onClick={() => handleOpenPwModal(sub)}
                              className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10 transition-all cursor-pointer"
                              title="Reset Password"
                            >
                              <Key className="h-4 w-4" />
                            </button>

                            {/* Suspend / Reactivate */}
                            <button
                              onClick={() => handleToggleStatus(sub)}
                              className={`p-1.5 rounded-lg border border-border bg-card transition-all cursor-pointer ${
                                isSuspended
                                  ? 'text-emerald-500 hover:bg-emerald-500/10'
                                  : 'text-amber-500 hover:bg-amber-500/10'
                              }`}
                              title={isSuspended ? 'Reactivate Subadmin' : 'Suspend Subadmin'}
                            >
                              {isSuspended ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteSubadmin(sub)}
                              className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                              title="Delete Subadmin"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CREATE & EDIT SUBADMIN MODAL */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in-50 duration-200">
          <div className="w-full max-w-4xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-foreground">
                    {modalMode === 'create' ? 'Provision New Subadmin' : 'Edit Subadmin & Permissions'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Configure account credentials, administrative title, and granular module permissions.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitForm} className="overflow-y-auto p-6 space-y-6 flex-1">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  1. Account Identity & Credentials
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikram Malhotra"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Email Address *</label>
                    <input
                      type="email"
                      required
                      disabled={modalMode === 'edit'}
                      placeholder="e.g. vikram@visitexpo.in"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
                    />
                  </div>

                  {/* Admin Role Title */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Administrative Role Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior Events Coordinator"
                      value={form.adminRole}
                      onChange={(e) => setForm({ ...form, adminRole: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  {/* Account Status */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Access Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                    >
                      <option value="active">Active (Console Access Granted)</option>
                      <option value="suspended">Suspended (Access Temporarily Revoked)</option>
                    </select>
                  </div>

                  {/* Password */}
                  <div className="space-y-1 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-foreground">
                        {modalMode === 'create' ? 'Initial Password *' : 'Update Password (leave blank to keep current)'}
                      </label>
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="text-[11px] font-bold text-primary hover:underline"
                      >
                        Generate Random Password
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required={modalMode === 'create'}
                        placeholder={modalMode === 'create' ? 'Min 6 characters' : 'Enter new password or leave blank'}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background pl-3.5 pr-10 py-2.5 text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Role Presets Toolbar */}
              <div className="space-y-3 border-t border-border pt-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      2. Role Template Quick-Select
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Click any preset to instantly apply its permission set to this subadmin.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectAllPermissions(true)}
                      className="text-[11px] font-bold text-foreground hover:text-primary px-2.5 py-1 rounded-lg border border-border bg-secondary"
                    >
                      Select All ({totalAllPermsCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectAllPermissions(false)}
                      className="text-[11px] font-bold text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-lg border border-border"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {presets.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-secondary/80 hover:bg-secondary text-xs font-bold text-foreground transition-all cursor-pointer"
                    >
                      <span>{p.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        ({p.permissions.length})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Granular Permissions Matrix */}
              <div className="space-y-4 border-t border-border pt-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    3. Granular Module Permissions
                  </h4>
                  <span className="text-xs font-black text-primary px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                    {form.permissions.length} of {totalAllPermsCount} permissions selected
                  </span>
                </div>

                <div className="space-y-4">
                  {modules.map(mod => {
                    const modPermIds = mod.permissions.map(p => p.id);
                    const selectedInMod = modPermIds.filter(id => form.permissions.includes(id)).length;
                    const allModSelected = selectedInMod === modPermIds.length;

                    return (
                      <div key={mod.category} className="rounded-2xl border border-border bg-background/50 p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-foreground">
                              {mod.category}
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                              {selectedInMod} / {modPermIds.length}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleCategory(mod.permissions)}
                            className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                          >
                            {allModSelected ? 'Deselect Category' : 'Select All in Category'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {mod.permissions.map(perm => {
                            const isChecked = form.permissions.includes(perm.id);

                            return (
                              <label
                                key={perm.id}
                                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                  isChecked
                                    ? 'bg-primary/5 border-primary/40 text-foreground'
                                    : 'bg-card border-border/70 text-muted-foreground hover:border-border'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleTogglePermission(perm.id)}
                                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/40 cursor-pointer"
                                />
                                <div className="space-y-0.5 text-xs flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-foreground">
                                      {perm.label}
                                    </span>
                                    <span className="text-[9px] font-mono text-muted-foreground">
                                      {perm.id}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    {perm.description}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between shrink-0">
              <div className="text-xs text-muted-foreground font-semibold">
                Selected: <strong className="text-foreground">{form.permissions.length}</strong> permissions
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitForm}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {modalMode === 'create' ? 'Create Subadmin' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK RESET PASSWORD MODAL */}
      {/* ========================================================================= */}
      {pwModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in-50 duration-200">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                  <Key className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-foreground">Reset Subadmin Password</h3>
                  <p className="text-[11px] text-muted-foreground">{pwModal.subadmin?.name} ({pwModal.subadmin?.email})</p>
                </div>
              </div>
              <button
                onClick={() => setPwModal({ isOpen: false, subadmin: null, newPassword: '', loading: false })}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">New Secure Password</label>
              <div className="relative">
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  value={pwModal.newPassword}
                  onChange={(e) => setPwModal({ ...pwModal, newPassword: e.target.value })}
                  placeholder="Min 6 characters"
                  className="w-full rounded-xl border border-border bg-background pl-3.5 pr-10 py-2.5 text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  type="button"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Copy and share this new credential with the subadmin so they can log in immediately.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setPwModal({ isOpen: false, subadmin: null, newPassword: '', loading: false })}
                className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePasswordReset}
                disabled={pwModal.loading}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-all cursor-pointer"
              >
                {pwModal.loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
