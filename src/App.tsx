import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { RepDashboard } from './components/RepDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { WeeklySubmissionForm } from './components/WeeklySubmissionForm';
import { PastSubmissions } from './components/PastSubmissions';

function AppContent() {
  const { session, user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'weekly' | 'admin' | 'history'>('dashboard');

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

  const handleNavigate = (view: 'dashboard' | 'weekly' | 'admin' | 'history') => {
    setCurrentView(view);
  };

  const renderContent = () => {
    if (user.role === 'rep') {
      if (currentView === 'history') {
        return <PastSubmissions onBack={() => setCurrentView('dashboard')} />;
      }
      return <WeeklySubmissionForm onBack={() => setCurrentView('history')} />;
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
