import { useEffect, useState } from 'react';
import { supabase, Week, WeeklyActivityTargets } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FileText, CheckCircle, Clock, AlertCircle, Target } from 'lucide-react';

type WeeklySubmission = {
  status: string;
  cold_calls: number;
  emails: number;
  li_messages: number;
  videos: number;
  decision_maker_connects: number;
  meetings_booked: number;
  discovery_calls: number;
  opportunities_advanced: number;
  pipeline_coverage_ratio: number;
};

export function RepDashboard({ onNavigate }: { onNavigate: (view: 'weekly' | 'history') => void }) {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState<Week | null>(null);
  const [submission, setSubmission] = useState<WeeklySubmission | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<'not_started' | 'in_progress' | 'submitted'>('not_started');
  const [targets, setTargets] = useState<WeeklyActivityTargets | null>(null);
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

        const { data: submissionData } = await supabase
          .from('weekly_submissions')
          .select('*')
          .eq('user_id', user.id)
          .eq('week_id', weekData.id)
          .maybeSingle();

        if (submissionData) {
          setSubmission(submissionData);
          setSubmissionStatus(submissionData.status);
        }
      }

      const { data: targetsData } = await supabase
        .from('weekly_activity_targets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (targetsData) {
        setTargets(targetsData);
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
            </div>
            {getStatusIcon(submissionStatus)}
          </div>

          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border mb-6 ${getStatusColor(submissionStatus)}`}>
            {getStatusText(submissionStatus)}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => onNavigate('weekly')}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors text-lg"
            >
              {submissionStatus === 'submitted' ? 'View Submission' : 'Start Your Weekly Update'}
            </button>

            <button
              onClick={() => onNavigate('history')}
              className="w-full bg-slate-100 text-slate-700 py-3 rounded-lg font-medium hover:bg-slate-200 transition-colors"
            >
              View and Edit My Submissions
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
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

      {targets && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Your Weekly Targets vs Actuals</h3>
          </div>
          <p className="text-sm text-slate-600 mb-4">Track your performance against your weekly activity targets</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-2">Cold Calls</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-slate-900">
                  {submission?.cold_calls || 0}
                </p>
                <p className="text-sm text-slate-500">/ {targets.target_cold_calls}</p>
              </div>
              <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${(submission?.cold_calls || 0) >= targets.target_cold_calls ? 'bg-emerald-600' : 'bg-blue-600'}`}
                  style={{ width: `${Math.min(((submission?.cold_calls || 0) / targets.target_cold_calls) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-2">Emails</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-slate-900">
                  {submission?.emails || 0}
                </p>
                <p className="text-sm text-slate-500">/ {targets.target_emails}</p>
              </div>
              <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${(submission?.emails || 0) >= targets.target_emails ? 'bg-emerald-600' : 'bg-blue-600'}`}
                  style={{ width: `${Math.min(((submission?.emails || 0) / targets.target_emails) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-2">LinkedIn Messages</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-slate-900">
                  {submission?.li_messages || 0}
                </p>
                <p className="text-sm text-slate-500">/ {targets.target_li_messages}</p>
              </div>
              <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${(submission?.li_messages || 0) >= targets.target_li_messages ? 'bg-emerald-600' : 'bg-blue-600'}`}
                  style={{ width: `${Math.min(((submission?.li_messages || 0) / targets.target_li_messages) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-2">Videos</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-slate-900">
                  {submission?.videos || 0}
                </p>
                <p className="text-sm text-slate-500">/ {targets.target_videos}</p>
              </div>
              <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${(submission?.videos || 0) >= targets.target_videos ? 'bg-emerald-600' : 'bg-blue-600'}`}
                  style={{ width: `${Math.min(((submission?.videos || 0) / targets.target_videos) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-2">DM Connects</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-slate-900">
                  {submission?.decision_maker_connects || 0}
                </p>
                <p className="text-sm text-slate-500">/ {targets.target_dm_connects}</p>
              </div>
              <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${(submission?.decision_maker_connects || 0) >= targets.target_dm_connects ? 'bg-emerald-600' : 'bg-blue-600'}`}
                  style={{ width: `${Math.min(((submission?.decision_maker_connects || 0) / targets.target_dm_connects) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-2">Meetings Booked</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-slate-900">
                  {submission?.meetings_booked || 0}
                </p>
                <p className="text-sm text-slate-500">/ {targets.target_meetings_booked}</p>
              </div>
              <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${(submission?.meetings_booked || 0) >= targets.target_meetings_booked ? 'bg-emerald-600' : 'bg-blue-600'}`}
                  style={{ width: `${Math.min(((submission?.meetings_booked || 0) / targets.target_meetings_booked) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-2">Discovery Calls</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-slate-900">
                  {submission?.discovery_calls || 0}
                </p>
                <p className="text-sm text-slate-500">/ {targets.target_discovery_calls}</p>
              </div>
              <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${(submission?.discovery_calls || 0) >= targets.target_discovery_calls ? 'bg-emerald-600' : 'bg-blue-600'}`}
                  style={{ width: `${Math.min(((submission?.discovery_calls || 0) / targets.target_discovery_calls) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-2">Opportunities Advanced</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-slate-900">
                  {submission?.opportunities_advanced || 0}
                </p>
                <p className="text-sm text-slate-500">/ {targets.target_opportunities_advanced}</p>
              </div>
              <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${(submission?.opportunities_advanced || 0) >= targets.target_opportunities_advanced ? 'bg-emerald-600' : 'bg-blue-600'}`}
                  style={{ width: `${Math.min(((submission?.opportunities_advanced || 0) / targets.target_opportunities_advanced) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-2">Pipeline Coverage</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-slate-900">
                  {(submission?.pipeline_coverage_ratio || 0).toFixed(1)}x
                </p>
                <p className="text-sm text-slate-500">/ {targets.target_pipeline_coverage}x</p>
              </div>
              <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${(submission?.pipeline_coverage_ratio || 0) >= targets.target_pipeline_coverage ? 'bg-emerald-600' : 'bg-blue-600'}`}
                  style={{ width: `${Math.min(((submission?.pipeline_coverage_ratio || 0) / targets.target_pipeline_coverage) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
