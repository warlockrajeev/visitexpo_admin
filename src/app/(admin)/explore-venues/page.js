'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Swal from 'sweetalert2';
import { useAuth } from '../../../context/AuthContext.js';
import { getClientUrl } from '../../../utils/clientUrl.js';
import {
  Building2,
  ExternalLink,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Upload,
  X
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const EMPTY_FORM = {
  name: '',
  slug: '',
  city: '',
  state: '',
  country: 'India',
  totalEvents: 0,
  upcomingEvents: 0,
  searchTerm: '',
  imageUrl: '',
  displayOrder: 1,
  isActive: true
};

export default function AdminExploreVenuesPage() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingItem, setEditingItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const authHeaders = useMemo(
    () => (accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    [accessToken]
  );

  const fetchItems = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/explore-venues/admin/all`, {
        headers: authHeaders
      });
      if (!response.data?.success || !Array.isArray(response.data.data)) {
        throw new Error('The server returned an invalid Explore Venues response.');
      }
      setError('');
      setItems(response.data.data);
    } catch (requestError) {
      const message = requestError.response?.data?.error || requestError.message || 'Could not load Explore Venues.';
      setError(message);
      console.error('Failed to load Explore Venues:', requestError);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    // The request updates state only after its asynchronous response settles.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItems();
  }, [fetchItems]);

  const openCreateForm = () => {
    setEditingItem(null);
    setFormData({ ...EMPTY_FORM, displayOrder: items.length + 1 });
    setIsFormOpen(true);
  };

  const openEditForm = (item) => {
    setEditingItem(item);
    setFormData({
      ...EMPTY_FORM,
      ...item,
      totalEvents: item.totalEvents || 0,
      upcomingEvents: item.upcomingEvents || 0,
      displayOrder: item.displayOrder || 1
    });
    setIsFormOpen(true);
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      await Swal.fire({ icon: 'error', title: 'Invalid file', text: 'Choose an image file.' });
      return;
    }

    const payload = new FormData();
    payload.append('file', file);
    try {
      setUploading(true);
      const response = await axios.post(`${API_URL}/upload`, payload, {
        headers: { ...authHeaders, 'Content-Type': 'multipart/form-data' }
      });
      if (!response.data?.success || !response.data.url) {
        throw new Error(response.data?.error || 'Image upload did not return an image URL.');
      }
      setFormData((current) => ({ ...current, imageUrl: response.data.url }));
    } catch (uploadError) {
      await Swal.fire({
        icon: 'error',
        title: 'Image upload failed',
        text: uploadError.response?.data?.error || uploadError.message || 'Could not upload image.'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const url = editingItem
        ? `${API_URL}/explore-venues/admin/${editingItem._id}`
        : `${API_URL}/explore-venues/admin`;
      const requestOptions = { headers: authHeaders };
      const response = editingItem
        ? await axios.put(url, formData, requestOptions)
        : await axios.post(url, formData, requestOptions);
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Could not save this venue.');
      }
      setIsFormOpen(false);
      await fetchItems();
      await Swal.fire({
        icon: 'success',
        title: editingItem ? 'Venue updated' : 'Venue added',
        timer: 1400,
        showConfirmButton: false
      });
    } catch (saveError) {
      await Swal.fire({
        icon: 'error',
        title: 'Could not save venue',
        text: saveError.response?.data?.error || saveError.message || 'Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Explore Venues</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the venue cards shown in the landing page Explore Venues section.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add venue
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading venues...
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No Explore Venues have been added.</div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => (
              <div key={item._id} className="flex flex-wrap items-center gap-4 p-4 sm:px-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-50 text-blue-700">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt=""
                      width={48}
                      height={48}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Building2 className="h-6 w-6" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-foreground">{item.name}</h2>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      item.isActive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-zinc-100 text-zinc-500'
                    }`}>
                      {item.isActive ? 'Live' : 'Hidden'}
                    </span>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {[item.city, item.state, item.country].filter(Boolean).join(', ')}
                    <span className="mx-1">·</span>
                    {item.totalEvents || 0} events
                  </p>
                </div>
                <a
                  href={`${getClientUrl()}/venue/${item.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={`Preview ${item.name}`}
                  title="Preview venue page"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => openEditForm(item)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={`Edit ${item.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-auto w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {editingItem ? 'Edit Explore Venue' : 'Add Explore Venue'}
                </h2>
                <p className="text-xs text-muted-foreground">Fields marked required must be filled in.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                aria-label="Close form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm font-medium text-foreground">
                  Venue name *
                  <input
                    required
                    maxLength={150}
                    value={formData.name}
                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium text-foreground">
                  Venue page URL slug
                  <input
                    value={formData.slug}
                    onChange={(event) => setFormData({ ...formData, slug: event.target.value })}
                    placeholder="e.g. bharat-mandapam"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium text-foreground">
                  City *
                  <input
                    required
                    value={formData.city}
                    onChange={(event) => setFormData({ ...formData, city: event.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium text-foreground">
                  State / region
                  <input
                    value={formData.state}
                    onChange={(event) => setFormData({ ...formData, state: event.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium text-foreground">
                  Country
                  <input
                    value={formData.country}
                    onChange={(event) => setFormData({ ...formData, country: event.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium text-foreground">
                  Search term
                  <input
                    value={formData.searchTerm}
                    onChange={(event) => setFormData({ ...formData, searchTerm: event.target.value })}
                    placeholder="Search term for this venue"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium text-foreground">
                  Total events
                  <input
                    type="number"
                    min="0"
                    value={formData.totalEvents}
                    onChange={(event) => setFormData({ ...formData, totalEvents: event.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium text-foreground">
                  Upcoming events
                  <input
                    type="number"
                    min="0"
                    value={formData.upcomingEvents}
                    onChange={(event) => setFormData({ ...formData, upcomingEvents: event.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium text-foreground sm:col-span-2">
                  Card image URL (optional)
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(event) => setFormData({ ...formData, imageUrl: event.target.value })}
                      placeholder="Paste an image URL or upload an image"
                      className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                    <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted ${
                      uploading ? 'pointer-events-none opacity-60' : ''
                    }`}>
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Upload
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="sr-only" />
                    </label>
                  </div>
                </label>
                {formData.imageUrl && (
                  <div className="flex items-center gap-3 sm:col-span-2">
                    <Image
                      src={formData.imageUrl}
                      alt="Venue icon preview"
                      width={48}
                      height={48}
                      unoptimized
                      className="h-12 w-12 rounded-xl object-cover"
                    />
                    <span className="text-xs text-muted-foreground">The image replaces the default venue icon.</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: '' })}
                      className="ml-auto text-xs font-semibold text-red-600 hover:underline"
                    >
                      Remove image
                    </button>
                  </div>
                )}
                <label className="space-y-1.5 text-sm font-medium text-foreground">
                  Display order
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(event) => setFormData({ ...formData, displayOrder: event.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.isActive)}
                    onChange={(event) => setFormData({ ...formData, isActive: event.target.checked })}
                    className="h-4 w-4 accent-primary"
                  />
                  Show on landing page
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingItem ? 'Save changes' : 'Add venue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
