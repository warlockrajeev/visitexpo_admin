'use client';

/**
 * @file page.js (Super Admin Settings)
 * @description Operational variables console for platform configurations, CMS themes, and simulated database backups.
 */

import React, { useState } from 'react';
import {
  Settings,
  Database,
  Globe,
  Save,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Terminal
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [saveSuccess, setSaveSuccess] = useState('');
  const [backingUp, setBackingUp] = useState(false);
  
  // CMS state
  const [cmsForm, setCmsForm] = useState({
    title: 'VisitExpo System Administration Portal',
    supportEmail: 'system-support@visitexpo.in',
    accentColor: 'indigo',
    maintenanceMode: false
  });

  const handleCmsSubmit = (e) => {
    e.preventDefault();
    setSaveSuccess('Global settings updated successfully!');
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  const triggerBackup = () => {
    setBackingUp(true);
    setTimeout(() => {
      setBackingUp(false);
      alert('Database Snapshot Backup completed successfully!\nFilename: visitexpo_backup_snapshot.gz');
    }, 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header banner */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" /> System Configurations
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Adjust corporate parameters, modify CMS settings, and trigger database maintenance snapshots.
        </p>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-500">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Main Configurations grid */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Left Side: CMS Form */}
        <div className="md:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-foreground pb-2 border-b border-border flex items-center gap-1.5">
            <Sliders className="h-5 w-5 text-primary" /> CMS Parameters
          </h3>

          <form onSubmit={handleCmsSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Platform Title</label>
              <input
                type="text"
                required
                value={cmsForm.title}
                onChange={(e) => setCmsForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">System Support Email</label>
                <input
                  type="email"
                  required
                  value={cmsForm.supportEmail}
                  onChange={(e) => setCmsForm(prev => ({ ...prev, supportEmail: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Brand Accent Color</label>
                <select
                  value={cmsForm.accentColor}
                  onChange={(e) => setCmsForm(prev => ({ ...prev, accentColor: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                >
                  <option value="indigo">Indigo Accent</option>
                  <option value="violet">Violet Accent</option>
                  <option value="red">Red Accent</option>
                  <option value="zinc">Zinc Slate Accent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={cmsForm.maintenanceMode}
                  onChange={(e) => setCmsForm(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                  className="h-4.5 w-4.5 rounded border-border bg-background text-primary focus:ring-2 focus:ring-primary"
                />
                <span className="text-sm font-semibold text-foreground">Enable Platform Maintenance Mode</span>
              </label>
              <p className="text-[10px] text-muted-foreground mt-1">If enabled, client organization dashboard portals will block logins and display a maintenance screen.</p>
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
            >
              <Save className="h-4.5 w-4.5" /> Save CMS Changes
            </button>
          </form>
        </div>

        {/* Right Side: Maintenance tools */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground pb-2 border-b border-border flex items-center gap-1.5">
              <Database className="h-5 w-5 text-primary" /> Maintenance Tasks
            </h3>

            <div className="space-y-2 bg-muted/20 border border-border rounded-xl p-4 text-xs">
              <h4 className="font-bold text-foreground flex items-center gap-1.5 uppercase"><Terminal className="h-4 w-4 text-primary" /> Database Snapshots</h4>
              <p className="text-muted-foreground leading-relaxed">
                Manually dump local collections and archive MongoDB state. Snapshots will be logged inside the secure root platform filesystem.
              </p>
            </div>
          </div>

          <button
            onClick={triggerBackup}
            disabled={backingUp}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-secondary hover:bg-secondary/80 border border-border py-2.5 text-sm font-semibold text-foreground transition-all shadow-sm"
          >
            {backingUp ? (
              <>
                <RefreshCw className="h-4.5 w-4.5 animate-spin" /> Archiving...
              </>
            ) : (
              <>
                <Database className="h-4.5 w-4.5 text-primary" /> Trigger Backup Dump
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
