import type { ReactNode } from 'react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
      <div className="flex min-h-screen w-full">
        <div className="flex flex-1 flex-col">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
  );
}
