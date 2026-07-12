import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

/**
 * Shell layout container framing the sidebar, topbar, and main content routing panels.
 */
export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex">
      {/* Fixed Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 pl-16 md:pl-56">
        {/* Top Header Bar */}
        <Topbar />

        {/* Dynamic Inner Body Area */}
        <main className="flex-1 pt-16 p-6 overflow-y-auto animate-fade-in">
          <div className="mx-auto max-w-7xl space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
