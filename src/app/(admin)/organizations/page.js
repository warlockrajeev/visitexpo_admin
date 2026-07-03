'use client';

/**
 * @file page.js (Organizations Management)
 * @description Super Admin screen to review business tenants, modify subscriptions plans, and update organization variables.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  Building2,
  Search,
  X,
  Edit2,
  Loader2,
  AlertCircle,
  ExternalLink,
  MapPin,
  Mail,
  Phone
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function OrganizationsPage() {
  const { accessToken } = useAuth();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');

  // Edit organization Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    plan: ''
  });

  const fetchOrgs = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/admin/organizations`, {
        params: { search: searchTerm },
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

  // Open Edit Modal
  const openEditModal = (org) => {
    setEditingOrg(org);
    setEditForm({
      name: org.name,
      email: org.contact?.email || '',
      phone: org.contact?.phone || '',
      address: org.contact?.address || '',
      plan: org.subscription?.plan || 'free'
    });
    setIsEditModalOpen(true);
  };

  // Submit edit form
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(
        `${API_URL}/admin/organizations/${editingOrg._id}`,
        editForm,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data && res.data.success) {
        setOrgs(prev => prev.map(o => (o._id === editingOrg._id ? res.data.organization : o)));
        setIsEditModalOpen(false);
      }
    } catch (err) {
      console.error('Edit org failed', err);
      alert('Could not update organization details');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" /> Business Tenants
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Oversee active organizer corporations, edit contact metadata, and change subscription tiers.
          </p>
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
            className="rounded-lg bg-secondary hover:bg-secondary/80 border border-border px-4 py-2 text-sm font-semibold text-foreground"
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
            <p className="text-sm">Fetching tenant databases...</p>
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
                    <td className="px-6 py-4">
                      <p className="font-semibold text-foreground">{org.name}</p>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> {org.contact?.address || 'No address'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <p className="flex items-center gap-1.5 text-foreground"><Mail className="h-3 w-3" /> {org.contact?.email || 'N/A'}</p>
                      <p className="flex items-center gap-1.5 text-muted-foreground mt-0.5"><Phone className="h-3 w-3" /> {org.contact?.phone || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4 capitalize font-semibold">
                      <span className={`inline-flex items-center rounded px-2.5 py-0.5 text-xs font-semibold uppercase ${
                        org.subscription?.plan === 'enterprise' 
                          ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20'
                          : org.subscription?.plan === 'growth'
                          ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                          : 'bg-zinc-500/10 text-zinc-500 ring-1 ring-zinc-500/20'
                      }`}>
                        {org.subscription?.plan || 'free'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {org.teamMembers?.length || 0} Members
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditModal(org)}
                        className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit Tenant"
                      >
                        <Edit2 className="h-4.5 w-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Org Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
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
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Phone Number</label>
                  <input
                    type="text"
                    required
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
                  required
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
                  className="rounded-lg border border-border hover:bg-secondary px-4 py-2 text-sm font-semibold text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary hover:bg-primary/90 px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md transition-colors"
                >
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
