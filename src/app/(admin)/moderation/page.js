'use client';

/**
 * @file moderation/page.js
 * @description Super Admin Moderation & Approval Console.
 * Allows Super Admin to:
 * 1. Review 10times Event Onboarding Submissions (Approve live, Request changes, or Reject).
 * 2. Review Event Ownership Claim Requests (Verify official email, website, inspect uploaded proof documents, approve & transfer ownership).
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
  UserCheck
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Mock Pending Events for Admin Moderation
const INITIAL_PENDING_EVENTS = [
  {
    _id: 'evt_mod_1',
    title: 'India International Tech & AI Summit 2026',
    slug: 'india-tech-ai-summit-2026',
    organizerName: 'Global Tech Events Ltd.',
    organizerEmail: 'organizer@visitexpo.in',
    venue: 'Pragati Maidan (Hall 7-10)',
    city: 'New Delhi',
    startDate: '2026-10-15',
    endDate: '2026-10-17',
    category: 'Technology & AI',
    seoScore: 94,
    banner: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80',
    description: 'Premier B2B gathering for AI pioneers, software enterprise leaders, and hardware innovators. Features 200+ exhibitors and keynote conference tracks.',
    submittedAt: '10 mins ago',
    status: 'pending_review'
  },
  {
    _id: 'evt_mod_2',
    title: 'Bharat Renewable Energy & CleanTech Expo',
    slug: 'bharat-renewable-energy-expo',
    organizerName: 'Green Energy Forums Pvt Ltd',
    organizerEmail: 'events@greenenergy.in',
    venue: 'BIEC Convention Hall',
    city: 'Bengaluru',
    startDate: '2026-11-20',
    endDate: '2026-11-22',
    category: 'Renewable Energy & ESG',
    seoScore: 88,
    banner: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1200&q=80',
    description: 'South Asia flagship clean energy exhibition showcasing solar PV, wind turbines, EV charging infrastructure, and hydrogen fuel cells.',
    submittedAt: '2 hours ago',
    status: 'pending_review'
  }
];

// Mock Claim Requests for Admin Moderation
const INITIAL_CLAIM_REQUESTS = [
  {
    id: 'claim_1',
    eventTitle: 'Digital Marketing & E-commerce Expo 2026',
    eventCity: 'Mumbai',
    applicantName: 'Vikramaditya Rao',
    officialEmail: 'vikram@digitalmarketingexpo.in',
    website: 'https://digitalmarketingexpo.in',
    phone: '+91 98765 11223',
    proofDocument: 'Incorporation_Cert_DME2026.pdf',
    submittedAt: '1 hour ago',
    status: 'pending_verification'
  },
  {
    id: 'claim_2',
    eventTitle: 'India International Bio-Pharma Convention',
    eventCity: 'Hyderabad',
    applicantName: 'Dr. Suresh Reddy',
    officialEmail: 'suresh@biopharmaindia.org',
    website: 'https://biopharmaindia.org',
    phone: '+91 99887 76655',
    proofDocument: 'Authorization_Letter_Reddy.pdf',
    submittedAt: '3 hours ago',
    status: 'pending_verification'
  }
];

export default function ModerationPage() {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState('events'); // events, claims
  const [pendingEvents, setPendingEvents] = useState(INITIAL_PENDING_EVENTS);
  const [claimRequests, setClaimRequests] = useState(INITIAL_CLAIM_REQUESTS);
  
  // Selected Item Modal for Review
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);

  // Filter Search
  const [searchTerm, setSearchTerm] = useState('');

  // Handle Event Action (Approve / Reject)
  const handleEventAction = (eventId, action) => {
    setPendingEvents(prev =>
      prev.map(evt => (evt._id === eventId ? { ...evt, status: action === 'approve' ? 'published' : 'rejected' } : evt))
    );
    setSelectedEvent(null);
  };

  // Handle Claim Action (Approve / Reject)
  const handleClaimAction = (claimId, action) => {
    setClaimRequests(prev =>
      prev.map(c => (c.id === claimId ? { ...c, status: action === 'approve' ? 'approved' : 'rejected' } : c))
    );
    setSelectedClaim(null);
  };

  const filteredPendingEvents = pendingEvents.filter(evt =>
    evt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    evt.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClaims = claimRequests.filter(c =>
    c.eventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.officialEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header Banner */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-1 rounded-full mb-1">
            <ShieldCheck className="h-3.5 w-3.5" /> Super Admin Moderation Console
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            10times Moderation & Approvals Queue
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review new event onboarding submissions, verify domain credentials, and approve directory ownership claims.
          </p>
        </div>

        {/* Action Tabs */}
        <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-xl border border-border">
          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'events'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="h-4 w-4" /> Event Submissions ({pendingEvents.filter(e => e.status === 'pending_review').length})
          </button>
          <button
            onClick={() => setActiveTab('claims')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'claims'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShieldCheck className="h-4 w-4" /> Claim Requests ({claimRequests.filter(c => c.status === 'pending_verification').length})
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter queue by title or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* TAB 1: PENDING EVENT SUBMISSIONS */}
      {activeTab === 'events' && (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredPendingEvents.map((evt) => (
            <div
              key={evt._id}
              className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="h-36 bg-muted relative">
                  <img src={evt.banner} alt={evt.title} className="h-full w-full object-cover" />
                  <span className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow border ${
                    evt.status === 'published'
                      ? 'bg-emerald-500 text-white border-emerald-400'
                      : evt.status === 'rejected'
                      ? 'bg-destructive text-white border-destructive'
                      : 'bg-amber-500 text-white border-amber-400 animate-pulse'
                  }`}>
                    {evt.status === 'pending_review' ? 'Pending Review' : evt.status.toUpperCase()}
                  </span>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-primary">{evt.category}</span>
                    <span>Submitted: {evt.submittedAt}</span>
                  </div>

                  <h3 className="text-lg font-bold text-foreground leading-snug line-clamp-1">
                    {evt.title}
                  </h3>

                  <div className="space-y-1 text-xs text-muted-foreground border-t border-border pt-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                      <span className="font-bold text-foreground">{evt.organizerName}</span> ({evt.organizerEmail})
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <span>{evt.venue}, {evt.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      <span>{evt.startDate} to {evt.endDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedEvent(evt)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground bg-card border border-border hover:bg-secondary transition-colors"
                >
                  <Eye className="h-4 w-4 text-primary" /> Full Details
                </button>

                {evt.status === 'pending_review' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEventAction(evt._id, 'reject')}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-destructive border border-destructive/20 hover:bg-destructive/10 transition-colors"
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                    <button
                      onClick={() => handleEventAction(evt._id, 'approve')}
                      className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-md transition-all"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Approve & Publish
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: CLAIM REQUESTS QUEUE */}
      {activeTab === 'claims' && (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border flex justify-between items-center">
            <h3 className="font-bold text-foreground">Pending Event Ownership Claims</h3>
            <span className="text-xs text-muted-foreground">Verify domain email & proof documents</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/20 font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-4">Claimed Event</th>
                  <th className="px-6 py-4">Applicant Credentials</th>
                  <th className="px-6 py-4">Proof Document</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-foreground">{claim.eventTitle}</p>
                      <span className="text-[11px] text-muted-foreground">{claim.eventCity}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-foreground">{claim.applicantName}</p>
                      <p className="text-[11px] text-primary">{claim.officialEmail}</p>
                      <span className="text-[10px] text-muted-foreground">{claim.website}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">
                      <span className="inline-flex items-center gap-1 text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20 cursor-pointer">
                        <FileText className="h-3.5 w-3.5" /> {claim.proofDocument}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        claim.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : claim.status === 'rejected'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-amber-500/10 text-amber-500 animate-pulse'
                      }`}>
                        {claim.status === 'pending_verification' ? 'Pending Check' : claim.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {claim.status === 'pending_verification' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleClaimAction(claim.id, 'reject')}
                            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            title="Decline Claim"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleClaimAction(claim.id, 'approve')}
                            className="inline-flex items-center gap-1 bg-emerald-500 text-white hover:bg-emerald-600 px-3 py-1.5 rounded-lg text-xs font-bold shadow transition-all"
                          >
                            <Check className="h-4 w-4" /> Approve Claim
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Full Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl overflow-y-auto max-h-[90vh] space-y-4">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-6 w-6" />
            </button>

            <h3 className="text-xl font-bold text-foreground">{selectedEvent.title}</h3>
            
            <div className="h-44 rounded-xl overflow-hidden bg-muted">
              <img src={selectedEvent.banner} alt="Banner" className="h-full w-full object-cover" />
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">{selectedEvent.description}</p>

            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-xs">
              <div>
                <span className="text-muted-foreground">Organizer Name:</span>
                <p className="font-bold text-foreground">{selectedEvent.organizerName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Venue & City:</span>
                <p className="font-bold text-foreground">{selectedEvent.venue}, {selectedEvent.city}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                onClick={() => setSelectedEvent(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-secondary"
              >
                Close
              </button>
              {selectedEvent.status === 'pending_review' && (
                <button
                  onClick={() => handleEventAction(selectedEvent._id, 'approve')}
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md"
                >
                  Approve & Publish Live
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
