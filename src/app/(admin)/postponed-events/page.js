'use client';

/**
 * @file postponed-events/page.js
 * @description Admin section to postpone events (set "To Be Announced" when new date is unknown)
 * or reschedule events to specific new dates with automatic WordPress & cache sync.
 */

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  CalendarClock,
  Calendar,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  RotateCcw,
  Edit3,
  X,
  Loader2,
  ExternalLink
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const CLIENT_URL = process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000';

function toInputDate(dateVal) {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

function formatReadableDateRange(startDate, endDate, dateTBA = false) {
  if (dateTBA) return 'To Be Announced';
  if (!startDate) return 'To Be Announced';
  try {
    const s = new Date(startDate);
    if (Number.isNaN(s.getTime())) return 'To Be Announced';
    const sStr = s.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    if (!endDate) return sStr;
    const e = new Date(endDate);
    if (Number.isNaN(e.getTime()) || s.toDateString() === e.toDateString()) return sStr;
    const eStr = e.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${sStr} – ${eStr}`;
  } catch {
    return 'To Be Announced';
  }
}

export default function PostponedEventsPage() {
  const { accessToken } = useAuth();
  const [postponedEvents, setPostponedEvents] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [stats, setStats] = useState({ totalPostponed: 0, tbaCount: 0, rescheduledCount: 0 });
  const [filterMode, setFilterMode] = useState('all'); // all | tba | rescheduled
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [toast, setToast] = useState(null);

  // Postpone / Reschedule modal state
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalMode, setModalMode] = useState('reschedule'); // 'reschedule' | 'tba'
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  // Debounce event lookup search
  useEffect(() => {
    const t = setTimeout(() => {
      setAppliedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchData = useCallback(async (isSearchOnly = false) => {
    if (!accessToken) return;
    if (isSearchOnly) setSearching(true);
    else setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/postponed-events`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          filter: filterMode,
          ...(appliedSearch.length >= 2 ? { search: appliedSearch } : {})
        }
      });
      if (res.data?.success && res.data?.data) {
        setPostponedEvents(res.data.data.postponedEvents || []);
        setSearchResults(res.data.data.searchResults || []);
        setStats(res.data.data.stats || { totalPostponed: 0, tbaCount: 0, rescheduledCount: 0 });
      }
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to load postponed events.');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, [accessToken, filterMode, appliedSearch]);

  useEffect(() => {
    fetchData(appliedSearch.length >= 2);
  }, [fetchData, appliedSearch]);

  const openModalForEvent = (evt, defaultMode = 'reschedule') => {
    setSelectedEvent(evt);
    setModalMode(defaultMode);
    setNewStartDate(defaultMode === 'reschedule' ? toInputDate(evt.startDate) : '');
    setNewEndDate(defaultMode === 'reschedule' ? toInputDate(evt.endDate || evt.startDate) : '');
    setReason(evt.postponedReason || '');
    setModalError('');
  };

  const closeModal = () => {
    setSelectedEvent(null);
    setModalError('');
    setSubmitting(false);
  };

  const handleSavePostpone = async (e) => {
    e.preventDefault();
    if (!selectedEvent || !accessToken) return;
    setModalError('');

    if (modalMode === 'reschedule') {
      if (!newStartDate) {
        setModalError('Please pick the new start date, or switch to "To Be Announced" if the new date is not finalized.');
        return;
      }
      const effEnd = newEndDate || newStartDate;
      if (new Date(effEnd) < new Date(newStartDate)) {
        setModalError('New end date cannot be earlier than the new start date.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await axios.put(
        `${API_URL}/admin/events/${selectedEvent._id}/postpone`,
        {
          mode: modalMode,
          ...(modalMode === 'reschedule'
            ? { newStartDate, newEndDate: newEndDate || newStartDate }
            : {}),
          reason: reason.trim()
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data?.success) {
        showToast('success', res.data.message || 'Event schedule updated successfully.');
        closeModal();
        fetchData(false);
      } else {
        setModalError(res.data?.error || 'Could not update event schedule.');
      }
    } catch (err) {
      setModalError(err.response?.data?.error || 'Failed to update event date.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestoreEvent = async (evt, restoreOriginalDates = false) => {
    if (!accessToken || !evt?._id) return;
    try {
      const res = await axios.put(
        `${API_URL}/admin/events/${evt._id}/postpone`,
        { mode: 'restore', restoreOriginalDates },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data?.success) {
        showToast('success', res.data.message || 'Event restored to regular schedule.');
        fetchData(false);
      }
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to restore event.');
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header Banner */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <CalendarClock className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">Postponed &amp; Rescheduled Events</h2>
                <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                  Date Manager
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Change any event to a specific rescheduled date, or mark it as <strong>Postponed (To Be Announced)</strong> when the new date is not finalized yet.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchData(false)}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Summary KPIs */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Postponed</span>
              <CalendarClock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-1.5 text-2xl font-black text-foreground">{stats.totalPostponed}</div>
            <p className="text-xs text-muted-foreground">Events with postponed or TBA status</p>
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">To Be Announced (TBA)</span>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-1.5 text-2xl font-black text-amber-700 dark:text-amber-300">{stats.tbaCount}</div>
            <p className="text-xs text-muted-foreground">Showing &ldquo;To Be Announced&rdquo; on website &amp; app</p>
          </div>

          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">Rescheduled (New Date)</span>
              <CheckCircle2 className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="mt-1.5 text-2xl font-black text-indigo-700 dark:text-indigo-300">{stats.rescheduledCount}</div>
            <p className="text-xs text-muted-foreground">Updated to confirmed new dates</p>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {toast && (
        <div
          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium ${
            toast.type === 'error'
              ? 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200'
              : 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200'
          }`}
        >
          <span>{toast.text}</span>
          <button type="button" onClick={() => setToast(null)} className="ml-3 opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Search Any Event to Postpone / Reschedule */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <h3 className="text-base font-bold text-foreground">Find an Event to Postpone or Change Date</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Type at least 2 characters (event title, city, venue, or slug) to select any event and update its date or mark it as To Be Announced.
        </p>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search events by title, city, or venue (e.g. World Hindu Expo, Mumbai)..."
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {searching && (
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Searching events...
          </div>
        )}

        {!searching && appliedSearch.length >= 2 && (
          <div className="mt-4 space-y-2">
            {searchResults.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                No events matched &ldquo;{appliedSearch}&rdquo;.
              </p>
            ) : (
              searchResults.map((evt) => (
                <div
                  key={evt._id}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-background p-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {evt.banner ? (
                      <img
                        src={evt.banner}
                        alt={evt.title}
                        className="h-12 w-16 shrink-0 rounded-lg object-cover border border-border"
                      />
                    ) : (
                      <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Calendar className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="truncate text-sm font-bold text-foreground">{evt.title}</p>
                        {evt.dateTBA ? (
                          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                            To Be Announced
                          </span>
                        ) : evt.isPostponed ? (
                          <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                            Rescheduled
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                          <Calendar className="h-3 w-3 text-primary" />
                          {formatReadableDateRange(evt.startDate, evt.endDate, evt.dateTBA)}
                        </span>
                        {(evt.venue || evt.city) && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {[evt.venue, evt.city].filter(Boolean).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openModalForEvent(evt, 'reschedule')}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-black hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Change Date
                    </button>
                    <button
                      type="button"
                      onClick={() => openModalForEvent(evt, 'tba')}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors cursor-pointer"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Postpone (TBA)
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Active Postponed & TBA Events List */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">Managed Postponed &amp; Rescheduled Events</h3>
            <p className="text-xs text-muted-foreground">
              Update dates once confirmed, or restore events back to normal status.
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-background p-1">
            {[
              { id: 'all', label: `All (${stats.totalPostponed})` },
              { id: 'tba', label: `TBA (${stats.tbaCount})` },
              { id: 'rescheduled', label: `Rescheduled (${stats.rescheduledCount})` }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterMode(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  filterMode === tab.id
                    ? 'bg-primary text-black'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-14 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading postponed events...
          </div>
        ) : postponedEvents.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-border p-10 text-center">
            <CalendarClock className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-semibold text-foreground">No postponed or rescheduled events yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Use the search box above to find any event, set a rescheduled date, or mark its date as To Be Announced.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {postponedEvents.map((evt) => (
              <div
                key={evt._id}
                className="flex flex-col gap-4 rounded-xl border border-border bg-background p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  {evt.banner ? (
                    <img
                      src={evt.banner}
                      alt={evt.title}
                      className="h-16 w-24 shrink-0 rounded-xl object-cover border border-border"
                    />
                  ) : (
                    <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <Calendar className="h-6 w-6" />
                    </div>
                  )}

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-foreground">{evt.title}</h4>
                      {evt.dateTBA ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                          <Clock className="h-3 w-3" />
                          Postponed • To Be Announced
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                          <CheckCircle2 className="h-3 w-3" />
                          Rescheduled (New Date)
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      <span className="font-bold text-foreground">
                        Current Display:{' '}
                        <span className={evt.dateTBA ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                          {formatReadableDateRange(evt.startDate, evt.endDate, evt.dateTBA)}
                        </span>
                      </span>

                      {evt.originalStartDate && (
                        <span className="text-muted-foreground line-through">
                          Original: {formatReadableDateRange(evt.originalStartDate, evt.originalEndDate, false)}
                        </span>
                      )}

                      {(evt.venue || evt.city) && (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {[evt.venue, evt.city].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>

                    {evt.postponedReason && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground/80">Note:</span> {evt.postponedReason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openModalForEvent(evt, 'reschedule')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-black hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    {evt.dateTBA ? 'Set New Date' : 'Change Date'}
                  </button>

                  {!evt.dateTBA && (
                    <button
                      type="button"
                      onClick={() => openModalForEvent(evt, 'tba')}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors cursor-pointer"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Mark TBA
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRestoreEvent(evt, false)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                    title="Clear the postponed/TBA status while keeping the current date"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Clear Status
                  </button>

                  {evt.slug && (
                    <a
                      href={`${CLIENT_URL}/expo/${evt.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                      title="View on Website"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Postpone / Reschedule Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Postpone or Change Event Date</h3>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{selectedEvent.title}</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePostpone} className="p-6 space-y-5">
              {/* Current Schedule Info */}
              <div className="rounded-xl border border-border bg-muted/40 p-3.5 text-xs">
                <div className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                  Current Saved Schedule
                </div>
                <div className="mt-1 font-bold text-foreground">
                  {formatReadableDateRange(selectedEvent.startDate, selectedEvent.endDate, selectedEvent.dateTBA)}
                </div>
                {selectedEvent.originalStartDate && (
                  <div className="mt-0.5 text-muted-foreground">
                    Original Schedule: {formatReadableDateRange(selectedEvent.originalStartDate, selectedEvent.originalEndDate, false)}
                  </div>
                )}
              </div>

              {/* Action Mode Selector */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalMode('reschedule');
                    setModalError('');
                    if (!newStartDate && selectedEvent.startDate) {
                      setNewStartDate(toInputDate(selectedEvent.startDate));
                      setNewEndDate(toInputDate(selectedEvent.endDate || selectedEvent.startDate));
                    }
                  }}
                  className={`rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                    modalMode === 'reschedule'
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                      : 'border-border bg-background hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">Specific New Date</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Set the confirmed rescheduled start &amp; end dates.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setModalMode('tba');
                    setModalError('');
                  }}
                  className={`rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                    modalMode === 'tba'
                      ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30'
                      : 'border-border bg-background hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-bold text-foreground">To Be Announced</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    No new date yet — shows &ldquo;To Be Announced&rdquo; on event.
                  </p>
                </button>
              </div>

              {/* Specific Date Inputs OR TBA Notice */}
              {modalMode === 'reschedule' ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      New Start Date *
                    </label>
                    <input
                      type="date"
                      value={newStartDate}
                      onChange={(e) => {
                        setNewStartDate(e.target.value);
                        if (!newEndDate || new Date(newEndDate) < new Date(e.target.value)) {
                          setNewEndDate(e.target.value);
                        }
                      }}
                      required
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      New End Date *
                    </label>
                    <input
                      type="date"
                      value={newEndDate}
                      min={newStartDate || undefined}
                      onChange={(e) => setNewEndDate(e.target.value)}
                      required
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-bold">Date will display as &ldquo;To Be Announced&rdquo;</p>
                    <p className="mt-0.5 opacity-90">
                      This event will remain active on VisitExpo with a <strong>Postponed • To Be Announced</strong> badge until you assign a confirmed new date here.
                    </p>
                  </div>
                </div>
              )}

              {/* Optional Reason */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Postponement / Reschedule Note (Optional)
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Postponed by organiser; revised dates will be confirmed shortly."
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              {modalError && (
                <div className="rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
                  {modalError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-border bg-background px-4 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold transition-opacity cursor-pointer disabled:opacity-60 ${
                    modalMode === 'tba'
                      ? 'bg-amber-500 text-white hover:bg-amber-600'
                      : 'bg-primary text-black hover:opacity-90'
                  }`}
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {modalMode === 'tba' ? 'Mark Postponed (To Be Announced)' : 'Save New Event Date'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
