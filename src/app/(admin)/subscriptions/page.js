'use client';

/**
 * @file page.js (Subscriptions Tracking)
 * @description Super Admin subscription plans view page, tracking system MRR and subscriber aggregates.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  CreditCard,
  Check,
  TrendingUp,
  Users,
  Building,
  Loader2,
  DollarSign,
  Info
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function SubscriptionsPage() {
  const { accessToken } = useAuth();
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSubs = async () => {
      if (!accessToken) return;
      try {
        const res = await axios.get(`${API_URL}/admin/subscriptions`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.data && res.data.success) {
          setSubs(res.data.data || []);
        }
      } catch (err) {
        console.error('Fetch subscriptions failed', err);
        setError('Could not retrieve subscription logs.');
      } finally {
        setLoading(false);
      }
    };
    fetchSubs();
  }, [accessToken]);

  // Compute stats
  const activeCount = subs.filter(s => s.status === 'active').length;
  const freePlanCount = subs.filter(s => s.plan === 'free').length;
  const growthPlanCount = subs.filter(s => s.plan === 'growth').length;
  const enterpriseCount = subs.filter(s => s.plan === 'enterprise').length;

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary" /> Platform Subscriptions
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review subscription package activations, plans, and recurring MRR base.
        </p>
      </div>

      {/* Plans Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Active Plans', value: activeCount, desc: 'Currently active organizer accounts', color: 'text-emerald-500' },
          { title: 'Free Tier Accounts', value: freePlanCount, desc: 'Basic plan users limit', color: 'text-zinc-500' },
          { title: 'Growth Tier Accounts', value: growthPlanCount, desc: 'Mid-market organizers plan', color: 'text-primary' },
          { title: 'Enterprise VIP Accounts', value: enterpriseCount, desc: 'Enterprise corporations', color: 'text-violet-500' }
        ].map((kpi, idx) => (
          <div key={idx} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{kpi.title}</span>
            <div className="mt-2">
              <span className={`text-3xl font-extrabold tracking-tight ${kpi.color}`}>{kpi.value}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{kpi.desc}</p>
          </div>
        ))}
      </div>

      {/* Plans Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {[
          {
            name: 'Free Basic Tier',
            price: '₹0',
            duration: 'Forever Free',
            features: ['1 Live Event Schedule Limit', 'Max 100 Registrants Limit', 'Basic Leads CRM Tracker', 'Community Email Support'],
            color: 'border-zinc-800'
          },
          {
            name: 'Growth Plan',
            price: '₹14,999',
            duration: '/ month',
            features: ['Unlimited Live Events Scheduled', 'Max 2500 Registrants Limit', 'Full CRM pipeline, scores, followups', 'WhatsApp & Email Campaigns support', 'Dedicated Account Manager'],
            color: 'border-primary ring-2 ring-primary/20'
          },
          {
            name: 'Enterprise VIP',
            price: '₹49,999',
            duration: '/ month',
            features: ['Everything in Growth plan', 'Unlimited Registrants capacity', 'Custom branding portal configs', 'API Access Keys for plugins integration', '24/7 SLA Hotline Priority Support'],
            color: 'border-violet-500'
          }
        ].map((plan, idx) => (
          <div key={idx} className={`rounded-2xl border bg-card p-6 shadow-sm flex flex-col justify-between space-y-6 ${plan.color}`}>
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-lg text-foreground">{plan.name}</h4>
                <div className="mt-2 flex items-baseline gap-1 text-foreground">
                  <span className="text-3xl font-extrabold tracking-tight font-mono">{plan.price}</span>
                  <span className="text-xs text-muted-foreground">{plan.duration}</span>
                </div>
              </div>
              <ul className="space-y-2.5 text-xs text-muted-foreground border-t border-border pt-4">
                {plan.features.map((feat, fidx) => (
                  <li key={fidx} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Subscriber List logs */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-semibold text-foreground">Active Subscription Ledger</h3>
          <p className="text-xs text-muted-foreground">List of active plans linked to organizer organizations.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Fetching subscriptions...</p>
          </div>
        ) : subs.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Info className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs font-semibold">No subscriber logs found on platform.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-4">Organization Tenant</th>
                  <th className="px-6 py-4">Subscription Plan</th>
                  <th className="px-6 py-4">Billing Status</th>
                  <th className="px-6 py-4">Start Date</th>
                  <th className="px-6 py-4">Renewal Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subs.map((s) => (
                  <tr key={s._id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground">{s.organization?.name || 'Deleted Org'}</td>
                    <td className="px-6 py-4 capitalize font-semibold">{s.plan}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium uppercase ${
                        s.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(s.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(s.endDate).toLocaleDateString()}
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
