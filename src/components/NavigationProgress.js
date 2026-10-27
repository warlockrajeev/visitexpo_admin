'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const safetyTimeoutRef = useRef(null);

  const startLoading = () => {
    setLoading(true);
    setProgress(30);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(timerRef.current);
          return 90;
        }
        return prev + Math.floor(Math.random() * 15) + 10;
      });
    }, 80);

    // Auto-complete loading after 800ms max so the progress bar NEVER gets stuck or lingers
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
    safetyTimeoutRef.current = setTimeout(() => {
      completeLoading();
    }, 800);
  };

  const completeLoading = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
    setProgress(100);
    setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 200);
  };

  useEffect(() => {
    completeLoading();
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleLinkClick = (e) => {
      const anchor = e.target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      if (
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('javascript:') ||
        anchor.target === '_blank' ||
        anchor.hasAttribute('download')
      ) {
        return;
      }

      if (href.startsWith('http') && !href.startsWith(window.location.origin)) {
        return;
      }

      try {
        const url = new URL(href, window.location.origin);
        if (url.pathname === window.location.pathname) {
          if (url.search === window.location.search || url.hash) {
            return;
          }
        }
      } catch (_) {}

      startLoading();
    };

    window.addEventListener('click', handleLinkClick, true);

    return () => {
      window.removeEventListener('click', handleLinkClick, true);
      if (timerRef.current) clearInterval(timerRef.current);
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
    };
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[999999] pointer-events-none transition-all duration-150 ease-out"
      style={{ height: '2.5px' }}
    >
      <div
        className="h-full bg-gradient-to-r from-amber-500 via-[#FFCC00] to-yellow-300 shadow-[0_0_12px_rgba(255,204,0,0.8)] transition-all duration-100 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
