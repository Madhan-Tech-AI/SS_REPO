import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { JudgeSidebar } from './JudgeSidebar';
import { JudgeHeader } from './JudgeHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export const JudgeLayout = () => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || role !== 'judge') {
    return <Navigate to="/judge" replace />;
  }

  return (
    <div className="bg-muted/30">
      <JudgeHeader 
        onMenuClick={() => setIsMobileMenuOpen(true)}
        isMobile={isMobile}
        sidebarCollapsed={isSidebarCollapsed}
      />
      <JudgeSidebar
        collapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobile={isMobile}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      <div 
        className={cn(
          'transition-all duration-300 min-h-[calc(100vh-104px)]',
          isMobile ? 'ml-0' : isSidebarCollapsed ? 'ml-20' : 'ml-64'
        )}
      >
        <main className="p-3 sm:p-4 md:p-6 page-enter w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

