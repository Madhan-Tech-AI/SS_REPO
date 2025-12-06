import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Calendar,
  FileText,
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

interface DashboardSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Events', path: '/dashboard/events', icon: Calendar },
  { name: 'My Registrations', path: '/dashboard/registrations', icon: FileText },
];

export const DashboardSidebar = ({ 
  collapsed, 
  onToggle, 
  isMobile = false,
  isMobileMenuOpen = false,
  setIsMobileMenuOpen
}: DashboardSidebarProps) => {
  const location = useLocation();

  const handleLinkClick = () => {
    if (isMobile && setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  const SidebarContent = () => (
    <>
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
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
            <div className="p-4 border-b border-sidebar-border flex items-center justify-end">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
              >
                <X className="w-5 h-5 text-sidebar-foreground" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Sidebar that scrolls with content
  return (
    <aside
      className={cn(
        'relative bg-sidebar border-r border-sidebar-border transition-all duration-300 z-30 flex flex-col flex-shrink-0',
        'self-start', // Align to top of flex container
        'min-h-[calc(100vh-104px)]', // Minimum height to match viewport
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <SidebarContent />
    </aside>
  );
};
