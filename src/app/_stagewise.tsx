'use client';

import dynamic from 'next/dynamic';

// Dynamically import the Stagewise initializer with no SSR
const StagewiseInitializer = dynamic(
  () => import('@/components/StagewiseInitializer'),
  { ssr: false }
);

export function StagewiseLoader() {
  // Only load in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return <StagewiseInitializer />;
} 