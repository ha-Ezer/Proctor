import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminStore } from '@/stores/adminStore';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  FileText,
  Users,
  Activity,
  LogOut,
  Shield,
  Menu,
  X,
  UsersRound,
  Table2,
  Database,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const { admin, clearAdmin } = useAdminStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    clearAdmin();
    navigate('/admin/login');
  };

  const navItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/exams', icon: FileText, label: 'Exams' },
    { to: '/admin/groups', icon: UsersRound, label: 'Groups' },
    { to: '/admin/students', icon: Users, label: 'Students' },
    { to: '/admin/sessions', icon: Activity, label: 'Sessions' },
    { to: '/admin/reports', icon: Table2, label: 'Exam Reports' },
    { to: '/admin/snapshots', icon: Database, label: 'Auto-Save Data' },
  ];

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Top Navigation Bar */}
        <header className="border-b border-border sticky top-0 z-40 shadow-sm backdrop-blur-md" style={{ backgroundColor: 'hsl(var(--card))' }}>
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
              {/* Logo */}
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 min-w-0">
                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex-shrink-0">
                  <Shield className="w-4 h-4 sm:w-6 sm:h-6 text-primary-foreground" />
                </div>
                <div className="min-w-0 hidden sm:block">
                  <h1 className="text-sm sm:text-lg font-bold text-foreground truncate">Proctor Admin</h1>
                  <p className="text-xs text-muted-foreground truncate">Exam Management System</p>
                </div>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center min-w-0 max-w-2xl mx-4">
                {navItems.map((item) => (
                  <Tooltip key={item.to}>
                    <TooltipTrigger asChild>
                      <NavLink
                        to={item.to}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )
                        }
                      >
                        <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="hidden xl:inline">{item.label}</span>
                      </NavLink>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </nav>

            {/* User Menu */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <ThemeToggle />
              <div className="hidden md:block text-right min-w-0">
                <p className="text-sm font-medium text-foreground truncate max-w-[120px]">{admin?.fullName}</p>
                <p className="text-xs text-muted-foreground capitalize truncate max-w-[120px]">{admin?.role?.replace('_', ' ')}</p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden md:inline">Logout</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Logout</p>
                </TooltipContent>
              </Tooltip>

              {/* Mobile Menu Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                  >
                    {isMobileMenuOpen ? (
                      <X className="w-6 h-6" />
                    ) : (
                      <Menu className="w-6 h-6" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isMobileMenuOpen ? "Close menu" : "Open menu"}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="lg:hidden border-t border-border py-2 px-4 backdrop-blur-md" style={{ backgroundColor: 'hsl(var(--card))' }}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
    </TooltipProvider>
  );
}
