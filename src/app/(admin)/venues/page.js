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
import WordPressVenueModal from '../../../components/WordPressVenueModal.js';
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

const EMPTY_EXPLORE_FORM = {
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

const parseEventCountNumber = (val) => {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  const digits = String(val || '').replace(/[^\d]/g, '');
  return digits ? parseInt(digits, 10) : 0;
};

const isValidAdminVenueName = (rawName) => {
  const cleaned = String(rawName || '')
    .replace(/^[:\-\s]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned || cleaned.length <= 3) return false;
  if (/^(?:\d+|#.*|\d+(?:st|nd|rd|th)\s*\(?.*\)?\s*floor.*)$/i.test(cleaned)) return false;
  if ((cleaned.match(/#\w+/g) || []).length >= 2) return false;
  if (/^(?:exhibition\s+cent(?:er|re)|tba|tbd|online|virtual|n\/a)$/i.test(cleaned)) return false;
  return true;
};

function ExploreVenueSearchSelect({ venues, selectedSlug, exploreItems, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const exploreSlugs = useMemo(
    () => new Set((exploreItems || []).map((i) => String(i.slug || '').trim().toLowerCase()).filter(Boolean)),
    [exploreItems]
  );

  const selectedVenue = useMemo(
    () => (venues || []).find((v) => v.slug === selectedSlug) || null,
    [venues, selectedSlug]
  );

  const filteredVenues = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (venues || []).filter((v) => {
      if (!isValidAdminVenueName(v.name)) return false;
      if (!q) return true;
      return (
        v.name?.toLowerCase().includes(q) ||
        v.shortName?.toLowerCase().includes(q) ||
        v.city?.toLowerCase().includes(q) ||
        v.state?.toLowerCase().includes(q) ||
        v.country?.toLowerCase().includes(q) ||
        v.slug?.toLowerCase().includes(q)
      );
    });
    return list.slice(0, 150);
  }, [venues, query]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 20);
    } else {
      setQuery('');
      setActiveIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const handleChoose = (venue) => {
    onSelect(venue);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative w-full min-w-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`w-full min-w-0 flex items-center justify-between gap-2.5 rounded-xl border bg-background px-3.5 py-2.5 text-left text-xs transition-all cursor-pointer ${
          isOpen
            ? 'border-primary ring-2 ring-primary/20'
            : 'border-border hover:border-primary/50'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Search className="h-4 w-4 shrink-0 text-primary" />
          {selectedVenue ? (
            <div className="min-w-0 flex-1 truncate">
              <span className="font-bold text-foreground">{selectedVenue.name}</span>
              <span className="text-muted-foreground ml-1.5">
                ({[selectedVenue.city, selectedVenue.country].filter(Boolean).join(', ')})
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground font-medium truncate">
              Search and select an existing venue ({venues.length} available)...
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
            isOpen ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          {/* Search Input Header inside Dropdown */}
          <div className="p-2.5 border-b border-border bg-muted/30">
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setActiveIndex((i) => Math.min(i + 1, Math.max(0, filteredVenues.length - 1)));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setActiveIndex((i) => Math.max(i - 1, 0));
                  } else if (e.key === 'Enter' && filteredVenues[activeIndex]) {
                    e.preventDefault();
                    handleChoose(filteredVenues[activeIndex]);
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setIsOpen(false);
                  }
                }}
                placeholder="Type venue name, city, or country to search..."
                className="w-full rounded-xl border border-border bg-background pl-8 pr-8 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setActiveIndex(0);
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Clear venue search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Bounded Scrollable Venues List */}
          <div role="listbox" className="max-h-56 overflow-y-auto divide-y divide-border/50 p-1">
            {filteredVenues.length === 0 ? (
              <div className="py-8 px-4 text-center text-xs text-muted-foreground">
                No existing venues found matching &ldquo;{query}&rdquo;.
              </div>
            ) : (
              filteredVenues.map((v, idx) => {
                const isSelected = v.slug === selectedSlug;
                const inExplore = exploreSlugs.has(String(v.slug || '').trim().toLowerCase());
                const liveCount = v.liveTotalEvents ?? parseEventCountNumber(v.eventsHosted);

                return (
                  <button
                    key={v.id || v.slug}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => handleChoose(v)}
                    className={`w-full min-w-0 flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-primary/15 text-primary'
                        : activeIndex === idx
                        ? 'bg-muted text-foreground'
                        : 'text-foreground hover:bg-muted/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted overflow-hidden">
                        {v.logoThumbnail || v.heroBanner ? (
                          <img
                            src={v.logoThumbnail || v.heroBanner}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs truncate">{v.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {[v.city, v.state, v.country].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {inExplore && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                          In Explore
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-lg bg-muted text-muted-foreground text-[10px] font-bold">
                        {liveCount} {liveCount === 1 ? 'event' : 'events'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [onlyExploreFilter, setOnlyExploreFilter] = useState(false);

  // Landing Page Explore Venues states
  const [exploreItems, setExploreItems] = useState([]);
  const [exploreLoading, setExploreLoading] = useState(true);
  const [exploreFormData, setExploreFormData] = useState(EMPTY_EXPLORE_FORM);
  const [editingExploreItem, setEditingExploreItem] = useState(null);
  const [isExploreFormOpen, setIsExploreFormOpen] = useState(false);
  const [savingExplore, setSavingExplore] = useState(false);
  const [uploadingExploreImg, setUploadingExploreImg] = useState(false);
  const [togglingVenueSlug, setTogglingVenueSlug] = useState('');
  const [selectedVenueToPrefill, setSelectedVenueToPrefill] = useState('');
  const [isExploreSectionExpanded, setIsExploreSectionExpanded] = useState(true);

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
  const EMPTY_CREATE_VENUE_FORM = {
    name: '',
    slug: '',
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
    rating: 4.8,
    status: 'published',
    visibility: 'public',
    venueCategories: ['Delhi', 'New Delhi'],
    seo: {
      seoTitle: '',
      metaDescription: '',
      focusKeyword: '',
      relatedKeyphrases: [],
      isCornerstone: false,
      canonicalUrl: '',
      metaRobotsIndex: 'index',
      metaRobotsFollow: 'follow'
    }
  };
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_VENUE_FORM);
  const [creatingVenue, setCreatingVenue] = useState(false);

  const authHeaders = useMemo(
    () => (accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    [accessToken]
  );

  // Fetch Landing Page Explore Venues
  const fetchExploreItems = async () => {
    try {
      const response = await axios.get(`${API_URL}/explore-venues/admin/all`, {
        headers: authHeaders
      });
      if (response.data?.success && Array.isArray(response.data.data)) {
        setExploreItems(response.data.data);
      }
    } catch (err) {
      console.warn('Could not load Explore Venues:', err);
    } finally {
      setExploreLoading(false);
    }
  };

  // Match an available venue from directory against Landing Page Explore Venues list
  const findExploreMatchForVenue = (venue) => {
    if (!venue) return null;
    const vSlug = String(venue.slug || '').trim().toLowerCase();
    const vName = String(venue.name || '').trim().toLowerCase();
    return (
      exploreItems.find((item) => {
        const iSlug = String(item.slug || '').trim().toLowerCase();
        const iName = String(item.name || '').trim().toLowerCase();
        return (vSlug && iSlug === vSlug) || (vName && iName === vName);
      }) || null
    );
  };

  // Open Explore Venue Modal (empty or pre-filled from an available venue)
  const openCreateExploreModal = (venueToPrefill = null) => {
    setEditingExploreItem(null);
    if (venueToPrefill) {
      setSelectedVenueToPrefill(venueToPrefill.slug || '');
      setExploreFormData({
        name: venueToPrefill.name || '',
        slug: venueToPrefill.slug || '',
        city: venueToPrefill.city || '',
        state: venueToPrefill.state || '',
        country: venueToPrefill.country || 'India',
        totalEvents: parseEventCountNumber(venueToPrefill.liveTotalEvents ?? venueToPrefill.eventsHosted),
        upcomingEvents: parseEventCountNumber(venueToPrefill.liveUpcomingEvents ?? venueToPrefill.upcomingEventsCount),
        searchTerm: venueToPrefill.shortName || venueToPrefill.name || '',
        imageUrl: venueToPrefill.logoThumbnail || venueToPrefill.heroBanner || '',
        displayOrder: exploreItems.length + 1,
        isActive: true
      });
    } else {
      setSelectedVenueToPrefill('');
      setExploreFormData({ ...EMPTY_EXPLORE_FORM, displayOrder: exploreItems.length + 1 });
    }
    setIsExploreFormOpen(true);
  };

  const openEditExploreModal = (item) => {
    setEditingExploreItem(item);
    setSelectedVenueToPrefill(item.slug || '');
    setExploreFormData({
      ...EMPTY_EXPLORE_FORM,
      ...item,
      totalEvents: item.totalEvents || 0,
      upcomingEvents: item.upcomingEvents || 0,
      displayOrder: item.displayOrder || 1
    });
    setIsExploreFormOpen(true);
  };

  // Direct 1-click Add an available venue from Venues Directory to Landing Page Explore Venues
  const handleQuickAddVenueToExplore = async (venue) => {
    const existing = findExploreMatchForVenue(venue);
    if (existing) {
      openEditExploreModal(existing);
      return;
    }

    const key = venue.slug || venue.name;
    setTogglingVenueSlug(key);
    try {
      const payload = {
        name: venue.name || '',
        slug: venue.slug || '',
        city: venue.city || 'New Delhi',
        state: venue.state || '',
        country: venue.country || 'India',
        totalEvents: parseEventCountNumber(venue.liveTotalEvents ?? venue.eventsHosted),
        upcomingEvents: parseEventCountNumber(venue.liveUpcomingEvents ?? venue.upcomingEventsCount),
        searchTerm: venue.shortName || venue.name || '',
        imageUrl: venue.logoThumbnail || venue.heroBanner || '',
        displayOrder: exploreItems.length + 1,
        isActive: true
      };
      const res = await axios.post(`${API_URL}/explore-venues/admin`, payload, {
        headers: authHeaders
      });
      if (res.data?.success) {
        await fetchExploreItems();
        showSweetSuccess(`"${venue.name}" added to Landing Page Explore Venues!`);
      } else {
        showSweetError(res.data?.error || 'Could not add venue to Explore Venues.');
      }
    } catch (err) {
      showSweetError(err.response?.data?.error || err.message || 'Could not add venue to Explore Venues.');
    } finally {
      setTogglingVenueSlug('');
    }
  };

  // Toggle Live / Hidden on an Explore Venue item
  const handleToggleExploreActive = async (item) => {
    try {
      const res = await axios.put(
        `${API_URL}/explore-venues/admin/${item._id}`,
        { ...item, isActive: !item.isActive },
        { headers: authHeaders }
      );
      if (res.data?.success) {
        await fetchExploreItems();
        showSweetSuccess(
          !item.isActive
            ? `"${item.name}" is now Live on the landing page!`
            : `"${item.name}" hidden from the landing page.`
        );
      }
    } catch (err) {
      showSweetError(err.response?.data?.error || 'Could not update Explore Venue visibility.');
    }
  };

  // Remove a venue from Landing Page Explore Venues
  const handleDeleteExploreItem = async (item) => {
    const confirmed = await showSweetConfirm(
      `Remove "${item.name}" from Explore Venues?`,
      'This removes the card from the Landing Page Explore Venues section (the venue profile itself remains in the directory).'
    );
    if (!confirmed) return;

    try {
      const res = await axios.delete(`${API_URL}/explore-venues/admin/${item._id}`, {
        headers: authHeaders
      });
      if (res.data?.success) {
        await fetchExploreItems();
        if (editingExploreItem?._id === item._id) {
          setIsExploreFormOpen(false);
        }
        showSweetSuccess(`"${item.name}" removed from Landing Page Explore Venues.`);
      }
    } catch (err) {
      showSweetError(err.response?.data?.error || 'Could not remove venue from Explore Venues.');
    }
  };

  // Upload image for Explore Venue card
  const handleExploreImageUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showSweetError('Please choose an image file.');
      return;
    }

    try {
      setUploadingExploreImg(true);
      const url = await handleUploadImageFile(file);
      if (url) {
        setExploreFormData((curr) => ({ ...curr, imageUrl: url }));
        showSweetSuccess('Card image uploaded!');
      }
    } catch (err) {
      showSweetError(err.message || 'Could not upload card image.');
    } finally {
      setUploadingExploreImg(false);
    }
  };

  // Save (Create or Update) Explore Venue item
  const handleSaveExploreVenue = async (event) => {
    event.preventDefault();
    if (!exploreFormData.name || !exploreFormData.city) {
      showSweetError('Please select an existing venue from the directory.');
      return;
    }
    try {
      setSavingExplore(true);
      const url = editingExploreItem
        ? `${API_URL}/explore-venues/admin/${editingExploreItem._id}`
        : `${API_URL}/explore-venues/admin`;
      const response = editingExploreItem
        ? await axios.put(url, exploreFormData, { headers: authHeaders })
        : await axios.post(url, exploreFormData, { headers: authHeaders });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Could not save Explore Venue.');
      }
      setIsExploreFormOpen(false);
      await fetchExploreItems();
      showSweetSuccess(
        editingExploreItem
          ? 'Explore Venue card updated!'
          : 'Venue added to Landing Page Explore Venues!'
      );
    } catch (err) {
      showSweetError(err.response?.data?.error || err.message || 'Could not save Explore Venue.');
    } finally {
      setSavingExplore(false);
    }
  };

  // Fetch venues from backend with instant sessionStorage caching
  const fetchVenues = async (silent = false, forceRefresh = false) => {
    if (!silent && venues.length === 0) setLoading(true);
    setRefreshing(true);
    try {
      const res = await axios.get(`${API_URL}/venues${forceRefresh ? '?force=true' : ''}`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        const cleanData = res.data.data.filter((v) => isValidAdminVenueName(v.name));
        setVenues(cleanData);
        try {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('visitexpo_admin_venues_cache', JSON.stringify(cleanData));
          }
        } catch (e) {
          console.warn('Could not cache venues:', e);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch venues from backend API:', err);
      if (venues.length === 0) {
        showSweetError('Could not connect to the venues backend. Please ensure server is running.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const cached = sessionStorage.getItem('visitexpo_admin_venues_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const cleanCached = parsed.filter((v) => isValidAdminVenueName(v.name));
            setVenues(cleanCached);
            setLoading(false);
          }
        }
      }
    } catch (e) {
      console.warn('Could not read venues cache:', e);
    }

    fetchVenues(true, true);
    fetchExploreItems();
  }, [accessToken]);

  // Filter venues
  const filteredVenues = useMemo(() => {
    const exploreSlugs = new Set(
      exploreItems.map((i) => String(i.slug || '').trim().toLowerCase()).filter(Boolean)
    );
    const exploreNames = new Set(
      exploreItems.map((i) => String(i.name || '').trim().toLowerCase()).filter(Boolean)
    );

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

      if (onlyExploreFilter) {
        const vSlug = String(v.slug || '').trim().toLowerCase();
        const vName = String(v.name || '').trim().toLowerCase();
        const inExplore = (vSlug && exploreSlugs.has(vSlug)) || (vName && exploreNames.has(vName));
        if (!inExplore) return false;
      }

      return matchesCountry && matchesCity && matchesSearch;
    });
  }, [venues, exploreItems, onlyExploreFilter, selectedCountry, selectedCity, searchQuery]);

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
  }, [searchQuery, selectedCountry, selectedCity, onlyExploreFilter]);

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
    setOnlyExploreFilter(false);
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
    const defaultCategories = Array.isArray(venue.venueCategories) && venue.venueCategories.length > 0
      ? venue.venueCategories
      : [venue.state, venue.city].filter(Boolean);
    setEditForm({
      name: venue.name || '',
      slug: venue.slug || '',
      shortName: venue.shortName || '',
      tagline: venue.tagline || '',
      city: venue.city || '',
      state: venue.state || '',
      country: venue.country || 'India',
      address: venue.address || '',
      metro: venue.metro || '',
      airportDistance: venue.airportDistance || '',
      heroBanner: venue.heroBanner || '',
      logoThumbnail: venue.logoThumbnail || '',
      gallery: Array.isArray(venue.gallery) ? venue.gallery : [],
      totalArea: venue.totalArea || '',
      builtYear: venue.builtYear || '',
      renovatedYear: venue.renovatedYear || '',
      meetingRooms: venue.meetingRooms || '',
      overviewDescription: venue.overviewDescription || '',
      eventsHosted: venue.eventsHosted || '',
      upcomingEventsCount: venue.upcomingEventsCount || '',
      rating: venue.rating || 4.8,
      status: venue.status || 'published',
      visibility: venue.visibility || 'public',
      venueCategories: defaultCategories,
      isFeatured: Boolean(venue.isFeatured),
      seo: {
        seoTitle: venue.seo?.seoTitle || '',
        metaDescription: venue.seo?.metaDescription || '',
        focusKeyword: venue.seo?.focusKeyword || venue.name || '',
        relatedKeyphrases: Array.isArray(venue.seo?.relatedKeyphrases) ? venue.seo.relatedKeyphrases : [],
        isCornerstone: Boolean(venue.seo?.isCornerstone ?? venue.isFeatured),
        canonicalUrl: venue.seo?.canonicalUrl || '',
        metaRobotsIndex: venue.seo?.metaRobotsIndex || 'index',
        metaRobotsFollow: venue.seo?.metaRobotsFollow || 'follow'
      }
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditModalVenue(null);
  };

  const handleSaveDetails = async (e, overrideStatus = null) => {
    if (e?.preventDefault) e.preventDefault();
    if (!editModalVenue) return;

    try {
      setSavingDetails(true);
      const payload = overrideStatus ? { ...editForm, status: overrideStatus } : editForm;
      const res = await axios.put(`${API_URL}/venues/${editModalVenue.slug}`, payload, {
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        }
      });

      if (res.data?.success) {
        const updatedVenue = res.data.data || { ...editModalVenue, ...payload };
        setVenues((prev) =>
          prev.map((v) => (v.slug === editModalVenue.slug ? { ...v, ...updatedVenue } : v))
        );
        showSweetSuccess('Venue profile & Yoast SEO specifications updated successfully!');
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
  const handleCreateVenue = async (e, overrideStatus = null) => {
    if (e?.preventDefault) e.preventDefault();
    if (!createForm.name.trim()) {
      showSweetError('Venue title is required.');
      return;
    }

    try {
      setCreatingVenue(true);
      const payload = overrideStatus ? { ...createForm, status: overrideStatus } : createForm;
      const res = await axios.post(`${API_URL}/venues`, payload, {
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        }
      });

      if (res.data?.success && res.data?.data) {
        setVenues((prev) => [res.data.data, ...prev]);
        showSweetSuccess(
          payload.status === 'draft'
            ? 'Venue saved as draft successfully!'
            : 'New Venue complex published with Yoast SEO metadata!'
        );
        setIsCreateModalOpen(false);
        setCreateForm(EMPTY_CREATE_VENUE_FORM);
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
            onClick={() => {
              fetchVenues(true, true);
              fetchExploreItems();
            }}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Refresh venue listings"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => openCreateExploreModal(null)}
            className="px-3.5 py-2 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Star className="h-3.5 w-3.5 fill-current" />
            <span>+ Add Explore Venue</span>
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

        <div
          onClick={() => setIsExploreSectionExpanded((prev) => !prev)}
          className="bg-card border border-border hover:border-primary/50 rounded-xl p-4 space-y-1 shadow-2xs cursor-pointer transition-colors"
          title="Click to toggle Landing Page Explore Venues section"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase">Explore Venues (Landing)</span>
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-xl font-black text-foreground">
            {exploreItems.filter((i) => i.isActive).length}
            <span className="text-xs font-semibold text-muted-foreground ml-1">
              / {exploreItems.length} cards
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">Shown on landing page</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LANDING PAGE EXPLORE VENUES SECTION (INTEGRATED DIRECTLY IN VENUES PAGE)  */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-border bg-muted/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Star className="h-4.5 w-4.5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-extrabold text-foreground">
                  Landing Page Explore Venues
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  {exploreItems.filter((i) => i.isActive).length} Live
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Manage the venue cards shown in the landing page Explore Venues section, or click <strong>+ Add to Explore</strong> on any venue card below.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openCreateExploreModal(null)}
              className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Explore Venue</span>
            </button>
            <button
              type="button"
              onClick={() => setIsExploreSectionExpanded((prev) => !prev)}
              className="p-2 rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title={isExploreSectionExpanded ? 'Collapse section' : 'Expand section'}
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${isExploreSectionExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {isExploreSectionExpanded && (
          <div>
            {exploreLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Loading Landing Page Explore Venues...</span>
              </div>
            ) : exploreItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No Explore Venues added yet. Click <strong>Add Explore Venue</strong> above or <strong>+ Add to Explore</strong> on any venue card below.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {exploreItems.map((item) => (
                  <div
                    key={item._id}
                    className="flex flex-wrap items-center gap-3.5 px-5 py-3.5 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-border">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Building2 className="h-5 w-5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          #{item.displayOrder || 1}
                        </span>
                        <h3 className="font-bold text-xs sm:text-sm text-foreground truncate">
                          {item.name}
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleToggleExploreActive(item)}
                          title="Click to toggle Live / Hidden on landing page"
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold cursor-pointer transition-colors ${
                            item.isActive
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                              : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}
                        >
                          {item.isActive ? 'Live' : 'Hidden'}
                        </button>
                      </div>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 text-primary shrink-0" />
                        <span>{[item.city, item.state, item.country].filter(Boolean).join(', ')}</span>
                        <span className="mx-1">·</span>
                        <span className="font-semibold text-foreground">{item.totalEvents || 0} events</span>
                        {item.upcomingEvents ? (
                          <>
                            <span className="mx-1">·</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              {item.upcomingEvents} upcoming
                            </span>
                          </>
                        ) : null}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={`${getClientUrl()}/venue/${item.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title="Preview venue page"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => openEditExploreModal(item)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                        title="Edit Explore Venue card"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteExploreItem(item)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Remove from Landing Page Explore Venues"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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

          {/* View Mode & Explore Filter Toggle */}
          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => setOnlyExploreFilter((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                onlyExploreFilter
                  ? 'border-primary bg-primary text-primary-foreground shadow-2xs'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground'
              }`}
              title="Show only venues currently in Landing Page Explore Venues"
            >
              <Star className={`h-3.5 w-3.5 ${onlyExploreFilter ? 'fill-current' : 'text-amber-500 fill-amber-500'}`} />
              <span>In Explore ({exploreItems.length})</span>
            </button>

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
            disabled={!searchQuery && selectedCountry === 'All' && selectedCity === 'All' && !onlyExploreFilter}
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
            const exploreMatch = findExploreMatchForVenue(venue);
            const isAddingExplore = togglingVenueSlug === (venue.slug || venue.name);

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

                  {/* Location & Explore Status Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-bold border border-white/20">
                      <MapPin className="h-3 w-3 text-rose-500" />
                      <span>{venue.city}, {venue.country}</span>
                    </span>
                    {exploreMatch && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black shadow-xs ${
                          exploreMatch.isActive
                            ? 'bg-emerald-500 text-white'
                            : 'bg-zinc-700 text-zinc-200'
                        }`}
                      >
                        <Star className="h-2.5 w-2.5 fill-current" />
                        <span>{exploreMatch.isActive ? 'In Explore (Live)' : 'In Explore (Hidden)'}</span>
                      </span>
                    )}
                  </div>

                  {venue.rating > 0 && (
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500 text-white text-[11px] font-black shadow-xs">
                        <Star className="h-3 w-3 fill-current" />
                        <span>{Number(venue.rating).toFixed(1)}</span>
                      </span>
                    </div>
                  )}

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
                        {venue.liveTotalEvents ?? parseEventCountNumber(venue.eventsHosted)}
                      </span>
                      <span className="text-[10px] font-semibold uppercase">Total Events</span>
                    </div>

                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-300">
                      <span className="block font-black text-sm">
                        {venue.liveUpcomingEvents ?? parseEventCountNumber(venue.upcomingEventsCount)}
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
                  <div className="pt-3 border-t border-border space-y-2">
                    <button
                      type="button"
                      disabled={isAddingExplore}
                      onClick={() => handleQuickAddVenueToExplore(venue)}
                      className={`w-full py-2 px-3 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                        exploreMatch
                          ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                          : 'bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary'
                      }`}
                      title={
                        exploreMatch
                          ? 'This venue is in the Landing Page Explore Venues section — click to edit card'
                          : 'Add this venue directly to the Landing Page Explore Venues section'
                      }
                    >
                      {isAddingExplore ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Adding to Explore Venues...</span>
                        </>
                      ) : exploreMatch ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>In Landing Explore Venues (Edit Card)</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add to Landing Explore Venues</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between gap-2">
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
                  <th className="py-3 px-4">Landing Explore</th>
                  <th className="py-3 px-4">Gallery Photos</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedVenues.map((venue) => {
                  const galleryCount = Array.isArray(venue.gallery) ? venue.gallery.length : 0;
                  const exploreMatch = findExploreMatchForVenue(venue);
                  const isAddingExplore = togglingVenueSlug === (venue.slug || venue.name);

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
                        {venue.liveTotalEvents ?? parseEventCountNumber(venue.eventsHosted)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                          {venue.liveUpcomingEvents ?? parseEventCountNumber(venue.upcomingEventsCount)} Upcoming
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          disabled={isAddingExplore}
                          onClick={() => handleQuickAddVenueToExplore(venue)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer border ${
                            exploreMatch
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                              : 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                          }`}
                        >
                          {isAddingExplore ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : exploreMatch ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              <span>{exploreMatch.isActive ? 'In Explore' : 'Explore (Hidden)'}</span>
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3" />
                              <span>Add to Explore</span>
                            </>
                          )}
                        </button>
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
      {/* 2. EDIT VENUE DETAILS MODAL (WordPress + Yoast SEO Suite)                 */}
      {/* ========================================================================= */}
      <WordPressVenueModal
        isOpen={Boolean(isEditModalOpen && editModalVenue)}
        mode="edit"
        form={editForm}
        setForm={setEditForm}
        onClose={closeEditModal}
        onSubmit={handleSaveDetails}
        saving={savingDetails}
        allVenues={venues}
        onUploadImageFile={handleUploadImageFile}
        clientOrigin={getClientUrl('')}
        showSweetSuccess={showSweetSuccess}
        showSweetError={showSweetError}
      />

      {/* ========================================================================= */}
      {/* 3. ADD NEW VENUE MODAL (WordPress + Yoast SEO Suite)                      */}
      {/* ========================================================================= */}
      <WordPressVenueModal
        isOpen={isCreateModalOpen}
        mode="create"
        form={createForm}
        setForm={setCreateForm}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateVenue}
        saving={creatingVenue}
        allVenues={venues}
        onUploadImageFile={handleUploadImageFile}
        clientOrigin={getClientUrl('')}
        showSweetSuccess={showSweetSuccess}
        showSweetError={showSweetError}
      />

      {/* ========================================================================= */}
      {/* 4. ADD / EDIT LANDING PAGE EXPLORE VENUE MODAL                            */}
      {/* ========================================================================= */}
      {isExploreFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="my-auto w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Star className="h-4 w-4 fill-current" />
                </span>
                <div>
                  <h2 className="text-sm font-extrabold text-foreground">
                    {editingExploreItem ? 'Edit Landing Page Explore Venue' : 'Add Venue to Landing Page Explore Section'}
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    Select an existing venue from your directory to feature on the landing page.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExploreFormOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                aria-label="Close form"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExploreVenue} className="space-y-4 p-6 overflow-y-auto text-xs flex-1">
              {/* 1. Choose from Existing Directory Venues (Searchable Combobox Dropdown) */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                  Select Existing Venue *
                </label>
                <ExploreVenueSearchSelect
                  venues={venues}
                  selectedSlug={selectedVenueToPrefill}
                  exploreItems={exploreItems}
                  onSelect={(chosen) => {
                    if (chosen) {
                      setSelectedVenueToPrefill(chosen.slug || '');
                      setExploreFormData((curr) => ({
                        ...curr,
                        name: chosen.name || '',
                        slug: chosen.slug || '',
                        city: chosen.city || '',
                        state: chosen.state || '',
                        country: chosen.country || 'India',
                        totalEvents: parseEventCountNumber(chosen.liveTotalEvents ?? chosen.eventsHosted),
                        upcomingEvents: parseEventCountNumber(chosen.liveUpcomingEvents ?? chosen.upcomingEventsCount),
                        searchTerm: chosen.shortName || chosen.name || '',
                        imageUrl: curr.imageUrl || chosen.logoThumbnail || chosen.heroBanner || ''
                      }));
                    }
                  }}
                />

                {/* Selected Venue Read-Only Summary Card */}
                {exploreFormData.name && (
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/25 bg-primary/5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary overflow-hidden">
                      {exploreFormData.imageUrl ? (
                        <img
                          src={exploreFormData.imageUrl}
                          alt={exploreFormData.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Building2 className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-foreground truncate">{exploreFormData.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {[exploreFormData.city, exploreFormData.state, exploreFormData.country].filter(Boolean).join(', ')}
                        {' · '}
                        {exploreFormData.totalEvents || 0} events
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Direct Image Upload Only (No Image URL Input Field) */}
              <div className="space-y-2">
                <span className="block text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                  Venue Card Image (Optional)
                </span>
                <div className="flex items-center gap-3.5 p-3.5 rounded-xl border border-border bg-background">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted text-muted-foreground">
                    {exploreFormData.imageUrl ? (
                      <img
                        src={exploreFormData.imageUrl}
                        alt="Venue card preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Building2 className="h-6 w-6" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 px-3.5 py-2 text-xs font-bold text-primary-foreground transition-colors ${
                          uploadingExploreImg ? 'pointer-events-none opacity-60' : ''
                        }`}
                      >
                        {uploadingExploreImg ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-3.5 w-3.5" />
                            <span>{exploreFormData.imageUrl ? 'Change Image' : 'Upload Image'}</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleExploreImageUpload}
                          className="sr-only"
                        />
                      </label>

                      {exploreFormData.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setExploreFormData({ ...exploreFormData, imageUrl: '' })}
                          className="px-3 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-bold text-rose-600 transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Upload an image directly from your device to replace the default venue icon.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Display Order & Visibility */}
              <div className="grid gap-3.5 sm:grid-cols-2 pt-1">
                <label className="space-y-1 font-bold text-foreground">
                  <span className="block text-[10px] uppercase text-muted-foreground">Display Order</span>
                  <input
                    type="number"
                    min="1"
                    value={exploreFormData.displayOrder}
                    onChange={(e) => setExploreFormData({ ...exploreFormData, displayOrder: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-normal"
                  />
                </label>

                <label className="flex items-center gap-2 self-end pb-2 text-xs font-bold text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(exploreFormData.isActive)}
                    onChange={(e) => setExploreFormData({ ...exploreFormData, isActive: e.target.checked })}
                    className="h-4 w-4 accent-primary"
                  />
                  <span>Show on landing page</span>
                </label>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                {editingExploreItem ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteExploreItem(editingExploreItem)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-3.5 py-2 text-xs font-bold text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove from Explore</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsExploreFormOpen(false)}
                    className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-muted cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingExplore || uploadingExploreImg || !exploreFormData.name}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60 cursor-pointer"
                  >
                    {savingExplore ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    <span>{editingExploreItem ? 'Save Explore Card' : 'Add to Explore Venues'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
