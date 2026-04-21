import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { RepDashboard } from './components/RepDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { WeeklySubmissionForm } from './components/WeeklySubmissionForm';
import { BdrSubmissionForm } from './components/BdrSubmissionForm';

function AppContent() {
  const { session, user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'weekly' | 'admin'>('dashboard');
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);

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
    if (view === 'dashboard') setSelectedWeekId(null);
  };

  const handleEnterWeek = (weekId: string) => {
    setSelectedWeekId(weekId);
    setCurrentView('weekly');
  };

  const renderContent = () => {
    if (user.role === 'admin') {
      return <AdminDashboard key={currentView} />;
    }

    if (currentView === 'weekly' && selectedWeekId) {
      if (user.role === 'bdr') {
        return (
          <BdrSubmissionForm
            weekId={selectedWeekId}
            onBack={() => { setCurrentView('dashboard'); setSelectedWeekId(null); }}
          />
        );
      }
      return (
        <WeeklySubmissionForm
          weekId={selectedWeekId}
          onBack={() => { setCurrentView('dashboard'); setSelectedWeekId(null); }}
        />
      );
    }

    return <RepDashboard key={currentView} onEnterWeek={handleEnterWeek} />;
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
