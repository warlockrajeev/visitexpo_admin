/**
 * @file printInvoice.js
 * @description Generates a high-quality, professional A4 text-based PDF/Print document for VisitExpo admin platform invoices.
 * Renders cleanly formatted, selectable text without dialog chrome, modal frames, or dark mode artifacts.
 */

function generateBarcodeSVG(code) {
  const cleanCode = (code || 'INVOICE').toUpperCase().replace(/[^A-Z0-9-]/g, '');
  const barHeight = 36;
  let x = 6;
  const bars = [];

  // Start guard bars
  bars.push(`<rect x="${x}" y="0" width="2.5" height="${barHeight}" fill="#0f172a"/>`);
  x += 4.5;
  bars.push(`<rect x="${x}" y="0" width="1.5" height="${barHeight}" fill="#0f172a"/>`);
  x += 3.5;

  for (let i = 0; i < cleanCode.length; i++) {
    const charCode = cleanCode.charCodeAt(i);
    const w1 = ((charCode % 3) + 1) * 1.1;
    const s1 = (((charCode >> 1) % 2) + 1) * 1.1;
    const w2 = (((charCode >> 2) % 3) + 1) * 1.1;
    const s2 = 1.6;

    bars.push(`<rect x="${x.toFixed(1)}" y="0" width="${w1.toFixed(1)}" height="${barHeight}" fill="#0f172a"/>`);
    x += w1 + s1;
    bars.push(`<rect x="${x.toFixed(1)}" y="0" width="${w2.toFixed(1)}" height="${barHeight}" fill="#0f172a"/>`);
    x += w2 + s2;
  }

  // End guard bars
  bars.push(`<rect x="${x.toFixed(1)}" y="0" width="1.5" height="${barHeight}" fill="#0f172a"/>`);
  x += 3.5;
  bars.push(`<rect x="${x.toFixed(1)}" y="0" width="2.5" height="${barHeight}" fill="#0f172a"/>`);
  x += 10;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.ceil(x)} ${barHeight}" style="height: 36px; max-width: 230px; width: 100%; display: block; margin: 0 auto;" preserveAspectRatio="none">${bars.join('')}</svg>`;
}

function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return String(dateStr);
  }
}

export function generateInvoiceHTML(invoice) {
  if (!invoice) return '';

  const invNum = invoice.invoiceNumber || `INV-${invoice._id?.slice(-8) || '0000'}`;
  const invDate = formatDateTime(invoice.createdAt);
  const isPaid = (invoice.status || '').toLowerCase() === 'paid';
  const orgName = invoice.organization?.name || 'Platform Account';
  const orgEmail = invoice.organization?.email || 'billing@visitexpo.com';
  const paymentMethod = invoice.paymentMethod || 'Razorpay / Card';
  const amount = Number(invoice.amount) || 0;
  const plan = invoice.plan || 'Organizer Enterprise Subscription';
  const billingCycle = invoice.billingCycle || 'Annual';

  const barcodeSvg = generateBarcodeSVG(invNum);
  const printTimestamp = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice-${invNum}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm 12mm 15mm;
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
      font-size: 11px;
      line-height: 1.4;
    }
    .receipt-container {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      padding: 0;
      background: #ffffff;
    }

    .receipt-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .brand-section {
      display: flex;
      flex-direction: column;
    }
    .brand-logo-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-mark {
      width: 32px;
      height: 32px;
      background: #0f172a;
      color: #facc15;
      font-weight: 900;
      font-size: 18px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      letter-spacing: -0.5px;
    }
    .brand-name {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .brand-tagline {
      font-size: 9px;
      font-weight: 600;
      color: #64748b;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-top: 1px;
    }
    .issuer-meta {
      font-size: 9.5px;
      color: #64748b;
      margin-top: 6px;
      line-height: 1.35;
    }
    .doc-meta {
      text-align: right;
    }
    .doc-type {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.3px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .order-number {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12.5px;
      font-weight: 700;
      color: #0f172a;
    }
    .order-date {
      font-size: 10px;
      color: #64748b;
      margin-top: 3px;
    }
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .status-completed {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }
    .status-pending {
      background: #fffbeb;
      color: #d97706;
      border: 1px solid #fde68a;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    .info-box {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 9px 12px;
      background: #ffffff;
    }
    .info-box-title {
      font-size: 9px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 4px;
      margin-bottom: 6px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 3.5px;
      font-size: 10px;
    }
    .info-row:last-child {
      margin-bottom: 0;
    }
    .info-label {
      color: #64748b;
    }
    .info-value {
      font-weight: 600;
      color: #0f172a;
      text-align: right;
    }
    .mono-val {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 9.5px;
    }

    .table-container {
      margin-bottom: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    th {
      background: #f8fafc;
      color: #475569;
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 7px 10px;
      border-bottom: 1px solid #cbd5e1;
    }
    td {
      padding: 7px 10px;
      font-size: 10px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }
    tr:last-child td {
      border-bottom: none;
    }

    .summary-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 14px;
      margin-bottom: 12px;
    }
    .barcode-block {
      flex: 1.1;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 9px 12px;
      background: #f8fafc;
    }
    .barcode-wrapper {
      text-align: center;
    }
    .barcode-text {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 10px;
      letter-spacing: 1.5px;
      color: #0f172a;
      text-align: center;
      margin-top: 4px;
      font-weight: 700;
    }
    .barcode-hint {
      font-size: 8.5px;
      color: #64748b;
      margin-top: 4px;
      line-height: 1.3;
      text-align: center;
    }
    .totals-block {
      flex: 0.9;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 9px 12px;
      background: #f8fafc;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 4px;
      font-size: 10px;
      color: #64748b;
    }
    .total-row.grand-total {
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px solid #cbd5e1;
      font-size: 11px;
      font-weight: 800;
      color: #0f172a;
    }
    .grand-total-amount {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 15px;
      font-weight: 900;
      color: #0f172a;
    }

    .terms-block {
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      margin-top: 8px;
    }
    .terms-title {
      font-size: 8.5px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }
    .terms-list {
      margin: 0;
      padding-left: 14px;
      color: #64748b;
      font-size: 8.5px;
      line-height: 1.35;
    }

    .receipt-footer {
      border-top: 1px solid #e2e8f0;
      margin-top: 8px;
      padding-top: 6px;
      display: flex;
      justify-content: space-between;
      font-size: 8px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="receipt-header">
      <div class="brand-section">
        <div class="brand-logo-row">
          <div class="brand-mark">V</div>
          <div>
            <div class="brand-name">VisitExpo</div>
            <div class="brand-tagline">Global Event & Exhibition Platform</div>
          </div>
        </div>
        <div class="issuer-meta">
          Official Tax Invoice & Platform Billing Statement<br/>
          www.visitexpo.in • billing@visitexpo.in
        </div>
      </div>
      <div class="doc-meta">
        <div class="doc-type">Tax Invoice</div>
        <div class="order-number">${invNum}</div>
        <div class="order-date">Billed: ${invDate}</div>
        <span class="status-badge ${isPaid ? 'status-completed' : 'status-pending'}">
          ${(invoice.status || 'PAID').toUpperCase()}
        </span>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-box">
        <div class="info-box-title">Billed To (Organization)</div>
        <div class="info-row">
          <span class="info-label">Organization:</span>
          <span class="info-value">${orgName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Billing Email:</span>
          <span class="info-value">${orgEmail}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Plan Tier:</span>
          <span class="info-value">${plan}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Billing Cycle:</span>
          <span class="info-value">${billingCycle}</span>
        </div>
      </div>

      <div class="info-box">
        <div class="info-box-title">Settlement & Payment Details</div>
        <div class="info-row">
          <span class="info-label">Payment Gateway:</span>
          <span class="info-value">${paymentMethod}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Invoice Status:</span>
          <span class="info-value" style="color: #059669; font-weight: 700;">${(invoice.status || 'Paid').toUpperCase()}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Currency:</span>
          <span class="info-value mono-val">INR (₹)</span>
        </div>
        <div class="info-row">
          <span class="info-label">Payment Terms:</span>
          <span class="info-value">Immediate Settlement</span>
        </div>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 35px; text-align: center;">#</th>
            <th>Service Description</th>
            <th style="width: 70px; text-align: center;">Period</th>
            <th style="width: 50px; text-align: center;">Qty</th>
            <th style="width: 110px; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 7px 10px; border-bottom: 1px solid #f1f5f9; text-align: center; color: #64748b;">1</td>
            <td style="padding: 7px 10px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #0f172a;">
              ${plan}
              <div style="font-size: 8.5px; font-weight: normal; color: #64748b; margin-top: 1px;">VisitExpo Platform Organizer Licensing & Service Package</div>
            </td>
            <td style="padding: 7px 10px; border-bottom: 1px solid #f1f5f9; text-align: center; color: #475569;">${billingCycle}</td>
            <td style="padding: 7px 10px; border-bottom: 1px solid #f1f5f9; text-align: center; font-family: monospace; font-weight: 700;">x1</td>
            <td style="padding: 7px 10px; border-bottom: 1px solid #f1f5f9; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;">₹${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="summary-section">
      <div class="barcode-block">
        <div class="section-label" style="text-align: center; margin-bottom: 6px; font-size: 8.5px; font-weight: 700; color: #64748b; text-transform: uppercase;">Digital Invoice Verification</div>
        <div class="barcode-wrapper">
          ${barcodeSvg}
          <div class="barcode-text">* ${invNum} *</div>
          <div class="barcode-hint">
            Digitally verified VisitExpo platform invoice. Retain this invoice for corporate accounting and tax filing purposes.
          </div>
        </div>
      </div>

      <div class="totals-block">
        <div class="section-label" style="font-size: 8.5px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Invoice Summary</div>
        <div class="total-row">
          <span>Net Subscription Amount:</span>
          <span style="font-family: monospace; font-weight: 600;">₹${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div class="total-row">
          <span>GST / Applicable Taxes:</span>
          <span style="font-family: monospace;">Inclusive (18%)</span>
        </div>
        <div class="total-row grand-total">
          <span>Total Paid Amount:</span>
          <span class="grand-total-amount">₹${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div style="font-size: 8px; color: #059669; text-align: right; margin-top: 3px; font-weight: 700;">
          Settled in Full • Zero Balance Due
        </div>
      </div>
    </div>

    <div class="terms-block">
      <div class="terms-title">Billing Terms & Compliance</div>
      <ol class="terms-list">
        <li><strong>Tax Compliance:</strong> All platform service fees are inclusive of statutory taxes where applicable.</li>
        <li><strong>Electronic Confirmation:</strong> This is a computer-generated tax invoice and requires no physical seal or signature.</li>
        <li><strong>Inquiries:</strong> For billing queries, write to accounts@visitexpo.in citing invoice reference <strong>${invNum}</strong>.</li>
      </ol>
    </div>

    <div class="receipt-footer">
      <div>VisitExpo Technologies • Corporate Finance Division</div>
      <div>Printed: ${printTimestamp}</div>
      <div>Invoice Ref: ${invoice._id || invNum} • Page 1 of 1</div>
    </div>
  </div>
</body>
</html>`;
}

export function printInvoiceDocument(invoice) {
  if (!invoice) return;

  const html = generateInvoiceHTML(invoice);
  const frameId = 'visitexpo-admin-invoice-print-frame';

  let iframe = document.getElementById(frameId);
  if (iframe) {
    iframe.remove();
  }

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
      console.warn('Iframe print error, falling back:', err);
      const printWin = window.open('', '_blank', 'width=850,height=900');
      if (printWin) {
        printWin.document.open();
        printWin.document.write(html);
        printWin.document.close();
        printWin.focus();
        printWin.print();
      }
    }
  }, 250);
}
