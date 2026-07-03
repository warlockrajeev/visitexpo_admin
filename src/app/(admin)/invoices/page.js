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
  AlertCircle
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function InvoicesPage() {
  const { accessToken } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search
  const [searchTerm, setSearchTerm] = useState('');

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
          Inspect invoices generated across system checkouts and subscriptions.
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
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredInvoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-foreground text-xs uppercase">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4 font-semibold text-foreground">{inv.organization?.name || 'Platform Purchase'}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(inv.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 font-bold font-mono text-foreground">
                      ₹{inv.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium uppercase ${
                        inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => alert('Mocking PDF download trigger.')}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary border border-border px-3 py-1.5 rounded-lg shadow-sm"
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
    </div>
  );
}
