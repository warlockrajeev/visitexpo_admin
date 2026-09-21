'use client';

/**
 * @file moderation/[type]/[id]/page.js
 * @description Dedicated Approval Detail Inspection Page.
 * Allows Super Admin to inspect every applicant detail thoroughly (profile, credentials,
 * target event, staff badges, stall allocations) before approving or rejecting.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext.js';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Building,
  Building2,
  UserCheck,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Globe,
  ExternalLink,
  Users,
  Edit3,
  Check,
  X,
  Send,
  Loader2,
  AlertCircle,
  FileText,
  Layers,
  Sparkles,
  Award
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ModerationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { accessToken } = useAuth();

  const type = params?.type; // 'exhibitors' | 'organizers' | 'events' | 'claims'
  const id = params?.id;

  // Data States
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Booth Edit State (For Exhibitors)
  const [editingBooth, setEditingBooth] = useState(false);
  const [boothInput, setBoothInput] = useState('');
  const [savingBooth, setSavingBooth] = useState(false);

  // Email Notification Modal State
  const [emailModal, setEmailModal] = useState({
    isOpen: false,
    to: '',
    subject: '',
    message: ''
  });
  const [sendingEmail, setSendingEmail] = useState(false);

  // 1. Fetch Item Dossier
  const fetchItemDetail = async () => {
    if (!accessToken || !type || !id) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const res = await axios.get(`${API_URL}/admin/moderation/${type}/${id}`, { headers });
      if (res.data?.success) {
        setData(res.data.data);
        if (res.data.data?.boothNumber) {
          setBoothInput(res.data.data.boothNumber);
        }
      }
    } catch (err) {
      console.error('[ModerationDetail] Failed to load details', err);
      setToast({ type: 'error', message: err.response?.data?.error || 'Failed to load applicant dossier' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemDetail();
  }, [accessToken, type, id]);

  // 2. Handle Approval Action
  const handleAction = async (statusOrAction) => {
    setActionLoading(true);
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };

      if (type === 'exhibitors') {
        const res = await axios.put(
          `${API_URL}/admin/exhibitors/${id}/status`,
          { status: statusOrAction }, // 'approved' | 'rejected' | 'pending'
          { headers }
        );
        if (res.data?.success) {
          setToast({ type: 'success', message: `Exhibitor status updated to ${statusOrAction.toUpperCase()}!` });
          setData(prev => ({ ...prev, status: statusOrAction }));
        }
      } else if (type === 'organizers') {
        const action = statusOrAction === 'approved' ? 'approve' : 'reject';
        const res = await axios.put(
          `${API_URL}/admin/organizers/${id}/status`,
          { action },
          { headers }
        );
        if (res.data?.success) {
          setToast({ type: 'success', message: `Organizer account ${action}d successfully!` });
          setData(prev => ({ ...prev, isVerified: action === 'approve' }));
        }
      } else if (type === 'events' || type === 'claims') {
        const action = statusOrAction === 'approved' ? 'approve' : 'reject';
        const endpoint = type === 'claims' ? `/admin/claims/${id}/status` : `/admin/events/${id}/status`;
        const res = await axios.put(`${API_URL}${endpoint}`, { action }, { headers });
        if (res.data?.success) {
          setToast({ type: 'success', message: `Event request ${action}d successfully!` });
          setData(prev => ({ ...prev, status: action === 'approve' ? 'published' : 'rejected' }));
        }
      }
    } catch (err) {
      console.error('[ModerationDetail] Action failed', err);
      setToast({ type: 'error', message: err.response?.data?.error || 'Failed to execute moderation action' });
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Handle Booth Save (for Exhibitors)
  const handleSaveBooth = async () => {
    if (!boothInput.trim()) return;
    setSavingBooth(true);
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const res = await axios.put(
        `${API_URL}/exhibitors/${id}`,
        { boothNumber: boothInput.trim() },
        { headers }
      );
      if (res.data?.success) {
        setToast({ type: 'success', message: `Stall booth assigned as "${boothInput.trim()}"!` });
        setData(prev => ({ ...prev, boothNumber: boothInput.trim() }));
        setEditingBooth(false);
      }
    } catch (err) {
      console.error('[ModerationDetail] Failed to update booth', err);
      setToast({ type: 'error', message: 'Failed to assign booth number' });
    } finally {
      setSavingBooth(false);
    }
  };

  // 4. Handle Send Direct Notification Email
  const handleOpenEmailModal = () => {
    const recipientEmail = data?.contactEmail || data?.email || '';
    const recipientName = data?.name || 'Applicant';
    setEmailModal({
      isOpen: true,
      to: recipientEmail,
      subject: `Official Notification: Application Status for VisitExpo`,
      message: `Dear ${recipientName},\n\nWe are contacting you regarding your application submitted to VisitExpo.\n\nBest regards,\nVisitExpo Administrator Team\nsupport@visitexpo.in`
    });
  };

  const handleSendEmailSubmit = async (e) => {
    e.preventDefault();
    setSendingEmail(true);
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const res = await axios.post(`${API_URL}/admin/send-notification`, emailModal, { headers });
      if (res.data?.success) {
        setToast({ type: 'success', message: `Email sent successfully to ${emailModal.to}!` });
        setEmailModal({ isOpen: false, to: '', subject: '', message: '' });
      }
    } catch (err) {
      console.error('Failed to send email', err);
      setToast({ type: 'error', message: err.response?.data?.error || 'Failed to send email' });
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-xs text-muted-foreground gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="font-semibold text-foreground">Loading applicant inspection dossier...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-card border border-border rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <h3 className="text-xl font-bold text-foreground">Application Record Not Found</h3>
        <p className="text-xs text-muted-foreground">
          The requested {type} record could not be found or may have been deleted.
        </p>
        <Link
          href="/moderation"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Moderation Queue
        </Link>
      </div>
    );
  }

  // Derive status
  const currentStatus =
    type === 'organizers'
      ? data.isVerified
        ? 'approved'
        : 'pending'
      : data.status || 'pending';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-xs font-semibold animate-in slide-in-from-bottom-5 duration-200 ${
          toast.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
            : 'bg-destructive/10 border-destructive/30 text-destructive'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Top Breadcrumbs & Back Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/moderation" className="hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Approval System
          </Link>
          <span>/</span>
          <span className="capitalize font-semibold text-muted-foreground">{type}</span>
          <span>/</span>
          <span className="font-bold text-foreground truncate max-w-[200px]">{data.name || data.title}</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/moderation"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-secondary text-xs font-semibold text-foreground transition-all"
          >
            Queue List
          </Link>
          <button
            onClick={handleOpenEmailModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/20 bg-primary/10 hover:bg-primary/20 text-xs font-bold text-primary transition-all"
          >
            <Mail className="h-3.5 w-3.5" /> Send Email
          </button>
        </div>
      </div>

      {/* Hero Dossier Header Banner */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {data.logo ? (
            <img
              src={data.logo}
              alt={data.name}
              className="h-16 w-16 rounded-2xl object-contain bg-background border border-border p-1.5 shadow-sm"
              onError={e => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-2xl shadow-sm">
              {(data.name || data.title)?.charAt(0) || 'A'}
            </div>
          )}

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                {data.name || data.title}
              </h1>
              <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold uppercase border ${
                currentStatus === 'approved' || currentStatus === 'published'
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  : currentStatus === 'rejected'
                  ? 'bg-destructive/10 text-destructive border-destructive/20'
                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse'
              }`}>
                {currentStatus === 'approved' && <CheckCircle2 className="h-3.5 w-3.5" />}
                {currentStatus === 'rejected' && <XCircle className="h-3.5 w-3.5" />}
                {currentStatus === 'pending' && <Clock className="h-3.5 w-3.5" />}
                {currentStatus === 'pending' ? 'Pending Admin Review' : currentStatus}
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              Submitted for moderation review on {new Date(data.createdAt || Date.now()).toLocaleDateString('en-US', { dateStyle: 'medium' })}
            </p>
          </div>
        </div>

        {/* Primary Approval Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {currentStatus === 'pending' ? (
            <>
              <button
                onClick={() => handleAction('rejected')}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-bold transition-all"
              >
                <X className="h-4 w-4" /> Reject Request
              </button>
              <button
                onClick={() => handleAction('approved')}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Approve Application
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleAction('rejected')}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-bold transition-all"
              >
                Revoke / Reject
              </button>
              <button
                onClick={() => handleAction('pending')}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold transition-all"
              >
                Revert to Pending
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Dossier Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 & 2: Entity Details & Deep Inspection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview & Description */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Application Overview & Bio
            </h3>
            <div className="p-4 bg-muted/20 border border-border rounded-xl text-xs text-foreground leading-relaxed">
              {data.description || 'No detailed bio or overview provided by the applicant.'}
            </div>
            {data.website && (
              <div className="pt-2 flex items-center gap-2 text-xs">
                <span className="text-muted-foreground font-semibold">Official Website:</span>
                <a
                  href={data.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1 font-bold"
                >
                  {data.website} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          {/* TYPE-SPECIFIC: EXHIBITOR TARGET EVENT & BOOTH ALLOCATION */}
          {type === 'exhibitors' && (
            <>
              {/* Event Card */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" /> Target Expo Event Information
                </h3>

                {data.event ? (
                  <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-2">
                    <p className="text-base font-bold text-primary">{data.event.title}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{data.event.city || 'India'} {data.event.venue && `• ${data.event.venue}`}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{data.event.startDate ? new Date(data.event.startDate).toLocaleDateString() : 'Dates TBA'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Target event reference is missing or unlinked.</p>
                )}
              </div>

              {/* Booth & Attendance Attributes */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <Building className="h-4 w-4 text-primary" /> Booth Stall Allocation
                  </h3>
                  <span className="text-xs text-muted-foreground font-semibold">
                    Set before approving
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Booth Number with Inline Editor */}
                  <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Stall Booth Number</span>
                    {editingBooth ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          value={boothInput}
                          onChange={e => setBoothInput(e.target.value)}
                          placeholder="e.g. Hall 2 - B14"
                          className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button
                          onClick={handleSaveBooth}
                          disabled={savingBooth}
                          className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold"
                        >
                          {savingBooth ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-lg font-black text-foreground">{data.boothNumber || 'TBD / Not Assigned'}</p>
                        <button
                          onClick={() => setEditingBooth(true)}
                          className="text-xs text-primary hover:underline font-bold flex items-center gap-1"
                        >
                          <Edit3 className="h-3.5 w-3.5" /> Edit Booth
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Attendance Mode */}
                  <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Attendance Mode</span>
                    <p className="text-lg font-black text-foreground uppercase">
                      {data.attendanceType?.replace('_', ' ') || 'In Person'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Registered Staff Badges */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" /> Representative Staff Badges ({data.staff?.length || 0})
                  </h3>
                </div>

                {data.staff && data.staff.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {data.staff.map((st, i) => (
                      <div key={i} className="p-3.5 rounded-xl border border-border bg-card flex flex-col justify-between space-y-2">
                        <div>
                          <p className="font-bold text-foreground text-xs">{st.name}</p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3" /> {st.email}
                          </p>
                        </div>
                        {st.phone && (
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-semibold">
                            <Phone className="h-3 w-3" /> {st.phone}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No staff representatives added with this booth.</p>
                )}
              </div>
            </>
          )}

          {/* TYPE-SPECIFIC: ORGANIZER EVENTS */}
          {type === 'organizers' && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Associated Exhibitions & Expos ({data.events?.length || 0})
              </h3>
              {data.events && data.events.length > 0 ? (
                <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                  {data.events.map((ev) => (
                    <div key={ev._id} className="p-3 flex items-center justify-between text-xs bg-card hover:bg-muted/10">
                      <div>
                        <p className="font-bold text-foreground">{ev.title}</p>
                        <p className="text-[11px] text-muted-foreground">{ev.city} • {ev.venue}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground uppercase">
                        {ev.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No events currently mapped to this organizer.</p>
              )}
            </div>
          )}
        </div>

        {/* Column 3: Contact Coordinates & Login Account Information */}
        <div className="space-y-6">
          {/* Direct Contact Coordinates */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" /> Contact Coordinates
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-muted/10 border border-border space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Contact Email</span>
                <p className="font-bold text-foreground break-all">{data.contactEmail || data.email}</p>
              </div>

              {(data.contactPhone || data.phone) && (
                <div className="p-3 rounded-xl bg-muted/10 border border-border space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Contact Phone</span>
                  <p className="font-bold text-foreground">{data.contactPhone || data.phone}</p>
                </div>
              )}

              {data.organization?.name && (
                <div className="p-3 rounded-xl bg-muted/10 border border-border space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Organization Entity</span>
                  <p className="font-bold text-foreground">{data.organization.name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Associated User Login Account Status */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" /> Login Account Sync
            </h3>

            {data.associatedUser ? (
              <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Account Holder:</span>
                  <span className="font-bold text-foreground">{data.associatedUser.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-semibold text-primary truncate max-w-[150px]">{data.associatedUser.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Role:</span>
                  <span className="font-bold text-foreground uppercase">{data.associatedUser.role}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <span className="text-muted-foreground">Dashboard Access:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                    data.associatedUser.isVerified
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {data.associatedUser.isVerified ? 'Unlocked & Active' : 'Locked Pending Approval'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-border bg-muted/10 text-xs text-muted-foreground">
                <p>No separate user profile detected. When approved, an exhibitor dashboard account will be synced automatically.</p>
              </div>
            )}
          </div>

          {/* Direct Moderation Decision Card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-3">
            <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">Moderation Decision</h4>
            <p className="text-xs text-muted-foreground">
              Approving this application will immediately notify the user, verify their credentials, and publish the booth to the live event directory.
            </p>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => handleAction('approved')}
                disabled={actionLoading}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all"
              >
                <Check className="h-4 w-4" /> Approve & Enable
              </button>
              <button
                onClick={() => handleAction('rejected')}
                disabled={actionLoading}
                className="w-full py-2.5 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <X className="h-4 w-4" /> Reject Request
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Email Modal */}
      {emailModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" /> Send Direct Email Notification
              </h3>
              <button
                onClick={() => setEmailModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSendEmailSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-muted-foreground mb-1 uppercase text-[10px]">Recipient Email</label>
                <input
                  type="email"
                  value={emailModal.to}
                  onChange={e => setEmailModal(prev => ({ ...prev, to: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-muted-foreground mb-1 uppercase text-[10px]">Subject</label>
                <input
                  type="text"
                  value={emailModal.subject}
                  onChange={e => setEmailModal(prev => ({ ...prev, subject: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-muted-foreground mb-1 uppercase text-[10px]">Message Content</label>
                <textarea
                  rows={6}
                  value={emailModal.message}
                  onChange={e => setEmailModal(prev => ({ ...prev, message: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEmailModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-secondary font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  {sendingEmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Send Notification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
