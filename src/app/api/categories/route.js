import { NextResponse } from 'next/server';

/**
 * @file api/categories/route.js
 * @description Server-side Next.js route to aggregate and serve all 11 event categories,
 * enriched metadata, and full event listings with in-memory caching.
 */

const CATEGORIES_METADATA = [
  {
    name: 'Technology & AI',
    slug: 'technology-ai',
    icon: 'Cpu',
    color: '#3b82f6',
    bg: 'bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/30',
    scope: 'Artificial intelligence, enterprise SaaS, cloud infrastructure, IoT, cybersecurity, semiconductors, and telecommunications.',
    subSectors: ['Generative AI & LLMs', 'Enterprise SaaS', 'Cybersecurity', 'Cloud & Edge Computing', 'Robotics & Automation', 'IoT & Smart Cities', 'Semiconductors'],
    topHubs: ['New Delhi', 'Bengaluru', 'Hyderabad', 'Mumbai'],
    avgFootfall: '30,000+ delegates',
    notableExpos: ['Global AI & Tech Convention', 'Convergence India', 'Smart Cities India', 'India Mobile Congress']
  },
  {
    name: 'Healthcare & Pharma',
    slug: 'healthcare-pharma',
    icon: 'Activity',
    color: '#ef4444',
    bg: 'bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-500/30',
    scope: 'Medical devices, pharmaceuticals, hospital infrastructure, biotechnology research, diagnostic equipment, and surgical technologies.',
    subSectors: ['Pharmaceutical APIs', 'Medical Devices', 'Hospital Infra & ICU', 'Biotech & Genomics', 'Ayurveda & Herbal', 'Diagnostic Imaging'],
    topHubs: ['Greater Noida', 'Mumbai', 'Hyderabad', 'Bengaluru'],
    avgFootfall: '22,000+ delegates',
    notableExpos: ['India MedTech Expo', 'CPhI & P-MEC India', 'Medical Fair India', 'Medicall Expo']
  },
  {
    name: 'Automotive & EV',
    slug: 'automotive-ev',
    icon: 'Car',
    color: '#f97316',
    bg: 'bg-orange-500/10',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500/30',
    scope: 'Electric mobility, auto components, commercial fleets, battery technology, charging infrastructure, and international motor shows.',
    subSectors: ['EV Mobility & 2W/4W', 'Lithium Battery Tech', 'Charging Infra', 'Auto Components', 'Commercial Fleets', 'Tyres & Rubber'],
    topHubs: ['New Delhi', 'Greater Noida', 'Bengaluru', 'Chennai', 'Pune'],
    avgFootfall: '85,000+ visitors',
    notableExpos: ['Bharat Mobility Global Expo', 'Auto Expo Components', 'EV India Expo', 'Busworld India']
  },
  {
    name: 'Construction & Infra',
    slug: 'construction-infra',
    icon: 'HardHat',
    color: '#eab308',
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-700 dark:text-yellow-400',
    border: 'border-yellow-500/30',
    scope: 'Heavy infrastructure machinery, smart urban planning, cement, concrete, architectural materials, and civil engineering.',
    subSectors: ['Earthmoving Machinery', 'Precast Concrete & Cement', 'Architectural Hardware', 'Urban Infrastructure', 'HVAC Automation', 'Piping Tech'],
    topHubs: ['Greater Noida', 'Mumbai', 'Bengaluru', 'Ahmedabad'],
    avgFootfall: '40,000+ buyers',
    notableExpos: ['BAUMA CONEXPO INDIA', 'ACETECH Architecture', 'Constro International', 'FOAID Design Expo']
  },
  {
    name: 'Travel & Tourism',
    slug: 'travel-tourism',
    icon: 'Compass',
    color: '#06b6d4',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-500/30',
    scope: 'Destination promotion, luxury hospitality chains, airline networks, travel trade marts, MICE summits, and tourism boards.',
    subSectors: ['Tour Operators & DMCs', 'Luxury Hotels & Resorts', 'Airlines & Aviation', 'MICE & Corporate Travel', 'Adventure Tourism', 'Travel Tech'],
    topHubs: ['New Delhi', 'Greater Noida', 'Mumbai', 'Kochi', 'Goa'],
    avgFootfall: '35,000+ delegates',
    notableExpos: ['SATTE South Asia Travel Expo', 'OTM Mumbai', 'BLTM Business Travel Mart', 'TTF Fair']
  },
  {
    name: 'Agri & Food Tech',
    slug: 'agri-food-tech',
    icon: 'Sprout',
    color: '#22c55e',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30',
    scope: 'Precision agriculture, farm mechanization, food processing equipment, grain & dairy tech, and international culinary expos.',
    subSectors: ['Farm Tractors & Machinery', 'Precision Irrigation', 'Food Processing & Packing', 'Dairy & Poultry Tech', 'Grain & Rice Milling', 'Bakery Foodservice'],
    topHubs: ['New Delhi', 'Pune', 'Bengaluru', 'Coimbatore', 'Chandigarh'],
    avgFootfall: '50,000+ farmers & trade',
    notableExpos: ['AAHAR International Food Fair', 'KISAN Agri Show', 'FoodPro Expo', 'DairyTech India']
  },
  {
    name: 'Textile & Fashion',
    slug: 'textile-fashion',
    icon: 'Shirt',
    color: '#ec4899',
    bg: 'bg-pink-500/10',
    text: 'text-pink-600 dark:text-pink-400',
    border: 'border-pink-500/30',
    scope: 'Garment manufacturing machinery, luxury fabrics, yarns, technical textiles, synthetic fibers, and apparel sourcing shows.',
    subSectors: ['Garment Machinery', 'Synthetic & Cotton Yarns', 'Digital Fabric Printing', 'Technical Textiles', 'Apparel Sourcing', 'Dyes & Chemicals'],
    topHubs: ['Surat', 'New Delhi', 'Coimbatore', 'Tirupur', 'Mumbai'],
    avgFootfall: '45,000+ trade buyers',
    notableExpos: ['Bharat Tex Global Mega Show', 'Gartex Texprocess', 'SITEX Surat', 'Yarnex Fair']
  },
  {
    name: 'Aerospace & Aviation',
    slug: 'aerospace-aviation',
    icon: 'Plane',
    color: '#6366f1',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-500/30',
    scope: 'Commercial aviation, defense aerospace, unmanned aerial systems (UAVs / drones), avionics, rotorcraft, and air shows.',
    subSectors: ['Commercial Aircraft', 'Defense Avionics', 'Commercial Drones & UAVs', 'Helicopter Aviation', 'MRO Services', 'Space & Satellite Tech'],
    topHubs: ['Bengaluru', 'Hyderabad', 'New Delhi'],
    avgFootfall: '60,000+ attendees',
    notableExpos: ['Aero India Air Show', 'Wings India Summit', 'Bharat Drone Mahotsav']
  },
  {
    name: 'Logistics & Cargo',
    slug: 'logistics-cargo',
    icon: 'Truck',
    color: '#8b5cf6',
    bg: 'bg-purple-500/10',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/30',
    scope: 'Supply chain management, maritime freight, warehousing robotics, cold-chain logistics, and multimodal express transport.',
    subSectors: ['Warehouse Robotics', 'Freight & Multimodal', 'Cold-chain Reefer Systems', 'Maritime Ports', 'Material Handling', 'Fleet Management'],
    topHubs: ['Mumbai', 'New Delhi', 'Chennai', 'Ahmedabad'],
    avgFootfall: '20,000+ logistics buyers',
    notableExpos: ['India Warehousing Show', 'LogiMAT India', 'Cargo Show International', 'Cold Chain Expo']
  },
  {
    name: 'Art & Lifestyle',
    slug: 'art-lifestyle',
    icon: 'Palette',
    color: '#d946ef',
    bg: 'bg-fuchsia-500/10',
    text: 'text-fuchsia-600 dark:text-fuchsia-400',
    border: 'border-fuchsia-500/30',
    scope: 'Contemporary art fairs, precious jewelry & gems, interior decor styling, luxury watches, and high-end lifestyle showcases.',
    subSectors: ['Contemporary Fine Art', 'Gold & Diamond Jewelry', 'Precious Gemstones', 'Luxury Home Decor', 'Photography Gear', 'Artisanal Handicrafts'],
    topHubs: ['New Delhi', 'Mumbai', 'Jaipur'],
    avgFootfall: '40,000+ art lovers & buyers',
    notableExpos: ['India Art Fair', 'IIJS Jewellery Show', 'Jaipur Jewellery Show', 'Design Mumbai']
  },
  {
    name: 'Trade & Industry',
    slug: 'trade-industry',
    icon: 'Briefcase',
    color: '#64748b',
    bg: 'bg-slate-500/10',
    text: 'text-slate-600 dark:text-slate-300',
    border: 'border-slate-500/30',
    scope: 'Cross-industry B2B commercial expos, multi-sector trade fairs, manufacturing conventions, hardware tools, and export councils.',
    subSectors: ['Industrial Engineering', 'Electrical & Power Tech', 'Plastics & Polymers', 'Packaging & Printing', 'Export Councils', 'MSME Multi-Sector'],
    topHubs: ['New Delhi', 'Mumbai', 'Bengaluru', 'Kolkata'],
    avgFootfall: '150,000+ business delegates',
    notableExpos: ['India International Trade Fair (IITF)', 'ELECRAMA Expo', 'PLASTINDIA', 'IMTEX Machine Tool Expo']
  }
];

function inferCategory(title = '', desc = '') {
  const text = `${title} ${desc}`.toLowerCase();
  if (/\b(travel|tourism|tourist|destination|hospitality|hotel|resort|leisure|flight|airline|cruise|mice|resa|iftm)\b/i.test(text)) return 'Travel & Tourism';
  if (/\b(auto|automobile|automotive|vehicles?|motor|motors|ev|evs|electric vehicle|mobility|tyre|tire)\b/i.test(text)) return 'Automotive & EV';
  if (/\b(airport|aviation|rotorcraft|air|aerospace)\b/i.test(text)) return 'Aerospace & Aviation';
  if (/\b(cargo|logistics|freight|transport|supply chain|warehousing|innotrans)\b/i.test(text)) return 'Logistics & Cargo';
  if (/\b(health|med|medical|pharma|cancer|doctor|hospital|surgical|pharmaexpo|iranpharma)\b/i.test(text)) return 'Healthcare & Pharma';
  if (/\b(build|building|construction|cement|concrete|infrastructure|municipal|architecture|foaid)\b/i.test(text)) return 'Construction & Infra';
  if (/\b(tech|technology|ai|software|cyber|iot|cloud|digital|broadcast|bes)\b/i.test(text)) return 'Technology & AI';
  if (/\b(textile|garment|fabric|yarn|fashion|apparel|dye|bisutex|clothing)\b/i.test(text)) return 'Textile & Fashion';
  if (/\b(rice|food|agriculture|bakery|crop|biofuel|grain|beverage|confectionery|agritech)\b/i.test(text)) return 'Agri & Food Tech';
  if (/\b(art|jewel|jewellery|jewelry|lifestyle|photo|handicraft|madridjoya)\b/i.test(text)) return 'Art & Lifestyle';
  return 'Trade & Industry';
}

let cachedData = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request) {
  const url = new URL(request?.url || 'http://localhost:3001/api/categories');
  const forceRefresh = url.searchParams.get('refresh') === 'true' || url.searchParams.has('t');

  const now = Date.now();
  if (!forceRefresh && cachedData && now - cacheTime < CACHE_TTL) {
    return NextResponse.json({ success: true, data: cachedData });
  }

  let events = [];

  // 1. Fetch from unified events directory endpoint on Express port 5000
  try {
    const dirRes = await fetch('http://localhost:5000/api/events/directory?refresh=true', {
      cache: 'no-store'
    });
    if (dirRes.ok) {
      const dirJson = await dirRes.json();
      const orgs = dirJson.data?.organizers || [];
      const allEvts = [];
      orgs.forEach((o) => {
        (o.events || []).forEach((e) => allEvts.push(e));
      });
      if (allEvts.length > 0) {
        events = allEvts;
      }
    }
  } catch (dirErr) {
    console.warn('[client-admin/api/categories] Fetch from /api/events/directory failed:', dirErr.message);
  }

  // 2. Fallback to client-dashboard on port 3000 if needed
  if (events.length === 0) {
    try {
      const res = await fetch('http://localhost:3000/api/wordpress-events', {
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.success && Array.isArray(data.events)) {
          events = data.events;
        }
      }
    } catch (err) {
      console.warn('[client-admin/api/categories] Fetch from localhost:3000 failed:', err.message);
    }
  }

  // 3. Fallback to direct WordPress inspect-event-meta endpoint if both above fail
  if (events.length === 0) {
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
        events = docs.map((d, i) => {
          const raw = d.raw || {};
          const title = raw.post_title || d.title || `Expo Edition ${i + 1}`;
          const content = raw.post_content || '';
          return {
            id: String(d.ID || i + 1),
            title,
            category: inferCategory(title, content),
            city: raw.city || d.city || 'India',
            venue: raw.venue || 'Exhibition Ground',
            dates: raw.event_date || 'Upcoming 2026',
            wpUrl: d.link || `https://visitexpo.in/?p=${d.ID || i + 1}`
          };
        });
      }
    } catch (wpErr) {
      console.warn('[client-admin/api/categories] WordPress direct fetch note:', wpErr.message);
    }
  }

  // Group events by category
  const categoriesMap = {};
  CATEGORIES_METADATA.forEach((meta) => {
    categoriesMap[meta.name] = {
      ...meta,
      count: 0,
      events: []
    };
  });

  events.forEach((evt) => {
    const catName = evt.category && categoriesMap[evt.category] ? evt.category : inferCategory(evt.title, evt.description || '');
    if (categoriesMap[catName]) {
      categoriesMap[catName].events.push(evt);
      categoriesMap[catName].count++;
    } else {
      categoriesMap['Trade & Industry'].events.push(evt);
      categoriesMap['Trade & Industry'].count++;
    }
  });

  const totalEvents = events.length;
  const categoriesList = Object.values(categoriesMap).map((cat) => ({
    ...cat,
    sharePercent: totalEvents > 0 ? Number(((cat.count / totalEvents) * 100).toFixed(1)) : 0
  }));

  cachedData = {
    totalCategories: categoriesList.length,
    totalEvents,
    categories: categoriesList
  };
  cacheTime = now;

  return NextResponse.json({
    success: true,
    data: cachedData
  });
}
