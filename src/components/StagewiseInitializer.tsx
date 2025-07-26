'use client';

import { useEffect } from 'react';

export default function StagewiseInitializer() {
  useEffect(() => {
    // Only run in development mode and browser environment
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      // Import only the core package
      import('@stagewise/toolbar-next').then((stagewise) => {
        const { StagewiseToolbar } = stagewise;
        
        // Get the container element
        const container = document.getElementById('stagewise-toolbar-container');
        if (container) {
          // Create the toolbar instance
          const toolbar = document.createElement('div');
          container.appendChild(toolbar);
          
          // Render the toolbar with minimal config
          const { createRoot } = require('react-dom/client');
          const root = createRoot(toolbar);
          root.render(<StagewiseToolbar config={{ plugins: [] }} />);
        }
      }).catch(console.error);
    }
  }, []);
  
  return null;
} 