'use client';

/**
 * @file WordPressVenueModal.js
 * @description WordPress Classic Editor + Yoast SEO Venue Creator & Editor Modal.
 * Features:
 * - WordPress Add New Venue layout:
 *   - Title ('Add title'), Short Name, Tagline
 *   - Rich Content Editor with '+ Add Media' button, 'Visual' / 'Code' tabs,
 *     formatting toolbar (Paragraph/Heading 1-3, Bold, Italic, Lists, Blockquote,
 *     Align Left/Center/Right, Insert Link, Horizontal Rule), and 'Word count: N' footer
 *   - Location & Facility Specifications (Country, State, City, Address, Metro, Airport, Area, Halls, Year)
 * - Yoast SEO Panel:
 *   - Focus Keyphrase + '+ Add related keyphrase'
 *   - Live Google Search Snippet Preview
 *   - SEO Title with 'Insert variable' chips ('Title', 'Page', 'Separator', 'Site title') & '✨ Generate SEO title' + progress bar
 *   - Slug editor ('visitexpo.in/venue/...')
 *   - Meta Description with 'Insert variable' chips & '✨ Generate meta description' + progress bar
 *   - 'SEO analysis' collapsible accordion with live traffic-light checklist
 *   - 'Cornerstone content' toggle switch
 *   - 'Advanced' collapsible accordion (Canonical URL, Allow search engines to index, Follow links)
 * - Right Sidebar:
 *   - Publish Box: 'Save Draft', 'Preview', Status (Draft/Published), Visibility (Public/Private),
 *     live 'SEO analysis' & 'Readability analysis' badges, and primary 'Publish' / 'Update' button
 *   - Categories Box ('Venue Category' / 'Most Used' tabs) with hierarchical State/Country -> City checkboxes
 *   - Featured Venue Media Box with direct 'Upload Hero Cover Photo' and 'Upload Logo Thumbnail' file upload
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Plus,
  Check,
  Edit,
  Eye,
  Upload,
  Image as ImageIcon,
  Loader2,
  ChevronDown,
  ChevronUp,
  Globe,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Minus,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Calendar,
  Building2,
  MapPin,
  Search
} from 'lucide-react';

const DEFAULT_CATEGORY_TREE = [
  { parent: 'China', children: ['Shanghai', 'Guangzhou', 'Beijing', 'Shenzhen'] },
  { parent: 'Delhi', children: ['New Delhi'] },
  { parent: 'Gujarat', children: ['Gandhinagar', 'Ahmedabad', 'Surat', 'Rajkot'] },
  { parent: 'Haryana', children: ['Gurugram', 'Faridabad'] },
  { parent: 'Karnataka', children: ['Bengaluru'] },
  { parent: 'Maharashtra', children: ['Mumbai', 'Pune', 'Nagpur'] },
  { parent: 'Rajasthan', children: ['Jaipur', 'Jodhpur', 'Udaipur'] },
  { parent: 'Tamil Nadu', children: ['Chennai', 'Coimbatore'] },
  { parent: 'Telangana', children: ['Hyderabad'] },
  { parent: 'Uttar Pradesh', children: ['Greater Noida', 'Noida', 'Lucknow'] },
  { parent: 'West Bengal', children: ['Kolkata'] },
  { parent: 'United Arab Emirates', children: ['Dubai', 'Abu Dhabi'] },
  { parent: 'United Kingdom', children: ['London', 'Birmingham'] },
  { parent: 'Germany', children: ['Frankfurt', 'Munich', 'Berlin', 'Düsseldorf'] },
  { parent: 'United States', children: ['Las Vegas', 'New York', 'Chicago', 'Orlando'] }
];

export const slugifyVenueText = (text = '') =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const stripHtmlToPlain = (html = '') =>
  String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export default function WordPressVenueModal({
  isOpen,
  mode = 'create', // 'create' | 'edit'
  form,
  setForm,
  onClose,
  onSubmit,
  saving = false,
  allVenues = [],
  onUploadImageFile,
  clientOrigin = 'https://client.visitexpo.in',
  showSweetSuccess,
  showSweetError
}) {
  const [editorTab, setEditorTab] = useState('visual'); // 'visual' | 'code'
  const [headingTag, setHeadingTag] = useState('p');
  const [categoryTab, setCategoryTab] = useState('all'); // 'all' | 'most_used'
  const [categorySearch, setCategorySearch] = useState('');
  const [seoAnalysisOpen, setSeoAnalysisOpen] = useState(true);
  const [advancedSeoOpen, setAdvancedSeoOpen] = useState(false);
  const [relatedKeyphraseOpen, setRelatedKeyphraseOpen] = useState(false);
  const [newRelatedKeyphrase, setNewRelatedKeyphrase] = useState('');
  const [editingStatus, setEditingStatus] = useState(false);
  const [editingVisibility, setEditingVisibility] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [uploadingInlineMedia, setUploadingInlineMedia] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const visualEditorRef = useRef(null);
  const inlineMediaInputRef = useRef(null);
  const coverFileInputRef = useRef(null);
  const logoFileInputRef = useRef(null);

  // Sync visual contentEditable whenever modal opens or user switches back to visual tab
  useEffect(() => {
    if (isOpen && editorTab === 'visual' && visualEditorRef.current) {
      const currentHtml = form.overviewDescription || '';
      if (visualEditorRef.current.innerHTML !== currentHtml) {
        visualEditorRef.current.innerHTML = currentHtml;
      }
    }
  }, [isOpen, editorTab]);

  useEffect(() => {
    if (isOpen) {
      setSlugManuallyEdited(mode === 'edit' && Boolean(form.slug));
    }
  }, [isOpen, mode]);

  const seo = useMemo(
    () => ({
      seoTitle: form.seo?.seoTitle || '',
      metaDescription: form.seo?.metaDescription || '',
      focusKeyword: form.seo?.focusKeyword || '',
      relatedKeyphrases: Array.isArray(form.seo?.relatedKeyphrases) ? form.seo.relatedKeyphrases : [],
      isCornerstone: Boolean(form.seo?.isCornerstone),
      canonicalUrl: form.seo?.canonicalUrl || '',
      metaRobotsIndex: form.seo?.metaRobotsIndex || 'index',
      metaRobotsFollow: form.seo?.metaRobotsFollow || 'follow'
    }),
    [form.seo]
  );

  const updateSeoField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      seo: {
        ...(prev.seo || {}),
        [key]: value
      }
    }));
  };

  // Word count from overviewDescription
  const plainOverview = useMemo(
    () => stripHtmlToPlain(form.overviewDescription || ''),
    [form.overviewDescription]
  );

  const wordCount = useMemo(() => {
    if (!plainOverview) return 0;
    return plainOverview.split(/\s+/).filter(Boolean).length;
  }, [plainOverview]);

  // Execute rich text formatting command in visual editor
  const execEditorCommand = (command, value = null) => {
    if (editorTab !== 'visual' || !visualEditorRef.current) return;
    visualEditorRef.current.focus();
    document.execCommand(command, false, value);
    const updatedHtml = visualEditorRef.current.innerHTML;
    setForm((prev) => ({ ...prev, overviewDescription: updatedHtml }));
  };

  const handleHeadingChange = (e) => {
    const tag = e.target.value;
    setHeadingTag(tag);
    if (editorTab === 'visual' && visualEditorRef.current) {
      visualEditorRef.current.focus();
      document.execCommand('formatBlock', false, tag);
      setForm((prev) => ({
        ...prev,
        overviewDescription: visualEditorRef.current.innerHTML
      }));
    }
  };

  const handleInsertLink = () => {
    const url = window.prompt('Enter destination URL (e.g. https://visitexpo.in):', 'https://');
    if (!url || url === 'https://') return;
    if (editorTab === 'visual' && visualEditorRef.current) {
      execEditorCommand('createLink', url);
    } else {
      setForm((prev) => ({
        ...prev,
        overviewDescription: `${prev.overviewDescription || ''} <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
      }));
    }
  };

  // Upload media via '+ Add Media' button
  const handleAddMediaUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadImageFile) return;
    try {
      setUploadingInlineMedia(true);
      const url = await onUploadImageFile(file);
      if (url) {
        const imgTag = `<p><img src="${url}" alt="${form.name || 'Venue media'}" style="max-width:100%;height:auto;border-radius:12px;margin:8px 0;" /></p>`;
        const nextHtml = `${form.overviewDescription || ''}${imgTag}`;
        setForm((prev) => ({
          ...prev,
          overviewDescription: nextHtml,
          heroBanner: prev.heroBanner || url,
          gallery: Array.isArray(prev.gallery)
            ? prev.gallery.includes(url)
              ? prev.gallery
              : [...prev.gallery, url]
            : [url]
        }));
        if (editorTab === 'visual' && visualEditorRef.current) {
          visualEditorRef.current.innerHTML = nextHtml;
        }
        showSweetSuccess?.('Media uploaded and inserted into venue editor!');
      }
    } catch (err) {
      showSweetError?.(err.message || 'Failed to upload media.');
    } finally {
      setUploadingInlineMedia(false);
      if (inlineMediaInputRef.current) inlineMediaInputRef.current.value = '';
    }
  };

  // Upload Hero Cover Photo directly
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadImageFile) return;
    try {
      setUploadingCover(true);
      const url = await onUploadImageFile(file);
      if (url) {
        setForm((prev) => ({ ...prev, heroBanner: url }));
        showSweetSuccess?.('Hero cover banner uploaded!');
      }
    } catch (err) {
      showSweetError?.(err.message || 'Failed to upload cover photo.');
    } finally {
      setUploadingCover(false);
      if (coverFileInputRef.current) coverFileInputRef.current.value = '';
    }
  };

  // Upload Logo Thumbnail directly
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadImageFile) return;
    try {
      setUploadingLogo(true);
      const url = await onUploadImageFile(file);
      if (url) {
        setForm((prev) => ({ ...prev, logoThumbnail: url }));
        showSweetSuccess?.('Logo thumbnail uploaded!');
      }
    } catch (err) {
      showSweetError?.(err.message || 'Failed to upload logo.');
    } finally {
      setUploadingLogo(false);
      if (logoFileInputRef.current) logoFileInputRef.current.value = '';
    }
  };

  // Build hierarchical Venue Category tree from DEFAULT_CATEGORY_TREE + live directory venues
  const categoryTree = useMemo(() => {
    const treeMap = new Map();
    const usageCount = new Map();

    DEFAULT_CATEGORY_TREE.forEach((group) => {
      treeMap.set(group.parent, new Set(group.children));
    });

    allVenues.forEach((v) => {
      const stateOrCountry = String(v.state || v.country || '').trim();
      const city = String(v.city || '').trim();
      if (stateOrCountry) {
        usageCount.set(stateOrCountry, (usageCount.get(stateOrCountry) || 0) + 1);
        if (!treeMap.has(stateOrCountry)) {
          treeMap.set(stateOrCountry, new Set());
        }
        if (city && city.toLowerCase() !== stateOrCountry.toLowerCase()) {
          treeMap.get(stateOrCountry).add(city);
          usageCount.set(city, (usageCount.get(city) || 0) + 1);
        }
      }
    });

    const q = categorySearch.toLowerCase().trim();
    const entries = Array.from(treeMap.entries())
      .map(([parent, childrenSet]) => ({
        parent,
        count: usageCount.get(parent) || 0,
        children: Array.from(childrenSet).sort((a, b) => a.localeCompare(b))
      }))
      .filter((item) => {
        if (!q) return true;
        if (item.parent.toLowerCase().includes(q)) return true;
        return item.children.some((c) => c.toLowerCase().includes(q));
      });

    if (categoryTab === 'most_used') {
      return entries
        .sort((a, b) => b.count - a.count || a.parent.localeCompare(b.parent))
        .slice(0, 15);
    }

    return entries.sort((a, b) => a.parent.localeCompare(b.parent));
  }, [allVenues, categorySearch, categoryTab]);

  const selectedCategories = useMemo(
    () => (Array.isArray(form.venueCategories) ? form.venueCategories : []),
    [form.venueCategories]
  );

  const toggleVenueCategory = (catName, isChild = false, parentName = '') => {
    setForm((prev) => {
      const current = Array.isArray(prev.venueCategories) ? [...prev.venueCategories] : [];
      const exists = current.includes(catName);
      let nextCategories;
      if (exists) {
        nextCategories = current.filter((c) => c !== catName);
      } else {
        nextCategories = [...current, catName];
        if (isChild && parentName && !nextCategories.includes(parentName)) {
          nextCategories.push(parentName);
        }
      }

      const nextState = { ...prev, venueCategories: nextCategories };
      // Auto-fill city & state when checking a category if not already set or when selecting a city
      if (!exists) {
        if (isChild) {
          nextState.city = catName;
          if (parentName) nextState.state = parentName;
        } else if (!prev.state) {
          nextState.state = catName;
        }
      }
      return nextState;
    });
  };

  // Yoast SEO variable insertion & smart generators
  const resolveSeoTemplatePreview = (rawText, fallbackText) => {
    const source = String(rawText || fallbackText || '').trim();
    const vTitle = form.name || 'Exhibition Venue';
    const vCity = form.city ? ` in ${form.city}` : '';
    return source
      .replace(/%%title%%|\{\{title\}\}/gi, vTitle)
      .replace(/%%page%%|\{\{page\}\}/gi, '')
      .replace(/%%sep%%|\{\{sep\}\}/gi, '—')
      .replace(/%%sitename%%|\{\{sitename\}\}/gi, 'VisitExpo')
      .replace(/%%city%%|\{\{city\}\}/gi, form.city || '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handleInsertSeoVariable = (field, token) => {
    const current = String(seo[field] || '');
    const spacer = current && !current.endsWith(' ') ? ' ' : '';
    updateSeoField(field, `${current}${spacer}${token}`);
  };

  const handleGenerateSeoTitle = () => {
    const vName = (form.name || 'Convention & Exhibition Venue').trim();
    const vCity = (form.city || '').trim();
    const vShort = (form.shortName || '').trim();
    const shortPart = vShort && vShort.toLowerCase() !== vName.toLowerCase() ? ` (${vShort})` : '';
    const cityPart = vCity ? `, ${vCity}` : '';
    const generated = `${vName}${shortPart}${cityPart} — Upcoming Expos & Venue Guide | VisitExpo`;
    updateSeoField('seoTitle', generated);
    if (!seo.focusKeyword && form.name) {
      updateSeoField('focusKeyword', form.name.trim());
    }
  };

  const handleGenerateMetaDescription = () => {
    const vName = (form.name || 'this exhibition venue').trim();
    const vCity = (form.city || 'India').trim();
    const vArea = form.totalArea ? ` spanning ${form.totalArea}` : '';
    const baseText = plainOverview
      ? plainOverview.slice(0, 145)
      : `Discover upcoming trade shows, B2B exhibitions, hall capacities${vArea}, nearby hotels, and transit directions at ${vName} in ${vCity} on VisitExpo.`;
    const generated =
      baseText.length <= 156 ? baseText : `${baseText.slice(0, 153).trim()}...`;
    updateSeoField('metaDescription', generated);
  };

  const handleAddRelatedKeyphrase = () => {
    const cleaned = newRelatedKeyphrase.trim();
    if (!cleaned) return;
    if (!seo.relatedKeyphrases.includes(cleaned)) {
      updateSeoField('relatedKeyphrases', [...seo.relatedKeyphrases, cleaned]);
    }
    setNewRelatedKeyphrase('');
  };

  const handleRemoveRelatedKeyphrase = (kw) => {
    updateSeoField(
      'relatedKeyphrases',
      seo.relatedKeyphrases.filter((item) => item !== kw)
    );
  };

  // Live Yoast SEO & Readability Analysis Calculations
  const resolvedSlug = useMemo(
    () => (form.slug ? slugifyVenueText(form.slug) : slugifyVenueText(form.name || 'new-venue')),
    [form.slug, form.name]
  );

  const previewSeoTitle = useMemo(() => {
    const fallback = `${form.name || 'Venue Title'}${form.city ? ` in ${form.city}` : ''} — Upcoming Expos & Venue Guide | VisitExpo`;
    return resolveSeoTemplatePreview(seo.seoTitle, fallback);
  }, [seo.seoTitle, form.name, form.city]);

  const previewMetaDesc = useMemo(() => {
    const fallback =
      plainOverview.slice(0, 155) ||
      `Explore upcoming trade shows, hall capacities, nearby hotels, and transit directions for ${form.name || 'this venue'}${form.city ? ` in ${form.city}` : ''} on VisitExpo.`;
    return resolveSeoTemplatePreview(seo.metaDescription, fallback);
  }, [seo.metaDescription, plainOverview, form.name, form.city]);

  const seoChecks = useMemo(() => {
    const checks = [];
    const focus = (seo.focusKeyword || form.name || '').toLowerCase().trim();
    const titleLen = previewSeoTitle.length;
    const descLen = previewMetaDesc.length;

    // 1. SEO Title length
    if (titleLen >= 35 && titleLen <= 68) {
      checks.push({
        status: 'good',
        label: `SEO title length: ${titleLen} characters (optimal width for Google search results).`
      });
    } else if (titleLen > 0) {
      checks.push({
        status: 'ok',
        label: `SEO title length: ${titleLen} characters (recommended between 35 and 65 characters).`
      });
    } else {
      checks.push({
        status: 'bad',
        label: 'SEO title is empty. Click "Generate SEO title" or enter a custom title.'
      });
    }

    // 2. Meta Description length
    if (descLen >= 110 && descLen <= 165) {
      checks.push({
        status: 'good',
        label: `Meta description length: ${descLen} characters (well optimized).`
      });
    } else if (descLen > 0) {
      checks.push({
        status: 'ok',
        label: `Meta description length: ${descLen} characters (recommended 120–158 characters).`
      });
    } else {
      checks.push({
        status: 'bad',
        label: 'No meta description specified. Click "Generate meta description" for better CTR.'
      });
    }

    // 3. Keyphrase in SEO title
    if (focus && previewSeoTitle.toLowerCase().includes(focus)) {
      checks.push({
        status: 'good',
        label: `Keyphrase in SEO title: "${seo.focusKeyword || form.name}" appears in the SEO title.`
      });
    } else {
      checks.push({
        status: 'ok',
        label: 'Keyphrase in SEO title: Include the venue name or focus keyphrase in the SEO title.'
      });
    }

    // 4. Keyphrase in Slug
    if (resolvedSlug && resolvedSlug.length >= 3) {
      checks.push({
        status: 'good',
        label: `SEO-friendly URL slug: visitexpo.in/venue/${resolvedSlug}`
      });
    } else {
      checks.push({
        status: 'bad',
        label: 'Slug is missing. Enter a venue title or custom slug.'
      });
    }

    // 5. Overview content length
    if (wordCount >= 25) {
      checks.push({
        status: 'good',
        label: `Text length: The venue overview contains ${wordCount} words.`
      });
    } else if (wordCount >= 10) {
      checks.push({
        status: 'ok',
        label: `Text length: ${wordCount} words. Add more architectural & transit details (25+ words recommended).`
      });
    } else {
      checks.push({
        status: 'bad',
        label: `Text length: ${wordCount} words. Write a detailed venue overview in the editor above.`
      });
    }

    // 6. Location & Media completeness
    if (form.city && form.address && form.heroBanner) {
      checks.push({
        status: 'good',
        label: 'Local SEO & Schema.org: City, street address, and hero banner image are complete.'
      });
    } else {
      checks.push({
        status: 'ok',
        label: 'Local SEO: Fill in City, Physical Address, and Hero Cover Photo for rich Google Venue cards.'
      });
    }

    return checks;
  }, [seo.focusKeyword, form.name, form.city, form.address, form.heroBanner, previewSeoTitle, previewMetaDesc, resolvedSlug, wordCount]);

  const overallSeoStatus = useMemo(() => {
    const goodCount = seoChecks.filter((c) => c.status === 'good').length;
    const badCount = seoChecks.filter((c) => c.status === 'bad').length;
    if (badCount === 0 && goodCount >= 4) return { label: 'Good', color: 'text-emerald-600', dot: 'bg-emerald-500' };
    if (goodCount >= 3) return { label: 'OK', color: 'text-amber-500', dot: 'bg-amber-500' };
    return { label: 'Needs improvement', color: 'text-rose-500', dot: 'bg-rose-500' };
  }, [seoChecks]);

  const readabilityStatus = useMemo(() => {
    if (wordCount >= 15) return { label: 'Good', color: 'text-emerald-600', dot: 'bg-emerald-500' };
    if (wordCount > 0) return { label: 'OK', color: 'text-amber-500', dot: 'bg-amber-500' };
    return { label: 'Not available', color: 'text-muted-foreground', dot: 'bg-zinc-400' };
  }, [wordCount]);

  if (!isOpen) return null;

  const handleSaveAsDraft = (e) => {
    e.preventDefault();
    setForm((prev) => ({ ...prev, status: 'draft' }));
    onSubmit(e, 'draft');
  };

  const handlePrimaryPublish = (e) => {
    e.preventDefault();
    onSubmit(e, form.status || 'published');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={inlineMediaInputRef}
        onChange={handleAddMediaUpload}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={coverFileInputRef}
        onChange={handleCoverUpload}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={logoFileInputRef}
        onChange={handleLogoUpload}
        accept="image/*"
        className="hidden"
      />

      <div className="relative w-full max-w-6xl bg-background rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top WordPress-Style Header Bar */}
        <div className="px-5 py-3.5 border-b border-border bg-card flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
              {mode === 'create' ? <Plus className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-foreground tracking-tight">
                {mode === 'create' ? 'Add New Venue' : `Edit Venue: ${form.name || ''}`}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Venue Content Editor &amp; Search Appearance Optimization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border border-border bg-muted/50 ${overallSeoStatus.color}`}>
              <span className={`h-2 w-2 rounded-full ${overallSeoStatus.dot}`} />
              <span>SEO: {overallSeoStatus.label}</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Main Scrollable WordPress Two-Column Workspace */}
        <form onSubmit={handlePrimaryPublish} className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* ================================================================= */}
            {/* LEFT COLUMN (8 COLS): TITLE, RICH EDITOR, SPECS, YOAST SEO         */}
            {/* ================================================================= */}
            <div className="lg:col-span-8 space-y-5">
              {/* 1. WordPress Title Input ('Add title') & Permalink Preview */}
              <div className="space-y-2">
                <input
                  type="text"
                  required
                  placeholder="Add title (e.g. Bharat Mandapam Exhibition Complex)"
                  value={form.name || ''}
                  onChange={(e) => {
                    const nextName = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      name: nextName,
                      slug: slugManuallyEdited ? prev.slug : slugifyVenueText(nextName)
                    }));
                  }}
                  className="w-full px-4 py-3 rounded-lg bg-card border-2 border-primary/60 focus:border-primary text-base sm:text-lg font-bold text-foreground placeholder:text-muted-foreground focus:outline-none shadow-2xs transition-colors"
                />

                <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold">Permalink:</span>
                    <span className="text-primary font-mono">
                      {clientOrigin}/venue/{resolvedSlug || 'venue-slug'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Short Name (e.g. BIEC, DWTC)"
                      value={form.shortName || ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, shortName: e.target.value }))}
                      className="px-2.5 py-1 rounded-md bg-card border border-border text-xs text-foreground focus:outline-none focus:border-primary w-44"
                    />
                    <input
                      type="text"
                      placeholder="Tagline (optional)"
                      value={form.tagline || ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, tagline: e.target.value }))}
                      className="px-2.5 py-1 rounded-md bg-card border border-border text-xs text-foreground focus:outline-none focus:border-primary w-52 hidden sm:block"
                    />
                  </div>
                </div>
              </div>

              {/* 2. WordPress Classic Rich Content Editor ('Add Media', 'Visual'/'Code', Toolbar, Word Count) */}
              <div className="bg-card border border-border rounded-xl shadow-2xs overflow-hidden">
                {/* Top Editor Bar: Add Media button + Visual / Code Tabs */}
                <div className="px-3.5 pt-3 pb-2 bg-muted/40 border-b border-border flex items-center justify-between gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => inlineMediaInputRef.current?.click()}
                    disabled={uploadingInlineMedia}
                    className="px-3 py-1.5 rounded-md border border-primary/50 bg-card hover:bg-primary/10 text-primary text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    {uploadingInlineMedia ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ImageIcon className="h-3.5 w-3.5" />
                    )}
                    <span>Add Media</span>
                  </button>

                  <div className="inline-flex items-center rounded-md border border-border bg-background p-0.5">
                    <button
                      type="button"
                      onClick={() => setEditorTab('visual')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                        editorTab === 'visual'
                          ? 'bg-card text-foreground shadow-2xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Visual
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorTab('code')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                        editorTab === 'code'
                          ? 'bg-card text-foreground shadow-2xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Code
                    </button>
                  </div>
                </div>

                {/* Formatting Toolbar (Paragraph dropdown, B, I, Lists, Quote, Align, Link, HR) */}
                <div className="px-3 py-2 bg-muted/20 border-b border-border flex items-center gap-1 flex-wrap">
                  <select
                    value={headingTag}
                    onChange={handleHeadingChange}
                    className="px-2.5 py-1 rounded border border-border bg-card text-xs font-semibold text-foreground focus:outline-none mr-1"
                  >
                    <option value="p">Paragraph</option>
                    <option value="h2">Heading 2</option>
                    <option value="h3">Heading 3</option>
                    <option value="h4">Heading 4</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => execEditorCommand('bold')}
                    title="Bold"
                    className="p-1.5 rounded hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    <Bold className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execEditorCommand('italic')}
                    title="Italic"
                    className="p-1.5 rounded hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </button>
                  <span className="h-4 w-px bg-border mx-1" />
                  <button
                    type="button"
                    onClick={() => execEditorCommand('insertUnorderedList')}
                    title="Bulleted list"
                    className="p-1.5 rounded hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execEditorCommand('insertOrderedList')}
                    title="Numbered list"
                    className="p-1.5 rounded hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    <ListOrdered className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execEditorCommand('formatBlock', 'blockquote')}
                    title="Blockquote"
                    className="p-1.5 rounded hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    <Quote className="h-3.5 w-3.5" />
                  </button>
                  <span className="h-4 w-px bg-border mx-1" />
                  <button
                    type="button"
                    onClick={() => execEditorCommand('justifyLeft')}
                    title="Align left"
                    className="p-1.5 rounded hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    <AlignLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execEditorCommand('justifyCenter')}
                    title="Align center"
                    className="p-1.5 rounded hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    <AlignCenter className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execEditorCommand('justifyRight')}
                    title="Align right"
                    className="p-1.5 rounded hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    <AlignRight className="h-3.5 w-3.5" />
                  </button>
                  <span className="h-4 w-px bg-border mx-1" />
                  <button
                    type="button"
                    onClick={handleInsertLink}
                    title="Insert/edit link"
                    className="p-1.5 rounded hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => execEditorCommand('insertHorizontalRule')}
                    title="Horizontal line"
                    className="p-1.5 rounded hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Editor Body: Visual or HTML Code */}
                {editorTab === 'visual' ? (
                  <div
                    ref={visualEditorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => {
                      const html = e.currentTarget.innerHTML;
                      setForm((prev) => ({ ...prev, overviewDescription: html }));
                    }}
                    data-placeholder="Write comprehensive venue overview, hall specifications, exhibition facilities, and visitor transit guide..."
                    className="min-h-[210px] max-h-[340px] overflow-y-auto p-4 text-xs sm:text-sm text-foreground leading-relaxed focus:outline-none prose prose-sm max-w-none"
                  />
                ) : (
                  <textarea
                    rows={9}
                    value={form.overviewDescription || ''}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, overviewDescription: e.target.value }))
                    }
                    placeholder="Write venue description HTML or plain text..."
                    className="w-full p-4 bg-background text-xs sm:text-sm font-mono text-foreground focus:outline-none resize-y"
                  />
                )}

                {/* Word Count Footer Bar */}
                <div className="px-4 py-2 bg-muted/30 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Word count: {wordCount}</span>
                  <span>Characters: {plainOverview.length}</span>
                </div>
              </div>

              {/* 3. Venue Location & Facility Specifications Box */}
              <div className="bg-card border border-border rounded-xl shadow-2xs overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <h4 className="font-bold text-xs sm:text-sm text-foreground">
                    Venue Location &amp; Hall Specifications
                  </h4>
                </div>
                <div className="p-4 space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        placeholder="India"
                        value={form.country || ''}
                        onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                        State / Province
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Delhi, Maharashtra"
                        value={form.state || ''}
                        onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. New Delhi, Mumbai"
                        value={form.city || ''}
                        onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                      Official Physical Address
                    </label>
                    <input
                      type="text"
                      placeholder="Full street address, exhibition complex sector & postal code"
                      value={form.address || ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                        Metro / Transit Connection
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Supreme Court Metro Station (Blue Line)"
                        value={form.metro || ''}
                        onChange={(e) => setForm((prev) => ({ ...prev, metro: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                        Airport Distance
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 18 km from IGI International Airport"
                        value={form.airportDistance || ''}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, airportDistance: e.target.value }))
                        }
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                        Total Floor Space
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 100,000+ sqm Indoor"
                        value={form.totalArea || ''}
                        onChange={(e) => setForm((prev) => ({ ...prev, totalArea: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                        Halls &amp; Meeting Rooms
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 14 Exhibition Halls"
                        value={form.meetingRooms || ''}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, meetingRooms: e.target.value }))
                        }
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                        Built / Renovated Year
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 2023"
                        value={form.builtYear || ''}
                        onChange={(e) => setForm((prev) => ({ ...prev, builtYear: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. SEARCH APPEARANCE & SEO PANEL */}
              <div className="bg-card border border-border rounded-xl shadow-2xs overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full ${overallSeoStatus.dot}`} />
                    <h4 className="font-extrabold text-sm text-foreground">Search Appearance</h4>
                  </div>
                </div>

                <div className="p-4 sm:p-5 space-y-5 text-xs">
                  {/* Focus Keyphrase */}
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Focus keyphrase
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bharat Mandapam New Delhi Exhibition Venue"
                      value={seo.focusKeyword}
                      onChange={(e) => updateSeoField('focusKeyword', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* SEO Title with 'Insert variable' & '✨ Generate SEO title' */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <label className="text-xs font-bold text-foreground">SEO title</label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <div className="inline-flex items-center gap-1">
                          {[
                            { label: 'Title', token: '%%title%%' },
                            { label: 'City', token: '%%city%%' },
                            { label: 'Separator', token: '—' },
                            { label: 'Site title', token: 'VisitExpo' }
                          ].map((v) => (
                            <button
                              key={v.label}
                              type="button"
                              onClick={() => handleInsertSeoVariable('seoTitle', v.token)}
                              className="px-2 py-1 rounded border border-border bg-muted/50 hover:bg-muted text-[10px] font-semibold text-foreground transition-colors cursor-pointer"
                              title={`Insert ${v.label}`}
                            >
                              + {v.label}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={handleGenerateSeoTitle}
                          className="px-2.5 py-1 rounded-md border border-primary/50 bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>Generate SEO title</span>
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={seo.seoTitle}
                      onChange={(e) => updateSeoField('seoTitle', e.target.value)}
                      placeholder="%%title%% — Upcoming Expos & Venue Guide | VisitExpo"
                      className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-foreground focus:border-primary focus:outline-none"
                    />

                    {/* Character Progress Bar */}
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          previewSeoTitle.length >= 35 && previewSeoTitle.length <= 68
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.round((previewSeoTitle.length / 65) * 100))}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Slug */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-foreground">Slug</label>
                    <input
                      type="text"
                      value={form.slug || ''}
                      onChange={(e) => {
                        setSlugManuallyEdited(true);
                        setForm((prev) => ({ ...prev, slug: slugifyVenueText(e.target.value) }));
                      }}
                      placeholder={resolvedSlug || 'venue-url-slug'}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground font-mono text-xs focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Meta Description with 'Insert variable' & '✨ Generate meta description' */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <label className="text-xs font-bold text-foreground">Meta description</label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <div className="inline-flex items-center gap-1">
                          {[
                            { label: 'Title', token: '%%title%%' },
                            { label: 'City', token: '%%city%%' },
                            { label: 'Site title', token: 'VisitExpo' }
                          ].map((v) => (
                            <button
                              key={v.label}
                              type="button"
                              onClick={() => handleInsertSeoVariable('metaDescription', v.token)}
                              className="px-2 py-1 rounded border border-border bg-muted/50 hover:bg-muted text-[10px] font-semibold text-foreground transition-colors cursor-pointer"
                            >
                              + {v.label}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={handleGenerateMetaDescription}
                          className="px-2.5 py-1 rounded-md border border-primary/50 bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>Generate meta description</span>
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={3}
                      value={seo.metaDescription}
                      onChange={(e) => updateSeoField('metaDescription', e.target.value)}
                      placeholder="Write or auto-generate an engaging 120–158 character meta description for search results..."
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:border-primary focus:outline-none resize-none"
                    />

                    {/* Character Progress Bar */}
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          previewMetaDesc.length >= 110 && previewMetaDesc.length <= 165
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.round((previewMetaDesc.length / 160) * 100))}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Accordion 1: SEO analysis */}
                  <div className="border-t border-border pt-3">
                    <button
                      type="button"
                      onClick={() => setSeoAnalysisOpen(!seoAnalysisOpen)}
                      className="w-full flex items-center justify-between py-2 text-left font-bold text-xs text-foreground cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${overallSeoStatus.dot}`} />
                        <span>SEO analysis</span>
                        <span className={`text-[11px] font-semibold ${overallSeoStatus.color}`}>
                          ({overallSeoStatus.label})
                        </span>
                      </span>
                      {seoAnalysisOpen ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>

                    {seoAnalysisOpen && (
                      <div className="mt-2 space-y-2 pl-1">
                        {seoChecks.map((check, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs">
                            <span
                              className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${
                                check.status === 'good'
                                  ? 'bg-emerald-500'
                                  : check.status === 'ok'
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                            />
                            <span className="text-muted-foreground">{check.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Accordion 2: Add related keyphrase */}
                  <div className="border-t border-border pt-3">
                    <button
                      type="button"
                      onClick={() => setRelatedKeyphraseOpen(!relatedKeyphraseOpen)}
                      className="w-full flex items-center justify-between py-2 text-left font-bold text-xs text-foreground cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Add related keyphrase</span>
                        {seo.relatedKeyphrases.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px]">
                            {seo.relatedKeyphrases.length}
                          </span>
                        )}
                      </span>
                      {relatedKeyphraseOpen ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>

                    {relatedKeyphraseOpen && (
                      <div className="mt-2 space-y-2.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newRelatedKeyphrase}
                            onChange={(e) => setNewRelatedKeyphrase(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddRelatedKeyphrase();
                              }
                            }}
                            placeholder="Enter related SEO keyphrase (e.g. Pragati Maidan Trade Fair)"
                            className="flex-1 px-3 py-1.5 rounded-lg bg-background border border-border text-foreground focus:border-primary focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleAddRelatedKeyphrase}
                            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs cursor-pointer"
                          >
                            + Add
                          </button>
                        </div>

                        {seo.relatedKeyphrases.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {seo.relatedKeyphrases.map((kw) => (
                              <span
                                key={kw}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-foreground text-[11px] font-semibold"
                              >
                                <span>{kw}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRelatedKeyphrase(kw)}
                                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ================================================================= */}
            {/* RIGHT COLUMN (4 COLS): PUBLISH BOX, CATEGORIES BOX, MEDIA UPLOAD  */}
            {/* ================================================================= */}
            <div className="lg:col-span-4 space-y-5">
              {/* 1. WordPress Publish Box */}
              <div className="bg-card border border-border rounded-xl shadow-2xs overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center justify-between">
                  <h4 className="font-bold text-xs sm:text-sm text-foreground">Publish</h4>
                </div>

                <div className="p-4 space-y-3 text-xs">
                  {/* Save Draft & Preview Buttons */}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleSaveAsDraft}
                      disabled={saving}
                      className="px-3 py-1.5 rounded-md border border-primary/50 bg-background hover:bg-muted text-primary font-bold text-xs transition-colors cursor-pointer"
                    >
                      Save Draft
                    </button>
                    {resolvedSlug && (
                      <a
                        href={`${clientOrigin}/venue/${resolvedSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-md border border-primary/50 bg-background hover:bg-muted text-primary font-bold text-xs inline-flex items-center gap-1 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Preview</span>
                      </a>
                    )}
                  </div>

                  {/* Status: Draft / Published */}
                  <div className="space-y-1.5 pt-1 text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>
                        📌 Status:{' '}
                        <strong className="text-foreground capitalize">
                          {form.status || 'Published'}
                        </strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingStatus(!editingStatus)}
                        className="text-primary underline font-semibold cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                    {editingStatus && (
                      <select
                        value={form.status || 'published'}
                        onChange={(e) => {
                          setForm((prev) => ({ ...prev, status: e.target.value }));
                          setEditingStatus(false);
                        }}
                        className="w-full px-2.5 py-1.5 rounded border border-border bg-background text-foreground text-xs"
                      >
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                      </select>
                    )}

                    {/* Visibility: Public / Private */}
                    <div className="flex items-center justify-between">
                      <span>
                        👁️ Visibility:{' '}
                        <strong className="text-foreground capitalize">
                          {form.visibility || 'Public'}
                        </strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingVisibility(!editingVisibility)}
                        className="text-primary underline font-semibold cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                    {editingVisibility && (
                      <select
                        value={form.visibility || 'public'}
                        onChange={(e) => {
                          setForm((prev) => ({ ...prev, visibility: e.target.value }));
                          setEditingVisibility(false);
                        }}
                        className="w-full px-2.5 py-1.5 rounded border border-border bg-background text-foreground text-xs"
                      >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                      </select>
                    )}

                    {/* Publish timing */}
                    <div className="flex items-center justify-between">
                      <span>
                        📅 Publish: <strong className="text-foreground">immediately</strong>
                      </span>
                    </div>

                    {/* SEO analysis status line */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className={`h-2.5 w-2.5 rounded-full ${overallSeoStatus.dot}`} />
                      <span>
                        SEO analysis:{' '}
                        <strong className={overallSeoStatus.color}>{overallSeoStatus.label}</strong>
                      </span>
                    </div>

                    {/* Readability analysis status line */}
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${readabilityStatus.dot}`} />
                      <span>
                        Readability analysis:{' '}
                        <strong className={readabilityStatus.color}>
                          {readabilityStatus.label}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Publish Footer */}
                <div className="px-4 py-3 bg-muted/40 border-t border-border flex items-center justify-between">
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-xs font-semibold text-rose-500 hover:underline cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    <span>{mode === 'create' ? 'Publish' : 'Update Venue'}</span>
                  </button>
                </div>
              </div>

              {/* 2. WordPress Categories Box ('Venue Category' / 'Most Used' Tabs) */}
              <div className="bg-card border border-border rounded-xl shadow-2xs overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center justify-between">
                  <h4 className="font-bold text-xs sm:text-sm text-foreground">Categories</h4>
                  {selectedCategories.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {selectedCategories.length} selected
                    </span>
                  )}
                </div>

                <div className="p-3.5 space-y-2.5 text-xs">
                  {/* Tabs: Venue Category / Most Used */}
                  <div className="flex items-center border-b border-border">
                    <button
                      type="button"
                      onClick={() => setCategoryTab('all')}
                      className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                        categoryTab === 'all'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Venue Category
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryTab('most_used')}
                      className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                        categoryTab === 'most_used'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Most Used
                    </button>
                  </div>

                  {/* Quick filter input */}
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      placeholder="Filter state / city categories..."
                      className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Hierarchical Checkboxes List */}
                  <div className="max-h-56 overflow-y-auto border border-border rounded-lg p-2.5 bg-background space-y-1.5">
                    {categoryTree.map((group) => (
                      <div key={group.parent} className="space-y-1">
                        <label className="flex items-center gap-2 text-xs text-foreground font-semibold cursor-pointer hover:text-primary">
                          <input
                            type="checkbox"
                            checked={
                              selectedCategories.includes(group.parent) ||
                              form.state === group.parent ||
                              form.country === group.parent
                            }
                            onChange={() => toggleVenueCategory(group.parent, false)}
                            className="rounded border-border text-primary focus:ring-primary"
                          />
                          <span>{group.parent}</span>
                        </label>

                        {group.children.length > 0 && (
                          <div className="pl-5 space-y-1">
                            {group.children.map((childCity) => (
                              <label
                                key={`${group.parent}-${childCity}`}
                                className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground"
                              >
                                <input
                                  type="checkbox"
                                  checked={
                                    selectedCategories.includes(childCity) ||
                                    form.city === childCity
                                  }
                                  onChange={() =>
                                    toggleVenueCategory(childCity, true, group.parent)
                                  }
                                  className="rounded border-border text-primary focus:ring-primary"
                                />
                                <span>{childCity}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Featured Venue Media (Direct Upload Hero Cover & Logo Thumbnail) */}
              <div className="bg-card border border-border rounded-xl shadow-2xs overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border bg-muted/30">
                  <h4 className="font-bold text-xs sm:text-sm text-foreground">
                    Featured Venue Images
                  </h4>
                </div>

                <div className="p-4 space-y-4 text-xs">
                  {/* Hero Cover Banner Upload */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase">
                      Hero Cover Banner Photo
                    </label>
                    {form.heroBanner && (
                      <div className="relative h-28 w-full rounded-lg overflow-hidden border border-border bg-muted">
                        <img
                          src={form.heroBanner}
                          alt="Hero Cover Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => coverFileInputRef.current?.click()}
                      disabled={uploadingCover}
                      className="w-full py-2 px-3 rounded-lg border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {uploadingCover ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      <span>
                        {uploadingCover ? 'Uploading Cover Photo...' : 'Upload Hero Cover Photo'}
                      </span>
                    </button>
                  </div>

                  {/* Logo Thumbnail Upload */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase">
                      Venue Logo / Card Thumbnail
                    </label>
                    <div className="flex items-center gap-3">
                      {form.logoThumbnail ? (
                        <img
                          src={form.logoThumbnail}
                          alt="Logo Preview"
                          className="h-12 w-12 rounded-lg object-cover border border-border shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg border border-border bg-muted flex items-center justify-center shrink-0">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => logoFileInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="flex-1 py-2 px-3 rounded-lg border border-border bg-background hover:bg-muted text-foreground font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {uploadingLogo ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                        <span>{uploadingLogo ? 'Uploading...' : 'Upload Logo File'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
