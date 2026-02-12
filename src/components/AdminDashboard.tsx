import { useEffect, useState } from 'react';
import { supabase, Week, User } from '../lib/supabase';
import { CheckCircle, Clock, AlertCircle, Users, TrendingUp, DollarSign } from 'lucide-react';

export function AdminDashboard() {
  const [currentWeek, setCurrentWeek] = useState<Week | null>(null);
  const [reps, setReps] = useState<User[]>([]);
  const [submissionStatus, setSubmissionStatus] = useState<{
    [userId: string]: 'submitted' | 'in_progress' | 'not_started';
  }>({});
  const [teamMetrics, setTeamMetrics] = useState({
    totalRevenueMTD: 0,
    totalRevenueQTD: 0,
    totalProspectingActivities: 0,
    totalDMConnects: 0,
    totalDiscoveryCalls: 0,
    avgPipelineCoverage: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
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
      }

      const { data: repsData } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'rep')
        .eq('is_active', true)
        .order('name');

      if (repsData) {
        setReps(repsData as User[]);

        if (weekData) {
          await loadSubmissionStatus(weekData.id, repsData as User[]);
          await loadTeamMetrics(weekData.id, repsData as User[]);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissionStatus = async (weekId: string, repsList: User[]) => {
    const status: {
      [userId: string]: 'submitted' | 'in_progress' | 'not_started';
    } = {};

    for (const rep of repsList) {
      const { data: submission } = await supabase
        .from('weekly_submissions')
        .select('status')
        .eq('user_id', rep.id)
        .eq('week_id', weekId)
        .maybeSingle();

      status[rep.id] = submission?.status || 'not_started';
    }

    setSubmissionStatus(status);
  };

  const loadTeamMetrics = async (weekId: string, repsList: User[]) => {
    const { data: submissions } = await supabase
      .from('weekly_submissions')
      .select('*')
      .eq('week_id', weekId);

    if (submissions && submissions.length > 0) {
      const totalRevMTD = submissions.reduce((sum, s) => sum + (s.revenue_mtd || 0), 0);
      const totalRevQTD = submissions.reduce((sum, s) => sum + (s.revenue_qtd || 0), 0);
      const totalProspecting = submissions.reduce((sum, s) => sum + (s.prospecting_activities || 0), 0);
      const totalDM = submissions.reduce((sum, s) => sum + (s.decision_maker_connects || 0), 0);
      const totalDiscovery = submissions.reduce((sum, s) => sum + (s.discovery_calls || 0), 0);
      const avgCoverage = submissions.reduce((sum, s) => sum + (s.pipeline_coverage_ratio || 0), 0) / submissions.length;

      setTeamMetrics({
        totalRevenueMTD: totalRevMTD,
        totalRevenueQTD: totalRevQTD,
        totalProspectingActivities: totalProspecting,
        totalDMConnects: totalDM,
        totalDiscoveryCalls: totalDiscovery,
        avgPipelineCoverage: avgCoverage
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-amber-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-emerald-50';
      case 'in_progress':
        return 'bg-amber-50';
      default:
        return 'bg-red-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          Admin Dashboard
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

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Team MTD Revenue</span>
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            ${teamMetrics.totalRevenueMTD.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Team QTD Revenue</span>
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            ${teamMetrics.totalRevenueQTD.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">DM Connects</span>
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {teamMetrics.totalDMConnects}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Avg Pipeline Coverage</span>
            <TrendingUp className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {teamMetrics.avgPipelineCoverage.toFixed(1)}x
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <h3 className="text-xl font-semibold text-slate-900 mb-4">
          Submission Tracker
        </h3>
        <p className="text-sm text-slate-600 mb-6">
          Track completion status for weekly submissions (due Thursdays 5pm PT)
        </p>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">
                  Rep
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-900">
                  Quarterly Quota
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-900">
                  Weekly Submission
                </th>
              </tr>
            </thead>
            <tbody>
              {reps.map((rep) => {
                const status = submissionStatus[rep.id] || 'not_started';

                return (
                  <tr key={rep.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-slate-900">{rep.name}</p>
                        <p className="text-sm text-slate-500">{rep.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <p className="font-semibold text-slate-900">
                        ${rep.quarterly_quota.toLocaleString()}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <div className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg ${getStatusColor(status)}`}>
                        {getStatusIcon(status)}
                        <span className="text-sm font-medium capitalize">
                          {status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Team Activity Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total Prospecting Activities</span>
              <span className="text-lg font-semibold text-slate-900">
                {teamMetrics.totalProspectingActivities}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total DM Connects</span>
              <span className="text-lg font-semibold text-slate-900">
                {teamMetrics.totalDMConnects}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total Discovery Calls</span>
              <span className="text-lg font-semibold text-slate-900">
                {teamMetrics.totalDiscoveryCalls}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">
              <p className="font-medium text-emerald-900">View All Submissions</p>
              <p className="text-sm text-emerald-700">Review detailed weekly updates from team</p>
            </button>
            <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <p className="font-medium text-blue-900">Team Meeting Prep</p>
              <p className="text-sm text-blue-700">Prepare for Friday meeting with all data</p>
            </button>
            <button className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
              <p className="font-medium text-slate-900">Send Reminder</p>
              <p className="text-sm text-slate-700">Notify reps with pending submissions</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
