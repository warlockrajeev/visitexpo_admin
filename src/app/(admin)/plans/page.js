'use client';

/**
 * @file plans/page.js
 * @description Super Admin Plans Management Console for VisitExpo.
 * Manage official Organizer Pricing Tiers, Feature Limits, Growth Top-ups, and Organizer Upgrade Inquiries.
 */

import React, { useState, useEffect } from 'react';
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
  Sparkles,
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
  ArrowUpRight
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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

  // Edit Plan Modal State
  const [editingPlan, setEditingPlan] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});

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

  // Fetch all plans and admin stats
  const fetchPlans = async () => {
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
  };

  // Fetch Inquiries
  const fetchInquiries = async () => {
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
  };

  useEffect(() => {
    fetchPlans();
  }, [accessToken]);

  useEffect(() => {
    if (activeTab === 'inquiries') {
      fetchInquiries();
    }
  }, [activeTab, inquiryFilter, accessToken]);

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
      highlights: (plan.highlights || []).join('\n')
    });
    setShowEditModal(true);
  };

  // Save Plan Updates
  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!editingPlan) return;

    try {
      setActionLoading(true);
      const payload = {
        name: editFormData.name,
        tagline: editFormData.tagline,
        description: editFormData.description,
        badge: editFormData.badge,
        badgeColor: editFormData.badgeColor,
        isActive: editFormData.isActive,
        isPopular: editFormData.isPopular,
        pricing: {
          ...editingPlan.pricing,
          corporateEmailPrice: Number(editFormData.corporateEmailPrice),
          generalEmailPrice: Number(editFormData.generalEmailPrice),
          quarterlyPrice: Number(editFormData.quarterlyPrice),
          yearlyPrice: Number(editFormData.yearlyPrice),
          proposedEventResearchPrice: Number(editFormData.proposedEventResearchPrice),
          billingNote: editFormData.billingNote
        },
        highlights: editFormData.highlights
          .split('\n')
          .map((h) => h.trim())
          .filter(Boolean)
      };

      const res = await axios.put(`${API_URL}/plans/admin/${editingPlan._id}`, payload, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (res.data?.success) {
        showSweetSuccess(`Plan "${editFormData.name}" updated successfully.`);
        setShowEditModal(false);
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

        <div className="flex items-center gap-2.5 flex-wrap">
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
                  className={`rounded-2xl border bg-card p-6 shadow-sm flex flex-col justify-between space-y-6 transition-all ${
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
                            <span className="font-extrabold text-foreground font-mono">₹1,499</span>
                          </div>
                          <div className="flex items-baseline justify-between text-xs pt-1 border-t border-border/60">
                            <span className="text-muted-foreground">Proposed Event Research:</span>
                            <span className="font-bold text-amber-500 font-mono">₹4,999</span>
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

                    {/* Highlights List */}
                    <div className="space-y-2 border-t border-border pt-3">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Key Inclusions &amp; Allowances:
                      </span>
                      <ul className="space-y-2 text-xs text-muted-foreground">
                        {(plan.highlights || []).slice(0, 6).map((item, hIdx) => (
                          <li key={hIdx} className="flex items-start gap-2">
                            <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="leading-snug">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border">
                    <button
                      onClick={() => handleOpenEdit(plan)}
                      className="w-full py-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Configure Pricing &amp; Features
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: GROWTH TOP-UP SERVICES */}
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
                  onClick={() => setInquiryFilter(st)}
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
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {inquiriesLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm">Fetching inquiries...</p>
              </div>
            ) : inquiries.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground space-y-2">
                <HelpCircle className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                <p className="text-sm font-semibold text-foreground">No inquiries found</p>
                <p className="text-xs">Organizer inquiries submitted on the website will be displayed here in real time.</p>
              </div>
            ) : (
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
                    {inquiries.map((inq) => (
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
            )}
          </div>
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
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search feature matrix..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-secondary border border-border focus:outline-none focus:border-primary text-foreground"
              />
            </div>
          </div>

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
                  {[
                    { label: 'Detailed Lead Access', free: 'Masked (Counts & volume visible)', starter: 'Full', enterprise: 'Full + advanced' },
                    { label: 'Lead CRM', free: 'Basic operational counters', starter: 'Basic operational CRM', enterprise: 'Advanced CRM + API' },
                    { label: 'Lead Export', free: 'Not Available', starter: 'Not Available', enterprise: 'Unlimited' },
                    { label: 'Lead Search & Filtering', free: 'Basic', starter: 'Ok', enterprise: 'Advanced' },
                    { label: 'Visitor / Exhibitor / Vendor Leads', free: 'Masked', starter: 'Unlocked', enterprise: 'Full + analytics' },
                    { label: 'Venue / Designer / Organizer Leads', free: 'Masked', starter: 'Unlocked', enterprise: 'Full + analytics + Search Database' },
                    { label: 'Ticket Platform / Expo Mgmt Leads', free: 'Masked', starter: 'Unlocked', enterprise: 'Full + analytics' },
                    { label: 'Paid Ticket Selling', free: 'Not included (1/10 demand test)', starter: 'Unlocked', enterprise: 'Advanced / private gateway' },
                    { label: 'Payment Gateway', free: 'Not included', starter: 'Ok', enterprise: 'Ok (Multi-gateway + Custom)' },
                    { label: 'Ticket Sales Analytics', free: 'Demand stats only', starter: 'Basic', enterprise: 'Advanced' },
                    { label: 'Exhibitor Management', free: 'Basic', starter: 'Basic', enterprise: 'Advance' },
                    { label: 'Proposed Expo Validation', free: '4,999 per proposed event', starter: 'Limited allowance', enterprise: 'Multiple Events' },
                    { label: 'Interest Analysis', free: 'Basic volume', starter: 'Basic', enterprise: 'Detailed category-wise' },
                    { label: 'B2B / B2C Demand Analysis', free: 'Basic', starter: 'Basic', enterprise: 'Advance' },
                    { label: 'Active Events', free: 'Unlimited (claimed/created)', starter: 'Unlimited', enterprise: 'Unlimited' },
                    { label: 'Marketing Campaigns', free: 'Growth Plan (Paid separately)', starter: 'Growth Plan', enterprise: 'Growth Plan' },
                    { label: 'Priority Search / Featured Placement', free: 'No (Organic)', starter: 'No', enterprise: 'Available' },
                    { label: 'Support SLA', free: 'Standard Community', starter: 'Priority', enterprise: 'Faster priority (Dedicated Manager)' },
                  ]
                    .filter((r) => !searchQuery || r.label.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-6 py-3.5 font-semibold text-foreground">{row.label}</td>
                        <td className="px-6 py-3.5 text-muted-foreground">{row.free}</td>
                        <td className="px-6 py-3.5 font-medium text-foreground">{row.starter}</td>
                        <td className="px-6 py-3.5 font-semibold text-indigo-400">{row.enterprise}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EDIT PLAN MODAL */}
      {/* ========================================================= */}
      {showEditModal && editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Edit Plan: {editingPlan.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Update plan pricing, badge, and allowances displayed to organizers.
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Plan Name</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary border border-border focus:outline-none focus:border-primary text-foreground"
                  />
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

              <div>
                <label className="block font-semibold text-foreground mb-1">Tagline</label>
                <input
                  type="text"
                  value={editFormData.tagline}
                  onChange={(e) => setEditFormData({ ...editFormData, tagline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-secondary border border-border focus:outline-none focus:border-primary text-foreground"
                />
              </div>

              {/* Pricing Grid */}
              <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-3">
                <span className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                  Pricing Configuration (INR ₹)
                </span>

                <div className="grid gap-3 sm:grid-cols-2">
                  {editingPlan.planId === 'free' ? (
                    <>
                      <div>
                        <label className="block text-muted-foreground mb-1">Corporate Email Price (₹)</label>
                        <input
                          type="number"
                          value={editFormData.corporateEmailPrice}
                          onChange={(e) => setEditFormData({ ...editFormData, corporateEmailPrice: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-background border border-border font-mono text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-muted-foreground mb-1">General Email Price (₹)</label>
                        <input
                          type="number"
                          value={editFormData.generalEmailPrice}
                          onChange={(e) => setEditFormData({ ...editFormData, generalEmailPrice: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-background border border-border font-mono text-foreground"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-muted-foreground mb-1">Quarterly Price (₹)</label>
                        <input
                          type="number"
                          value={editFormData.quarterlyPrice}
                          onChange={(e) => setEditFormData({ ...editFormData, quarterlyPrice: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-background border border-border font-mono text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-muted-foreground mb-1">Yearly Price (₹)</label>
                        <input
                          type="number"
                          value={editFormData.yearlyPrice}
                          onChange={(e) => setEditFormData({ ...editFormData, yearlyPrice: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-background border border-border font-mono text-foreground"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-muted-foreground mb-1">Proposed Event Research (₹)</label>
                    <input
                      type="number"
                      value={editFormData.proposedEventResearchPrice}
                      onChange={(e) => setEditFormData({ ...editFormData, proposedEventResearchPrice: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border font-mono text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-muted-foreground mb-1">Billing Footnote</label>
                    <input
                      type="text"
                      value={editFormData.billingNote}
                      onChange={(e) => setEditFormData({ ...editFormData, billingNote: e.target.value })}
                      placeholder="e.g. Save 17% on Annual Billing"
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Highlights */}
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Highlights (One bullet point per line)
                </label>
                <textarea
                  rows={5}
                  value={editFormData.highlights}
                  onChange={(e) => setEditFormData({ ...editFormData, highlights: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-secondary border border-border focus:outline-none focus:border-primary text-foreground font-mono text-[11px]"
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.isActive}
                    onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="font-semibold text-foreground">Active Plan</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.isPopular}
                    onChange={(e) => setEditFormData({ ...editFormData, isPopular: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="font-semibold text-foreground">Highlighted / Most Popular</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-primary text-black font-bold hover:bg-primary/90 cursor-pointer flex items-center gap-1.5"
                >
                  {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* INQUIRY MANAGEMENT MODAL */}
      {/* ========================================================= */}
      {showInquiryModal && activeInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-5">
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
                onClick={() => setShowInquiryModal(false)}
                className="px-4 py-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
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
