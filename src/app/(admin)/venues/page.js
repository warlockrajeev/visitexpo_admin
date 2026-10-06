'use client';

/**
 * @file app/(admin)/venues/page.js
 * @description Super Admin Venue Profiles and Gallery Media Manager.
 * Features:
 * - Displays all exhibition and convention venues across global destinations.
 * - Manage venue cover banners, thumbnail logos, and photo galleries (upload from device or paste image URLs).
 * - Add new photos, delete photos, or set any gallery image as the primary cover banner.
 * - Edit venue metadata (address, metro transit, total area, built year, halls).
 * - Full Dark Mode and Light Mode support with SweetAlert2 animated feedback.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import Pagination from '../../../components/Pagination.js';
import { showSweetSuccess, showSweetError, showSweetConfirm } from '../../../utils/sweetalert.js';
import {
  Building,
  Building2,
  MapPin,
  Search,
  Plus,
  ExternalLink,
  Calendar,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Globe,
  Grid,
  List,
  AlertCircle,
  X,
  ChevronDown,
  Loader2,
  Image as ImageIcon,
  Camera,
  Upload,
  ArrowRight,
  Eye,
  RefreshCw,
  Sparkles,
  Edit,
  Star,
  SlidersHorizontal,
  Check,
  Copy,
  ArrowUpRight,
  Clock,
  Layers
} from 'lucide-react';
import { getClientUrl } from '../../../utils/clientUrl.js';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function VenueFilterAutocomplete({ id, label, icon: Icon, value, options, onChange, ariaLabel }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(query.trim().toLowerCase())
  );
  const selectedOption = options.find((option) => option.value === value) || options[0];

  const selectOption = (option) => {
    onChange(option.value);
    setQuery('');
    setIsOpen(false);
    setIsFocused(false);
  };

  return (
    <div
      className="relative flex min-w-55 flex-1 items-center gap-2 rounded-xl border border-border bg-background px-3 py-2"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
          setIsFocused(false);
          setQuery('');
        }
      }}
    >
      <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <span className="shrink-0 text-[10px] font-bold uppercase text-muted-foreground">{label}</span>
      <div className="relative min-w-0 flex-1">
        <input
          type="text"
          role="combobox"
          aria-label={ariaLabel}
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={`${id}-options`}
          aria-activedescendant={isOpen && filteredOptions[activeIndex]
            ? `${id}-option-${activeIndex}`
            : undefined}
          value={isFocused ? query : selectedOption?.label || ''}
          onFocus={() => {
            setIsFocused(true);
            setQuery('');
            setActiveIndex(0);
            setIsOpen(true);
          }}
          onClick={() => {
            if (!isOpen) {
              setIsFocused(true);
              setQuery('');
              setActiveIndex(0);
              setIsOpen(true);
            }
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setIsOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setIsOpen(true);
              if (filteredOptions.length) {
                setActiveIndex((index) => Math.min(index + 1, filteredOptions.length - 1));
              }
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            } else if (event.key === 'Enter' && isOpen && filteredOptions[activeIndex]) {
              event.preventDefault();
              selectOption(filteredOptions[activeIndex]);
            } else if (event.key === 'Escape') {
              setIsOpen(false);
              setIsFocused(false);
              setQuery('');
            }
          }}
          placeholder={`Search ${label.toLowerCase()}...`}
          className="w-full min-w-0 bg-transparent text-xs font-semibold text-foreground outline-none placeholder:text-muted-foreground"
        />
        <ChevronDown
          className={`pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
        {isOpen && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
            <div id={`${id}-options`} role="listbox" aria-label={`${label} options`} className="max-h-64 overflow-y-auto p-1">
              {filteredOptions.length ? filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  id={`${id}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={value === option.value}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectOption(option)}
                  className={`w-full truncate rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                    activeIndex === index
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  {option.label}
                </button>
              )) : (
                <p className="px-3 py-2 text-xs text-muted-foreground">No matching options</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminVenuesPage() {
  const { accessToken } = useAuth();

  // Venues data states
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & display
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Pagination state
  const [page, setPage] = useState(1);
  const [venuesPerPage, setVenuesPerPage] = useState(9);

  // Image Management Modal State
  const [imageModalVenue, setImageModalVenue] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [bannerInput, setBannerInput] = useState('');
  const [logoInput, setLogoInput] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [savingImages, setSavingImages] = useState(false);

  // Hidden file input refs
  const bannerFileInputRef = useRef(null);
  const logoFileInputRef = useRef(null);
  const galleryFileInputRef = useRef(null);

  // Details Edit Modal State
  const [editModalVenue, setEditModalVenue] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [savingDetails, setSavingDetails] = useState(false);

  // Create Venue Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    shortName: '',
    tagline: '',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    address: '',
    metro: '',
    airportDistance: '',
    heroBanner: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1600&auto=format&fit=crop',
    logoThumbnail: 'https://images.unsplash.com/photo-1541971875076-8f970d573be6?q=80&w=300&auto=format&fit=crop',
    gallery: [],
    overviewDescription: '',
    totalArea: '',
    builtYear: '2020',
    meetingRooms: '10 Exhibition Halls • 15 Conference Suites',
    rating: 4.8
  });
  const [creatingVenue, setCreatingVenue] = useState(false);

  // Fetch venues from backend
  const fetchVenues = async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    try {
      const res = await axios.get(`${API_URL}/venues`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setVenues(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to fetch venues from backend API:', err);
      showSweetError('Could not connect to the venues backend. Please ensure server is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  // Filter venues
  const filteredVenues = useMemo(() => {
    return venues.filter((v) => {
      const matchesCountry = selectedCountry === 'All' || v.country === selectedCountry;
      const matchesCity = selectedCity === 'All' || v.city === selectedCity;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        v.name?.toLowerCase().includes(q) ||
        v.shortName?.toLowerCase().includes(q) ||
        v.city?.toLowerCase().includes(q) ||
        v.country?.toLowerCase().includes(q) ||
        v.address?.toLowerCase().includes(q) ||
        v.slug?.toLowerCase().includes(q);

      return matchesCountry && matchesCity && matchesSearch;
    });
  }, [venues, selectedCountry, selectedCity, searchQuery]);

  // Pagination calculations
  const totalPages = useMemo(() => {
    if (venuesPerPage === 'all') return 1;
    const size = Number(venuesPerPage) || 9;
    return Math.max(1, Math.ceil(filteredVenues.length / size));
  }, [filteredVenues.length, venuesPerPage]);

  const paginatedVenues = useMemo(() => {
    if (venuesPerPage === 'all') return filteredVenues;
    const size = Number(venuesPerPage) || 9;
    const start = (page - 1) * size;
    return filteredVenues.slice(start, start + size);
  }, [filteredVenues, page, venuesPerPage]);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedCountry, selectedCity]);

  // Auto-clamp page if totalPages changes
  useEffect(() => {
    if (page > totalPages) {
      setPage(Math.max(1, totalPages));
    }
  }, [totalPages, page]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    const el = document.getElementById('venues-listing-section');
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.top < 0) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Unique location filter options
  const countries = useMemo(() => {
    const list = Array.from(new Set(venues.map((v) => v.country).filter(Boolean)));
    return ['All', ...list.sort((a, b) => a.localeCompare(b))];
  }, [venues]);

  const cities = useMemo(() => {
    const countryVenues = selectedCountry === 'All'
      ? venues
      : venues.filter((venue) => venue.country === selectedCountry);
    const list = Array.from(new Set(countryVenues.map((v) => v.city).filter(Boolean)));
    return ['All', ...list.sort((a, b) => a.localeCompare(b))];
  }, [venues, selectedCountry]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCountry('All');
    setSelectedCity('All');
  };

  // Aggregate statistics
  const totalGalleryCount = useMemo(() => {
    return venues.reduce((acc, v) => acc + (Array.isArray(v.gallery) ? v.gallery.length : 0), 0);
  }, [venues]);

  // =========================================================================
  // IMAGE MANAGEMENT MODAL HANDLERS
  // =========================================================================
  const openImageModal = (venue) => {
    setImageModalVenue(venue);
    setBannerInput(venue.heroBanner || '');
    setLogoInput(venue.logoThumbnail || '');
    setGalleryImages(Array.isArray(venue.gallery) ? [...venue.gallery] : []);
    setNewGalleryUrl('');
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setImageModalVenue(null);
  };

  // Upload file helper to Cloudinary (/api/upload)
  const handleUploadImageFile = async (file) => {
    if (!file) return null;
    const formData = new FormData();
    formData.append('file', file);

    const res = await axios.post(`${API_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
      }
    });

    if (res.data?.success && res.data?.url) {
      return res.data.url;
    }
    throw new Error(res.data?.error || 'Upload failed');
  };

  // Upload cover banner from file
  const handleBannerFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingBanner(true);
      const uploadedUrl = await handleUploadImageFile(file);
      if (uploadedUrl) {
        setBannerInput(uploadedUrl);
        showSweetSuccess('Cover photo uploaded to cloud successfully!');
      }
    } catch (err) {
      showSweetError(err.message || 'Failed to upload cover banner photo.');
    } finally {
      setUploadingBanner(false);
      if (bannerFileInputRef.current) bannerFileInputRef.current.value = '';
    }
  };

  // Upload logo from file
  const handleLogoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const uploadedUrl = await handleUploadImageFile(file);
      if (uploadedUrl) {
        setLogoInput(uploadedUrl);
        showSweetSuccess('Venue logo uploaded to cloud successfully!');
      }
    } catch (err) {
      showSweetError(err.message || 'Failed to upload logo.');
    } finally {
      setUploadingLogo(false);
      if (logoFileInputRef.current) logoFileInputRef.current.value = '';
    }
  };

  // Add URL to gallery list
  const handleAddGalleryUrl = () => {
    if (!newGalleryUrl.trim()) return;
    const url = newGalleryUrl.trim();
    if (galleryImages.includes(url)) {
      showSweetError('This photo URL already exists in the venue gallery.');
      return;
    }
    setGalleryImages((prev) => [...prev, url]);
    setNewGalleryUrl('');
  };

  // Upload multiple images to gallery from device
  const handleGalleryFilesChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setUploadingGallery(true);
      const uploadedUrls = [];

      for (const file of files) {
        try {
          const url = await handleUploadImageFile(file);
          if (url) uploadedUrls.push(url);
        } catch (fileErr) {
          console.error('Single file upload error:', fileErr);
        }
      }

      if (uploadedUrls.length > 0) {
        setGalleryImages((prev) => [...prev, ...uploadedUrls]);
        showSweetSuccess(`Uploaded ${uploadedUrls.length} photo(s) to gallery successfully!`);
      } else {
        showSweetError('No photos could be uploaded. Please verify image file format.');
      }
    } catch (err) {
      showSweetError(err.message || 'Failed uploading gallery images.');
    } finally {
      setUploadingGallery(false);
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = '';
    }
  };

  // Remove photo from gallery list
  const handleRemoveGalleryImage = async (imgUrl) => {
    const confirmed = await showSweetConfirm('Remove this image from the venue gallery?', 'The image will be detached from this venue profile.');
    if (confirmed) {
      setGalleryImages((prev) => prev.filter((img) => img !== imgUrl));
    }
  };

  // Set any gallery image as Hero Banner
  const handleSetAsBanner = (imgUrl) => {
    setBannerInput(imgUrl);
    showSweetSuccess('Image selected as Venue Cover Banner!');
  };

  // Save all image changes to backend
  const handleSaveVenueImages = async () => {
    if (!imageModalVenue) return;
    try {
      setSavingImages(true);
      const payload = {
        heroBanner: bannerInput.trim() || imageModalVenue.heroBanner,
        logoThumbnail: logoInput.trim() || imageModalVenue.logoThumbnail,
        gallery: galleryImages
      };

      const res = await axios.put(`${API_URL}/venues/${imageModalVenue.slug}`, payload, {
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        }
      });

      if (res.data?.success) {
        // Update local venues state
        setVenues((prev) =>
          prev.map((v) => (v.slug === imageModalVenue.slug ? { ...v, ...payload } : v))
        );
        showSweetSuccess('Venue images & photo gallery updated successfully!');
        closeImageModal();
      } else {
        showSweetError(res.data?.message || 'Failed to update venue images.');
      }
    } catch (err) {
      showSweetError(err.response?.data?.message || err.message || 'Error updating images.');
    } finally {
      setSavingImages(false);
    }
  };

  // =========================================================================
  // DETAILS EDIT MODAL HANDLERS
  // =========================================================================
  const openEditModal = (venue) => {
    setEditModalVenue(venue);
    setEditForm({
      name: venue.name || '',
      shortName: venue.shortName || '',
      tagline: venue.tagline || '',
      city: venue.city || '',
      state: venue.state || '',
      country: venue.country || 'India',
      address: venue.address || '',
      metro: venue.metro || '',
      airportDistance: venue.airportDistance || '',
      totalArea: venue.totalArea || '',
      builtYear: venue.builtYear || '',
      renovatedYear: venue.renovatedYear || '',
      meetingRooms: venue.meetingRooms || '',
      overviewDescription: venue.overviewDescription || '',
      eventsHosted: venue.eventsHosted || '',
      upcomingEventsCount: venue.upcomingEventsCount || '',
      rating: venue.rating || 4.8
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditModalVenue(null);
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    if (!editModalVenue) return;

    try {
      setSavingDetails(true);
      const res = await axios.put(`${API_URL}/venues/${editModalVenue.slug}`, editForm, {
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        }
      });

      if (res.data?.success) {
        setVenues((prev) =>
          prev.map((v) => (v.slug === editModalVenue.slug ? { ...v, ...editForm } : v))
        );
        showSweetSuccess('Venue profile specifications updated successfully!');
        closeEditModal();
      } else {
        showSweetError(res.data?.message || 'Failed to update details.');
      }
    } catch (err) {
      showSweetError(err.response?.data?.message || err.message || 'Error saving venue details.');
    } finally {
      setSavingDetails(false);
    }
  };

  // =========================================================================
  // CREATE NEW VENUE HANDLER
  // =========================================================================
  const handleCreateVenue = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      showSweetError('Venue name is required.');
      return;
    }

    try {
      setCreatingVenue(true);
      const res = await axios.post(`${API_URL}/venues`, createForm, {
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        }
      });

      if (res.data?.success && res.data?.data) {
        setVenues((prev) => [res.data.data, ...prev]);
        showSweetSuccess('New Venue complex registered successfully!');
        setIsCreateModalOpen(false);
        setCreateForm({
          name: '',
          shortName: '',
          tagline: '',
          city: 'New Delhi',
          state: 'Delhi',
          country: 'India',
          address: '',
          metro: '',
          airportDistance: '',
          heroBanner: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1600&auto=format&fit=crop',
          logoThumbnail: 'https://images.unsplash.com/photo-1541971875076-8f970d573be6?q=80&w=300&auto=format&fit=crop',
          gallery: [],
          overviewDescription: '',
          totalArea: '',
          builtYear: '2020',
          meetingRooms: '10 Exhibition Halls • 15 Conference Suites',
          rating: 4.8
        });
      } else {
        showSweetError(res.data?.message || 'Failed to register venue.');
      }
    } catch (err) {
      showSweetError(err.response?.data?.message || err.message || 'Failed to create venue.');
    } finally {
      setCreatingVenue(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans antialiased">
      {/* Hidden file inputs for image uploads */}
      <input
        type="file"
        ref={bannerFileInputRef}
        onChange={handleBannerFileChange}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={logoFileInputRef}
        onChange={handleLogoFileChange}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={galleryFileInputRef}
        onChange={handleGalleryFilesChange}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Top Banner Header & Metric Counters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
            <Building2 className="h-3.5 w-3.5" />
            <span>Venue &amp; Exhibition Centers Media Hub</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            Venue Profiles &amp; Photo Galleries
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage convention centres, edit cover banners, upload pavilion photos, and maintain global exhibition profiles.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => fetchVenues(true)}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Refresh venue listings"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Venue</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card border border-border rounded-xl p-4 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase">Total Venues</span>
            <Building className="h-4 w-4 text-primary" />
          </div>
          <div className="text-xl font-black text-foreground">{venues.length}</div>
          <span className="text-[11px] text-muted-foreground">Exhibition complexes</span>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase">Gallery Photos</span>
            <ImageIcon className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-foreground">{totalGalleryCount}</div>
          <span className="text-[11px] text-muted-foreground">Uploaded pavilion images</span>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase">Active Cities</span>
            <MapPin className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-xl font-black text-foreground">{cities.length - 1}</div>
          <span className="text-[11px] text-muted-foreground">Global MICE destinations</span>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase">Featured Complexes</span>
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-xl font-black text-foreground">
            {venues.filter((v) => v.isFeatured).length || 7}
          </div>
          <span className="text-[11px] text-muted-foreground">Flagship trade hubs</span>
        </div>
      </div>

      {/* Search, Filter Bar and View Mode Switcher */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by venue name, city, address, or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex items-center border border-border bg-background rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-card text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Grid Cards View"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-card text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Compact Table View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Location Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <VenueFilterAutocomplete
            id="venue-country"
            label="Country"
            icon={Globe}
            value={selectedCountry}
            onChange={(country) => {
              setSelectedCountry(country);
              setSelectedCity('All');
            }}
            ariaLabel="Search and filter venues by country"
            options={[
              { value: 'All', label: 'All Countries' },
              ...countries.filter((country) => country !== 'All').map((country) => ({ value: country, label: country }))
            ]}
          />

          <VenueFilterAutocomplete
            id="venue-city"
            label="City"
            icon={MapPin}
            value={selectedCity}
            onChange={setSelectedCity}
            ariaLabel="Search and filter venues by city"
            options={[
              { value: 'All', label: 'All Cities' },
              ...cities.filter((city) => city !== 'All').map((city) => ({ value: city, label: city }))
            ]}
          />

          <button
            type="button"
            onClick={resetFilters}
            disabled={!searchQuery && selectedCountry === 'All' && selectedCity === 'All'}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-bold text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-45"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset filters
          </button>
        </div>
      </div>

      {/* Main Venues Listing with id for smooth scrolling */}
      <div id="venues-listing-section" className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-border space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-semibold text-muted-foreground">Loading venue profiles &amp; media assets...</p>
          </div>
        ) : filteredVenues.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border p-8 space-y-3">
            <Building className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <h3 className="font-bold text-base text-foreground">No Venues Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No venues match the current search and location filters. Try changing or resetting your filters.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID CARDS VIEW */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedVenues.map((venue) => {
            const galleryList = Array.isArray(venue.gallery) ? venue.gallery : [];

            return (
              <div
                key={venue.id || venue.slug}
                className="bg-card border border-border hover:border-primary/50 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col group"
              >
                {/* Hero Banner with badges - clicking opens live venue profile in new tab */}
                <div
                  onClick={() => window.open(`${getClientUrl()}/venue/${venue.slug}`, '_blank')}
                  className="relative h-44 w-full overflow-hidden bg-muted cursor-pointer group/banner"
                  title="Click to view live venue profile"
                >
                  <img
                    src={venue.heroBanner}
                    alt={venue.name}
                    className="w-full h-full object-cover group-hover/banner:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Location & Rating Badges */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-bold border border-white/20">
                      <MapPin className="h-3 w-3 text-rose-500" />
                      <span>{venue.city}, {venue.country}</span>
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500 text-white text-[11px] font-black shadow-xs">
                      <Star className="h-3 w-3 fill-current" />
                      <span>{venue.rating || 4.8}</span>
                    </span>
                  </div>

                  {/* Thumbnail Logo & Name Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-end gap-3">
                    <img
                      src={venue.logoThumbnail}
                      alt={venue.name}
                      className="w-12 h-12 rounded-xl object-cover border-2 border-white bg-card shadow-sm shrink-0"
                    />
                    <div className="min-w-0 flex-1 text-white">
                      <h3 className="font-extrabold text-sm leading-tight truncate drop-shadow-sm group-hover/banner:underline group-hover/banner:text-primary transition-colors">
                        {venue.name}
                      </h3>
                      <p className="text-[11px] text-zinc-200 truncate mt-0.5 drop-shadow-sm">
                        {venue.shortName || venue.city}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
                  {/* Stats Strip */}
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-900 dark:text-orange-300">
                      <span className="block font-black text-sm">
                        {venue.liveTotalEvents || venue.eventsHosted || '10+'}
                      </span>
                      <span className="text-[10px] font-semibold uppercase">Total Events</span>
                    </div>

                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-300">
                      <span className="block font-black text-sm">
                        {venue.liveUpcomingEvents || venue.upcomingEventsCount || '4+'}
                      </span>
                      <span className="text-[10px] font-semibold uppercase">Upcoming Events</span>
                    </div>
                  </div>

                  {/* Address Snippet */}
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    <MapPin className="h-3.5 w-3.5 inline mr-1 text-primary shrink-0 -mt-0.5" />
                    <span>{venue.address}</span>
                  </p>

                  {/* Gallery Photos Preview Strip */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-foreground flex items-center gap-1">
                        <Camera className="h-3 w-3 text-primary" />
                        <span>Gallery Photos ({galleryList.length})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => openImageModal(venue)}
                        className="text-primary hover:underline font-bold text-[10px] cursor-pointer"
                      >
                        + Add / Edit Images
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {galleryList.slice(0, 3).map((imgUrl, i) => (
                        <div
                          key={i}
                          onClick={() => openImageModal(venue)}
                          className="relative h-12 rounded-lg overflow-hidden border border-border bg-muted cursor-pointer hover:opacity-85 transition-opacity"
                        >
                          <img src={imgUrl} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}

                      {galleryList.length > 3 ? (
                        <div
                          onClick={() => openImageModal(venue)}
                          className="relative h-12 rounded-lg overflow-hidden border border-border bg-muted/80 flex items-center justify-center cursor-pointer hover:bg-muted text-[11px] font-bold text-muted-foreground transition-colors"
                        >
                          +{galleryList.length - 3} more
                        </div>
                      ) : (
                        <div
                          onClick={() => openImageModal(venue)}
                          className="relative h-12 rounded-lg border border-dashed border-border bg-muted/30 flex items-center justify-center cursor-pointer hover:bg-muted/60 text-muted-foreground transition-colors"
                          title="Add more photos"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => openImageModal(venue)}
                      className="flex-1 py-2 px-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>Manage Images</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(venue)}
                      className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Edit Venue Specifications"
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    <a
                      href={`${getClientUrl()}/venue/${venue.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="View Live Venue Profile on Client Portal"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Venue Complex</th>
                  <th className="py-3 px-4">City / Country</th>
                  <th className="py-3 px-4">Total Events</th>
                  <th className="py-3 px-4">Upcoming</th>
                  <th className="py-3 px-4">Gallery Photos</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedVenues.map((venue) => {
                  const galleryCount = Array.isArray(venue.gallery) ? venue.gallery.length : 0;

                  return (
                    <tr key={venue.id || venue.slug} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={venue.logoThumbnail || venue.heroBanner}
                            alt=""
                            className="h-9 w-9 rounded-xl object-cover border border-border shrink-0 bg-muted"
                          />
                          <div>
                            <span className="font-bold text-foreground block text-xs">{venue.name}</span>
                            <span className="text-[10px] text-muted-foreground">{venue.shortName || venue.slug}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        <div className="font-medium text-foreground">{venue.city}</div>
                        <div className="text-[10px] text-muted-foreground">{venue.country}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-foreground">
                        {venue.liveTotalEvents || venue.eventsHosted || '10+'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                          {venue.liveUpcomingEvents || venue.upcomingEventsCount || '4+'} Upcoming
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-semibold text-muted-foreground">
                          <ImageIcon className="h-3.5 w-3.5 text-primary" />
                          <span>{galleryCount} photos</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openImageModal(venue)}
                            className="px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-[11px] inline-flex items-center gap-1 hover:bg-primary/90 transition-colors cursor-pointer"
                          >
                            <Camera className="h-3 w-3" />
                            <span>Images</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(venue)}
                            className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Edit Venue Details"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <a
                            href={`${getClientUrl()}/venue/${venue.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                            title="View Live Venue Profile on Client Portal"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

        {/* Venues Pagination Controls */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={filteredVenues.length}
          itemsPerPage={venuesPerPage}
          itemLabel="venues"
          pageSizeLabel="Venues per page"
          pageSizeOptions={[9, 12, 18, 'all']}
          onPageChange={handlePageChange}
          onPageSizeChange={(size) => {
            setVenuesPerPage(size);
            setPage(1);
          }}
          alwaysVisible={filteredVenues.length > 0}
        />
      </div>

      {/* ========================================================================= */}
      {/* 1. MANAGE VENUE IMAGES & GALLERY MODAL                                    */}
      {/* ========================================================================= */}
      {isImageModalOpen && imageModalVenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-card rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border bg-muted/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Camera className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-foreground">
                    Manage Images &amp; Gallery: {imageModalVenue.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Update cover hero banner, logo thumbnail, and add/delete photo gallery items.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeImageModal}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
              
              {/* SECTION A: HERO COVER BANNER */}
              <div className="space-y-2.5 rounded-xl border border-border bg-background p-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-primary" />
                    <span>Hero Cover Banner Photo</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground font-medium">Recommended: 1600x720px</span>
                </div>

                {/* Banner Preview */}
                <div className="relative h-44 w-full rounded-xl overflow-hidden border border-border bg-muted">
                  {bannerInput ? (
                    <img src={bannerInput} alt="Banner Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No cover image set
                    </div>
                  )}
                  {uploadingBanner && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white gap-2 font-bold text-xs">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span>Uploading to cloud...</span>
                    </div>
                  )}
                </div>

                {/* Banner URL input & upload triggers */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="url"
                    placeholder="Paste banner image URL (https://...)..."
                    value={bannerInput}
                    onChange={(e) => setBannerInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-card border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => bannerFileInputRef.current?.click()}
                    disabled={uploadingBanner}
                    className="px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs border border-border inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Upload className="h-3.5 w-3.5 text-primary" />
                    <span>Upload Image</span>
                  </button>
                </div>
              </div>

              {/* SECTION B: LOGO THUMBNAIL */}
              <div className="space-y-2.5 rounded-xl border border-border bg-background p-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-primary" />
                    <span>Venue Logo / Square Thumbnail</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground font-medium">Recommended: 400x400px</span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Logo Preview */}
                  <div className="relative h-16 w-16 rounded-xl overflow-hidden border border-border bg-muted shrink-0">
                    {logoInput ? (
                      <img src={logoInput} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">
                        No Logo
                      </div>
                    )}
                    {uploadingLogo && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      </div>
                    )}
                  </div>

                  {/* Logo Input and upload */}
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="Paste logo image URL (https://...)..."
                      value={logoInput}
                      onChange={(e) => setLogoInput(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-card border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => logoFileInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs border border-border inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Upload className="h-3.5 w-3.5 text-primary" />
                      <span>Upload Logo</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION C: VENUE PHOTO GALLERY */}
              <div className="space-y-3.5 rounded-xl border border-border bg-background p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Camera className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Exhibition Halls &amp; Facilities Gallery ({galleryImages.length})</span>
                    </label>
                    <p className="text-[10px] text-muted-foreground">
                      Photographs of halls, concourse, meeting suites, and exterior architecture.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => galleryFileInputRef.current?.click()}
                    disabled={uploadingGallery}
                    className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs"
                  >
                    {uploadingGallery ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Uploading Files...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5" />
                        <span>Upload Photos from Device</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Quick Add Photo by URL */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="url"
                    placeholder="Or paste photo URL to add to gallery (https://...)..."
                    value={newGalleryUrl}
                    onChange={(e) => setNewGalleryUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddGalleryUrl();
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-xl bg-card border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={handleAddGalleryUrl}
                    disabled={!newGalleryUrl.trim()}
                    className="px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs border border-border inline-flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Photo</span>
                  </button>
                </div>

                {/* Gallery Images Grid */}
                {galleryImages.length === 0 ? (
                  <div className="text-center py-8 rounded-xl border border-dashed border-border bg-card/50 space-y-1">
                    <Camera className="h-6 w-6 text-muted-foreground mx-auto" />
                    <p className="text-xs text-muted-foreground font-medium">No gallery photos added yet.</p>
                    <p className="text-[10px] text-muted-foreground">Upload photos from device or paste an image link above.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                    {galleryImages.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="group relative h-28 rounded-xl overflow-hidden border border-border bg-muted shadow-2xs"
                      >
                        <img src={imgUrl} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />

                        {/* Hover Overlay with Action Buttons */}
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2 text-white">
                          <button
                            type="button"
                            onClick={() => handleSetAsBanner(imgUrl)}
                            className="px-2 py-1 rounded-md bg-white/20 hover:bg-white/30 text-[10px] font-bold text-white transition-colors cursor-pointer w-full text-center"
                            title="Set as Hero Cover Banner"
                          >
                            Set as Cover
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryImage(imgUrl)}
                            className="p-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
                            title="Remove photo from gallery"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Cover Indicator Badge */}
                        {bannerInput === imgUrl && (
                          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-amber-500 text-white text-[9px] font-black uppercase">
                            Cover
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-border bg-muted/40 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-muted-foreground">
                Total Gallery Photos: <strong>{galleryImages.length}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeImageModal}
                  className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveVenueImages}
                  disabled={savingImages}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {savingImages ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Save All Images</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. EDIT VENUE DETAILS MODAL                                              */}
      {/* ========================================================================= */}
      {isEditModalOpen && editModalVenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-border bg-muted/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Edit className="h-4 w-4 text-primary" />
                <h3 className="font-extrabold text-sm text-foreground">
                  Edit Venue Specifications: {editModalVenue.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDetails} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Venue Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Short Display Name</label>
                  <input
                    type="text"
                    value={editForm.shortName}
                    onChange={(e) => setEditForm({ ...editForm, shortName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Tagline</label>
                <input
                  type="text"
                  value={editForm.tagline}
                  onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })}
                  placeholder="e.g. India's Apex International Exhibition Complex..."
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Country</label>
                  <input
                    type="text"
                    value={editForm.country}
                    onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">State</label>
                  <input
                    type="text"
                    value={editForm.state}
                    onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Official Physical Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Metro / Transit Connection</label>
                  <input
                    type="text"
                    value={editForm.metro}
                    onChange={(e) => setEditForm({ ...editForm, metro: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Airport Distance</label>
                  <input
                    type="text"
                    value={editForm.airportDistance}
                    onChange={(e) => setEditForm({ ...editForm, airportDistance: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Total Floor Space</label>
                  <input
                    type="text"
                    value={editForm.totalArea}
                    onChange={(e) => setEditForm({ ...editForm, totalArea: e.target.value })}
                    placeholder="e.g. 100,000+ sqm Indoor"
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Halls &amp; Rooms</label>
                  <input
                    type="text"
                    value={editForm.meetingRooms}
                    onChange={(e) => setEditForm({ ...editForm, meetingRooms: e.target.value })}
                    placeholder="14 Exhibition Halls"
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Built / Renovated Year</label>
                  <input
                    type="text"
                    value={editForm.builtYear}
                    onChange={(e) => setEditForm({ ...editForm, builtYear: e.target.value })}
                    placeholder="2023"
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Overview Description</label>
                <textarea
                  rows={3}
                  value={editForm.overviewDescription}
                  onChange={(e) => setEditForm({ ...editForm, overviewDescription: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground focus:ring-1 focus:ring-primary focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDetails}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs inline-flex items-center gap-1.5"
                >
                  {savingDetails ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  <span>Save Specifications</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ADD NEW VENUE MODAL                                                   */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-border bg-muted/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                <h3 className="font-extrabold text-sm text-foreground">
                  Register New Convention &amp; Exhibition Venue
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateVenue} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Venue Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dubai World Trade Centre"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Short Name</label>
                  <input
                    type="text"
                    placeholder="DWTC"
                    value={createForm.shortName}
                    onChange={(e) => setCreateForm({ ...createForm, shortName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Country</label>
                  <input
                    type="text"
                    placeholder="United Arab Emirates"
                    value={createForm.country}
                    onChange={(e) => setCreateForm({ ...createForm, country: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">State / Province</label>
                  <input
                    type="text"
                    placeholder="Dubai"
                    value={createForm.state}
                    onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="Dubai"
                    value={createForm.city}
                    onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Physical Address</label>
                <input
                  type="text"
                  placeholder="Sheikh Zayed Rd, Trade Centre, Dubai"
                  value={createForm.address}
                  onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Hero Cover Photo URL</label>
                  <input
                    type="url"
                    value={createForm.heroBanner}
                    onChange={(e) => setCreateForm({ ...createForm, heroBanner: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Logo Thumbnail URL</label>
                  <input
                    type="url"
                    value={createForm.logoThumbnail}
                    onChange={(e) => setCreateForm({ ...createForm, logoThumbnail: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Overview Description</label>
                <textarea
                  rows={3}
                  placeholder="Premier exhibition destination featuring multiple halls..."
                  value={createForm.overviewDescription}
                  onChange={(e) => setCreateForm({ ...createForm, overviewDescription: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground focus:ring-1 focus:ring-primary focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingVenue}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs inline-flex items-center gap-1.5"
                >
                  {creatingVenue ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  <span>Create Venue Profile</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
