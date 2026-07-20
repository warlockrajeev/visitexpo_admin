'use client';

/**
 * @file page.js (Support & Event Tickets Dashboard)
 * @description Super Admin system support ticket monitoring and Event Ticket Tiers management workspace.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  Tag
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const mockTickets = [
  { id: 'TKT-2451', title: 'Payment Gateway handshakes failing (Stripe)', reporter: 'Amit Rawat (Eco Fair 2026)', email: 'amit@ecoworld.in', priority: 'high', status: 'pending', date: '3 hours ago' },
  { id: 'TKT-2449', title: 'Domain redirect configs (visitexpo.in subdomain)', reporter: 'Sarah Chen (Auto Show)', email: 'sarah@motorsasia.com', priority: 'medium', status: 'pending', date: '1 day ago' },
  { id: 'TKT-2448', title: 'Exhibitor roster staff capacity increment request', reporter: 'Dr. John (MedExpo)', email: 'john@medconnect.org', priority: 'low', status: 'completed', date: '2 days ago' },
  { id: 'TKT-2447', title: 'WordPress webhook secret validation timeouts', reporter: 'Neha Gupta (EduCon)', email: 'neha@educon.org', priority: 'high', status: 'completed', date: '3 days ago' },
  { id: 'TKT-2445', title: 'Virtual stream latency reporting on Chrome mobile', reporter: 'Rajesh Patel (TechExpo)', email: 'rajesh@patelsolutions.in', priority: 'medium', status: 'pending', date: '5 days ago' }
];

export default function SupportTicketsPage() {
  const [activeTab, setActiveTab] = useState('event_tickets'); // 'support' or 'event_tickets'
  const [tickets, setTickets] = useState(mockTickets);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Event Tickets state
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [eventTickets, setEventTickets] = useState([]);
  const [loadingEventTickets, setLoadingEventTickets] = useState(false);

  // Fetch events list on mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(`${API_URL}/events?limit=100`);
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

  // Fetch ticket tiers whenever selected event changes
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

  // Handle Complete status update for support tickets
  const resolveTicket = (tktId) => {
    setTickets(prev => prev.map(t => (t.id === tktId ? { ...t, status: 'completed' } : t)));
  };

  // Handle change priority
  const updatePriority = (tktId, newPriority) => {
    setTickets(prev => prev.map(t => (t.id === tktId ? { ...t, priority: newPriority } : t)));
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.reporter.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && t.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header Panel with Mode Switcher */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {activeTab === 'support' ? <LifeBuoy className="h-6 w-6 text-primary" /> : <TicketIcon className="h-6 w-6 text-primary" />}
            {activeTab === 'support' ? 'Support Helpdesk' : 'Event Ticket Tiers Overview'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {activeTab === 'support'
              ? 'Review support requests filed by event organizers, prioritize bugs, and resolve technical tickets.'
              : 'Inspect created event ticket pricing tiers, visitor capacities, and registration pass settings across all expos.'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex border border-border rounded-xl p-1 bg-muted/20 w-fit shrink-0">
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
          <button
            onClick={() => setActiveTab('support')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'support'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LifeBuoy className="h-4 w-4 text-primary" /> Support Helpdesk
          </button>
        </div>
      </div>

      {/* VIEW 1: EVENT TICKET TIERS */}
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

      {/* VIEW 2: SUPPORT HELPDESK */}
      {activeTab === 'support' && (
        <>
          {/* Control Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
            <div className="flex border border-border rounded-lg p-0.5 bg-muted/20 w-fit">
              {[
                { id: 'all', label: 'All Tickets' },
                { id: 'pending', label: 'Pending' },
                { id: 'completed', label: 'Resolved' }
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

            <div className="relative md:w-72">
              <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by ticket ID, title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Tickets logs */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="px-6 py-4">Ticket Info</th>
                    <th className="px-6 py-4">Filer / Tenant</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTickets.map((t) => {
                    const isPending = t.status === 'pending';
                    return (
                      <tr key={t.id} className="hover:bg-secondary/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-primary">{t.id}</span>
                            <span className="text-xs text-muted-foreground">({t.date})</span>
                          </div>
                          <p className="font-semibold text-foreground mt-0.5">{t.title}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-foreground flex items-center gap-1"><User className="h-3 w-3" /> {t.reporter}</p>
                          <span className="text-xs text-muted-foreground">{t.email}</span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={t.priority}
                            onChange={(e) => updatePriority(t.id, e.target.value)}
                            className={`rounded px-1.5 py-0.5 text-xs font-bold uppercase border bg-background text-center focus:outline-none ${
                              t.priority === 'high'
                                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                : t.priority === 'medium'
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                            }`}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-500">
                              <Clock className="h-3.5 w-3.5" /> Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500">
                              <CheckCircle className="h-3.5 w-3.5" /> Resolved
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isPending && (
                            <button
                              onClick={() => resolveTicket(t.id)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-650 px-2.5 py-1 rounded shadow-sm"
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
          </div>
        </>
      )}
    </div>
  );
}

