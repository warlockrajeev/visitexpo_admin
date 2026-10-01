'use client';

/**
 * @file events/page.js
 * @description Super Admin Events Management Console.
 * Allows viewing all organizer-created events, comprehensive editing of event details,
 * and automatic two-way synchronization with WordPress (visitexpo.in).
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  Calendar,
  Building2,
  Search,
  MapPin,
  ExternalLink,
  Globe,
  Mail,
  Phone,
  Filter,
  CheckCircle2,
  ChevronRight,
  Layers,
  ArrowRight,
  RefreshCw,
  X,
  AlertTriangle,
  Loader2,
  Check,
  Edit,
  Trash2,
  Clock,
  Eye,
  Sparkles,
  UploadCloud,
  FileText,
  DollarSign,
  Ticket,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const CATEGORIES_LIST = [
  'Technology & AI',
  'Industrial Manufacturing',
  'Healthcare & Pharma',
  'Renewable Energy & ESG',
  'Agriculture & Food Tech',
  'Consumer Goods & Retail',
  'Automotive & Transport',
  'Real Estate, Building & Construction',
  'Services, Finance & Education'
];

const CURRENCY_OPTIONS = [
  // Top World & Regional Business Currencies (Popular at top)
  { code: 'INR', symbol: '₹', name: '🇮🇳 INR (₹) - Indian Rupee' },
  { code: 'USD', symbol: '$', name: '🇺🇸 USD ($) - US Dollar' },
  { code: 'EUR', symbol: '€', name: '🇪🇺 EUR (€) - Euro' },
  { code: 'GBP', symbol: '£', name: '🇬🇧 GBP (£) - British Pound' },
  { code: 'AED', symbol: 'AED', name: '🇦🇪 AED - UAE Dirham' },
  { code: 'SAR', symbol: 'SAR', name: '🇸🇦 SAR - Saudi Riyal' },
  { code: 'SGD', symbol: 'S$', name: '🇸🇬 SGD (S$) - Singapore Dollar' },
  { code: 'CAD', symbol: 'CA$', name: '🇨🇦 CAD (CA$) - Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: '🇦🇺 AUD (A$) - Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: '🇯🇵 JPY (¥) - Japanese Yen' },
  { code: 'CHF', symbol: 'CHF', name: '🇨🇭 CHF - Swiss Franc' },
  { code: 'QAR', symbol: 'QAR', name: '🇶🇦 QAR - Qatari Riyal' },
  { code: 'KWD', symbol: 'KWD', name: '🇰🇼 KWD - Kuwaiti Dinar' },
  { code: 'BHD', symbol: 'BHD', name: '🇧🇭 BHD - Bahraini Dinar' },
  { code: 'OMR', symbol: 'OMR', name: '🇴🇲 OMR - Omani Rial' },
  { code: 'MYR', symbol: 'RM', name: '🇲🇾 MYR (RM) - Malaysian Ringgit' },
  { code: 'THB', symbol: '฿', name: '🇹🇭 THB (฿) - Thai Baht' },
  { code: 'ZAR', symbol: 'R', name: '🇿🇦 ZAR (R) - South African Rand' },
  { code: 'BRL', symbol: 'R$', name: '🇧🇷 BRL (R$) - Brazilian Real' },
  { code: 'CNY', symbol: 'CN¥', name: '🇨🇳 CNY (CN¥) - Chinese Yuan' },
  { code: 'HKD', symbol: 'HK$', name: '🇭🇰 HKD (HK$) - Hong Kong Dollar' },
  { code: 'NZD', symbol: 'NZ$', name: '🇳🇿 NZD (NZ$) - New Zealand Dollar' },
  { code: 'KRW', symbol: '₩', name: '🇰🇷 KRW (₩) - South Korean Won' },
  { code: 'IDR', symbol: 'Rp', name: '🇮🇩 IDR (Rp) - Indonesian Rupiah' },
  { code: 'MXN', symbol: 'MX$', name: '🇲🇽 MXN (MX$) - Mexican Peso' },
  { code: 'TRY', symbol: '₺', name: '🇹🇷 TRY (₺) - Turkish Lira' },
  { code: 'RUB', symbol: '₽', name: '🇷🇺 RUB (₽) - Russian Ruble' },
  { code: 'SEK', symbol: 'kr', name: '🇸🇪 SEK (kr) - Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: '🇳🇴 NOK (kr) - Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', name: '🇩🇰 DKK (kr) - Danish Krone' },
  { code: 'PLN', symbol: 'zł', name: '🇵🇱 PLN (zł) - Polish Zloty' },
  { code: 'CZK', symbol: 'Kč', name: '🇨🇿 CZK (Kč) - Czech Koruna' },
  { code: 'HUF', symbol: 'Ft', name: '🇭🇺 HUF (Ft) - Hungarian Forint' },
  { code: 'ILS', symbol: '₪', name: '🇮🇱 ILS (₪) - Israeli New Shekel' },
  { code: 'PHP', symbol: '₱', name: '🇵🇭 PHP (₱) - Philippine Peso' },
  { code: 'CLP', symbol: 'CLP$', name: '🇨🇱 CLP (CLP$) - Chilean Peso' },
  { code: 'COP', symbol: 'COL$', name: '🇨🇴 COP (COL$) - Colombian Peso' },
  { code: 'PEN', symbol: 'S/.', name: '🇵🇪 PEN (S/.) - Peruvian Sol' },
  { code: 'PKR', symbol: 'Rs', name: '🇵🇰 PKR (Rs) - Pakistani Rupee' },
  { code: 'BDT', symbol: '৳', name: '🇧🇩 BDT (৳) - Bangladeshi Taka' },
  { code: 'LKR', symbol: 'Rs', name: '🇱🇰 LKR (Rs) - Sri Lankan Rupee' },
  { code: 'NPR', symbol: 'Rs', name: '🇳🇵 NPR (Rs) - Nepalese Rupee' },
  { code: 'EGP', symbol: 'E£', name: '🇪🇬 EGP (E£) - Egyptian Pound' },
  { code: 'NGN', symbol: '₦', name: '🇳🇬 NGN (₦) - Nigerian Naira' },
  { code: 'KES', symbol: 'KSh', name: '🇰🇪 KES (KSh) - Kenyan Shilling' },
  { code: 'GHS', symbol: 'GH₵', name: '🇬🇭 GHS (GH₵) - Ghanaian Cedi' },
  { code: 'MAD', symbol: 'MAD', name: '🇲🇦 MAD - Moroccan Dirham' },
  { code: 'VND', symbol: '₫', name: '🇻🇳 VND (₫) - Vietnamese Dong' },
  { code: 'TWD', symbol: 'NT$', name: '🇹🇼 TWD (NT$) - New Taiwan Dollar' },
  { code: 'ARS', symbol: 'AR$', name: '🇦🇷 ARS (AR$) - Argentine Peso' },

  // All Remaining ISO 4217 Global Currencies (Alphabetical)
  { code: 'AFN', symbol: 'Af', name: '🇦🇫 AFN (Af) - Afghan Afghani' },
  { code: 'ALL', symbol: 'L', name: '🇦🇱 ALL (L) - Albanian Lek' },
  { code: 'AMD', symbol: '֏', name: '🇦🇲 AMD (֏) - Armenian Dram' },
  { code: 'ANG', symbol: 'NAƒ', name: '🇨🇼 ANG (NAƒ) - Netherlands Antillean Guilder' },
  { code: 'AOA', symbol: 'Kz', name: '🇦🇴 AOA (Kz) - Angolan Kwanza' },
  { code: 'AWG', symbol: 'Afl.', name: '🇦🇼 AWG (Afl.) - Aruban Florin' },
  { code: 'AZN', symbol: '₼', name: '🇦🇿 AZN (₼) - Azerbaijani Manat' },
  { code: 'BAM', symbol: 'KM', name: '🇧🇦 BAM (KM) - Bosnia-Herzegovina Convertible Mark' },
  { code: 'BBD', symbol: 'Bds$', name: '🇧🇧 BBD (Bds$) - Barbadian Dollar' },
  { code: 'BGN', symbol: 'лв', name: '🇧🇬 BGN (лв) - Bulgarian Lev' },
  { code: 'BIF', symbol: 'FBu', name: '🇧🇮 BIF (FBu) - Burundian Franc' },
  { code: 'BMD', symbol: 'BD$', name: '🇧🇲 BMD (BD$) - Bermudian Dollar' },
  { code: 'BND', symbol: 'B$', name: '🇧🇳 BND (B$) - Brunei Dollar' },
  { code: 'BOB', symbol: 'Bs.', name: '🇧🇴 BOB (Bs.) - Bolivian Boliviano' },
  { code: 'BSD', symbol: 'B$', name: '🇧🇸 BSD (B$) - Bahamian Dollar' },
  { code: 'BTN', symbol: 'Nu.', name: '🇧🇹 BTN (Nu.) - Bhutanese Ngultrum' },
  { code: 'BWP', symbol: 'P', name: '🇧🇼 BWP (P) - Botswanan Pula' },
  { code: 'BYN', symbol: 'Br', name: '🇧🇾 BYN (Br) - Belarusian Ruble' },
  { code: 'BZD', symbol: 'BZ$', name: '🇧🇿 BZD (BZ$) - Belize Dollar' },
  { code: 'CDF', symbol: 'FC', name: '🇨🇩 CDF (FC) - Congolese Franc' },
  { code: 'CRC', symbol: '₡', name: '🇨🇷 CRC (₡) - Costa Rican Colón' },
  { code: 'CUP', symbol: '₱', name: '🇨🇺 CUP (₱) - Cuban Peso' },
  { code: 'CVE', symbol: '$', name: '🇨🇻 CVE ($) - Cape Verdean Escudo' },
  { code: 'DJF', symbol: 'Fdj', name: '🇩🇯 DJF (Fdj) - Djiboutian Franc' },
  { code: 'DOP', symbol: 'RD$', name: '🇩🇴 DOP (RD$) - Dominican Peso' },
  { code: 'DZD', symbol: 'DA', name: '🇩🇿 DZD (DA) - Algerian Dinar' },
  { code: 'ERN', symbol: 'Nfk', name: '🇪🇷 ERN (Nfk) - Eritrean Nakfa' },
  { code: 'ETB', symbol: 'Br', name: '🇪🇹 ETB (Br) - Ethiopian Birr' },
  { code: 'FJD', symbol: 'FJ$', name: '🇫🇯 FJD (FJ$) - Fijian Dollar' },
  { code: 'FKP', symbol: '£', name: '🇫🇰 FKP (£) - Falkland Islands Pound' },
  { code: 'GEL', symbol: '₾', name: '🇬🇪 GEL (₾) - Georgian Lari' },
  { code: 'GIP', symbol: '£', name: '🇬🇮 GIP (£) - Gibraltar Pound' },
  { code: 'GMD', symbol: 'D', name: '🇬🇲 GMD (D) - Gambian Dalasi' },
  { code: 'GNF', symbol: 'FG', name: '🇬🇳 GNF (FG) - Guinean Franc' },
  { code: 'GTQ', symbol: 'Q', name: '🇬🇹 GTQ (Q) - Guatemalan Quetzal' },
  { code: 'GYD', symbol: 'G$', name: '🇬🇾 GYD (G$) - Guyanese Dollar' },
  { code: 'HNL', symbol: 'L', name: '🇭🇳 HNL (L) - Honduran Lempira' },
  { code: 'HTG', symbol: 'G', name: '🇭🇹 HTG (G) - Haitian Gourde' },
  { code: 'IQD', symbol: 'ID', name: '🇮🇶 IQD (ID) - Iraqi Dinar' },
  { code: 'IRR', symbol: 'IRR', name: '🇮🇷 IRR - Iranian Rial' },
  { code: 'ISK', symbol: 'kr', name: '🇮🇸 ISK (kr) - Icelandic Króna' },
  { code: 'JMD', symbol: 'J$', name: '🇯🇲 JMD (J$) - Jamaican Dollar' },
  { code: 'JOD', symbol: 'JD', name: '🇯🇴 JOD (JD) - Jordanian Dinar' },
  { code: 'KGS', symbol: 'с', name: '🇰🇬 KGS (с) - Kyrgystani Som' },
  { code: 'KHR', symbol: '៛', name: '🇰🇭 KHR (៛) - Cambodian Riel' },
  { code: 'KMF', symbol: 'CF', name: '🇰🇲 KMF (CF) - Comorian Franc' },
  { code: 'KPW', symbol: '₩', name: '🇰🇵 KPW (₩) - North Korean Won' },
  { code: 'KYD', symbol: 'CI$', name: '🇰🇾 KYD (CI$) - Cayman Islands Dollar' },
  { code: 'KZT', symbol: '₸', name: '🇰🇿 KZT (₸) - Kazakhstani Tenge' },
  { code: 'LAK', symbol: '₭', name: '🇱🇦 LAK (₭) - Laotian Kip' },
  { code: 'LBP', symbol: 'L£', name: '🇱🇧 LBP (L£) - Lebanese Pound' },
  { code: 'LRD', symbol: 'L$', name: '🇱🇷 LRD (L$) - Liberian Dollar' },
  { code: 'LSL', symbol: 'M', name: '🇱🇸 LSL (M) - Lesotho Loti' },
  { code: 'LYD', symbol: 'LD', name: '🇱🇾 LYD (LD) - Libyan Dinar' },
  { code: 'MDL', symbol: 'L', name: '🇲🇩 MDL (L) - Moldovan Leu' },
  { code: 'MGA', symbol: 'Ar', name: '🇲🇬 MGA (Ar) - Malagasy Ariary' },
  { code: 'MKD', symbol: 'ден', name: '🇲🇰 MKD (ден) - Macedonian Denar' },
  { code: 'MMK', symbol: 'K', name: '🇲🇲 MMK (K) - Myanmar Kyat' },
  { code: 'MNT', symbol: '₮', name: '🇲🇳 MNT (₮) - Mongolian Tugrik' },
  { code: 'MOP', symbol: 'MOP$', name: '🇲🇴 MOP (MOP$) - Macanese Pataca' },
  { code: 'MRU', symbol: 'UM', name: '🇲🇷 MRU (UM) - Mauritanian Ouguiya' },
  { code: 'MUR', symbol: '₨', name: '🇲🇺 MUR (₨) - Mauritian Rupee' },
  { code: 'MVR', symbol: 'Rf', name: '🇲🇻 MVR (Rf) - Maldivian Rufiyaa' },
  { code: 'MWK', symbol: 'MK', name: '🇲🇼 MWK (MK) - Malawian Kwacha' },
  { code: 'MZN', symbol: 'MT', name: '🇲🇿 MZN (MT) - Mozambican Metical' },
  { code: 'NAD', symbol: 'N$', name: '🇳🇦 NAD (N$) - Namibian Dollar' },
  { code: 'NIO', symbol: 'C$', name: '🇳🇮 NIO (C$) - Nicaraguan Córdoba' },
  { code: 'PAB', symbol: 'B/.', name: '🇵🇦 PAB (B/.) - Panamanian Balboa' },
  { code: 'PGK', symbol: 'K', name: '🇵🇬 PGK (K) - Papua New Guinean Kina' },
  { code: 'PYG', symbol: '₲', name: '🇵🇾 PYG (₲) - Paraguayan Guarani' },
  { code: 'RON', symbol: 'lei', name: '🇷🇴 RON (lei) - Romanian Leu' },
  { code: 'RSD', symbol: 'дин.', name: '🇷🇸 RSD (дин.) - Serbian Dinar' },
  { code: 'RWF', symbol: 'RF', name: '🇷🇼 RWF (RF) - Rwandan Franc' },
  { code: 'SBD', symbol: 'SI$', name: '🇸🇧 SBD (SI$) - Solomon Islands Dollar' },
  { code: 'SCR', symbol: 'SR', name: '🇸🇨 SCR (SR) - Seychellois Rupee' },
  { code: 'SDG', symbol: 'SDG', name: '🇸🇩 SDG - Sudanese Pound' },
  { code: 'SHP', symbol: '£', name: '🇸🇭 SHP (£) - Saint Helena Pound' },
  { code: 'SLE', symbol: 'Le', name: '🇸🇱 SLE (Le) - Sierra Leonean Leone' },
  { code: 'SOS', symbol: 'S', name: '🇸🇴 SOS (S) - Somali Shilling' },
  { code: 'SRD', symbol: 'Sr$', name: '🇸🇷 SRD (Sr$) - Surinamese Dollar' },
  { code: 'SSP', symbol: 'SS£', name: '🇸🇸 SSP (SS£) - South Sudanese Pound' },
  { code: 'STN', symbol: 'Db', name: '🇸🇹 STN (Db) - São Tomé & Príncipe Dobra' },
  { code: 'SYP', symbol: '£S', name: '🇸🇾 SYP (£S) - Syrian Pound' },
  { code: 'SZL', symbol: 'E', name: '🇸🇿 SZL (E) - Eswatini Lilangeni' },
  { code: 'TJS', symbol: 'SM', name: '🇹🇯 TJS (SM) - Tajikistani Somoni' },
  { code: 'TMT', symbol: 'T', name: '🇹🇲 TMT (T) - Turkmenistani Manat' },
  { code: 'TND', symbol: 'DT', name: '🇹🇳 TND (DT) - Tunisian Dinar' },
  { code: 'TOP', symbol: 'T$', name: '🇹🇴 TOP (T$) - Tongan Paʻanga' },
  { code: 'TTD', symbol: 'TT$', name: '🇹🇹 TTD (TT$) - Trinidad & Tobago Dollar' },
  { code: 'TZS', symbol: 'TSh', name: '🇹🇿 TZS (TSh) - Tanzanian Shilling' },
  { code: 'UAH', symbol: '₴', name: '🇺🇦 UAH (₴) - Ukrainian Hryvnia' },
  { code: 'UGX', symbol: 'USh', name: '🇺🇬 UGX (USh) - Ugandan Shilling' },
  { code: 'UYU', symbol: '$U', name: '🇺🇾 UYU ($U) - Uruguayan Peso' },
  { code: 'UZS', symbol: 'soʻm', name: '🇺🇿 UZS (soʻm) - Uzbekistani Som' },
  { code: 'VES', symbol: 'Bs.S', name: '🇻🇪 VES (Bs.S) - Venezuelan Bolívar' },
  { code: 'VUV', symbol: 'VT', name: '🇻🇺 VUV (VT) - Vanuatu Vatu' },
  { code: 'WST', symbol: 'WS$', name: '🇼🇸 WST (WS$) - Samoan Tala' },
  { code: 'XAF', symbol: 'FCFA', name: '🇨🇲 XAF (FCFA) - Central African CFA Franc' },
  { code: 'XCD', symbol: 'EC$', name: '🇦🇬 XCD (EC$) - East Caribbean Dollar' },
  { code: 'XOF', symbol: 'CFA', name: '🇸🇳 XOF (CFA) - West African CFA Franc' },
  { code: 'XPF', symbol: 'CFPF', name: '🇵🇫 XPF (CFPF) - CFP Franc' },
  { code: 'YER', symbol: 'YR', name: '🇾🇪 YER (YR) - Yemeni Rial' },
  { code: 'ZMW', symbol: 'ZK', name: '🇿🇲 ZMW (ZK) - Zambian Kwacha' },
  { code: 'ZWL', symbol: 'ZWL$', name: '🇿🇼 ZWL (ZWL$) - Zimbabwean Dollar' }
];

export default function AdminEventsPage() {
  const { accessToken } = useAuth();

  // Data states
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    publishedCount: 0,
    draftCount: 0,
    cancelledCount: 0,
    wpSyncedCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Edit Drawer state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editTab, setEditTab] = useState('basic'); // 'basic' | 'dates' | 'organizer' | 'media' | 'sponsors' | 'tickets'
  const [newSponsor, setNewSponsor] = useState({ name: '', link: '', logo: '', tier: 'Our Sponsors' });
  const [saving, setSaving] = useState(false);
  const [syncingWpId, setSyncingWpId] = useState(null);

  // Feedback notifications
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  // Delete Modal state
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, event: null, isDeleting: false });

  // Fetch events list
  const fetchEvents = async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    try {
      const res = await axios.get(`${API_URL}/admin/events?limit=200`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data?.success && res.data?.data) {
        setEvents(res.data.data.events || []);
        if (res.data.data.stats) {
          setStats(res.data.data.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching admin events:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Failed to load events from server.'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchEvents();
    }
  }, [accessToken]);

  // Dismiss feedback
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Filtered & searched events
  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      // Status filter
      if (statusFilter !== 'all' && ev.status !== statusFilter) {
        return false;
      }
      // Category filter
      if (categoryFilter !== 'all') {
        const cats = Array.isArray(ev.categories) ? ev.categories : [ev.categories];
        if (!cats.some(c => c && c.toLowerCase().includes(categoryFilter.toLowerCase()))) {
          return false;
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (ev.title || '').toLowerCase().includes(q);
        const cityMatch = (ev.city || '').toLowerCase().includes(q);
        const venueMatch = (ev.venue || '').toLowerCase().includes(q);
        const orgMatch = (ev.orgName || ev.organizer?.name || '').toLowerCase().includes(q);
        const slugMatch = (ev.slug || '').toLowerCase().includes(q);
        return titleMatch || cityMatch || venueMatch || orgMatch || slugMatch;
      }
      return true;
    });
  }, [events, statusFilter, categoryFilter, searchQuery]);

  // Paginated events
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage) || 1;
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEvents.slice(start, start + itemsPerPage);
  }, [filteredEvents, currentPage]);

  // Open Edit Drawer
  const handleOpenEdit = (event) => {
    const formattedStartDate = event.startDate ? new Date(event.startDate).toISOString().slice(0, 10) : '';
    const formattedEndDate = event.endDate ? new Date(event.endDate).toISOString().slice(0, 10) : '';

    setEditingEvent({
      _id: event._id,
      title: event.title || '',
      slug: event.slug || '',
      category: Array.isArray(event.categories) && event.categories[0] ? event.categories[0] : 'Technology & AI',
      description: event.description || '',
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      timings: event.timings || '09:00 AM - 06:00 PM',
      venue: event.venue || '',
      city: event.city || '',
      state: event.state || 'Delhi NCR',
      country: event.country || 'India',
      orgName: event.orgName || event.organizer?.name || '',
      orgEmail: event.orgEmail || event.organizer?.email || '',
      orgPhone: event.orgPhone || event.organizer?.contact?.phone || '',
      orgWebsite: event.orgWebsite || event.organizer?.website || '',
      orgDesc: event.orgDesc || '',
      orgLogo: event.orgLogo || event.organizer?.logo || '',
      banner: event.banner || '',
      gallery: event.gallery || [],
      promoVideoUrl: event.promoVideoUrl || '',
      brochurePdf: event.brochurePdf || '',
      isFreeEvent: event.isFreeEvent !== false,
      paidTicketPrice: event.paidTicketPrice || 0,
      currency: event.currency || 'INR',
      status: event.status || 'published',
      wpPostId: event.wpPostId || '',
      wpUrl: event.wpUrl || '',
      sponsorsList: Array.isArray(event.sponsorsList) ? event.sponsorsList : []
    });
    setNewSponsor({ name: '', link: '', logo: '', tier: 'Our Sponsors' });
    setEditTab('basic');
    setIsEditOpen(true);
  };

  // Add Sponsor Handler in Admin Edit Drawer
  const handleAddSponsor = () => {
    if (!newSponsor.name || !newSponsor.name.trim()) {
      alert('Sponsor Name is required');
      return;
    }
    setEditingEvent(prev => ({
      ...prev,
      sponsorsList: [...(prev.sponsorsList || []), { ...newSponsor, tier: newSponsor.tier?.trim() || 'Our Sponsors' }]
    }));
    setNewSponsor({ name: '', link: '', logo: '', tier: 'Our Sponsors' });
  };

  // Remove Sponsor Handler in Admin Edit Drawer
  const handleRemoveSponsor = (index) => {
    setEditingEvent(prev => ({
      ...prev,
      sponsorsList: (prev.sponsorsList || []).filter((_, idx) => idx !== index)
    }));
  };

  // Handle Edit Input Changes
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditingEvent(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Submit Save & WordPress Sync
  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!editingEvent || !editingEvent._id) return;

    setSaving(true);
    try {
      // Auto-commit pending sponsor if filled
      let finalSponsorsList = Array.isArray(editingEvent.sponsorsList) ? [...editingEvent.sponsorsList] : [];
      if (newSponsor.name && newSponsor.name.trim()) {
        finalSponsorsList.push({ ...newSponsor, tier: newSponsor.tier?.trim() || 'Our Sponsors' });
      }

      const payload = {
        title: editingEvent.title,
        slug: editingEvent.slug,
        categories: [editingEvent.category].filter(Boolean),
        description: editingEvent.description,
        startDate: editingEvent.startDate ? new Date(editingEvent.startDate).toISOString() : undefined,
        endDate: editingEvent.endDate ? new Date(editingEvent.endDate).toISOString() : undefined,
        timings: editingEvent.timings,
        venue: editingEvent.venue,
        city: editingEvent.city,
        state: editingEvent.state,
        country: editingEvent.country,
        orgName: editingEvent.orgName,
        orgEmail: editingEvent.orgEmail,
        orgPhone: editingEvent.orgPhone,
        orgWebsite: editingEvent.orgWebsite,
        orgDesc: editingEvent.orgDesc,
        orgLogo: editingEvent.orgLogo,
        banner: editingEvent.banner,
        sponsorsList: finalSponsorsList,
        isFreeEvent: editingEvent.isFreeEvent,
        paidTicketPrice: Number(editingEvent.paidTicketPrice) || 0,
        currency: editingEvent.currency || 'INR',
        status: editingEvent.status
      };

      const res = await axios.put(`${API_URL}/admin/events/${editingEvent._id}`, payload, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (res.data?.success) {
        const updatedDoc = res.data.event || { ...editingEvent, ...payload };
        // Update local events list
        setEvents(prev => prev.map(ev => ev._id === updatedDoc._id ? { ...ev, ...updatedDoc } : ev));

        setFeedback({
          type: 'success',
          message: res.data.wpSynced
            ? `✅ Event "${editingEvent.title}" updated successfully and synchronized with WordPress (Post #${res.data.wpPostId || updatedDoc.wpPostId})!`
            : `✅ Event "${editingEvent.title}" updated in database.`
        });

        setIsEditOpen(false);
      }
    } catch (err) {
      console.error('Error saving event:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Failed to update event. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  // Manual Force-Sync Single Event to WordPress
  const handleForceSyncWp = async (eventId, eventTitle) => {
    setSyncingWpId(eventId);
    try {
      const res = await axios.post(`${API_URL}/admin/events/${eventId}/sync-wp`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (res.data?.success) {
        // Update event in local state
        setEvents(prev => prev.map(ev => {
          if (ev._id === eventId) {
            return {
              ...ev,
              wpPostId: res.data.wpPostId,
              wpUrl: res.data.wpUrl
            };
          }
          return ev;
        }));

        setFeedback({
          type: 'success',
          message: `🚀 "${eventTitle}" synchronized to WordPress! Post ID: #${res.data.wpPostId}`
        });
      }
    } catch (err) {
      console.error('Error syncing to WP:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || `Failed to sync "${eventTitle}" to WordPress.`
      });
    } finally {
      setSyncingWpId(null);
    }
  };

  // Handle Event Delete
  const handleConfirmDelete = async () => {
    if (!deleteModal.event) return;
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));

    try {
      const res = await axios.delete(`${API_URL}/admin/events/${deleteModal.event._id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: {
          title: deleteModal.event.title,
          slug: deleteModal.event.slug,
          wpPostId: deleteModal.event.wpPostId
        }
      });

      if (res.data?.success) {
        setEvents(prev => prev.filter(ev => ev._id !== deleteModal.event._id));
        setFeedback({
          type: 'success',
          message: `🗑️ Event "${deleteModal.event.title}" permanently deleted.`
        });
        setDeleteModal({ isOpen: false, event: null, isDeleting: false });
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Failed to delete event.'
      });
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Calendar className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              Organizer Events & WordPress Sync
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            Manage, inspect, and edit all multi-day exhibitions created by organizers. Updates made by the administrator are automatically synchronized in real time with the WordPress event directory.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchEvents(false)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card hover:bg-muted px-4 py-2 text-xs font-bold text-foreground transition-all cursor-pointer shadow-2xs hover:border-primary/50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Events'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs font-semibold shadow-sm animate-in fade-in-50 duration-200 ${
            feedback.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Events */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Platform Events
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calendar className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-foreground">
            {stats.totalEvents.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Registered expos & trade shows
          </p>
        </div>

        {/* Live Published */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Published & Live
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.publishedCount.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Visible on VisitExpo directory
          </p>
        </div>

        {/* Pending Review / Draft */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Drafts / Moderation
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
            {stats.draftCount.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Awaiting admin approval
          </p>
        </div>

        {/* Synced to WordPress */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Synced to WordPress
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Globe className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400">
            {stats.wpSyncedCount.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Live on visitexpo.in pages
          </p>
        </div>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by event title, venue, city, organizer, or slug..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-border bg-background pl-10 pr-9 py-2 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {CATEGORIES_LIST.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center justify-between border-t border-border/60 pt-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Events', count: events.length },
              { id: 'published', label: 'Published (Live)', count: stats.publishedCount },
              { id: 'draft', label: 'Drafts / In Review', count: stats.draftCount },
              { id: 'cancelled', label: 'Cancelled', count: stats.cancelledCount }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === tab.id ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background/80 text-foreground/80'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <span className="text-xs text-muted-foreground font-medium">
            Showing <strong className="text-foreground">{filteredEvents.length}</strong> matching events
          </span>
        </div>
      </div>

      {/* Events Table Container */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-semibold">Loading organizer events from database...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mx-auto">
              <Calendar className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-foreground">No events found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No events matched your current search and filter criteria. Try clearing search keywords or selecting "All Events".
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-muted-foreground">
              <thead className="bg-muted/40 uppercase text-[10px] font-bold text-foreground/80 tracking-wider border-b border-border">
                <tr>
                  <th className="px-3 py-2">Event Identity</th>
                  <th className="px-3 py-2">Organizer</th>
                  <th className="px-3 py-2">Dates</th>
                  <th className="px-3 py-2">Location</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">WordPress</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedEvents.map(event => {
                  const isSyncing = syncingWpId === event._id;
                  const hasWpSync = !!event.wpPostId;

                  return (
                    <tr key={event._id} className="hover:bg-muted/20 transition-colors">
                      {/* Event Identity */}
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-11 rounded-lg bg-muted overflow-hidden shrink-0 border border-border/60 relative">
                            {event.banner ? (
                              <img src={event.banner} alt={event.title} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-[8px] font-bold text-primary">
                                Expo
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 max-w-[220px]">
                            <h4 className="font-bold text-foreground truncate text-xs hover:text-primary transition-colors leading-tight" title={event.title}>
                              {event.title}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {event.categories && event.categories[0] && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold bg-primary/10 text-primary border border-primary/20 shrink-0">
                                  {event.categories[0]}
                                </span>
                              )}
                              <span className="text-[9px] text-muted-foreground font-mono truncate">
                                /{event.slug}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Organizer */}
                      <td className="px-3 py-1.5">
                        <div className="space-y-0.5 max-w-[150px]">
                          <p className="font-semibold text-foreground flex items-center gap-1 truncate text-xs leading-tight" title={event.orgName || event.organizer?.name}>
                            <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="truncate">{event.orgName || event.organizer?.name || 'VisitExpo Organizer'}</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate" title={event.orgEmail || event.organizer?.email}>
                            {event.orgEmail || event.organizer?.email || 'organizer@visitexpo.in'}
                          </p>
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="px-3 py-1.5 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 font-semibold text-foreground text-[11px] leading-tight">
                            <Calendar className="h-3 w-3 text-primary shrink-0" />
                            <span>
                              {event.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBD'} to{' '}
                              {event.endDate ? new Date(event.endDate).toLocaleDateString() : 'TBD'}
                            </span>
                          </div>
                          {event.timings && (
                            <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5 text-muted-foreground shrink-0" /> {event.timings}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-3 py-1.5">
                        <div className="space-y-0.5 max-w-[140px]">
                          <p className="font-semibold text-foreground flex items-center gap-1 truncate text-[11px] leading-tight">
                            <MapPin className="h-3 w-3 text-primary shrink-0" />
                            <span className="truncate">{event.city || 'India'}, {event.country || 'India'}</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate" title={event.venue}>
                            {event.venue || 'Exhibition Ground'}
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-1.5 whitespace-nowrap">
                        {event.status === 'published' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="h-2.5 w-2.5" /> Live
                          </span>
                        ) : event.status === 'draft' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            <Clock className="h-2.5 w-2.5" /> Draft
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                            <X className="h-2.5 w-2.5" /> Cancelled
                          </span>
                        )}
                      </td>

                      {/* WordPress Sync */}
                      <td className="px-3 py-1.5 whitespace-nowrap">
                        {hasWpSync ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                              <Globe className="h-2.5 w-2.5" /> #{event.wpPostId}
                            </span>
                            <a
                              href={event.wpUrl || `https://visitexpo.in/event/${event.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-0.5 text-[9px] text-primary hover:underline font-medium"
                              title="View on WordPress"
                            >
                              View <ExternalLink className="h-2 w-2" />
                            </a>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                              Unsynced
                            </span>
                            <button
                              onClick={() => handleForceSyncWp(event._id, event.title)}
                              disabled={isSyncing}
                              className="text-[9px] text-blue-600 hover:text-blue-800 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                            >
                              {isSyncing ? 'Syncing...' : 'Sync'}
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-1.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit Event Button */}
                          <button
                            onClick={() => handleOpenEdit(event)}
                            className="inline-flex items-center gap-1 rounded-md bg-primary hover:bg-primary/90 px-2 py-1 text-[11px] font-bold text-primary-foreground shadow-2xs transition-all cursor-pointer"
                            title="Edit Event"
                          >
                            <Edit className="h-3 w-3" />
                            <span>Edit</span>
                          </button>

                          {/* Force Sync button */}
                          <button
                            onClick={() => handleForceSyncWp(event._id, event.title)}
                            disabled={isSyncing}
                            className="inline-flex items-center justify-center h-6 w-6 rounded-md border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                            title="Push updates to WordPress"
                          >
                            {isSyncing ? (
                              <Loader2 className="h-3 w-3 animate-spin text-primary" />
                            ) : (
                              <UploadCloud className="h-3 w-3 text-blue-500" />
                            )}
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, event: event, isDeleting: false })}
                            className="inline-flex items-center justify-center h-6 w-6 rounded-md border border-border bg-card hover:bg-rose-500/10 hover:border-rose-500/30 text-rose-500 transition-all cursor-pointer"
                            title="Delete Event"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredEvents.length > itemsPerPage && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/20 text-xs">
            <span className="text-muted-foreground">
              Page <strong className="text-foreground">{currentPage}</strong> of <strong className="text-foreground">{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-border px-3 py-1 font-semibold text-foreground hover:bg-muted disabled:opacity-50 cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-border px-3 py-1 font-semibold text-foreground hover:bg-muted disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* SLIDE-OVER EDIT EVENT DRAWER */}
      {/* ============================================================== */}
      {isEditOpen && editingEvent && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in-50 duration-200">
          <div className="w-full max-w-2xl bg-card border-l border-border h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Edit className="h-4 w-4" />
                  </span>
                  <h3 className="text-base font-extrabold text-foreground">
                    Edit Event & WordPress Sync
                  </h3>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Updates saved here will automatically synchronize with WordPress (<span className="font-mono text-primary">{editingEvent.slug}</span>).
                </p>
              </div>

              <button
                onClick={() => setIsEditOpen(false)}
                className="h-8 w-8 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tab navigation within drawer */}
            <div className="px-6 pt-3 border-b border-border bg-card flex items-center gap-2 overflow-x-auto shrink-0">
              {[
                { id: 'basic', label: '1. Basic Info' },
                { id: 'dates', label: '2. Dates & Venue' },
                { id: 'organizer', label: '3. Organizer Profile' },
                { id: 'media', label: '4. Media & Branding' },
                { id: 'sponsors', label: '5. Sponsors & Partners' },
                { id: 'tickets', label: '6. Tickets & Status' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setEditTab(tab.id)}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    editTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Drawer Body (Form) */}
            <form id="edit-event-form" onSubmit={handleSaveEvent} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* TAB 1: BASIC INFO */}
              {editTab === 'basic' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                      Event Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      value={editingEvent.title}
                      onChange={handleEditChange}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                      Public URL Slug *
                    </label>
                    <div className="flex items-center">
                      <span className="bg-muted px-3 py-2.5 rounded-l-xl border border-r-0 border-border text-xs text-muted-foreground font-mono">
                        visitexpo.in/event/
                      </span>
                      <input
                        type="text"
                        name="slug"
                        required
                        value={editingEvent.slug}
                        onChange={handleEditChange}
                        className="w-full rounded-r-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                      Primary Category
                    </label>
                    <select
                      name="category"
                      value={editingEvent.category}
                      onChange={handleEditChange}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                    >
                      {CATEGORIES_LIST.map((cat, idx) => (
                        <option key={idx} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                      Event Description
                    </label>
                    <textarea
                      name="description"
                      rows={5}
                      value={editingEvent.description}
                      onChange={handleEditChange}
                      placeholder="Comprehensive overview of the expo..."
                      className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: DATES & VENUE */}
              {editTab === 'dates' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={editingEvent.startDate}
                        onChange={handleEditChange}
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer dark:[color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={editingEvent.endDate}
                        onChange={handleEditChange}
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer dark:[color-scheme:dark]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                      Daily Visitor Timings
                    </label>
                    <input
                      type="text"
                      name="timings"
                      value={editingEvent.timings}
                      onChange={handleEditChange}
                      placeholder="09:00 AM - 06:00 PM"
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                      Venue Name / Exhibition Center
                    </label>
                    <input
                      type="text"
                      name="venue"
                      value={editingEvent.venue}
                      onChange={handleEditChange}
                      placeholder="E.g. Pragati Maidan, Hall 5"
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={editingEvent.city}
                        onChange={handleEditChange}
                        placeholder="New Delhi"
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        name="country"
                        value={editingEvent.country}
                        onChange={handleEditChange}
                        placeholder="India"
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ORGANIZER PROFILE */}
              {editTab === 'organizer' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                      Organizer / Company Name
                    </label>
                    <input
                      type="text"
                      name="orgName"
                      value={editingEvent.orgName}
                      onChange={handleEditChange}
                      placeholder="E.g. India Trade Promotion Organisation"
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                        Official Email
                      </label>
                      <input
                        type="email"
                        name="orgEmail"
                        value={editingEvent.orgEmail}
                        onChange={handleEditChange}
                        placeholder="organizer@visitexpo.in"
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                        Contact Phone
                      </label>
                      <input
                        type="text"
                        name="orgPhone"
                        value={editingEvent.orgPhone}
                        onChange={handleEditChange}
                        placeholder="+91 98765 43210"
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                      Official Website
                    </label>
                    <input
                      type="url"
                      name="orgWebsite"
                      value={editingEvent.orgWebsite}
                      onChange={handleEditChange}
                      placeholder="https://company.com"
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                      Organizer Logo URL
                    </label>
                    <input
                      type="url"
                      name="orgLogo"
                      value={editingEvent.orgLogo}
                      onChange={handleEditChange}
                      placeholder="https://res.cloudinary.com/..."
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                      Organizer Description
                    </label>
                    <textarea
                      name="orgDesc"
                      rows={3}
                      value={editingEvent.orgDesc}
                      onChange={handleEditChange}
                      placeholder="Background on the organizing body..."
                      className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: MEDIA & BRANDING */}
              {editTab === 'media' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                      Event Cover Banner URL
                    </label>
                    <input
                      type="url"
                      name="banner"
                      value={editingEvent.banner}
                      onChange={handleEditChange}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    {editingEvent.banner && (
                      <div className="mt-2 h-36 rounded-xl overflow-hidden border border-border bg-muted">
                        <img src={editingEvent.banner} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                      Brochure PDF URL
                    </label>
                    <input
                      type="url"
                      name="brochurePdf"
                      value={editingEvent.brochurePdf}
                      onChange={handleEditChange}
                      placeholder="https://.../brochure.pdf"
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                      Promotional Video URL (YouTube / Vimeo)
                    </label>
                    <input
                      type="url"
                      name="promoVideoUrl"
                      value={editingEvent.promoVideoUrl}
                      onChange={handleEditChange}
                      placeholder="https://youtube.com/watch?v=..."
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: SPONSORS & PARTNERS */}
              {editTab === 'sponsors' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">
                      Event Sponsors &amp; Exhibitor Partners
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Manage sponsors that appear on the VisitExpo event page and WordPress directory sponsor widget.
                    </p>
                  </div>

                  {/* Add Sponsor Box */}
                  <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <h5 className="text-xs font-bold text-foreground">Add New Sponsor / Partner</h5>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                          Sponsor Name *
                        </label>
                        <input
                          type="text"
                          value={newSponsor.name}
                          onChange={e => setNewSponsor(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g. Google Cloud or Academic Forum"
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                          Tier / Category
                        </label>
                        <input
                          type="text"
                          value={newSponsor.tier}
                          onChange={e => setNewSponsor(prev => ({ ...prev, tier: e.target.value }))}
                          placeholder="e.g. Our Sponsors, Platinum, Associate"
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                          Website Link
                        </label>
                        <input
                          type="url"
                          value={newSponsor.link}
                          onChange={e => setNewSponsor(prev => ({ ...prev, link: e.target.value }))}
                          placeholder="https://..."
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                          Logo Image URL
                        </label>
                        <input
                          type="url"
                          value={newSponsor.logo}
                          onChange={e => setNewSponsor(prev => ({ ...prev, logo: e.target.value }))}
                          placeholder="https://.../logo.png"
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleAddSponsor}
                        className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-xs cursor-pointer shadow-xs"
                      >
                        + Add Sponsor to Event
                      </button>
                    </div>
                  </div>

                  {/* Existing Sponsors List */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase">
                      Current Sponsors ({editingEvent.sponsorsList?.length || 0})
                    </label>
                    {(!editingEvent.sponsorsList || editingEvent.sponsorsList.length === 0) ? (
                      <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                        No sponsors added to this event yet.
                      </div>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {editingEvent.sponsorsList.map((sp, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {sp.logo ? (
                                <img src={sp.logo} alt={sp.name} className="h-8 w-8 object-contain rounded bg-white p-1 border border-border shrink-0" />
                              ) : (
                                <div className="h-8 w-8 rounded bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                                  {sp.name ? sp.name.charAt(0).toUpperCase() : 'S'}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-foreground truncate">{sp.name}</p>
                                <p className="text-[10px] text-primary font-semibold truncate">{sp.tier || 'Our Sponsors'}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveSponsor(idx)}
                              className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 rounded hover:bg-red-500/10 cursor-pointer shrink-0"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: TICKETS & STATUS */}
              {editTab === 'tickets' && (
                <div className="space-y-4">
                  {/* Status Selection */}
                  <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-2">
                    <label className="block text-xs font-bold text-foreground uppercase tracking-wide">
                      Publishing Status
                    </label>
                    <select
                      name="status"
                      value={editingEvent.status}
                      onChange={handleEditChange}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                    >
                      <option value="published">Published (Live & Directory Visible)</option>
                      <option value="draft">Draft / Under Moderation</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Free vs Paid Toggle */}
                  <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-foreground">Free Entry Event</h4>
                        <p className="text-[11px] text-muted-foreground">
                          Visitors can claim complimentary entry passes upon registering.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        name="isFreeEvent"
                        checked={editingEvent.isFreeEvent}
                        onChange={handleEditChange}
                        className="h-4 w-4 rounded text-primary focus:ring-primary cursor-pointer"
                      />
                    </div>

                    {!editingEvent.isFreeEvent && (
                      <div className="pt-2 border-t border-border grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                            Currency
                          </label>
                          <select
                            name="currency"
                            value={editingEvent.currency || 'INR'}
                            onChange={handleEditChange}
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                          >
                            {CURRENCY_OPTIONS.map(c => (
                              <option key={c.code} value={c.code}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                            Ticket Price ({editingEvent.currency || 'INR'})
                          </label>
                          <input
                            type="number"
                            name="paidTicketPrice"
                            value={editingEvent.paidTicketPrice}
                            onChange={handleEditChange}
                            min="1"
                            step="any"
                            className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* WordPress Metadata Card */}
                  <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold">
                      <Globe className="h-4 w-4" />
                      <span>WordPress Synchronization Details</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-muted-foreground">Linked WP Post ID:</span>
                        <p className="font-mono font-bold text-foreground">
                          {editingEvent.wpPostId ? `#${editingEvent.wpPostId}` : 'Not linked yet'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">WordPress URL:</span>
                        <p className="font-mono font-bold text-foreground truncate">
                          {editingEvent.wpUrl || `visitexpo.in/event/${editingEvent.slug}`}
                        </p>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground pt-1">
                      Saving this form will update both the platform database and the WordPress page automatically.
                    </p>
                  </div>
                </div>
              )}
            </form>

            {/* Drawer Footer Actions */}
            <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="edit-event-form"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-xs font-bold text-primary-foreground shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving & Syncing to WordPress...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Save Changes & Sync WordPress</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ============================================================== */}
      {deleteModal.isOpen && deleteModal.event && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 mx-auto ring-8 ring-rose-500/10">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-foreground">
                Permanently Delete Event?
              </h3>
              <p className="text-xs text-muted-foreground">
                Are you sure you want to delete <strong className="text-foreground">"{deleteModal.event.title}"</strong>? This will remove the event across the platform and WordPress directory.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, event: null, isDeleting: false })}
                disabled={deleteModal.isDeleting}
                className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteModal.isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow transition-all cursor-pointer disabled:opacity-50"
              >
                {deleteModal.isDeleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
