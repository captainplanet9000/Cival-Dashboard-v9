'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OverviewPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the new ModernDashboardV4
    router.replace('/dashboard');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-lg">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}