'use client';

/**
 * @file categories/page.js
 * @description Super Admin Event Categories Directory & Events Breakdown.
 * Shows all 11+ industry categories, comprehensive sector details, sub-sectors,
 * top hubs, and the complete list of events belonging to each category.
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  Layers,
  Search,
  Calendar,
  MapPin,
  ExternalLink,
  Building2,
  Filter,
  ArrowRight,
  TrendingUp,
  Cpu,
  Activity,
  Car,
  HardHat,
  Compass,
  Sprout,
  Shirt,
  Plane,
  Truck,
  Palette,
  Briefcase,
  Loader2,
  CheckCircle2,
  Globe,
  SlidersHorizontal,
  ChevronRight,
  Grid,
  List,
  Users,
  Store,
  Tag,
  Info,
  X,
  Trash2,
  AlertTriangle
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Icon mapping for categories
const ICON_MAP = {
  'Technology & AI': Cpu,
  'Healthcare & Pharma': Activity,
  'Automotive & EV': Car,
  'Construction & Infra': HardHat,
  'Travel & Tourism': Compass,
  'Agri & Food Tech': Sprout,
  'Textile & Fashion': Shirt,
  'Aerospace & Aviation': Plane,
  'Logistics & Cargo': Truck,
  'Art & Lifestyle': Palette,
  'Trade & Industry': Briefcase
};

const COLOR_MAP = {
  'Technology & AI': { color: '#3b82f6', bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30', accent: 'bg-blue-500' },
  'Healthcare & Pharma': { color: '#ef4444', bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/30', accent: 'bg-red-500' },
  'Automotive & EV': { color: '#f97316', bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/30', accent: 'bg-orange-500' },
  'Construction & Infra': { color: '#eab308', bg: 'bg-yellow-500/10', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-500/30', accent: 'bg-yellow-500' },
  'Travel & Tourism': { color: '#06b6d4', bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/30', accent: 'bg-cyan-500' },
  'Agri & Food Tech': { color: '#22c55e', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', accent: 'bg-emerald-500' },
  'Textile & Fashion': { color: '#ec4899', bg: 'bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-500/30', accent: 'bg-pink-500' },
  'Aerospace & Aviation': { color: '#6366f1', bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/30', accent: 'bg-indigo-500' },
  'Logistics & Cargo': { color: '#8b5cf6', bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30', accent: 'bg-purple-500' },
  'Art & Lifestyle': { color: '#d946ef', bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-600 dark:text-fuchsia-400', border: 'border-fuchsia-500/30', accent: 'bg-fuchsia-500' },
  'Trade & Industry': { color: '#64748b', bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-300', border: 'border-slate-500/30', accent: 'bg-slate-500' }
};

// Default static fallback metadata for all 11 categories
const DEFAULT_CATEGORIES = [
  {
    name: 'Technology & AI',
    slug: 'technology-ai',
    count: 301,
    sharePercent: 15.7,
    scope: 'Artificial intelligence, enterprise SaaS, cloud infrastructure, IoT, cybersecurity, semiconductors, and telecommunications.',
    subSectors: ['Generative AI & LLMs', 'Enterprise SaaS', 'Cybersecurity', 'Cloud & Edge Computing', 'Robotics & Automation', 'IoT & Smart Cities', 'Semiconductors'],
    topHubs: ['New Delhi', 'Bengaluru', 'Hyderabad', 'Mumbai'],
    avgFootfall: '30,000+ delegates',
    notableExpos: ['Global AI & Tech Convention', 'Convergence India', 'Smart Cities India', 'India Mobile Congress'],
    events: []
  },
  {
    name: 'Healthcare & Pharma',
    slug: 'healthcare-pharma',
    count: 117,
    sharePercent: 6.1,
    scope: 'Medical devices, pharmaceuticals, hospital infrastructure, biotechnology research, diagnostic equipment, and surgical technologies.',
    subSectors: ['Pharmaceutical APIs', 'Medical Devices', 'Hospital Infra & ICU', 'Biotech & Genomics', 'Ayurveda & Herbal', 'Diagnostic Imaging'],
    topHubs: ['Greater Noida', 'Mumbai', 'Hyderabad', 'Bengaluru'],
    avgFootfall: '22,000+ delegates',
    notableExpos: ['India MedTech Expo', 'CPhI & P-MEC India', 'Medical Fair India', 'Medicall Expo'],
    events: []
  },
  {
    name: 'Automotive & EV',
    slug: 'automotive-ev',
    count: 103,
    sharePercent: 5.4,
    scope: 'Electric mobility, auto components, commercial fleets, battery technology, charging infrastructure, and international motor shows.',
    subSectors: ['EV Mobility & 2W/4W', 'Lithium Battery Tech', 'Charging Infra', 'Auto Components', 'Commercial Fleets', 'Tyres & Rubber'],
    topHubs: ['New Delhi', 'Greater Noida', 'Bengaluru', 'Chennai', 'Pune'],
    avgFootfall: '85,000+ visitors',
    notableExpos: ['Bharat Mobility Global Expo', 'Auto Expo Components', 'EV India Expo', 'Busworld India'],
    events: []
  },
  {
    name: 'Construction & Infra',
    slug: 'construction-infra',
    count: 133,
    sharePercent: 6.9,
    scope: 'Heavy infrastructure machinery, smart urban planning, cement, concrete, architectural materials, and civil engineering.',
    subSectors: ['Earthmoving Machinery', 'Precast Concrete & Cement', 'Architectural Hardware', 'Urban Infrastructure', 'HVAC Automation', 'Piping Tech'],
    topHubs: ['Greater Noida', 'Mumbai', 'Bengaluru', 'Ahmedabad'],
    avgFootfall: '40,000+ buyers',
    notableExpos: ['BAUMA CONEXPO INDIA', 'ACETECH Architecture', 'Constro International', 'FOAID Design Expo'],
    events: []
  },
  {
    name: 'Travel & Tourism',
    slug: 'travel-tourism',
    count: 109,
    sharePercent: 5.7,
    scope: 'Destination promotion, luxury hospitality chains, airline networks, travel trade marts, MICE summits, and tourism boards.',
    subSectors: ['Tour Operators & DMCs', 'Luxury Hotels & Resorts', 'Airlines & Aviation', 'MICE & Corporate Travel', 'Adventure Tourism', 'Travel Tech'],
    topHubs: ['New Delhi', 'Greater Noida', 'Mumbai', 'Kochi', 'Goa'],
    avgFootfall: '35,000+ delegates',
    notableExpos: ['SATTE South Asia Travel Expo', 'OTM Mumbai', 'BLTM Business Travel Mart', 'TTF Fair'],
    events: []
  },
  {
    name: 'Agri & Food Tech',
    slug: 'agri-food-tech',
    count: 66,
    sharePercent: 3.4,
    scope: 'Precision agriculture, farm mechanization, food processing equipment, grain & dairy tech, and international culinary expos.',
    subSectors: ['Farm Tractors & Machinery', 'Precision Irrigation', 'Food Processing & Packing', 'Dairy & Poultry Tech', 'Grain & Rice Milling', 'Bakery Foodservice'],
    topHubs: ['New Delhi', 'Pune', 'Bengaluru', 'Coimbatore', 'Chandigarh'],
    avgFootfall: '50,000+ farmers & trade',
    notableExpos: ['AAHAR International Food Fair', 'KISAN Agri Show', 'FoodPro Expo', 'DairyTech India'],
    events: []
  },
  {
    name: 'Textile & Fashion',
    slug: 'textile-fashion',
    count: 74,
    sharePercent: 3.8,
    scope: 'Garment manufacturing machinery, luxury fabrics, yarns, technical textiles, synthetic fibers, and apparel sourcing shows.',
    subSectors: ['Garment Machinery', 'Synthetic & Cotton Yarns', 'Digital Fabric Printing', 'Technical Textiles', 'Apparel Sourcing', 'Dyes & Chemicals'],
    topHubs: ['Surat', 'New Delhi', 'Coimbatore', 'Tirupur', 'Mumbai'],
    avgFootfall: '45,000+ trade buyers',
    notableExpos: ['Bharat Tex Global Mega Show', 'Gartex Texprocess', 'SITEX Surat', 'Yarnex Fair'],
    events: []
  },
  {
    name: 'Aerospace & Aviation',
    slug: 'aerospace-aviation',
    count: 27,
    sharePercent: 1.4,
    scope: 'Commercial aviation, defense aerospace, unmanned aerial systems (UAVs / drones), avionics, rotorcraft, and air shows.',
    subSectors: ['Commercial Aircraft', 'Defense Avionics', 'Commercial Drones & UAVs', 'Helicopter Aviation', 'MRO Services', 'Space & Satellite Tech'],
    topHubs: ['Bengaluru', 'Hyderabad', 'New Delhi'],
    avgFootfall: '60,000+ attendees',
    notableExpos: ['Aero India Air Show', 'Wings India Summit', 'Bharat Drone Mahotsav'],
    events: []
  },
  {
    name: 'Logistics & Cargo',
    slug: 'logistics-cargo',
    count: 39,
    sharePercent: 2.0,
    scope: 'Supply chain management, maritime freight, warehousing robotics, cold-chain logistics, and multimodal express transport.',
    subSectors: ['Warehouse Robotics', 'Freight & Multimodal', 'Cold-chain Reefer Systems', 'Maritime Ports', 'Material Handling', 'Fleet Management'],
    topHubs: ['Mumbai', 'New Delhi', 'Chennai', 'Ahmedabad'],
    avgFootfall: '20,000+ logistics buyers',
    notableExpos: ['India Warehousing Show', 'LogiMAT India', 'Cargo Show International', 'Cold Chain Expo'],
    events: []
  },
  {
    name: 'Art & Lifestyle',
    slug: 'art-lifestyle',
    count: 50,
    sharePercent: 2.6,
    scope: 'Contemporary art fairs, precious jewelry & gems, interior decor styling, luxury watches, and high-end lifestyle showcases.',
    subSectors: ['Contemporary Fine Art', 'Gold & Diamond Jewelry', 'Precious Gemstones', 'Luxury Home Decor', 'Photography Gear', 'Artisanal Handicrafts'],
    topHubs: ['New Delhi', 'Mumbai', 'Jaipur'],
    avgFootfall: '40,000+ art lovers & buyers',
    notableExpos: ['India Art Fair', 'IIJS Jewellery Show', 'Jaipur Jewellery Show', 'Design Mumbai'],
    events: []
  },
  {
    name: 'Trade & Industry',
    slug: 'trade-industry',
    count: 904,
    sharePercent: 47.0,
    scope: 'Cross-industry B2B commercial expos, multi-sector trade fairs, manufacturing conventions, hardware tools, and export councils.',
    subSectors: ['Industrial Engineering', 'Electrical & Power Tech', 'Plastics & Polymers', 'Packaging & Printing', 'Export Councils', 'MSME Multi-Sector'],
    topHubs: ['New Delhi', 'Mumbai', 'Bengaluru', 'Kolkata'],
    avgFootfall: '150,000+ business delegates',
    notableExpos: ['India International Trade Fair (IITF)', 'ELECRAMA Expo', 'PLASTINDIA', 'IMTEX Machine Tool Expo'],
    events: []
  }
];

export default function EventCategoriesPage() {
  const { accessToken } = useAuth();
  const [categoriesData, setCategoriesData] = useState({
    totalCategories: 11,
    totalEvents: 2010,
    categories: DEFAULT_CATEGORIES
  });
  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Deletion States
  const [eventToDelete, setEventToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    setDeleting(true);
    setFeedbackMsg(null);

    const targetId = eventToDelete.id || eventToDelete.slug || eventToDelete.wpPostId;

    try {
      let deleted = false;
      // 1. Try direct to Express backend with auth token
      if (accessToken) {
        try {
          const res = await axios.delete(`${API_URL}/admin/events/${encodeURIComponent(targetId)}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            data: {
              slug: eventToDelete.slug,
              title: eventToDelete.title,
              wpPostId: eventToDelete.wpPostId
            }
          });
          if (res.data?.success) deleted = true;
        } catch (e) {
          console.warn('Express direct delete event error, falling back to Next.js API proxy:', e.message);
        }
      }

      // 2. Fallback to Next.js API proxy
      if (!deleted) {
        const proxyRes = await axios.delete(`/api/events/${encodeURIComponent(targetId)}`, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
          data: {
            slug: eventToDelete.slug,
            title: eventToDelete.title,
            wpPostId: eventToDelete.wpPostId
          }
        });
        if (proxyRes.data?.success) deleted = true;
      }

      // Update local state immediately
      setCategoriesData((prev) => {
        if (!prev?.categories) return prev;
        const updatedCats = prev.categories.map((c) => {
          const remainingEvents = (c.events || []).filter(
            (e) =>
              e.id !== eventToDelete.id &&
              e.slug !== eventToDelete.slug &&
              (!eventToDelete.wpPostId || e.wpPostId !== eventToDelete.wpPostId)
          );
          return {
            ...c,
            count: remainingEvents.length,
            events: remainingEvents
          };
        });
        const total = updatedCats.reduce((sum, c) => sum + c.count, 0);
        return {
          ...prev,
          totalEvents: total,
          categories: updatedCats
        };
      });

      setFeedbackMsg({
        type: 'success',
        text: `Event "${eventToDelete.title}" was permanently deleted.`
      });
      setEventToDelete(null);
    } catch (err) {
      console.error('Delete event error:', err);
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Failed to delete event.'
      });
    } finally {
      setDeleting(false);
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      // 1. Direct fetch from Express backend organizers-directory if authenticated
      if (accessToken) {
        try {
          const expRes = await axios.get(`${API_URL}/admin/organizers-directory?refresh=true`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          if (expRes.data?.success && Array.isArray(expRes.data?.data?.organizers)) {
            const orgs = expRes.data.data.organizers;
            const allEvents = [];
            orgs.forEach((o) => {
              (o.events || []).forEach((e) => allEvents.push(e));
            });

            // Group by category
            const grouped = {};
            DEFAULT_CATEGORIES.forEach((cat) => {
              grouped[cat.name] = { ...cat, count: 0, events: [] };
            });
            allEvents.forEach((e) => {
              const catName = e.category && grouped[e.category] ? e.category : 'Trade & Industry';
              grouped[catName].events.push(e);
              grouped[catName].count++;
            });

            const cats = Object.values(grouped).map((c) => ({
              ...c,
              sharePercent: allEvents.length > 0 ? Number(((c.count / allEvents.length) * 100).toFixed(1)) : 0
            }));

            setCategoriesData({
              totalCategories: cats.length,
              totalEvents: allEvents.length,
              categories: cats
            });
            setLoading(false);
            return;
          }
        } catch (expErr) {
          console.warn('[CategoriesPage] Express direct fetch warning:', expErr.message);
        }
      }

      // 2. Fallback to Next.js API route on port 3001
      const res = await axios.get(`/api/categories?t=${Date.now()}&refresh=true`);
      if (res.data?.success && res.data?.data) {
        setCategoriesData(res.data.data);
      }
    } catch (err) {
      console.warn('Categories API fetch note:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [accessToken]);

  // Aggregate all events across categories
  const allEvents = useMemo(() => {
    if (!categoriesData?.categories) return [];
    return categoriesData.categories.flatMap((cat) =>
      (cat.events || []).map((e) => ({
        ...e,
        category: e.category || cat.name
      }))
    );
  }, [categoriesData]);

  // Distinct cities
  const availableCities = useMemo(() => {
    const set = new Set();
    allEvents.forEach((e) => {
      if (e.city && e.city !== 'India') set.add(e.city);
    });
    return Array.from(set).sort();
  }, [allEvents]);

  // Active category object
  const activeCategoryObj = useMemo(() => {
    if (selectedCategory === 'All') return null;
    return categoriesData?.categories?.find((c) => c.name === selectedCategory) || null;
  }, [categoriesData, selectedCategory]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    let list = [...allEvents];

    // Category filter
    if (selectedCategory !== 'All') {
      list = list.filter((e) => e.category === selectedCategory);
    }

    // City filter
    if (selectedCity !== 'all') {
      list = list.filter((e) => (e.city || '').toLowerCase() === selectedCity.toLowerCase());
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          (e.title && e.title.toLowerCase().includes(q)) ||
          (e.venue && e.venue.toLowerCase().includes(q)) ||
          (e.city && e.city.toLowerCase().includes(q)) ||
          (e.organizer && e.organizer.toLowerCase().includes(q))
      );
    }

    return list;
  }, [allEvents, selectedCategory, selectedCity, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / ITEMS_PER_PAGE));
  const paginatedEvents = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredEvents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEvents, page]);

  const handleCategorySelect = (categoryName) => {
    setSelectedCategory(categoryName);
    setPage(1);
    // Smooth scroll to the events list
    const el = document.getElementById('category-events-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSearchQuery('');
    setSelectedCity('all');
    setPage(1);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-card border border-border rounded-2xl p-6 shadow-sm gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              Directory Classification
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Event Categories &amp; Exhibitions Breakdown
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Explore all {categoriesData?.totalCategories || 11} industry categories, comprehensive sector scope, sub-sectors, and the complete list of events belonging to each category.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-secondary text-xs font-bold text-foreground hover:bg-secondary/80 transition-colors shadow-sm"
          >
            <span>Admin Overview</span>
          </Link>
          <a
            href="https://visitexpo.in"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-sm transition-all"
          >
            <span>Live WordPress Site</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Total Categories</span>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-foreground mt-3 tracking-tight">
            {categoriesData?.totalCategories || 11}
          </p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Standard global industry sectors</p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Total Exhibitions</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-foreground mt-3 tracking-tight">
            {(categoriesData?.totalEvents || allEvents.length || 1923).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Verified live trade shows &amp; expos</p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Average per Category</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-foreground mt-3 tracking-tight">
            {Math.round((categoriesData?.totalEvents || 1923) / (categoriesData?.totalCategories || 11))}
          </p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Expos distributed per industry</p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Active Filter</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Filter className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground mt-3 tracking-tight truncate">
            {selectedCategory}
          </p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            {filteredEvents.length.toLocaleString()} matching exhibitions
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ALL 11 EVENT CATEGORIES DIRECTORY CARDS WITH RICH DETAILS                 */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              <span>All 11 Industry Categories &amp; Detailed Scope</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select any industry sector below to view its key sub-sectors, focus topics, top hubs, and complete event list.
            </p>
          </div>
          {selectedCategory !== 'All' && (
            <button
              onClick={() => handleCategorySelect('All')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-xs font-bold text-primary hover:bg-secondary/80 border border-border transition-colors self-start sm:self-auto"
            >
              <X className="w-3.5 h-3.5" />
              <span>Show All Sectors</span>
            </button>
          )}
        </div>

        {/* 11 Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(categoriesData?.categories || DEFAULT_CATEGORIES).map((cat) => {
            const IconComponent = ICON_MAP[cat.name] || Briefcase;
            const theme = COLOR_MAP[cat.name] || COLOR_MAP['Trade & Industry'];
            const isSelected = selectedCategory === cat.name;

            return (
              <div
                key={cat.name}
                onClick={() => handleCategorySelect(cat.name)}
                className={`group relative rounded-2xl bg-card border transition-all cursor-pointer flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20 shadow-md'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                {/* Top Accent Line */}
                <div className={`h-1.5 w-full ${theme.accent}`} />

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Header: Icon, Category Name, Event Count Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${theme.bg} ${theme.text} flex-shrink-0`}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors leading-tight">
                            {cat.name}
                          </h3>
                          <span className="text-[11px] text-muted-foreground font-semibold">
                            {cat.sharePercent || 0}% of all platform expos
                          </span>
                        </div>
                      </div>

                      <span className="text-xs font-black text-foreground px-2.5 py-1 rounded-lg bg-secondary border border-border shadow-2xs whitespace-nowrap">
                        {cat.count.toLocaleString()} Events
                      </span>
                    </div>

                    {/* Scope & Description */}
                    <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                      {cat.scope || 'Trade shows, manufacturer pavilions, and international buyer summits.'}
                    </p>

                    {/* Sub-sectors & Key Focus Topics Badges */}
                    {cat.subSectors && cat.subSectors.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-border">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                          <Tag className="w-3 h-3 text-primary" />
                          <span>Key Focus Sub-sectors</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {cat.subSectors.slice(0, 5).map((sub, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-secondary/70 text-foreground border border-border/80"
                            >
                              {sub}
                            </span>
                          ))}
                          {cat.subSectors.length > 5 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 text-muted-foreground">
                              +{cat.subSectors.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Stats: Top Hubs & Action */}
                  <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                    <div className="text-[11px] text-muted-foreground truncate max-w-[170px]">
                      <span className="font-semibold text-foreground">Hubs: </span>
                      <span>{(cat.topHubs || []).slice(0, 2).join(', ')}</span>
                    </div>

                    <button
                      type="button"
                      className={`inline-flex items-center gap-1 text-xs font-bold transition-transform group-hover:translate-x-0.5 ${
                        isSelected ? 'text-primary' : 'text-foreground group-hover:text-primary'
                      }`}
                    >
                      <span>{isSelected ? 'Viewing Events' : 'View Events'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ACTIVE CATEGORY DEEP DIVE BANNER (IF SPECIFIC CATEGORY SELECTED)          */}
      {/* ========================================================================= */}
      {activeCategoryObj && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {React.createElement(ICON_MAP[activeCategoryObj.name] || Briefcase, {
                className: `w-8 h-8 ${COLOR_MAP[activeCategoryObj.name]?.text || 'text-primary'}`
              })}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-foreground">{activeCategoryObj.name}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-primary/10 text-primary border border-primary/20">
                    {filteredEvents.length} Active Exhibitions
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-3xl leading-relaxed">
                  {activeCategoryObj.scope}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleCategorySelect('All')}
              className="px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold border border-border transition-colors self-start md:self-auto"
            >
              Clear Category Filter
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-border text-xs">
            <div className="p-3 rounded-xl bg-secondary/30 border border-border">
              <span className="font-bold text-foreground block mb-1">Key Sub-sectors</span>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                {(activeCategoryObj.subSectors || []).join(', ')}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/30 border border-border">
              <span className="font-bold text-foreground block mb-1">Prime Trade Hubs</span>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                {(activeCategoryObj.topHubs || []).join(', ')}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/30 border border-border">
              <span className="font-bold text-foreground block mb-1">Notable Headline Expos</span>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                {(activeCategoryObj.notableExpos || []).join(' • ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="font-bold hover:opacity-80 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DETAILED EVENTS FEED FOR CATEGORIES (EACH CATEGORY HAVE WHICH ALL EVENTS) */}
      {/* ========================================================================= */}
      <div id="category-events-section" className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Filter Controls Header */}
        <div className="p-6 border-b border-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Events Directory Breakdown
                </span>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {filteredEvents.length.toLocaleString()} Exhibitions
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground mt-0.5">
                {selectedCategory === 'All' ? 'All Verified Industry Exhibitions' : `${selectedCategory} Events & Trade Shows`}
              </h3>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-border rounded-xl overflow-hidden bg-secondary p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    viewMode === 'table'
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Table View"
                >
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Table</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    viewMode === 'grid'
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Card Grid View"
                >
                  <Grid className="h-4 w-4" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
            {/* Search Input */}
            <div className="sm:col-span-6 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search event title, venue, organizer..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 text-xs bg-background border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Category Select Dropdown */}
            <div className="sm:col-span-3">
              <select
                value={selectedCategory}
                onChange={(e) => handleCategorySelect(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-background border border-input rounded-xl text-foreground focus:outline-none focus:border-primary font-medium"
              >
                <option value="All">All Categories (11 Sectors)</option>
                {DEFAULT_CATEGORIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* City Select Dropdown */}
            <div className="sm:col-span-3">
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-background border border-input rounded-xl text-foreground focus:outline-none focus:border-primary font-medium"
              >
                <option value="all">All Cities ({availableCities.length} Hubs)</option>
                {availableCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content View: Table or Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm font-medium">Loading trade shows and exhibitions...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center">
            <Layers className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <h4 className="font-bold text-foreground text-base">No exhibitions found</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              No events matched your current category, search, or city filter criteria.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold transition-colors border border-border"
            >
              Reset All Filters
            </button>
          </div>
        ) : viewMode === 'table' ? (
          /* Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-4">Exhibition Title &amp; ID</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">City &amp; Venue</th>
                  <th className="px-6 py-4">Event Dates</th>
                  <th className="px-6 py-4">Scale</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedEvents.map((evt) => {
                  const theme = COLOR_MAP[evt.category] || COLOR_MAP['Trade & Industry'];
                  return (
                    <tr key={evt.id || evt.slug || evt.title} className="hover:bg-secondary/40 transition-colors">
                      {/* Title */}
                      <td className="px-6 py-4 max-w-sm">
                        <div className="font-bold text-foreground hover:text-primary transition-colors line-clamp-1">
                          {evt.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span>ID: #{evt.wpPostId || evt.id || 'N/A'}</span>
                          {evt.organizer && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[140px]">{evt.organizer}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${theme.bg} ${theme.text} border ${theme.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${theme.accent}`} />
                          <span>{evt.category}</span>
                        </span>
                      </td>

                      {/* City & Venue */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-primary flex-shrink-0" />
                          <span>{evt.city || 'India'}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-[180px] mt-0.5">
                          {evt.venue || 'Exhibition Grounds'}
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
                          <span>{evt.dates || 'Upcoming 2026'}</span>
                        </div>
                      </td>

                      {/* Scale (Attendees & Booths) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-[11px] text-foreground font-bold">
                          {evt.attendees ? `${evt.attendees} Visitors` : 'Open Entry'}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {evt.booths ? `${evt.booths} Stalls` : 'B2B Convention'}
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={evt.wpUrl || `https://visitexpo.in/?p=${evt.wpPostId || evt.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-bold text-[11px] border border-border transition-colors shadow-2xs"
                            title="View Live Event"
                          >
                            <span>Live Event</span>
                            <ExternalLink className="h-3 w-3 text-primary" />
                          </a>
                          <button
                            type="button"
                            onClick={() => setEventToDelete(evt)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-600 hover:bg-red-500/20 text-[11px] font-bold transition-all shadow-2xs cursor-pointer"
                            title="Delete Event"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Grid View */
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedEvents.map((evt) => {
              const theme = COLOR_MAP[evt.category] || COLOR_MAP['Trade & Industry'];
              return (
                <div
                  key={evt.id || evt.slug || evt.title}
                  className="rounded-xl border border-border bg-card p-5 shadow-xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${theme.bg} ${theme.text} border ${theme.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${theme.accent}`} />
                        <span>{evt.category}</span>
                      </span>
                      <span className="text-[10px] text-muted-foreground font-bold">
                        #{evt.wpPostId || evt.id}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-foreground line-clamp-2 leading-snug">
                        {evt.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                        {evt.description || 'Verified trade exhibition hosted with registered international delegates and stalls.'}
                      </p>
                    </div>

                    <div className="space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border">
                      <div className="flex items-center gap-1.5 text-foreground font-semibold">
                        <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        <span className="truncate">{evt.venue || evt.city || 'India'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Calendar className="h-3 w-3 text-muted-foreground/70 flex-shrink-0" />
                        <span>{evt.dates || 'Upcoming 2026'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {evt.attendees ? `${evt.attendees} Attending` : 'B2B Expo'}
                    </span>
                    <div className="flex items-center gap-2">
                      <a
                        href={evt.wpUrl || `https://visitexpo.in/?p=${evt.wpPostId || evt.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary font-bold text-xs hover:underline"
                        title="View Live Event"
                      >
                        <span>View</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => setEventToDelete(evt)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-red-600 bg-red-500/10 hover:bg-red-500/20 text-xs font-bold transition-all cursor-pointer"
                        title="Delete Event"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <p className="text-muted-foreground">
              Showing{' '}
              <span className="font-bold text-foreground">
                {(page - 1) * ITEMS_PER_PAGE + 1}
              </span>{' '}
              to{' '}
              <span className="font-bold text-foreground">
                {Math.min(page * ITEMS_PER_PAGE, filteredEvents.length)}
              </span>{' '}
              of <span className="font-bold text-foreground">{filteredEvents.length}</span> exhibitions
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-border bg-secondary text-foreground font-bold text-xs hover:bg-secondary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 text-muted-foreground font-bold">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-border bg-secondary text-foreground font-bold text-xs hover:bg-secondary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Delete Event Confirmation Modal */}
      {eventToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-600 border border-red-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Delete Event Permanently</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 space-y-1 text-xs">
              <p className="font-bold text-foreground line-clamp-2">{eventToDelete.title}</p>
              <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground pt-1">
                <span>Category: <strong className="text-foreground">{eventToDelete.category}</strong></span>
                <span>•</span>
                <span>Location: <strong className="text-foreground">{eventToDelete.city || 'India'}</strong></span>
                {eventToDelete.wpPostId && (
                  <>
                    <span>•</span>
                    <span>WP ID: #{eventToDelete.wpPostId}</span>
                  </>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete this event? It will be immediately purged from MongoDB and permanently blacklisted across all live sync directories and category listings.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setEventToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-foreground bg-secondary hover:bg-secondary/80 border border-border transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Event</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
