'use client';

/**
 * @file page.js (Organizations Management)
 * @description Super Admin screen to review business tenants, modify subscriptions plans,
 * update organization variables, and permanently delete tenant organizations.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  Building2,
  Search,
  X,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Mail,
  Phone,
  RefreshCw,
  Users
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function OrganizationsPage() {
  const { accessToken } = useAuth();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');

  // Edit organization Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    plan: ''
  });

  // Delete organization Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetDeleteOrg, setTargetDeleteOrg] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Auto-dismiss toast feedback after 5 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const fetchOrgs = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/admin/organizations`, {
        params: { search: searchTerm, limit: 100 },
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data && res.data.success) {
        setOrgs(res.data.data.docs || []);
      }
    } catch (err) {
      console.error('Fetch orgs failed', err);
      setError('Could not retrieve organizations. Check database seeded records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, [accessToken]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrgs();
  };

  // ==========================================
  // EDIT MODAL HANDLERS
  // ==========================================
  const openEditModal = (org) => {
    setEditingOrg(org);
    setEditForm({
      name: org.name || '',
      email: org.contact?.email || '',
      phone: org.contact?.phone || '',
      address: org.contact?.address || (typeof org.address === 'object' ? `${org.address.street || ''} ${org.address.city || ''}`.trim() : '') || '',
      plan: org.subscription?.plan || 'free'
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingOrg) return;
    setEditSubmitting(true);
    try {
      const res = await axios.put(
        `${API_URL}/admin/organizations/${editingOrg._id}`,
        editForm,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data && res.data.success) {
        setFeedback({
          type: 'success',
          message: `Organization "${editForm.name}" updated successfully.`
        });
        setIsEditModalOpen(false);
        fetchOrgs();
      }
    } catch (err) {
      console.error('Edit org failed', err);
      const errMsg = err.response?.data?.error || 'Could not update organization details';
      setFeedback({ type: 'error', message: errMsg });
    } finally {
      setEditSubmitting(false);
    }
  };

  // ==========================================
  // DELETE MODAL HANDLERS
  // ==========================================
  const openDeleteModal = (org) => {
    setTargetDeleteOrg(org);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!targetDeleteOrg) return;
    setDeleteSubmitting(true);
    try {
      const res = await axios.delete(
        `${API_URL}/admin/organizations/${targetDeleteOrg._id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (res.data && res.data.success) {
        setFeedback({
          type: 'success',
          message: res.data.message || `Organization "${targetDeleteOrg.name}" permanently deleted.`
        });
        setIsDeleteModalOpen(false);
        fetchOrgs();
      }
    } catch (err) {
      console.error('Delete organization failed', err);
      const errMsg = err.response?.data?.error || 'Failed to delete organization.';
      setFeedback({ type: 'error', message: errMsg });
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Computed Plan Counts
  const enterpriseCount = orgs.filter(o => o.subscription?.plan === 'enterprise').length;
  const growthCount = orgs.filter(o => o.subscription?.plan === 'growth').length;
  const freeCount = orgs.filter(o => !o.subscription?.plan || o.subscription?.plan === 'free').length;

  return (
    <div className="space-y-6">
      {/* Toast Feedback Notification */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-600'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
            )}
            <span className="text-sm font-medium">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header banner with Stats Chips */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" /> Business Tenants &amp; Organizations
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Oversee registered organizer corporations, edit contact metadata, manage subscription tiers, and delete organizations.
          </p>
        </div>

        {/* Quick KPI Stats Chips */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-border bg-background shadow-2xs">
            <span className="text-xs font-semibold text-muted-foreground">Total Tenants:</span>
            <span className="text-sm font-bold text-foreground">{orgs.length}</span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-emerald-700">Enterprise:</span>
            <span className="text-sm font-bold text-emerald-700">{enterpriseCount}</span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-primary/20 bg-primary/5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs font-semibold text-primary">Growth:</span>
            <span className="text-sm font-bold text-primary">{growthCount}</span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-zinc-500/20 bg-zinc-500/5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-zinc-400" />
            <span className="text-xs font-semibold text-zinc-600">Free Tier:</span>
            <span className="text-sm font-bold text-zinc-700">{freeCount}</span>
          </div>
          <button
            type="button"
            onClick={fetchOrgs}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border hover:bg-secondary text-xs font-semibold text-foreground transition-colors cursor-pointer"
            title="Refresh organizations list"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card p-4 rounded-xl border border-border">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 md:max-w-md flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search organizations by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-secondary hover:bg-secondary/80 border border-border px-4 py-2 text-sm font-semibold text-foreground cursor-pointer transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Orgs list */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Fetching tenant databases...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center text-muted-foreground gap-3">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <h3 className="font-semibold text-foreground">Error Connecting</h3>
            <p className="text-sm max-w-md">{error}</p>
          </div>
        ) : orgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
            <Building2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs font-semibold">No organizations match search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-4">Organization Tenant</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Subscription Plan</th>
                  <th className="px-6 py-4">Team Size</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orgs.map((org) => (
                  <tr key={org._id} className="hover:bg-secondary/40 transition-colors">
                    {/* Organization Tenant Name & Address */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {(org.name || 'O').charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{org.name}</p>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {org.contact?.address || (typeof org.address === 'object' ? `${org.address.city || ''} ${org.address.country || ''}`.trim() : '') || 'No address specified'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="px-6 py-4 text-xs">
                      <p className="flex items-center gap-1.5 text-foreground font-medium">
                        <Mail className="h-3 w-3 text-muted-foreground" /> {org.contact?.email || 'N/A'}
                      </p>
                      <p className="flex items-center gap-1.5 text-muted-foreground mt-0.5">
                        <Phone className="h-3 w-3 text-muted-foreground" /> {org.contact?.phone || 'N/A'}
                      </p>
                    </td>

                    {/* Subscription Plan */}
                    <td className="px-6 py-4 capitalize font-semibold">
                      <span
                        className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold uppercase ${
                          org.subscription?.plan === 'enterprise'
                            ? 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20'
                            : org.subscription?.plan === 'growth'
                            ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                            : 'bg-zinc-500/10 text-zinc-600 ring-1 ring-zinc-500/20'
                        }`}
                      >
                        {org.subscription?.plan || 'free'}
                      </span>
                    </td>

                    {/* Team Size */}
                    <td className="px-6 py-4 text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {org.teamMembers?.length || 0} Members
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => openEditModal(org)}
                          className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground border border-transparent hover:border-border transition-colors cursor-pointer"
                          title="Edit Organization Details"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => openDeleteModal(org)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer"
                          title="Permanently Delete Organization"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* ========================================================================= */}
      {/* 1. DELETE ORGANIZATION CONFIRMATION MODAL                                 */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && targetDeleteOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Icon & Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Permanently Delete Organization</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>

            {/* Warning Details Body */}
            <div className="p-3.5 bg-rose-500/5 rounded-xl border border-rose-500/20 text-xs text-muted-foreground space-y-2">
              <p className="font-semibold text-rose-700">
                Are you sure you want to permanently delete this business tenant?
              </p>
              <div className="bg-background/80 p-3 rounded-lg border border-border space-y-1">
                <p className="text-foreground font-bold text-sm">{targetDeleteOrg.name}</p>
                <p className="text-muted-foreground text-xs">{targetDeleteOrg.contact?.email || 'No email registered'}</p>
                <div className="flex items-center gap-3 pt-1 text-[11px] text-zinc-500">
                  <span>Plan: <strong className="uppercase text-foreground">{targetDeleteOrg.subscription?.plan || 'free'}</strong></span>
                  <span>•</span>
                  <span>Team Size: <strong className="text-foreground">{targetDeleteOrg.teamMembers?.length || 0} Members</strong></span>
                </div>
              </div>
              <p className="text-[11px] text-zinc-500">
                Linked events, user accounts, and exhibitors will be disassociated from this organization. The tenant document will be permanently removed.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleteSubmitting}
                className="rounded-lg border border-border hover:bg-secondary px-4 py-2 text-sm font-semibold text-foreground transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteSubmitting}
                className="flex items-center gap-2 rounded-lg bg-destructive hover:bg-destructive/90 px-4 py-2 text-sm font-bold text-destructive-foreground shadow-md transition-colors cursor-pointer"
              >
                {deleteSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. EDIT ORGANIZATION MODAL                                                */}
      {/* ========================================================================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-6 w-6" />
            </button>
            <h3 className="text-xl font-bold text-foreground mb-4">Edit Organization Tenant</h3>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Tenant Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Email Address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Phone Number</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Address Location</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Subscription Tier Plan</label>
                <select
                  value={editForm.plan}
                  onChange={(e) => setEditForm(prev => ({ ...prev, plan: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                >
                  <option value="free">Free Tier Pass</option>
                  <option value="growth">Growth Plan Tier</option>
                  <option value="enterprise">Enterprise VIP Tier</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={editSubmitting}
                  className="rounded-lg border border-border hover:bg-secondary px-4 py-2 text-sm font-semibold text-foreground transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/90 px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md transition-colors cursor-pointer"
                >
                  {editSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
