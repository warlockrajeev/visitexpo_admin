'use client';

/**
 * @file faqs/page.js
 * @description Super Admin FAQ Management Page.
 * Create, edit, reorder, categorize, toggle, and delete FAQs displayed across VisitExpo frontend.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  HelpCircle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  RefreshCw,
  Loader2,
  AlertTriangle,
  X,
  Save,
  Layers,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Check
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const DEFAULT_CATEGORIES = ['General', 'Organizers', 'Exhibitors', 'Visitors'];

export default function AdminFaqsPage() {
  const { accessToken } = useAuth();

  // Data State
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, hidden: 0 });
  const [categories, setCategories] = useState(['All', ...DEFAULT_CATEGORIES]);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' | 'active' | 'hidden'

  // Modal State (Create / Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null); // null = create mode
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'General',
    customCategory: '',
    order: 0,
    isActive: true
  });
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  // Expanded Answer Accordion
  const [expandedFaqId, setExpandedFaqId] = useState(null);

  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const headers = useMemo(() => {
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  }, [accessToken]);

  // Fetch all FAQs
  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (selectedCategory && selectedCategory !== 'All') params.set('category', selectedCategory);
      if (selectedStatus !== 'all') params.set('status', selectedStatus);

      const res = await axios.get(`${API_URL}/faqs/admin/all?${params.toString()}`, { headers });
      if (res.data?.success) {
        setFaqs(res.data.data || []);
        if (res.data.stats) setStats(res.data.stats);
        if (Array.isArray(res.data.categories) && res.data.categories.length > 0) {
          setCategories(res.data.categories);
        }
      }
    } catch (err) {
      console.error('Error fetching FAQs:', err);
    } finally {
      setLoading(false);
    }
  }, [headers, searchQuery, selectedCategory, selectedStatus]);

  useEffect(() => {
    if (accessToken) {
      fetchFaqs();
    }
  }, [accessToken, fetchFaqs]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingFaq(null);
    setFormData({
      question: '',
      answer: '',
      category: 'General',
      customCategory: '',
      order: faqs.length + 1,
      isActive: true
    });
    setModalError('');
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (faq) => {
    setEditingFaq(faq);
    const isStandardCat = DEFAULT_CATEGORIES.includes(faq.category);
    setFormData({
      question: faq.question || '',
      answer: faq.answer || '',
      category: isStandardCat ? faq.category : 'Custom',
      customCategory: isStandardCat ? '' : faq.category,
      order: faq.order !== undefined ? faq.order : 0,
      isActive: faq.isActive !== undefined ? faq.isActive : true
    });
    setModalError('');
    setModalOpen(true);
  };

  // Save (Create or Update) FAQ
  const handleSaveFaq = async (e) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.answer.trim()) {
      setModalError('Both Question and Answer are required.');
      return;
    }

    const finalCategory =
      formData.category === 'Custom'
        ? (formData.customCategory.trim() || 'General')
        : formData.category;

    setSaving(true);
    setModalError('');

    try {
      const payload = {
        question: formData.question.trim(),
        answer: formData.answer.trim(),
        category: finalCategory,
        order: Number(formData.order) || 0,
        isActive: formData.isActive
      };

      if (editingFaq) {
        await axios.put(`${API_URL}/faqs/admin/${editingFaq._id}`, payload, { headers });
      } else {
        await axios.post(`${API_URL}/faqs/admin`, payload, { headers });
      }

      setModalOpen(false);
      fetchFaqs();
    } catch (err) {
      console.error('Error saving FAQ:', err);
      setModalError(err.response?.data?.error || 'Failed to save FAQ.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Visibility status (Active / Hidden)
  const handleToggleStatus = async (faqId) => {
    setActionLoading((prev) => ({ ...prev, [`toggle_${faqId}`]: true }));
    try {
      await axios.put(`${API_URL}/faqs/admin/${faqId}/toggle`, {}, { headers });
      fetchFaqs();
    } catch (err) {
      console.error('Error toggling FAQ status:', err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`toggle_${faqId}`]: false }));
    }
  };

  // Delete FAQ
  const handleDeleteFaq = async (faqId) => {
    setActionLoading((prev) => ({ ...prev, [`delete_${faqId}`]: true }));
    try {
      await axios.delete(`${API_URL}/faqs/admin/${faqId}`, { headers });
      setDeleteConfirmId(null);
      fetchFaqs();
    } catch (err) {
      console.error('Error deleting FAQ:', err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`delete_${faqId}`]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            FAQ Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create, edit, categorize, and control the visibility of FAQs displayed on the VisitExpo landing page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchFaqs}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-card border border-border hover:bg-muted transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create FAQ</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-3.5 text-center shadow-xs">
          <p className="text-xl font-bold text-foreground">{stats.total}</p>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase mt-0.5">Total Questions</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3.5 text-center shadow-xs">
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.active}</p>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase mt-0.5">Live on Frontend</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3.5 text-center shadow-xs">
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{stats.hidden}</p>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase mt-0.5">Hidden / Draft</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl p-3.5 text-center shadow-xs">
          <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{categories.length > 1 ? categories.length - 1 : 1}</p>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase mt-0.5">Categories</p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search FAQs by question or answer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1">
          {['all', 'active', 'hidden'].map((s) => (
            <button
              key={s}
              onClick={() => setSelectedStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer capitalize ${
                selectedStatus === s
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-foreground border-border hover:bg-muted'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0 mr-1" />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === cat
                ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-950 dark:border-white'
                : 'bg-card text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* FAQs List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : faqs.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-3">
          <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground opacity-30" />
          <h3 className="text-sm font-bold text-foreground">No FAQs Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'All' || selectedStatus !== 'all'
              ? 'No questions match your filter criteria. Try resetting filters.'
              : 'Start by clicking "Create FAQ" to add questions for your visitors and exhibitors.'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer mt-2"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create First FAQ</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq) => {
            const isExpanded = expandedFaqId === faq._id;
            return (
              <div
                key={faq._id}
                className={`bg-card border rounded-xl overflow-hidden transition-all duration-200 ${
                  faq.isActive ? 'border-border' : 'border-border opacity-70 bg-muted/20'
                }`}
              >
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      #{faq.order}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                          {faq.category || 'General'}
                        </span>
                        {faq.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                            <Eye className="h-3 w-3" />
                            Live on Frontend
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-700 border border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
                            <EyeOff className="h-3 w-3" />
                            Hidden / Draft
                          </span>
                        )}
                      </div>

                      <h3
                        onClick={() => setExpandedFaqId(isExpanded ? null : faq._id)}
                        className="text-sm font-bold text-foreground hover:text-primary transition-colors cursor-pointer pt-0.5"
                      >
                        {faq.question}
                      </h3>

                      <p
                        className={`text-xs text-muted-foreground leading-relaxed transition-all ${
                          isExpanded ? '' : 'line-clamp-2'
                        }`}
                      >
                        {faq.answer}
                      </p>

                      {faq.answer.length > 140 && (
                        <button
                          type="button"
                          onClick={() => setExpandedFaqId(isExpanded ? null : faq._id)}
                          className="text-[10px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-0.5 pt-0.5"
                        >
                          <span>{isExpanded ? 'Show less' : 'Read full answer'}</span>
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start pt-1">
                    {/* Toggle Active Switch */}
                    <button
                      type="button"
                      title={faq.isActive ? 'Hide from frontend' : 'Make live on frontend'}
                      onClick={() => handleToggleStatus(faq._id)}
                      disabled={!!actionLoading[`toggle_${faq._id}`]}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                        faq.isActive
                          ? 'bg-card border-border text-foreground hover:bg-muted'
                          : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {actionLoading[`toggle_${faq._id}`] ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : faq.isActive ? (
                        <EyeOff className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                      <span>{faq.isActive ? 'Hide' : 'Publish'}</span>
                    </button>

                    {/* Edit Button */}
                    <button
                      type="button"
                      title="Edit FAQ"
                      onClick={() => handleOpenEdit(faq)}
                      className="p-2 rounded-lg text-foreground hover:bg-muted border border-border transition-colors cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    {/* Delete Button */}
                    {deleteConfirmId === faq._id ? (
                      <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/50 p-1 rounded-lg border border-red-200 dark:border-red-900">
                        <span className="text-[10px] font-bold text-red-600 dark:text-red-400 pl-1">Confirm?</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteFaq(faq._id)}
                          disabled={!!actionLoading[`delete_${faq._id}`]}
                          className="px-2 py-1 rounded bg-red-600 text-white text-[10px] font-bold hover:bg-red-700 cursor-pointer"
                        >
                          {actionLoading[`delete_${faq._id}`] ? '...' : 'Yes'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-1.5 py-1 rounded text-[10px] font-bold text-muted-foreground hover:bg-muted cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        title="Delete FAQ"
                        onClick={() => setDeleteConfirmId(faq._id)}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit FAQ Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-card text-foreground rounded-2xl shadow-2xl border border-border p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                <span>{editingFaq ? 'Edit FAQ' : 'Create New FAQ'}</span>
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSaveFaq} className="space-y-4">
              {/* Question */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Question *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. How do I claim or publish an event on VisitExpo?"
                  value={formData.question}
                  onChange={(e) => setFormData((prev) => ({ ...prev, question: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Category & Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="Custom">+ Custom Category...</option>
                  </select>
                </div>

                {formData.category === 'Custom' ? (
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      Custom Category Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ticketing & Passes"
                      value={formData.customCategory}
                      onChange={(e) => setFormData((prev) => ({ ...prev, customCategory: e.target.value }))}
                      className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      Display Priority Order
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.order}
                      onChange={(e) => setFormData((prev) => ({ ...prev, order: e.target.value }))}
                      className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}
              </div>

              {/* Answer */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Answer *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide a clear, detailed, and helpful answer..."
                  value={formData.answer}
                  onChange={(e) => setFormData((prev) => ({ ...prev, answer: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                />
              </div>

              {/* Visibility Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                <div>
                  <p className="text-xs font-bold text-foreground">Make Active on Frontend</p>
                  <p className="text-[11px] text-muted-foreground">
                    If active, this question will immediately appear on the landing page FAQ section.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span>{editingFaq ? 'Update FAQ' : 'Publish FAQ'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
