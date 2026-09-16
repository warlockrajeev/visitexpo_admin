'use client';

/**
 * @file reviews/page.js
 * @description Admin Reviews Management Page.
 * Shows all user-submitted reviews with moderation controls:
 * approve, reject, feature on landing page, delete.
 */

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  MessageSquare,
  Star,
  CheckCircle2,
  XCircle,
  Award,
  Trash2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  ThumbsUp,
  Loader2,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function AdminReviewsPage() {
  const { accessToken } = useAuth();

  // Data State
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, featured: 0, featuredOnLanding: 0, total: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');

  // Action State
  const [actionLoading, setActionLoading] = useState({});
  const [expandedReview, setExpandedReview] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery) params.set('search', searchQuery);
      if (ratingFilter) params.set('rating', ratingFilter);
      params.set('page', page);
      params.set('limit', 20);

      const res = await axios.get(`${API_URL}/reviews/admin/all?${params.toString()}`, { headers });
      if (res.data?.success) {
        setReviews(res.data.data || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, statusFilter, searchQuery, ratingFilter, page]);

  useEffect(() => {
    if (accessToken) fetchReviews();
  }, [accessToken, fetchReviews]);

  const handleStatusChange = async (reviewId, newStatus) => {
    setActionLoading(prev => ({ ...prev, [reviewId]: newStatus }));
    try {
      await axios.put(`${API_URL}/reviews/admin/${reviewId}/status`, { status: newStatus }, { headers });
      fetchReviews();
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [reviewId]: null }));
    }
  };

  const handleFeatureToggle = async (reviewId) => {
    setActionLoading(prev => ({ ...prev, [`feature_${reviewId}`]: true }));
    try {
      await axios.put(`${API_URL}/reviews/admin/${reviewId}/feature`, {}, { headers });
      fetchReviews();
    } catch (err) {
      console.error('Error toggling feature:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [`feature_${reviewId}`]: false }));
    }
  };

  const handleDelete = async (reviewId) => {
    setActionLoading(prev => ({ ...prev, [`delete_${reviewId}`]: true }));
    try {
      await axios.delete(`${API_URL}/reviews/admin/${reviewId}`, { headers });
      setDeleteConfirm(null);
      fetchReviews();
    } catch (err) {
      console.error('Error deleting review:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [`delete_${reviewId}`]: false }));
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const statusBadge = (status) => {
    const map = {
      pending: { bg: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock, label: 'Pending' },
      approved: { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2, label: 'Approved' },
      rejected: { bg: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, label: 'Rejected' },
      featured: { bg: 'bg-purple-100 text-purple-800 border-purple-200', icon: Award, label: 'Featured' }
    };
    const s = map[status] || map.pending;
    const Icon = s.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${s.bg}`}>
        <Icon className="h-3 w-3" />
        {s.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Reviews Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Moderate user-submitted reviews · Approve the best ones for the landing page
          </p>
        </div>
        <button
          onClick={fetchReviews}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-card border border-border hover:bg-muted transition-colors cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total', count: stats.total, color: 'text-foreground', bg: 'bg-card' },
          { label: 'Pending', count: stats.pending, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
          { label: 'Approved', count: stats.approved, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
          { label: 'Featured', count: stats.featured, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
          { label: 'Rejected', count: stats.rejected, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
          { label: 'On Landing', count: stats.featuredOnLanding, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' }
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border border-border rounded-xl p-3 text-center`}>
            <p className={`text-lg font-bold ${s.color}`}>{s.count}</p>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, event, headline..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          {['all', 'pending', 'approved', 'featured', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                statusFilter === s
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-foreground border-border hover:bg-muted'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Rating Filter */}
        <select
          value={ratingFilter}
          onChange={(e) => { setRatingFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl text-xs border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
        >
          <option value="">All Ratings</option>
          <option value="5">★★★★★ (5)</option>
          <option value="4">★★★★☆ (4)</option>
          <option value="3">★★★☆☆ (3)</option>
          <option value="2">★★☆☆☆ (2)</option>
          <option value="1">★☆☆☆☆ (1)</option>
        </select>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground space-y-2">
          <MessageSquare className="h-10 w-10 mx-auto opacity-40" />
          <p className="text-sm font-bold">No reviews found</p>
          <p className="text-xs">Try adjusting your filters or wait for users to submit reviews.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review._id}
              className={`bg-card border rounded-xl overflow-hidden transition-all duration-200 ${
                review.isFeaturedOnLanding
                  ? 'border-purple-300 dark:border-purple-700 ring-1 ring-purple-200 dark:ring-purple-800'
                  : 'border-border hover:border-muted-foreground/30'
              }`}
            >
              {/* Review Card Header */}
              <div className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Left: Reviewer Info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-border flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {(review.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-foreground">{review.name}</h3>
                        {statusBadge(review.status)}
                        {review.isFeaturedOnLanding && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800">
                            <Eye className="h-3 w-3" />
                            On Landing Page
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {review.title}{review.company ? ` · ${review.company}` : ''} · {review.role}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        <span className="font-bold text-primary">{review.eventTitle}</span>
                        {review.venue ? ` · ${review.venue}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Right: Rating & Date */}
                  <div className="text-right shrink-0 space-y-1">
                    <div className="flex items-center gap-0.5 justify-end">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{formatDate(review.createdAt)}</p>
                    <div className="flex items-center gap-1 justify-end text-[10px] text-muted-foreground">
                      <ThumbsUp className="h-3 w-3" />
                      <span>{review.helpfulCount} helpful</span>
                    </div>
                  </div>
                </div>

                {/* Review Content */}
                <div className="mt-3 space-y-1.5">
                  {review.headline && (
                    <p className="text-xs font-bold text-foreground">&ldquo;{review.headline}&rdquo;</p>
                  )}
                  <p className={`text-xs text-muted-foreground leading-relaxed ${
                    expandedReview === review._id ? '' : 'line-clamp-2'
                  }`}>
                    {review.review}
                  </p>
                  {review.review && review.review.length > 150 && (
                    <button
                      type="button"
                      onClick={() => setExpandedReview(expandedReview === review._id ? null : review._id)}
                      className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      {expandedReview === review._id ? 'Show less' : 'Read more'}
                    </button>
                  )}

                  {/* Tags */}
                  {Array.isArray(review.tags) && review.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {review.tags.map((tag, idx) => (
                        <span key={idx} className="text-[9px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-md">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center gap-2">
                  {/* Approve */}
                  {review.status !== 'approved' && review.status !== 'featured' && (
                    <button
                      onClick={() => handleStatusChange(review._id, 'approved')}
                      disabled={!!actionLoading[review._id]}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading[review._id] === 'approved' ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                      Approve
                    </button>
                  )}

                  {/* Reject */}
                  {review.status !== 'rejected' && (
                    <button
                      onClick={() => handleStatusChange(review._id, 'rejected')}
                      disabled={!!actionLoading[review._id]}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading[review._id] === 'rejected' ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      Reject
                    </button>
                  )}

                  {/* Feature on Landing */}
                  <button
                    onClick={() => handleFeatureToggle(review._id)}
                    disabled={!!actionLoading[`feature_${review._id}`]}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50 ${
                      review.isFeaturedOnLanding
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-card border border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-950/30'
                    }`}
                  >
                    {actionLoading[`feature_${review._id}`] ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Award className="h-3 w-3" />
                    )}
                    {review.isFeaturedOnLanding ? 'Remove from Landing' : 'Show on Landing Page'}
                  </button>

                  {/* Mark as Pending */}
                  {review.status !== 'pending' && (
                    <button
                      onClick={() => handleStatusChange(review._id, 'pending')}
                      disabled={!!actionLoading[review._id]}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-card border border-border text-muted-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Clock className="h-3 w-3" />
                      Mark Pending
                    </button>
                  )}

                  {/* Delete */}
                  <div className="ml-auto">
                    {deleteConfirm === review._id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-red-600 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Delete permanently?
                        </span>
                        <button
                          onClick={() => handleDelete(review._id)}
                          disabled={!!actionLoading[`delete_${review._id}`]}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-600 text-white hover:bg-red-700 cursor-pointer disabled:opacity-50"
                        >
                          {actionLoading[`delete_${review._id}`] ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-card border border-border hover:bg-muted cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(review._id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Admin Info */}
                {review.reviewedByAdmin && (
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    Last reviewed by <span className="font-bold">{review.reviewedByAdmin}</span> on {formatDate(review.reviewedAt)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] text-muted-foreground font-medium">
            Showing page {page} of {totalPages} · {total} total reviews
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="h-8 w-8 rounded-lg border border-border bg-card hover:bg-muted flex items-center justify-center cursor-pointer disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="h-8 w-8 rounded-lg border border-border bg-card hover:bg-muted flex items-center justify-center cursor-pointer disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
