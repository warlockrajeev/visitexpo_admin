'use client';

/**
 * @file visitors/page.js
 * @description Dedicated Super Admin Visitor Directory and Pass Management Console.
 * Allows inspecting all registered visitors across expos, monitoring check-in timestamps,
 * viewing digital badges and QR codes, toggling venue entry, and managing attendance status.
 */

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import Pagination from '../../../components/Pagination.js';
import {
  Users,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Trash2,
  Check,
  X,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Layers,
  AlertCircle,
  Loader2,
  QrCode,
  Download,
  Ticket,
  ShieldCheck,
  Printer,
  FileSpreadsheet,
  Copy,
  Building2,
  Share2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function AdminVisitorsPage() {
  const { accessToken, loading: authLoading } = useAuth();

  // Data States
  const [visitors, setVisitors] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    checkedIn: 0,
    notCheckedIn: 0,
    virtual: 0,
    confirmed: 0,
    pending: 0,
    eventBreakdown: []
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [toast, setToast] = useState(null);

  // Filter & Search States
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'checked_in' | 'not_checked_in' | 'virtual'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('all');
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  // Event-Wise Pass Request Report States
  const [eventReportSearch, setEventReportSearch] = useState('');
  const [selectedReportEventId, setSelectedReportEventId] = useState(null);
  const [copiedEventId, setCopiedEventId] = useState(null);
  const [showEventReportsSection, setShowEventReportsSection] = useState(true);
  const [reportPage, setReportPage] = useState(1);
  const [reportsPerPage, setReportsPerPage] = useState(5);
  const [modalUserPage, setModalUserPage] = useState(1);
  const [modalUsersPerPage, setModalUsersPerPage] = useState(10);

  // Selected Visitor for Digital Pass Modal
  const [selectedVisitor, setSelectedVisitor] = useState(null);

  // 1. Fetch Stats & Events List with instant sessionStorage caching
  const fetchAuxiliaryData = async () => {
    if (!accessToken) return;
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const [statsRes, eventsRes] = await Promise.all([
        axios.get(`${API_URL}/visitors/stats`, { headers }),
        axios.get(`${API_URL}/events?limit=100&all=true`)
      ]);

      if (statsRes.data?.success) {
        setStats(statsRes.data.data);
      }
      if (eventsRes.data?.success) {
        const evDocs = eventsRes.data.data?.docs || [];
        setEvents(evDocs);
        try {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('visitexpo_admin_visitors_meta', JSON.stringify({
              stats: statsRes.data?.data,
              events: evDocs
            }));
          }
        } catch (e) {
          console.warn('Could not cache visitors meta:', e);
        }
      }
    } catch (err) {
      console.error('[AdminVisitors] Failed to load auxiliary data', err);
    }
  };

  // 2. Fetch Visitors with instant sessionStorage caching
  const fetchVisitors = async (isRefresh = false) => {
    if (!accessToken) {
      if (!authLoading) setLoading(false);
      return;
    }
    if (isRefresh) setRefreshing(true);
    else if (visitors.length === 0) setLoading(true);

    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const params = {
        limit: 200,
        page: 1
      };
      if (activeTab === 'pending') params.status = 'pending';
      if (selectedEventId !== 'all') params.eventId = selectedEventId;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await axios.get(`${API_URL}/visitors`, { headers, params });
      if (res.data?.success) {
        const freshDocs = res.data.data?.docs || [];
        setVisitors(freshDocs);
        if (activeTab === 'all' && selectedEventId === 'all' && !searchQuery.trim()) {
          try {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('visitexpo_admin_visitors_list', JSON.stringify(freshDocs));
            }
          } catch (e) {
            console.warn('Could not cache visitors list:', e);
          }
        }
      }
    } catch (err) {
      console.error('[AdminVisitors] Failed to load visitors', err);
      if (visitors.length === 0) {
        setToast({ type: 'error', message: 'Failed to fetch visitors list' });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (typeof window !== 'undefined') {
          const cachedMeta = sessionStorage.getItem('visitexpo_admin_visitors_meta');
          if (cachedMeta) {
            const parsed = JSON.parse(cachedMeta);
            if (parsed?.stats) setStats(parsed.stats);
            if (Array.isArray(parsed?.events)) setEvents(parsed.events);
          }
          const cachedList = sessionStorage.getItem('visitexpo_admin_visitors_list');
          if (cachedList) {
            const parsedList = JSON.parse(cachedList);
            if (Array.isArray(parsedList) && parsedList.length > 0) {
              setVisitors(parsedList);
              setLoading(false);
            }
          }
        }
      } catch (e) {
        console.warn('Could not read visitors cache:', e);
      }

      if (!authLoading) {
        fetchAuxiliaryData();
      }
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, authLoading]);

  useEffect(() => {
    if (!authLoading) {
      const timer = setTimeout(() => {
        fetchVisitors();
        setPage(1);
      }, 0);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, authLoading, selectedEventId, searchQuery, activeTab]);

  // Handle Toggle Check-in
  const handleToggleCheckin = async (visitorId, currentStatus) => {
    setActionLoadingId(visitorId);
    const newStatus = currentStatus === 'checked_in' ? 'not_checked_in' : 'checked_in';

    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const res = await axios.put(
        `${API_URL}/visitors/${visitorId}/status`,
        { checkInStatus: newStatus },
        { headers }
      );

      if (res.data?.success) {
        setToast({
          type: 'success',
          message: newStatus === 'checked_in' ? 'Visitor checked in successfully!' : 'Check-in status reverted.'
        });

        const updatedDoc = res.data.visitor;
        setVisitors(prev =>
          prev.map(v => (v._id === visitorId ? { ...v, checkInStatus: newStatus, checkInTime: updatedDoc.checkInTime } : v))
        );

        if (selectedVisitor?._id === visitorId) {
          setSelectedVisitor(prev => ({ ...prev, checkInStatus: newStatus, checkInTime: updatedDoc.checkInTime }));
        }

        fetchAuxiliaryData();
      }
    } catch (err) {
      console.error('Failed to toggle checkin', err);
      setToast({ type: 'error', message: 'Failed to update check-in status' });
    } finally {
      setActionLoadingId('');
    }
  };

  // Handle Update Registration Status (Confirmed / Pending / Cancelled)
  const handleUpdateRegistrationStatus = async (visitorId, registrationStatus) => {
    setActionLoadingId(visitorId);
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const res = await axios.put(
        `${API_URL}/visitors/${visitorId}/status`,
        { registrationStatus },
        { headers }
      );

      if (res.data?.success) {
        const updatedDoc = res.data.visitor || {};
        setToast({
          type: 'success',
          message:
            registrationStatus === 'confirmed'
              ? 'Pass request approved & digital QR pass issued!'
              : registrationStatus === 'cancelled'
              ? 'Visitor pass request declined.'
              : `Visitor pass status set to ${registrationStatus.toUpperCase()}!`
        });

        setVisitors(prev =>
          prev.map(v =>
            v._id === visitorId
              ? {
                  ...v,
                  registrationStatus,
                  qrCode: updatedDoc.qrCode ?? v.qrCode,
                  passStatus: updatedDoc.passStatus ?? v.passStatus
                }
              : v
          )
        );

        if (selectedVisitor?._id === visitorId) {
          setSelectedVisitor(prev => ({
            ...prev,
            registrationStatus,
            qrCode: updatedDoc.qrCode ?? prev.qrCode,
            passStatus: updatedDoc.passStatus ?? prev.passStatus
          }));
        }

        fetchAuxiliaryData();
      }
    } catch (err) {
      console.error('Failed to update status', err);
      setToast({ type: 'error', message: 'Failed to update registration status' });
    } finally {
      setActionLoadingId('');
    }
  };

  // Handle Delete Visitor
  const handleDeleteVisitor = async (visitorId, visitorName) => {
    if (!window.confirm(`Are you sure you want to remove registration for "${visitorName}"?`)) {
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const res = await axios.delete(`${API_URL}/visitors/${visitorId}`, { headers });
      if (res.data?.success) {
        setToast({ type: 'success', message: `Visitor "${visitorName}" deleted successfully.` });
        setVisitors(prev => prev.filter(v => v._id !== visitorId));
        if (selectedVisitor?._id === visitorId) setSelectedVisitor(null);
        fetchAuxiliaryData();
      }
    } catch (err) {
      console.error('Failed to delete visitor', err);
      setToast({ type: 'error', message: 'Failed to delete visitor' });
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredVisitors.length === 0) {
      alert('No visitor records to export.');
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Company', 'Designation', 'Event', 'Mode', 'Check-in Status', 'Check-in Time', 'Reg Status'];
    const rows = filteredVisitors.map(v => [
      `"${v.name || ''}"`,
      `"${v.email || ''}"`,
      `"${v.phone || ''}"`,
      `"${v.company || ''}"`,
      `"${v.designation || ''}"`,
      `"${v.event?.title || ''}"`,
      `"${v.attendanceType || 'in_person'}"`,
      `"${v.checkInStatus || 'not_checked_in'}"`,
      `"${v.checkInTime ? new Date(v.checkInTime).toLocaleString() : ''}"`,
      `"${v.registrationStatus || 'confirmed'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `visitexpo_visitors_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Event-Wise Pass Request Reports (combining server stats.eventBreakdown + live visitors state)
  const eventPassReports = useMemo(() => {
    const visitorById = new Map(visitors.map(v => [String(v._id), v]));

    if (Array.isArray(stats.eventBreakdown) && stats.eventBreakdown.length > 0) {
      return stats.eventBreakdown.map(item => {
        const syncedVisitors = (item.visitors || []).map(v => {
          const live = visitorById.get(String(v._id));
          return live
            ? {
                ...v,
                registrationStatus: live.registrationStatus || v.registrationStatus,
                checkInStatus: live.checkInStatus || v.checkInStatus,
                checkInTime: live.checkInTime || v.checkInTime,
                qrCode: live.qrCode || v.qrCode
              }
            : v;
        });

        const pendingCount = syncedVisitors.filter(v => v.registrationStatus === 'pending').length;
        const confirmedCount = syncedVisitors.filter(
          v => v.registrationStatus === 'confirmed' || v.registrationStatus === 'expired'
        ).length;
        const checkedInCount = syncedVisitors.filter(v => v.checkInStatus === 'checked_in').length;
        const cancelledCount = syncedVisitors.filter(v => v.registrationStatus === 'cancelled').length;

        return {
          ...item,
          totalRequests: syncedVisitors.length,
          allRecordsCount: syncedVisitors.length,
          pendingCount,
          confirmedCount,
          checkedInCount,
          cancelledCount,
          visitors: syncedVisitors
        };
      });
    }

    // Fallback: group from visitors state if stats.eventBreakdown hasn't loaded yet
    const grouped = new Map();
    visitors.forEach(v => {
      const ev = v.event && typeof v.event === 'object' ? v.event : null;
      const eventId = String(ev?._id || v.event || 'unknown');
      if (!grouped.has(eventId)) {
        grouped.set(eventId, {
          eventId,
          eventTitle: ev?.title || 'Unlinked Event',
          eventSlug: ev?.slug || '',
          city: ev?.city || '',
          venue: ev?.venue || '',
          startDate: ev?.startDate || null,
          endDate: ev?.endDate || null,
          organizerName: ev?.orgName || 'Event Organizer',
          organizerEmail: ev?.orgEmail || '',
          totalRequests: 0,
          allRecordsCount: 0,
          pendingCount: 0,
          confirmedCount: 0,
          checkedInCount: 0,
          cancelledCount: 0,
          latestRequestAt: v.createdAt || null,
          visitors: []
        });
      }
      const entry = grouped.get(eventId);
      entry.allRecordsCount += 1;
      entry.totalRequests += 1;
      if (v.registrationStatus === 'pending') entry.pendingCount += 1;
      if (v.registrationStatus === 'confirmed' || v.registrationStatus === 'expired') entry.confirmedCount += 1;
      if (v.checkInStatus === 'checked_in') entry.checkedInCount += 1;
      if (v.registrationStatus === 'cancelled') entry.cancelledCount += 1;
      if (v.createdAt && (!entry.latestRequestAt || new Date(v.createdAt) > new Date(entry.latestRequestAt))) {
        entry.latestRequestAt = v.createdAt;
      }
      entry.visitors.push({
        _id: v._id,
        name: v.name || '',
        email: v.email || '',
        phone: v.phone || '',
        company: v.company || '',
        designation: v.designation || '',
        country: v.country || '',
        attendanceType: v.attendanceType || 'in_person',
        registrationStatus: v.registrationStatus || 'pending',
        checkInStatus: v.checkInStatus || 'not_checked_in',
        checkInTime: v.checkInTime || null,
        qrCode: v.qrCode || '',
        createdAt: v.createdAt || null
      });
    });

    return Array.from(grouped.values()).sort(
      (a, b) => b.totalRequests - a.totalRequests || new Date(b.latestRequestAt || 0) - new Date(a.latestRequestAt || 0)
    );
  }, [stats.eventBreakdown, visitors]);

  const filteredEventPassReports = useMemo(() => {
    const q = eventReportSearch.trim().toLowerCase();
    if (!q) return eventPassReports;
    return eventPassReports.filter(
      item =>
        item.eventTitle?.toLowerCase().includes(q) ||
        item.city?.toLowerCase().includes(q) ||
        item.venue?.toLowerCase().includes(q) ||
        item.organizerName?.toLowerCase().includes(q) ||
        item.organizerEmail?.toLowerCase().includes(q)
    );
  }, [eventPassReports, eventReportSearch]);

  const selectedReportEvent = useMemo(() => {
    if (!selectedReportEventId) return null;
    return eventPassReports.find(r => r.eventId === selectedReportEventId) || null;
  }, [eventPassReports, selectedReportEventId]);

  // Pagination for Event-Wise Pass Request Reports Table
  const totalReportPages =
    reportsPerPage === 'all'
      ? 1
      : Math.ceil(filteredEventPassReports.length / Number(reportsPerPage)) || 1;
  const safeReportPage = Math.min(reportPage, totalReportPages);
  const reportStartIdx =
    reportsPerPage === 'all' ? 0 : (safeReportPage - 1) * Number(reportsPerPage);
  const paginatedEventPassReports =
    reportsPerPage === 'all'
      ? filteredEventPassReports
      : filteredEventPassReports.slice(reportStartIdx, reportStartIdx + Number(reportsPerPage));

  // Pagination for Users inside Organizer Pass Request Report Modal
  const modalAllVisitors = selectedReportEvent?.visitors || [];
  const totalModalUserPages =
    modalUsersPerPage === 'all'
      ? 1
      : Math.ceil(modalAllVisitors.length / Number(modalUsersPerPage)) || 1;
  const safeModalUserPage = Math.min(modalUserPage, totalModalUserPages);
  const modalUserStartIdx =
    modalUsersPerPage === 'all' ? 0 : (safeModalUserPage - 1) * Number(modalUsersPerPage);
  const paginatedModalVisitors =
    modalUsersPerPage === 'all'
      ? modalAllVisitors
      : modalAllVisitors.slice(modalUserStartIdx, modalUserStartIdx + Number(modalUsersPerPage));

  const eventSelectOptions = useMemo(() => {
    const map = new Map();
    eventPassReports.forEach(item => {
      if (item.eventId && item.eventId !== 'unknown') {
        map.set(String(item.eventId), {
          _id: String(item.eventId),
          title: `${item.eventTitle} (${item.totalRequests} pass req)`
        });
      }
    });
    events.forEach(ev => {
      const id = String(ev._id);
      if (!map.has(id)) {
        map.set(id, { _id: id, title: ev.title });
      }
    });
    return Array.from(map.values());
  }, [eventPassReports, events]);

  // Export Event-Specific Organizer Pass Request Report CSV
  const handleExportEventReportCSV = (report) => {
    if (!report || !Array.isArray(report.visitors) || report.visitors.length === 0) {
      setToast({ type: 'error', message: 'No pass request records found for this event.' });
      return;
    }

    const escapeCsv = val => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const headers = [
      'S.No',
      'Event Title',
      'Venue / City',
      'Organizer Name',
      'Organizer Email',
      'Visitor Name',
      'Company / Organization',
      'Designation',
      'Email Address',
      'Mobile / Phone',
      'Country',
      'Attendance Mode',
      'Pass Request Status',
      'Venue Check-in Status',
      'Pass / Badge Code',
      'Requested Date & Time'
    ];

    const rows = report.visitors.map((v, idx) => [
      escapeCsv(idx + 1),
      escapeCsv(report.eventTitle || ''),
      escapeCsv([report.venue, report.city].filter(Boolean).join(', ') || 'TBA'),
      escapeCsv(report.organizerName || 'Event Organizer'),
      escapeCsv(report.organizerEmail || ''),
      escapeCsv(v.name || ''),
      escapeCsv(v.company || 'Not Specified'),
      escapeCsv(v.designation || ''),
      escapeCsv(v.email || ''),
      escapeCsv(v.phone || ''),
      escapeCsv(v.country || 'India'),
      escapeCsv(v.attendanceType === 'virtual' ? 'Virtual' : 'In-Person'),
      escapeCsv(
        v.registrationStatus === 'confirmed'
          ? 'Approved (Pass Issued)'
          : v.registrationStatus === 'expired'
          ? 'Approved (Past Event)'
          : v.registrationStatus === 'pending'
          ? 'Pending Pass Request'
          : 'Declined / Cancelled'
      ),
      escapeCsv(v.checkInStatus === 'checked_in' ? 'Checked In' : 'Not Checked In'),
      escapeCsv(v.qrCode || 'Pending Assignment'),
      escapeCsv(v.createdAt ? new Date(v.createdAt).toLocaleString('en-IN') : '')
    ]);

    const csvBody = [headers.map(escapeCsv).join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvBody], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const safeSlug = (report.eventTitle || 'event')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `organizer_pass_requests_${safeSlug}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToast({
      type: 'success',
      message: `Exported Organizer Pass Request Report CSV for "${report.eventTitle}" (${report.visitors.length} users).`
    });
  };

  // Copy Formatted Organizer Pass Request Report Summary to Clipboard
  const handleCopyOrganizerReport = async (report) => {
    if (!report || !Array.isArray(report.visitors)) return;

    const lines = [
      `============================================================`,
      `VISITEXPO — ORGANIZER PASS REQUEST REPORT`,
      `============================================================`,
      `Event: ${report.eventTitle || 'Event'}`,
      `Location: ${[report.venue, report.city].filter(Boolean).join(', ') || 'TBA'}`,
      `Organizer: ${report.organizerName || 'Event Organizer'}${report.organizerEmail ? ` (${report.organizerEmail})` : ''}`,
      `Report Generated: ${new Date().toLocaleString('en-IN')}`,
      `------------------------------------------------------------`,
      `PASS REQUEST SUMMARY:`,
      `• Total Pass Requests: ${report.totalRequests}`,
      `• Approved / Passes Issued: ${report.confirmedCount}`,
      `• Pending Approval: ${report.pendingCount}`,
      `• Checked In at Venue: ${report.checkedInCount}`,
      `------------------------------------------------------------`,
      `USERS WHO REQUESTED VISITOR PASS (${report.visitors.length}):`,
      ...report.visitors.map((v, idx) => {
        const statusLabel =
          v.registrationStatus === 'confirmed' || v.registrationStatus === 'expired'
            ? 'APPROVED'
            : v.registrationStatus === 'pending'
            ? 'PENDING REQUEST'
            : 'DECLINED';
        const reqDate = v.createdAt
          ? new Date(v.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'N/A';
        return `${idx + 1}. ${v.name || 'Visitor'} | Company: ${v.company || 'N/A'}${v.designation ? ` (${v.designation})` : ''} | Email: ${v.email || 'N/A'} | Phone: ${v.phone || 'N/A'} | Status: ${statusLabel} | Requested: ${reqDate}`;
      }),
      `============================================================`
    ];

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedEventId(report.eventId);
      setTimeout(() => setCopiedEventId(null), 2500);
      setToast({
        type: 'success',
        message: `Organizer Pass Request Report for "${report.eventTitle}" copied to clipboard!`
      });
    } catch (e) {
      console.error('Failed to copy organizer report', e);
      setToast({ type: 'error', message: 'Could not copy report to clipboard.' });
    }
  };

  // Print / Save as PDF Organizer Report for an Event
  const handlePrintEventReport = (report) => {
    if (!report || typeof window === 'undefined') return;
    const printWin = window.open('', '_blank', 'width=1000,height=750');
    if (!printWin) {
      setToast({ type: 'error', message: 'Please allow popups to print or save PDF reports.' });
      return;
    }

    const rowsHtml = (report.visitors || [])
      .map(
        (v, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${v.name || '-'}</strong></td>
          <td>${v.company || '-'}${v.designation ? `<br/><small style="color:#64748b">${v.designation}</small>` : ''}</td>
          <td>${v.email || '-'}<br/>${v.phone || '-'}</td>
          <td>${v.attendanceType === 'virtual' ? 'Virtual' : 'In-Person'}</td>
          <td>${
            v.registrationStatus === 'confirmed' || v.registrationStatus === 'expired'
              ? '<span style="color:#059669;font-weight:700">Approved</span>'
              : v.registrationStatus === 'pending'
              ? '<span style="color:#d97706;font-weight:700">Pending Request</span>'
              : '<span style="color:#e11d48;font-weight:700">Cancelled</span>'
          }</td>
          <td>${v.createdAt ? new Date(v.createdAt).toLocaleString('en-IN') : '-'}</td>
        </tr>`
      )
      .join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pass Request Report - ${report.eventTitle || 'Event'}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #0f172a; margin: 28px; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 14px; margin-bottom: 18px; }
            h1 { font-size: 20px; margin: 0 0 6px 0; }
            .meta { font-size: 12px; color: #475569; line-height: 1.6; }
            .kpis { display: flex; gap: 12px; margin-bottom: 18px; }
            .kpi { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 14px; min-width: 120px; }
            .kpi-label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold; }
            .kpi-val { font-size: 20px; font-weight: 800; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; vertical-align: top; }
            th { background: #f8fafc; font-size: 11px; text-transform: uppercase; color: #334155; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>VisitExpo — Event Pass Requests Report for Organizer</h1>
            <div class="meta">
              <strong>Event:</strong> ${report.eventTitle || '-'} &nbsp;|&nbsp;
              <strong>Location:</strong> ${[report.venue, report.city].filter(Boolean).join(', ') || 'TBA'}<br/>
              <strong>Organizer:</strong> ${report.organizerName || 'Event Organizer'} ${report.organizerEmail ? `(${report.organizerEmail})` : ''} &nbsp;|&nbsp;
              <strong>Generated On:</strong> ${new Date().toLocaleString('en-IN')}
            </div>
          </div>
          <div class="kpis">
            <div class="kpi"><div class="kpi-label">Total Pass Requests</div><div class="kpi-val">${report.totalRequests}</div></div>
            <div class="kpi"><div class="kpi-label">Pending Approval</div><div class="kpi-val">${report.pendingCount}</div></div>
            <div class="kpi"><div class="kpi-label">Approved Passes</div><div class="kpi-val">${report.confirmedCount}</div></div>
            <div class="kpi"><div class="kpi-label">Checked In</div><div class="kpi-val">${report.checkedInCount}</div></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Visitor Name</th>
                <th>Company & Designation</th>
                <th>Contact (Email / Phone)</th>
                <th>Mode</th>
                <th>Pass Status</th>
                <th>Requested On</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  // Filtered & Paginated Visitors
  const filteredVisitors = visitors.filter(v => {
    const matchesSearch =
      !searchQuery.trim() ||
      v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.phone?.includes(searchQuery) ||
      v.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.event?.title?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesEvent = selectedEventId === 'all' || v.event?._id === selectedEventId || v.event === selectedEventId;

    let matchesTab = true;
    if (activeTab === 'pending') matchesTab = v.registrationStatus === 'pending';
    else if (activeTab === 'checked_in') matchesTab = v.checkInStatus === 'checked_in';
    else if (activeTab === 'not_checked_in') matchesTab = v.checkInStatus !== 'checked_in';
    else if (activeTab === 'virtual') matchesTab = v.attendanceType === 'virtual';

    return matchesSearch && matchesEvent && matchesTab;
  });

  const totalPages = Math.ceil(filteredVisitors.length / itemsPerPage) || 1;
  const startIdx = (page - 1) * itemsPerPage;
  const paginatedVisitors = filteredVisitors.slice(startIdx, startIdx + itemsPerPage);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 sm:right-6 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-xs font-semibold animate-in slide-in-from-top-5 duration-200 ${
          toast.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
            : 'bg-red-50 dark:bg-red-950 border-red-500/30 text-red-700 dark:text-red-300'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-black">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                Visitor Directory & Pass Management
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Track registered expo visitors, verify admission passes, record live venue check-ins, and manage attendee badges.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-all cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>

          <button
            onClick={() => {
              fetchVisitors(true);
              fetchAuxiliaryData();
            }}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div
          onClick={() => setActiveTab('all')}
          className={`bg-card border rounded-2xl p-5 shadow-sm cursor-pointer transition-all ${
            activeTab === 'all' ? 'ring-2 ring-blue-500 border-blue-500/50' : 'border-border hover:border-blue-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Visitors</span>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-foreground mt-2">{stats.total}</p>
          <span className="text-[11px] text-muted-foreground">Across all exhibitions</span>
        </div>

        <div
          onClick={() => setActiveTab('pending')}
          className={`bg-card border rounded-2xl p-5 shadow-sm cursor-pointer transition-all ${
            activeTab === 'pending'
              ? 'ring-2 ring-amber-500 border-amber-500/50'
              : stats.pending > 0
              ? 'border-amber-500/40 bg-amber-500/5 hover:border-amber-500/70'
              : 'border-border hover:border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Pass Requests
            </span>
            <Ticket className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-500 mt-2">{stats.pending || 0}</p>
          <span className="text-[11px] text-muted-foreground">Awaiting admin approval</span>
        </div>

        <div
          onClick={() => setActiveTab('checked_in')}
          className={`bg-card border rounded-2xl p-5 shadow-sm cursor-pointer transition-all ${
            activeTab === 'checked_in' ? 'ring-2 ring-emerald-500 border-emerald-500/50' : 'border-border hover:border-emerald-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Checked In at Venue
            </span>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-500 mt-2">{stats.checkedIn}</p>
          <span className="text-[11px] text-muted-foreground">Admitted badges</span>
        </div>

        <div
          onClick={() => setActiveTab('not_checked_in')}
          className={`bg-card border rounded-2xl p-5 shadow-sm cursor-pointer transition-all ${
            activeTab === 'not_checked_in' ? 'ring-2 ring-slate-500 border-slate-500/50' : 'border-border hover:border-slate-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Awaiting Check-in
            </span>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-extrabold text-foreground mt-2">{stats.notCheckedIn}</p>
          <span className="text-[11px] text-muted-foreground">Registered badge holders</span>
        </div>

        <div
          onClick={() => setActiveTab('virtual')}
          className={`bg-card border rounded-2xl p-5 shadow-sm cursor-pointer transition-all ${
            activeTab === 'virtual' ? 'ring-2 ring-purple-500 border-purple-500/50' : 'border-border hover:border-purple-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Virtual Attendees
            </span>
            <Globe className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-2xl font-extrabold text-purple-500 mt-2">{stats.virtual}</p>
          <span className="text-[11px] text-muted-foreground">Digital stream viewers</span>
        </div>
      </div>

      {/* Event-Wise Pass Requests & Organizer Reports Section */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border bg-muted/15 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-foreground">
                  Event-Wise Pass Requests &amp; Organizer Reports
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {eventPassReports.length} {eventPassReports.length === 1 ? 'Event' : 'Events'}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {eventPassReports.reduce((acc, r) => acc + (r.totalRequests || 0), 0)} Total Pass Requests
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                View pass request counts per event and export or copy the complete list of requesting users to share directly with the event organizer.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search event or organizer..."
                value={eventReportSearch}
                onChange={e => {
                  setEventReportSearch(e.target.value);
                  setReportPage(1);
                }}
                className="w-full pl-9 pr-7 py-1.5 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {eventReportSearch && (
                <button
                  onClick={() => {
                    setEventReportSearch('');
                    setReportPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowEventReportsSection(prev => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-secondary text-xs font-semibold text-foreground transition-colors cursor-pointer"
            >
              {showEventReportsSection ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" /> Hide Section
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" /> Show Section ({eventPassReports.length})
                </>
              )}
            </button>
          </div>
        </div>

        {showEventReportsSection && (
          <div className="divide-y divide-border">
            {filteredEventPassReports.length === 0 ? (
              <div className="p-8 text-center">
                <Ticket className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground">No event pass requests found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {eventReportSearch
                    ? 'No events matched your search query.'
                    : 'As visitors request event passes across the platform, each event and its requesting users will appear here.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/25 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <th className="py-3 px-4">Event Details</th>
                      <th className="py-3 px-4">Organizer</th>
                      <th className="py-3 px-4 text-center">Pass Requests</th>
                      <th className="py-3 px-4">Request Breakdown</th>
                      <th className="py-3 px-4">Recent Requesters</th>
                      <th className="py-3 px-4 text-right">Organizer Report Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs">
                    {paginatedEventPassReports.map(item => {
                      const isFilteredToEvent = selectedEventId === String(item.eventId);
                      const isCopied = copiedEventId === item.eventId;
                      return (
                        <tr
                          key={item.eventId}
                          className={`hover:bg-muted/20 transition-colors ${
                            isFilteredToEvent ? 'bg-blue-500/5' : ''
                          }`}
                        >
                          {/* Event Details */}
                          <td className="py-3.5 px-4 max-w-[260px]">
                            <p className="font-bold text-foreground truncate" title={item.eventTitle}>
                              {item.eventTitle || 'Untitled Event'}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                              {(item.venue || item.city) && (
                                <span className="inline-flex items-center gap-1 truncate">
                                  <MapPin className="h-3 w-3 text-blue-500 shrink-0" />
                                  {[item.venue, item.city].filter(Boolean).join(', ')}
                                </span>
                              )}
                              {item.startDate && (
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-amber-500 shrink-0" />
                                  {new Date(item.startDate).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Organizer */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 font-semibold text-foreground">
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate max-w-[160px]" title={item.organizerName}>
                                {item.organizerName || 'Event Organizer'}
                              </span>
                            </div>
                            {item.organizerEmail && (
                              <p className="text-[11px] text-muted-foreground truncate max-w-[180px] mt-0.5">
                                {item.organizerEmail}
                              </p>
                            )}
                          </td>

                          {/* Total Pass Requests */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex flex-col items-center px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/25">
                              <span className="text-base font-extrabold text-amber-600 dark:text-amber-400 leading-none">
                                {item.totalRequests}
                              </span>
                              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700/80 dark:text-amber-300/80 mt-0.5">
                                {item.totalRequests === 1 ? 'Pass Req' : 'Pass Reqs'}
                              </span>
                            </div>
                          </td>

                          {/* Breakdown Pills */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                <Clock className="h-2.5 w-2.5" /> {item.pendingCount} Pending
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="h-2.5 w-2.5" /> {item.confirmedCount} Approved
                              </span>
                              {item.checkedInCount > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                  <UserCheck className="h-2.5 w-2.5" /> {item.checkedInCount} Checked In
                                </span>
                              )}
                              {item.cancelledCount > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                  <XCircle className="h-2.5 w-2.5" /> {item.cancelledCount} Declined
                                </span>
                              )}
                            </div>
                            {item.latestRequestAt && (
                              <p className="text-[10px] text-muted-foreground mt-1">
                                Latest request:{' '}
                                {new Date(item.latestRequestAt).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </p>
                            )}
                          </td>

                          {/* Recent Requesters Preview */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5 max-w-[210px]">
                              {(item.visitors || []).slice(0, 2).map(u => (
                                <div key={u._id} className="text-[11px] truncate text-foreground">
                                  <span className="font-semibold">{u.name}</span>
                                  {u.company ? (
                                    <span className="text-muted-foreground"> • {u.company}</span>
                                  ) : null}
                                </div>
                              ))}
                              {(item.visitors || []).length > 2 && (
                                <button
                                  onClick={() => {
                                    setSelectedReportEventId(item.eventId);
                                    setModalUserPage(1);
                                  }}
                                  className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                >
                                  +{item.visitors.length - 2} more users — View all
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Organizer Report Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <button
                                onClick={() => {
                                  setSelectedReportEventId(item.eventId);
                                  setModalUserPage(1);
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-xs transition-all cursor-pointer"
                                title="View all users who requested a pass for this event and share report with organizer"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View Users ({item.visitors?.length || 0})
                              </button>

                              <button
                                onClick={() => handleExportEventReportCSV(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 font-bold text-[11px] transition-all cursor-pointer"
                                title="Download CSV Report of all pass requests for this event to share with the organizer"
                              >
                                <Download className="h-3.5 w-3.5" />
                                CSV Report
                              </button>

                              <button
                                onClick={() => handleCopyOrganizerReport(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-secondary text-foreground font-semibold text-[11px] transition-all cursor-pointer"
                                title="Copy formatted pass request report summary to send to the organizer via email or WhatsApp"
                              >
                                {isCopied ? (
                                  <>
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3.5 w-3.5" />
                                    Copy Summary
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => handlePrintEventReport(item)}
                                className="inline-flex items-center gap-1 p-1.5 rounded-lg border border-border bg-background hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                                title="Print or Save as PDF Report for Organizer"
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() =>
                                  setSelectedEventId(isFilteredToEvent ? 'all' : String(item.eventId))
                                }
                                className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                                  isFilteredToEvent
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'border-border bg-background hover:bg-secondary text-muted-foreground hover:text-foreground'
                                }`}
                                title="Filter main visitor table below by this event"
                              >
                                <Filter className="h-3 w-3" />
                                {isFilteredToEvent ? 'Filtered' : 'Filter'}
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

            {/* Event-Wise Reports Pagination */}
            {filteredEventPassReports.length > 0 && (
              <Pagination
                currentPage={safeReportPage}
                totalPages={totalReportPages}
                totalItems={filteredEventPassReports.length}
                itemsPerPage={reportsPerPage}
                pageSizeOptions={[5, 10, 20, 50]}
                itemLabel="event reports"
                pageSizeLabel="Reports per page"
                alwaysVisible={true}
                onPageChange={setReportPage}
                onPageSizeChange={size => {
                  setReportsPerPage(size);
                  setReportPage(1);
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/50">
            {[
              { id: 'all', label: 'All Visitors', count: stats.total },
              { id: 'pending', label: 'Pass Requests', count: stats.pending || 0, highlight: (stats.pending || 0) > 0 },
              { id: 'checked_in', label: 'Checked In', count: stats.checkedIn },
              { id: 'not_checked_in', label: 'Awaiting Check-in', count: stats.notCheckedIn },
              { id: 'virtual', label: 'Virtual Passes', count: stats.virtual }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-background text-foreground shadow-sm'
                    : tab.highlight
                    ? 'text-amber-600 dark:text-amber-400 hover:text-amber-700'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    tab.highlight ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search & Event Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search visitor, email, company..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <select
              value={selectedEventId}
              onChange={e => setSelectedEventId(e.target.value)}
              className="px-3 py-1.5 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary max-w-[220px] cursor-pointer"
            >
              <option value="all">All Events ({eventSelectOptions.length})</option>
              {eventSelectOptions.map(ev => (
                <option key={ev._id} value={ev._id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Visitors Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            Loading visitor records...
          </div>
        ) : paginatedVisitors.length === 0 ? (
          <div className="py-20 text-center text-xs text-muted-foreground space-y-2">
            <Users className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <p className="font-bold text-foreground text-sm">No Visitors Found</p>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try adjusting your search query or filters.' : 'No visitors registered under this view.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/20 font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-4">Visitor Details</th>
                  <th className="px-6 py-4">Registered Event</th>
                  <th className="px-6 py-4">Contact Coordinates</th>
                  <th className="px-6 py-4">Attendance Mode</th>
                  <th className="px-6 py-4">Check-In Status</th>
                  <th className="px-6 py-4">Pass Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedVisitors.map(vis => (
                  <tr key={vis._id} className="hover:bg-secondary/40 transition-colors">
                    {/* Visitor Details */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                          {vis.name?.charAt(0) || 'V'}
                        </div>
                        <div className="max-w-xs">
                          <p className="font-bold text-foreground truncate">{vis.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {vis.designation ? `${vis.designation}, ` : ''}{vis.company || 'Independent Visitor'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Registered Event */}
                    <td className="px-6 py-4">
                      <div className="max-w-[220px]">
                        <p className="font-semibold text-primary truncate">{vis.event?.title || 'Expo Event'}</p>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-2.5 w-2.5" /> {vis.event?.city || 'India'}
                        </span>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="px-6 py-4 space-y-0.5">
                      <div className="flex items-center gap-1 text-foreground font-medium truncate max-w-[180px]">
                        <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="truncate">{vis.email}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground text-[11px]">
                        <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span>{vis.phone}</span>
                      </div>
                    </td>

                    {/* Attendance Mode */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase border ${
                        vis.attendanceType === 'virtual'
                          ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                          : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      }`}>
                        {vis.attendanceType?.replace('_', ' ') || 'in person'}
                      </span>
                    </td>

                    {/* Check-In Status */}
                    <td className="px-6 py-4">
                      {vis.checkInStatus === 'checked_in' ? (
                        <div>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="h-3 w-3" /> Checked In
                          </span>
                          {vis.checkInTime && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {new Date(vis.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
                          <Clock className="h-3 w-3" /> Not Checked In
                        </span>
                      )}
                    </td>

                    {/* Pass Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border ${
                        vis.registrationStatus === 'confirmed'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : vis.registrationStatus === 'cancelled'
                          ? 'bg-destructive/10 text-destructive border-destructive/20'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {vis.registrationStatus || 'confirmed'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {vis.registrationStatus === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleUpdateRegistrationStatus(vis._id, 'confirmed')}
                              disabled={actionLoadingId === vis._id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-all cursor-pointer disabled:opacity-60"
                              title="Approve Pass Request & Generate QR Badge"
                            >
                              {actionLoadingId === vis._id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Approve Pass</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleUpdateRegistrationStatus(vis._id, 'cancelled')}
                              disabled={actionLoadingId === vis._id}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-500/20 transition-all cursor-pointer disabled:opacity-60"
                              title="Decline Pass Request"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleToggleCheckin(vis._id, vis.checkInStatus)}
                            disabled={actionLoadingId === vis._id || vis.registrationStatus === 'cancelled'}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 ${
                              vis.checkInStatus === 'checked_in'
                                ? 'bg-secondary text-foreground hover:bg-secondary/80 border border-border'
                                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                            }`}
                            title={vis.checkInStatus === 'checked_in' ? 'Undo Check-in' : 'Check In Visitor'}
                          >
                            {actionLoadingId === vis._id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : vis.checkInStatus === 'checked_in' ? (
                              'Undo Check-in'
                            ) : (
                              'Check In'
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedVisitor(vis)}
                          className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer"
                          title="View Digital Pass Badge"
                        >
                          <Ticket className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteVisitor(vis._id, vis.name)}
                          className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                          title="Remove Registration"
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

        {/* Pagination */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={filteredVisitors.length}
          itemsPerPage={itemsPerPage}
          itemLabel="visitors"
          onPageChange={setPage}
        />
      </div>

      {/* Digital Visitor Pass Modal */}
      {selectedVisitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Badge Header with Event Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center relative">
              <button
                onClick={() => setSelectedVisitor(null)}
                className="absolute right-4 top-4 p-1 rounded-full bg-black/20 hover:bg-black/40 text-white"
              >
                <X className="h-4 w-4" />
              </button>
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
                Official Visitor Pass
              </span>
              <h3 className="text-xl font-black mt-2 leading-tight">
                {selectedVisitor.event?.title || 'VisitExpo Global Trade Expo'}
              </h3>
              <p className="text-xs text-blue-100 mt-1 flex items-center justify-center gap-1">
                <MapPin className="h-3 w-3" /> {selectedVisitor.event?.city || 'India'}
              </p>
            </div>

            {/* Badge Card Body */}
            <div className="p-6 text-center space-y-4">
              <div>
                <h4 className="text-2xl font-black text-foreground">{selectedVisitor.name}</h4>
                <p className="text-xs font-semibold text-primary mt-0.5">
                  {selectedVisitor.designation || 'Trade Delegate'}
                </p>
                <p className="text-xs text-muted-foreground">{selectedVisitor.company || 'Visitor'}</p>
              </div>

              {/* QR Code Presentation */}
              <div className="bg-muted/20 border border-border rounded-2xl p-4 inline-block mx-auto">
                <div className="bg-white p-3 rounded-xl shadow-sm inline-block">
                  {/* Mock QR Code Pattern */}
                  <div className="h-32 w-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg text-slate-700">
                    <QrCode className="h-20 w-20 text-slate-800" />
                    <span className="text-[9px] font-mono mt-1 font-bold text-slate-500">
                      {selectedVisitor.qrCode || `VX-${selectedVisitor._id?.slice(-8)}`}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground font-mono mt-2 uppercase">
                  Scan at Entry Gate for Badge Print
                </p>
              </div>

              {/* Coordinates Grid */}
              <div className="grid grid-cols-2 gap-2 text-left text-xs bg-muted/10 p-3 rounded-xl border border-border">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Mode:</span>
                  <p className="font-semibold text-foreground uppercase">{selectedVisitor.attendanceType?.replace('_', ' ') || 'in person'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Admission:</span>
                  <p className="font-semibold text-foreground uppercase">{selectedVisitor.checkInStatus?.replace('_', ' ')}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Email:</span>
                  <p className="font-semibold text-foreground truncate">{selectedVisitor.email}</p>
                </div>
              </div>
            </div>

            {/* Badge Footer Buttons */}
            <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
              {selectedVisitor.registrationStatus === 'pending' ? (
                <>
                  <button
                    onClick={() => handleUpdateRegistrationStatus(selectedVisitor._id, 'cancelled')}
                    disabled={actionLoadingId === selectedVisitor._id}
                    className="flex-1 py-2 rounded-xl border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" /> Reject Request
                  </button>
                  <button
                    onClick={() => handleUpdateRegistrationStatus(selectedVisitor._id, 'confirmed')}
                    disabled={actionLoadingId === selectedVisitor._id}
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" /> Approve &amp; Issue Pass
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => window.print()}
                    className="flex-1 py-2 rounded-xl border border-border text-foreground hover:bg-secondary font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Printer className="h-3.5 w-3.5" /> Print Badge
                  </button>

                  <button
                    onClick={() => handleToggleCheckin(selectedVisitor._id, selectedVisitor.checkInStatus)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all shadow ${
                      selectedVisitor.checkInStatus === 'checked_in'
                        ? 'bg-amber-500 hover:bg-amber-600'
                        : 'bg-emerald-500 hover:bg-emerald-600'
                    }`}
                  >
                    {selectedVisitor.checkInStatus === 'checked_in' ? 'Revert Check-in' : 'Admit Visitor'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Event Pass Request Report Modal (For Sharing with Organizer) */}
      {selectedReportEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    <Share2 className="h-3 w-3" /> Organizer Pass Request Report
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">
                    • {selectedReportEvent.totalRequests} Active Pass Requests
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-foreground mt-1">
                  {selectedReportEvent.eventTitle || 'Event Pass Requests'}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  {(selectedReportEvent.venue || selectedReportEvent.city) && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-blue-500" />
                      {[selectedReportEvent.venue, selectedReportEvent.city].filter(Boolean).join(', ')}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-amber-500" />
                    Organizer: <strong className="text-foreground">{selectedReportEvent.organizerName || 'Event Organizer'}</strong>
                    {selectedReportEvent.organizerEmail ? ` (${selectedReportEvent.organizerEmail})` : ''}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleExportEventReportCSV(selectedReportEvent)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export CSV for Organizer
                </button>
                <button
                  onClick={() => handleCopyOrganizerReport(selectedReportEvent)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-secondary text-foreground text-xs font-bold transition-all cursor-pointer"
                >
                  {copiedEventId === selectedReportEvent.eventId ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" /> Copied Report!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copy Report Summary
                    </>
                  )}
                </button>
                <button
                  onClick={() => handlePrintEventReport(selectedReportEvent)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-secondary text-foreground text-xs font-bold transition-all cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setSelectedReportEventId(null)}
                  className="p-1.5 rounded-xl border border-border bg-background hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Event Report KPI Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 border-b border-border bg-muted/10">
              <div className="p-3 rounded-xl bg-card border border-border">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Total Pass Requests
                </span>
                <p className="text-xl font-extrabold text-foreground mt-0.5">
                  {selectedReportEvent.totalRequests}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Pending Approval
                </span>
                <p className="text-xl font-extrabold text-amber-500 mt-0.5">
                  {selectedReportEvent.pendingCount}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Approved &amp; Pass Issued
                </span>
                <p className="text-xl font-extrabold text-emerald-500 mt-0.5">
                  {selectedReportEvent.confirmedCount}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Checked In at Venue
                </span>
                <p className="text-xl font-extrabold text-blue-500 mt-0.5">
                  {selectedReportEvent.checkedInCount}
                </p>
              </div>
            </div>

            {/* Users Table */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-card border-b border-border z-10">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/30">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Visitor Profile</th>
                    <th className="py-3 px-4">Company &amp; Designation</th>
                    <th className="py-3 px-4">Contact Info</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4">Pass Status</th>
                    <th className="py-3 px-4">Requested Date</th>
                    <th className="py-3 px-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {paginatedModalVisitors.map((u, idx) => {
                    const rowNum = modalUserStartIdx + idx + 1;
                    return (
                    <tr key={u._id || idx} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-bold text-muted-foreground">{rowNum}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-foreground">{u.name || 'Visitor'}</p>
                        {u.country && (
                          <p className="text-[10px] text-muted-foreground">{u.country}</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-foreground">{u.company || 'Not Specified'}</p>
                        {u.designation && (
                          <p className="text-[11px] text-muted-foreground">{u.designation}</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <p className="text-foreground font-medium flex items-center gap-1">
                            <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span>{u.email || '-'}</span>
                          </p>
                          {u.phone && (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3 shrink-0" />
                              <span>{u.phone}</span>
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-muted text-foreground">
                          {u.attendanceType === 'virtual' ? 'Virtual' : 'In-Person'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {u.registrationStatus === 'confirmed' || u.registrationStatus === 'expired' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="h-3 w-3" />{' '}
                            {u.registrationStatus === 'expired' ? 'Approved (Past)' : 'Approved'}
                          </span>
                        ) : u.registrationStatus === 'pending' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <Clock className="h-3 w-3" /> Pending Request
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <XCircle className="h-3 w-3" /> Declined
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-muted-foreground whitespace-nowrap">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {u.registrationStatus === 'pending' ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleUpdateRegistrationStatus(u._id, 'confirmed')}
                              disabled={actionLoadingId === u._id}
                              className="px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold transition-all cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateRegistrationStatus(u._id, 'cancelled')}
                              disabled={actionLoadingId === u._id}
                              className="px-2 py-1 rounded-lg border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 text-[10px] font-bold transition-all cursor-pointer"
                            >
                              Decline
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {u.qrCode || 'Processed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>

            {/* Modal Pagination */}
            {modalAllVisitors.length > 0 && (
              <Pagination
                currentPage={safeModalUserPage}
                totalPages={totalModalUserPages}
                totalItems={modalAllVisitors.length}
                itemsPerPage={modalUsersPerPage}
                pageSizeOptions={[5, 10, 25, 50]}
                itemLabel="users"
                pageSizeLabel="Users per page"
                alwaysVisible={true}
                onPageChange={setModalUserPage}
                onPageSizeChange={size => {
                  setModalUsersPerPage(size);
                  setModalUserPage(1);
                }}
              />
            )}

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
              <span>
                Showing all <strong>{selectedReportEvent.visitors?.length || 0}</strong> pass request records for{' '}
                <strong className="text-foreground">{selectedReportEvent.eventTitle}</strong>.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedEventId(String(selectedReportEvent.eventId));
                    setSelectedReportEventId(null);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-secondary text-foreground font-semibold transition-colors cursor-pointer"
                >
                  Filter Main Table by This Event
                </button>
                <button
                  onClick={() => setSelectedReportEventId(null)}
                  className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold transition-colors cursor-pointer"
                >
                  Close Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
