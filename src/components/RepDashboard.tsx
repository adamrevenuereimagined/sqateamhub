import { useEffect, useState } from 'react';
import { supabase, Week } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export function RepDashboard({ onNavigate }: { onNavigate: (view: 'weekly') => void }) {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState<Week | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<'not_started' | 'in_progress' | 'submitted'>('not_started');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user?.id]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const { data: weekData } = await supabase
        .from('weeks')
        .select('*')
        .eq('status', 'active')
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (weekData) {
        setCurrentWeek(weekData);

        const { data: submission } = await supabase
          .from('weekly_submissions')
          .select('status')
          .eq('user_id', user.id)
          .eq('week_id', weekData.id)
          .maybeSingle();

        if (submission) {
          setSubmissionStatus(submission.status);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <CheckCircle className="w-6 h-6 text-emerald-600" />;
      case 'in_progress':
        return <Clock className="w-6 h-6 text-amber-600" />;
      default:
        return <AlertCircle className="w-6 h-6 text-slate-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'Submitted';
      case 'in_progress':
        return 'In Progress';
      default:
        return 'Not Started';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'in_progress':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          Welcome back, {user?.name}
        </h2>
        {currentWeek && (
          <p className="text-slate-600">
            Week of {new Date(currentWeek.start_date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        )}
      </div>

      <div className="max-w-2xl mx-auto mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <FileText className="w-10 h-10 text-emerald-600" />
                <h3 className="text-2xl font-semibold text-slate-900">Weekly Submission</h3>
              </div>
              <p className="text-slate-600">
                Complete your weekly update by Thursday 5:00 PM PT
              </p>
              <p className="text-sm text-slate-500 mt-2">
                One form for all your weekly updates - no more duplicate entry!
              </p>
            </div>
            {getStatusIcon(submissionStatus)}
          </div>

          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border mb-6 ${getStatusColor(submissionStatus)}`}>
            {getStatusText(submissionStatus)}
          </div>

          <button
            onClick={() => onNavigate('weekly')}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors text-lg"
          >
            {submissionStatus === 'submitted' ? 'View Submission' : 'Start Your Weekly Update'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Info</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-slate-600 mb-1">Quarterly Quota</p>
            <p className="text-2xl font-bold text-slate-900">
              ${user?.quarterly_quota.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">Submission Deadline</p>
            <p className="text-lg font-semibold text-slate-900">Thursday 5:00 PM PT</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">Team Meeting</p>
            <p className="text-lg font-semibold text-slate-900">Friday Morning</p>
          </div>
        </div>
      </div>
    </div>
  );
}
