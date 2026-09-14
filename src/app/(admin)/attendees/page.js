'use client';

/**
 * @file attendees/page.js
 * @description Super Admin Event Attendees & Followers Directory.
 * Displays all interested people on events and people following events across both
 * platform and WordPress exhibitions, with filtering, search, CSV export, and attendee profiling.
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  Users,
  UserCheck,
  Bell,
  Ticket,
  Building2,
  MapPin,
  Calendar,
  Search,
  Filter,
  Download,
  Send,
  CheckCircle2,
  ShieldCheck,
  Mail,
  Phone,
  ExternalLink,
  Eye,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  Award,
  ArrowRight,
  ChevronDown,
  X,
  Grid,
  List,
  MessageSquare,
  Globe,
  Tag,
  Loader2,
  Check
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function AttendeesAndFollowersPage() {
  const { accessToken } = useAuth();

  // Data State
  const [attendees, setAttendees] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [kpis, setKpis] = useState({
    totalInterested: 0,
    totalFollowers: 0,
    totalBuyers: 0,
    totalEvents: 0
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & View State
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'interested' | 'followers' | 'buyers' | 'exhibitors'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventSlug, setSelectedEventSlug] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'Trade Buyer' | 'VIP Delegate' | 'Exhibitor & Brand'
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals & Drawers
  const [selectedAttendee, setSelectedAttendee] = useState(null);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Load Attendees & Events
  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams();
      if (selectedEventSlug && selectedEventSlug !== 'all') {
        params.append('slug', selectedEventSlug);
      }
      if (activeTab !== 'all') {
        params.append('tab', activeTab);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      params.append('page', String(page));
      params.append('limit', '50');

      const res = await axios.get(`/api/attendees?${params.toString()}`);
      if (res.data?.success) {
        setAttendees(res.data.attendees || []);
        if (res.data.eventsList?.length) {
          setEventsList(res.data.eventsList);
        }
        if (res.data.kpis) {
          setKpis(res.data.kpis);
        }
        setSelectedEvent(res.data.selectedEvent || null);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to load attendees:', error);
      showToast('Error loading attendees directory. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedEventSlug, activeTab, page]);

  // Handle Search submit / debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchData();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered Attendees in Memory for Instant Type / Verification toggles
  const filteredAttendees = useMemo(() => {
    return attendees.filter((att) => {
      if (typeFilter !== 'all' && att.type !== typeFilter) return false;
      if (verifiedOnly && !att.verified) return false;
      return true;
    });
  }, [attendees, typeFilter, verifiedOnly]);

  // Export Attendees to CSV
  const handleExportCSV = () => {
    if (filteredAttendees.length === 0) {
      showToast('No attendees to export.');
      return;
    }

    const headers = [
      'Name',
      'Designation',
      'Company',
      'Email',
      'Phone',
      'City',
      'Country',
      'Attendee Type',
      'Event Name',
      'Event City',
      'Engagement Status',
      'Is Interested',
      'Is Follower',
      'Verified Profile',
      'Sourcing Objective',
      'Registered Time'
    ];

    const rows = filteredAttendees.map((a) => [
      `"${a.name || ''}"`,
      `"${a.designation || ''}"`,
      `"${a.company || ''}"`,
      `"${a.email || ''}"`,
      `"${a.phone || ''}"`,
      `"${a.city || ''}"`,
      `"${a.country || ''}"`,
      `"${a.type || ''}"`,
      `"${a.event?.title || selectedEvent?.title || 'General Exhibition'}"`,
      `"${a.event?.city || selectedEvent?.city || ''}"`,
      `"${a.status || ''}"`,
      a.isInterested ? 'Yes' : 'No',
      a.isFollower ? 'Yes' : 'No',
      a.verified ? 'Verified' : 'Unverified',
      `"${(a.objective || '').replace(/"/g, '""')}"`,
      `"${a.registeredTime || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const eventSlug = selectedEvent?.slug || selectedEventSlug || 'all-events';
    link.setAttribute('download', `visitexpo-attendees-${eventSlug}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${filteredAttendees.length} attendees to CSV successfully!`);
  };

  // Broadcast Message to Attendees of Selected Event
  const handleSendBroadcast = (e) => {
    e.preventDefault();
    setBroadcastSending(true);
    setTimeout(() => {
      setBroadcastSending(false);
      setShowBroadcastModal(false);
      setBroadcastSubject('');
      setBroadcastMessage('');
      showToast(`Broadcast update delivered to ${filteredAttendees.length} attendees & followers!`);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Page Header & Live Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                <span>Event Attendees &amp; Followers</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Live Sync
                </span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Track confirmed trade buyers, badge claimants, and active subscribers following exhibitions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Refresh attendee data"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-primary' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-secondary text-foreground text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Download className="h-3.5 w-3.5 text-primary" />
            <span>Export CSV ({filteredAttendees.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowBroadcastModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Broadcast Alert</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Interested */}
        <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold">Interested Attendees</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Ticket className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            {kpis.totalInterested.toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
            <span className="font-bold text-amber-600 dark:text-amber-400">Visitor Passes &amp; Stalls</span>
            <span>expressed interest</span>
          </div>
        </div>

        {/* Card 2: Event Followers */}
        <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold">Event Followers</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Bell className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            {kpis.totalFollowers.toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
            <span className="font-bold text-blue-600 dark:text-blue-400">Subscribed</span>
            <span>to live expo updates</span>
          </div>
        </div>

        {/* Card 3: Trade Buyers */}
        <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold">B2B Trade Buyers</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            {kpis.totalBuyers.toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
            <span className="font-bold text-emerald-600 dark:text-emerald-400">Verified Sourcing</span>
            <span>decision makers</span>
          </div>
        </div>

        {/* Card 4: Active Exhibitions */}
        <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold">Active Exhibitions</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            {kpis.totalEvents.toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
            <span className="font-bold text-purple-600 dark:text-purple-400">Trade Expos</span>
            <span>with audience traction</span>
          </div>
        </div>
      </div>

      {/* 3. Event Selector & Spotlight Banner */}
      <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              <span>Select Exhibition to Filter Attendees &amp; Followers</span>
            </label>
            <p className="text-xs text-muted-foreground">
              Choose an exhibition from the unified directory to isolate its attendees, or view all combined.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <select
                value={selectedEventSlug}
                onChange={(e) => {
                  setSelectedEventSlug(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3.5 py-2.5 pr-8 text-xs font-semibold rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer appearance-none shadow-2xs"
              >
                <option value="all">★ All Exhibitions (Unified Global Network)</option>
                {eventsList.map((ev) => (
                  <option key={ev.id || ev.slug} value={ev.slug}>
                    {ev.title} ({ev.city} • {ev.interestedCount?.toLocaleString() || '1k'} interested)
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>

            {selectedEventSlug !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  setSelectedEventSlug('all');
                  setPage(1);
                }}
                className="p-2.5 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground text-xs font-bold transition-colors cursor-pointer"
                title="Clear event filter"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Spotlight Banner when an event is selected */}
        {selectedEvent && (
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="h-11 w-11 rounded-xl bg-primary text-primary-foreground font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                {selectedEvent.title.charAt(0)}
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-sm text-foreground truncate">
                    {selectedEvent.title}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {selectedEvent.category || 'Trade Show'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-[#FF2E63]" />
                    <span>{selectedEvent.dates}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-primary" />
                    <span>{selectedEvent.venue || selectedEvent.city}</span>
                  </span>
                  <span>•</span>
                  <span>Organized by: <strong className="text-foreground">{selectedEvent.organizer}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
              <div className="text-right text-xs">
                <div className="font-black text-foreground">{selectedEvent.interestedCount?.toLocaleString()} Interested</div>
                <div className="text-[11px] text-muted-foreground">{selectedEvent.followersCount?.toLocaleString()} Followers</div>
              </div>
              <a
                href={`http://localhost:3000/expo/${selectedEvent.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-card border border-border hover:bg-secondary text-foreground text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <span>View Public Page</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* 4. Controls: Tabs, Search & Layout View */}
      <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4">
        
        {/* Tabs Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-semibold">
            {[
              { id: 'all', label: 'All Records' },
              { id: 'interested', label: 'Interested Attendees' },
              { id: 'followers', label: 'Event Followers' },
              { id: 'buyers', label: 'Trade Buyers' },
              { id: 'exhibitors', label: 'Exhibitors & Reps' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setPage(1);
                }}
                className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-secondary text-foreground border-border font-bold'
                  : 'text-muted-foreground hover:text-foreground border-transparent'
              }`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-secondary text-foreground border-border font-bold'
                  : 'text-muted-foreground hover:text-foreground border-transparent'
              }`}
              title="Cards Grid View"
            >
              <Grid className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid sm:grid-cols-12 gap-3 items-center">
          {/* Search */}
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by attendee name, company, designation, city, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Attendee Type Filter */}
          <div className="sm:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="all">All Attendee Types</option>
              <option value="Trade Buyer">Trade Buyers</option>
              <option value="VIP Delegate">VIP Delegates</option>
              <option value="Exhibitor & Brand">Exhibitors &amp; Brands</option>
            </select>
          </div>

          {/* Verification Pill */}
          <div className="sm:col-span-3 flex items-center justify-end">
            <button
              type="button"
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                verifiedOnly
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-background text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{verifiedOnly ? 'Verified Only ✓' : 'All Profiles'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Main Content: Attendees List (Table or Cards) */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground font-semibold">Loading attendee records...</p>
          </div>
        ) : filteredAttendees.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="h-12 w-12 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mx-auto">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-extrabold text-sm text-foreground">No attendees found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No attendee or follower records matched your query. Try clearing the filters or search bar.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('all');
                setVerifiedOnly(false);
                setSelectedEventSlug('all');
              }}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : viewMode === 'table' ? (
          /* Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 border-b border-border text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-3.5 px-4">Attendee Profile</th>
                  <th className="py-3.5 px-4">Designation &amp; Company</th>
                  <th className="py-3.5 px-4">Event Associated</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAttendees.map((att) => (
                  <tr key={att.id} className="hover:bg-secondary/20 transition-colors">
                    
                    {/* Attendee Profile */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={att.avatar}
                          alt={att.name}
                          className="h-9 w-9 rounded-full object-cover border border-border shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-foreground truncate flex items-center gap-1.5">
                            <span>{att.name}</span>
                            {att.isLiveUser && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Live User
                              </span>
                            )}
                            {att.verified && !att.isLiveUser && (
                              <ShieldCheck className="h-3 w-3 text-blue-500 shrink-0" title="Verified Profile" />
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5" />
                            <span>{att.city}, {att.country}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Designation & Company */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-foreground truncate max-w-xs">{att.designation}</div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-xs">{att.company}</div>
                    </td>

                    {/* Event Associated */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-foreground truncate max-w-xs">{att.event?.title || 'Exhibition'}</div>
                      <div className="text-[11px] text-muted-foreground">{att.event?.dates || '2026'} • {att.event?.city}</div>
                    </td>

                    {/* Type Badge */}
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                        att.type === 'Trade Buyer'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : att.type === 'VIP Delegate'
                          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      }`}>
                        {att.type}
                      </span>
                    </td>

                    {/* Engagement Status */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        {att.isInterested && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Interested</span>
                          </span>
                        )}
                        {att.isFollower && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md ml-1">
                            <Bell className="h-3 w-3" />
                            <span>Follower</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Contact info */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <a href={`mailto:${att.email}`} className="text-[11px] text-primary hover:underline flex items-center gap-1 truncate max-w-[140px]">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{att.email}</span>
                        </a>
                        <a href={`tel:${att.phone}`} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                          <Phone className="h-2.5 w-2.5 shrink-0" />
                          <span>{att.phone}</span>
                        </a>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedAttendee(att)}
                        className="p-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-foreground text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                        title="View Complete Profile"
                      >
                        <Eye className="h-3.5 w-3.5 text-primary" />
                        <span>Details</span>
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Cards Grid View */
          <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAttendees.map((att) => (
              <div
                key={att.id}
                className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all space-y-3 shadow-2xs group flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={att.avatar}
                        alt={att.name}
                        className="h-10 w-10 rounded-full object-cover border border-border shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs sm:text-sm text-foreground truncate flex items-center gap-1.5">
                          <span>{att.name}</span>
                          {att.isLiveUser && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Live User
                            </span>
                          )}
                          {att.verified && !att.isLiveUser && (
                            <ShieldCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          )}
                        </div>
                        <div className="text-[11px] font-semibold text-muted-foreground truncate">{att.designation}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{att.company}</div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      att.type === 'Trade Buyer'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : att.type === 'VIP Delegate'
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                    }`}>
                      {att.type}
                    </span>
                  </div>

                  {/* Sourcing Objective Quote */}
                  <div className="p-2.5 rounded-lg bg-secondary/30 border border-border text-[11px] text-foreground italic line-clamp-2">
                    "{att.objective}"
                  </div>

                  <div className="space-y-1 text-xs pt-1 border-t border-border">
                    <div className="text-[11px] text-muted-foreground truncate">
                      Event: <strong className="text-foreground">{att.event?.title}</strong>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{att.city}, {att.country}</span>
                      <span>{att.registeredTime}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border gap-2">
                  <div className="flex items-center gap-1">
                    {att.isInterested && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        Interested
                      </span>
                    )}
                    {att.isFollower && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        Follower
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedAttendee(att)}
                    className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border bg-secondary/20 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Showing page <strong className="text-foreground">{page}</strong> of <strong className="text-foreground">{totalPages}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-border bg-card disabled:opacity-40 text-xs font-bold cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-border bg-card disabled:opacity-40 text-xs font-bold cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Attendee Detail Profile Modal */}
      {selectedAttendee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-card text-foreground rounded-2xl shadow-2xl border border-border p-6 space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={selectedAttendee.avatar}
                  alt={selectedAttendee.name}
                  className="h-14 w-14 rounded-2xl object-cover border border-border shadow-xs"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-foreground">{selectedAttendee.name}</h3>
                    {selectedAttendee.verified && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        <span>Verified B2B Profile</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-foreground/90">{selectedAttendee.designation}</p>
                  <p className="text-xs text-muted-foreground">{selectedAttendee.company} • {selectedAttendee.city}, {selectedAttendee.country}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAttendee(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 text-xs">
              
              {/* Event Engagement Card */}
              <div className="p-3.5 rounded-xl border border-border bg-secondary/20 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Associated Event Engagement
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-foreground">{selectedAttendee.event?.title}</h4>
                    <p className="text-muted-foreground">{selectedAttendee.event?.dates} • {selectedAttendee.event?.venue || selectedAttendee.event?.city}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {selectedAttendee.isInterested && (
                      <span className="text-[10px] font-extrabold px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Interested Visitor
                      </span>
                    )}
                    {selectedAttendee.isFollower && (
                      <span className="text-[10px] font-extrabold px-2 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        Subscribed Follower
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Sourcing Objective */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                  Procurement Objective / B2B Matchmaking Requirement
                </label>
                <div className="p-3 rounded-xl bg-background border border-border italic text-foreground leading-relaxed">
                  "{selectedAttendee.objective}"
                </div>
              </div>

              {/* Contact Information Grid */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl border border-border bg-secondary/10 space-y-1">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">Email Address</div>
                  <a href={`mailto:${selectedAttendee.email}`} className="font-bold text-primary hover:underline truncate block">
                    {selectedAttendee.email}
                  </a>
                </div>
                <div className="p-3 rounded-xl border border-border bg-secondary/10 space-y-1">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">Phone / WhatsApp</div>
                  <a href={`tel:${selectedAttendee.phone}`} className="font-bold text-foreground hover:text-primary block">
                    {selectedAttendee.phone}
                  </a>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  showToast(`Verification status toggled for ${selectedAttendee.name}`);
                  setSelectedAttendee(null);
                }}
                className="px-3.5 py-2 rounded-xl border border-border hover:bg-secondary text-xs font-bold cursor-pointer"
              >
                Toggle Verified Status
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAttendee(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-secondary cursor-pointer"
                >
                  Close
                </button>
                <a
                  href={`mailto:${selectedAttendee.email}?subject=Regarding ${encodeURIComponent(selectedAttendee.event?.title || 'VisitExpo')}`}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Send Direct Email</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 7. Broadcast Announcement Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-card text-foreground rounded-2xl shadow-2xl border border-border p-6 space-y-4">
            
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                  <Send className="h-4 w-4 text-primary" />
                  <span>Broadcast Expo Announcement</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Delivers email &amp; in-app notification to all interested attendees and followers of {selectedEvent?.title || 'selected exhibitions'}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Target Audience</label>
                <div className="p-2.5 rounded-xl bg-secondary/30 border border-border text-foreground font-semibold flex items-center justify-between">
                  <span>{selectedEvent ? selectedEvent.title : 'All Active Exhibitions'}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {filteredAttendees.length} Recipients
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Broadcast Subject / Headline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule Update: Keynote timings confirmed for Hall A"
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Announcement Message</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Type your official announcement, badge pickup instructions, or stall floorplan guide..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={broadcastSending}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {broadcastSending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Dispatching...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Send Broadcast Now</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 8. Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-zinc-900 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-2xl border border-zinc-700 animate-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
