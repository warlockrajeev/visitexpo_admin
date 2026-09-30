'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSpinner, setShowSpinner] = useState(false);
  const timerRef = useRef(null);
  const spinnerTimerRef = useRef(null);

  const startLoading = () => {
    setLoading(true);
    setProgress(20);

    if (spinnerTimerRef.current) clearTimeout(spinnerTimerRef.current);
    spinnerTimerRef.current = setTimeout(() => {
      setShowSpinner(true);
    }, 200);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          clearInterval(timerRef.current);
          return 85;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 150);
  };

  const completeLoading = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (spinnerTimerRef.current) clearTimeout(spinnerTimerRef.current);
    setProgress(100);
    setShowSpinner(false);
    setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 250);
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
        if (url.pathname === window.location.pathname && url.search === window.location.search) {
          return;
        }
      } catch (_) {}

      startLoading();
    };

    const handleBeforeUnload = () => {
      startLoading();
    };

    window.addEventListener('click', handleLinkClick, true);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('click', handleLinkClick, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (timerRef.current) clearInterval(timerRef.current);
      if (spinnerTimerRef.current) clearTimeout(spinnerTimerRef.current);
    };
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <>
      {/* Top progress bar */}
      <div
        className="fixed top-0 left-0 right-0 z-[999999] pointer-events-none transition-all duration-200 ease-out"
        style={{ height: '3px' }}
      >
        <div
          className="h-full bg-gradient-to-r from-amber-500 via-[#FFCC00] to-yellow-300 shadow-[0_0_12px_rgba(255,204,0,0.8)] transition-all duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Floating loading indicator badge */}
      {showSpinner && (
        <div className="fixed top-4 right-4 z-[999999] pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/90 text-foreground text-xs font-bold border border-primary/40 shadow-2xl backdrop-blur-md">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <span className="text-[11px]">Loading...</span>
          </div>
        </div>
      )}
    </>
  );
}
