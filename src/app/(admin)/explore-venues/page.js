'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminExploreVenuesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/venues');
  }, [router]);

  return (
    <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      <span>Redirecting to Venues Directory...</span>
    </div>
  );
}
