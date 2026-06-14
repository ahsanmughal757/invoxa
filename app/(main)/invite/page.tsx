'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InvitePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard since there's no general invite page
    router.push('/dashboard');
  }, [router]);

  return null; // Render nothing since we're redirecting
}