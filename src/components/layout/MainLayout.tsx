import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ScrollToTop } from '@/components/shared/ScrollToTop';
import { AnnouncementBanner } from '@/components/shared/AnnouncementBanner';
import { cn } from '@/lib/utils';

export const MainLayout = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isDashboardPage = location.pathname.startsWith('/dashboard');
  const isVotingPage = location.pathname.startsWith('/voting');

  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBanner />
      <Navbar />
      <main className={cn('flex-1', !isHomePage && !isDashboardPage && !isVotingPage && 'pt-[120px]')}>
        <Outlet />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};
