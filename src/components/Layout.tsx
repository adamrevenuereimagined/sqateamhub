import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Home, Users } from 'lucide-react';

type LayoutProps = {
  children: ReactNode;
  currentView: 'dashboard' | 'weekly' | 'admin';
  onNavigate: (view: 'dashboard' | 'weekly' | 'admin') => void;
};

const roleLabels: Record<string, string> = {
  admin: 'Executive',
  bdr: 'BDR',
  rep: 'Sales Rep',
};

const roleStyles: Record<string, string> = {
  admin: 'bg-brand-100 text-brand-700',
  bdr: 'bg-accent-100 text-accent-700',
  rep: 'bg-slate-200 text-slate-700',
};

export function Layout({ children, currentView, onNavigate }: LayoutProps) {
  const { user, signOut, isAdmin } = useAuth();
  const initials = user?.name
    ?.split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?';

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white/90 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2.5 group rounded-lg -ml-1 px-1 py-1"
                aria-label="Go to dashboard"
              >
                <img src="/sqa-logo.svg" alt="" className="h-8 w-auto" />
                <span className="text-[15px] font-semibold text-slate-900 tracking-tight hidden sm:inline">
                  BD Team Hub
                </span>
              </button>

              <div className="hidden md:flex items-center gap-1">
                {isAdmin ? (
                  <NavButton active icon={<Users className="h-4 w-4" />}>
                    Team Dashboard
                  </NavButton>
                ) : (
                  <NavButton
                    active={currentView === 'dashboard'}
                    onClick={() => onNavigate('dashboard')}
                    icon={<Home className="h-4 w-4" />}
                  >
                    Dashboard
                  </NavButton>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user && (
                <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-slate-200">
                  <div className="text-right leading-tight">
                    <div className="text-sm font-medium text-slate-900">{user.name}</div>
                    <span className={`inline-block text-[11px] font-medium px-1.5 py-0.5 rounded ${roleStyles[user.role] ?? 'bg-slate-100 text-slate-600'}`}>
                      {roleLabels[user.role] ?? user.role}
                    </span>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-brand-700 text-white text-sm font-semibold flex items-center justify-center">
                    {initials}
                  </div>
                </div>
              )}

              <button
                onClick={signOut}
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

type NavButtonProps = {
  active?: boolean;
  onClick?: () => void;
  icon?: ReactNode;
  children: ReactNode;
};

function NavButton({ active, onClick, icon, children }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-brand-50 text-brand-700'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
