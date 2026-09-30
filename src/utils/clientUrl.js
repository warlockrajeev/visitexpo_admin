/**
 * @file clientUrl.js
 * @description Dynamically resolves the VisitExpo Client Portal URL based on runtime hostname,
 * environment variables, and deployment context to ensure links always point to production
 * (https://client.visitexpo.in) when deployed.
 */

export function getClientUrl() {
  // 1. Runtime browser-side detection
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname.toLowerCase();
    if (hostname.includes('visitexpo.in') || hostname.includes('vercel.app') || hostname.includes('onrender.com')) {
      return 'https://client.visitexpo.in';
    }
  }

  // 2. Explicit environment variable
  if (process.env.NEXT_PUBLIC_CLIENT_URL) {
    return process.env.NEXT_PUBLIC_CLIENT_URL.replace(/\/$/, '');
  }

  // 3. Server-side or build-time production fallback
  if (process.env.NODE_ENV === 'production') {
    return 'https://client.visitexpo.in';
  }

  // 4. Local development default
  return 'http://localhost:3000';
}
