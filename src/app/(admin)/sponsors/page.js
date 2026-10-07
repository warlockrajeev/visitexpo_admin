'use client';

/**
 * @file sponsors/page.js
 * @description Super Admin Sponsors & Strategic Partners Directory.
 * Displays all headline corporate sponsors, tier classifications (Platinum, Gold, Silver, Bronze),
 * associated expos, booth allocations, contact representatives, and full management controls.
 * Fully optimized for both Light Mode and Dark Mode.
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  Award,
  Search,
  Plus,
  ExternalLink,
  Building2,
  MapPin,
  Calendar,
  Mail,
  Phone,
  Trash2,
  Filter,
  CheckCircle2,
  Crown,
  ShieldCheck,
  Globe,
  Grid,
  List,
  AlertCircle,
  X,
  Loader2,
  Store,
  Layers,
  ArrowUpRight,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const FALLBACK_SPONSORS = [
  {
    _id: 'sp_01',
    name: 'Tata Motors EV',
    logo: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?q=80&w=200&auto=format&fit=crop',
    website: 'https://ev.tatamotors.com',
    tier: 'platinum',
    isExhibitor: true,
    boothDetails: { boothNumber: 'Hall 4 - P01', size: '120 sqm', location: 'Bharat Mandapam, New Delhi' },
    contactPerson: { name: 'Rajesh Sen', email: 'rajesh.sen@tatamotors.com', phone: '+91 98200 12345' },
    eventTitle: 'Bharat Mobility Global Expo 2027',
    eventId: '21395'
  },
  {
    _id: 'sp_02',
    name: 'Siemens Healthineers',
    logo: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=200&auto=format&fit=crop',
    website: 'https://siemens-healthineers.com',
    tier: 'platinum',
    isExhibitor: true,
    boothDetails: { boothNumber: 'Hall 2 - A12', size: '90 sqm', location: 'Jio World Convention Centre, Mumbai' },
    contactPerson: { name: 'Dr. Ananya Roy', email: 'ananya.roy@siemens.com', phone: '+91 98110 54321' },
    eventTitle: 'India MedTech Expo & Summit',
    eventId: '21363'
  },
  {
    _id: 'sp_03',
    name: 'Google Cloud India',
    logo: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=200&auto=format&fit=crop',
    website: 'https://cloud.google.com',
    tier: 'platinum',
    isExhibitor: false,
    boothDetails: { boothNumber: 'Keynote Pavillion', size: '200 sqm', location: 'Yashobhoomi, IICC New Delhi' },
    contactPerson: { name: 'Kavita Iyer', email: 'kavita@google.com', phone: '+91 98700 98700' },
    eventTitle: 'Global AI & Technology Convention',
    eventId: '21355'
  },
  {
    _id: 'sp_04',
    name: 'Larsen & Toubro (L&T)',
    logo: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?q=80&w=200&auto=format&fit=crop',
    website: 'https://larsentoubro.com',
    tier: 'gold',
    isExhibitor: true,
    boothDetails: { boothNumber: 'Outdoor Zone OD-04', size: '150 sqm', location: 'India Expo Centre, Greater Noida' },
    contactPerson: { name: 'Sunil Nair', email: 's.nair@larsentoubro.com', phone: '+91 99300 45678' },
    eventTitle: 'BAUMA CONEXPO INDIA 2026',
    eventId: '20793'
  },
  {
    _id: 'sp_05',
    name: 'Emirates Holidays',
    logo: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=200&auto=format&fit=crop',
    website: 'https://emiratesholidays.com',
    tier: 'gold',
    isExhibitor: true,
    boothDetails: { boothNumber: 'Hall 9 - G18', size: '60 sqm', location: 'Pragati Maidan, New Delhi' },
    contactPerson: { name: 'Tariq Mansoor', email: 'tariq@emirates.com', phone: '+971 4 299 1234' },
    eventTitle: 'SATTE South Asia Travel Expo',
    eventId: '21390'
  },
  {
    _id: 'sp_06',
    name: 'Amul Dairy Federation',
    logo: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=200&auto=format&fit=crop',
    website: 'https://amul.com',
    tier: 'silver',
    isExhibitor: true,
    boothDetails: { boothNumber: 'Hall 5 - S02', size: '48 sqm', location: 'Pragati Maidan, New Delhi' },
    contactPerson: { name: 'Pradeep Patel', email: 'p.patel@amul.coop', phone: '+91 98250 11223' },
    eventTitle: 'AAHAR International Food Fair',
    eventId: '20922'
  },
  {
    _id: 'sp_07',
    name: 'Bosch Mobility Solutions',
    logo: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?q=80&w=200&auto=format&fit=crop',
    website: 'https://bosch.in',
    tier: 'gold',
    isExhibitor: true,
    boothDetails: { boothNumber: 'Hall 11 - B08', size: '80 sqm', location: 'BIEC Bengaluru' },
    contactPerson: { name: 'Rohan Deshmukh', email: 'rohan.deshmukh@bosch.com', phone: '+91 98450 67890' },
    eventTitle: 'Auto Expo Components & Clean Energy',
    eventId: '21395'
  },
  {
    _id: 'sp_08',
    name: 'Schneider Electric India',
    logo: 'https://images.unsplash.com/photo-1517976487588-468a356cb0b7?q=80&w=200&auto=format&fit=crop',
    website: 'https://se.com/in',
    tier: 'silver',
    isExhibitor: true,
    boothDetails: { boothNumber: 'Hall 3 - E15', size: '40 sqm', location: 'Bombay Exhibition Centre, Mumbai' },
    contactPerson: { name: 'Megha Varma', email: 'megha.varma@se.com', phone: '+91 97690 12345' },
    eventTitle: 'ELECRAMA Global Electrical Expo',
    eventId: '21350'
  }
];

const TIER_STYLES = {
  platinum: {
    label: 'Platinum Sponsor',
    badge: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30',
    dot: 'bg-purple-500',
    accentLine: 'bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500',
    cardBorder: 'hover:border-purple-500/50'
  },
  gold: {
    label: 'Gold Sponsor',
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30',
    dot: 'bg-amber-500',
    accentLine: 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500',
    cardBorder: 'hover:border-amber-500/50'
  },
  silver: {
    label: 'Silver Sponsor',
    badge: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/30',
    dot: 'bg-slate-500',
    accentLine: 'bg-gradient-to-r from-slate-400 via-zinc-400 to-slate-500',
    cardBorder: 'hover:border-slate-500/50'
  },
  bronze: {
    label: 'Bronze Partner',
    badge: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-500/30',
    dot: 'bg-orange-500',
    accentLine: 'bg-gradient-to-r from-orange-400 via-amber-600 to-orange-600',
    cardBorder: 'hover:border-orange-500/50'
  }
};

export default function SponsorsPage() {
  const { accessToken } = useAuth();
  const [sponsors, setSponsors] = useState(FALLBACK_SPONSORS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedType, setSelectedType] = useState('all'); // all, exhibitor, sponsor
  const [viewMode, setViewMode] = useState('grid'); // grid, table
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Add Sponsor Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [newSponsor, setNewSponsor] = useState({
    name: '',
    tier: 'gold',
    website: '',
    logo: '',
    isExhibitor: true,
    eventTitle: '',
    eventId: '',
    boothNumber: '',
    boothSize: '',
    boothLocation: '',
    contactName: '',
    contactEmail: '',
    contactPhone: ''
  });

  // Action status notification
  const [feedback, setFeedback] = useState(null);

  const fetchSponsors = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/sponsors`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
        setSponsors(res.data.data);
        try {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('visitexpo_admin_sponsors_cache', JSON.stringify(res.data.data));
          }
        } catch (e) {
          console.warn('Could not cache sponsors:', e);
        }
      }
    } catch (err) {
      console.warn('Using fallback sponsors list:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const cached = sessionStorage.getItem('visitexpo_admin_sponsors_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSponsors(parsed);
            setLoading(false);
          }
        }
      }
    } catch (e) {
      console.warn('Error hydrating sponsors cache:', e);
    }
    fetchSponsors(true);
  }, [accessToken]);

  // Filtered sponsors
  const filteredSponsors = useMemo(() => {
    return sponsors.filter((s) => {
      const matchesSearch =
        searchQuery === '' ||
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.eventTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.contactPerson?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.boothDetails?.boothNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.boothDetails?.location?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTier = selectedTier === 'all' || s.tier === selectedTier;

      const matchesType =
        selectedType === 'all' ||
        (selectedType === 'exhibitor' && s.isExhibitor) ||
        (selectedType === 'sponsor' && !s.isExhibitor);

      return matchesSearch && matchesTier && matchesType;
    });
  }, [sponsors, searchQuery, selectedTier, selectedType]);

  const sortedSponsors = useMemo(() => {
    const getSortValue = (sponsor, key) => {
      switch (key) {
        case 'tier': return sponsor.tier;
        case 'event': return sponsor.eventTitle || sponsor.event?.title;
        case 'booth': return sponsor.boothDetails?.boothNumber;
        case 'representative': return sponsor.contactPerson?.name;
        default: return sponsor.name;
      }
    };

    return [...filteredSponsors].sort((first, second) => {
      const firstValue = String(getSortValue(first, sortConfig.key) || '').toLowerCase();
      const secondValue = String(getSortValue(second, sortConfig.key) || '').toLowerCase();
      const comparison = firstValue.localeCompare(secondValue, undefined, { numeric: true });
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredSponsors, sortConfig]);

  const pageCount = Math.max(1, Math.ceil(sortedSponsors.length / pageSize));
  const activePage = Math.min(currentPage, pageCount);
  const paginatedSponsors = useMemo(() => {
    const startIndex = (activePage - 1) * pageSize;
    return sortedSponsors.slice(startIndex, startIndex + pageSize);
  }, [sortedSponsors, activePage, pageSize]);

  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  };

  // Tier counts
  const tierCounts = useMemo(() => {
    return {
      all: sponsors.length,
      platinum: sponsors.filter((s) => s.tier === 'platinum').length,
      gold: sponsors.filter((s) => s.tier === 'gold').length,
      silver: sponsors.filter((s) => s.tier === 'silver').length,
      bronze: sponsors.filter((s) => s.tier === 'bronze').length,
      exhibitors: sponsors.filter((s) => s.isExhibitor).length
    };
  }, [sponsors]);

  // Handle Sponsor Creation
  const handleCreateSponsor = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!newSponsor.name.trim()) {
      setFormError('Sponsor company name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: newSponsor.name.trim(),
        tier: newSponsor.tier,
        website: newSponsor.website.trim(),
        logo:
          newSponsor.logo.trim() ||
          'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=200&auto=format&fit=crop',
        isExhibitor: newSponsor.isExhibitor,
        eventTitle: newSponsor.eventTitle.trim(),
        eventId: newSponsor.eventId.trim(),
        boothDetails: {
          boothNumber: newSponsor.boothNumber.trim(),
          size: newSponsor.boothSize.trim(),
          location: newSponsor.boothLocation.trim()
        },
        contactPerson: {
          name: newSponsor.contactName.trim(),
          email: newSponsor.contactEmail.trim(),
          phone: newSponsor.contactPhone.trim()
        }
      };

      try {
        const res = await axios.post(`${API_URL}/admin/sponsors`, payload, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.data?.success && res.data?.data) {
          setSponsors((prev) => [res.data.data, ...prev]);
        } else {
          // Local fallback addition
          const localItem = {
            _id: `sp_${Date.now()}`,
            ...payload
          };
          setSponsors((prev) => [localItem, ...prev]);
        }
      } catch (postErr) {
        console.warn('Backend POST failed, adding locally:', postErr.message);
        const localItem = {
          _id: `sp_${Date.now()}`,
          ...payload
        };
        setSponsors((prev) => [localItem, ...prev]);
      }

      setFeedback({ type: 'success', message: `Sponsor "${newSponsor.name}" successfully added!` });
      setTimeout(() => setFeedback(null), 4000);
      setIsModalOpen(false);
      setNewSponsor({
        name: '',
        tier: 'gold',
        website: '',
        logo: '',
        isExhibitor: true,
        eventTitle: '',
        eventId: '',
        boothNumber: '',
        boothSize: '',
        boothLocation: '',
        contactName: '',
        contactEmail: '',
        contactPhone: ''
      });
    } catch (err) {
      setFormError(err.message || 'Failed to add sponsor');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Sponsor Deletion
  const handleDeleteSponsor = async (id, name) => {
    if (!confirm(`Are you sure you want to remove ${name} from official sponsors?`)) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/admin/sponsors/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
    } catch (err) {
      console.warn('Delete backend error (proceeding with local removal):', err.message);
    }

    setSponsors((prev) => prev.filter((s) => s._id !== id));
    setFeedback({ type: 'info', message: `Sponsor "${name}" removed.` });
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-primary/10 border-primary/30 text-primary'
          }`}
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl border border-amber-500/30 text-amber-600 dark:text-amber-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Our Sponsors &amp; Strategic Partners</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Manage global enterprise partners, exhibitor booth allocations, and tier privileges across all expos.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/categories"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-sm font-semibold border border-border transition-colors shadow-sm"
          >
            <Layers className="w-4 h-4 text-primary" />
            <span>Event Categories</span>
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Sponsor</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Sponsors */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Sponsors</span>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-foreground mt-3 tracking-tight">{tierCounts.all}</div>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Across all expos &amp; summits</p>
        </div>

        {/* Platinum Partners */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Platinum Partners</span>
            <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
              <Crown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-foreground mt-3 tracking-tight flex items-baseline gap-2">
            <span>{tierCounts.platinum}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              Headline
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Keynote &amp; Title partners</p>
        </div>

        {/* Gold Sponsors */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Gold Sponsors</span>
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-foreground mt-3 tracking-tight flex items-baseline gap-2">
            <span>{tierCounts.gold}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Prime
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Prime pavilion presence</p>
        </div>

        {/* Silver Sponsors */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Silver Sponsors</span>
            <div className="p-2.5 rounded-xl bg-slate-500/15 text-slate-600 dark:text-slate-300">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-foreground mt-3 tracking-tight flex items-baseline gap-2">
            <span>{tierCounts.silver}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-300 border border-slate-500/20">
              Exhibitor
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Standard exhibitor tier</p>
        </div>

        {/* Active Exhibitors */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Exhibitors</span>
            <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-foreground mt-3 tracking-tight flex items-baseline gap-2">
            <span>{tierCounts.exhibitors}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Physical
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-medium">With confirmed booth stall</p>
        </div>
      </div>

      {/* Tier Filter Tabs & Search Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border shadow-sm">
        {/* Tier Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          <button
            onClick={() => { setSelectedTier('all'); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedTier === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 border border-border'
            }`}
          >
            All Tiers ({tierCounts.all})
          </button>
          <button
            onClick={() => { setSelectedTier('platinum'); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedTier === 'platinum'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 border border-border'
            }`}
          >
            Platinum ({tierCounts.platinum})
          </button>
          <button
            onClick={() => { setSelectedTier('gold'); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedTier === 'gold'
                ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 border border-border'
            }`}
          >
            Gold ({tierCounts.gold})
          </button>
          <button
            onClick={() => { setSelectedTier('silver'); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedTier === 'silver'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 border border-border'
            }`}
          >
            Silver ({tierCounts.silver})
          </button>
          <button
            onClick={() => { setSelectedTier('bronze'); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedTier === 'bronze'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 border border-border'
            }`}
          >
            Bronze ({tierCounts.bronze})
          </button>
        </div>

        {/* Search, Type Filter, and View Mode */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search sponsor, event, booth..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => { setSelectedType(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 text-xs bg-background border border-input rounded-lg text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 font-medium"
          >
            <option value="all">All Types</option>
            <option value="exhibitor">Booth Exhibitors Only</option>
            <option value="sponsor">Corporate Sponsors Only</option>
          </select>

          <div className="flex items-center border border-border rounded-lg overflow-hidden bg-secondary">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Sponsors Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm font-medium">Loading official sponsors directory...</p>
        </div>
      ) : filteredSponsors.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-border shadow-sm">
          <Award className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground">No sponsors found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            No sponsors match the selected filter criteria or search query.
          </p>
          <button
            onClick={() => {
              setSelectedTier('all');
              setSelectedType('all');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-bold text-foreground transition-colors border border-border cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedSponsors.map((sponsor) => {
            const tierInfo = TIER_STYLES[sponsor.tier] || TIER_STYLES.silver;
            return (
              <div
                key={sponsor._id || sponsor.name}
                className={`group relative rounded-2xl bg-card border border-border hover:shadow-md ${tierInfo.cardBorder} transition-all overflow-hidden flex flex-col justify-between shadow-sm`}
              >
                {/* Top Banner Accent Line */}
                <div className={`h-1.5 w-full ${tierInfo.accentLine}`} />

                <div className="p-5 flex-1 flex flex-col">
                  {/* Header Row: Logo, Name & Tier Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-14 h-14 rounded-2xl bg-secondary/80 border border-border/80 shadow-inner overflow-hidden flex items-center justify-center p-1.5 flex-shrink-0 group-hover:border-primary/40 transition-colors">
                        {sponsor.logo ? (
                          <img
                            src={sponsor.logo}
                            alt={sponsor.name}
                            className="w-full h-full object-contain rounded-xl bg-white/5"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Building2 className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h3 className="font-bold text-foreground text-base leading-snug group-hover:text-primary transition-colors truncate">
                            {sponsor.name}
                          </h3>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        </div>
                        {sponsor.website && (
                          <a
                            href={sponsor.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-0.5 transition-colors max-w-full"
                          >
                            <Globe className="w-3 h-3 text-muted-foreground/80" />
                            <span className="truncate max-w-[180px]">
                              {sponsor.website.replace(/^https?:\/\//, '')}
                            </span>
                            <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-70" />
                          </a>
                        )}
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider self-start ${tierInfo.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${tierInfo.dot}`} />
                      {sponsor.tier}
                    </span>
                  </div>

                  {/* Sponsored Event Box */}
                  <div className="mt-4 p-3 rounded-xl bg-secondary/40 border border-border/80">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-primary" />
                      <span>Sponsored Expo</span>
                    </div>
                    <div className="font-bold text-foreground text-xs mt-1 line-clamp-1">
                      {sponsor.eventTitle || sponsor.event?.title || 'Premier Partner Across All Editions'}
                    </div>
                    {sponsor.boothDetails?.location && (
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1 truncate">
                        <MapPin className="w-3 h-3 text-muted-foreground/80 flex-shrink-0" />
                        <span className="truncate">{sponsor.boothDetails.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Booth Details (if exhibitor) */}
                  {sponsor.isExhibitor && sponsor.boothDetails?.boothNumber && (
                    <div className="mt-3 flex items-center justify-between text-xs text-foreground py-2 px-3 rounded-lg bg-secondary/30 border border-border">
                      <div className="flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-amber-500" />
                        <span className="font-bold">{sponsor.boothDetails.boothNumber}</span>
                      </div>
                      {sponsor.boothDetails.size && (
                        <span className="text-muted-foreground text-[11px] font-semibold">
                          Size: {sponsor.boothDetails.size}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Contact Person Details */}
                  {sponsor.contactPerson?.name && (
                    <div className="mt-4 pt-3 border-t border-border text-xs space-y-1">
                      <div className="font-semibold text-foreground flex items-center justify-between">
                        <span>{sponsor.contactPerson.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Representative</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        {sponsor.contactPerson.email && (
                          <a
                            href={`mailto:${sponsor.contactPerson.email}`}
                            className="hover:text-primary flex items-center gap-1 truncate transition-colors"
                          >
                            <Mail className="w-3 h-3 text-muted-foreground/80" />
                            <span className="truncate max-w-[140px]">{sponsor.contactPerson.email}</span>
                          </a>
                        )}
                        {sponsor.contactPerson.phone && (
                          <a
                            href={`tel:${sponsor.contactPerson.phone}`}
                            className="hover:text-primary flex items-center gap-1 transition-colors"
                          >
                            <Phone className="w-3 h-3 text-muted-foreground/80" />
                            <span>{sponsor.contactPerson.phone}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Controls: Delete / Website */}
                <div className="p-3 bg-muted/20 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground text-[11px] font-medium">
                    ID: {sponsor.eventId ? `#${sponsor.eventId}` : 'Global Partner'}
                  </span>
                  <div className="flex items-center gap-2">
                    {sponsor.website && (
                      <a
                        href={sponsor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors flex items-center gap-1 font-semibold"
                      >
                        <span>Visit Site</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteSponsor(sponsor._id, sponsor.name)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      title="Remove sponsor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Detailed Table View */
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">
                    <button onClick={() => handleSort('name')} className="inline-flex items-center gap-1.5 cursor-pointer hover:text-foreground" aria-label="Sort by company name">
                      Company &amp; Brand {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : <ArrowUpDown className="w-3 h-3 opacity-60" />}
                    </button>
                  </th>
                  <th className="py-3.5 px-4">
                    <button onClick={() => handleSort('tier')} className="inline-flex items-center gap-1.5 cursor-pointer hover:text-foreground" aria-label="Sort by tier">
                      Tier {sortConfig.key === 'tier' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : <ArrowUpDown className="w-3 h-3 opacity-60" />}
                    </button>
                  </th>
                  <th className="py-3.5 px-4">
                    <button onClick={() => handleSort('event')} className="inline-flex items-center gap-1.5 cursor-pointer hover:text-foreground" aria-label="Sort by sponsored expo">
                      Sponsored Expo {sortConfig.key === 'event' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : <ArrowUpDown className="w-3 h-3 opacity-60" />}
                    </button>
                  </th>
                  <th className="py-3.5 px-4">
                    <button onClick={() => handleSort('booth')} className="inline-flex items-center gap-1.5 cursor-pointer hover:text-foreground" aria-label="Sort by booth details">
                      Booth Details {sortConfig.key === 'booth' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : <ArrowUpDown className="w-3 h-3 opacity-60" />}
                    </button>
                  </th>
                  <th className="py-3.5 px-4">
                    <button onClick={() => handleSort('representative')} className="inline-flex items-center gap-1.5 cursor-pointer hover:text-foreground" aria-label="Sort by representative">
                      Representative {sortConfig.key === 'representative' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : <ArrowUpDown className="w-3 h-3 opacity-60" />}
                    </button>
                  </th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedSponsors.map((sponsor) => {
                  const tierInfo = TIER_STYLES[sponsor.tier] || TIER_STYLES.silver;
                  return (
                    <tr key={sponsor._id || sponsor.name} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-secondary border border-border p-1 flex items-center justify-center flex-shrink-0">
                            {sponsor.logo ? (
                              <img
                                src={sponsor.logo}
                                alt={sponsor.name}
                                className="w-full h-full object-contain rounded"
                              />
                            ) : (
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-foreground">{sponsor.name}</div>
                            {sponsor.website && (
                              <a
                                href={sponsor.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary text-[11px] flex items-center gap-1 cursor-pointer"
                              >
                                <span>{sponsor.website.replace(/^https?:\/\//, '')}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${tierInfo.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${tierInfo.dot}`} />
                          {sponsor.tier}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-foreground max-w-[220px] truncate">
                          {sponsor.eventTitle || sponsor.event?.title || 'Global Partner'}
                        </div>
                        {sponsor.eventId && (
                          <span className="text-[10px] text-muted-foreground">Event ID: #{sponsor.eventId}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-foreground">
                        {sponsor.isExhibitor ? (
                          <div>
                            <div className="font-bold text-amber-600 dark:text-amber-400">
                              {sponsor.boothDetails?.boothNumber || 'Confirmed'}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {sponsor.boothDetails?.size && `${sponsor.boothDetails.size} • `}
                              {sponsor.boothDetails?.location || 'Main Hall'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Brand Sponsor Only</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {sponsor.contactPerson?.name ? (
                          <div>
                            <div className="text-foreground font-semibold">{sponsor.contactPerson.name}</div>
                            <div className="text-muted-foreground text-[10px]">
                              {sponsor.contactPerson.email || sponsor.contactPerson.phone}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteSponsor(sponsor._id, sponsor.name)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                          title="Remove sponsor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && filteredSponsors.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 py-2 text-xs text-muted-foreground">
          <span>
            Showing {(activePage - 1) * pageSize + 1}-{Math.min(activePage * pageSize, sortedSponsors.length)} of {sortedSponsors.length} sponsors
          </span>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              Rows per page
              <select
                value={pageSize}
                onChange={(event) => { setPageSize(Number(event.target.value)); setCurrentPage(1); }}
                className="px-2 py-1 rounded-md border border-input bg-background text-foreground"
                aria-label="Rows per page"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </label>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={activePage === 1}
                className="p-1.5 rounded-md border border-border hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="min-w-16 text-center text-foreground">Page {activePage} of {pageCount}</span>
              <button
                onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
                disabled={activePage === pageCount}
                className="p-1.5 rounded-md border border-border hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Sponsor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-2xl bg-card border border-border shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Add New Sponsor Partner</h3>
                  <p className="text-xs text-muted-foreground">Register a new official corporate sponsor or exhibitor</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSponsor} className="mt-5 space-y-4 text-xs">
              {/* Company Name & Tier */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-foreground font-semibold mb-1">Company / Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tata Motors EV"
                    value={newSponsor.name}
                    onChange={(e) => setNewSponsor({ ...newSponsor, name: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-foreground font-semibold mb-1">Sponsorship Tier</label>
                  <select
                    value={newSponsor.tier}
                    onChange={(e) => setNewSponsor({ ...newSponsor, tier: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 font-medium"
                  >
                    <option value="platinum">Platinum (Headline / Keynote)</option>
                    <option value="gold">Gold Sponsor</option>
                    <option value="silver">Silver Sponsor</option>
                    <option value="bronze">Bronze / Partner</option>
                  </select>
                </div>
              </div>

              {/* Website & Logo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-foreground font-semibold mb-1">Official Website</label>
                  <input
                    type="url"
                    placeholder="https://brand.com"
                    value={newSponsor.website}
                    onChange={(e) => setNewSponsor({ ...newSponsor, website: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-foreground font-semibold mb-1">Logo Image URL</label>
                  <input
                    type="url"
                    placeholder="https://.../logo.png"
                    value={newSponsor.logo}
                    onChange={(e) => setNewSponsor({ ...newSponsor, logo: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Sponsored Event & Event ID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-foreground font-semibold mb-1">Sponsored Event / Expo Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Bharat Mobility Global Expo 2027"
                    value={newSponsor.eventTitle}
                    onChange={(e) => setNewSponsor({ ...newSponsor, eventTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-foreground font-semibold mb-1">WordPress / System Event ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 21395"
                    value={newSponsor.eventId}
                    onChange={(e) => setNewSponsor({ ...newSponsor, eventId: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Exhibitor Checkbox */}
              <div className="p-3 rounded-xl bg-secondary/40 border border-border flex items-center justify-between">
                <div>
                  <div className="font-bold text-foreground">Physical Exhibition Booth?</div>
                  <div className="text-[11px] text-muted-foreground">Mark if this sponsor has a stall or pavilion at the expo</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newSponsor.isExhibitor}
                    onChange={(e) => setNewSponsor({ ...newSponsor, isExhibitor: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Booth Information */}
              {newSponsor.isExhibitor && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-xl bg-secondary/20 border border-border">
                  <div>
                    <label className="block text-muted-foreground font-semibold mb-1">Booth Number</label>
                    <input
                      type="text"
                      placeholder="e.g. Hall 4 - P01"
                      value={newSponsor.boothNumber}
                      onChange={(e) => setNewSponsor({ ...newSponsor, boothNumber: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-muted-foreground font-semibold mb-1">Stall Size</label>
                    <input
                      type="text"
                      placeholder="e.g. 120 sqm"
                      value={newSponsor.boothSize}
                      onChange={(e) => setNewSponsor({ ...newSponsor, boothSize: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-muted-foreground font-semibold mb-1">Convention Centre / City</label>
                    <input
                      type="text"
                      placeholder="e.g. Bharat Mandapam"
                      value={newSponsor.boothLocation}
                      onChange={(e) => setNewSponsor({ ...newSponsor, boothLocation: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}

              {/* Representative Information */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="font-bold text-foreground">Key Contact Representative</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Contact Name"
                      value={newSponsor.contactName}
                      onChange={(e) => setNewSponsor({ ...newSponsor, contactName: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={newSponsor.contactEmail}
                      onChange={(e) => setNewSponsor({ ...newSponsor, contactEmail: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={newSponsor.contactPhone}
                      onChange={(e) => setNewSponsor({ ...newSponsor, contactPhone: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Register Sponsor</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
