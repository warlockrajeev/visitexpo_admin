'use client';

/**
 * @file moderation/page.js
 * @description Super Admin Moderation & Approval Console for Organizers, Exhibitors, and Events.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Building2,
  Calendar,
  MapPin,
  Eye,
  FileText,
  Globe,
  Mail,
  Phone,
  AlertTriangle,
  ExternalLink,
  Search,
  Loader2,
  Sparkles,
  Layers,
  Check,
  X,
  UserCheck,
  Building
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ModerationPage() {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState('organizers'); // organizers, exhibitors, claims

  // Data States
  const [pendingOrganizers, setPendingOrganizers] = useState([]);
  const [pendingExhibitors, setPendingExhibitors] = useState([]);
  const [pendingClaims, setPendingClaims] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [claimHistory, setClaimHistory] = useState([]);
  const [organizerHistory, setOrganizerHistory] = useState([]);
  const [exhibitorHistory, setExhibitorHistory] = useState([]);
  const [eventHistory, setEventHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Filter Search
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch pending organizers, exhibitors, and event claims on load
  const fetchModerationData = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const [orgRes, exRes, claimRes, historyRes, orgHistRes, exHistRes, eventRes, eventHistRes] = await Promise.all([
        axios.get(`${API_URL}/admin/pending-organizers`, { headers }),
        axios.get(`${API_URL}/admin/pending-exhibitors`, { headers }),
        axios.get(`${API_URL}/admin/pending-claims`, { headers }),
        axios.get(`${API_URL}/admin/claim-history`, { headers }),
        axios.get(`${API_URL}/admin/organizer-history`, { headers }),
        axios.get(`${API_URL}/admin/exhibitor-history`, { headers }),
        axios.get(`${API_URL}/admin/pending-events`, { headers }),
        axios.get(`${API_URL}/admin/event-history`, { headers })
      ]);

      if (orgRes.data && orgRes.data.success) {
        setPendingOrganizers(orgRes.data.data || []);
      }
      if (exRes.data && exRes.data.success) {
        setPendingExhibitors(exRes.data.data || []);
      }
      if (claimRes.data && claimRes.data.success) {
        setPendingClaims(claimRes.data.data || []);
      }
      if (historyRes.data && historyRes.data.success) {
        setClaimHistory(historyRes.data.data || []);
      }
      if (orgHistRes.data && orgHistRes.data.success) {
        setOrganizerHistory(orgHistRes.data.data || []);
      }
      if (exHistRes.data && exHistRes.data.success) {
        setExhibitorHistory(exHistRes.data.data || []);
      }
      if (eventRes.data && eventRes.data.success) {
        setPendingEvents(eventRes.data.data || []);
      }
      if (eventHistRes.data && eventHistRes.data.success) {
        setEventHistory(eventHistRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load moderation queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModerationData();
  }, [accessToken]);

  // Handle Organizer Action (Approve / Reject)
  const handleOrganizerAction = async (userId, action) => {
    setActionLoadingId(userId);
    setMessage({ type: '', text: '' });
    try {
      const res = await axios.put(
        `${API_URL}/admin/organizers/${userId}/status`,
        { action },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data && res.data.success) {
        setMessage({ type: 'success', text: `Organizer ${action}d successfully!` });
        await fetchModerationData();
      }
    } catch (err) {
      console.error('Organizer action error', err);
      setMessage({ type: 'error', text: err.response?.data?.error || 'Action failed' });
    } finally {
      setActionLoadingId('');
    }
  };

  // Handle Exhibitor Action (Approve / Reject)
  const handleExhibitorAction = async (exhibitorId, status) => {
    setActionLoadingId(exhibitorId);
    setMessage({ type: '', text: '' });
    try {
      const res = await axios.put(
        `${API_URL}/admin/exhibitors/${exhibitorId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data && res.data.success) {
        setMessage({ type: 'success', text: `Exhibitor request set to ${status}!` });
        await fetchModerationData();
      }
    } catch (err) {
      console.error('Exhibitor action error', err);
      setMessage({ type: 'error', text: err.response?.data?.error || 'Action failed' });
    } finally {
      setActionLoadingId('');
    }
  };

  const handleClaimStatusChange = async (claimId, action) => {
    setActionLoadingId(claimId);
    try {
      const res = await axios.put(
        `${API_URL}/admin/claims/${claimId}/status`,
        { action },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data && res.data.success) {
        setMessage({ type: 'success', text: res.data.message });
        await fetchModerationData();
      }
    } catch (err) {
      console.error('Failed to update claim status', err);
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update claim status.' });
    } finally {
      setActionLoadingId('');
    }
  };

  const handleEventAction = async (eventId, action) => {
    setActionLoadingId(eventId);
    setMessage({ type: '', text: '' });
    try {
      const res = await axios.put(
        `${API_URL}/admin/events/${eventId}/status`,
        { action },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data && res.data.success) {
        setMessage({ type: 'success', text: `Event onboarding request set to ${action}d successfully!` });
        await fetchModerationData();
      }
    } catch (err) {
      console.error('Event action error', err);
      setMessage({ type: 'error', text: err.response?.data?.error || 'Action failed' });
    } finally {
      setActionLoadingId('');
    }
  };

  const handleSyncToWordPress = async (eventId) => {
    setActionLoadingId(eventId);
    setMessage({ type: '', text: '' });
    try {
      const res = await axios.put(
        `${API_URL}/admin/events/${eventId}/status`,
        { action: 'approve' },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data && res.data.success) {
        setMessage({ type: 'success', text: 'Event successfully synced to WordPress!' });
        setSelectedEvent(res.data.event);
        await fetchModerationData();
      }
    } catch (err) {
      console.error('WP Sync error', err);
      setMessage({ type: 'error', text: err.response?.data?.error || 'Sync failed. Make sure WordPress API Key is set.' });
    } finally {
      setActionLoadingId('');
    }
  };

  const filteredOrganizers = pendingOrganizers.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.organization?.name && u.organization.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredExhibitors = pendingExhibitors.filter(ex =>
    ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ex.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ex.event?.title && ex.event.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredClaims = pendingClaims.filter(cl =>
    cl.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cl.claimedBy?.name && cl.claimedBy.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (cl.claimedBy?.email && cl.claimedBy.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredClaimHistory = claimHistory.filter(cl =>
    cl.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cl.claimedBy?.name && cl.claimedBy.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (cl.claimedBy?.email && cl.claimedBy.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredOrganizerHistory = organizerHistory.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.organization?.name && u.organization.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredExhibitorHistory = exhibitorHistory.filter(ex =>
    ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ex.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ex.event?.title && ex.event.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredEvents = pendingEvents.filter(evt =>
    evt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (evt.organizer?.name && evt.organizer.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredEventHistory = eventHistory.filter(evt =>
    evt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (evt.organizer?.name && evt.organizer.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-1 rounded-full mb-1">
            <ShieldCheck className="h-3.5 w-3.5" /> Super Admin Moderation Console
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Onboarding Approvals & Moderation Queue
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review and approve new Organizer accounts, Exhibitor requests, and Event Claim applications.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-xl border border-border">
          <button
            onClick={() => setActiveTab('organizers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'organizers'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserCheck className="h-4 w-4" /> Organizers ({pendingOrganizers.length})
          </button>
          <button
            onClick={() => setActiveTab('exhibitors')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'exhibitors'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Building className="h-4 w-4" /> Exhibitors ({pendingExhibitors.length})
          </button>
          <button
            onClick={() => setActiveTab('claims')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'claims'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calendar className="h-4 w-4" /> Event Claims ({pendingClaims.length})
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'events'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calendar className="h-4 w-4" /> Events ({pendingEvents.length})
          </button>
        </div>
      </div>

      {/* Alert Feedback Banner */}
      {message.text && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage({ type: '', text: '' })} className="font-bold">×</button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search pending queue by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          onClick={fetchModerationData}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-secondary border border-border text-foreground hover:bg-secondary/80"
        >
          Refresh Queue
        </button>
      </div>

      {/* TAB 1: PENDING & HISTORICAL ORGANIZER REGISTRATIONS */}
      {activeTab === 'organizers' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-foreground">Pending Organizer Account Registrations</h3>
              <span className="text-xs text-muted-foreground">Approve accounts to grant dashboard access</span>
            </div>

            {loading ? (
              <div className="py-16 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" /> Loading organizer approval queue...
              </div>
            ) : filteredOrganizers.length === 0 ? (
              <div className="py-16 text-center text-xs text-muted-foreground space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-500/40 mx-auto" />
                <p className="font-bold text-foreground">No Pending Organizers</p>
                <p className="text-muted-foreground">All organizer account requests have been processed.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/20 font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="px-6 py-4">Organizer Name</th>
                      <th className="px-6 py-4">Email Credentials</th>
                      <th className="px-6 py-4">Organization Name</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Approval Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredOrganizers.map((user) => (
                      <tr key={user._id} className="hover:bg-secondary/40 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-foreground">{user.name}</p>
                          <span className="text-[10px] text-muted-foreground">Role: {user.role}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-primary">{user.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-foreground">{user.organization?.name || 'New Organization'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            <Clock className="h-3 w-3" /> Pending Approval
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOrganizerAction(user._id, 'reject')}
                              disabled={actionLoadingId === user._id}
                              className="inline-flex items-center gap-1 bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                            >
                              <X className="h-3.5 w-3.5" /> Reject
                            </button>
                            <button
                              onClick={() => handleOrganizerAction(user._id, 'approve')}
                              disabled={actionLoadingId === user._id}
                              className="inline-flex items-center gap-1 bg-emerald-500 text-white hover:bg-emerald-600 px-4 py-1.5 rounded-lg text-xs font-bold shadow transition-all"
                            >
                              {actionLoadingId === user._id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )} Approve Account
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Approved Organizers History Card */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex justify-between items-center bg-muted/10">
              <div>
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" /> Approved Organizers History ({filteredOrganizerHistory.length})
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Approved and verified organizer accounts log</p>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" /> Loading organizer history...
              </div>
            ) : filteredOrganizerHistory.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">No Approved Organizers History</p>
                <p className="text-muted-foreground">Approved organizers will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/20 font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="px-6 py-4">Organizer Name</th>
                      <th className="px-6 py-4">Email Credentials</th>
                      <th className="px-6 py-4">Organization Name</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Approval Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredOrganizerHistory.map((user) => (
                      <tr key={user._id} className="hover:bg-secondary/40 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-foreground">{user.name}</p>
                          <span className="text-[10px] text-muted-foreground">Role: {user.role}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-primary">{user.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-foreground">{user.organization?.name || 'Verified Organization'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase border border-emerald-500/20">
                            <CheckCircle2 className="h-3 w-3" /> Verified & Active
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-muted-foreground font-medium">
                          {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'Recently'}
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

      {/* TAB 2: PENDING & HISTORICAL EXHIBITOR REGISTRATIONS */}
      {activeTab === 'exhibitors' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-foreground">Pending Exhibitor Onboarding Applications</h3>
              <span className="text-xs text-muted-foreground">Approve booths to publish exhibitors live</span>
            </div>

            {loading ? (
              <div className="py-16 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" /> Loading exhibitor queue...
              </div>
            ) : filteredExhibitors.length === 0 ? (
              <div className="py-16 text-center text-xs text-muted-foreground space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-500/40 mx-auto" />
                <p className="font-bold text-foreground">No Pending Exhibitors</p>
                <p className="text-muted-foreground">All exhibitor onboarding requests have been reviewed.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/20 font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="px-6 py-4">Company Name</th>
                      <th className="px-6 py-4">Target Expo Event</th>
                      <th className="px-6 py-4">Booth & Type</th>
                      <th className="px-6 py-4">Contact Info</th>
                      <th className="px-6 py-4 text-right">Approval Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredExhibitors.map((ex) => (
                      <tr key={ex._id} className="hover:bg-secondary/40 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-foreground">{ex.name}</p>
                          <p className="text-[11px] text-muted-foreground max-w-xs truncate">{ex.description}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-primary">{ex.event?.title || 'Expo Event'}</p>
                          <span className="text-[10px] text-muted-foreground">{ex.event?.city}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-foreground">{ex.boothNumber || 'TBD'}</p>
                          <span className="inline-flex items-center rounded-md bg-blue-500/10 text-blue-500 px-2 py-0.5 text-[10px] font-bold uppercase mt-0.5">
                            {ex.attendanceType?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 space-y-0.5">
                          <div className="text-foreground font-semibold">{ex.contactEmail}</div>
                          <div className="text-muted-foreground">{ex.contactPhone}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleExhibitorAction(ex._id, 'rejected')}
                              disabled={actionLoadingId === ex._id}
                              className="inline-flex items-center gap-1 bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                            >
                              <X className="h-3.5 w-3.5" /> Reject
                            </button>
                            <button
                              onClick={() => handleExhibitorAction(ex._id, 'approved')}
                              disabled={actionLoadingId === ex._id}
                              className="inline-flex items-center gap-1 bg-emerald-500 text-white hover:bg-emerald-600 px-4 py-1.5 rounded-lg text-xs font-bold shadow transition-all"
                            >
                              {actionLoadingId === ex._id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )} Approve Booth
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Exhibitors Onboarding History Card */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex justify-between items-center bg-muted/10">
              <div>
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" /> Processed Exhibitors History ({filteredExhibitorHistory.length})
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Approved or rejected exhibitor onboarding logs</p>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" /> Loading exhibitor history...
              </div>
            ) : filteredExhibitorHistory.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">No Processed Exhibitors History</p>
                <p className="text-muted-foreground">Processed exhibitors will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/20 font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="px-6 py-4">Company Name</th>
                      <th className="px-6 py-4">Target Expo Event</th>
                      <th className="px-6 py-4">Booth & Type</th>
                      <th className="px-6 py-4">Contact Info</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Processed Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredExhibitorHistory.map((ex) => (
                      <tr key={ex._id} className="hover:bg-secondary/40 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-foreground">{ex.name}</p>
                          <p className="text-[11px] text-muted-foreground max-w-xs truncate">{ex.description}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-primary">{ex.event?.title || 'Expo Event'}</p>
                          <span className="text-[10px] text-muted-foreground">{ex.event?.city}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-foreground">{ex.boothNumber || 'TBD'}</p>
                          <span className="inline-flex items-center rounded-md bg-blue-500/10 text-blue-500 px-2 py-0.5 text-[10px] font-bold uppercase mt-0.5">
                            {ex.attendanceType?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 space-y-0.5">
                          <div className="text-foreground font-semibold">{ex.contactEmail}</div>
                          <div className="text-muted-foreground">{ex.contactPhone}</div>
                        </td>
                        <td className="px-6 py-4">
                          {ex.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase border border-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3" /> Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 text-destructive px-2.5 py-1 text-[10px] font-bold uppercase border border-destructive/20">
                              <XCircle className="h-3 w-3" /> Rejected
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-muted-foreground font-medium">
                          {ex.updatedAt ? new Date(ex.updatedAt).toLocaleDateString() : 'Recently'}
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

      {/* TAB 3: PENDING & HISTORICAL EVENT CLAIMS */}
      {activeTab === 'claims' && (
        <div className="space-y-6">
          {/* Pending Section */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-foreground">Pending Event Ownership Claims</h3>
              <span className="text-xs text-muted-foreground">Verify domain credentials and approve event claims</span>
            </div>

            {loading ? (
              <div className="py-16 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" /> Loading event claim queue...
              </div>
            ) : filteredClaims.length === 0 ? (
              <div className="py-16 text-center text-xs text-muted-foreground space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-500/40 mx-auto" />
                <p className="font-bold text-foreground">No Pending Event Claims</p>
                <p className="text-muted-foreground">All event claim requests have been reviewed.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/20 font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="px-6 py-4">Event Title</th>
                      <th className="px-6 py-4">Claimant Details</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Approval Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredClaims.map((claim) => (
                      <tr key={claim._id} className="hover:bg-secondary/40 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-foreground">{claim.title}</p>
                          <p className="text-[11px] text-muted-foreground">{claim.venue || 'Exhibition Venue'}, {claim.city}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-primary">{claim.claimedBy?.name || 'Organizer User'}</p>
                          <p className="text-[11px] text-muted-foreground">{claim.claimedBy?.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-md bg-amber-500/10 text-amber-500 px-2.5 py-1 text-[10px] font-bold uppercase">
                            Claim Pending Approval
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleClaimStatusChange(claim._id, 'reject')}
                              disabled={actionLoadingId === claim._id}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-500/20 transition-all"
                            >
                              <X className="h-3.5 w-3.5" /> Reject
                            </button>
                            <button
                              onClick={() => handleClaimStatusChange(claim._id, 'approve')}
                              disabled={actionLoadingId === claim._id}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition-all"
                            >
                              {actionLoadingId === claim._id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Check className="h-3.5 w-3.5" /> Approve Claim
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Approved Claims History Card */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex justify-between items-center bg-muted/10">
              <div>
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" /> Approved Event Claims History ({filteredClaimHistory.length})
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Approved and published event ownership claims history log</p>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" /> Loading claim history...
              </div>
            ) : filteredClaimHistory.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">No Approved Claims History</p>
                <p className="text-muted-foreground">Approved event ownership claims will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/20 font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="px-6 py-4">Event Title</th>
                      <th className="px-6 py-4">Approved Organizer (Claimant)</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Approval Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredClaimHistory.map((claim) => (
                      <tr key={claim._id} className="hover:bg-secondary/40 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-foreground">{claim.title}</p>
                          <p className="text-[11px] text-muted-foreground">{claim.venue || 'Exhibition Venue'}, {claim.city}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-primary">{claim.claimedBy?.name || 'Verified Organizer'}</p>
                          <p className="text-[11px] text-muted-foreground">{claim.claimedBy?.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase border border-emerald-500/20">
                            <CheckCircle2 className="h-3 w-3" /> Approved & Published
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-muted-foreground font-medium">
                          {claim.updatedAt ? new Date(claim.updatedAt).toLocaleDateString() : 'Recently'}
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

      {/* TAB 4: PENDING & HISTORICAL NEW EVENTS */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-foreground">Pending Event Onboarding Submissions</h3>
              <span className="text-xs text-muted-foreground">Approve events to publish them to the frontend</span>
            </div>

            {loading ? (
              <div className="py-16 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" /> Loading event approval queue...
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="py-16 text-center text-xs text-muted-foreground space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-500/40 mx-auto" />
                <p className="font-bold text-foreground">No Pending Events</p>
                <p className="text-muted-foreground">All event onboarding requests have been reviewed.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/20 font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="px-6 py-4">Event Details</th>
                      <th className="px-6 py-4">Organizer</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Approval Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredEvents.map((evt) => (
                      <tr key={evt._id} className="hover:bg-secondary/40 transition-colors group">
                        <td className="px-6 py-4 cursor-pointer font-medium" onClick={() => setSelectedEvent(evt)}>
                          <p className="font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                            {evt.title} <ExternalLink className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                          </p>
                          <p className="text-[11px] text-muted-foreground">{evt.venue || 'Exhibition Venue'}, {evt.city}</p>
                          <p className="text-[10px] text-primary mt-0.5">
                            {evt.startDate ? new Date(evt.startDate).toLocaleDateString() : ''} - {evt.endDate ? new Date(evt.endDate).toLocaleDateString() : ''}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-foreground">{evt.organizer?.name || 'Onboarding Organizer'}</p>
                          <p className="text-[11px] text-muted-foreground">{evt.organizer?.contact?.email || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 text-amber-500 px-2.5 py-1 text-[10px] font-bold uppercase border border-amber-500/20">
                            <Clock className="h-3 w-3" /> Under Review
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEventAction(evt._id, 'reject')}
                              disabled={actionLoadingId === evt._id}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-500/20 transition-all"
                            >
                              <X className="h-3.5 w-3.5" /> Reject
                            </button>
                            <button
                              onClick={() => handleEventAction(evt._id, 'approve')}
                              disabled={actionLoadingId === evt._id}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition-all"
                            >
                              {actionLoadingId === evt._id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Check className="h-3.5 w-3.5" /> Approve Event
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Processed Events History Card */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex justify-between items-center bg-muted/10">
              <div>
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" /> Processed Events History ({filteredEventHistory.length})
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Approved and published or rejected event onboarding logs</p>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" /> Loading event history...
              </div>
            ) : filteredEventHistory.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">No Processed Events History</p>
                <p className="text-muted-foreground">Moderated events will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/20 font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="px-6 py-4">Event Details</th>
                      <th className="px-6 py-4">Organizer</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Moderation Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredEventHistory.map((evt) => (
                      <tr key={evt._id} className="hover:bg-secondary/40 transition-colors group">
                        <td className="px-6 py-4 cursor-pointer font-medium" onClick={() => setSelectedEvent(evt)}>
                          <p className="font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                            {evt.title} <ExternalLink className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                          </p>
                          <p className="text-[11px] text-muted-foreground">{evt.venue || 'Exhibition Venue'}, {evt.city}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-foreground">{evt.organizer?.name || 'Onboarding Organizer'}</p>
                          <p className="text-[11px] text-muted-foreground">{evt.organizer?.contact?.email || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4">
                          {evt.status === 'published' ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase border border-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3" /> Approved & Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 text-destructive px-2.5 py-1 text-[10px] font-bold uppercase border border-destructive/20">
                              <XCircle className="h-3 w-3" /> Rejected / Cancelled
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-muted-foreground font-medium">
                          {evt.updatedAt ? new Date(evt.updatedAt).toLocaleDateString() : 'Recently'}
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

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header Banner Image / Gradient */}
            <div className="h-40 relative bg-gradient-to-r from-primary/20 to-violet-500/20 flex-shrink-0">
              {selectedEvent.banner ? (
                <img
                  src={selectedEvent.banner}
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted/30">
                  <Calendar className="h-12 w-12 opacity-40" />
                </div>
              )}
              {/* Close Button overlay */}
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Scroll Area */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                    selectedEvent.status === 'published'
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : selectedEvent.status === 'cancelled'
                      ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                      : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  }`}>
                    {selectedEvent.status === 'published' ? 'Approved & Published' : selectedEvent.status === 'cancelled' ? 'Rejected' : 'Under Review'}
                  </span>
                  {selectedEvent.isClaimed && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 text-blue-500 px-2.5 py-0.5 text-[10px] font-bold uppercase border border-blue-500/20">
                      Claimed Event
                    </span>
                  )}
                  {selectedEvent.wpPostId && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 text-purple-500 px-2.5 py-0.5 text-[10px] font-bold uppercase border border-purple-500/20">
                      WP Synced
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-extrabold text-foreground leading-snug">
                  {selectedEvent.title}
                </h3>
              </div>

              {/* Grid Info */}
              <div className="grid gap-4 sm:grid-cols-2 bg-muted/20 border border-border p-4 rounded-xl">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Date & Timings</span>
                  <p className="font-bold text-foreground flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-primary" />
                    {selectedEvent.startDate ? new Date(selectedEvent.startDate).toLocaleDateString() : ''} - {selectedEvent.endDate ? new Date(selectedEvent.endDate).toLocaleDateString() : ''}
                  </p>
                  <p className="text-muted-foreground pl-5">{selectedEvent.timings || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Venue & Location</span>
                  <p className="font-bold text-foreground flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" />
                    {selectedEvent.venue || 'Exhibition Venue'}
                  </p>
                  <p className="text-muted-foreground pl-5">{selectedEvent.city}, {selectedEvent.country}</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Event Overview</h4>
                <p className="text-foreground leading-relaxed whitespace-pre-line bg-card p-4 rounded-xl border border-border">
                  {selectedEvent.description || 'No description provided.'}
                </p>
              </div>

              {/* Organizer details */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Organizer Information</h4>
                <div className="bg-card p-4 rounded-xl border border-border space-y-3">
                  <div className="flex items-center gap-3">
                    {selectedEvent.orgLogo ? (
                      <img src={selectedEvent.orgLogo} alt="Org Logo" className="h-10 w-10 object-contain rounded bg-muted p-1 border border-border" />
                    ) : (
                      <Building2 className="h-8 w-8 text-primary" />
                    )}
                    <div>
                      <p className="font-bold text-foreground">{selectedEvent.orgName || selectedEvent.organizer?.name || 'Onboarding Organizer'}</p>
                      <p className="text-[10px] text-muted-foreground">{selectedEvent.orgEmail || selectedEvent.organizer?.contact?.email || 'N/A'}</p>
                    </div>
                  </div>
                  {(selectedEvent.orgPhone || selectedEvent.orgWebsite) && (
                    <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-border/60 pt-2 text-muted-foreground">
                      <div>Phone: <strong className="text-foreground">{selectedEvent.orgPhone || 'N/A'}</strong></div>
                      <div>Website: <a href={selectedEvent.orgWebsite} target="_blank" rel="noreferrer" className="text-primary hover:underline">{selectedEvent.orgWebsite || 'N/A'}</a></div>
                    </div>
                  )}
                  {selectedEvent.orgDesc && (
                    <p className="text-[10px] leading-relaxed text-muted-foreground italic border-t border-border/60 pt-2">
                      {selectedEvent.orgDesc}
                    </p>
                  )}
                </div>
              </div>

              {/* Schedules */}
              {selectedEvent.schedules && selectedEvent.schedules.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Event Agenda / Schedules</h4>
                  <div className="bg-card p-4 rounded-xl border border-border space-y-2">
                    {selectedEvent.schedules.map((sch, idx) => (
                      <div key={idx} className="flex justify-between border-b border-border/50 last:border-0 pb-1.5 last:pb-0">
                        <span className="font-bold text-foreground">{sch.name}</span>
                        <span className="text-muted-foreground font-semibold">{sch.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sponsors */}
              {selectedEvent.sponsorsList && selectedEvent.sponsorsList.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sponsors &amp; Co-Sponsors</h4>
                  <div className="bg-card p-4 rounded-xl border border-border grid gap-2 sm:grid-cols-2">
                    {selectedEvent.sponsorsList.map((sp, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 p-2 rounded-lg border border-border/80 bg-background/50">
                        {sp.logo ? (
                          <img src={sp.logo} alt={sp.name} className="h-7 w-7 object-contain bg-muted rounded p-0.5" />
                        ) : (
                          <div className="h-7 w-7 bg-muted rounded flex items-center justify-center text-[9px] font-bold">LOGO</div>
                        )}
                        <div>
                          <p className="font-bold text-foreground leading-none">{sp.name}</p>
                          <span className="text-[9px] font-bold text-primary">{sp.tier}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FAQs */}
              {selectedEvent.faqsList && selectedEvent.faqsList.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Frequently Asked Questions</h4>
                  <div className="bg-card p-4 rounded-xl border border-border space-y-3">
                    {selectedEvent.faqsList.map((faq, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <p className="font-bold text-foreground">Q: {faq.question}</p>
                        <p className="text-muted-foreground leading-relaxed">A: {faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact shortcode */}
              {selectedEvent.contactShortcode && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Contact Form Shortcode</h4>
                  <div className="bg-card px-4 py-2.5 rounded-xl border border-border font-mono text-[10px] text-foreground">
                    {selectedEvent.contactShortcode}
                  </div>
                </div>
              )}

              {/* SEO details */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">SEO Details</h4>
                <div className="bg-card p-4 rounded-xl border border-border space-y-3">
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Meta Title:</span>
                    <p className="font-semibold text-foreground">{selectedEvent.seo?.metaTitle || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Meta Description:</span>
                    <p className="font-semibold text-foreground">{selectedEvent.seo?.metaDescription || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-border bg-muted/10 flex justify-end gap-2 flex-shrink-0">
              <button
                onClick={() => handleSyncToWordPress(selectedEvent._id)}
                disabled={actionLoadingId === selectedEvent._id}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-md text-xs"
              >
                {actionLoadingId === selectedEvent._id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Syncing...
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4" /> Sync to WordPress
                  </>
                )}
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 font-bold text-foreground transition-all text-xs"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
