'use client';

/**
 * @file page.js (User Management)
 * @description Super Admin screen to search system users, edit profile metadata, verify emails, and modify RBAC roles.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  Users,
  Search,
  Plus,
  ShieldCheck,
  X,
  Edit2,
  Loader2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function UsersManagementPage() {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Edit User Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: '',
    isVerified: true
  });

  const fetchUsers = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/admin/users`, {
        params: { search: searchTerm, role: roleFilter, limit: 100 },
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data && res.data.success) {
        setUsers(res.data.data.docs || []);
      }
    } catch (err) {
      console.error('Fetch users failed', err);
      setError('Could not retrieve user database. Ensure super admin credentials are valid.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [accessToken, roleFilter]); // re-run on filters

  // Trigger search on enter / button click
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  // Open Edit Modal
  const openEditModal = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified
    });
    setIsEditModalOpen(true);
  };

  // Submit Edit Form
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(
        `${API_URL}/admin/users/${editingUser._id}`,
        editForm,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.data && res.data.success) {
        setUsers(prev => prev.map(u => (u._id === editingUser._id ? res.data.user : u)));
        setIsEditModalOpen(false);
      }
    } catch (err) {
      console.error('Edit user failed', err);
      alert('Could not update user details');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> User Directory
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Access, inspect, edit roles, and toggle status blocks for all registered system users.
          </p>
        </div>
      </div>

      {/* Control Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card p-4 rounded-xl border border-border">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 md:max-w-md flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search user name or email..."
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

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="organizer">Organizer</option>
            <option value="event_manager">Event Manager</option>
            <option value="sales_team">Sales Team</option>
          </select>
        </div>
      </div>

      {/* Table view */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Fetching user directory...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center text-muted-foreground gap-3">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <h3 className="font-semibold text-foreground">Error Connecting</h3>
            <p className="text-sm max-w-md">{error}</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
            <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs font-semibold">No registered users matched query filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-4">User Profile</th>
                  <th className="px-6 py-4">Tenant Association</th>
                  <th className="px-6 py-4">Email Status</th>
                  <th className="px-6 py-4">System Role</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-foreground">{u.name}</p>
                      <span className="text-xs text-muted-foreground">{u.email}</span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {u.organization?.name || 'Platform (Root)'}
                    </td>
                    <td className="px-6 py-4">
                      {u.isVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500">
                          <CheckCircle className="h-3.5 w-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 px-2.5 py-0.5 text-xs font-medium text-zinc-500">
                          <Clock className="h-3.5 w-3.5" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 capitalize font-medium text-foreground">
                      <span className={`inline-flex rounded px-2 py-0.5 text-xs font-bold uppercase ${
                        u.role === 'super_admin'
                          ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                          : u.role === 'organizer'
                          ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                          : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                      }`}>
                        {u.role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditModal(u)}
                        className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit User Role"
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

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-6 w-6" />
            </button>
            <h3 className="text-xl font-bold text-foreground mb-4">Edit User Account</h3>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

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

              <div className="grid gap-4 grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">System Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="organizer">Organizer</option>
                    <option value="event_manager">Event Manager</option>
                    <option value="sales_team">Sales Team</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Verification</label>
                  <select
                    value={editForm.isVerified}
                    onChange={(e) => setEditForm(prev => ({ ...prev, isVerified: e.target.value === 'true' }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="true">Verified Account</option>
                    <option value="false">Pending Verification</option>
                  </select>
                </div>
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
