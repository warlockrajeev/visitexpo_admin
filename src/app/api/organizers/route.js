import { NextResponse } from 'next/server';

/**
 * @file api/organizers/route.js
 * @description Next.js route handler for client-admin to aggregate and serve all organizers
 * with their complete event listings, contact information, and brand metadata.
 */

// Baseline curated profiles for top global and national exhibition organizers
const KNOWN_ORGANIZERS = [
  {
    id: 'informa-markets',
    name: 'Informa Markets',
    shortName: 'Informa Markets',
    aliases: [/informa/i],
    brandColor: '#002D62',
    accentColor: '#00A3E0',
    website: 'https://www.informamarkets.com',
    badge: 'Global Leader',
    type: 'international',
    scope: 'World’s leading B2B exhibitions, trade fairs, and market-making platforms.'
  },

  {
    id: 'ies-india',
    name: 'Indian Exhibition Services (IES)',
    shortName: 'IES India',
    aliases: [/indian exhibition services|ies\b/i],
    brandColor: '#1E40AF',
    accentColor: '#3B82F6',
    website: 'https://ies-india.com',
    badge: 'National Trade Expos',
    type: 'national',
    scope: 'Premier industrial trade exhibitions, manufacturing expos, and DRR conventions.'
  },
  {
    id: 'messe-frankfurt',
    name: 'Messe Frankfurt',
    shortName: 'Messe Frankfurt',
    aliases: [/messe frankfurt/i],
    brandColor: '#DC2626',
    accentColor: '#F59E0B',
    website: 'https://www.messefrankfurt.com',
    badge: 'German Fairs',
    type: 'international',
    scope: 'World’s largest trade fair, congress and event organiser with own grounds.'
  },
  {
    id: 'rx-global',
    name: 'RX Global (Reed Exhibitions)',
    shortName: 'RX Global',
    aliases: [/rx india|reed exhibitions|rx japan|rx global/i],
    brandColor: '#1E3A8A',
    accentColor: '#0284C7',
    website: 'https://rxglobal.com',
    badge: 'Global Powerhouse',
    type: 'international',
    scope: 'Global events powerhouse driving targeted market access, technology showcases, and matchmaking.'
  },
  {
    id: 'nurnbergmesse',
    name: 'NürnbergMesse India',
    shortName: 'NürnbergMesse',
    aliases: [/n[uü]rnbergmesse/i],
    brandColor: '#0284C7',
    accentColor: '#0EA5E9',
    website: 'https://www.nm-india.com',
    badge: 'German Excellence',
    type: 'international',
    scope: 'Premier specialty exhibitions for architecture, building tech, and hardware.'
  },
  {
    id: 'messe-dusseldorf',
    name: 'Messe Düsseldorf',
    shortName: 'Messe Düsseldorf',
    aliases: [/messe d[uü]sseldorf/i],
    brandColor: '#B91C1C',
    accentColor: '#EF4444',
    website: 'https://www.md-india.com',
    badge: 'Medical & Industrial',
    type: 'international',
    scope: 'Medical Fair India, metallurgy conventions, and global industrial forums.'
  },
  {
    id: 'cems-global',
    name: 'CEMS-Global USA',
    shortName: 'CEMS-Global',
    aliases: [/cems/i],
    brandColor: '#047857',
    accentColor: '#10B981',
    website: 'https://cems.global',
    badge: 'Multinational',
    type: 'international',
    scope: 'Multinational exhibition organizer spanning South & Southeast Asia and South America.'
  },
  {
    id: 'guangdong-grandeur',
    name: 'Guangdong Grandeur Intl Exhibition Group',
    shortName: 'Grandeur Group',
    aliases: [/grandeur/i],
    brandColor: '#B45309',
    accentColor: '#F59E0B',
    website: 'https://www.gzhw.com',
    badge: 'Asia Pacific',
    type: 'international',
    scope: 'Major organizer of landscape, gardening, entertainment, and commercial trade fairs.'
  },
  {
    id: 'mex-exhibitions',
    name: 'MEX Exhibitions Pvt. Ltd.',
    shortName: 'MEX Exhibitions',
    aliases: [/mex exhibitions/i],
    brandColor: '#4338CA',
    accentColor: '#6366F1',
    website: 'https://cewexpo.com',
    badge: 'Consumer & Sign',
    type: 'national',
    scope: 'Consumer Electronics World Expo, Gifts World Expo, and Sign India showcases.'
  },
  {
    id: 'cii',
    name: 'Confederation of Indian Industry (CII)',
    shortName: 'CII',
    aliases: [/cii\b|confederation of indian/i],
    brandColor: '#15803D',
    accentColor: '#22C55E',
    website: 'https://www.cii.in',
    badge: 'Apex Industry Body',
    type: 'national',
    scope: 'India’s premier business association driving industrial growth, urban mass transit, and engineering.'
  },
  {
    id: 'koelnmesse',
    name: 'Koelnmesse GmbH',
    shortName: 'Koelnmesse',
    aliases: [/koelnmesse/i],
    brandColor: '#C026D3',
    accentColor: '#E879F9',
    website: 'https://www.koelnmesse.com',
    badge: 'Trade Fair Leader',
    type: 'international',
    scope: 'Global leader in food, interior design, and packaging exhibitions.'
  },
  {
    id: 'worldex',
    name: 'Worldex India Exhibition & Promotion',
    shortName: 'Worldex India',
    aliases: [/worldex/i],
    brandColor: '#2563EB',
    accentColor: '#60A5FA',
    website: 'https://www.worldexindia.com',
    badge: 'B2B Trade Marts',
    type: 'national',
    scope: 'WOFX World Furniture Expo, Intex South Asia, and export trade development.'
  },
  {
    id: 'bridal-asia',
    name: 'Bridal Asia',
    shortName: 'Bridal Asia',
    aliases: [/bridal asia/i],
    brandColor: '#BE185D',
    accentColor: '#F472B6',
    website: 'https://www.bridalasia.com',
    badge: 'Luxury Lifestyle',
    type: 'national',
    scope: 'Asia’s most prestigious luxury wedding apparel, jewelry, and lifestyle showcase.'
  },
  {
    id: 'ifema-madrid',
    name: 'IFEMA MADRID (Feria de Madrid)',
    shortName: 'IFEMA Madrid',
    aliases: [/ifema/i],
    brandColor: '#7C3AED',
    accentColor: '#A78BFA',
    website: 'https://www.ifema.es',
    badge: 'Feria de Madrid',
    type: 'international',
    scope: 'Official consortium of Madrid organizing premier European fashion and tourism fairs.'
  },
  {
    id: 'radeecal',
    name: 'Radeecal Communications',
    shortName: 'Radeecal',
    aliases: [/radeecal/i],
    brandColor: '#059669',
    accentColor: '#34D399',
    website: 'https://radeecal.in',
    badge: 'Agri & Industrial',
    type: 'national',
    scope: 'Agritech Bharat, Dairy Tech India, and specialized agrochemical expos.'
  },
  {
    id: 'itpo',
    name: 'India Trade Promotion Organisation (ITPO)',
    shortName: 'ITPO',
    aliases: [/itpo|india trade promotion/i],
    brandColor: '#D97706',
    accentColor: '#FBBF24',
    website: 'https://www.itpo.gov.in',
    badge: 'Govt of India',
    type: 'national',
    scope: 'Nodal trade promotion agency of the Ministry of Commerce & Industry, Govt of India.'
  },
  {
    id: 'dmg-events',
    name: 'dmg events',
    shortName: 'dmg events',
    aliases: [/dmg events/i],
    brandColor: '#0D9488',
    accentColor: '#2DD4BF',
    website: 'https://www.dmgevents.com',
    badge: 'Energy & Food',
    type: 'international',
    scope: 'International portfolio of exhibitions in energy, construction, and hospitality.'
  },
  {
    id: 'montgomery-group',
    name: 'Montgomery Group',
    shortName: 'Montgomery',
    aliases: [/montgomery/i],
    brandColor: '#475569',
    accentColor: '#94A3B8',
    website: 'https://www.montgomerygroup.com',
    badge: 'Global Hospitality',
    type: 'international',
    scope: 'Independent events company organizing global exhibitions across 15 countries.'
  },
  {
    id: 'scci-sharjah',
    name: 'Expo Centre Sharjah (SCCI)',
    shortName: 'Expo Centre Sharjah',
    aliases: [/sharjah/i],
    brandColor: '#9333EA',
    accentColor: '#C084FC',
    website: 'https://www.sharjah.gov.ae',
    badge: 'UAE Premier Expo',
    type: 'international',
    scope: 'Watch & Jewellery Middle East Show and leading Arabian Gulf trade fairs.'
  },
  {
    id: 'ficci',
    name: 'Federation of Indian Chambers of Commerce & Industry (FICCI)',
    shortName: 'FICCI',
    aliases: [/ficci/i],
    brandColor: '#B91C1C',
    accentColor: '#F87171',
    website: 'https://www.ficci.in',
    badge: 'Apex Chamber',
    type: 'national',
    scope: 'Apex business chamber championing global investment summits and commercial expos.'
  },
  {
    id: 'cfa',
    name: "The Cat Fanciers' Association (CFA)",
    shortName: 'CFA',
    aliases: [/cat fanciers/i],
    brandColor: '#0891B2',
    accentColor: '#06B6D4',
    website: 'https://cfa.org',
    badge: 'International Registry',
    type: 'international',
    scope: 'World’s largest registry of pedigreed cats and international specialty showcases.'
  }
];

function getDynamicBrandColors(name) {
  const PALETTES = [
    { brand: '#2563EB', accent: '#60A5FA' },
    { brand: '#7C3AED', accent: '#A78BFA' },
    { brand: '#059669', accent: '#34D399' },
    { brand: '#D97706', accent: '#FBBF24' },
    { brand: '#DC2626', accent: '#F87171' },
    { brand: '#0891B2', accent: '#22D3EE' },
    { brand: '#4F46E5', accent: '#818CF8' },
    { brand: '#C026D3', accent: '#E879F9' },
    { brand: '#475569', accent: '#94A3B8' },
    { brand: '#0D9488', accent: '#2DD4BF' }
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % PALETTES.length;
  return PALETTES[idx];
}

let cachedData = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request) {
  const url = new URL(request?.url || 'http://localhost:3001/api/organizers');
  const forceRefresh = url.searchParams.get('refresh') === 'true' || url.searchParams.has('t');

  const now = Date.now();
  if (!forceRefresh && cachedData && now - cacheTime < CACHE_TTL) {
    return NextResponse.json({ success: true, data: cachedData });
  }

  // Fetch deleted organizers from Express backend
  let deletedNames = new Set();
  let deletedSlugIds = new Set();
  try {
    const delRes = await fetch('http://localhost:5000/api/events/deleted-organizers', {
      cache: 'no-store'
    });
    if (delRes.ok) {
      const delJson = await delRes.json();
      const list = delJson.data || [];
      deletedNames = new Set(list.map((d) => (d.name || '').toLowerCase().trim()));
      deletedSlugIds = new Set(list.map((d) => (d.slugId || '').toLowerCase().trim()));
    }
  } catch (e) {
    console.warn('[client-admin/api/organizers] Could not fetch deleted-organizers:', e.message);
  }

  // 1. First attempt: fetch from WordPress inspect-event-meta
  try {
    const wpUrl = process.env.WORDPRESS_URL || 'https://visitexpo.in';
    const wpKey = process.env.WORDPRESS_API_KEY || 'visitexpo_custom_secret_key_12345';
    const wpRes = await fetch(`${wpUrl}/wp-json/visitexpo/v1/inspect-event-meta`, {
      headers: { 'X-VisitExpo-Key': wpKey },
      signal: AbortSignal.timeout(8000)
    });

    if (wpRes.ok) {
      const wpData = await wpRes.json();
      const docs = wpData.data?.docs || [];

      const orgMap = {};

      KNOWN_ORGANIZERS.forEach((ko) => {
        orgMap[ko.name] = {
          id: ko.id,
          name: ko.name,
          shortName: ko.shortName,
          brandColor: ko.brandColor,
          accentColor: ko.accentColor,
          website: ko.website,
          logoUrl: ko.logoUrl || null,
          badge: ko.badge,
          type: ko.type,
          scope: ko.scope,
          email: '',
          phone: '',
          events: []
        };
      });

      function resolveOrganizer(rawName) {
        const clean = (rawName || '').trim();
        if (!clean || clean === 'Verified Organizer') {
          return 'VisitExpo Verified Partner Expos';
        }
        for (const ko of KNOWN_ORGANIZERS) {
          if (ko.aliases.some((rgx) => rgx.test(clean))) {
            return ko.name;
          }
        }
        return clean;
      }

      docs.forEach((d, idx) => {
        const m = d.meta || {};
        const startTs = m.ovaem_date_start_time?.[0];
        const endTs = m.ovaem_date_end_time?.[0];
        const venue = m.ovaem_address_event?.[0] || m.ovaem_venue?.[0] || m.ovaem_address?.[0] || 'Exhibition Center';
        const rawOrgName = m.ovaem_org_name?.[0] || d.organizer || 'Verified Organizer';
        const resolvedName = resolveOrganizer(rawOrgName);

        const cleanCity = (venue.includes('New Delhi') || venue.includes('Delhi') || venue.includes('Pragati') || venue.includes('Bharat Mandapam')) ? 'New Delhi' :
                          (venue.includes('Mumbai') || venue.includes('BKC') || venue.includes('Jio')) ? 'Mumbai' :
                          (venue.includes('Bengaluru') || venue.includes('BIEC')) ? 'Bengaluru' :
                          (venue.includes('Chennai')) ? 'Chennai' :
                          (venue.includes('Hyderabad')) ? 'Hyderabad' :
                          (venue.includes('Ahmedabad') || venue.includes('Gandhinagar')) ? 'Ahmedabad' : 'India';

        if (!orgMap[resolvedName]) {
          const colors = getDynamicBrandColors(resolvedName);
          orgMap[resolvedName] = {
            id: resolvedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            name: resolvedName,
            shortName: resolvedName,
            brandColor: colors.brand,
            accentColor: colors.accent,
            website: m.ovaem_org_website?.[0] || '',
            logoUrl: null,
            badge: resolvedName === 'VisitExpo Verified Partner Expos' ? 'Partner Fairs' : 'Trade Organizer',
            type: resolvedName === 'VisitExpo Verified Partner Expos' ? 'national' : 'independent',
            scope: m.ovaem_org_desc?.[0] || 'Trade exhibition organizer promoting industrial and commercial showcases.',
            email: m.ovaem_org_email?.[0] || '',
            phone: m.ovaem_org_phone?.[0] || '',
            events: []
          };
        } else {
          if (!orgMap[resolvedName].website && m.ovaem_org_website?.[0]) {
            orgMap[resolvedName].website = m.ovaem_org_website[0];
          }
          if (!orgMap[resolvedName].email && m.ovaem_org_email?.[0]) {
            orgMap[resolvedName].email = m.ovaem_org_email[0];
          }
          if (!orgMap[resolvedName].phone && m.ovaem_org_phone?.[0]) {
            orgMap[resolvedName].phone = m.ovaem_org_phone[0];
          }
          if ((!orgMap[resolvedName].scope || orgMap[resolvedName].scope.length < 30) && m.ovaem_org_desc?.[0]) {
            orgMap[resolvedName].scope = m.ovaem_org_desc[0];
          }
        }

        orgMap[resolvedName].events.push({
          id: String(d.id || d.ID || `wp-${idx}`),
          title: d.title || 'Exhibition Event',
          slug: d.slug,
          category: d.category || 'Trade & Industry',
          venue,
          city: cleanCity,
          startDate: startTs && parseInt(startTs) > 0 ? new Date(parseInt(startTs) * 1000).toISOString() : null,
          endDate: endTs && parseInt(endTs) > 0 ? new Date(parseInt(endTs) * 1000).toISOString() : null,
          dates: startTs ? new Date(parseInt(startTs) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Upcoming 2026',
          organizer: resolvedName,
          status: 'published',
          wpUrl: `https://visitexpo.in/event/${d.slug}/`,
          isWordPress: true
        });
      });

      // Merge MongoDB platform events deduplicated by slug
      try {
        const mongoRes = await fetch('http://localhost:5000/api/events?limit=2500', { cache: 'no-store' });
        if (mongoRes.ok) {
          const mongoJson = await mongoRes.json();
          const mongoEvents = mongoJson.data?.docs || mongoJson.data || [];
          const processedSlugs = new Set(docs.map((d) => d.slug).filter(Boolean));

          mongoEvents.forEach((me) => {
            if (me.slug && processedSlugs.has(me.slug)) return;
            if (me.slug) processedSlugs.add(me.slug);

            const orgName = me.organizerName || me.orgName || 'VisitExpo Verified Partner Expos';
            const resolvedName = resolveOrganizer(orgName);

            if (!orgMap[resolvedName]) {
              const colors = getDynamicBrandColors(resolvedName);
              orgMap[resolvedName] = {
                id: resolvedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                name: resolvedName,
                shortName: resolvedName,
                brandColor: colors.brand,
                accentColor: colors.accent,
                website: '',
                logoUrl: null,
                badge: 'Platform Tenant',
                type: 'independent',
                scope: 'Platform registered organizer hosting verified conventions.',
                email: '',
                phone: '',
                events: []
              };
            }

            orgMap[resolvedName].events.push({
              id: String(me._id || me.id),
              title: me.title,
              slug: me.slug,
              category: Array.isArray(me.categories) ? me.categories[0] : (me.categories || 'Trade & Industry'),
              venue: me.venue || 'Convention Center',
              city: me.city || 'India',
              startDate: me.startDate,
              endDate: me.endDate,
              dates: me.startDate ? new Date(me.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Upcoming',
              organizer: resolvedName,
              status: me.status || 'published',
              wpUrl: me.wpUrl || '',
              isWordPress: false
            });
          });
        }
      } catch (mongoErr) {
        console.warn('[client-admin/api/organizers] Mongo events merge warning:', mongoErr.message);
      }

      const isDeleted = (o) => {
        const oName = (o.name || '').toLowerCase().trim();
        const oId = (o.id || '').toLowerCase().trim();
        const oShortName = (o.shortName || '').toLowerCase().trim();
        return (
          deletedNames.has(oName) ||
          deletedNames.has(oShortName) ||
          deletedSlugIds.has(oId) ||
          deletedSlugIds.has(oName) ||
          oId === 'global-tech-events'
        );
      };

      const organizersList = Object.values(orgMap)
        .filter((o) => !isDeleted(o))
        .map((o) => ({
          ...o,
          count: o.events.length
        })).sort((a, b) => b.count - a.count);

      const totalEvents = organizersList.reduce((sum, o) => sum + o.count, 0);

      cachedData = {
        totalOrganizers: organizersList.length,
        totalEvents,
        internationalCount: organizersList.filter((o) => o.type === 'international').length,
        nationalCount: organizersList.filter((o) => o.type === 'national').length,
        organizers: organizersList
      };
      cacheTime = now;

      return NextResponse.json({
        success: true,
        data: cachedData
      });
    }
  } catch (err) {
    console.warn('[client-admin/api/organizers] WordPress fetch warning:', err.message);
  }

  // Fallback to client-dashboard events endpoint
  try {
    const dashRes = await fetch('http://localhost:3000/api/wordpress-events');
    if (dashRes.ok) {
      const data = await dashRes.json();
      const events = data.events || [];
      const orgMap = {};

      events.forEach((evt) => {
        const orgName = (evt.organizer || 'VisitExpo Verified Partner Expos').trim();
        if (!orgMap[orgName]) {
          const colors = getDynamicBrandColors(orgName);
          orgMap[orgName] = {
            id: orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            name: orgName,
            shortName: orgName,
            brandColor: colors.brand,
            accentColor: colors.accent,
            website: '',
            logoUrl: null,
            badge: 'Trade Organizer',
            type: 'national',
            scope: 'Verified exhibition organizer hosting major trade events.',
            events: []
          };
        }
        orgMap[orgName].events.push(evt);
      });

      const list = Object.values(orgMap)
        .filter((o) => !isDeleted(o))
        .map((o) => ({
          ...o,
          count: o.events.length
        })).sort((a, b) => b.count - a.count);

      cachedData = {
        totalOrganizers: list.length,
        totalEvents: events.length,
        internationalCount: list.filter((o) => o.type === 'international').length,
        nationalCount: list.filter((o) => o.type === 'national').length,
        organizers: list
      };
      cacheTime = now;

      return NextResponse.json({
        success: true,
        data: cachedData
      });
    }
  } catch (dashErr) {
    console.error('[client-admin/api/organizers] All sources failed:', dashErr.message);
  }

  return NextResponse.json(
    {
      success: false,
      error: 'Failed to aggregate organizers directory'
    },
    { status: 500 }
  );
}

export async function DELETE(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { id, name, deleteEvents } = body;
    const authHeader = request.headers.get('authorization') || '';

    const targetId = id || (name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : null);
    if (!targetId) {
      return NextResponse.json({ success: false, error: 'Organizer ID or name is required' }, { status: 400 });
    }

    // Call Express backend to persist in DeletedOrganizer and clean references
    try {
      const res = await fetch(`http://localhost:5000/api/admin/organizers/${encodeURIComponent(targetId)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {})
        },
        body: JSON.stringify({ name, deleteEvents })
      });
      const data = await res.json().catch(() => ({}));
      // Invalidate local Next.js cache
      cachedData = null;
      cacheTime = 0;

      if (res.ok) {
        return NextResponse.json(data);
      } else {
        return NextResponse.json(
          { success: false, error: data.error || data.message || 'Failed to delete organizer from backend' },
          { status: res.status || 500 }
        );
      }
    } catch (e) {
      console.warn('[client-admin/api/organizers DELETE] Port 5000 note:', e.message);
      return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

