/**
 * @file exportExpoReport.js
 * @description Multi-format export engine (CSV, Excel .xlsx, and A4 Printable PDF)
 * for VisitExpo Super Admin Expo Reports & Data Export Center.
 */

import * as XLSX from 'xlsx';

function formatDate(dateVal) {
  if (!dateVal) return 'N/A';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return String(dateVal);
  }
}

function formatDateTime(dateVal) {
  if (!dateVal) return 'N/A';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return String(dateVal);
  }
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeCsvCell(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/\r?\n/g, ' ').trim();
  return `"${str.replace(/"/g, '""')}"`;
}

function autoFitColumns(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const keys = Object.keys(rows[0]);
  return keys.map(key => {
    let maxLen = key.length;
    for (let i = 0; i < Math.min(rows.length, 200); i++) {
      const cellVal = rows[i]?.[key];
      const len = cellVal !== null && cellVal !== undefined ? String(cellVal).length : 0;
      if (len > maxLen) maxLen = len;
    }
    return { wch: Math.min(Math.max(maxLen + 3, 12), 52) };
  });
}

function sanitizeFileSlug(str) {
  return String(str || 'expo-report')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 50) || 'expo-report';
}

/**
 * Build flat master summary row for an expo report item
 */
export function buildMasterExpoRow(item, index = 0) {
  const e = item.expo || item;
  const m = item.metrics || e.metrics || {};
  return {
    '#': index + 1,
    'Expo Title': e.title || 'Untitled Exhibition',
    'Slug': e.slug || '',
    'Category': e.category || (Array.isArray(e.categories) ? e.categories.join(', ') : 'Trade & Industry'),
    'Status': (e.status || 'published').toUpperCase(),
    'Event Format': (e.eventType || 'hybrid').toUpperCase(),
    'Venue': e.venue || 'N/A',
    'City': e.city || 'India',
    'Country': e.country || 'India',
    'Start Date': formatDate(e.startDate),
    'End Date': formatDate(e.endDate),
    'Timings': e.timings || '09:00 AM - 06:00 PM',
    'Organizer Name': e.orgName || 'VisitExpo Verified Organizer',
    'Organizer Email': e.orgEmail || 'N/A',
    'Organizer Phone': e.orgPhone || 'N/A',
    'Website': e.website || e.orgWebsite || 'N/A',
    'Claimed Status': e.isClaimed ? 'Claimed' : 'Unclaimed',
    'Ticketing Type': e.isFreeEvent !== false ? 'Free Entry' : `Paid (${e.currency || 'INR'} ${e.paidTicketPrice || 0})`,
    'Registered Visitors': m.visitorsCount || 0,
    'Checked-In Visitors': m.checkedInCount || 0,
    'Interested & Followers': m.attendeesCount || 0,
    'Interested Buyers': m.interestedCount || 0,
    'Event Followers': m.followersCount || 0,
    'CRM Buyer Leads': m.leadsCount || 0,
    'Qualified Leads': m.qualifiedLeadsCount || 0,
    'Exhibitors & Booths': m.exhibitorsCount || 0,
    'Sponsors & Partners': m.sponsorsCount || 0,
    'Ticket Orders': m.ordersCount || 0,
    'Tickets Sold': m.ticketsSoldCount || 0,
    'Ticket Revenue (INR)': m.ticketRevenue || 0,
    'Marketing Campaigns': m.campaignsCount || 0,
    'Reviews': m.reviewsCount || 0,
    'Avg Rating': m.avgRating || 0,
    'WordPress URL': e.wpUrl || ''
  };
}

/**
 * 1. Export Expo Report(s) to Excel (.xlsx) Workbook
 */
export function exportExpoReportsToExcel(reports = [], modules = {}, customFileName = '') {
  if (!Array.isArray(reports) || reports.length === 0) return false;

  const wb = XLSX.utils.book_new();
  const isSingle = reports.length === 1;
  const dateStamp = new Date().toISOString().slice(0, 10);

  if (isSingle) {
    const rep = reports[0];
    const e = rep.expo || rep;
    const m = rep.metrics || e.metrics || {};

    // Sheet 1: Expo Overview
    const overviewRows = [
      { Field: 'Expo Title', Value: e.title || '' },
      { Field: 'Expo Slug', Value: e.slug || '' },
      { Field: 'Industry Category', Value: e.category || (Array.isArray(e.categories) ? e.categories.join(', ') : '') },
      { Field: 'Publication Status', Value: (e.status || 'published').toUpperCase() },
      { Field: 'Event Format', Value: (e.eventType || 'hybrid').toUpperCase() },
      { Field: 'Venue Name', Value: e.venue || '' },
      { Field: 'City', Value: e.city || '' },
      { Field: 'Country', Value: e.country || 'India' },
      { Field: 'Start Date', Value: formatDate(e.startDate) },
      { Field: 'End Date', Value: formatDate(e.endDate) },
      { Field: 'Daily Timings', Value: e.timings || '09:00 AM - 06:00 PM' },
      { Field: 'Organizer Name', Value: e.orgName || '' },
      { Field: 'Organizer Email', Value: e.orgEmail || '' },
      { Field: 'Organizer Phone', Value: e.orgPhone || '' },
      { Field: 'Official Website', Value: e.website || e.orgWebsite || '' },
      { Field: 'WordPress Listing URL', Value: e.wpUrl || '' },
      { Field: 'WordPress Post ID', Value: e.wpPostId || 'N/A' },
      { Field: 'Claimed by Organizer', Value: e.isClaimed ? 'Yes (Verified)' : 'No (Directory Listing)' },
      { Field: 'Ticketing Mode', Value: e.isFreeEvent !== false ? 'Free Entry Pass' : `Paid Ticket (${e.currency || 'INR'} ${e.paidTicketPrice || 0})` },
      { Field: 'Registered Visitors', Value: m.visitorsCount || 0 },
      { Field: 'Checked-In Visitors', Value: m.checkedInCount || 0 },
      { Field: 'Total Interested & Followers', Value: m.attendeesCount || 0 },
      { Field: 'Interested Buyers', Value: m.interestedCount || 0 },
      { Field: 'Event Followers', Value: m.followersCount || 0 },
      { Field: 'CRM Buyer Leads', Value: m.leadsCount || 0 },
      { Field: 'Qualified / Won Leads', Value: m.qualifiedLeadsCount || 0 },
      { Field: 'Exhibitors & Booths', Value: m.exhibitorsCount || 0 },
      { Field: 'Sponsors & Partners', Value: m.sponsorsCount || 0 },
      { Field: 'Ticket Orders', Value: m.ordersCount || 0 },
      { Field: 'Tickets Sold', Value: m.ticketsSoldCount || 0 },
      { Field: 'Total Ticket Revenue', Value: `${e.currency || 'INR'} ${(m.ticketRevenue || 0).toLocaleString('en-IN')}` },
      { Field: 'Marketing Campaigns', Value: m.campaignsCount || 0 },
      { Field: 'Reviews Count', Value: m.reviewsCount || 0 },
      { Field: 'Average Rating', Value: m.avgRating ? `${m.avgRating} / 5.0` : 'No ratings yet' },
      { Field: 'Description', Value: (e.description || '').slice(0, 1000) },
      { Field: 'Report Exported At', Value: new Date().toLocaleString('en-IN') }
    ];
    const wsOverview = XLSX.utils.json_to_sheet(overviewRows);
    wsOverview['!cols'] = autoFitColumns(overviewRows);
    XLSX.utils.book_append_sheet(wb, wsOverview, 'Expo Overview');
  } else {
    // Multi-expo Master Catalog Sheet
    const masterRows = reports.map((r, idx) => buildMasterExpoRow(r, idx));
    const wsMaster = XLSX.utils.json_to_sheet(masterRows);
    wsMaster['!cols'] = autoFitColumns(masterRows);
    XLSX.utils.book_append_sheet(wb, wsMaster, 'Expos Master Summary');
  }

  // Granular Sheets across all selected reports
  if (modules.visitors !== false) {
    const visitorRows = [];
    reports.forEach(rep => {
      const e = rep.expo || rep;
      (rep.visitors || []).forEach((v, i) => {
        visitorRows.push({
          '#': visitorRows.length + 1,
          ...(isSingle ? {} : { 'Expo Title': e.title || '', 'Expo City': e.city || '' }),
          'Visitor Name': v.name || '',
          'Email': v.email || '',
          'Phone': v.phone || '',
          'Company': v.company || '',
          'Designation': v.designation || '',
          'Country': v.country || 'India',
          'Attendance Type': (v.attendanceType || 'in_person').toUpperCase(),
          'Registration Status': (v.registrationStatus || 'confirmed').toUpperCase(),
          'Check-In Status': v.checkInStatus === 'checked_in' ? 'CHECKED IN' : 'NOT CHECKED IN',
          'Check-In Time': v.checkInTime ? formatDateTime(v.checkInTime) : 'N/A',
          'Pass / QR Code': v.qrCode || '',
          'Registered Date': formatDateTime(v.createdAt)
        });
      });
    });
    const rowsToWrite = visitorRows.length > 0
      ? visitorRows
      : [{ Note: 'No registered visitor records found for the selected expo(s).' }];
    const wsVisitors = XLSX.utils.json_to_sheet(rowsToWrite);
    wsVisitors['!cols'] = autoFitColumns(rowsToWrite);
    XLSX.utils.book_append_sheet(wb, wsVisitors, 'Visitors & Passes');
  }

  if (modules.attendees !== false) {
    const attendeeRows = [];
    reports.forEach(rep => {
      const e = rep.expo || rep;
      (rep.attendees || []).forEach(att => {
        attendeeRows.push({
          '#': attendeeRows.length + 1,
          ...(isSingle ? {} : { 'Expo Title': e.title || '', 'Expo City': e.city || '' }),
          'Attendee Name': att.userName || '',
          'Email': att.userEmail || '',
          'Phone': att.userPhone || '',
          'Company': att.userCompany || '',
          'Designation': att.userDesignation || '',
          'City': att.userCity || '',
          'Country': att.userCountry || 'India',
          'Role': att.userRole || 'visitor',
          'Engagement Type': att.type === 'both' ? 'Interested & Following' : att.type === 'follower' ? 'Following' : 'Interested',
          'Source': att.source || 'web_directory',
          'Date': formatDateTime(att.createdAt)
        });
      });
    });
    const rowsToWrite = attendeeRows.length > 0
      ? attendeeRows
      : [{ Note: 'No interested attendees or follower records found for the selected expo(s).' }];
    const wsAttendees = XLSX.utils.json_to_sheet(rowsToWrite);
    wsAttendees['!cols'] = autoFitColumns(rowsToWrite);
    XLSX.utils.book_append_sheet(wb, wsAttendees, 'Attendees & Followers');
  }

  if (modules.leads !== false) {
    const leadRows = [];
    reports.forEach(rep => {
      const e = rep.expo || rep;
      (rep.leads || []).forEach(ld => {
        leadRows.push({
          '#': leadRows.length + 1,
          ...(isSingle ? {} : { 'Expo Title': e.title || '', 'Expo City': e.city || '' }),
          'Lead Name': ld.name || '',
          'Email': ld.email || '',
          'Phone': ld.phone || '',
          'Company': ld.company || '',
          'Designation': ld.designation || '',
          'Country': ld.country || 'India',
          'Lead Score': ld.leadScore ?? 0,
          'Source': ld.source || 'website',
          'CRM Status': (ld.status || 'new').toUpperCase(),
          'Notes': ld.notes || '',
          'Created Date': formatDateTime(ld.createdAt)
        });
      });
    });
    const rowsToWrite = leadRows.length > 0
      ? leadRows
      : [{ Note: 'No CRM buyer lead records found for the selected expo(s).' }];
    const wsLeads = XLSX.utils.json_to_sheet(rowsToWrite);
    wsLeads['!cols'] = autoFitColumns(rowsToWrite);
    XLSX.utils.book_append_sheet(wb, wsLeads, 'CRM Buyer Leads');
  }

  if (modules.exhibitors !== false) {
    const exhibitorRows = [];
    reports.forEach(rep => {
      const e = rep.expo || rep;
      (rep.exhibitors || []).forEach(ex => {
        exhibitorRows.push({
          '#': exhibitorRows.length + 1,
          ...(isSingle ? {} : { 'Expo Title': e.title || '', 'Expo City': e.city || '' }),
          'Exhibitor Company': ex.name || '',
          'Booth Number': ex.boothNumber || 'TBD',
          'Contact Email': ex.contactEmail || '',
          'Contact Phone': ex.contactPhone || '',
          'Website': ex.website || '',
          'Approval Status': (ex.status || 'approved').toUpperCase(),
          'Attendance Mode': (ex.attendanceType || 'in_person').toUpperCase(),
          'Product Categories': Array.isArray(ex.productCategories) ? ex.productCategories.join(', ') : '',
          'Hall / Zone': ex.priorityHall || '',
          'Staff Count': ex.staffCount || 0,
          'Description': (ex.description || '').slice(0, 300)
        });
      });
    });
    const rowsToWrite = exhibitorRows.length > 0
      ? exhibitorRows
      : [{ Note: 'No exhibitor records found for the selected expo(s).' }];
    const wsExhibitors = XLSX.utils.json_to_sheet(rowsToWrite);
    wsExhibitors['!cols'] = autoFitColumns(rowsToWrite);
    XLSX.utils.book_append_sheet(wb, wsExhibitors, 'Exhibitors & Booths');
  }

  if (modules.sponsors !== false) {
    const sponsorRows = [];
    reports.forEach(rep => {
      const e = rep.expo || rep;
      (rep.sponsors || []).forEach(sp => {
        sponsorRows.push({
          '#': sponsorRows.length + 1,
          ...(isSingle ? {} : { 'Expo Title': e.title || '', 'Expo City': e.city || '' }),
          'Sponsor Name': sp.name || '',
          'Sponsor Tier': (sp.tier || 'Sponsor').toUpperCase(),
          'Website': sp.website || '',
          'Booth Number': sp.boothNumber || '',
          'Booth Size': sp.boothSize || '',
          'Contact Person': sp.contactName || '',
          'Contact Email': sp.contactEmail || '',
          'Contact Phone': sp.contactPhone || ''
        });
      });
    });
    const rowsToWrite = sponsorRows.length > 0
      ? sponsorRows
      : [{ Note: 'No sponsor records found for the selected expo(s).' }];
    const wsSponsors = XLSX.utils.json_to_sheet(rowsToWrite);
    wsSponsors['!cols'] = autoFitColumns(rowsToWrite);
    XLSX.utils.book_append_sheet(wb, wsSponsors, 'Sponsors & Partners');
  }

  if (modules.orders !== false) {
    const orderRows = [];
    reports.forEach(rep => {
      const e = rep.expo || rep;
      (rep.orders || []).forEach(ord => {
        const itemsText = Array.isArray(ord.items)
          ? ord.items.map(it => `${it.title || 'Ticket'} (x${it.quantity || 1})`).join('; ')
          : 'General Entry';
        orderRows.push({
          '#': orderRows.length + 1,
          ...(isSingle ? {} : { 'Expo Title': e.title || '', 'Expo City': e.city || '' }),
          'Order Number': ord.orderNumber || '',
          'Buyer Name': ord.buyer?.name || '',
          'Buyer Email': ord.buyer?.email || '',
          'Buyer Phone': ord.buyer?.phone || '',
          'Buyer Company': ord.buyer?.company || '',
          'Tickets Purchased': itemsText,
          'Total Amount': ord.totalAmount ?? 0,
          'Currency': ord.currency || 'INR',
          'Status': (ord.status || 'pending').toUpperCase(),
          'Payment Method': ord.paymentMethod || 'Online',
          'Order Date': formatDateTime(ord.createdAt)
        });
      });
    });
    const rowsToWrite = orderRows.length > 0
      ? orderRows
      : [{ Note: 'No ticket order records found for the selected expo(s).' }];
    const wsOrders = XLSX.utils.json_to_sheet(rowsToWrite);
    wsOrders['!cols'] = autoFitColumns(rowsToWrite);
    XLSX.utils.book_append_sheet(wb, wsOrders, 'Tickets & Orders');
  }

  if (modules.campaigns !== false) {
    const campaignRows = [];
    reports.forEach(rep => {
      const e = rep.expo || rep;
      (rep.campaigns || []).forEach(cmp => {
        campaignRows.push({
          '#': campaignRows.length + 1,
          ...(isSingle ? {} : { 'Expo Title': e.title || '', 'Expo City': e.city || '' }),
          'Campaign Title': cmp.title || '',
          'Channel': (cmp.channel || 'email').toUpperCase(),
          'Subject Line': cmp.content?.subject || cmp.title || '',
          'Status': (cmp.status || 'draft').toUpperCase(),
          'Target Recipients': cmp.targetAudience?.recipientCount || cmp.sentCount || 0,
          'Sent Count': cmp.sentCount || 0,
          'Delivered Count': cmp.deliveredCount || 0,
          'Open Count': cmp.openCount || 0,
          'Click Count': cmp.clickCount || 0,
          'Date': formatDateTime(cmp.sentAt || cmp.createdAt)
        });
      });
    });
    const rowsToWrite = campaignRows.length > 0
      ? campaignRows
      : [{ Note: 'No marketing campaign records found for the selected expo(s).' }];
    const wsCampaigns = XLSX.utils.json_to_sheet(rowsToWrite);
    wsCampaigns['!cols'] = autoFitColumns(rowsToWrite);
    XLSX.utils.book_append_sheet(wb, wsCampaigns, 'Campaigns & Broadcasts');
  }

  const defaultName = isSingle
    ? `VisitExpo_Report_${sanitizeFileSlug(reports[0]?.expo?.title || reports[0]?.title)}_${dateStamp}.xlsx`
    : `VisitExpo_Expos_Report_${reports.length}_Expos_${dateStamp}.xlsx`;

  XLSX.writeFile(wb, customFileName || defaultName);
  return true;
}

/**
 * 2. Export Expo Report(s) to CSV (.csv) File
 */
export function exportExpoReportsToCSV(reports = [], modules = {}, customFileName = '') {
  if (!Array.isArray(reports) || reports.length === 0) return false;

  const isSingle = reports.length === 1;
  const dateStamp = new Date().toISOString().slice(0, 10);
  const lines = [];

  const appendSection = (sectionTitle, rows) => {
    lines.push(`"=== ${sectionTitle.toUpperCase()} ==="`);
    if (!Array.isArray(rows) || rows.length === 0) {
      lines.push('"No records found in this section."');
      lines.push('');
      return;
    }
    const headers = Object.keys(rows[0]);
    lines.push(headers.map(escapeCsvCell).join(','));
    for (const row of rows) {
      lines.push(headers.map(h => escapeCsvCell(row[h])).join(','));
    }
    lines.push('');
  };

  // Section 1: Master Expo Overview
  const masterRows = reports.map((r, idx) => buildMasterExpoRow(r, idx));
  appendSection(isSingle ? 'EXPO OVERVIEW & METRICS' : `EXPOS MASTER SUMMARY (${reports.length} EXPOS)`, masterRows);

  // Section 2: Visitors
  if (modules.visitors !== false) {
    const visitorRows = [];
    reports.forEach(rep => {
      const e = rep.expo || rep;
      (rep.visitors || []).forEach(v => {
        visitorRows.push({
          '#': visitorRows.length + 1,
          'Expo Title': e.title || '',
          'Expo City': e.city || '',
          'Visitor Name': v.name || '',
          'Email': v.email || '',
          'Phone': v.phone || '',
          'Company': v.company || '',
          'Designation': v.designation || '',
          'Country': v.country || 'India',
          'Attendance Type': (v.attendanceType || 'in_person').toUpperCase(),
          'Registration Status': (v.registrationStatus || 'confirmed').toUpperCase(),
          'Check-In Status': v.checkInStatus === 'checked_in' ? 'CHECKED IN' : 'NOT CHECKED IN',
          'Check-In Time': v.checkInTime ? formatDateTime(v.checkInTime) : 'N/A',
          'Registered Date': formatDateTime(v.createdAt)
        });
      });
    });
    if (visitorRows.length > 0 || isSingle) {
      appendSection(`REGISTERED VISITORS & PASSES (${visitorRows.length})`, visitorRows);
    }
  }

  // Section 3: Attendees & Followers
  if (modules.attendees !== false) {
    const attendeeRows = [];
    reports.forEach(rep => {
      const e = rep.expo || rep;
      (rep.attendees || []).forEach(att => {
        attendeeRows.push({
          '#': attendeeRows.length + 1,
          'Expo Title': e.title || '',
          'Expo City': e.city || '',
          'Attendee Name': att.userName || '',
          'Email': att.userEmail || '',
          'Phone': att.userPhone || '',
          'Company': att.userCompany || '',
          'Designation': att.userDesignation || '',
          'City': att.userCity || '',
          'Country': att.userCountry || 'India',
          'Engagement Type': att.type === 'both' ? 'Interested & Following' : att.type === 'follower' ? 'Following' : 'Interested',
          'Date': formatDateTime(att.createdAt)
        });
      });
    });
    if (attendeeRows.length > 0 || isSingle) {
      appendSection(`INTERESTED ATTENDEES & FOLLOWERS (${attendeeRows.length})`, attendeeRows);
    }
  }

  // Section 4: CRM Buyer Leads
  if (modules.leads !== false) {
    const leadRows = [];
    reports.forEach(rep => {
      const e = rep.expo || rep;
      (rep.leads || []).forEach(ld => {
        leadRows.push({
          '#': leadRows.length + 1,
          'Expo Title': e.title || '',
          'Expo City': e.city || '',
          'Lead Name': ld.name || '',
          'Email': ld.email || '',
          'Phone': ld.phone || '',
          'Company': ld.company || '',
          'Designation': ld.designation || '',
          'Country': ld.country || 'India',
          'Lead Score': ld.leadScore ?? 0,
          'Source': ld.source || 'website',
          'Status': (ld.status || 'new').toUpperCase(),
          'Notes': ld.notes || '',
          'Created Date': formatDateTime(ld.createdAt)
        });
      });
    });
    if (leadRows.length > 0 || isSingle) {
      appendSection(`CRM BUYER LEADS (${leadRows.length})`, leadRows);
    }
  }

  // Section 5: Exhibitors
  if (modules.exhibitors !== false) {
    const exhibitorRows = [];
    reports.forEach(rep => {
      const e = rep.expo || rep;
      (rep.exhibitors || []).forEach(ex => {
        exhibitorRows.push({
          '#': exhibitorRows.length + 1,
          'Expo Title': e.title || '',
          'Expo City': e.city || '',
          'Exhibitor Company': ex.name || '',
          'Booth Number': ex.boothNumber || 'TBD',
          'Contact Email': ex.contactEmail || '',
          'Contact Phone': ex.contactPhone || '',
          'Website': ex.website || '',
          'Status': (ex.status || 'approved').toUpperCase(),
          'Attendance Mode': (ex.attendanceType || 'in_person').toUpperCase(),
          'Categories': Array.isArray(ex.productCategories) ? ex.productCategories.join('; ') : ''
        });
      });
    });
    if (exhibitorRows.length > 0 || isSingle) {
      appendSection(`EXHIBITORS & BOOTHS (${exhibitorRows.length})`, exhibitorRows);
    }
  }

  // Section 6: Sponsors
  if (modules.sponsors !== false) {
    const sponsorRows = [];
    reports.forEach(rep => {
      const e = rep.expo || rep;
      (rep.sponsors || []).forEach(sp => {
        sponsorRows.push({
          '#': sponsorRows.length + 1,
          'Expo Title': e.title || '',
          'Sponsor Name': sp.name || '',
          'Tier': (sp.tier || 'Sponsor').toUpperCase(),
          'Website': sp.website || '',
          'Booth Number': sp.boothNumber || '',
          'Contact Person': sp.contactName || '',
          'Contact Email': sp.contactEmail || '',
          'Contact Phone': sp.contactPhone || ''
        });
      });
    });
    if (sponsorRows.length > 0 || isSingle) {
      appendSection(`SPONSORS & PARTNERS (${sponsorRows.length})`, sponsorRows);
    }
  }

  // Section 7: Orders & Tickets
  if (modules.orders !== false) {
    const orderRows = [];
    reports.forEach(rep => {
      const e = rep.expo || rep;
      (rep.orders || []).forEach(ord => {
        orderRows.push({
          '#': orderRows.length + 1,
          'Expo Title': e.title || '',
          'Order Number': ord.orderNumber || '',
          'Buyer Name': ord.buyer?.name || '',
          'Buyer Email': ord.buyer?.email || '',
          'Buyer Phone': ord.buyer?.phone || '',
          'Buyer Company': ord.buyer?.company || '',
          'Total Amount': ord.totalAmount ?? 0,
          'Currency': ord.currency || 'INR',
          'Status': (ord.status || 'pending').toUpperCase(),
          'Payment Method': ord.paymentMethod || 'Online',
          'Order Date': formatDateTime(ord.createdAt)
        });
      });
    });
    if (orderRows.length > 0 || isSingle) {
      appendSection(`TICKET ORDERS & REVENUE (${orderRows.length})`, orderRows);
    }
  }

  // Section 8: Campaigns
  if (modules.campaigns !== false) {
    const campaignRows = [];
    reports.forEach(rep => {
      const e = rep.expo || rep;
      (rep.campaigns || []).forEach(cmp => {
        campaignRows.push({
          '#': campaignRows.length + 1,
          'Expo Title': e.title || '',
          'Campaign Title': cmp.title || '',
          'Channel': (cmp.channel || 'email').toUpperCase(),
          'Status': (cmp.status || 'draft').toUpperCase(),
          'Sent Count': cmp.sentCount || 0,
          'Delivered Count': cmp.deliveredCount || 0,
          'Open Count': cmp.openCount || 0,
          'Click Count': cmp.clickCount || 0,
          'Date': formatDateTime(cmp.sentAt || cmp.createdAt)
        });
      });
    });
    if (campaignRows.length > 0 || isSingle) {
      appendSection(`MARKETING CAMPAIGNS (${campaignRows.length})`, campaignRows);
    }
  }

  const csvString = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const defaultName = isSingle
    ? `VisitExpo_Report_${sanitizeFileSlug(reports[0]?.expo?.title || reports[0]?.title)}_${dateStamp}.csv`
    : `VisitExpo_Expos_Report_${reports.length}_Expos_${dateStamp}.csv`;

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', customFileName || defaultName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  return true;
}

/**
 * 3. Generate & Print/Save Official A4 PDF Report for 1 or more Expos
 */
export function exportExpoReportsToPDF(reports = [], modules = {}) {
  if (!Array.isArray(reports) || reports.length === 0) return false;

  const isSingle = reports.length === 1;
  const printTimestamp = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Aggregate totals across selected reports
  const totals = reports.reduce(
    (acc, r) => {
      const m = r.metrics || r.expo?.metrics || {};
      acc.visitors += m.visitorsCount || 0;
      acc.checkedIn += m.checkedInCount || 0;
      acc.attendees += m.attendeesCount || 0;
      acc.leads += m.leadsCount || 0;
      acc.exhibitors += m.exhibitorsCount || 0;
      acc.sponsors += m.sponsorsCount || 0;
      acc.orders += m.ordersCount || 0;
      acc.revenue += m.ticketRevenue || 0;
      return acc;
    },
    { visitors: 0, checkedIn: 0, attendees: 0, leads: 0, exhibitors: 0, sponsors: 0, orders: 0, revenue: 0 }
  );

  const renderSingleExpoDossier = (rep, idx, totalExpos) => {
    const e = rep.expo || rep;
    const m = rep.metrics || e.metrics || {};
    const visitors = rep.visitors || [];
    const attendees = rep.attendees || [];
    const leads = rep.leads || [];
    const exhibitors = rep.exhibitors || [];
    const sponsors = rep.sponsors || [];
    const orders = rep.orders || [];
    const campaigns = rep.campaigns || [];

    return `
      <div class="expo-dossier ${idx > 0 ? 'page-break-before' : ''}">
        <div class="expo-banner-title">
          <div>
            <span class="expo-badge">${escapeHtml(e.category || 'Exhibition')}</span>
            <span class="expo-badge status-${escapeHtml((e.status || 'published').toLowerCase())}">${escapeHtml((e.status || 'published').toUpperCase())}</span>
            ${e.isClaimed ? '<span class="expo-badge claimed">CLAIMED</span>' : ''}
            <h2 class="expo-title">${escapeHtml(e.title || 'Untitled Exhibition')}</h2>
            <div class="expo-subtitle">
              ${escapeHtml(e.venue || 'Exhibition Venue')} • ${escapeHtml(e.city || 'India')}, ${escapeHtml(e.country || 'India')}
              &nbsp;|&nbsp; ${escapeHtml(formatDate(e.startDate))} – ${escapeHtml(formatDate(e.endDate))}
            </div>
          </div>
          <div class="expo-index-tag">Expo ${idx + 1} of ${totalExpos}</div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Registered Visitors</div>
            <div class="kpi-val">${m.visitorsCount || 0}</div>
            <div class="kpi-sub">${m.checkedInCount || 0} Checked In</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Attendees &amp; Followers</div>
            <div class="kpi-val">${m.attendeesCount || 0}</div>
            <div class="kpi-sub">${m.interestedCount || 0} Interested • ${m.followersCount || 0} Following</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">CRM Buyer Leads</div>
            <div class="kpi-val">${m.leadsCount || 0}</div>
            <div class="kpi-sub">${m.qualifiedLeadsCount || 0} Qualified / Won</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Exhibitors &amp; Sponsors</div>
            <div class="kpi-val">${m.exhibitorsCount || 0}</div>
            <div class="kpi-sub">${m.sponsorsCount || 0} Official Sponsors</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Ticket Orders &amp; Revenue</div>
            <div class="kpi-val">₹${(m.ticketRevenue || 0).toLocaleString('en-IN')}</div>
            <div class="kpi-sub">${m.ordersCount || 0} Orders • ${m.ticketsSoldCount || 0} Passes</div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <div class="info-box-title">Expo &amp; Venue Information</div>
            <div class="info-row"><span class="info-label">Slug / ID:</span><span class="info-value">${escapeHtml(e.slug || String(e._id || ''))}</span></div>
            <div class="info-row"><span class="info-label">Format:</span><span class="info-value">${escapeHtml((e.eventType || 'hybrid').toUpperCase())}</span></div>
            <div class="info-row"><span class="info-label">Timings:</span><span class="info-value">${escapeHtml(e.timings || '09:00 AM - 06:00 PM')}</span></div>
            <div class="info-row"><span class="info-label">Ticketing:</span><span class="info-value">${e.isFreeEvent !== false ? 'Free Registration' : `Paid (${escapeHtml(e.currency || 'INR')} ${e.paidTicketPrice || 0})`}</span></div>
          </div>
          <div class="info-box">
            <div class="info-box-title">Organizer Contact Details</div>
            <div class="info-row"><span class="info-label">Organizer:</span><span class="info-value">${escapeHtml(e.orgName || 'VisitExpo Verified Organizer')}</span></div>
            <div class="info-row"><span class="info-label">Email:</span><span class="info-value">${escapeHtml(e.orgEmail || 'N/A')}</span></div>
            <div class="info-row"><span class="info-label">Phone:</span><span class="info-value">${escapeHtml(e.orgPhone || 'N/A')}</span></div>
            <div class="info-row"><span class="info-label">Website:</span><span class="info-value">${escapeHtml(e.website || e.orgWebsite || e.wpUrl || 'N/A')}</span></div>
          </div>
        </div>

        ${
          modules.visitors !== false && visitors.length > 0
            ? `
          <div class="section-block">
            <div class="section-header">Registered Visitors &amp; Passes (${visitors.length})</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 28px;">#</th>
                  <th>Visitor Name</th>
                  <th>Email &amp; Phone</th>
                  <th>Company &amp; Role</th>
                  <th>Type</th>
                  <th>Check-In Status</th>
                  <th>Registered On</th>
                </tr>
              </thead>
              <tbody>
                ${visitors
                  .slice(0, 250)
                  .map(
                    (v, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td><strong>${escapeHtml(v.name || '')}</strong></td>
                    <td>${escapeHtml(v.email || '')}<br/><span class="muted">${escapeHtml(v.phone || '')}</span></td>
                    <td>${escapeHtml(v.company || '—')}<br/><span class="muted">${escapeHtml(v.designation || '')}</span></td>
                    <td>${escapeHtml((v.attendanceType || 'in_person').toUpperCase())}</td>
                    <td>${v.checkInStatus === 'checked_in' ? '<span class="badge-green">CHECKED IN</span>' : '<span class="badge-gray">REGISTERED</span>'}</td>
                    <td>${escapeHtml(formatDate(v.createdAt))}</td>
                  </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </div>`
            : ''
        }

        ${
          modules.attendees !== false && attendees.length > 0
            ? `
          <div class="section-block">
            <div class="section-header">Interested Attendees &amp; Event Followers (${attendees.length})</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 28px;">#</th>
                  <th>Name</th>
                  <th>Email &amp; Phone</th>
                  <th>Company &amp; Designation</th>
                  <th>City / Country</th>
                  <th>Engagement</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${attendees
                  .slice(0, 250)
                  .map(
                    (att, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td><strong>${escapeHtml(att.userName || '')}</strong></td>
                    <td>${escapeHtml(att.userEmail || '')}<br/><span class="muted">${escapeHtml(att.userPhone || '')}</span></td>
                    <td>${escapeHtml(att.userCompany || '—')}<br/><span class="muted">${escapeHtml(att.userDesignation || '')}</span></td>
                    <td>${escapeHtml(att.userCity || '')} ${escapeHtml(att.userCountry || 'India')}</td>
                    <td><span class="badge-amber">${escapeHtml((att.type || 'interested').toUpperCase())}</span></td>
                    <td>${escapeHtml(formatDate(att.createdAt))}</td>
                  </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </div>`
            : ''
        }

        ${
          modules.leads !== false && leads.length > 0
            ? `
          <div class="section-block">
            <div class="section-header">CRM Buyer Leads (${leads.length})</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 28px;">#</th>
                  <th>Lead Name</th>
                  <th>Email &amp; Phone</th>
                  <th>Company</th>
                  <th>Score</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${leads
                  .slice(0, 250)
                  .map(
                    (ld, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td><strong>${escapeHtml(ld.name || '')}</strong></td>
                    <td>${escapeHtml(ld.email || '')}<br/><span class="muted">${escapeHtml(ld.phone || '')}</span></td>
                    <td>${escapeHtml(ld.company || '—')}<br/><span class="muted">${escapeHtml(ld.designation || '')}</span></td>
                    <td><strong>${ld.leadScore ?? 0}</strong></td>
                    <td>${escapeHtml(ld.source || 'website')}</td>
                    <td><span class="badge-green">${escapeHtml((ld.status || 'new').toUpperCase())}</span></td>
                    <td>${escapeHtml(formatDate(ld.createdAt))}</td>
                  </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </div>`
            : ''
        }

        ${
          modules.exhibitors !== false && exhibitors.length > 0
            ? `
          <div class="section-block">
            <div class="section-header">Exhibitors &amp; Booth Allocations (${exhibitors.length})</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 28px;">#</th>
                  <th>Company Name</th>
                  <th>Booth #</th>
                  <th>Contact Email &amp; Phone</th>
                  <th>Website</th>
                  <th>Mode</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${exhibitors
                  .slice(0, 250)
                  .map(
                    (ex, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td><strong>${escapeHtml(ex.name || '')}</strong></td>
                    <td><strong>${escapeHtml(ex.boothNumber || 'TBD')}</strong></td>
                    <td>${escapeHtml(ex.contactEmail || '—')}<br/><span class="muted">${escapeHtml(ex.contactPhone || '')}</span></td>
                    <td>${escapeHtml(ex.website || '—')}</td>
                    <td>${escapeHtml((ex.attendanceType || 'in_person').toUpperCase())}</td>
                    <td><span class="badge-green">${escapeHtml((ex.status || 'approved').toUpperCase())}</span></td>
                  </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </div>`
            : ''
        }

        ${
          modules.sponsors !== false && sponsors.length > 0
            ? `
          <div class="section-block">
            <div class="section-header">Official Sponsors &amp; Partners (${sponsors.length})</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 28px;">#</th>
                  <th>Sponsor Name</th>
                  <th>Tier</th>
                  <th>Website</th>
                  <th>Booth Details</th>
                  <th>Contact Person</th>
                </tr>
              </thead>
              <tbody>
                ${sponsors
                  .map(
                    (sp, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td><strong>${escapeHtml(sp.name || '')}</strong></td>
                    <td><span class="badge-amber">${escapeHtml((sp.tier || 'Sponsor').toUpperCase())}</span></td>
                    <td>${escapeHtml(sp.website || '—')}</td>
                    <td>${escapeHtml(sp.boothNumber || '—')} ${sp.boothSize ? `(${escapeHtml(sp.boothSize)})` : ''}</td>
                    <td>${escapeHtml(sp.contactName || '—')} ${sp.contactEmail ? `• ${escapeHtml(sp.contactEmail)}` : ''}</td>
                  </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </div>`
            : ''
        }

        ${
          modules.orders !== false && orders.length > 0
            ? `
          <div class="section-block">
            <div class="section-header">Ticket Orders &amp; Registrations (${orders.length})</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 28px;">#</th>
                  <th>Order #</th>
                  <th>Buyer Name &amp; Email</th>
                  <th>Company</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${orders
                  .slice(0, 200)
                  .map(
                    (ord, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td><strong>${escapeHtml(ord.orderNumber || '')}</strong></td>
                    <td>${escapeHtml(ord.buyer?.name || '')}<br/><span class="muted">${escapeHtml(ord.buyer?.email || '')}</span></td>
                    <td>${escapeHtml(ord.buyer?.company || '—')}</td>
                    <td><strong>${escapeHtml(ord.currency || 'INR')} ${(ord.totalAmount || 0).toLocaleString('en-IN')}</strong></td>
                    <td><span class="badge-green">${escapeHtml((ord.status || 'completed').toUpperCase())}</span></td>
                    <td>${escapeHtml(formatDate(ord.createdAt))}</td>
                  </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </div>`
            : ''
        }

        ${
          modules.campaigns !== false && campaigns.length > 0
            ? `
          <div class="section-block">
            <div class="section-header">Marketing &amp; Email Campaigns (${campaigns.length})</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 28px;">#</th>
                  <th>Campaign Title</th>
                  <th>Channel</th>
                  <th>Sent / Delivered</th>
                  <th>Opens / Clicks</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${campaigns
                  .map(
                    (cmp, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td><strong>${escapeHtml(cmp.title || '')}</strong></td>
                    <td>${escapeHtml((cmp.channel || 'email').toUpperCase())}</td>
                    <td>${cmp.sentCount || 0} / ${cmp.deliveredCount || 0}</td>
                    <td>${cmp.openCount || 0} / ${cmp.clickCount || 0}</td>
                    <td>${escapeHtml((cmp.status || 'draft').toUpperCase())}</td>
                    <td>${escapeHtml(formatDate(cmp.sentAt || cmp.createdAt))}</td>
                  </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </div>`
            : ''
        }
      </div>
    `;
  };

  const PDF_MASTER_ROW_LIMIT = 500;
  const masterTableReports = !isSingle
    ? [...reports]
        .sort((a, b) => {
          const ma = a.metrics || a.expo?.metrics || {};
          const mb = b.metrics || b.expo?.metrics || {};
          return (mb.totalRecords || 0) - (ma.totalRecords || 0);
        })
        .slice(0, PDF_MASTER_ROW_LIMIT)
    : [];

  const dossierReports = isSingle
    ? reports
    : reports.length <= 25
    ? reports
    : reports
        .filter((r) => {
          const m = r.metrics || r.expo?.metrics || {};
          return (
            (m.visitorsCount || 0) +
              (m.attendeesCount || 0) +
              (m.leadsCount || 0) +
              (m.exhibitorsCount || 0) +
              (m.ordersCount || 0) +
              (m.campaignsCount || 0) >
            0
          );
        })
        .slice(0, 30);

  const masterTableHtml = !isSingle
    ? `
      <div class="section-block" style="margin-bottom: 18px;">
        <div class="section-header">Selected Expos Master Summary (${
          reports.length > PDF_MASTER_ROW_LIMIT
            ? `Top ${PDF_MASTER_ROW_LIMIT} of ${reports.length} Exhibitions by Activity`
            : `${reports.length} Exhibitions`
        })</div>
        <table>
          <thead>
            <tr>
              <th style="width: 26px;">#</th>
              <th>Expo Title</th>
              <th>Category</th>
              <th>City &amp; Venue</th>
              <th>Dates</th>
              <th>Organizer</th>
              <th style="text-align: center;">Visitors</th>
              <th style="text-align: center;">Attendees</th>
              <th style="text-align: center;">Leads</th>
              <th style="text-align: center;">Exhibitors</th>
              <th style="text-align: right;">Revenue</th>
            </tr>
          </thead>
          <tbody>
            ${masterTableReports
              .map((r, i) => {
                const e = r.expo || r;
                const m = r.metrics || e.metrics || {};
                return `
                  <tr>
                    <td>${i + 1}</td>
                    <td><strong>${escapeHtml(e.title || '')}</strong><br/><span class="muted">${escapeHtml((e.status || 'published').toUpperCase())}</span></td>
                    <td>${escapeHtml(e.category || 'Trade Show')}</td>
                    <td><strong>${escapeHtml(e.city || 'India')}</strong><br/><span class="muted">${escapeHtml((e.venue || '').slice(0, 45))}</span></td>
                    <td>${escapeHtml(formatDate(e.startDate))}</td>
                    <td>${escapeHtml(e.orgName || 'Verified Organizer')}</td>
                    <td style="text-align: center; font-weight: 700;">${m.visitorsCount || 0}</td>
                    <td style="text-align: center; font-weight: 700;">${m.attendeesCount || 0}</td>
                    <td style="text-align: center; font-weight: 700;">${m.leadsCount || 0}</td>
                    <td style="text-align: center; font-weight: 700;">${m.exhibitorsCount || 0}</td>
                    <td style="text-align: right; font-weight: 700;">₹${(m.ticketRevenue || 0).toLocaleString('en-IN')}</td>
                  </tr>`;
              })
              .join('')}
          </tbody>
        </table>
        ${
          reports.length > PDF_MASTER_ROW_LIMIT
            ? `<div style="margin-top: 6px; padding: 6px 10px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 8.5px; color: #475569;">
                <strong>Note:</strong> All <strong>${reports.length}</strong> selected exhibitions are included in the KPI totals above. To keep PDF print pagination fast, the table above displays the top ${PDF_MASTER_ROW_LIMIT} expos ranked by activity. Use <strong>Excel (.xlsx)</strong> or <strong>CSV (.csv)</strong> export for the complete ${reports.length}-row dataset.
              </div>`
            : ''
        }
      </div>
    `
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${isSingle ? escapeHtml(reports[0]?.expo?.title || 'Expo Report') : `VisitExpo Master Report (${reports.length} Expos)`}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 10px;
      line-height: 1.4;
    }
    .report-container {
      width: 100%;
      max-width: 820px;
      margin: 0 auto;
    }
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 14px;
    }
    .brand-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-mark {
      width: 30px;
      height: 30px;
      background: #0f172a;
      color: #facc15;
      font-weight: 900;
      font-size: 17px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .brand-name {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.4px;
    }
    .brand-tagline {
      font-size: 8.5px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .doc-meta {
      text-align: right;
    }
    .doc-type {
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      color: #0f172a;
    }
    .doc-sub {
      font-size: 9px;
      color: #64748b;
      margin-top: 2px;
    }
    .expo-banner-title {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #f59e0b;
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 10px;
    }
    .expo-title {
      font-size: 14px;
      font-weight: 800;
      margin: 4px 0 2px 0;
      color: #0f172a;
    }
    .expo-subtitle {
      font-size: 9.5px;
      color: #475569;
    }
    .expo-badge {
      display: inline-block;
      padding: 1.5px 7px;
      border-radius: 999px;
      font-size: 8px;
      font-weight: 800;
      text-transform: uppercase;
      background: #fef3c7;
      color: #b45309;
      margin-right: 4px;
    }
    .expo-badge.status-published {
      background: #dcfce7;
      color: #15803d;
    }
    .expo-badge.claimed {
      background: #dbeafe;
      color: #1d4ed8;
    }
    .expo-index-tag {
      font-size: 8.5px;
      font-weight: 700;
      color: #64748b;
      background: #e2e8f0;
      padding: 3px 8px;
      border-radius: 4px;
      white-space: nowrap;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
      margin-bottom: 10px;
    }
    .kpi-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 7px 9px;
      background: #ffffff;
    }
    .kpi-label {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
    }
    .kpi-val {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 2px;
    }
    .kpi-sub {
      font-size: 8px;
      color: #64748b;
      margin-top: 1px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 12px;
    }
    .info-box {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 10px;
    }
    .info-box-title {
      font-size: 8.5px;
      font-weight: 800;
      text-transform: uppercase;
      color: #475569;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 4px;
      margin-bottom: 5px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
      font-size: 9px;
    }
    .info-label {
      color: #64748b;
    }
    .info-value {
      font-weight: 600;
      color: #0f172a;
      text-align: right;
      max-width: 68%;
      word-break: break-word;
    }
    .section-block {
      margin-bottom: 12px;
      page-break-inside: auto;
    }
    .section-header {
      background: #0f172a;
      color: #ffffff;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 5px 10px;
      border-radius: 5px 5px 0 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #cbd5e1;
      border-top: none;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-size: 8px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 5px 7px;
      border-bottom: 1px solid #cbd5e1;
      text-align: left;
    }
    td {
      padding: 5px 7px;
      font-size: 8.5px;
      border-bottom: 1px solid #e2e8f0;
      color: #1e293b;
      vertical-align: top;
    }
    tr {
      page-break-inside: avoid;
    }
    .muted {
      color: #64748b;
      font-size: 8px;
    }
    .badge-green {
      display: inline-block;
      background: #dcfce7;
      color: #166534;
      font-weight: 700;
      font-size: 7.5px;
      padding: 1px 5px;
      border-radius: 4px;
    }
    .badge-amber {
      display: inline-block;
      background: #fef3c7;
      color: #92400e;
      font-weight: 700;
      font-size: 7.5px;
      padding: 1px 5px;
      border-radius: 4px;
    }
    .badge-gray {
      display: inline-block;
      background: #f1f5f9;
      color: #475569;
      font-weight: 700;
      font-size: 7.5px;
      padding: 1px 5px;
      border-radius: 4px;
    }
    .page-break-before {
      page-break-before: always;
      margin-top: 14px;
    }
    .report-footer {
      border-top: 1px solid #cbd5e1;
      margin-top: 16px;
      padding-top: 6px;
      display: flex;
      justify-content: space-between;
      font-size: 8px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="report-header">
      <div class="brand-row">
        <div class="brand-mark">V</div>
        <div>
          <div class="brand-name">VisitExpo Admin</div>
          <div class="brand-tagline">Official Exhibition Intelligence &amp; Data Dossier</div>
        </div>
      </div>
      <div class="doc-meta">
        <div class="doc-type">${isSingle ? 'Single Expo Data Report' : `Multi-Expo Data Report (${reports.length} Expos)`}</div>
        <div class="doc-sub">Generated: ${escapeHtml(printTimestamp)} • www.visitexpo.in</div>
      </div>
    </div>

    ${
      !isSingle
        ? `
      <div class="kpi-grid" style="margin-bottom: 14px;">
        <div class="kpi-card">
          <div class="kpi-label">Selected Expos</div>
          <div class="kpi-val">${reports.length}</div>
          <div class="kpi-sub">Included in Dossier</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Total Visitors</div>
          <div class="kpi-val">${totals.visitors}</div>
          <div class="kpi-sub">${totals.checkedIn} Checked In</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Interested &amp; Followers</div>
          <div class="kpi-val">${totals.attendees}</div>
          <div class="kpi-sub">Engaged Audience</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">CRM Buyer Leads</div>
          <div class="kpi-val">${totals.leads}</div>
          <div class="kpi-sub">${totals.exhibitors} Exhibitors</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Total Revenue</div>
          <div class="kpi-val">₹${totals.revenue.toLocaleString('en-IN')}</div>
          <div class="kpi-sub">${totals.orders} Ticket Orders</div>
        </div>
      </div>
    `
        : ''
    }

    ${masterTableHtml}

    ${dossierReports.map((rep, idx) => renderSingleExpoDossier(rep, idx, dossierReports.length)).join('')}

    <div class="report-footer">
      <div>VisitExpo Platform • Super Admin Reporting Engine</div>
      <div>Exported: ${escapeHtml(printTimestamp)}</div>
      <div>Confidential Administrative Record</div>
    </div>
  </div>
</body>
</html>`;

  const frameId = 'visitexpo-admin-expo-report-print-frame';
  let iframe = document.getElementById(frameId);
  if (iframe) iframe.remove();

  iframe = document.createElement('iframe');
  iframe.id = frameId;
  iframe.style.position = 'fixed';
  iframe.style.top = '-10000px';
  iframe.style.left = '-10000px';
  iframe.style.width = '210mm';
  iframe.style.height = '297mm';
  iframe.style.border = 'none';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (err) {
      console.warn('Iframe print error, falling back to new window:', err);
      const printWin = window.open('', '_blank', 'width=900,height=950');
      if (printWin) {
        printWin.document.open();
        printWin.document.write(html);
        printWin.document.close();
        printWin.focus();
        printWin.print();
      }
    }
  }, 300);

  return true;
}

