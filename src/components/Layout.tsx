import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Home, FileText, Users } from 'lucide-react';

type LayoutProps = {
  children: ReactNode;
  currentView: 'dashboard' | 'weekly' | 'history' | 'admin';
  onNavigate: (view: 'dashboard' | 'weekly' | 'history' | 'admin') => void;
};

export function Layout({ children, currentView, onNavigate }: LayoutProps) {
  const { user, signOut, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-slate-900">
                SQA BD Team Hub
              </h1>

              <div className="hidden md:flex space-x-1">
                {!isAdmin ? (
                  <>
                    <button
                      onClick={() => onNavigate('dashboard')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        currentView === 'dashboard'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Home className="w-4 h-4 inline mr-2" />
                      Dashboard
                    </button>

                    <button
                      onClick={() => onNavigate('weekly')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        currentView === 'weekly'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <FileText className="w-4 h-4 inline mr-2" />
                      Weekly Submission
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onNavigate('admin')}
                    className="px-4 py-2 rounded-lg font-medium bg-emerald-50 text-emerald-700"
                  >
                    <Users className="w-4 h-4 inline mr-2" />
                    Team Dashboard
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-slate-900">{user?.name}</div>
                <div className="text-xs text-slate-500">
                  {user?.role === 'admin' ? 'Manager' : 'Sales Rep'}
                </div>
              </div>

              <button
                onClick={signOut}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
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
