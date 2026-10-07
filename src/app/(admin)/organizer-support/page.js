'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  Send
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.js';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function formatConversationDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function OrganizerSupportPage() {
  const { accessToken } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState('');
  const [activeConversation, setActiveConversation] = useState(null);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!accessToken) return undefined;
    let mounted = true;
    const headers = { Authorization: `Bearer ${accessToken}` };

    // Hydrate immediately from cache
    try {
      if (typeof window !== 'undefined') {
        const cached = sessionStorage.getItem('visitexpo_admin_org_support_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setConversations(parsed);
            setActiveConversationId(parsed[0]?._id || '');
            setLoading(false);
          }
        }
      }
    } catch (e) {}

    const loadInbox = async (silent = false) => {
      if (!silent && mounted) setLoading(true);
      if (silent && mounted) setRefreshing(true);
      try {
        const res = await axios.get(`${API_URL}/organizer-support/admin/conversations`, { headers });
        if (!mounted) return;
        const items = res.data?.conversations || [];
        setConversations(items);
        setActiveConversationId((current) => (
          current && items.some((item) => item._id === current) ? current : items[0]?._id || ''
        ));
        setError('');
        try {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('visitexpo_admin_org_support_cache', JSON.stringify(items));
          }
        } catch (e) {}
      } catch (requestError) {
        if (mounted) setError(requestError.response?.data?.error || 'Could not load organizer conversations.');
      } finally {
        if (mounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    loadInbox(true);
    const timer = window.setInterval(() => loadInbox(true), 10000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !activeConversationId) {
      setActiveConversation(null);
      return undefined;
    }

    let mounted = true;
    const headers = { Authorization: `Bearer ${accessToken}` };
    const loadThread = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/organizer-support/admin/conversations/${activeConversationId}`,
          { headers }
        );
        if (mounted && res.data?.success) setActiveConversation(res.data.conversation);
      } catch (requestError) {
        if (mounted) setError(requestError.response?.data?.error || 'Could not load this conversation.');
      }
    };

    loadThread();
    const timer = window.setInterval(loadThread, 5000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [accessToken, activeConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [activeConversation?.messages?.length]);

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((conversation) => {
      const organizer = conversation.organizer || {};
      return [organizer.name, organizer.email, conversation.lastMessage]
        .some((value) => String(value || '').toLowerCase().includes(query));
    });
  }, [conversations, search]);

  const handleSendReply = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !activeConversationId || sending) return;

    setSending(true);
    setError('');
    try {
      const res = await axios.post(
        `${API_URL}/organizer-support/admin/conversations/${activeConversationId}/messages`,
        { text },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setActiveConversation(res.data?.conversation || null);
      setDraft('');
      const inboxRes = await axios.get(`${API_URL}/organizer-support/admin/conversations`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setConversations(inboxRes.data?.conversations || []);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Reply could not be sent. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] min-h-[520px] max-w-7xl flex-col gap-4 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Organizer Support Chat</h2>
          <p className="mt-1 text-xs text-muted-foreground">Private conversations between organizers and VisitExpo administrators.</p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="grid min-h-0 flex-1 overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col border-b border-border md:border-b-0 md:border-r">
          <div className="border-b border-border p-3">
            <label className="relative block">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search organizers..."
                aria-label="Search organizer conversations"
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <p className="mt-2 px-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Inbox <span className="ml-1 text-foreground">{filteredConversations.length}</span>
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : filteredConversations.length ? filteredConversations.map((conversation) => {
              const organizer = conversation.organizer || {};
              const selected = activeConversationId === conversation._id;
              return (
                <button
                  type="button"
                  key={conversation._id}
                  onClick={() => setActiveConversationId(conversation._id)}
                  className={`w-full border-b border-border/70 p-3 text-left transition-colors ${selected ? 'bg-primary/10' : 'hover:bg-secondary/50'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="truncate text-xs font-bold text-foreground">{organizer.name || 'Organizer'}</span>
                    <time className="shrink-0 text-[9px] text-muted-foreground">{formatConversationDate(conversation.lastMessageAt)}</time>
                  </div>
                  <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{organizer.email || 'No email'}</p>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <p className="truncate text-[11px] text-muted-foreground">{conversation.lastMessage || 'No messages yet'}</p>
                    {conversation.unreadByAdmin > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                        {conversation.unreadByAdmin}
                      </span>
                    )}
                  </div>
                </button>
              );
            }) : (
              <div className="flex flex-col items-center px-5 py-12 text-center">
                <MessageSquare className="mb-2 h-7 w-7 text-muted-foreground/40" />
                <p className="text-xs font-semibold text-foreground">{search ? 'No matches' : 'No conversations yet'}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">Organizer messages will appear here.</p>
              </div>
            )}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col">
          {activeConversation ? (
            <>
              <header className="border-b border-border px-4 py-3">
                <p className="text-sm font-bold text-foreground">{activeConversation.organizer?.name || 'Organizer'}</p>
                <p className="text-[11px] text-muted-foreground">{activeConversation.organizer?.email}</p>
              </header>
              <div className="flex-1 space-y-3 overflow-y-auto bg-muted/10 p-4">
                {activeConversation.messages?.map((message) => {
                  const isAdmin = message.senderRole === 'admin';
                  return (
                    <div key={message._id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 ${isAdmin ? 'rounded-br-sm bg-primary text-primary-foreground' : 'rounded-bl-sm border border-border bg-card text-foreground'}`}>
                        <p className="mb-1 text-[10px] font-bold opacity-75">{message.senderName || (isAdmin ? 'VisitExpo Support' : 'Organizer')}</p>
                        <p className="whitespace-pre-wrap break-words text-xs leading-relaxed">{message.text}</p>
                        <time className="mt-1.5 block text-right text-[9px] opacity-65">{formatConversationDate(message.timestamp)}</time>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendReply} className="flex items-end gap-2 border-t border-border p-3">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  maxLength={4000}
                  rows={2}
                  placeholder="Write a reply..."
                  aria-label="Reply to organizer"
                  className="max-h-28 min-h-10 flex-1 resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || sending}
                  aria-label="Send reply"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-45"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <MessageSquare className="mb-3 h-9 w-9 text-muted-foreground/35" />
              <p className="text-sm font-bold text-foreground">Select a conversation</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">Choose an organizer from the inbox to read and reply to their message.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}