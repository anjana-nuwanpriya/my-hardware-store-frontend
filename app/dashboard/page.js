'use client';

import AdminDashboard from '@/components/AdminDashboard';
import EnhancedNavigation from '@/components/EnhancedNavigation';
import SyncIndicator from '@/components/SyncIndicator';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedNavigation />
      <div className="fixed top-4 right-4 z-50">
        <SyncIndicator />
      </div>
      <AdminDashboard />
    </div>
  );
}