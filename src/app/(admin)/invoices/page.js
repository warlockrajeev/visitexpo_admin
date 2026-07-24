'use client';

/**
 * @file page.js (Invoices Directory)
 * @description Super Admin platform-wide billing invoice search and financials log.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  FileText,
  Search,
  Loader2,
  DollarSign,
  Receipt,
  Download,
  AlertCircle,
  X,
  Eye,
  Printer,
  Building,
  CreditCard,
  User,
  Mail
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function InvoicesPage() {
  const { accessToken } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Modal State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!accessToken) return;
      try {
        const res = await axios.get(`${API_URL}/admin/invoices`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.data && res.data.success) {
          setInvoices(res.data.data || []);
        }
      } catch (err) {
        console.error('Fetch invoices failed', err);
        setError('Could not retrieve global financials ledger.');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [accessToken]);

  const filteredInvoices = invoices.filter(inv => {
    const orgName = inv.organization?.name?.toLowerCase() || '';
    const number = inv.invoiceNumber?.toLowerCase() || '';
    return orgName.includes(searchTerm.toLowerCase()) || number.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header panel */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" /> Financials Ledger
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Inspect invoices generated across system checkouts and subscriptions. Click any row to view full details.
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex bg-card p-4 rounded-xl border border-border">
        <div className="relative flex-1 md:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search invoice number or organization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Grid of invoices */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Fetching ledger invoices...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center text-muted-foreground gap-3">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <h3 className="font-semibold text-foreground">Failed to Load</h3>
            <p className="text-sm max-w-md">{error}</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="py-24 text-center text-muted-foreground">
            <Receipt className="h-12 w-12 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs font-semibold">No invoices match criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Associated Organization</th>
                  <th className="px-6 py-4">Billing Date</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Payment Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredInvoices.map((inv) => (
                  <tr 
                    key={inv._id} 
                    onClick={() => setSelectedInvoice(inv)}
                    className="hover:bg-primary/5 transition-colors cursor-pointer group"
                    title="Click to view full invoice & payment details"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-foreground text-xs uppercase group-hover:text-primary transition-colors">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground">{inv.organization?.name || 'Platform Purchase'}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(inv.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 font-bold font-mono text-foreground">
                      ₹{inv.amount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium uppercase ${
                        inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInvoice(inv);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" /> Details
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          alert('Downloading PDF Invoice document...');
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary border border-border px-3 py-1.5 rounded-lg shadow-2xs"
                      >
                        <Download className="h-3.5 w-3.5" /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice / Order Details Popup Modal */}
      {selectedInvoice && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedInvoice(null)}
        >
          <div 
            className="bg-card border border-border rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-foreground font-mono uppercase">
                      {selectedInvoice.invoiceNumber}
                    </h3>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide border ${
                      selectedInvoice.status === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                    }`}>
                      {selectedInvoice.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Billed on {new Date(selectedInvoice.createdAt).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Organization & Billing Details */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 rounded-xl border border-border bg-background space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-primary" /> Organization
                  </h4>
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-foreground text-sm">{selectedInvoice.organization?.name || 'Platform Account'}</p>
                    <p className="text-muted-foreground flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground/70" /> {selectedInvoice.organization?.email || 'billing@visitexpo.com'}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border bg-background space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-primary" /> Payment Method
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-semibold text-foreground capitalize">{selectedInvoice.paymentMethod || 'Razorpay / Card'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-semibold text-emerald-500 uppercase">{selectedInvoice.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Amount Breakdown Box */}
              <div className="p-4 rounded-xl bg-muted/20 border border-border flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Invoice Amount</p>
                  <p className="text-xs text-muted-foreground">Inclusive of GST & Platform fees</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black font-mono text-primary">
                    ₹{selectedInvoice.amount?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground bg-background hover:bg-muted px-3.5 py-2 rounded-xl border border-border transition-colors cursor-pointer shadow-2xs"
              >
                <Printer className="h-4 w-4" /> Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="text-xs font-semibold text-white bg-primary hover:bg-primary/90 px-4.5 py-2 rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
