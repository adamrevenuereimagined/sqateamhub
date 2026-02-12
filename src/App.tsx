import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { RepDashboard } from './components/RepDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { WeeklySubmissionForm } from './components/WeeklySubmissionForm';

function AppContent() {
  const { session, user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'weekly' | 'admin'>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!session || !user) {
    return <Login />;
  }

  const handleNavigate = (view: 'dashboard' | 'weekly' | 'admin') => {
    setCurrentView(view);
  };

  const renderContent = () => {
    if (user.role === 'rep') {
      switch (currentView) {
        case 'weekly':
          return <WeeklySubmissionForm onBack={() => setCurrentView('dashboard')} />;
        default:
          return <RepDashboard onNavigate={handleNavigate} />;
      }
    } else {
      return <AdminDashboard />;
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={handleNavigate}>
      {renderContent()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
