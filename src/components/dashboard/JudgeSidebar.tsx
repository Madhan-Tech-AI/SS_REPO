import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Eye,
  Trophy,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

interface JudgeSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

const judgeNavItems: NavItem[] = [
  { name: 'Dashboard', path: '/judge/dashboard', icon: LayoutDashboard },
  { name: 'Submissions', path: '/judge/dashboard/submissions', icon: FileText },
  { name: 'Entries', path: '/judge/dashboard/entries', icon: Eye },
  { name: 'Leaderboard', path: '/judge/dashboard/leaderboard', icon: Trophy },
  { name: 'My Profile', path: '/judge/dashboard/profile', icon: User },
];

export const JudgeSidebar = ({ 
  collapsed, 
  onToggle, 
  isMobile = false,
  isMobileMenuOpen = false,
  setIsMobileMenuOpen
}: JudgeSidebarProps) => {
  const { logout } = useAuth();
  const location = useLocation();

  const handleLinkClick = () => {
    if (isMobile && setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        <Link to="/" className="flex items-center group" onClick={handleLinkClick}>
          <div className="h-10 sm:h-12 px-2 sm:px-4 py-1 bg-[#DC143C] rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 shadow-md overflow-hidden">
            <img 
              src="/assets/logo.png" 
              alt="Story Seed Studio" 
              className="h-10 sm:h-12 w-auto scale-150"
            />
          </div>
        </Link>
        {isMobile && setIsMobileMenuOpen && (
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            <X className="w-5 h-5 text-sidebar-foreground" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {judgeNavItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleLinkClick}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {(!collapsed || isMobile) && (
                <span className="font-medium animate-fade-in">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={() => {
            logout();
            window.location.href = '/';
          }}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors w-full',
            (collapsed && !isMobile) && 'justify-center'
          )}
        >
          <LogOut className="w-5 h-5" />
          {(!collapsed || isMobile) && <span className="font-medium">Logout</span>}
        </button>
      </div>

      {/* Collapse Toggle - Only show on desktop */}
      {!isMobile && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-sidebar-primary text-sidebar-primary-foreground rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform z-10"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      )}
    </>
  );

  // Mobile: Use Sheet component
  if (isMobile) {
    return (
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] p-0 bg-sidebar text-sidebar-foreground [&>button]:hidden">
          <div className="flex flex-col h-full">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Fixed sidebar
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 z-50 flex flex-col',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <SidebarContent />
    </aside>
  );
};

