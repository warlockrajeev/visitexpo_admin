'use client';

/**
 * @file plans/page.js
 * @description Super Admin Plans Management Console for VisitExpo.
 * Manage official Organizer Pricing Tiers, Feature Limits, Growth Top-ups, and Organizer Upgrade Inquiries.
 */

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  showSweetAlert,
  showSweetConfirm,
  showSweetSuccess,
  showSweetError
} from '../../../utils/sweetalert.js';
import {
  CreditCard,
  Layers,
  CheckCircle2,
  XCircle,
  Edit3,
  Plus,
  RefreshCw,
  RotateCcw,
  Zap,
  TrendingUp,
  Shield,
  HelpCircle,
  DollarSign,
  Users,
  Search,
  Filter,
  Eye,
  Check,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Phone,
  Mail,
  Building,
  Calendar,
  Tag,
  AlertTriangle,
  Loader2,
  X,
  Megaphone,
  Share2,
  Radio,
  FileSpreadsheet,
  Compass,
  ArrowUpRight,
  UserCheck,
  UserPlus,
  Gift,
  ShieldCheck
} from 'lucide-react';
import { isCorporateEmail } from '../../../utils/emailValidator.js';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const MATRIX_ROWS = [
  { label: 'Detailed Lead Access', free: 'Masked (Counts & volume visible)', starter: 'Full', enterprise: 'Full + advanced' },
  { label: 'Lead CRM', free: 'Basic operational counters', starter: 'Basic operational CRM', enterprise: 'Advanced CRM + API' },
  { label: 'Lead Export', free: 'Not Available', starter: 'Not Available', enterprise: 'Unlimited' },
  { label: 'Lead Search & Filtering', free: 'Basic', starter: 'Basic', enterprise: 'Advanced' },
  { label: 'Visitor / Exhibitor / Vendor Leads', free: 'Masked', starter: 'Unlocked', enterprise: 'Full + analytics' },
  { label: 'Venue / Designer / Organizer Leads', free: 'Masked', starter: 'Unlocked', enterprise: 'Full + analytics + Search Database' },
  { label: 'Ticket Platform / Expo Mgmt Leads', free: 'Masked', starter: 'Unlocked', enterprise: 'Full + analytics' },
  { label: 'Paid Ticket Selling', free: 'Not included (1/10 demand test)', starter: 'Unlocked', enterprise: 'Advanced / private gateway' },
  { label: 'Payment Gateway', free: 'Not included', starter: 'Ok', enterprise: 'Ok (Multi-gateway + Custom)' },
  { label: 'Ticket Sales Analytics', free: 'Demand stats only', starter: 'Basic', enterprise: 'Advanced' },
  { label: 'Exhibitor Management', free: 'Not Available', starter: 'Normal Level', enterprise: 'Advance Level' },
  { label: 'Proposed Expo Validation', free: '4,999 per proposed event', starter: 'Limited allowance', enterprise: 'Multiple Events' },
  { label: 'Interest Analysis', free: 'Basic volume', starter: 'Basic', enterprise: 'Detailed category-wise' },
  { label: 'B2B / B2C Demand Analysis', free: 'Basic', starter: 'Basic', enterprise: 'Advance' },
  { label: 'Active Events', free: 'Unlimited (claimed/created)', starter: 'Unlimited', enterprise: 'Unlimited' },
  { label: 'Marketing Campaigns', free: 'Growth Plan (Paid separately)', starter: 'Growth Plan', enterprise: 'Growth Plan' },
  { label: 'Priority Search / Featured Placement', free: 'No (Organic)', starter: 'No', enterprise: 'Available' },
  { label: 'Support SLA', free: 'Standard Community', starter: 'Priority', enterprise: 'Faster priority (Dedicated Manager)' },
];

const INITIAL_ASSIGN_FORM_DATA = {
  planId: 'free',
  billingCycle: 'lifetime',
  noChargeForGeneralMail: true,
  price: 0,
  isVerified: true,
  upgradeRoleToOrganizer: true,
  adminNotes: 'Super Admin complimentary plan assignment (No charge for general mail)',
  durationDays: ''
};

export default function PlansManagementPage() {
  const { accessToken } = useAuth();

  const [activeTab, setActiveTab] = useState('plans'); // 'plans' | 'growth' | 'inquiries' | 'matrix'
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState({
    totalPlans: 4,
    activePlans: 4,
    totalInquiries: 0,
    newInquiries: 0,
    activeSubscriptions: 0
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Inquiries State
  const [inquiries, setInquiries] = useState([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [inquiryFilter, setInquiryFilter] = useState('all');
  const [inquiryPage, setInquiryPage] = useState(1);
  const [inquiryPageSize, setInquiryPageSize] = useState(10);

  // Matrix Pagination State
  const [matrixPage, setMatrixPage] = useState(1);
  const [matrixPageSize, setMatrixPageSize] = useState(10);

  // Edit Plan Modal State
  const [editingPlan, setEditingPlan] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [editFormErrors, setEditFormErrors] = useState({});

  // Growth Service Edit Modal State
  const [editingService, setEditingService] = useState(null);
  const [showServiceModal, setShowServiceModal] = useState(false);

  // Inquiry Detail / Note Modal State
  const [activeInquiry, setActiveInquiry] = useState(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryNotes, setInquiryNotes] = useState('');
  const [inquiryStatus, setInquiryStatus] = useState('new');

  // Search Filter
  const [searchQuery, setSearchQuery] = useState('');

  // User Plan Assignment State
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const selectedUser = selectedUsers.length === 1 ? selectedUsers[0] : null;

  const isUserSelected = useCallback(
    (u) => {
      if (!u) return false;
      const id = u._id || u.id;
      return selectedUsers.some((su) => (su._id || su.id) === id);
    },
    [selectedUsers]
  );

  const toggleSelectUser = useCallback((u) => {
    if (!u) return;
    const id = u._id || u.id;
    setSelectedUsers((prev) => {
      const exists = prev.some((su) => (su._id || su.id) === id);
      if (exists) {
        return prev.filter((su) => (su._id || su.id) !== id);
      } else {
        return [...prev, u];
      }
    });
  }, []);

  // Assigned Subscriptions State
  const [assignedSubs, setAssignedSubs] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [subFilter, setSubFilter] = useState('all');
  const [subPage, setSubPage] = useState(1);
  const [subPageSize, setSubPageSize] = useState(10);

  const handleSelectAllSubs = useCallback(() => {
    if (!assignedSubs || assignedSubs.length === 0) return;
    const validSubsUsers = assignedSubs.map((s) => s.user).filter(Boolean);
    const allSelected = validSubsUsers.length > 0 && validSubsUsers.every((u) => isUserSelected(u));
    if (allSelected) {
      const subUserIds = new Set(validSubsUsers.map((u) => u._id || u.id));
      setSelectedUsers((prev) => prev.filter((u) => !subUserIds.has(u._id || u.id)));
    } else {
      setSelectedUsers((prev) => {
        const existingIds = new Set(prev.map((u) => u._id || u.id));
        const toAdd = validSubsUsers.filter((u) => !existingIds.has(u._id || u.id));
        return [...prev, ...toAdd];
      });
    }
  }, [assignedSubs, isUserSelected]);

  const [assignFormData, setAssignFormData] = useState(INITIAL_ASSIGN_FORM_DATA);
  const [assigningPlan, setAssigningPlan] = useState(false);

  // Fetch all plans and admin stats
  const fetchPlans = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/plans/admin/all`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data?.success) {
        setPlans(res.data.data || []);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch plans', err);
      showSweetError('Could not retrieve plans data.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  // Fetch Inquiries
  const fetchInquiries = useCallback(async () => {
    if (!accessToken) return;
    try {
      setInquiriesLoading(true);
      const res = await axios.get(`${API_URL}/plans/admin/inquiries?status=${inquiryFilter}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data?.success) {
        setInquiries(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch inquiries', err);
    } finally {
      setInquiriesLoading(false);
    }
  }, [accessToken, inquiryFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    if (activeTab === 'inquiries') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchInquiries();
    }
  }, [activeTab, fetchInquiries]);

  // Search users for assignment
  const handleSearchUsers = useCallback(async (query, role) => {
    if (!accessToken) return;
    try {
      const res = await axios.get(`${API_URL}/plans/admin/users?q=${encodeURIComponent(query || '')}&role=${role || 'all'}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data?.success) {
        setUserSearchResults(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to search users:', err);
    }
  }, [accessToken]);

  // Fetch assigned subscriptions
  const fetchAssignedSubscriptions = useCallback(async () => {
    if (!accessToken) return;
    setLoadingSubs(true);
    try {
      const res = await axios.get(`${API_URL}/plans/admin/assigned-subscriptions?plan=${subFilter}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data?.success) {
        setAssignedSubs(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch assigned subscriptions:', err);
    } finally {
      setLoadingSubs(false);
    }
  }, [accessToken, subFilter]);

  useEffect(() => {
    if (activeTab === 'assign') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleSearchUsers('', 'all');
      fetchAssignedSubscriptions();
    }
  }, [activeTab, handleSearchUsers, fetchAssignedSubscriptions]);

  // Submit Plan Assignment
  const handleAssignPlan = async (e) => {
    e.preventDefault();
    if (selectedUsers.length === 0) {
      showSweetError('Please select at least one user to assign a plan to.');
      return;
    }

    if (assignFormData.durationDays !== '' && Number(assignFormData.durationDays) < 0) {
      showSweetError('Custom Duration (Days) cannot be a negative number.');
      return;
    }

    setAssigningPlan(true);
    try {
      const userIds = selectedUsers.map((u) => u._id || u.id);
      const payload = {
        userIds,
        userId: userIds[0],
        planId: assignFormData.planId,
        billingCycle: assignFormData.billingCycle,
        noChargeForGeneralMail: assignFormData.noChargeForGeneralMail,
        price: assignFormData.noChargeForGeneralMail && assignFormData.planId === 'free' ? 0 : Number(assignFormData.price || 0),
        isVerified: assignFormData.isVerified,
        upgradeRoleToOrganizer: assignFormData.upgradeRoleToOrganizer,
        adminNotes: assignFormData.adminNotes,
        durationDays: assignFormData.durationDays ? Math.max(0, Number(assignFormData.durationDays)) : undefined
      };

      const res = await axios.post(`${API_URL}/plans/admin/assign-plan`, payload, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (res.data?.success) {
        showSweetSuccess(res.data.message || 'Plan assigned successfully!');
        setSelectedUsers([]);
        setUserSearchQuery('');
        setUserSearchResults([]);
        setUserRoleFilter('all');
        setAssignFormData(INITIAL_ASSIGN_FORM_DATA);
        fetchAssignedSubscriptions();
        fetchPlans();
      }
    } catch (err) {
      showSweetError(err.response?.data?.message || 'Failed to assign plan.');
    } finally {
      setAssigningPlan(false);
    }
  };

  // Toggle Global General Email Fee
  const handleToggleGeneralMailCharge = async (currentPrice) => {
    const isCurrentlyFree = currentPrice === 0;
    const newNoCharge = !isCurrentlyFree;

    const confirmed = await showSweetConfirm({
      title: newNoCharge ? 'Enable No Charge for General Mail?' : 'Restore ₹1,499 General Mail Fee?',
      text: newNoCharge
        ? 'Personal email domains (@gmail, @yahoo, etc) will be allowed to activate the Free Organizer Plan for 100% FREE (₹0).'
        : 'Personal email domains (@gmail, @yahoo, etc) will be required to pay the standard ₹1,499 one-time registration verification fee.',
      confirmButtonText: newNoCharge ? 'Make General Mail Free (₹0)' : 'Set Fee to ₹1,499',
      isDanger: false
    });

    if (!confirmed) return;

    try {
      setActionLoading(true);
      const res = await axios.post(
        `${API_URL}/plans/admin/toggle-general-mail-charge`,
        { noCharge: newNoCharge },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data?.success) {
        showSweetSuccess(res.data.message);
        fetchPlans();
      }
    } catch (err) {
      showSweetError(err.response?.data?.message || 'Failed to update general email fee.');
    } finally {
      setActionLoading(false);
    }
  };

  // Restore Official Pricing Defaults
  const handleRestoreDefaults = async () => {
    const confirmed = await showSweetConfirm({
      title: 'Restore Official Pricing Defaults?',
      text: 'This will reset Free Organizer, Starter, Enterprise, and Growth plans to the official specifications (Free corp/1499 gen, Starter 14,999/49,999, Enterprise 89,999/2,99,999, Proposed Research 4,999).',
      confirmButtonText: 'Reset to Defaults',
      isDanger: false
    });

    if (!confirmed) return;

    try {
      setActionLoading(true);
      const res = await axios.post(`${API_URL}/plans/admin/seed-defaults`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data?.success) {
        showSweetSuccess('Official pricing tiers successfully restored.');
        setPlans(res.data.data || []);
      }
    } catch (err) {
      console.error('Seed defaults failed', err);
      showSweetError(err.response?.data?.message || 'Failed to restore defaults.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Modal for a plan
  const handleOpenEdit = (plan) => {
    setEditingPlan(plan);
    setEditFormData({
      name: plan.name || '',
      tagline: plan.tagline || '',
      description: plan.description || '',
      badge: plan.badge || '',
      badgeColor: plan.badgeColor || 'bg-primary text-black',
      isActive: plan.isActive !== false,
      isPopular: !!plan.isPopular,
      corporateEmailPrice: plan.pricing?.corporateEmailPrice ?? 0,
      generalEmailPrice: plan.pricing?.generalEmailPrice ?? 1499,
      quarterlyPrice: plan.pricing?.quarterlyPrice ?? 0,
      yearlyPrice: plan.pricing?.yearlyPrice ?? 0,
      proposedEventResearchPrice: plan.pricing?.proposedEventResearchPrice ?? 4999,
      billingNote: plan.pricing?.billingNote || '',
      bestFor: (plan.bestFor || []).join('\n'),
      keyInclusions: (plan.keyInclusions || []).join('\n'),
      highlights: (plan.highlights || []).join('\n')
    });
    setEditFormErrors({});
    setShowEditModal(true);
  };

  // Reset Edit Modal Form to plan's original values
  const handleResetEditForm = () => {
    if (!editingPlan) return;
    setEditFormData({
      name: editingPlan.name || '',
      tagline: editingPlan.tagline || '',
      description: editingPlan.description || '',
      badge: editingPlan.badge || '',
      badgeColor: editingPlan.badgeColor || 'bg-primary text-black',
      isActive: editingPlan.isActive !== false,
      isPopular: !!editingPlan.isPopular,
      corporateEmailPrice: editingPlan.pricing?.corporateEmailPrice ?? 0,
      generalEmailPrice: editingPlan.pricing?.generalEmailPrice ?? 1499,
      quarterlyPrice: editingPlan.pricing?.quarterlyPrice ?? 0,
      yearlyPrice: editingPlan.pricing?.yearlyPrice ?? 0,
      proposedEventResearchPrice: editingPlan.pricing?.proposedEventResearchPrice ?? 4999,
      billingNote: editingPlan.pricing?.billingNote || '',
      bestFor: (editingPlan.bestFor || []).join('\n'),
      keyInclusions: (editingPlan.keyInclusions || []).join('\n'),
      highlights: (editingPlan.highlights || []).join('\n')
    });
    setEditFormErrors({});
  };

  const handlePriceKeyDown = (e) => {
    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
      e.preventDefault();
    }
  };

  const sanitizeNumberInput = (val) => {
    if (val === '' || val === null || val === undefined) return '';
    const clean = String(val).replace(/[^0-9]/g, '');
    if (clean === '') return '';
    return String(Math.max(0, parseInt(clean, 10)));
  };

  const validateEditPlanForm = () => {
    const errors = {};

    if (!editFormData.name || !editFormData.name.trim()) {
      errors.name = 'Plan Name is required and cannot be empty.';
    } else if (editFormData.name.trim().length < 2) {
      errors.name = 'Plan Name must be at least 2 characters long.';
    }

    if (editingPlan?.planId === 'free') {
      if (editFormData.corporateEmailPrice === '' || editFormData.corporateEmailPrice === null || isNaN(Number(editFormData.corporateEmailPrice))) {
        errors.corporateEmailPrice = 'Corporate Email Price is required.';
      } else if (Number(editFormData.corporateEmailPrice) < 0) {
        errors.corporateEmailPrice = 'Corporate Email Price cannot be negative.';
      }

      if (editFormData.generalEmailPrice === '' || editFormData.generalEmailPrice === null || isNaN(Number(editFormData.generalEmailPrice))) {
        errors.generalEmailPrice = 'General Email Price is required.';
      } else if (Number(editFormData.generalEmailPrice) < 0) {
        errors.generalEmailPrice = 'General Email Price cannot be negative.';
      }
    } else {
      if (editFormData.quarterlyPrice === '' || editFormData.quarterlyPrice === null || isNaN(Number(editFormData.quarterlyPrice))) {
        errors.quarterlyPrice = 'Quarterly Price is required.';
      } else if (Number(editFormData.quarterlyPrice) < 0) {
        errors.quarterlyPrice = 'Quarterly Price cannot be negative.';
      }

      if (editFormData.yearlyPrice === '' || editFormData.yearlyPrice === null || isNaN(Number(editFormData.yearlyPrice))) {
        errors.yearlyPrice = 'Yearly Price is required.';
      } else if (Number(editFormData.yearlyPrice) < 0) {
        errors.yearlyPrice = 'Yearly Price cannot be negative.';
      }
    }

    if (editFormData.proposedEventResearchPrice === '' || editFormData.proposedEventResearchPrice === null || isNaN(Number(editFormData.proposedEventResearchPrice))) {
      errors.proposedEventResearchPrice = 'Proposed Event Research Price is required.';
    } else if (Number(editFormData.proposedEventResearchPrice) < 0) {
      errors.proposedEventResearchPrice = 'Proposed Event Research Price cannot be negative.';
    }

    const highlightsList = (editFormData.highlights || '')
      .split('\n')
      .map((h) => h.trim())
      .filter(Boolean);

    if (highlightsList.length === 0) {
      errors.highlights = 'Please provide at least one bullet point highlight for this plan.';
    }

    setEditFormErrors(errors);
    return {
      isValid: Object.keys(errors).length === 0,
      firstError: Object.values(errors)[0]
    };
  };

  // Save Plan Updates
  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!editingPlan) return;

    const validation = validateEditPlanForm();
    if (!validation.isValid) {
      showSweetError(validation.firstError || 'Please fix the errors in the plan configuration form.');
      return;
    }

    try {
      setActionLoading(true);
      const payload = {
        name: editFormData.name.trim(),
        tagline: editFormData.tagline?.trim() || '',
        description: editFormData.description?.trim() || '',
        badge: editFormData.badge?.trim() || '',
        badgeColor: editFormData.badgeColor || 'bg-primary text-black',
        isActive: editFormData.isActive,
        isPopular: editFormData.isPopular,
        pricing: {
          ...editingPlan.pricing,
          corporateEmailPrice: Math.max(0, Number(editFormData.corporateEmailPrice || 0)),
          generalEmailPrice: Math.max(0, Number(editFormData.generalEmailPrice || 0)),
          quarterlyPrice: Math.max(0, Number(editFormData.quarterlyPrice || 0)),
          yearlyPrice: Math.max(0, Number(editFormData.yearlyPrice || 0)),
          proposedEventResearchPrice: Math.max(0, Number(editFormData.proposedEventResearchPrice || 0)),
          billingNote: editFormData.billingNote?.trim() || ''
        },
        highlights: editFormData.highlights
          .split('\n')
          .map((h) => h.trim())
          .filter(Boolean),
        bestFor: (editFormData.bestFor || '')
          .split('\n')
          .map((h) => h.trim())
          .filter(Boolean),
        keyInclusions: (editFormData.keyInclusions || '')
          .split('\n')
          .map((h) => h.trim())
          .filter(Boolean)
      };

      const res = await axios.put(`${API_URL}/plans/admin/${editingPlan._id}`, payload, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (res.data?.success) {
        showSweetSuccess(`Plan "${editFormData.name.trim()}" updated successfully.`);
        setShowEditModal(false);
        setEditFormErrors({});
        fetchPlans();
      }
    } catch (err) {
      console.error('Update plan failed', err);
      showSweetError(err.response?.data?.message || 'Failed to update plan.');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Plan Active State
  const handleTogglePlanActive = async (plan) => {
    try {
      const res = await axios.put(
        `${API_URL}/plans/admin/${plan._id}`,
        { isActive: !plan.isActive },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data?.success) {
        setPlans((prev) =>
          prev.map((p) => (p._id === plan._id ? { ...p, isActive: !p.isActive } : p))
        );
      }
    } catch (err) {
      showSweetError('Failed to toggle plan status.');
    }
  };

  // Update Inquiry Status / Notes
  const handleUpdateInquiry = async () => {
    if (!activeInquiry) return;
    try {
      setActionLoading(true);
      const res = await axios.patch(
        `${API_URL}/plans/admin/inquiries/${activeInquiry._id}`,
        { status: inquiryStatus, adminNotes: inquiryNotes },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data?.success) {
        showSweetSuccess('Inquiry record updated.');
        setShowInquiryModal(false);
        fetchInquiries();
      }
    } catch (err) {
      showSweetError('Failed to update inquiry record.');
    } finally {
      setActionLoading(false);
    }
  };

  // Find growth services from growth plan
  const growthPlan = plans.find((p) => p.planId === 'growth');
  const growthServices = growthPlan?.growthServices || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Layers className="h-5 w-5" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Organizer Plans &amp; Pricing Management
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Configure official organizer subscription packages, feature limits, prospective expo validation fees, and growth top-up promotional services.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleToggleGeneralMailCharge(growthPlan ? plans.find((p) => p.planId === 'free')?.pricing?.generalEmailPrice ?? 1499 : 1499)}
            disabled={actionLoading}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              plans.find((p) => p.planId === 'free')?.pricing?.generalEmailPrice === 0
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                : 'border-border bg-secondary hover:bg-secondary/80 text-foreground'
            }`}
            title="Toggle whether personal emails (@gmail, @yahoo) are charged Rs.1499 or free"
          >
            <Gift className="h-3.5 w-3.5 text-amber-500" />
            <span>
              {plans.find((p) => p.planId === 'free')?.pricing?.generalEmailPrice === 0
                ? 'General Mail: No Charge (₹0 Free)'
                : 'General Mail: ₹1,499 (Click to Make Free)'}
            </span>
          </button>

          <button
            onClick={fetchPlans}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleRestoreDefaults}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-semibold transition-all cursor-pointer"
            title="Reset Free, Starter, Enterprise, and Growth to official pricing specifications"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to Official Defaults
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Organizer Starter
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-foreground font-mono">₹14,999</span>
            <span className="text-xs text-muted-foreground">/ Qtr</span>
          </div>
          <p className="mt-1 text-xs text-emerald-500 font-medium">₹49,999 / Year (Save 17%)</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Organizer Enterprise
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-indigo-500 font-mono">₹89,999</span>
            <span className="text-xs text-muted-foreground">/ Qtr</span>
          </div>
          <p className="mt-1 text-xs text-indigo-400 font-medium">₹2,99,999 / Year (Save 17%)</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Free Organizer Tier
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-foreground">₹0</span>
            <span className="text-xs text-muted-foreground">Corporate Email</span>
          </div>
          <p className="mt-1 text-xs text-amber-500 font-medium">₹1,499 for general email</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Organizer Inquiries
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-primary font-mono">{stats.totalInquiries}</span>
            {stats.newInquiries > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-500 animate-pulse">
                {stats.newInquiries} New
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Upgrade &amp; Top-up requests</p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
        {[
          { id: 'plans', label: 'Official Pricing Tiers', icon: Layers, count: plans.length },
          { id: 'assign', label: 'Assign Plans to Users', icon: UserCheck, count: assignedSubs.length || undefined },
          { id: 'growth', label: 'Growth Top-Up Services', icon: Megaphone, count: growthServices.length },
          { id: 'inquiries', label: 'Organizer Upgrade Inquiries', icon: MessageSquare, count: stats.totalInquiries },
          { id: 'matrix', label: 'Feature Comparison Matrix', icon: FileSpreadsheet }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-primary text-black shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-black/20 text-black' : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: OFFICIAL PRICING PLANS */}
      {/* ========================================================= */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Loading pricing plans...</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan) => (
                <div
                  key={plan._id || plan.planId}
                  className={`rounded-2xl border bg-card p-6 shadow-sm space-y-4 transition-all ${
                    plan.isPopular
                      ? 'border-primary ring-2 ring-primary/20 shadow-primary/5'
                      : plan.planId === 'enterprise'
                      ? 'border-indigo-500/40'
                      : 'border-border'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-lg text-foreground">{plan.name}</h4>
                        </div>
                        {plan.badge && (
                          <span
                            className={`inline-flex mt-1 items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              plan.badgeColor || 'bg-primary/20 text-primary'
                            }`}
                          >
                            {plan.badge}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleTogglePlanActive(plan)}
                          title={plan.isActive ? 'Deactivate plan' : 'Activate plan'}
                          className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            plan.isActive
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20'
                          }`}
                        >
                          {plan.isActive ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(plan)}
                          className="p-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs cursor-pointer transition-colors"
                          title="Edit plan details & prices"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {plan.tagline || plan.description}
                    </p>

                    {/* Pricing Box */}
                    <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/80 space-y-1.5">
                      {plan.planId === 'free' ? (
                        <>
                          <div className="flex items-baseline justify-between text-xs">
                            <span className="text-muted-foreground">Corporate Email:</span>
                            <span className="font-extrabold text-emerald-500 font-mono">₹0 (Free)</span>
                          </div>
                          <div className="flex items-baseline justify-between text-xs">
                            <span className="text-muted-foreground">General Email:</span>
                            <span className={`font-extrabold font-mono ${plan.pricing?.generalEmailPrice === 0 ? 'text-emerald-500' : 'text-foreground'}`}>
                              {plan.pricing?.generalEmailPrice === 0 ? '₹0 (No Charge)' : `₹${(plan.pricing?.generalEmailPrice || 1499).toLocaleString('en-IN')}`}
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between text-xs pt-1 border-t border-border/60">
                            <span className="text-muted-foreground">Proposed Event Research:</span>
                            <span className="font-bold text-amber-500 font-mono">₹4,999</span>
                          </div>
                          <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-foreground">
                              No Charge for General Mail:
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleGeneralMailCharge(plan.pricing?.generalEmailPrice ?? 1499)}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                plan.pricing?.generalEmailPrice === 0
                                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                                  : 'bg-secondary text-muted-foreground border border-border hover:text-foreground'
                              }`}
                            >
                              {plan.pricing?.generalEmailPrice === 0 ? '✓ Active (₹0 Free)' : 'Set No Charge (₹0)'}
                            </button>
                          </div>
                        </>
                      ) : plan.planId === 'growth' ? (
                        <>
                          <div className="flex items-baseline justify-between text-xs">
                            <span className="text-muted-foreground">Top-up Packs:</span>
                            <span className="font-extrabold text-emerald-500 font-mono">₹1,000 to Unlimited</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            Point-wise price uses across 13 promotion channels
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-baseline justify-between text-xs">
                            <span className="text-muted-foreground">Quarterly:</span>
                            <span className="font-extrabold text-foreground font-mono text-sm">
                              ₹{plan.pricing?.quarterlyPrice?.toLocaleString('en-IN') || 0}
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between text-xs">
                            <span className="text-muted-foreground">Yearly:</span>
                            <span className="font-extrabold text-foreground font-mono text-sm">
                              ₹{plan.pricing?.yearlyPrice?.toLocaleString('en-IN') || 0}
                            </span>
                          </div>
                          <div className="text-[10px] text-emerald-500 font-medium pt-1 border-t border-border/60">
                            Save 17% on Annual Billing
                          </div>
                        </>
                      )}
                    </div>

                    {/* Best for you if */}
                    {plan.bestFor && plan.bestFor.length > 0 && (
                      <div className="space-y-1.5 border-t border-border pt-3">
                        <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                          Best for you if:
                        </span>
                        <ul className="space-y-1.5 text-xs text-muted-foreground">
                          {plan.bestFor.map((item, bIdx) => (
                            <li key={bIdx} className="flex items-start gap-2">
                              <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="leading-snug">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Key Inclusions */}
                    <div className="space-y-1.5 border-t border-border pt-3">
                      <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                        Key Inclusions:
                      </span>
                      <ul className="space-y-1.5 text-xs text-muted-foreground">
                        {(plan.keyInclusions || plan.highlights || []).slice(0, 6).map((item, hIdx) => (
                          <li key={hIdx} className="flex items-start gap-2">
                            <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="leading-snug">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ASSIGN PLANS TO USERS (WITH NO CHARGE WAIVER)     */}
      {/* ========================================================= */}
      {activeTab === 'assign' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Card */}
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <UserCheck className="h-5 w-5" />
                </span>
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  User Plan Assignment &amp; General Mail Waiver
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                Assign and activate any organizer plan (Free, Starter, Enterprise, Growth) for any user in the platform.
                Optionally apply <strong>&ldquo;No charge for general mail&rdquo;</strong> to waive the standard ₹1,499 personal email verification fee.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
                plans.find((p) => p.planId === 'free')?.pricing?.generalEmailPrice === 0
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
              }`}>
                <ShieldCheck className="h-4 w-4" />
                <span>
                  Global Setting: {plans.find((p) => p.planId === 'free')?.pricing?.generalEmailPrice === 0 ? 'No Charge Active (₹0)' : 'General Email Charged (₹1,499)'}
                </span>
              </span>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-12 items-start">
            {/* Left 5 Cols: Assignment Console */}
            <div className="lg:col-span-5 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary" />
                  <h4 className="font-bold text-sm text-foreground">Assign Plan to User</h4>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Admin Grant
                </span>
              </div>

              {/* Step 1: Search & Select User */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-foreground">
                  1. Search &amp; Select Target User *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or phone..."
                      value={userSearchQuery}
                      onChange={(e) => {
                        setUserSearchQuery(e.target.value);
                        handleSearchUsers(e.target.value, userRoleFilter);
                      }}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => {
                      setUserRoleFilter(e.target.value);
                      handleSearchUsers(userSearchQuery, e.target.value);
                    }}
                    className="px-2.5 py-2 rounded-xl bg-secondary border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="all">All Roles</option>
                    <option value="organizer">Organizers</option>
                    <option value="exhibitor">Exhibitors</option>
                    <option value="visitor">Visitors</option>
                  </select>
                </div>

                {/* Search Results Dropdown List */}
                {userSearchResults.length > 0 && (
                  <div className="max-h-52 overflow-y-auto rounded-xl border border-border bg-secondary/90 divide-y divide-border/60 shadow-lg text-xs">
                    {userSearchResults.slice(0, 8).map((u) => {
                      const isCorp = isCorporateEmail(u.email);
                      const isChecked = isUserSelected(u);
                      return (
                        <button
                          key={u._id}
                          type="button"
                          onClick={() => toggleSelectUser(u)}
                          className={`w-full p-2.5 text-left transition-colors flex items-center justify-between gap-2.5 cursor-pointer ${
                            isChecked ? 'bg-primary/15' : 'hover:bg-primary/10'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="h-3.5 w-3.5 rounded accent-primary cursor-pointer pointer-events-none"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-foreground truncate">{u.name}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold capitalize bg-card border border-border text-muted-foreground">
                                  {u.role}
                                </span>
                              </div>
                              <div className="text-[11px] text-muted-foreground truncate">{u.email}</div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              isCorp
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            }`}>
                              {isCorp ? 'Corporate' : 'Personal'}
                            </span>
                            <div className="text-[10px] text-muted-foreground capitalize mt-0.5">
                              Plan: {u.plan || 'free'} ({u.planStatus || 'pending'})
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Selected User(s) Badge / Card */}
                {selectedUsers.length === 1 && selectedUser ? (
                  <div className="p-3.5 rounded-xl bg-secondary/80 border border-primary/30 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{selectedUser.name}</span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full font-bold uppercase bg-primary text-black">
                          {selectedUser.role}
                        </span>
                        <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold border ${
                          isCorporateEmail(selectedUser.email)
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}>
                          {isCorporateEmail(selectedUser.email) ? 'Corporate Email' : 'Personal Email'}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                        <span>{selectedUser.email}</span>
                        {selectedUser.phone && <span>• {selectedUser.phone}</span>}
                        {selectedUser.organization?.name && <span>• {selectedUser.organization.name}</span>}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Current: <strong className="text-foreground capitalize">{selectedUser.plan || 'Free'}</strong>
                        {' '}(Status: <span className="capitalize">{selectedUser.planStatus || 'pending'}</span>, Verified: {selectedUser.isVerified ? 'Yes' : 'No'})
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUsers([]);
                        setUserSearchQuery('');
                        setUserSearchResults([]);
                      }}
                      className="text-xs text-muted-foreground hover:text-red-500 transition-colors cursor-pointer shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ) : selectedUsers.length > 1 ? (
                  <div className="p-3.5 rounded-xl bg-secondary/80 border border-primary/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="font-bold text-xs text-foreground">
                          {selectedUsers.length} Users Selected for Plan Assignment
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedUsers([])}
                        className="text-xs text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {selectedUsers.map((u) => (
                        <span
                          key={u._id || u.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border text-[11px] text-foreground font-medium shadow-2xs"
                        >
                          <span className="font-semibold truncate max-w-[120px]">{u.name}</span>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[130px]">({u.email})</span>
                          <button
                            type="button"
                            onClick={() => toggleSelectUser(u)}
                            className="text-muted-foreground hover:text-red-500 cursor-pointer ml-0.5"
                            title={`Remove ${u.name}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Select users via checkboxes in the subscriptions table or search above.
                  </p>
                )}
              </div>

              {/* Assignment Form */}
              <form onSubmit={handleAssignPlan} className="space-y-4 text-xs pt-1 border-t border-border">
                {/* Step 2: Choose Plan */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    2. Select Plan to Assign *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'free', label: 'Free Organizer', badge: 'Complimentary Tier' },
                      { id: 'starter', label: 'Organizer Starter', badge: '₹14,999/Qtr' },
                      { id: 'enterprise', label: 'Organizer Enterprise', badge: '₹89,999/Qtr' },
                      { id: 'growth', label: 'Organizer Growth', badge: 'Marketing Engine' }
                    ].map((p) => {
                      const isSel = assignFormData.planId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setAssignFormData({ ...assignFormData, planId: p.id })}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSel
                              ? 'border-primary bg-primary/10 text-foreground shadow-2xs'
                              : 'border-border bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary'
                          }`}
                        >
                          <div className="font-bold text-foreground text-xs">{p.label}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{p.badge}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 3: Billing Cycle & Duration */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block font-semibold text-foreground mb-1">
                      Billing Cycle / Duration
                    </label>
                    <select
                      value={assignFormData.billingCycle}
                      onChange={(e) => setAssignFormData({ ...assignFormData, billingCycle: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:border-primary text-xs"
                    >
                      <option value="lifetime">Lifetime / Unlimited (No Expiry)</option>
                      <option value="yearly">Annual (1 Year Validity)</option>
                      <option value="quarterly">Quarterly (3 Months Validity)</option>
                      <option value="1_month">1 Month</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-foreground mb-1">
                      Custom Duration (Days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="e.g. 365, 90 (Optional)"
                      value={assignFormData.durationDays}
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setAssignFormData({ ...assignFormData, durationDays: '' });
                          return;
                        }
                        const cleanVal = val.replace(/[^0-9]/g, '');
                        if (cleanVal === '') {
                          setAssignFormData({ ...assignFormData, durationDays: '' });
                        } else {
                          const num = Math.max(0, parseInt(cleanVal, 10));
                          setAssignFormData({ ...assignFormData, durationDays: String(num) });
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:border-primary text-xs"
                    />
                  </div>
                </div>

                {/* Step 4: No charge for general mail & Price Options */}
                <div className="p-3.5 rounded-xl bg-secondary/50 border border-border space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="noChargeCheck"
                      checked={assignFormData.noChargeForGeneralMail}
                      onChange={(e) =>
                        setAssignFormData({
                          ...assignFormData,
                          noChargeForGeneralMail: e.target.checked,
                          price: e.target.checked ? 0 : assignFormData.price
                        })
                      }
                      className="mt-0.5 h-4 w-4 rounded accent-primary cursor-pointer"
                    />
                    <label htmlFor="noChargeCheck" className="cursor-pointer">
                      <span className="font-bold text-foreground block">
                        No charge for general mail (Waive Fee · ₹0 Free)
                      </span>
                      <span className="text-[11px] text-muted-foreground block mt-0.5 leading-relaxed">
                        Waives the ₹1,499 one-time registration charge for personal email accounts (@gmail, @yahoo, etc). The plan is assigned with <strong>₹0 amount</strong>.
                      </span>
                    </label>
                  </div>

                  <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                    <span className="text-muted-foreground">Amount Charged (₹):</span>
                    <input
                      type="number"
                      min="0"
                      disabled={assignFormData.noChargeForGeneralMail && assignFormData.planId === 'free'}
                      value={assignFormData.noChargeForGeneralMail && assignFormData.planId === 'free' ? 0 : assignFormData.price}
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        const num = Math.max(0, parseInt(val || '0', 10));
                        setAssignFormData({ ...assignFormData, price: isNaN(num) ? 0 : num });
                      }}
                      className="w-32 px-2.5 py-1.5 rounded-lg bg-background border border-border text-right font-mono text-foreground font-bold disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Step 5: Account Controls */}
                <div className="space-y-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="autoVerify"
                      checked={assignFormData.isVerified}
                      onChange={(e) => setAssignFormData({ ...assignFormData, isVerified: e.target.checked })}
                      className="h-3.5 w-3.5 rounded accent-primary cursor-pointer"
                    />
                    <label htmlFor="autoVerify" className="text-foreground cursor-pointer font-medium">
                      Auto-verify account &amp; activate dashboard immediately
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="upgradeRole"
                      checked={assignFormData.upgradeRoleToOrganizer}
                      onChange={(e) => setAssignFormData({ ...assignFormData, upgradeRoleToOrganizer: e.target.checked })}
                      className="h-3.5 w-3.5 rounded accent-primary cursor-pointer"
                    />
                    <label htmlFor="upgradeRole" className="text-foreground cursor-pointer font-medium">
                      Promote user role to &ldquo;Organizer&rdquo; (if visitor or exhibitor)
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Admin Reason / Audit Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Granted by Super Admin / No charge general email waiver"
                    value={assignFormData.adminNotes}
                    onChange={(e) => setAssignFormData({ ...assignFormData, adminNotes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:border-primary text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAssignFormData(INITIAL_ASSIGN_FORM_DATA);
                      setSelectedUsers([]);
                      setSearchQuery('');
                    }}
                    className="px-4 py-3 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Reset form to default values"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset</span>
                  </button>

                  <button
                    type="submit"
                    disabled={assigningPlan || selectedUsers.length === 0}
                    className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-black font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {assigningPlan ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-black" />
                        <span>Assigning Plan...</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 text-black" />
                        <span>
                          {selectedUsers.length === 0
                            ? 'Select User(s) to Assign Plan'
                            : selectedUsers.length === 1
                            ? `Assign ${assignFormData.planId.toUpperCase()} Plan to ${selectedUsers[0].name}`
                            : `Assign ${assignFormData.planId.toUpperCase()} Plan to ${selectedUsers.length} Users`}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Right 7 Cols: Active Subscriptions & Assigned Plans Directory */}
            <div className="lg:col-span-7 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                <div>
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <span>Active Organizer Subscriptions ({assignedSubs.length})</span>
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    All organizers with assigned plans, payment statuses, and fee waivers.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedUsers.length > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-primary/20 text-primary border border-primary/30 text-xs font-bold flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5" />
                      <span>{selectedUsers.length} selected</span>
                    </span>
                  )}
                  <select
                    value={subFilter}
                    onChange={(e) => {
                      setSubFilter(e.target.value);
                      setSubPage(1);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Plans</option>
                    <option value="free">Free</option>
                    <option value="starter">Starter</option>
                    <option value="enterprise">Enterprise</option>
                    <option value="growth">Growth</option>
                  </select>

                  <button
                    onClick={fetchAssignedSubscriptions}
                    className="p-1.5 rounded-lg border border-border bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Refresh subscriptions"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loadingSubs ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {loadingSubs ? (
                <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-xs">Loading subscriptions...</span>
                </div>
              ) : assignedSubs.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground space-y-1">
                  <CreditCard className="h-8 w-8 mx-auto text-muted-foreground/40" />
                  <p className="text-xs font-semibold text-foreground">No Subscriptions Found</p>
                  <p className="text-[11px]">Use the assignment console on the left to assign a plan to any user.</p>
                </div>
              ) : (() => {
                const totalSubPages = Math.max(1, Math.ceil(assignedSubs.length / subPageSize));
                const safeSubPage = Math.min(subPage, totalSubPages);
                const paginatedSubs = assignedSubs.slice((safeSubPage - 1) * subPageSize, safeSubPage * subPageSize);

                return (
                  <div className="space-y-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                            <th className="pb-2.5 pl-3 pr-2 w-8">
                              <input
                                type="checkbox"
                                aria-label="Select all subscriptions on this page"
                                checked={
                                  paginatedSubs.length > 0 &&
                                  paginatedSubs.every((sub) => sub.user && isUserSelected(sub.user))
                                }
                                onChange={handleSelectAllSubs}
                                className="h-3.5 w-3.5 rounded accent-primary cursor-pointer align-middle"
                                title="Select / deselect all visible"
                              />
                            </th>
                            <th className="pb-2.5">User</th>
                            <th className="pb-2.5">Plan / Cycle</th>
                            <th className="pb-2.5">Fee / Waiver</th>
                            <th className="pb-2.5">Status</th>
                            <th className="pb-2.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {paginatedSubs.map((sub) => {
                            const u = sub.user || {};
                            const isCorp = isCorporateEmail(u.email);
                            const isChecked = isUserSelected(u);
                            return (
                              <tr
                                key={sub._id}
                                className={`transition-colors ${
                                  isChecked ? 'bg-primary/10' : 'hover:bg-secondary/20'
                                }`}
                              >
                                <td className="py-3 pl-3 pr-2">
                                  <input
                                    type="checkbox"
                                    aria-label={`Select ${u.name || 'user'}`}
                                    checked={isChecked}
                                    onChange={() => toggleSelectUser(u)}
                                    className="h-3.5 w-3.5 rounded accent-primary cursor-pointer align-middle"
                                  />
                                </td>
                                <td className="py-3 pr-2">
                                  <div className="font-semibold text-foreground">{u.name || 'Organizer'}</div>
                                  <div className="text-[11px] text-muted-foreground truncate max-w-[160px]">{u.email}</div>
                                  <span className={`inline-block mt-0.5 text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                    isCorp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                  }`}>
                                    {isCorp ? 'Corporate' : 'Personal'}
                                  </span>
                                </td>

                                <td className="py-3 pr-2">
                                  <div className="font-bold text-foreground capitalize">{sub.plan || 'Free'}</div>
                                  <span className="text-[10px] text-muted-foreground capitalize">
                                    {sub.paymentCycle || 'Quarterly'}
                                  </span>
                                </td>

                                <td className="py-3 pr-2 font-mono">
                                  {sub.price === 0 ? (
                                    <span className="text-emerald-500 font-bold">₹0 (Waived)</span>
                                  ) : (
                                    <span className="font-bold text-foreground">₹{sub.price?.toLocaleString('en-IN')}</span>
                                  )}
                                </td>

                                <td className="py-3 pr-2">
                                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                    sub.status === 'active'
                                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                      : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                  }`}>
                                    {sub.status || 'Active'}
                                  </span>
                                </td>

                                <td className="py-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedUsers([u]);
                                      setAssignFormData({
                                        ...INITIAL_ASSIGN_FORM_DATA,
                                        planId: sub.plan || 'free',
                                        billingCycle: sub.paymentCycle || 'yearly',
                                        price: sub.price ?? 0
                                      });
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-[11px] font-semibold cursor-pointer border border-border"
                                  >
                                    Modify
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Subscriptions Pagination Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/60 text-xs text-muted-foreground">
                      <span>
                        Showing {(safeSubPage - 1) * subPageSize + 1}-
                        {Math.min(safeSubPage * subPageSize, assignedSubs.length)} of{' '}
                        {assignedSubs.length} subscriptions
                      </span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2">
                          <span>Per page</span>
                          <select
                            value={subPageSize}
                            onChange={(e) => {
                              setSubPageSize(Number(e.target.value));
                              setSubPage(1);
                            }}
                            className="rounded-lg border border-border bg-secondary px-2 py-1 text-foreground focus:outline-none focus:border-primary text-xs cursor-pointer"
                            aria-label="Subscriptions per page"
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                          </select>
                        </label>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSubPage((p) => Math.max(1, p - 1))}
                            disabled={safeSubPage <= 1}
                            className="p-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                            aria-label="Previous page"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <span className="min-w-16 text-center text-foreground font-semibold">
                            Page {safeSubPage} of {totalSubPages}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSubPage((p) => Math.min(totalSubPages, p + 1))}
                            disabled={safeSubPage >= totalSubPages}
                            className="p-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                            aria-label="Next page"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: GROWTH TOP-UP SERVICES */}
      {/* ========================================================= */}
      {activeTab === 'growth' && (
        <div className="space-y-6">
          <div className="bg-card p-5 rounded-2xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-emerald-500" />
                Growth Services Catalog (13 Promotion Channels)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Top-up services starting from ₹1,000 to unlimited. Point-wise price uses for targeted buyer/exhibitor acquisition.
              </p>
            </div>
            <div className="text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg border border-border">
              Total Configured: <strong className="text-foreground">{growthServices.length} Channels</strong>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {growthServices.map((service, idx) => (
              <div
                key={service.serviceId || idx}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3.5 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                      {service.category || 'Promotion'}
                    </span>
                    <h4 className="font-bold text-sm text-foreground mt-1.5">{service.name}</h4>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    Active
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {service.description}
                </p>

                <div className="p-3 rounded-xl bg-secondary/40 border border-border/80 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Pricing Model:</span>
                  <span className="text-xs font-extrabold text-foreground font-mono">
                    {service.pricingModel}
                  </span>
                </div>

                {service.deliverables && service.deliverables.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">Key Deliverables:</span>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {service.deliverables.slice(0, 3).map((del, dIdx) => (
                        <li key={dIdx} className="flex items-center gap-1.5 text-[11px]">
                          <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                          <span className="truncate">{del}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: ORGANIZER UPGRADE & TOP-UP INQUIRIES */}
      {/* ========================================================= */}
      {activeTab === 'inquiries' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {['all', 'new', 'contacted', 'in_discussion', 'converted', 'rejected'].map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setInquiryFilter(st);
                    setInquiryPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    inquiryFilter === st
                      ? 'bg-primary text-black'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>

            <button
              onClick={fetchInquiries}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-secondary cursor-pointer shrink-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${inquiriesLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Table */}
          {(() => {
            const filteredInquiries = inquiries.filter((inq) => {
              if (inquiryFilter === 'all') return true;
              return inq.status === inquiryFilter;
            });
            const totalInquiryPages = Math.max(1, Math.ceil(filteredInquiries.length / inquiryPageSize));
            const safeInquiryPage = Math.min(inquiryPage, totalInquiryPages);
            const paginatedInquiries = filteredInquiries.slice(
              (safeInquiryPage - 1) * inquiryPageSize,
              safeInquiryPage * inquiryPageSize
            );

            return (
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                {inquiriesLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm">Fetching inquiries...</p>
                  </div>
                ) : filteredInquiries.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground space-y-2">
                    <HelpCircle className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                    <p className="text-sm font-semibold text-foreground">No inquiries found</p>
                    <p className="text-xs">
                      {inquiryFilter === 'all'
                        ? 'Organizer inquiries submitted on the website will be displayed here in real time.'
                        : `No inquiries with status "${inquiryFilter.replace('_', ' ')}".`}
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-border bg-muted/20 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                            <th className="px-5 py-3.5">Organizer &amp; Company</th>
                            <th className="px-5 py-3.5">Plan Requested</th>
                            <th className="px-5 py-3.5">Contact Details</th>
                            <th className="px-5 py-3.5">Email Type</th>
                            <th className="px-5 py-3.5">Status</th>
                            <th className="px-5 py-3.5">Date</th>
                            <th className="px-5 py-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {paginatedInquiries.map((inq) => (
                            <tr key={inq._id} className="hover:bg-secondary/40 transition-colors">
                              <td className="px-5 py-3.5">
                                <div className="font-bold text-foreground text-sm">{inq.organizerName}</div>
                                <div className="text-muted-foreground text-[11px] flex items-center gap-1 mt-0.5">
                                  <Building className="h-3 w-3" />
                                  {inq.organizationName || 'Individual'}
                                </div>
                              </td>

                              <td className="px-5 py-3.5">
                                <span className="font-bold text-foreground">{inq.planName}</span>
                                <div className="text-muted-foreground text-[11px] capitalize">{inq.billingCycle}</div>
                              </td>

                              <td className="px-5 py-3.5 space-y-0.5">
                                <div className="text-foreground font-mono">{inq.email}</div>
                                <div className="text-muted-foreground font-mono">{inq.phone}</div>
                              </td>

                              <td className="px-5 py-3.5">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    inq.emailType === 'corporate'
                                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                      : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                  }`}
                                >
                                  {inq.emailType === 'corporate' ? 'Corporate Domain' : 'General Email'}
                                </span>
                              </td>

                              <td className="px-5 py-3.5">
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                    inq.status === 'new'
                                      ? 'bg-amber-500/10 text-amber-500 animate-pulse'
                                      : inq.status === 'converted'
                                      ? 'bg-emerald-500/10 text-emerald-500'
                                      : inq.status === 'in_discussion'
                                      ? 'bg-blue-500/10 text-blue-500'
                                      : inq.status === 'contacted'
                                      ? 'bg-indigo-500/10 text-indigo-500'
                                      : 'bg-zinc-500/10 text-zinc-500'
                                  }`}
                                >
                                  {inq.status.replace('_', ' ')}
                                </span>
                              </td>

                              <td className="px-5 py-3.5 text-muted-foreground">
                                {new Date(inq.createdAt).toLocaleDateString()}
                              </td>

                              <td className="px-5 py-3.5 text-right">
                                <button
                                  onClick={() => {
                                    setActiveInquiry(inq);
                                    setInquiryNotes(inq.adminNotes || '');
                                    setInquiryStatus(inq.status || 'new');
                                    setShowInquiryModal(true);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-[11px] cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Edit3 className="h-3 w-3" />
                                  Manage
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Inquiries Pagination Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-t border-border bg-card text-xs text-muted-foreground">
                      <span>
                        Showing {(safeInquiryPage - 1) * inquiryPageSize + 1}-
                        {Math.min(safeInquiryPage * inquiryPageSize, filteredInquiries.length)} of{' '}
                        {filteredInquiries.length} inquiries
                      </span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2">
                          <span>Per page</span>
                          <select
                            value={inquiryPageSize}
                            onChange={(e) => {
                              setInquiryPageSize(Number(e.target.value));
                              setInquiryPage(1);
                            }}
                            className="rounded-lg border border-border bg-secondary px-2.5 py-1 text-foreground focus:outline-none focus:border-primary text-xs cursor-pointer"
                            aria-label="Inquiries per page"
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                          </select>
                        </label>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInquiryPage((p) => Math.max(1, p - 1))}
                            disabled={safeInquiryPage <= 1}
                            className="p-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                            aria-label="Previous page"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <span className="min-w-16 text-center text-foreground font-semibold">
                            Page {safeInquiryPage} of {totalInquiryPages}
                          </span>
                          <button
                            type="button"
                            onClick={() => setInquiryPage((p) => Math.min(totalInquiryPages, p + 1))}
                            disabled={safeInquiryPage >= totalInquiryPages}
                            className="p-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                            aria-label="Next page"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: FEATURE COMPARISON MATRIX */}
      {/* ========================================================= */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="bg-card p-5 rounded-2xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Comprehensive Feature Comparison Matrix
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Side-by-side feature access across Free Organizer, Organizer Starter, and Organizer Enterprise.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setMatrixPage(1);
                }}
                placeholder="Search feature matrix..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-secondary border border-border focus:outline-none focus:border-primary text-foreground"
              />
            </div>
          </div>

          {(() => {
            const filteredMatrixRows = MATRIX_ROWS.filter(
              (r) => !searchQuery || r.label.toLowerCase().includes(searchQuery.toLowerCase())
            );
            const totalMatrixPages = Math.max(1, Math.ceil(filteredMatrixRows.length / matrixPageSize));
            const safeMatrixPage = Math.min(matrixPage, totalMatrixPages);
            const paginatedMatrixRows = filteredMatrixRows.slice(
              (safeMatrixPage - 1) * matrixPageSize,
              safeMatrixPage * matrixPageSize
            );

            return (
              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="px-6 py-4 font-bold text-foreground w-1/3">Feature / Capability</th>
                        <th className="px-6 py-4 font-bold text-foreground w-1/5">Free Organizer</th>
                        <th className="px-6 py-4 font-bold text-primary w-1/5">Starter Plan</th>
                        <th className="px-6 py-4 font-bold text-indigo-400 w-1/5">Enterprise Plan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {paginatedMatrixRows.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                            No features match your search term &ldquo;{searchQuery}&rdquo;.
                          </td>
                        </tr>
                      ) : (
                        paginatedMatrixRows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-secondary/30 transition-colors">
                            <td className="px-6 py-3.5 font-semibold text-foreground">{row.label}</td>
                            <td className="px-6 py-3.5 text-muted-foreground">{row.free}</td>
                            <td className="px-6 py-3.5 font-medium text-foreground">{row.starter}</td>
                            <td className="px-6 py-3.5 font-semibold text-indigo-400">{row.enterprise}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-t border-border bg-card text-xs text-muted-foreground">
                  <span>
                    Showing {filteredMatrixRows.length === 0 ? 0 : (safeMatrixPage - 1) * matrixPageSize + 1}-
                    {Math.min(safeMatrixPage * matrixPageSize, filteredMatrixRows.length)} of{' '}
                    {filteredMatrixRows.length} features
                  </span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2">
                      <span>Rows per page</span>
                      <select
                        value={matrixPageSize}
                        onChange={(e) => {
                          setMatrixPageSize(Number(e.target.value));
                          setMatrixPage(1);
                        }}
                        className="rounded-lg border border-border bg-secondary px-2.5 py-1 text-foreground focus:outline-none focus:border-primary text-xs cursor-pointer"
                        aria-label="Rows per page"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                      </select>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setMatrixPage((p) => Math.max(1, p - 1))}
                        disabled={safeMatrixPage <= 1}
                        className="p-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="min-w-16 text-center text-foreground font-semibold">
                        Page {safeMatrixPage} of {totalMatrixPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setMatrixPage((p) => Math.min(totalMatrixPages, p + 1))}
                        disabled={safeMatrixPage >= totalMatrixPages}
                        className="p-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        aria-label="Next page"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================= */}
      {/* EDIT PLAN MODAL */}
      {/* ========================================================= */}
      {showEditModal && editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="relative w-full max-w-2xl sm:max-w-3xl bg-card border border-border rounded-2xl p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  Edit Plan: {editingPlan.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Update plan pricing, badge, and allowances displayed to organizers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-3.5 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Plan Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => {
                      setEditFormData({ ...editFormData, name: e.target.value });
                      if (editFormErrors.name) setEditFormErrors({ ...editFormErrors, name: '' });
                    }}
                    className={`w-full px-3 py-2 rounded-xl bg-secondary border text-foreground focus:outline-none ${
                      editFormErrors.name ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary'
                    }`}
                  />
                  {editFormErrors.name && (
                    <p className="text-[11px] text-red-500 mt-1 font-medium">{editFormErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Badge Text</label>
                  <input
                    type="text"
                    value={editFormData.badge}
                    onChange={(e) => setEditFormData({ ...editFormData, badge: e.target.value })}
                    placeholder="e.g. Most Popular, Enterprise Scale"
                    className="w-full px-3 py-2 rounded-xl bg-secondary border border-border focus:outline-none focus:border-primary text-foreground"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Tagline</label>
                  <input
                    type="text"
                    value={editFormData.tagline}
                    onChange={(e) => setEditFormData({ ...editFormData, tagline: e.target.value })}
                    placeholder="Short description for plan tier"
                    className="w-full px-3 py-2 rounded-xl bg-secondary border border-border focus:outline-none focus:border-primary text-foreground"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Billing Footnote</label>
                  <input
                    type="text"
                    value={editFormData.billingNote}
                    onChange={(e) => setEditFormData({ ...editFormData, billingNote: e.target.value })}
                    placeholder="e.g. Save 17% on Annual Billing"
                    className="w-full px-3 py-2 rounded-xl bg-secondary border border-border focus:outline-none focus:border-primary text-foreground"
                  />
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="p-3.5 rounded-xl bg-secondary/40 border border-border space-y-2.5">
                <span className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                  Pricing Configuration (INR ₹)
                </span>

                <div className="grid gap-3 sm:grid-cols-3">
                  {editingPlan.planId === 'free' ? (
                    <>
                      <div>
                        <label className="block text-muted-foreground mb-1">
                          Corporate Price (₹) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={editFormData.corporateEmailPrice}
                          onKeyDown={handlePriceKeyDown}
                          onChange={(e) => {
                            const val = sanitizeNumberInput(e.target.value);
                            setEditFormData({ ...editFormData, corporateEmailPrice: val });
                            if (editFormErrors.corporateEmailPrice) setEditFormErrors({ ...editFormErrors, corporateEmailPrice: '' });
                          }}
                          className={`w-full px-3 py-2 rounded-xl bg-background border font-mono text-foreground ${
                            editFormErrors.corporateEmailPrice ? 'border-red-500' : 'border-border'
                          }`}
                        />
                        {editFormErrors.corporateEmailPrice && (
                          <p className="text-[11px] text-red-500 mt-1">{editFormErrors.corporateEmailPrice}</p>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-muted-foreground">
                            General Price (₹) <span className="text-red-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setEditFormData({
                                ...editFormData,
                                generalEmailPrice: Number(editFormData.generalEmailPrice) === 0 ? 1499 : 0
                              });
                              if (editFormErrors.generalEmailPrice) setEditFormErrors({ ...editFormErrors, generalEmailPrice: '' });
                            }}
                            className={`text-[9px] px-1.5 py-0.5 rounded font-semibold border transition-all cursor-pointer ${
                              Number(editFormData.generalEmailPrice) === 0
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                : 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20'
                            }`}
                          >
                            {Number(editFormData.generalEmailPrice) === 0 ? '✓ Free' : 'Set Free'}
                          </button>
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={editFormData.generalEmailPrice}
                          onKeyDown={handlePriceKeyDown}
                          onChange={(e) => {
                            const val = sanitizeNumberInput(e.target.value);
                            setEditFormData({ ...editFormData, generalEmailPrice: val });
                            if (editFormErrors.generalEmailPrice) setEditFormErrors({ ...editFormErrors, generalEmailPrice: '' });
                          }}
                          className={`w-full px-3 py-2 rounded-xl bg-background border font-mono text-foreground ${
                            editFormErrors.generalEmailPrice ? 'border-red-500' : 'border-border'
                          }`}
                        />
                        {editFormErrors.generalEmailPrice && (
                          <p className="text-[11px] text-red-500 mt-1">{editFormErrors.generalEmailPrice}</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-muted-foreground mb-1">
                          Quarterly Price (₹) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={editFormData.quarterlyPrice}
                          onKeyDown={handlePriceKeyDown}
                          onChange={(e) => {
                            const val = sanitizeNumberInput(e.target.value);
                            setEditFormData({ ...editFormData, quarterlyPrice: val });
                            if (editFormErrors.quarterlyPrice) setEditFormErrors({ ...editFormErrors, quarterlyPrice: '' });
                          }}
                          className={`w-full px-3 py-2 rounded-xl bg-background border font-mono text-foreground ${
                            editFormErrors.quarterlyPrice ? 'border-red-500' : 'border-border'
                          }`}
                        />
                        {editFormErrors.quarterlyPrice && (
                          <p className="text-[11px] text-red-500 mt-1">{editFormErrors.quarterlyPrice}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-muted-foreground mb-1">
                          Yearly Price (₹) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={editFormData.yearlyPrice}
                          onKeyDown={handlePriceKeyDown}
                          onChange={(e) => {
                            const val = sanitizeNumberInput(e.target.value);
                            setEditFormData({ ...editFormData, yearlyPrice: val });
                            if (editFormErrors.yearlyPrice) setEditFormErrors({ ...editFormErrors, yearlyPrice: '' });
                          }}
                          className={`w-full px-3 py-2 rounded-xl bg-background border font-mono text-foreground ${
                            editFormErrors.yearlyPrice ? 'border-red-500' : 'border-border'
                          }`}
                        />
                        {editFormErrors.yearlyPrice && (
                          <p className="text-[11px] text-red-500 mt-1">{editFormErrors.yearlyPrice}</p>
                        )}
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-muted-foreground mb-1">
                      Event Research (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={editFormData.proposedEventResearchPrice}
                      onKeyDown={handlePriceKeyDown}
                      onChange={(e) => {
                        const val = sanitizeNumberInput(e.target.value);
                        setEditFormData({ ...editFormData, proposedEventResearchPrice: val });
                        if (editFormErrors.proposedEventResearchPrice) setEditFormErrors({ ...editFormErrors, proposedEventResearchPrice: '' });
                      }}
                      className={`w-full px-3 py-2 rounded-xl bg-background border font-mono text-foreground ${
                        editFormErrors.proposedEventResearchPrice ? 'border-red-500' : 'border-border'
                      }`}
                    />
                    {editFormErrors.proposedEventResearchPrice && (
                      <p className="text-[11px] text-red-500 mt-1">{editFormErrors.proposedEventResearchPrice}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Best for you if */}
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Best for you if (One bullet point per line)
                </label>
                <textarea
                  rows={2}
                  value={editFormData.bestFor}
                  onChange={(e) => setEditFormData({ ...editFormData, bestFor: e.target.value })}
                  placeholder="e.g. You are new to VisitExpo"
                  className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground font-mono text-[11px] focus:outline-none focus:border-primary"
                />
              </div>

              {/* Key Inclusions */}
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Key Inclusions (One bullet point per line)
                </label>
                <textarea
                  rows={3}
                  value={editFormData.keyInclusions}
                  onChange={(e) => setEditFormData({ ...editFormData, keyInclusions: e.target.value })}
                  placeholder="e.g. Free registration (corporate email)"
                  className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground font-mono text-[11px] focus:outline-none focus:border-primary"
                />
              </div>

              {/* Highlights */}
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Highlights (One bullet point per line) <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={editFormData.highlights}
                  onChange={(e) => {
                    setEditFormData({ ...editFormData, highlights: e.target.value });
                    if (editFormErrors.highlights) setEditFormErrors({ ...editFormErrors, highlights: '' });
                  }}
                  className={`w-full px-3 py-2 rounded-xl bg-secondary border text-foreground font-mono text-[11px] focus:outline-none ${
                    editFormErrors.highlights ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary'
                  }`}
                />
                {editFormErrors.highlights && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium">{editFormErrors.highlights}</p>
                )}
              </div>

              {/* Footer: Toggles on Left, Buttons on Right */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
                <div className="flex items-center gap-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.isActive}
                      onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                      className="rounded border-border text-primary focus:ring-primary cursor-pointer"
                    />
                    <span className="font-semibold text-foreground">Active Plan</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.isPopular}
                      onChange={(e) => setEditFormData({ ...editFormData, isPopular: e.target.checked })}
                      className="rounded border-border text-primary focus:ring-primary cursor-pointer"
                    />
                    <span className="font-semibold text-foreground">Highlighted / Most Popular</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetEditForm}
                    className="px-3.5 py-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground font-semibold cursor-pointer flex items-center gap-1.5 transition-all text-xs"
                    title="Reset form to original plan values"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground font-semibold cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 rounded-xl bg-primary text-black font-bold hover:bg-primary/90 cursor-pointer flex items-center gap-1.5 disabled:opacity-50 text-xs"
                  >
                    {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* INQUIRY MANAGEMENT MODAL */}
      {/* ========================================================= */}
      {showInquiryModal && activeInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-5 no-scrollbar">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Manage Inquiry: {activeInquiry.organizerName}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {activeInquiry.planName} ({activeInquiry.billingCycle})
                </p>
              </div>
              <button
                onClick={() => setShowInquiryModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-secondary/50 border border-border space-y-1">
                <div>
                  <strong className="text-foreground">Email: </strong>
                  <a href={`mailto:${activeInquiry.email}`} className="text-primary hover:underline">
                    {activeInquiry.email}
                  </a>{' '}
                  ({activeInquiry.emailType})
                </div>
                <div>
                  <strong className="text-foreground">Phone: </strong>
                  <a href={`tel:${activeInquiry.phone}`} className="text-primary hover:underline">
                    {activeInquiry.phone}
                  </a>
                </div>
                {activeInquiry.organizationName && (
                  <div>
                    <strong className="text-foreground">Company: </strong>
                    <span className="text-foreground">{activeInquiry.organizationName}</span>
                  </div>
                )}
                {activeInquiry.message && (
                  <div className="pt-1 mt-1 border-t border-border/60">
                    <strong className="text-foreground">Notes from organizer: </strong>
                    <p className="text-muted-foreground mt-0.5 italic">{activeInquiry.message}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Status</label>
                <select
                  value={inquiryStatus}
                  onChange={(e) => setInquiryStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground font-semibold"
                >
                  <option value="new">New / Uncontacted</option>
                  <option value="contacted">Contacted</option>
                  <option value="in_discussion">In Discussion</option>
                  <option value="converted">Converted / Upgraded</option>
                  <option value="rejected">Closed / Rejected</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Super Admin Notes</label>
                <textarea
                  rows={3}
                  value={inquiryNotes}
                  onChange={(e) => setInquiryNotes(e.target.value)}
                  placeholder="Record follow-up details, payment links sent, or agreement terms..."
                  className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setInquiryStatus(activeInquiry.status || 'new');
                  setInquiryNotes(activeInquiry.adminNotes || '');
                }}
                className="px-3.5 py-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs cursor-pointer flex items-center gap-1.5 transition-all"
                title="Reset inquiry status and notes"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
              <button
                type="button"
                onClick={() => setShowInquiryModal(false)}
                className="px-4 py-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateInquiry}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-primary text-black font-bold text-xs hover:bg-primary/90 cursor-pointer flex items-center gap-1.5"
              >
                {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Save Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
