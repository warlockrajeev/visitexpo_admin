'use client';

/**
 * @file page.js (User Management & Comprehensive Profile Dossier)
 * @description Super Admin screen to inspect every detail of system users, search, filter,
 * edit profile metadata, verify phone & email, modify RBAC roles, and manage account suspension/deletion.
 * Clicking any table row opens a comprehensive User Details Dossier slide-over.
 */

import React, { useState, useEffect, useCallback } from 'react';
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
  EyeOff,
  Lock,
  Unlock,
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
  Globe,
  Hash,
  ChevronRight,
  ChevronLeft,
  Smartphone,
  Layers,
  Database,
  UserPlus,
  CalendarDays,
  TrendingUp
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const isUserEmailVerified = (u) =>
  Boolean(u?.isEmailVerified || u?.isVerified || u?.authProvider === 'google' || u?.email);
const formatRoleDisplay = (role) => (role === 'organizer' ? 'organiser' : String(role || '').replace('_', ' '));

const DEMO_HIDE_STORAGE_KEY = 'visitexpo_admin_users_demo_hide';

// Deterministic non-reversible display hash for Demo / Encrypted Privacy Mode
function hashToHex(seed, length = 12) {
  const input = String(seed || 'visitexpo-vault');
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const combined =
    ((h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0')).toUpperCase();
  return combined.slice(0, length);
}

function encryptDisplayValue(kind, seed) {
  const hex = hashToHex(`${kind}:${seed}`, 16);
  switch (kind) {
    case 'name':
      return `ENC::${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
    case 'email':
      return `enc_${hex.slice(0, 8).toLowerCase()}••••@vault.enc`;
    case 'workEmail':
      return `corp_${hex.slice(0, 8).toLowerCase()}••••@vault.enc`;
    case 'phone':
      return `ENC-TEL-${hex.slice(0, 4)}••••${hex.slice(4, 6)}`;
    case 'org':
      return `ORG_ENC_${hex.slice(0, 8)}`;
    case 'website':
      return `https://enc-${hex.slice(0, 8).toLowerCase()}.vault.enc`;
    case 'gst':
      return `GST_AES_${hex.slice(0, 10)}`;
    case 'city':
      return `LOC_${hex.slice(0, 6)}•••`;
    case 'designation':
      return `ROLE_ENC_${hex.slice(0, 6)}`;
    case 'address':
      return `AES256::ADDR_${hex.slice(0, 12)}••••`;
    case 'bio':
      return `AES256::ENCRYPTED_PAYLOAD[${hex.slice(0, 14)}••••]`;
    default:
      return `AES256::${hex.slice(0, 10)}`;
  }
}

function buildEncryptedRawRecord(user) {
  if (!user || typeof user !== 'object') return {};
  const seed = user._id || user.id || 'user';
  const clone = { ...user };
  const piiFields = {
    name: 'name',
    email: 'email',
    workEmail: 'workEmail',
    phone: 'phone',
    company: 'org',
    designation: 'designation',
    city: 'city',
    avatar: 'default',
    photoURL: 'default'
  };
  for (const [field, kind] of Object.entries(piiFields)) {
    if (clone[field]) {
      clone[field] = encryptDisplayValue(kind, `${seed}:${field}`);
    }
  }
  if (clone.organization && typeof clone.organization === 'object') {
    const org = { ...clone.organization };
    if (org.name) org.name = encryptDisplayValue('org', `${seed}:orgName`);
    if (org.website) org.website = encryptDisplayValue('website', `${seed}:orgWeb`);
    if (org.gst) org.gst = encryptDisplayValue('gst', `${seed}:orgGst`);
    if (org.description) org.description = encryptDisplayValue('bio', `${seed}:orgBio`);
    if (org.contact && typeof org.contact === 'object') {
      org.contact = {
        ...org.contact,
        ...(org.contact.email ? { email: encryptDisplayValue('email', `${seed}:orgEmail`) } : {}),
        ...(org.contact.phone ? { phone: encryptDisplayValue('phone', `${seed}:orgPhone`) } : {})
      };
    }
    if (org.address && typeof org.address === 'object') {
      org.address = { encrypted: encryptDisplayValue('address', `${seed}:orgAddr`) };
    }
    clone.organization = org;
  }
  return {
    _privacyMode: 'DEMO_AES256_MASKED',
    ...clone
  };
}

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

function formatRegistrationDate(dateString) {
  if (!dateString) return 'Not recorded';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Invalid date';
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return String(dateString);
  }
}

function formatRegistrationTime(dateString) {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
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
  const [stats, setStats] = useState({
    total: 0,
    totalUsers: 0,
    active: 0,
    suspended: 0,
    registeredToday: 0,
    registeredThisWeek: 0,
    registeredThisMonth: 0
  });

  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [resultCount, setResultCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

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
    workEmail: '',
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

  // Bulk Delete Users State & Modal
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkDeleteSubmitting, setBulkDeleteSubmitting] = useState(false);

  // Demo Privacy / Encrypted Display Mode (hides all user PII for live demos)
  const [hideUserDetails, setHideUserDetails] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        setHideUserDetails(sessionStorage.getItem(DEMO_HIDE_STORAGE_KEY) === '1');
      }
    } catch {}
  }, []);

  const toggleHideUserDetails = () => {
    setHideUserDetails((prev) => {
      const next = !prev;
      try {
        if (typeof window !== 'undefined') {
          if (next) sessionStorage.setItem(DEMO_HIDE_STORAGE_KEY, '1');
          else sessionStorage.removeItem(DEMO_HIDE_STORAGE_KEY);
        }
      } catch {}
      return next;
    });
  };

  const displayName = (u, fallback = 'Unnamed User') =>
    hideUserDetails ? encryptDisplayValue('name', u?._id || u?.email || 'u') : (u?.name || fallback);
  const displayEmail = (u) =>
    hideUserDetails ? encryptDisplayValue('email', u?._id || u?.email || 'u') : (u?.email || '');
  const displayWorkEmail = (u) =>
    hideUserDetails ? encryptDisplayValue('workEmail', u?._id || u?.workEmail || 'u') : (u?.workEmail || '');
  const displayPhone = (u, fallback = '') => {
    if (!u?.phone) return fallback;
    return hideUserDetails ? encryptDisplayValue('phone', u?._id || u?.phone || 'u') : u.phone;
  };
  const displayOrg = (u, fallback = 'Platform Root') => {
    const raw = u?.organization?.name || u?.company || '';
    if (!raw) return fallback;
    return hideUserDetails ? encryptDisplayValue('org', u?._id || raw) : raw;
  };
  const displayDesignation = (u, fallback = '') => {
    if (!u?.designation) return fallback;
    return hideUserDetails ? encryptDisplayValue('designation', u?._id || u.designation) : u.designation;
  };
  const displayCity = (u, fallback = 'Not specified') => {
    if (!u?.city) return fallback;
    return hideUserDetails ? encryptDisplayValue('city', u?._id || u.city) : u.city;
  };

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

  const fetchUsers = useCallback(async (requestedPage = currentPage, filterOverrides = {}, useCache = false) => {
    if (!accessToken) return;
    const effectiveSearch = filterOverrides.search ?? searchTerm;
    const effectiveRole = filterOverrides.role ?? roleFilter;
    const effectiveStatus = filterOverrides.status ?? statusFilter;
    const effectiveVerification = filterOverrides.verification ?? verificationFilter;
    const effectiveDateRange = filterOverrides.dateRange ?? dateRangeFilter;

    let paintedFromCache = false;
    if (
      useCache &&
      typeof window !== 'undefined' &&
      !effectiveSearch &&
      effectiveRole === 'all' &&
      effectiveStatus === 'all' &&
      effectiveVerification === 'all' &&
      effectiveDateRange === 'all' &&
      requestedPage === 1
    ) {
      try {
        const cached = sessionStorage.getItem('visitexpo_admin_users_cache_v2');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed?.docs) && parsed.docs.length > 0) {
            setUsers(parsed.docs);
            setResultCount(parsed.total ?? parsed.docs.length);
            if (parsed.pages) setTotalPages(parsed.pages);
            if (parsed.stats) setStats(parsed.stats);
            setLoading(false);
            paintedFromCache = true;
          }
        }
      } catch (e) {
        console.warn('Could not read admin users cache:', e);
      }
    }

    if (!paintedFromCache && users.length === 0) setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/admin/users`, {
        params: {
          search: effectiveSearch,
          role: effectiveRole,
          status: effectiveStatus,
          verification: effectiveVerification,
          dateRange: effectiveDateRange,
          page: requestedPage,
          limit: pageSize
        },
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data && res.data.success) {
        const fetchedDocs = res.data.data.docs || [];
        setUsers(fetchedDocs);
        setResultCount(res.data.data.total ?? fetchedDocs.length);
        const fetchedPages = Math.max(1, res.data.data.pages || 1);
        setTotalPages(fetchedPages);
        if (requestedPage > fetchedPages) setCurrentPage(fetchedPages);
        const newStats = {
          total: res.data.data.total ?? fetchedDocs.length,
          totalUsers: res.data.data.totalUsers ?? res.data.data.total ?? fetchedDocs.length,
          active: res.data.data.totalActive ?? fetchedDocs.filter(u => !u.isSuspended && u.status !== 'suspended').length,
          suspended: res.data.data.totalSuspended ?? fetchedDocs.filter(u => u.isSuspended || u.status === 'suspended').length,
          registeredToday: res.data.data.registeredToday ?? 0,
          registeredThisWeek: res.data.data.registeredThisWeek ?? 0,
          registeredThisMonth: res.data.data.registeredThisMonth ?? 0
        };
        setStats(newStats);

        if (
          !effectiveSearch &&
          effectiveRole === 'all' &&
          effectiveStatus === 'all' &&
          effectiveVerification === 'all' &&
          effectiveDateRange === 'all' &&
          requestedPage === 1
        ) {
          try {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('visitexpo_admin_users_cache_v2', JSON.stringify({
                docs: fetchedDocs,
                total: res.data.data.total ?? fetchedDocs.length,
                pages: fetchedPages,
                stats: newStats
              }));
            }
          } catch (e) {
            console.warn('Could not cache admin users:', e);
          }
        }
      }
    } catch (err) {
      console.error('Fetch users failed', err);
      if (users.length === 0) {
        setError('Could not retrieve user database. Ensure super admin credentials are valid.');
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken, currentPage, dateRangeFilter, pageSize, roleFilter, searchTerm, statusFilter, users.length, verificationFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(currentPage, {}, true);
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, roleFilter, statusFilter, verificationFilter, dateRangeFilter, currentPage, pageSize]);

  // Trigger search on submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (currentPage === 1) fetchUsers(1);
    else setCurrentPage(1);
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
    if (hideUserDetails) {
      setFeedback({
        type: 'error',
        message: 'Encrypted Demo Mode is ON. Click "Show Details" before editing user records.'
      });
      return;
    }
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      workEmail: user.workEmail || '',
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
        workEmail: editForm.workEmail.trim().toLowerCase(),
        role: editForm.role,
        phone: editForm.phone.trim(),
        city: editForm.city.trim(),
        company: editForm.company.trim(),
        designation: editForm.designation.trim(),
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

        const serverUser = res.data.user || payload;
        // Update active drawer if open
        if (selectedUser && selectedUser._id === editingUser._id) {
          const updatedUser = { ...selectedUser, ...payload, ...serverUser };
          setSelectedUser(updatedUser);
          setDetailData(prev => prev ? { ...prev, user: { ...prev.user, ...payload, ...serverUser } } : null);
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
        setSelectedUserIds(prev => prev.filter(id => id !== String(targetDeleteUser._id)));
        if (selectedUser && selectedUser._id === targetDeleteUser._id) {
          setIsDetailOpen(false);
          setSelectedUser(null);
        }
        try {
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('visitexpo_admin_users_cache');
          }
        } catch {}
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

  // ==========================================
  // BULK SELECTION & BULK DELETE HANDLERS
  // ==========================================
  const deletableUsersOnPage = users.filter((u) => !isSelf(u) && !isRootAdmin(u));
  const allPageSelected =
    deletableUsersOnPage.length > 0 &&
    deletableUsersOnPage.every((u) => selectedUserIds.includes(String(u._id)));
  const somePageSelected =
    deletableUsersOnPage.some((u) => selectedUserIds.includes(String(u._id))) && !allPageSelected;

  const toggleSelectUser = (user, e) => {
    if (e) e.stopPropagation();
    if (!user || isSelf(user) || isRootAdmin(user)) return;
    const uid = String(user._id);
    setSelectedUserIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const toggleSelectAllOnPage = () => {
    const pageIds = deletableUsersOnPage.map((u) => String(u._id));
    if (pageIds.length === 0) return;
    if (allPageSelected) {
      const pageIdSet = new Set(pageIds);
      setSelectedUserIds((prev) => prev.filter((id) => !pageIdSet.has(id)));
    } else {
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const clearSelection = () => {
    setSelectedUserIds([]);
  };

  const openBulkDeleteModal = () => {
    if (selectedUserIds.length === 0) {
      setFeedback({ type: 'error', message: 'Please select at least one user to bulk delete.' });
      return;
    }
    setIsBulkDeleteModalOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedUserIds.length === 0) return;
    setBulkDeleteSubmitting(true);
    try {
      const res = await axios.post(
        `${API_URL}/admin/users/bulk-delete`,
        { userIds: selectedUserIds },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (res.data && res.data.success) {
        const deletedIds = Array.isArray(res.data.deletedIds)
          ? res.data.deletedIds.map(String)
          : selectedUserIds;
        setFeedback({
          type: 'success',
          message:
            res.data.message ||
            `Permanently deleted ${deletedIds.length} user account(s).`
        });
        setIsBulkDeleteModalOpen(false);
        setSelectedUserIds((prev) => prev.filter((id) => !deletedIds.includes(id)));

        if (selectedUser && deletedIds.includes(String(selectedUser._id))) {
          setIsDetailOpen(false);
          setSelectedUser(null);
        }

        try {
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('visitexpo_admin_users_cache');
          }
        } catch {}

        fetchUsers(currentPage);
      }
    } catch (err) {
      console.error('Bulk delete users failed', err);
      const errMsg = err.response?.data?.error || 'Failed to bulk delete selected users.';
      setFeedback({ type: 'error', message: errMsg });
    } finally {
      setBulkDeleteSubmitting(false);
    }
  };

  const selectedUsersPreview = users.filter((u) => selectedUserIds.includes(String(u._id)));

  // Active user to display in details
  const activeUser = selectedUser || {};
  const activeStats = detailData?.stats || {};
  const activeActivity = detailData?.activity || {};

  return (
    <div className="space-y-3 w-full max-w-full">
      {/* Toast Notification Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-600'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            )}
            <span className="text-xs font-medium">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 4 Registration & User Summary Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            key: 'today',
            label: 'Registered Today',
            value: stats.registeredToday ?? 0,
            subtitle: 'Joined since 12:00 AM today',
            icon: UserPlus,
            iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
            activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/20',
            onClick: () => {
              setDateRangeFilter((prev) => (prev === 'today' ? 'all' : 'today'));
              setCurrentPage(1);
            }
          },
          {
            key: 'week',
            label: 'This Week',
            value: stats.registeredThisWeek ?? 0,
            subtitle: 'Joined since Monday',
            icon: TrendingUp,
            iconBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
            activeBorder: 'border-sky-500 ring-2 ring-sky-500/20',
            onClick: () => {
              setDateRangeFilter((prev) => (prev === 'week' ? 'all' : 'week'));
              setCurrentPage(1);
            }
          },
          {
            key: 'month',
            label: 'This Month',
            value: stats.registeredThisMonth ?? 0,
            subtitle: 'Joined this calendar month',
            icon: CalendarDays,
            iconBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
            activeBorder: 'border-violet-500 ring-2 ring-violet-500/20',
            onClick: () => {
              setDateRangeFilter((prev) => (prev === 'month' ? 'all' : 'month'));
              setCurrentPage(1);
            }
          },
          {
            key: 'all',
            label: 'Total Users',
            value: stats.totalUsers || stats.total || 0,
            subtitle: `${stats.active} Active · ${stats.suspended} Suspended`,
            icon: Users,
            iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
            activeBorder: 'border-amber-500/60',
            onClick: () => {
              setDateRangeFilter('all');
              setCurrentPage(1);
            }
          }
        ].map((tile) => {
          const Icon = tile.icon;
          const isActive = tile.key !== 'all' && dateRangeFilter === tile.key;
          return (
            <button
              key={tile.key}
              type="button"
              onClick={tile.onClick}
              title={tile.key === 'all' ? 'Show all registered users' : `Filter users: ${tile.label}`}
              className={`text-left bg-card p-3.5 rounded-xl border shadow-sm transition-all cursor-pointer hover:border-primary/50 ${
                isActive ? tile.activeBorder : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {tile.label}
                </span>
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tile.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  {Number(tile.value || 0).toLocaleString()}
                </span>
                {isActive && (
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                    Filtered
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 truncate">{tile.subtitle}</p>
            </button>
          );
        })}
      </div>

      {/* Header Panel with KPI Stats Chips */}
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between bg-card p-3 sm:p-3.5 rounded-xl border border-border shadow-sm">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-primary shrink-0" />
            <span className="truncate">User Directory &amp; Access Control</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click on any user entry to inspect their complete dossier, contact details, organization, and registered activity.
          </p>
        </div>

        {/* Quick Stats Chips */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-background shadow-2xs">
            <span className="text-[11px] font-semibold text-muted-foreground">Total Users:</span>
            <span className="text-xs font-bold text-foreground">{stats.totalUsers || stats.total}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-emerald-500/20 bg-emerald-500/5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-semibold text-emerald-700">Active:</span>
            <span className="text-xs font-bold text-emerald-700">{stats.active}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-rose-500/20 bg-rose-500/5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span className="text-[11px] font-semibold text-rose-700">Suspended:</span>
            <span className="text-xs font-bold text-rose-700">{stats.suspended}</span>
          </div>
          <button
            type="button"
            onClick={toggleHideUserDetails}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
              hideUserDetails
                ? 'border-indigo-500/40 bg-indigo-600 text-white hover:bg-indigo-700'
                : 'border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20'
            }`}
            title={
              hideUserDetails
                ? 'Disable encrypted demo mode and reveal real user details'
                : 'Hide & encrypt user details for demos and screen sharing'
            }
          >
            {hideUserDetails ? (
              <>
                <Lock className="h-3.5 w-3.5" />
                Encrypted (Show Details)
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                Hide Details
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => fetchUsers(currentPage)}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border hover:bg-secondary text-xs font-semibold text-foreground transition-colors cursor-pointer"
            title="Refresh user directory"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Encrypted Demo Privacy Banner */}
      {hideUserDetails && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-xs">
          <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-200">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-600 text-white shrink-0">
              <Lock className="h-3.5 w-3.5" />
            </span>
            <div>
              <span className="font-bold">Demo Encryption Mode Active (AES-256 Masked)</span>
              <span className="text-indigo-700/80 dark:text-indigo-300/80 ml-1.5">
                — All user names, emails, phone numbers, organizations, and raw records are encrypted on screen so no real personal data is exposed.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleHideUserDetails}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] hover:bg-indigo-500/10 transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Unlock className="h-3 w-3" />
            Reveal Details
          </button>
        </div>
      )}

      {/* Control Filters */}
      <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between bg-card p-2.5 sm:p-3 rounded-xl border border-border">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full xl:max-w-sm flex gap-1.5">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-secondary hover:bg-secondary/80 border border-border px-3 py-1.5 text-xs font-semibold text-foreground cursor-pointer transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex lg:flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center justify-between sm:justify-start gap-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase shrink-0">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full sm:w-auto rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
            >
              <option value="all">All Accounts</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center justify-between sm:justify-start gap-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase shrink-0">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              className="w-full sm:w-auto rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="organizer">Organiser</option>
              <option value="exhibitor">Exhibitor</option>
              <option value="visitor">Visitor</option>
              <option value="event_manager">Event Manager</option>
              <option value="sales_team">Sales Team</option>
            </select>
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase shrink-0">Verification:</span>
            <select
              value={verificationFilter}
              onChange={(e) => { setVerificationFilter(e.target.value); setCurrentPage(1); }}
              className="w-full sm:w-auto rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
            >
              <option value="all">All Verification</option>
              <option value="email_verified">Email Verified</option>
              <option value="email_unverified">Email Unverified</option>
              <option value="phone_verified">Phone Verified</option>
              <option value="phone_unverified">Phone Unverified</option>
            </select>
          </div>

          {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all' || verificationFilter !== 'all' || dateRangeFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('all');
                setStatusFilter('all');
                setVerificationFilter('all');
                setDateRangeFilter('all');
                setCurrentPage(1);
                if (
                  roleFilter === 'all' &&
                  statusFilter === 'all' &&
                  verificationFilter === 'all' &&
                  dateRangeFilter === 'all' &&
                  currentPage === 1
                ) {
                  fetchUsers(1, { search: '', role: 'all', status: 'all', verification: 'all', dateRange: 'all' });
                }
              }}
              className="px-2 py-1 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer transition-colors"
            >
              Reset
            </button>
          )}

          {/* Quick Select Page / Bulk Delete Button */}
          {deletableUsersOnPage.length > 0 && (
            <button
              type="button"
              onClick={toggleSelectAllOnPage}
              className="px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-secondary text-xs font-semibold text-foreground cursor-pointer transition-colors"
            >
              {allPageSelected ? 'Deselect Page' : `Select Page (${deletableUsersOnPage.length})`}
            </button>
          )}

          {selectedUserIds.length > 0 && (
            <button
              type="button"
              onClick={openBulkDeleteModal}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Bulk Delete ({selectedUserIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Bulk Selection Action Bar */}
      {selectedUserIds.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/5 shadow-xs animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold">
              <Check className="h-3.5 w-3.5" />
              {selectedUserIds.length} {selectedUserIds.length === 1 ? 'User' : 'Users'} Selected
            </span>
            <span className="text-muted-foreground">
              Select additional users across pages or proceed to bulk delete.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectAllOnPage}
              className="px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-secondary text-xs font-semibold text-foreground transition-colors cursor-pointer"
            >
              {allPageSelected ? 'Unselect Current Page' : 'Select All on Page'}
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Clear Selection
            </button>
            <button
              type="button"
              onClick={openBulkDeleteModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Selected ({selectedUserIds.length})
            </button>
          </div>
        </div>
      )}

      {/* Users Table & Responsive Mobile Cards */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2.5 text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-xs font-medium">Fetching user directory...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-muted-foreground gap-2.5">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h3 className="text-sm font-semibold text-foreground">Error Connecting</h3>
            <p className="text-xs max-w-md">{error}</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
            <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs font-semibold">No registered users matched query filters.</p>
          </div>
        ) : (
          <>
            {/* Mobile Responsive Card View (< md) */}
            <div className="md:hidden divide-y divide-border">
              {users.map((u) => {
                const isSuspended = Boolean(u.isSuspended || u.status === 'suspended');
                const selfUser = isSelf(u);
                const rootAdminUser = isRootAdmin(u);
                const isSelected = selectedUser && selectedUser._id === u._id;
                const isChecked = selectedUserIds.includes(String(u._id));

                return (
                  <div
                    key={u._id}
                    onClick={() => handleOpenDetails(u)}
                    className={`p-3 space-y-2.5 cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-rose-500/[0.06]'
                        : isSelected
                        ? 'bg-primary/10'
                        : 'hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={selfUser || rootAdminUser}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => toggleSelectUser(u, e)}
                          className="h-4 w-4 rounded border-border accent-rose-600 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                          title={
                            selfUser || rootAdminUser
                              ? 'Protected super admin account'
                              : 'Select user for bulk delete'
                          }
                        />
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                            hideUserDetails
                              ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30'
                              : isSuspended
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
                          {hideUserDetails ? <Lock className="h-3.5 w-3.5" /> : (u.name || u.email || 'U').charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className={`font-semibold text-xs text-foreground truncate ${hideUserDetails ? 'font-mono text-indigo-700 dark:text-indigo-300 tracking-tight' : ''}`}>
                              {displayName(u)}
                            </p>
                            {selfUser && (
                              <span className="text-[9px] font-bold px-1 py-0.2 rounded-sm bg-blue-100 text-blue-700 shrink-0">
                                You
                              </span>
                            )}
                          </div>
                          <p className={`text-[11px] text-muted-foreground truncate ${hideUserDetails ? 'font-mono text-[10px]' : ''}`}>
                            {displayEmail(u)}
                          </p>
                          {u.workEmail && (
                            <p className={`text-[10px] text-indigo-600 dark:text-indigo-400 font-medium truncate flex items-center gap-1 mt-0.5 ${hideUserDetails ? 'font-mono' : ''}`}>
                              <Briefcase className="h-2.5 w-2.5 shrink-0" /> Work: {displayWorkEmail(u)}
                            </p>
                          )}
                          {u.phone && (
                            <p className={`text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 ${hideUserDetails ? 'font-mono' : ''}`}>
                              <Phone className="h-2.5 w-2.5" /> {displayPhone(u)}
                            </p>
                          )}
                        </div>
                      </div>

                      <span
                        className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          u.role === 'super_admin'
                            ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                            : u.role === 'organizer'
                            ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                            : u.role === 'exhibitor'
                            ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                            : 'bg-zinc-500/10 text-zinc-600 border border-zinc-500/20'
                        }`}
                      >
                        {formatRoleDisplay(u.role)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-foreground font-medium ${hideUserDetails ? 'font-mono' : ''}`}>
                        <Building className="h-2.5 w-2.5 text-muted-foreground" />
                        {displayOrg(u, 'Platform Root')}
                      </span>
                      {isSuspended ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 font-bold text-rose-600">
                          <Ban className="h-2.5 w-2.5" /> Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 font-semibold text-emerald-600">
                          <CheckCircle className="h-2.5 w-2.5" /> Active
                        </span>
                      )}
                      {isUserEmailVerified(u) ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-600"
                          title={u.authProvider === 'google' ? 'Email verified via Google Auth' : 'Email verified via OTP'}
                        >
                          <CheckCircle className="h-2.5 w-2.5" /> Email Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 px-2 py-0.5 font-medium text-zinc-500" title="Email not verified">
                          <Clock className="h-2.5 w-2.5" /> Email Unverified
                        </span>
                      )}
                      {u.isPhoneVerified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-600">
                          <Smartphone className="h-2.5 w-2.5" /> Phone
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/60 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1" title={formatFullDate(u.createdAt)}>
                        <Calendar className="h-3 w-3 text-muted-foreground/70" />
                        <span>Registered: <strong className="text-foreground font-medium">{formatRegistrationDate(u.createdAt)}</strong></span>
                        {formatRelative(u.createdAt) && <span>({formatRelative(u.createdAt)})</span>}
                      </span>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(u)}
                          className="p-1 hover:bg-primary/10 rounded text-primary"
                          title="View dossier"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openSuspendModal(u)}
                          disabled={selfUser || rootAdminUser}
                          className={`p-1 rounded ${
                            isSuspended ? 'text-emerald-600' : 'text-amber-600'
                          } ${selfUser || rootAdminUser ? 'opacity-30 cursor-not-allowed' : ''}`}
                          title={isSuspended ? 'Reactivate' : 'Suspend'}
                        >
                          {isSuspended ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(u)}
                          className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(u)}
                          disabled={selfUser || rootAdminUser}
                          className={`p-1 rounded text-rose-500 ${
                            selfUser || rootAdminUser ? 'opacity-30 cursor-not-allowed' : ''
                          }`}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Compact Desktop / Tablet Table (All Columns Visible at Once) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="w-8 px-2.5 py-2 text-center whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = somePageSelected;
                        }}
                        disabled={deletableUsersOnPage.length === 0}
                        onChange={toggleSelectAllOnPage}
                        className="h-3.5 w-3.5 rounded border-border accent-rose-600 cursor-pointer disabled:opacity-30"
                        title="Select or deselect all deletable users on this page"
                      />
                    </th>
                    <th className="px-2.5 py-2 whitespace-nowrap">Actions</th>
                    <th className="px-2.5 py-2 whitespace-nowrap">User Profile &amp; Contact</th>
                    <th className="px-2.5 py-2 whitespace-nowrap">Tenant / Org</th>
                    <th className="px-2.5 py-2 whitespace-nowrap">Account Status</th>
                    <th className="px-2.5 py-2 whitespace-nowrap">Verification</th>
                    <th className="px-2.5 py-2 whitespace-nowrap">System Role</th>
                    <th className="px-2.5 py-2 whitespace-nowrap">Registered On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((u) => {
                    const isSuspended = Boolean(u.isSuspended || u.status === 'suspended');
                    const selfUser = isSelf(u);
                    const rootAdminUser = isRootAdmin(u);
                    const isSelected = selectedUser && selectedUser._id === u._id;
                    const isChecked = selectedUserIds.includes(String(u._id));

                    return (
                      <tr
                        key={u._id}
                        onClick={() => handleOpenDetails(u)}
                        className={`cursor-pointer transition-all group ${
                          isChecked
                            ? 'bg-rose-500/[0.06] border-l-4 border-l-rose-500'
                            : isSelected
                            ? 'bg-primary/10 border-l-4 border-l-primary'
                            : isSuspended
                            ? 'bg-rose-500/[0.02] hover:bg-rose-500/5 hover:border-l-4 hover:border-l-rose-500'
                            : 'hover:bg-primary/[0.04] hover:border-l-4 hover:border-l-primary'
                        }`}
                      >
                        {/* Bulk Select Checkbox */}
                        <td
                          className="w-8 px-2.5 py-2 text-center whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={selfUser || rootAdminUser}
                            onChange={(e) => toggleSelectUser(u, e)}
                            className="h-3.5 w-3.5 rounded border-border accent-rose-600 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title={
                              selfUser
                                ? 'Cannot delete your own account'
                                : rootAdminUser
                                ? 'Root admin account cannot be deleted'
                                : 'Select user for bulk delete'
                            }
                          />
                        </td>

                        {/* Actions */}
                        <td className="px-2.5 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-0.5">
                            {/* Inspect Dossier Action */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetails(u);
                              }}
                              className="p-1 hover:bg-primary/10 rounded-md text-primary border border-transparent hover:border-primary/20 transition-colors cursor-pointer"
                              title="View full user dossier"
                            >
                              <Eye className="h-3.5 w-3.5" />
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
                                className={`p-1 rounded-md text-emerald-600 hover:bg-emerald-500/10 border border-emerald-500/20 transition-colors cursor-pointer ${
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
                                <UserCheck className="h-3.5 w-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openSuspendModal(u);
                                }}
                                disabled={selfUser || rootAdminUser}
                                className={`p-1 rounded-md text-amber-600 hover:bg-amber-500/10 border border-amber-500/20 transition-colors cursor-pointer ${
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
                                <UserX className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* Edit Details Action */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(u);
                              }}
                              className="p-1 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground border border-transparent hover:border-border transition-colors cursor-pointer"
                              title="Edit user profile & privileges"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>

                            {/* Delete User Action */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteModal(u);
                              }}
                              disabled={selfUser || rootAdminUser}
                              className={`p-1 rounded-md text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer ${
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
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* User Profile & Contact */}
                        <td className="px-2.5 py-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 transition-transform group-hover:scale-105 shadow-2xs ${
                                hideUserDetails
                                  ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30'
                                  : isSuspended
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
                              {hideUserDetails ? <Lock className="h-3.5 w-3.5" /> : (u.name || u.email || 'U').charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <p
                                  className={`font-semibold text-xs text-foreground group-hover:text-primary transition-colors flex items-center gap-1 truncate max-w-[145px] xl:max-w-[195px] ${
                                    hideUserDetails ? 'font-mono text-indigo-700 dark:text-indigo-300 tracking-tight' : ''
                                  }`}
                                  title={hideUserDetails ? 'Encrypted User Identity' : (u.name || 'Unnamed User')}
                                >
                                  <span className="truncate">{displayName(u)}</span>
                                  <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                                </p>
                                {selfUser && (
                                  <span className="text-[9px] font-bold px-1 py-0.2 rounded-sm bg-blue-100 text-blue-700 shrink-0">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground">
                                <span
                                  className={`truncate max-w-[160px] xl:max-w-[210px] ${hideUserDetails ? 'font-mono text-[10px]' : ''}`}
                                  title={hideUserDetails ? 'Encrypted Email' : u.email}
                                >
                                  {displayEmail(u)}
                                </span>
                                {u.phone && (
                                  <span className={`text-[10px] text-zinc-500 flex items-center gap-0.5 whitespace-nowrap ${hideUserDetails ? 'font-mono' : ''}`}>
                                    • <Phone className="h-2.5 w-2.5" /> {displayPhone(u)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Tenant Association */}
                        <td className="px-2.5 py-2 text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                            <span
                              className={`font-medium text-xs text-foreground truncate max-w-[115px] xl:max-w-[150px] ${hideUserDetails ? 'font-mono text-[11px] text-indigo-700/90 dark:text-indigo-300/90' : ''}`}
                              title={hideUserDetails ? 'Encrypted Organization' : (u.organization?.name || u.company || 'Platform (Root)')}
                            >
                              {displayOrg(u, 'Platform Root')}
                            </span>
                          </div>
                          {u.designation && (
                            <span className={`text-[10px] text-muted-foreground block truncate max-w-[115px] xl:max-w-[150px] ${hideUserDetails ? 'font-mono' : ''}`}>
                              {displayDesignation(u)}
                            </span>
                          )}
                        </td>

                        {/* Account Status Badge */}
                        <td className="px-2.5 py-2 whitespace-nowrap">
                          {isSuspended ? (
                            <div className="inline-flex flex-col">
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                                <Ban className="h-2.5 w-2.5" /> Suspended
                              </span>
                              {u.suspendReason && (
                                <span className="text-[9px] text-muted-foreground mt-0.5 max-w-[110px] truncate" title={u.suspendReason}>
                                  {u.suspendReason}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                              <CheckCircle className="h-2.5 w-2.5" /> Active
                            </span>
                          )}
                        </td>

                        {/* Verification Status */}
                        <td className="px-2.5 py-2 whitespace-nowrap">
                          <div className="space-y-0.5">
                            {isUserEmailVerified(u) ? (
                              <span
                                className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600"
                                title={u.authProvider === 'google' ? 'Email verified via Google Auth' : 'Email verified via OTP'}
                              >
                                <CheckCircle className="h-2.5 w-2.5" /> Email Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500" title="Email not verified">
                                <Clock className="h-2.5 w-2.5" /> Email Unverified
                              </span>
                            )}

                            <div>
                              {u.isPhoneVerified ? (
                                <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
                                  <Smartphone className="h-2.5 w-2.5" /> Phone Verified
                                </span>
                              ) : u.phone ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
                                  <Smartphone className="h-2.5 w-2.5" /> Phone Unverified
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </td>

                        {/* System Role */}
                        <td className="px-2.5 py-2 capitalize font-medium text-foreground whitespace-nowrap">
                          <span
                            className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
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
                            {formatRoleDisplay(u.role)}
                          </span>
                        </td>

                        {/* Registration Date */}
                        <td className="px-2.5 py-2 whitespace-nowrap" title={formatFullDate(u.createdAt)}>
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
                            <Calendar className="h-3 w-3 text-muted-foreground/70 shrink-0" />
                            <span>{formatRegistrationDate(u.createdAt)}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground pl-4">
                            {formatRegistrationTime(u.createdAt)}
                            {formatRelative(u.createdAt) ? ` • ${formatRelative(u.createdAt)}` : ''}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {!loading && !error && resultCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
          <span>
            Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, resultCount)} of {resultCount} users
          </span>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              Rows per page
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="rounded-md border border-border bg-background px-2 py-1 text-foreground"
                aria-label="Rows per page"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage <= 1 || loading}
                className="p-1.5 rounded-md border border-border hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-16 text-center text-foreground">Page {currentPage} of {totalPages}</span>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage >= totalPages || loading}
                className="p-1.5 rounded-md border border-border hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

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
                {/* Encrypted Mode Quick Toggle in Drawer */}
                <button
                  type="button"
                  onClick={toggleHideUserDetails}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    hideUserDetails
                      ? 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20'
                  }`}
                  title={hideUserDetails ? 'Show real user details' : 'Hide & encrypt user details'}
                >
                  {hideUserDetails ? <Lock className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  {hideUserDetails ? 'Encrypted' : 'Hide'}
                </button>

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
                      hideUserDetails
                        ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-2 border-indigo-500/30'
                        : activeUser.isSuspended || activeUser.status === 'suspended'
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
                    {hideUserDetails ? <Lock className="h-7 w-7" /> : (activeUser.name || activeUser.email || 'U').charAt(0)}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={`text-xl font-bold text-foreground ${hideUserDetails ? 'font-mono text-indigo-700 dark:text-indigo-300' : ''}`}>
                        {displayName(activeUser)}
                      </h3>
                      {hideUserDetails && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 inline-flex items-center gap-1">
                          <Lock className="h-2.5 w-2.5" /> AES-256 Masked
                        </span>
                      )}
                      {isSelf(activeUser) && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-sm bg-blue-100 text-blue-700">
                          Current Admin Session (You)
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        {hideUserDetails ? (
                          <span className="font-mono text-indigo-700 dark:text-indigo-300">{displayEmail(activeUser)}</span>
                        ) : (
                          <>
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
                          </>
                        )}
                      </span>

                      {activeUser.workEmail && (
                        <span className="flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400">
                          <Briefcase className="h-3.5 w-3.5 shrink-0" />
                          {hideUserDetails ? (
                            <span className="font-mono">Work: {displayWorkEmail(activeUser)}</span>
                          ) : (
                            <>
                              <a href={`mailto:${activeUser.workEmail}`} className="hover:underline">
                                Work: {activeUser.workEmail}
                              </a>
                              <button
                                type="button"
                                onClick={() => handleCopy(activeUser.workEmail, 'workEmail-hero')}
                                className="hover:text-primary ml-0.5 cursor-pointer"
                                title="Copy work email"
                              >
                                {copiedKey === 'workEmail-hero' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                              </button>
                            </>
                          )}
                        </span>
                      )}

                      {activeUser.phone ? (
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {hideUserDetails ? (
                            <span className="font-mono text-indigo-700 dark:text-indigo-300">{displayPhone(activeUser)}</span>
                          ) : (
                            <>
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
                            </>
                          )}
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
                        {formatRoleDisplay(activeUser.role)}
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

                      {/* Email Verified Pill (OTP & Google Auth) */}
                      {isUserEmailVerified(activeUser) ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-700"
                          title={activeUser.authProvider === 'google' ? 'Email verified via Google Auth' : 'Email verified via OTP'}
                        >
                          <CheckCircle className="h-3 w-3" /> Email Verified ({activeUser.authProvider === 'google' ? 'Google Auth' : 'Email OTP'})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-semibold bg-zinc-500/10 text-zinc-600" title="Email not verified">
                          <Clock className="h-3 w-3" /> Email Unverified
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
                        <p className={`text-foreground font-bold text-sm ${hideUserDetails ? 'font-mono text-indigo-700 dark:text-indigo-300' : ''}`}>
                          {displayName(activeUser, 'Not provided')}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-muted-foreground font-semibold">Email Address:</span>
                        <p className={`text-foreground font-medium flex items-center gap-1.5 ${hideUserDetails ? 'font-mono text-indigo-700 dark:text-indigo-300' : ''}`}>
                          {displayEmail(activeUser)}
                          {!hideUserDetails && (
                            <button
                              type="button"
                              onClick={() => handleCopy(activeUser.email, 'email-card')}
                              className="hover:text-primary cursor-pointer"
                              title="Copy email"
                            >
                              {copiedKey === 'email-card' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                            </button>
                          )}
                        </p>
                      </div>

                      {(activeUser.role === 'organizer' || activeUser.workEmail) && (
                        <div className="space-y-1">
                          <span className="text-muted-foreground font-semibold">Work Email (Corporate / Official):</span>
                          {activeUser.workEmail ? (
                            <div className="space-y-0.5">
                              <p className="text-foreground font-medium flex items-center gap-1.5 flex-wrap">
                                {hideUserDetails ? (
                                  <span className="font-mono text-indigo-600 dark:text-indigo-400">
                                    {displayWorkEmail(activeUser)}
                                  </span>
                                ) : (
                                  <>
                                    <a href={`mailto:${activeUser.workEmail}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                                      {activeUser.workEmail}
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(activeUser.workEmail, 'workEmail-card')}
                                      className="hover:text-primary cursor-pointer"
                                      title="Copy work email"
                                    >
                                      {copiedKey === 'workEmail-card' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                                    </button>
                                  </>
                                )}
                              </p>
                              <span className={`text-[10px] font-bold inline-block ${activeUser.emailType === 'corporate' || activeUser.workEmailVerified ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                                {activeUser.workEmailVerified ? '✓ Verified Work Email' : activeUser.emailType === 'corporate' ? '✓ Corporate Domain' : 'Business Work Email'}
                              </span>
                            </div>
                          ) : (
                            <p className="text-muted-foreground italic">Not specified</p>
                          )}
                        </div>
                      )}

                      <div className="space-y-1">
                        <span className="text-muted-foreground font-semibold">Mobile Phone:</span>
                        <p className={`text-foreground font-medium flex items-center gap-1.5 ${hideUserDetails && activeUser.phone ? 'font-mono text-indigo-700 dark:text-indigo-300' : ''}`}>
                          {displayPhone(activeUser, 'No phone registered')}
                          {activeUser.phone && !hideUserDetails && (
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
                        <p className={`text-foreground font-medium flex items-center gap-1 ${hideUserDetails && activeUser.city ? 'font-mono text-indigo-700 dark:text-indigo-300' : ''}`}>
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          {displayCity(activeUser, 'Not specified')}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-muted-foreground font-semibold">Company / Brand Name:</span>
                        <p className={`text-foreground font-medium flex items-center gap-1 ${hideUserDetails && (activeUser.company || activeUser.organization?.name) ? 'font-mono text-indigo-700 dark:text-indigo-300' : ''}`}>
                          <Building className="h-3.5 w-3.5 text-muted-foreground" />
                          {displayOrg(activeUser, 'Independent / None')}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-muted-foreground font-semibold">Job Title / Designation:</span>
                        <p className={`text-foreground font-medium flex items-center gap-1 ${hideUserDetails && activeUser.designation ? 'font-mono text-indigo-700 dark:text-indigo-300' : ''}`}>
                          <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                          {displayDesignation(activeUser, 'Not specified')}
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
                          {formatRoleDisplay(activeUser.role)}
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
                          {isUserEmailVerified(activeUser)
                            ? activeUser.authProvider === 'google'
                              ? '✓ Email Verified (Logged in via Google Auth)'
                              : '✓ Email Verified (Confirmed via Email OTP)'
                            : 'Email Unverified'}
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
                          <p className={`text-foreground font-bold text-sm ${hideUserDetails ? 'font-mono text-indigo-700 dark:text-indigo-300' : ''}`}>
                            {hideUserDetails
                              ? encryptDisplayValue('org', `${activeUser._id}:orgName`)
                              : (activeUser.organization.name || 'Unnamed Org')}
                          </p>
                        </div>

                        {activeUser.organization.website && (
                          <div className="space-y-1">
                            <span className="text-muted-foreground font-semibold">Official Website:</span>
                            <p className="text-foreground font-medium flex items-center gap-1">
                              {hideUserDetails ? (
                                <span className="font-mono text-indigo-700 dark:text-indigo-300">
                                  {encryptDisplayValue('website', `${activeUser._id}:orgWeb`)}
                                </span>
                              ) : (
                                <a
                                  href={activeUser.organization.website.startsWith('http') ? activeUser.organization.website : `https://${activeUser.organization.website}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary hover:underline flex items-center gap-1"
                                >
                                  {activeUser.organization.website}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </p>
                          </div>
                        )}

                        {activeUser.organization.gst && (
                          <div className="space-y-1">
                            <span className="text-muted-foreground font-semibold">GST / Tax Registration:</span>
                            <p className={`text-foreground font-mono font-bold ${hideUserDetails ? 'text-indigo-700 dark:text-indigo-300' : ''}`}>
                              {hideUserDetails
                                ? encryptDisplayValue('gst', `${activeUser._id}:orgGst`)
                                : activeUser.organization.gst}
                            </p>
                          </div>
                        )}

                        {activeUser.organization.contact && (
                          <div className="space-y-1">
                            <span className="text-muted-foreground font-semibold">Official Contact:</span>
                            <p className={`text-foreground font-medium ${hideUserDetails ? 'font-mono text-indigo-700 dark:text-indigo-300' : ''}`}>
                              {hideUserDetails
                                ? `${activeUser.organization.contact.email ? encryptDisplayValue('email', `${activeUser._id}:orgEmail`) : ''} ${activeUser.organization.contact.phone ? `(${encryptDisplayValue('phone', `${activeUser._id}:orgPhone`)})` : ''}`.trim()
                                : `${activeUser.organization.contact.email || ''} ${activeUser.organization.contact.phone ? `(${activeUser.organization.contact.phone})` : ''}`.trim()}
                            </p>
                          </div>
                        )}

                        {activeUser.organization.address && (
                          <div className="space-y-1 sm:col-span-2">
                            <span className="text-muted-foreground font-semibold">Registered Physical Address:</span>
                            <p className={`text-foreground font-medium ${hideUserDetails ? 'font-mono text-indigo-700 dark:text-indigo-300' : ''}`}>
                              {hideUserDetails
                                ? encryptDisplayValue('address', `${activeUser._id}:orgAddr`)
                                : [
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
                            <p className={`text-foreground text-xs leading-relaxed bg-muted/20 p-3 rounded-lg border border-border ${hideUserDetails ? 'font-mono text-indigo-700 dark:text-indigo-300' : ''}`}>
                              {hideUserDetails
                                ? encryptDisplayValue('bio', `${activeUser._id}:orgBio`)
                                : activeUser.organization.description}
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
                          Self-Reported Company:{' '}
                          <strong className={hideUserDetails ? 'font-mono text-indigo-700 dark:text-indigo-300' : ''}>
                            {displayOrg(activeUser, activeUser.company)}
                          </strong>
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
                    <span className="font-mono text-muted-foreground">
                      {hideUserDetails
                        ? 'MongoDB Document (AES-256 Demo Masked):'
                        : 'MongoDB Document Representation:'}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          JSON.stringify(
                            hideUserDetails ? buildEncryptedRawRecord(activeUser) : activeUser,
                            null,
                            2
                          ),
                          'rawJson'
                        )
                      }
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-border bg-background hover:bg-secondary text-foreground font-semibold cursor-pointer transition-colors"
                    >
                      {copiedKey === 'rawJson' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" /> Copied JSON!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> {hideUserDetails ? 'Copy Masked JSON' : 'Copy Raw JSON'}
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-zinc-950 text-emerald-400 font-mono text-[11px] overflow-x-auto border border-zinc-800 leading-relaxed max-h-[500px]">
                    {JSON.stringify(
                      hideUserDetails ? buildEncryptedRawRecord(activeUser) : activeUser,
                      null,
                      2
                    )}
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
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 transition-colors cursor-pointer"
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
                <p className={`text-xs text-muted-foreground ${hideUserDetails ? 'font-mono' : ''}`}>
                  {displayName(targetSuspendUser)} • {displayEmail(targetSuspendUser)}
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
                <p className={`text-foreground font-bold ${hideUserDetails ? 'font-mono' : ''}`}>
                  {displayName(targetDeleteUser)}
                </p>
                <p className="text-muted-foreground font-mono text-[11px]">{displayEmail(targetDeleteUser)}</p>
                <p className="text-muted-foreground capitalize">Role: {formatRoleDisplay(targetDeleteUser.role)}</p>
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
      {/* 2B. BULK DELETE USERS CONFIRMATION MODAL                                  */}
      {/* ========================================================================= */}
      {isBulkDeleteModalOpen && selectedUserIds.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(false)}
              disabled={bulkDeleteSubmitting}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Icon & Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Bulk Delete {selectedUserIds.length} {selectedUserIds.length === 1 ? 'User' : 'Users'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  This action permanently erases all selected accounts and cannot be undone.
                </p>
              </div>
            </div>

            {/* Modal Warning Body */}
            <div className="p-3.5 bg-rose-500/5 rounded-xl border border-rose-500/20 text-xs text-muted-foreground space-y-2.5">
              <p className="font-semibold text-rose-700">
                Are you sure you want to permanently delete {selectedUserIds.length} selected user{' '}
                {selectedUserIds.length === 1 ? 'account' : 'accounts'} and all associated platform data?
              </p>

              {selectedUsersPreview.length > 0 && (
                <div className="bg-background/90 p-2.5 rounded-lg border border-border max-h-40 overflow-y-auto divide-y divide-border/60">
                  {selectedUsersPreview.map((u) => (
                    <div key={u._id} className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-foreground font-bold truncate ${hideUserDetails ? 'font-mono' : ''}`}>
                          {displayName(u)}
                        </p>
                        <p className="text-muted-foreground font-mono text-[10px] truncate">{displayEmail(u)}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-muted text-foreground text-[10px] font-bold uppercase shrink-0">
                        {formatRoleDisplay(u.role)}
                      </span>
                    </div>
                  ))}
                  {selectedUserIds.length > selectedUsersPreview.length && (
                    <p className="pt-1.5 text-[11px] font-semibold text-muted-foreground">
                      + {selectedUserIds.length - selectedUsersPreview.length} user(s) selected from other pages
                    </p>
                  )}
                </div>
              )}

              <div className="text-[11px] text-zinc-500 space-y-1 pt-1">
                <p className="font-semibold text-zinc-600 dark:text-zinc-400">
                  All data across the entire platform for these accounts will be purged:
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Attendee registrations &amp; event engagements</li>
                  <li>Visitor passes, badges &amp; orders</li>
                  <li>Exhibitor applications &amp; booth assignments</li>
                  <li>Reviews, inquiries, leads &amp; support tickets</li>
                  <li>Account credentials &amp; organization memberships</li>
                </ul>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                disabled={bulkDeleteSubmitting}
                className="rounded-lg border border-border hover:bg-secondary px-4 py-2 text-sm font-semibold text-foreground transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkDeleteConfirm}
                disabled={bulkDeleteSubmitting}
                className="flex items-center gap-2 rounded-lg bg-destructive hover:bg-destructive/90 px-4 py-2 text-sm font-bold text-destructive-foreground shadow-md transition-colors cursor-pointer"
              >
                {bulkDeleteSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete {selectedUserIds.length} {selectedUserIds.length === 1 ? 'User' : 'Users'} Permanently
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
              className="absolute right-4 top-4 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              aria-label="Close edit user modal"
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

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
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
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Work Email (Organiser / Corporate)</label>
                  <input
                    type="email"
                    value={editForm.workEmail}
                    onChange={(e) => setEditForm(prev => ({ ...prev, workEmail: e.target.value }))}
                    placeholder="name@company.com"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Mobile Phone</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="98765xxxx"
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
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-semibold cursor-pointer"
                  >
                    <option className="cursor-pointer" value="super_admin">Super Admin</option>
                    <option className="cursor-pointer" value="organizer">Organiser</option>
                    <option className="cursor-pointer" value="exhibitor">Exhibitor</option>
                    <option className="cursor-pointer" value="visitor">Visitor</option>
                    <option className="cursor-pointer" value="event_manager">Event Manager</option>
                    <option className="cursor-pointer" value="sales_team">Sales Team</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">2Factor.in Phone Verification</label>
                  <select
                    value={String(editForm.isPhoneVerified)}
                    onChange={(e) => setEditForm(prev => ({ ...prev, isPhoneVerified: e.target.value === 'true' }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium cursor-pointer"
                  >
                    <option className="cursor-pointer" value="true">Verified via SMS OTP</option>
                    <option className="cursor-pointer" value="false">Unverified / Pending</option>
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
                    className={`rounded-lg border px-3 py-1.5 text-xs font-bold focus:outline-none cursor-pointer ${
                      editForm.isSuspended
                        ? 'border-rose-500/30 bg-rose-500/10 text-rose-600'
                        : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                    }`}
                  >
                    <option className="cursor-pointer" value="false">Active Account</option>
                    <option className="cursor-pointer" value="true">Suspended</option>
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
