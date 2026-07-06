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
  // Data States
  const [pendingOrganizers, setPendingOrganizers] = useState([]);
  const [pendingExhibitors, setPendingExhibitors] = useState([]);
  const [pendingClaims, setPendingClaims] = useState([]);
  const [claimHistory, setClaimHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Filter Search
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch pending organizers, exhibitors, and event claims on load
  const fetchModerationData = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const [orgRes, exRes, claimRes, historyRes] = await Promise.all([
        axios.get(`${API_URL}/admin/pending-organizers`, { headers }),
        axios.get(`${API_URL}/admin/pending-exhibitors`, { headers }),
        axios.get(`${API_URL}/admin/pending-claims`, { headers }),
        axios.get(`${API_URL}/admin/claim-history`, { headers })
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
        setPendingOrganizers(prev => prev.filter(u => u._id !== userId));
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
        setPendingExhibitors(prev => prev.filter(ex => ex._id !== exhibitorId));
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

      {/* TAB 1: PENDING ORGANIZER REGISTRATIONS */}
      {activeTab === 'organizers' && (
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
      )}

      {/* TAB 2: PENDING EXHIBITOR REGISTRATIONS */}
      {activeTab === 'exhibitors' && (
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
    </div>
  );
}
