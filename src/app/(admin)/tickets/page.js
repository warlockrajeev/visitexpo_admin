'use client';

/**
 * @file page.js (Support & Event Tickets Dashboard)
 * @description Super Admin system support ticket monitoring and Event Ticket Tiers management workspace.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  LifeBuoy,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  ArrowUpRight,
  Filter,
  Check,
  Ticket as TicketIcon,
  Loader2,
  DollarSign,
  Tag,
  MessageSquare,
  Send,
  X,
  Sparkles,
  Building
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function SupportTicketsPage() {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState('support'); // 'support' or 'event_tickets'
  
  // Support Tickets API state
  const [supportTickets, setSupportTickets] = useState([]);
  const [loadingSupport, setLoadingSupport] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Ticket Detail & Response Modal State
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [resolutionNotesInput, setResolutionNotesInput] = useState('');
  const [postingReply, setPostingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Event Tickets state
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [eventTickets, setEventTickets] = useState([]);
  const [loadingEventTickets, setLoadingEventTickets] = useState(false);

  // 1. Fetch live support tickets from API
  const fetchSupportTickets = async () => {
    setLoadingSupport(true);
    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const res = await axios.get(`${API_URL}/support-tickets`, { headers });
      if (res.data?.success) {
        setSupportTickets(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load support tickets for admin view:', err);
    } fontally: {
      setLoadingSupport(false);
    }
  };

  useEffect(() => {
    fetchSupportTickets();
  }, [accessToken]);

  // 2. Fetch events list on mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(`${API_URL}/events?limit=1000&all=true`);
        if (res.data?.success && res.data.data?.docs) {
          setEvents(res.data.data.docs);
          if (res.data.data.docs.length > 0) {
            setSelectedEventId(res.data.data.docs[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load events for admin ticket view:', err);
      }
    };
    fetchEvents();
  }, []);

  // 3. Fetch ticket tiers whenever selected event changes
  useEffect(() => {
    if (!selectedEventId) return;
    const fetchTicketTiers = async () => {
      setLoadingEventTickets(true);
      try {
        const res = await axios.get(`${API_URL}/tickets`, { params: { eventId: selectedEventId } });
        if (res.data?.success) {
          setEventTickets(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load ticket tiers:', err);
      } finally {
        setLoadingEventTickets(false);
      }
    };
    fetchTicketTiers();
  }, [selectedEventId]);

  // 4. Resolve support ticket
  const resolveTicket = async (tktId, notes = 'Resolved by Super Admin') => {
    setUpdatingStatus(true);
    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const res = await axios.put(
        `${API_URL}/support-tickets/${tktId}`,
        { status: 'resolved', resolutionNotes: notes },
        { headers }
      );
      if (res.data?.success) {
        if (selectedTicket && selectedTicket._id === tktId) {
          setSelectedTicket(res.data.ticket);
        }
        fetchSupportTickets();
      }
    } catch (err) {
      console.error('Failed to resolve support ticket:', err);
      alert('Error updating ticket status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // 5. Handle status update
  const updateStatus = async (tktId, newStatus) => {
    setUpdatingStatus(true);
    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const res = await axios.put(
        `${API_URL}/support-tickets/${tktId}`,
        { status: newStatus },
        { headers }
      );
      if (res.data?.success) {
        if (selectedTicket && selectedTicket._id === tktId) {
          setSelectedTicket(res.data.ticket);
        }
        fetchSupportTickets();
      }
    } catch (err) {
      console.error('Failed to update ticket status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // 6. Handle priority update
  const updatePriority = async (tktId, newPriority) => {
    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const res = await axios.put(
        `${API_URL}/support-tickets/${tktId}`,
        { priority: newPriority },
        { headers }
      );
      if (res.data?.success) {
        if (selectedTicket && selectedTicket._id === tktId) {
          setSelectedTicket(res.data.ticket);
        }
        fetchSupportTickets();
      }
    } catch (err) {
      console.error('Failed to update priority:', err);
    }
  };

  // 7. Post response to ticket thread
  const handlePostAdminReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    setPostingReply(true);
    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const res = await axios.post(
        `${API_URL}/support-tickets/${selectedTicket._id}/responses`,
        { message: replyMessage },
        { headers }
      );

      if (res.data?.success) {
        setSelectedTicket(res.data.ticket);
        setReplyMessage('');
        fetchSupportTickets();
      }
    } catch (err) {
      console.error('Failed to post reply:', err);
      alert('Failed to send admin response');
    } finally {
      setPostingReply(false);
    }
  };

  // Filter support tickets
  const filteredTickets = supportTickets.filter(t => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.reporterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.reporterEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ticketId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'pending'
        ? t.status === 'open' || t.status === 'in_progress'
        : statusFilter === 'completed' || statusFilter === 'resolved'
        ? t.status === 'resolved' || t.status === 'closed'
        : t.status === statusFilter;

    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const openCount = supportTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const resolvedCount = supportTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

  return (
    <div className="space-y-6">
      {/* Header Panel with Mode Switcher */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {activeTab === 'support' ? <LifeBuoy className="h-6 w-6 text-primary" /> : <TicketIcon className="h-6 w-6 text-primary" />}
            {activeTab === 'support' ? 'Support Helpdesk Workspace' : 'Event Ticket Tiers Overview'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {activeTab === 'support'
              ? 'Review live support requests filed by organizers & exhibitors, reply to technical issues, and resolve tickets.'
              : 'Inspect created event ticket pricing tiers, visitor capacities, and registration pass settings across all expos.'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex border border-border rounded-xl p-1 bg-muted/20 w-fit shrink-0">
          <button
            onClick={() => setActiveTab('support')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 relative ${
              activeTab === 'support'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LifeBuoy className="h-4 w-4 text-primary" /> Support Helpdesk
            {openCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center rounded-full bg-amber-500 text-white px-1.5 py-0.5 text-[10px] font-extrabold">
                {openCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('event_tickets')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'event_tickets'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TicketIcon className="h-4 w-4 text-primary" /> Event Tickets
          </button>
        </div>
      </div>

      {/* VIEW 1: SUPPORT HELPDESK */}
      {activeTab === 'support' && (
        <>
          {/* KPI Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase">Total Tickets</span>
                <p className="text-2xl font-extrabold text-foreground mt-1">{supportTickets.length}</p>
              </div>
              <LifeBuoy className="h-8 w-8 text-primary/40" />
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-500 uppercase">Open / Pending</span>
                <p className="text-2xl font-extrabold text-foreground mt-1">{openCount}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500/40" />
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-500 uppercase">Resolved</span>
                <p className="text-2xl font-extrabold text-foreground mt-1">{resolvedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500/40" />
            </div>
          </div>

          {/* Control Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
            <div className="flex border border-border rounded-lg p-0.5 bg-muted/20 w-fit">
              {[
                { id: 'all', label: 'All Tickets' },
                { id: 'pending', label: 'Open / Pending' },
                { id: 'resolved', label: 'Resolved' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                    statusFilter === tab.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary capitalize"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent Priority</option>
              </select>

              <div className="relative md:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search ticket ID, title, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Support Tickets Logs Table */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {loadingSupport ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm">Fetching support ticket queue...</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-2">
                <LifeBuoy className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-xs font-semibold">No support tickets match the selected filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <th className="px-6 py-4">Ticket Info</th>
                      <th className="px-6 py-4">Filer / Client</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Priority</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredTickets.map((t) => {
                      const isPending = t.status === 'open' || t.status === 'in_progress';
                      return (
                        <tr key={t._id} className="hover:bg-secondary/40 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold text-primary">{t.ticketId}</span>
                              <span className="text-[10px] text-muted-foreground">
                                ({new Date(t.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })})
                              </span>
                            </div>
                            <p className="font-semibold text-foreground mt-0.5 line-clamp-1">{t.title}</p>
                          </td>

                          <td className="px-6 py-4">
                            <p className="font-semibold text-foreground flex items-center gap-1">
                              <User className="h-3 w-3 text-primary" /> {t.reporterName}
                            </p>
                            <span className="text-xs text-muted-foreground">{t.reporterEmail}</span>
                          </td>

                          <td className="px-6 py-4 capitalize font-medium text-xs text-muted-foreground">
                            {t.category?.replace('_', ' ')}
                          </td>

                          <td className="px-6 py-4">
                            <select
                              value={t.priority}
                              onChange={(e) => updatePriority(t._id, e.target.value)}
                              className={`rounded px-2 py-1 text-xs font-bold uppercase border bg-background text-center focus:outline-none ${
                                t.priority === 'urgent' || t.priority === 'high'
                                  ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                  : t.priority === 'medium'
                                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                  : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                              }`}
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="urgent">Urgent</option>
                            </select>
                          </td>

                          <td className="px-6 py-4">
                            {isPending ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-500 border border-amber-500/20">
                                <Clock className="h-3.5 w-3.5" /> {t.status === 'in_progress' ? 'In Progress' : 'Open'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500 border border-emerald-500/20">
                                <CheckCircle className="h-3.5 w-3.5" /> {t.status === 'resolved' ? 'Resolved' : 'Closed'}
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                            <button
                              onClick={() => setSelectedTicket(t)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-all"
                            >
                              <MessageSquare className="h-3.5 w-3.5" /> Thread ({t.responses?.length || 0})
                            </button>

                            {isPending && (
                              <button
                                onClick={() => resolveTicket(t._id)}
                                className="inline-flex items-center gap-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg shadow-sm transition-all"
                              >
                                <Check className="h-3.5 w-3.5" /> Resolve
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* VIEW 2: EVENT TICKET TIERS */}
      {activeTab === 'event_tickets' && (
        <div className="space-y-6">
          {/* Event Selector */}
          <div className="bg-card p-4 rounded-xl border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Event:</label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary md:w-80"
              >
                {events.map((evt) => (
                  <option key={evt._id} value={evt._id}>
                    {evt.title} ({evt.city || 'India'})
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs text-muted-foreground">
              Total Pricing Tiers: <strong className="text-foreground">{eventTickets.length}</strong>
            </span>
          </div>

          {/* Ticket Tiers Grid */}
          {loadingEventTickets ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : eventTickets.length === 0 ? (
            <div className="border border-border rounded-2xl p-12 text-center text-muted-foreground bg-card space-y-2">
              <TicketIcon className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <h3 className="font-bold text-foreground">No Ticket Tiers Configured</h3>
              <p className="text-xs">No active ticket passes exist for the selected event.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {eventTickets.map((t) => (
                <div key={t._id} className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      t.type === 'vip'
                        ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                        : t.type === 'paid'
                        ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                        : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    }`}>
                      {t.type} PASS
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      Status: <span className="text-emerald-500 font-bold capitalize">{t.status || 'Active'}</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-foreground">{t.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description || 'No detailed description.'}</p>
                  </div>

                  <div className="flex items-baseline justify-between border-t border-border pt-4">
                    <div>
                      <span className="text-xs text-muted-foreground block">Capacity</span>
                      <span className="text-sm font-bold text-foreground font-mono">
                        {t.soldCount || 0} / {t.capacity === -1 ? '∞' : t.capacity} sold
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground block">Ticket Price</span>
                      <span className="text-xl font-extrabold text-foreground font-mono">
                        {t.price === 0 ? 'FREE' : `₹${t.price.toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= ADMIN TICKET DETAIL & REPLY MODAL ================= */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-primary bg-primary/10 px-2.5 py-1 rounded border border-primary/20">
                  {selectedTicket.ticketId}
                </span>
                <div>
                  <h3 className="font-bold text-foreground text-base line-clamp-1">{selectedTicket.title}</h3>
                  <span className="text-xs text-muted-foreground">
                    Filer: <strong className="text-foreground">{selectedTicket.reporterName}</strong> ({selectedTicket.reporterEmail})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body - Ticket Info & Discussion */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Ticket Metadata Bar */}
              <div className="grid grid-cols-3 gap-3 bg-muted/30 p-3 rounded-xl border border-border text-xs">
                <div>
                  <span className="text-muted-foreground block">Category</span>
                  <span className="font-bold text-foreground capitalize">{selectedTicket.category?.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Priority</span>
                  <select
                    value={selectedTicket.priority}
                    onChange={(e) => updatePriority(selectedTicket._id, e.target.value)}
                    className="font-bold capitalize bg-transparent border-none p-0 text-xs focus:outline-none text-primary cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <span className="text-muted-foreground block">Status</span>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => updateStatus(selectedTicket._id, e.target.value)}
                    className="font-bold capitalize bg-transparent border-none p-0 text-xs focus:outline-none text-emerald-500 cursor-pointer"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Description Card */}
              <div className="bg-background rounded-xl p-4 border border-border space-y-2">
                <span className="text-xs font-bold text-muted-foreground uppercase">Problem Description</span>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Thread Responses */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Conversation Thread ({selectedTicket.responses?.length || 0})
                </h4>

                {(!selectedTicket.responses || selectedTicket.responses.length === 0) ? (
                  <p className="text-xs text-muted-foreground italic">No responses posted yet.</p>
                ) : (
                  selectedTicket.responses.map((resp, idx) => {
                    const isAdmin = resp.senderRole === 'super_admin';
                    return (
                      <div
                        key={idx}
                        className={`rounded-xl p-4 border text-sm space-y-1.5 ${
                          isAdmin
                            ? 'bg-primary/10 border-primary/20 ml-4'
                            : 'bg-secondary/40 border-border mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-foreground flex items-center gap-1">
                            {isAdmin && <Sparkles className="h-3.5 w-3.5 text-primary" />}
                            {resp.senderName} <span className="text-[10px] text-muted-foreground">({resp.senderRole})</span>
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(resp.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-foreground whitespace-pre-wrap">{resp.message}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Modal Footer - Post Reply & Resolve */}
            <div className="p-4 border-t border-border bg-muted/20 space-y-3">
              <form onSubmit={handlePostAdminReply} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type official admin response to client..."
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={postingReply}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-1.5 shrink-0"
                >
                  {postingReply ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Send Reply
                </button>
              </form>

              {selectedTicket.status !== 'resolved' && (
                <div className="flex items-center justify-between pt-1">
                  <input
                    type="text"
                    placeholder="Optional resolution notes..."
                    value={resolutionNotesInput}
                    onChange={(e) => setResolutionNotesInput(e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none w-2/3"
                  />
                  <button
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => resolveTicket(selectedTicket._id, resolutionNotesInput || 'Resolved by Super Admin')}
                    className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white transition-all shadow-sm flex items-center gap-1"
                  >
                    <Check className="h-3.5 w-3.5" /> Resolve Ticket
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
