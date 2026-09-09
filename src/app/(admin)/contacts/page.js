'use client';

/**
 * @file page.js (Contact Inquiries Dashboard)
 * @description Super Admin screen to view, inspect, manage, and respond to direct assistance inquiries submitted from the VisitExpo landing page.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  Mail,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Loader2,
  Trash2,
  ExternalLink,
  MessageSquare,
  MessageCircle,
  RefreshCw,
  Phone,
  User,
  Building,
  Store,
  Filter,
  Send,
  Eye,
  Calendar,
  Inbox,
  Check,
  Megaphone,
  Bell,
  ShieldCheck
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ContactInquiriesPage() {
  const { accessToken } = useAuth();
  
  // Data state
  const [inquiries, setInquiries] = useState([]);
  const [stats, setStats] = useState({ total: 0, new: 0, in_progress: 0, responded: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  // Detail Modal State
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [notesSavedSuccess, setNotesSavedSuccess] = useState(false);

  // Fetch inquiries from API
  const fetchInquiries = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/contact`, {
        params: {
          search: searchTerm,
          status: statusFilter,
          role: roleFilter,
          source: sourceFilter !== 'all' ? sourceFilter : undefined,
          limit: 100
        },
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (res.data?.success) {
        setInquiries(res.data.data || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load contact inquiries:', err);
      setError('Could not retrieve contact inquiries. Ensure backend server is running and accessible.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [accessToken, statusFilter, roleFilter, sourceFilter]);

  // Handle Search Submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInquiries();
  };

  // Open Detail Modal
  const handleOpenDetail = (inquiry) => {
    setSelectedInquiry(inquiry);
    setAdminNotes(inquiry.adminNotes || '');
    setNotesSavedSuccess(false);
  };

  // Update Status
  const handleStatusChange = async (inquiryId, newStatus) => {
    setUpdatingStatus(true);
    try {
      const res = await axios.patch(
        `${API_URL}/contact/${inquiryId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (res.data?.success) {
        setInquiries((prev) =>
          prev.map((item) => (item._id === inquiryId ? { ...item, status: newStatus } : item))
        );
        if (selectedInquiry && selectedInquiry._id === inquiryId) {
          setSelectedInquiry((prev) => ({ ...prev, status: newStatus }));
        }
        // Update stats
        fetchInquiries();
      }
    } catch (err) {
      console.error('Failed to update inquiry status:', err);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Save Admin Notes
  const handleSaveNotes = async () => {
    if (!selectedInquiry) return;
    setSavingNotes(true);
    try {
      const res = await axios.patch(
        `${API_URL}/contact/${selectedInquiry._id}`,
        { adminNotes },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (res.data?.success) {
        setInquiries((prev) =>
          prev.map((item) => (item._id === selectedInquiry._id ? { ...item, adminNotes } : item))
        );
        setSelectedInquiry((prev) => ({ ...prev, adminNotes }));
        setNotesSavedSuccess(true);
        setTimeout(() => setNotesSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save notes:', err);
      alert('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  // Delete Inquiry
  const handleDeleteInquiry = async (inquiryId) => {
    if (!window.confirm('Are you sure you want to permanently delete this contact inquiry?')) return;
    try {
      const res = await axios.delete(`${API_URL}/contact/${inquiryId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data?.success) {
        setInquiries((prev) => prev.filter((item) => item._id !== inquiryId));
        if (selectedInquiry?._id === inquiryId) {
          setSelectedInquiry(null);
        }
        fetchInquiries();
      }
    } catch (err) {
      console.error('Failed to delete inquiry:', err);
      alert('Could not delete inquiry.');
    }
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Role Badge Styling
  const getRoleBadge = (role) => {
    switch (role) {
      case 'Organizer':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-500 border border-amber-500/20">
            <Building className="h-3 w-3" />
            Organizer
          </span>
        );
      case 'Exhibitor':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-pink-500/10 px-2 py-0.5 text-[11px] font-bold text-pink-500 border border-pink-500/20">
            <Store className="h-3 w-3" />
            Exhibitor
          </span>
        );
      case 'Visitor':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-bold text-blue-500 border border-blue-500/20">
            <User className="h-3 w-3" />
            Visitor
          </span>
        );
      case 'Advertiser':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-[11px] font-bold text-purple-400 border border-purple-500/20">
            <Megaphone className="h-3 w-3" />
            Advertiser
          </span>
        );
      case 'Subscriber':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-500 border border-emerald-500/20">
            <Bell className="h-3 w-3" />
            Subscriber
          </span>
        );
      case 'Claimant':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 px-2 py-0.5 text-[11px] font-bold text-indigo-400 border border-indigo-500/20">
            <ShieldCheck className="h-3 w-3" />
            Claimant
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-500/10 px-2 py-0.5 text-[11px] font-bold text-zinc-400 border border-zinc-500/20">
            {role || 'Other'}
          </span>
        );
    }
  };

  // Form Source Badge Styling
  const getSourceBadge = (source) => {
    switch (source) {
      case 'advertise_modal':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-purple-400 border border-purple-500/20">
            Ad Modal
          </span>
        );
      case 'newsletter':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
            Newsletter
          </span>
        );
      case 'landing_contact':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground border border-border">
            Landing Form
          </span>
        );
    }
  };

  // Status Badge Styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            New
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-500 border border-amber-500/20">
            <Clock className="h-3 w-3" />
            In Progress
          </span>
        );
      case 'responded':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-500 border border-blue-500/20">
            <CheckCircle2 className="h-3 w-3" />
            Responded
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-500/10 px-2.5 py-0.5 text-xs font-semibold text-zinc-400 border border-zinc-500/20">
            Archived
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Panel */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Mail className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Contact Inquiries
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1.5">
            Incoming direct assistance messages and onboarding requests submitted via the VisitExpo landing page contact section.
          </p>
        </div>

        <button
          onClick={fetchInquiries}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border px-4 py-2 text-xs font-semibold text-foreground transition-colors self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total */}
        <div className="bg-card p-5 rounded-2xl border border-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-muted-foreground">Total Inquiries</span>
            <p className="text-2xl font-extrabold text-foreground mt-1">{stats.total || inquiries.length}</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
            <Inbox className="h-5 w-5" />
          </div>
        </div>

        {/* New / Action Required */}
        <div className="bg-card p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              New / Unread
            </span>
            <p className="text-2xl font-extrabold text-foreground mt-1">{stats.new || 0}</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-card p-5 rounded-2xl border border-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-muted-foreground">In Progress</span>
            <p className="text-2xl font-extrabold text-foreground mt-1">{stats.in_progress || 0}</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        {/* Responded */}
        <div className="bg-card p-5 rounded-2xl border border-border shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-muted-foreground">Responded</span>
            <p className="text-2xl font-extrabold text-foreground mt-1">{stats.responded || 0}</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* Search & Filtering Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border">
        
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 md:max-w-md flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search sender, email, or message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-secondary hover:bg-secondary/80 border border-border px-3.5 py-2 text-xs font-semibold text-foreground cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="Organizer">Organizer</option>
              <option value="Exhibitor">Exhibitor</option>
              <option value="Visitor">Visitor</option>
              <option value="Advertiser">Advertiser</option>
              <option value="Subscriber">Subscriber</option>
              <option value="Claimant">Claimant</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Source Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Source:</span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="all">All Sources</option>
              <option value="landing_contact">Landing Form</option>
              <option value="advertise_modal">Advertise Modal</option>
              <option value="newsletter">Newsletter</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="responded">Responded</option>
              <option value="archived">Archived</option>
            </select>
          </div>

        </div>
      </div>

      {/* Inquiries Table */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-semibold">Loading landing page inquiries...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-muted-foreground gap-3">
            <AlertCircle className="h-9 w-9 text-destructive" />
            <h4 className="font-semibold text-foreground text-sm">Failed to Load Inquiries</h4>
            <p className="text-xs max-w-md">{error}</p>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
            <Mail className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-foreground">No Contact Inquiries Found</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Inquiries submitted through the landing page contact form will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="px-5 py-3.5">Sender &amp; Role</th>
                  <th className="px-5 py-3.5">Contact Details</th>
                  <th className="px-5 py-3.5">Message Snippet</th>
                  <th className="px-5 py-3.5">Received</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {inquiries.map((inq) => (
                  <tr key={inq._id} className="hover:bg-secondary/40 transition-colors">
                    
                    {/* Sender Profile */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 uppercase text-xs">
                          {inq.name ? inq.name.charAt(0) : 'V'}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{inq.name}</p>
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            {getRoleBadge(inq.role)}
                            {getSourceBadge(inq.source)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email & Phone */}
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <a
                          href={`mailto:${inq.email}`}
                          className="font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                        >
                          <span>{inq.email}</span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </a>
                        {inq.phone && (
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{inq.phone}</span>
                            <a
                              href={`https://wa.me/${inq.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold text-emerald-500 hover:underline inline-flex items-center gap-0.5"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="h-2.5 w-2.5" />
                              <span>WA</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Message Preview */}
                    <td className="px-5 py-4 max-w-xs">
                      <p className="line-clamp-2 text-muted-foreground leading-relaxed">
                        {inq.message}
                      </p>
                      {inq.adminNotes && (
                        <div className="mt-1 text-[10px] text-amber-500 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          <span>Internal Note Attached</span>
                        </div>
                      )}
                    </td>

                    {/* Received Date */}
                    <td className="px-5 py-4 whitespace-nowrap text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                        <span>{formatDate(inq.createdAt)}</span>
                      </div>
                    </td>

                    {/* Status Dropdown */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <select
                        value={inq.status}
                        onChange={(e) => handleStatusChange(inq._id, e.target.value)}
                        className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                      >
                        <option value="new">New</option>
                        <option value="in_progress">In Progress</option>
                        <option value="responded">Responded</option>
                        <option value="archived">Archived</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* View Full Message */}
                        <button
                          onClick={() => handleOpenDetail(inq)}
                          className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors cursor-pointer"
                          title="View Full Message &amp; Notes"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {/* Reply via Email */}
                        <a
                          href={`mailto:${inq.email}?subject=Regarding%20your%20inquiry%20on%20VisitExpo&body=Hi%20${encodeURIComponent(inq.name)},%0A%0AThank%20you%20for%20reaching%20out%20to%20the%20VisitExpo%20team.%0A%0A`}
                          className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors cursor-pointer"
                          title="Compose Email Reply"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </a>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteInquiry(inq._id)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                          title="Delete Inquiry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2 flex-wrap">
                <Mail className="h-4.5 w-4.5 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Inquiry Details</h3>
                <span className="ml-2">{getRoleBadge(selectedInquiry.role)}</span>
                <span>{getSourceBadge(selectedInquiry.source)}</span>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              
              {/* Sender Info Card */}
              <div className="p-4 rounded-xl bg-secondary/50 border border-border grid sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Sender Name</span>
                  <p className="font-bold text-sm text-foreground mt-0.5">{selectedInquiry.name}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Email Address</span>
                  <p className="font-semibold text-foreground mt-0.5">
                    <a href={`mailto:${selectedInquiry.email}`} className="text-primary hover:underline">
                      {selectedInquiry.email}
                    </a>
                  </p>
                </div>

                {selectedInquiry.phone && (
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Phone Number</span>
                    <p className="font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
                      <span>{selectedInquiry.phone}</span>
                      <a
                        href={`https://wa.me/${selectedInquiry.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-emerald-500 hover:underline"
                      >
                        (WhatsApp)
                      </a>
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Received Date</span>
                  <p className="font-medium text-foreground mt-0.5">{formatDate(selectedInquiry.createdAt)}</p>
                </div>
              </div>

              {/* Message Content */}
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Message / Requirements
                </span>
                <div className="p-4 rounded-xl bg-background border border-border text-foreground leading-relaxed whitespace-pre-wrap font-normal text-xs">
                  {selectedInquiry.message}
                </div>
              </div>

              {/* Status Update Pill */}
              <div className="pt-2 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Status</span>
                  <div className="flex items-center gap-2">
                    {['new', 'in_progress', 'responded', 'archived'].map((st) => (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(selectedInquiry._id, st)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border capitalize transition-colors cursor-pointer ${
                          selectedInquiry.status === st
                            ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                            : 'bg-background text-muted-foreground border-border hover:bg-secondary'
                        }`}
                      >
                        {st.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Direct Mail Action */}
                <a
                  href={`mailto:${selectedInquiry.email}?subject=Regarding%20your%20inquiry%20on%20VisitExpo&body=Hi%20${encodeURIComponent(selectedInquiry.name)},%0A%0AThank%20you%20for%20reaching%20out%20to%20VisitExpo.%0A%0A`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FFCC00] hover:bg-[#FFB703] text-zinc-950 font-bold px-4 py-2 text-xs transition-colors self-start sm:self-auto cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Direct Email Reply</span>
                </a>
              </div>

              {/* Internal Notes */}
              <div className="pt-2 border-t border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Super Admin Internal Notes
                  </span>
                  {notesSavedSuccess && (
                    <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Note Saved!
                    </span>
                  )}
                </div>
                <textarea
                  rows={3}
                  placeholder="Add internal notes about communication status, next steps, or assigned team member..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border px-3.5 py-1.5 text-xs font-semibold text-foreground cursor-pointer disabled:opacity-50"
                >
                  {savingNotes ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  <span>Save Note</span>
                </button>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
              <button
                onClick={() => handleDeleteInquiry(selectedInquiry._id)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive hover:underline cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Inquiry</span>
              </button>

              <button
                onClick={() => setSelectedInquiry(null)}
                className="rounded-xl bg-secondary hover:bg-secondary/80 border border-border px-4 py-1.5 text-xs font-semibold text-foreground cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
