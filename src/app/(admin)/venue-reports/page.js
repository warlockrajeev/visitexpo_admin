'use client';

import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { AlertCircle, ExternalLink, Flag, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.js';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const categoryLabels = {
  venue_name: 'Venue name',
  address_location: 'Address or location',
  coordinates: 'Map coordinates',
  contact_information: 'Contact information',
  facilities: 'Facilities or venue details',
  other: 'Other'
};

const statusStyles = {
  pending: 'bg-amber-100 text-amber-800',
  reviewing: 'bg-blue-100 text-blue-800',
  resolved: 'bg-emerald-100 text-emerald-800',
  dismissed: 'bg-zinc-200 text-zinc-700'
};

export default function VenueReportsPage() {
  const { accessToken, loading: authLoading } = useAuth();
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');

  const fetchReports = useCallback(async () => {
    if (authLoading) return;
    if (!accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_URL}/venue-reports/admin/all`, {
        params: { status: statusFilter },
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!response.data?.success || !Array.isArray(response.data.data)) {
        throw new Error(response.data?.error || 'Could not load venue reports.');
      }
      setReports(response.data.data);
    } catch (fetchError) {
      console.error('Failed to load venue reports:', fetchError);
      setError(fetchError.response?.data?.error || fetchError.message || 'Could not load venue reports.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, authLoading, statusFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Load reports when the admin filter or session changes.
    fetchReports();
  }, [fetchReports]);

  const updateStatus = async (reportId, status) => {
    setUpdatingId(reportId);
    setError('');
    try {
      const response = await axios.patch(
        `${API_URL}/venue-reports/admin/${reportId}`,
        { status },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Could not update the report.');
      }
      setReports((current) => (
        statusFilter === 'all'
          ? current.map((report) => (
          report._id === reportId ? { ...report, status } : report
            ))
          : current.filter((report) => report._id !== reportId)
      ));
    } catch (updateError) {
      console.error('Failed to update venue report:', updateError);
      setError(updateError.response?.data?.error || updateError.message || 'Could not update the report.');
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-extrabold text-foreground">Venue information reports</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Review corrections submitted by visitors and update their status.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground"
              aria-label="Filter reports by status"
            >
              <option value="pending">Pending</option>
              <option value="reviewing">Reviewing</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
              <option value="all">All reports</option>
            </select>
            <button
              type="button"
              onClick={fetchReports}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-bold text-foreground hover:bg-secondary disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-12 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading reports...
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Flag className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 font-semibold text-foreground">No reports in this status</p>
          <p className="mt-1 text-sm text-muted-foreground">New venue reports will appear here for review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <article key={report._id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-extrabold text-foreground">{report.venueName}</h3>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${statusStyles[report.status] || statusStyles.pending}`}>
                      {report.status}
                    </span>
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                      {categoryLabels[report.category] || report.category}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{report.description}</p>
                  {report.venueAddress && (
                    <p className="text-xs text-muted-foreground">Venue address: {report.venueAddress}</p>
                  )}
                  {report.imageUrl && (
                    <a
                      href={report.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                    >
                      View supporting image <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Submitted {new Date(report.createdAt).toLocaleString()}
                  </p>
                </div>
                <label className="flex shrink-0 items-center gap-2 text-xs font-bold text-muted-foreground">
                  Update status
                  <select
                    value={report.status}
                    disabled={updatingId === report._id}
                    onChange={(event) => updateStatus(report._id, event.target.value)}
                    className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground disabled:opacity-50"
                    aria-label={`Update status for report about ${report.venueName}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </label>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
