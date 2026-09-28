'use client';

/**
 * @file page.js (Rapid User Creation & Impersonation Console)
 * @description Super Admin tool for 1-click rapid generation of test & dummy users:
 *  - Organizers (creates active User + Organization)
 *  - Exhibitors (creates active User + Exhibitor Booth Organization)
 *  - Visitors (creates active Attendee Passholder)
 *  Features:
 *  - Single creation with customizable or 1-click randomized realistic data
 *  - Fast batch generator (5, 10, 20 users at once)
 *  - Instant "Login to Dashboard" button per user to redirect directly into their account dashboard
 *  - Real-time directory with search, filters, credentials inspector, and quick copy
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext.js';
import {
  Users,
  Building,
  Ticket,
  ExternalLink,
  Copy,
  Check,
  Search,
  RefreshCw,
  Loader2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  ShieldCheck,
  Building2,
  Layers,
  MapPin,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  Briefcase
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Realistic Dummy Data Pool for Instant Auto-fill
const FIRST_NAMES = [
  'Aarav', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ananya', 'Diya', 'Saanvi',
  'Rohit', 'Vikram', 'Pooja', 'Neha', 'Sunil', 'Kavita', 'Sanjay', 'Deepak', 'Meera',
  'Amit', 'Rahul', 'Rohan', 'Sneha', 'Tanvi', 'Karan', 'Manish', 'Alok', 'Preeti', 'Swati'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Mehta', 'Reddy', 'Nair', 'Iyer', 'Singhania', 'Gupta', 'Malhotra',
  'Chopra', 'Joshi', 'Bose', 'Deshmukh', 'Kulkarni', 'Agarwal', 'Bhatia', 'Kapoor', 'Rao', 'Das'
];

const CITIES = [
  'New Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai', 'Ahmedabad', 'Pune', 'Kolkata', 'Jaipur', 'Noida'
];

const ORGANIZER_ORGS = [
  'Apex Global Expos Pvt Ltd', 'Prime Trade Exhibitions Ltd', 'Horizon World Conventions',
  'Vanguard Expo Networks', 'Pinnacle Trade Fairs India', 'Zenith Trade Fairs & Media',
  'Spectrum Expo International', 'Nexus Global Summits Pvt Ltd', 'Quantum Trade Platforms'
];

const EXHIBITOR_COMPANIES = [
  'Tata Advanced Technologies', 'Godrej Precision Systems', 'Bharat Clean Energy Corp',
  'Infosys Digital Solutions', 'Reliance Industrial Automation', 'L&T Smart Infrastructure',
  'Mahindra Heavy Power', 'Sun Pharma Biosystems', 'Havells Electric Dynamics'
];

const DESIGNATIONS = [
  'Managing Director', 'Chief Executive Officer', 'Vice President - Business Development',
  'Chief Technology Officer', 'Head of Procurement', 'Global Exhibition Manager',
  'Lead Architect', 'Senior Marketing Director', 'Operations Lead'
];

const INDUSTRIES = [
  'Information Technology & Software', 'Industrial & Manufacturing', 'Automotive, EV & Clean Energy',
  'Healthcare, Pharma & Biotech', 'Building, Architecture & Real Estate', 'Food, Beverage & Hospitality',
  'Consumer Electronics & Retail'
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomUserData(role = 'organizer') {
  const first = getRandomItem(FIRST_NAMES);
  const last = getRandomItem(LAST_NAMES);
  const city = getRandomItem(CITIES);
  const suffix = Math.floor(1000 + Math.random() * 9000);
  const cleanFirst = first.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanLast = last.toLowerCase().replace(/[^a-z0-9]/g, '');

  let company = '';
  if (role === 'organizer') {
    company = getRandomItem(ORGANIZER_ORGS);
  } else if (role === 'exhibitor') {
    company = getRandomItem(EXHIBITOR_COMPANIES);
  } else {
    company = `${last} Enterprise Solutions`;
  }

  return {
    name: `${first} ${last}`,
    email: `${cleanFirst}.${cleanLast}.${suffix}@testexpo.in`,
    password: 'Test@1234',
    phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
    company,
    city,
    designation: getRandomItem(DESIGNATIONS),
    industry: getRandomItem(INDUSTRIES),
    website: `https://${cleanLast}expo.in`
  };
}

export default function RapidCreationPage() {
  const { accessToken } = useAuth();

  // Mode Selection
  const [creationMode, setCreationMode] = useState('single'); // 'single' | 'bulk'

  // Single Form State
  const [selectedRole, setSelectedRole] = useState('organizer');
  const [singleForm, setSingleForm] = useState(() => generateRandomUserData('organizer'));
  const [showPassword, setShowPassword] = useState(false);

  // Bulk Form State
  const [bulkRole, setBulkRole] = useState('organizer');
  const [bulkCount, setBulkCount] = useState(5);

  // Users Directory State
  const [users, setUsers] = useState([]);
  const [counts, setCounts] = useState({ organizers: 0, exhibitors: 0, visitors: 0, dummyUsers: 0 });
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [filterRole, setFilterRole] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Action Loading States
  const [creatingSingle, setCreatingSingle] = useState(false);
  const [creatingBulk, setCreatingBulk] = useState(false);
  const [impersonatingId, setImpersonatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Feedback Notification
  const [feedback, setFeedback] = useState(null);
  const [copiedKey, setCopiedKey] = useState('');

  // Sync random data when role changes in single mode
  const handleRoleTabChange = (newRole) => {
    setSelectedRole(newRole);
    setSingleForm(generateRandomUserData(newRole));
  };

  // 1-Click Randomize Button
  const handleRandomizeForm = () => {
    setSingleForm(generateRandomUserData(selectedRole));
    showFeedback('success', `Generated new realistic dummy data for ${selectedRole}!`);
  };

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const copyToClipboard = (text, key) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(String(text));
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 2000);
    } catch {
      // fallback
    }
  };

  // Fetch Users for Rapid Table
  const fetchRapidUsers = async () => {
    if (!accessToken) return;
    setLoadingUsers(true);
    try {
      const res = await axios.get(`${API_URL}/admin/rapid-users`, {
        params: { role: filterRole },
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data && res.data.success) {
        setUsers(res.data.users || []);
        if (res.data.counts) {
          setCounts(res.data.counts);
        }
      }
    } catch (err) {
      console.error('Fetch rapid users error:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchRapidUsers();
  }, [accessToken, filterRole]);

  // Create Single User
  const handleCreateSingle = async (andLoginDirectly = false) => {
    if (!singleForm.name.trim() || !singleForm.email.trim() || !singleForm.password) {
      showFeedback('error', 'Name, email, and password are required.');
      return;
    }

    setCreatingSingle(true);
    try {
      const res = await axios.post(
        `${API_URL}/admin/rapid-create`,
        {
          role: selectedRole,
          count: 1,
          name: singleForm.name,
          email: singleForm.email,
          password: singleForm.password,
          phone: singleForm.phone,
          company: singleForm.company,
          city: singleForm.city,
          designation: singleForm.designation,
          industry: singleForm.industry,
          website: singleForm.website
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (res.data && res.data.success) {
        const createdUser = res.data.users?.[0];
        showFeedback('success', `Created ${selectedRole} account: ${createdUser?.name} (${createdUser?.email})`);

        // Refresh user directory
        fetchRapidUsers();

        // If direct login was requested:
        if (andLoginDirectly && createdUser?._id) {
          handleImpersonateLogin(createdUser);
        }

        // Regenerate single form for next creation
        setSingleForm(generateRandomUserData(selectedRole));
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to create dummy user.');
    } finally {
      setCreatingSingle(false);
    }
  };

  // Create Bulk Users
  const handleCreateBulk = async (roleToUse, countToUse) => {
    const finalRole = roleToUse || bulkRole;
    const finalCount = countToUse || bulkCount;

    setCreatingBulk(true);
    try {
      const res = await axios.post(
        `${API_URL}/admin/rapid-create`,
        {
          role: finalRole,
          count: finalCount
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (res.data && res.data.success) {
        showFeedback('success', res.data.message || `Successfully generated ${finalCount} ${finalRole}s!`);
        fetchRapidUsers();
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to generate bulk dummy users.');
    } finally {
      setCreatingBulk(false);
    }
  };

  // Direct Impersonation Login
  const handleImpersonateLogin = async (user) => {
    if (!user?._id) return;
    setImpersonatingId(user._id);

    try {
      const res = await axios.post(
        `${API_URL}/admin/impersonate`,
        { userId: user._id },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (res.data && res.data.success && res.data.redirectUrl) {
        showFeedback('success', `Session transfer initiated for ${user.name}! Opening dashboard...`);
        // Open the user's dashboard in a new tab
        window.open(res.data.redirectUrl, '_blank');
      } else {
        showFeedback('error', res.data?.error || 'Failed to generate login link.');
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to initiate dashboard login.');
    } finally {
      setImpersonatingId(null);
    }
  };

  // Delete User
  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to delete test user "${userName}"?`)) return;
    setDeletingId(userId);

    try {
      const res = await axios.delete(`${API_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data && res.data.success) {
        showFeedback('success', `Deleted user ${userName}`);
        setUsers((prev) => prev.filter((u) => u._id !== userId));
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to delete user.');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    if (filterRole === 'dummy' && !u.email.endsWith('@testexpo.in')) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.company?.toLowerCase().includes(q) ||
      u.organization?.name?.toLowerCase().includes(q) ||
      u.city?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Top Header Banner */}
      <div className="bg-card p-6 md:p-8 rounded-3xl border border-border shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
            Rapid Creation &amp; Impersonation Engine
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Rapid User Creation
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
            Instantly spin up realistic dummy Organizers, Exhibitors, and Visitors with active verifications and organization profiles.
            Launch directly into any created user&apos;s account dashboard with 1-click seamless session transfer.
          </p>
        </div>

        {/* Global Stats Pill Bar */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <div className="p-3.5 rounded-2xl bg-secondary/60 border border-border min-w-[110px] text-center shadow-xs">
            <span className="block text-[11px] font-bold text-muted-foreground uppercase">Organizers</span>
            <span className="text-xl font-black text-primary">{counts.organizers}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-secondary/60 border border-border min-w-[110px] text-center shadow-xs">
            <span className="block text-[11px] font-bold text-muted-foreground uppercase">Exhibitors</span>
            <span className="text-xl font-black text-indigo-500">{counts.exhibitors}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-secondary/60 border border-border min-w-[110px] text-center shadow-xs">
            <span className="block text-[11px] font-bold text-muted-foreground uppercase">Visitors</span>
            <span className="text-xl font-black text-amber-500">{counts.visitors}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 min-w-[110px] text-center shadow-xs">
            <span className="block text-[11px] font-bold text-primary uppercase">Test Dummy</span>
            <span className="text-xl font-black text-primary">{counts.dummyUsers}</span>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`flex items-center gap-3 p-4 rounded-2xl text-xs font-bold shadow-md transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-destructive/10 border border-destructive/30 text-destructive'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-card border border-border w-fit shadow-xs">
        <button
          type="button"
          onClick={() => setCreationMode('single')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            creationMode === 'single'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          }`}
        >
          <UserPlus className="h-4 w-4" /> Single User Rapid Generator
        </button>
        <button
          type="button"
          onClick={() => setCreationMode('bulk')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            creationMode === 'bulk'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          }`}
        >
          <Layers className="h-4 w-4" /> Bulk / Batch Generator
        </button>
      </div>

      {/* TAB A: Single User Rapid Creation */}
      {creationMode === 'single' && (
        <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" /> Single Dummy User Setup
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Generate a ready-to-use user with pre-filled realistic details or customize as needed.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRandomizeForm}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-bold border border-border hover:bg-secondary/80 transition-all cursor-pointer active:scale-95 shadow-xs w-fit"
            >
              <RefreshCw className="h-3.5 w-3.5 text-primary" /> Randomize Data
            </button>
          </div>

          {/* Role Selector Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleRoleTabChange('organizer')}
              className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedRole === 'organizer'
                  ? 'border-primary bg-primary/10 shadow-sm ring-2 ring-primary/20'
                  : 'border-border bg-background hover:bg-secondary/40'
              }`}
            >
              <div className="space-y-1">
                <span className="text-xs font-bold text-foreground block">Organizer</span>
                <span className="text-[11px] text-muted-foreground block">Creates active Organization + Event Manager rights</span>
              </div>
              <Building2 className={`h-6 w-6 ${selectedRole === 'organizer' ? 'text-primary' : 'text-muted-foreground'}`} />
            </button>

            <button
              type="button"
              onClick={() => handleRoleTabChange('exhibitor')}
              className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedRole === 'exhibitor'
                  ? 'border-indigo-500 bg-indigo-500/10 shadow-sm ring-2 ring-indigo-500/20'
                  : 'border-border bg-background hover:bg-secondary/40'
              }`}
            >
              <div className="space-y-1">
                <span className="text-xs font-bold text-foreground block">Exhibitor</span>
                <span className="text-[11px] text-muted-foreground block">Creates booth enterprise &amp; exhibitor profile</span>
              </div>
              <Building className={`h-6 w-6 ${selectedRole === 'exhibitor' ? 'text-indigo-500' : 'text-muted-foreground'}`} />
            </button>

            <button
              type="button"
              onClick={() => handleRoleTabChange('visitor')}
              className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedRole === 'visitor'
                  ? 'border-amber-500 bg-amber-500/10 shadow-sm ring-2 ring-amber-500/20'
                  : 'border-border bg-background hover:bg-secondary/40'
              }`}
            >
              <div className="space-y-1">
                <span className="text-xs font-bold text-foreground block">Visitor / Attendee</span>
                <span className="text-[11px] text-muted-foreground block">Pass holder with instant access</span>
              </div>
              <Ticket className={`h-6 w-6 ${selectedRole === 'visitor' ? 'text-amber-500' : 'text-muted-foreground'}`} />
            </button>
          </div>

          {/* Form Fields Grid */}
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Full Name *</label>
              <div className="relative">
                <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={singleForm.name}
                  onChange={(e) => setSingleForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Vikram Singhania"
                  className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Login Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={singleForm.email}
                  onChange={(e) => setSingleForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="user@testexpo.in"
                  className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Account Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={singleForm.password}
                  onChange={(e) => setSingleForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Min. 6 chars"
                  className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-10 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Mobile Number (10 Digits)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={singleForm.phone}
                  onChange={(e) => setSingleForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="9876543210"
                  className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">
                {selectedRole === 'visitor' ? 'Employer / Company' : 'Organization / Brand Name *'}
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={singleForm.company}
                  onChange={(e) => setSingleForm((prev) => ({ ...prev, company: e.target.value }))}
                  placeholder="Company Name"
                  className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">City / Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={singleForm.city}
                  onChange={(e) => setSingleForm((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="e.g. New Delhi"
                  className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {selectedRole !== 'organizer' && (
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Job Designation</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={singleForm.designation}
                    onChange={(e) => setSingleForm((prev) => ({ ...prev, designation: e.target.value }))}
                    placeholder="e.g. Chief Executive Officer"
                    className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            {selectedRole === 'exhibitor' && (
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Industry Sector</label>
                <select
                  value={singleForm.industry}
                  onChange={(e) => setSingleForm((prev) => ({ ...prev, industry: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              disabled={creatingSingle}
              onClick={() => handleCreateSingle(false)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {creatingSingle ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating User...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" /> Create Dummy {selectedRole.toUpperCase()}
                </>
              )}
            </button>

            <button
              type="button"
              disabled={creatingSingle}
              onClick={() => handleCreateSingle(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <ExternalLink className="h-4 w-4" /> Create &amp; Open Dashboard Directly
            </button>
          </div>
        </div>
      )}

      {/* TAB B: Bulk / Batch Generator */}
      {creationMode === 'bulk' && (
        <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="pb-4 border-b border-border">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" /> Fast Bulk Dummy Generator
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Instantly seed multiple realistic test users in batch. Each user receives unique credentials, active phone, and company profiles.
            </p>
          </div>

          {/* 1-Click Fast Presets */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase">1-Click Fast Generators</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                type="button"
                disabled={creatingBulk}
                onClick={() => handleCreateBulk('organizer', 5)}
                className="flex flex-col items-start gap-2 p-5 rounded-2xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer active:scale-98 text-left disabled:opacity-50"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                    <Building2 className="h-4 w-4" /> Organizers
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary">Batch</span>
                </div>
                <span className="text-lg font-extrabold text-foreground">Generate 5 Organizers</span>
                <span className="text-[11px] text-muted-foreground">Creates 5 active organizers with unique exhibition organizations</span>
              </button>

              <button
                type="button"
                disabled={creatingBulk}
                onClick={() => handleCreateBulk('exhibitor', 5)}
                className="flex flex-col items-start gap-2 p-5 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 transition-all cursor-pointer active:scale-98 text-left disabled:opacity-50"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-indigo-500 flex items-center gap-1.5 uppercase tracking-wider">
                    <Building className="h-4 w-4" /> Exhibitors
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-500">Batch</span>
                </div>
                <span className="text-lg font-extrabold text-foreground">Generate 5 Exhibitors</span>
                <span className="text-[11px] text-muted-foreground">Creates 5 active exhibitors with company booths and sectors</span>
              </button>

              <button
                type="button"
                disabled={creatingBulk}
                onClick={() => handleCreateBulk('visitor', 10)}
                className="flex flex-col items-start gap-2 p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-all cursor-pointer active:scale-98 text-left disabled:opacity-50"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5 uppercase tracking-wider">
                    <Ticket className="h-4 w-4" /> Visitors
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500">Batch</span>
                </div>
                <span className="text-lg font-extrabold text-foreground">Generate 10 Visitors</span>
                <span className="text-[11px] text-muted-foreground">Creates 10 attendees with business designations and verified phones</span>
              </button>
            </div>
          </div>

          {/* Custom Batch Generator */}
          <div className="p-5 rounded-2xl border border-border bg-secondary/30 space-y-4">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Custom Quantity Batch</h4>
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Role</label>
                <select
                  value={bulkRole}
                  onChange={(e) => setBulkRole(e.target.value)}
                  className="rounded-xl border border-border bg-background py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-w-[150px]"
                >
                  <option value="organizer">Organizer</option>
                  <option value="exhibitor">Exhibitor</option>
                  <option value="visitor">Visitor</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  max={25}
                  value={bulkCount}
                  onChange={(e) => setBulkCount(Math.min(Math.max(parseInt(e.target.value, 10) || 1, 1), 25))}
                  className="w-24 rounded-xl border border-border bg-background py-2 px-3 text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="pt-5">
                <button
                  type="button"
                  disabled={creatingBulk}
                  onClick={() => handleCreateBulk(bulkRole, bulkCount)}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {creatingBulk ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Generating {bulkCount} Users...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" /> Generate {bulkCount} {bulkRole}s
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECENT USERS & IMPERSONATION DIRECTORY */}
      <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-border gap-4">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Created Users Directory &amp; Direct Login
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click &quot;Login to Dashboard&quot; next to any user to instantly transfer into their live account session.
            </p>
          </div>

          {/* Search & Role Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, company..."
                className="w-56 rounded-xl border border-border bg-background py-1.5 pl-8 pr-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="rounded-xl border border-border bg-background py-1.5 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
            >
              <option value="all">All Roles</option>
              <option value="dummy">Only Dummy (@testexpo.in)</option>
              <option value="organizer">Organizers Only</option>
              <option value="exhibitor">Exhibitors Only</option>
              <option value="visitor">Visitors Only</option>
            </select>

            <button
              type="button"
              onClick={fetchRapidUsers}
              disabled={loadingUsers}
              className="p-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground cursor-pointer transition-all active:scale-90"
              title="Refresh List"
            >
              <RefreshCw className={`h-4 w-4 ${loadingUsers ? 'animate-spin text-primary' : ''}`} />
            </button>
          </div>
        </div>

        {/* Users Table */}
        {loadingUsers ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Users className="h-10 w-10 text-muted-foreground mx-auto opacity-40" />
            <h4 className="text-sm font-bold text-foreground">No Users Found</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No users matched your search criteria. Use the generator above to create test organizers, exhibitors, or visitors.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3.5 px-4">User Identity</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Organization / Company</th>
                  <th className="py-3.5 px-4">Contact Phone</th>
                  <th className="py-3.5 px-4">Login Action</th>
                  <th className="py-3.5 px-4 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((u) => {
                  const isDummy = u.email?.endsWith('@testexpo.in');
                  const roleBadgeColor =
                    u.role === 'organizer'
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : u.role === 'exhibitor'
                      ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20';

                  const orgDisplayName =
                    u.organization?.name || u.company || (u.role === 'visitor' ? 'Individual Attendee' : 'Independent');

                  return (
                    <tr key={u._id} className="hover:bg-secondary/30 transition-colors">
                      {/* Identity */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-primary/30 to-amber-500/30 flex items-center justify-center font-bold text-foreground text-xs shadow-xs">
                            {(u.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-foreground">{u.name}</span>
                              {isDummy && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary">
                                  Dummy
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground font-mono text-[11px]">{u.email}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(u.email, `email-${u._id}`)}
                                className="text-muted-foreground hover:text-foreground cursor-pointer transition-all"
                                title="Copy email"
                              >
                                {copiedKey === `email-${u._id}` ? (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${roleBadgeColor}`}>
                          {u.role === 'organizer' && <Building2 className="h-3 w-3" />}
                          {u.role === 'exhibitor' && <Building className="h-3 w-3" />}
                          {u.role === 'visitor' && <Ticket className="h-3 w-3" />}
                          {u.role}
                        </span>
                      </td>

                      {/* Organization / Company */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-foreground block truncate max-w-[200px]">
                            {orgDisplayName}
                          </span>
                          {u.city && (
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {u.city}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Contact Phone */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] text-foreground">
                            {u.phone ? `+91 ${u.phone}` : '—'}
                          </span>
                          {u.isPhoneVerified && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" title="Phone Verified" />
                          )}
                        </div>
                      </td>

                      {/* LOGIN BUTTON (Required by User Prompt) */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleImpersonateLogin(u)}
                          disabled={impersonatingId === u._id}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer active:scale-95 shadow-xs disabled:opacity-50"
                          title="Open user's account dashboard in new tab"
                        >
                          {impersonatingId === u._id ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Logging In...
                            </>
                          ) : (
                            <>
                              <ExternalLink className="h-3.5 w-3.5" /> Login to Dashboard
                            </>
                          )}
                        </button>
                      </td>

                      {/* Delete */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u._id, u.name)}
                          disabled={deletingId === u._id}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer active:scale-90"
                          title="Delete User"
                        >
                          {deletingId === u._id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
