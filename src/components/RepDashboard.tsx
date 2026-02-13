import { useEffect, useState } from 'react';
import { supabase, Week } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ClipboardList, Edit3, DollarSign, Target, TrendingUp, Briefcase, ChevronRight } from 'lucide-react';
import { formatDate, parseLocalDate } from '../lib/dateUtils';

type SubmissionBrief = {
  week_id: string;
  status: string;
  revenue_mtd: number;
  revenue_qtd: number;
  pipeline_coverage_ratio: number;
};

type Props = {
  onEnterWeek: (weekId: string) => void;
};

export function RepDashboard({ onEnterWeek }: Props) {
  const { user } = useAuth();
  const [allWeeks, setAllWeeks] = useState<Week[]>([]);
  const [submittedWeeks, setSubmittedWeeks] = useState<Week[]>([]);
  const [submittedWeekIds, setSubmittedWeekIds] = useState<Set<string>>(new Set());
  const [selectedNewWeekId, setSelectedNewWeekId] = useState('');
  const [selectedEditWeekId, setSelectedEditWeekId] = useState('');
  const [cumulativeMTD, setCumulativeMTD] = useState(0);
  const [cumulativeQTD, setCumulativeQTD] = useState(0);
  const [latestPipeline, setLatestPipeline] = useState(0);
  const [hasSubmissions, setHasSubmissions] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [weeksResult, submissionsResult] = await Promise.all([
        supabase.from('weeks').select('*').order('start_date', { ascending: false }),
        supabase.from('weekly_submissions')
          .select('week_id, status, revenue_mtd, revenue_qtd, pipeline_coverage_ratio')
          .eq('user_id', user.id)
      ]);

      const weeks = weeksResult.data || [];
      const submissions = submissionsResult.data || [];

      setAllWeeks(weeks);

      const submissionMap = new Map<string, SubmissionBrief>();
      submissions.forEach(s => submissionMap.set(s.week_id, s as SubmissionBrief));

      const submitted = new Set<string>();
      submissions.filter(s => s.status === 'submitted').forEach(s => submitted.add(s.week_id));
      setSubmittedWeekIds(submitted);

      const submWeeks = weeks.filter(w => submitted.has(w.id));
      setSubmittedWeeks(submWeeks);

      if (submWeeks.length > 0) {
        setSelectedEditWeekId(submWeeks[0].id);
      }

      const activeWeek = weeks.find(w => w.status === 'active');
      setSelectedNewWeekId(activeWeek?.id || weeks[0]?.id || '');

      const refWeek = activeWeek || weeks[0];
      if (refWeek && submissions.length > 0) {
        setHasSubmissions(true);

        const refDate = parseLocalDate(refWeek.end_date);
        const refMonth = refDate.getMonth();
        const refYear = refDate.getFullYear();
        const refQuarter = Math.floor(refMonth / 3);

        const monthWeekIds = new Set(
          weeks.filter(w => {
            const d = parseLocalDate(w.end_date);
            return d.getMonth() === refMonth && d.getFullYear() === refYear;
          }).map(w => w.id)
        );

        const quarterWeekIds = new Set(
          weeks.filter(w => {
            const d = parseLocalDate(w.end_date);
            return Math.floor(d.getMonth() / 3) === refQuarter && d.getFullYear() === refYear;
          }).map(w => w.id)
        );

        const mtdTotal = submissions
          .filter(s => monthWeekIds.has(s.week_id))
          .reduce((sum, s) => sum + (s.revenue_mtd || 0), 0);
        setCumulativeMTD(mtdTotal);

        const qtdTotal = submissions
          .filter(s => quarterWeekIds.has(s.week_id))
          .reduce((sum, s) => sum + (s.revenue_qtd || 0), 0);
        setCumulativeQTD(qtdTotal);

        for (const week of weeks) {
          const sub = submissionMap.get(week.id);
          if (sub && sub.pipeline_coverage_ratio > 0) {
            setLatestPipeline(sub.pipeline_coverage_ratio);
            break;
          }
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

  const quota = user?.quarterly_quota || 0;
  const qtdProgress = quota > 0 ? Math.min((cumulativeQTD / quota) * 100, 100) : 0;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-1">
          Welcome back, {user?.name}
        </h2>
        <p className="text-slate-500">
          Track your progress and submit your weekly reports
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <Target className="w-4 h-4 text-slate-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">Quarterly Quota</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">${quota.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">MTD Revenue</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {hasSubmissions ? `$${cumulativeMTD.toLocaleString()}` : '--'}
          </p>
          {!hasSubmissions && (
            <p className="text-xs text-slate-400 mt-1">Submit a report to track</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">QTD Revenue</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {hasSubmissions ? `$${cumulativeQTD.toLocaleString()}` : '--'}
          </p>
          {!hasSubmissions && (
            <p className="text-xs text-slate-400 mt-1">Submit a report to track</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-teal-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">QTD % to Quota</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {hasSubmissions ? `${qtdProgress.toFixed(1)}%` : '--'}
          </p>
          {hasSubmissions && (
            <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  qtdProgress >= 100
                    ? 'bg-emerald-500'
                    : qtdProgress >= 75
                    ? 'bg-blue-500'
                    : qtdProgress >= 50
                    ? 'bg-amber-500'
                    : 'bg-red-400'
                }`}
                style={{ width: `${qtdProgress}%` }}
              />
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">Pipeline</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {hasSubmissions && latestPipeline > 0 ? `$${latestPipeline.toLocaleString()}` : '--'}
          </p>
          {hasSubmissions && latestPipeline > 0 && quota > 0 && (
            <p className="text-xs text-slate-500 mt-1">
              {(latestPipeline / quota).toFixed(1)}x quota coverage
            </p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-emerald-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <ClipboardList className="w-6 h-6 text-white" />
              <h3 className="text-lg font-semibold text-white">Enter Weekly Report</h3>
            </div>
            <p className="text-emerald-100 text-sm mt-1">
              Submit your weekly metrics and updates
            </p>
          </div>
          <div className="p-6">
            {allWeeks.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-slate-500">No weeks available yet</p>
                <p className="text-sm text-slate-400 mt-1">
                  Contact your admin to set up weeks for this quarter
                </p>
              </div>
            ) : (
              <>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Week
                </label>
                <select
                  value={selectedNewWeekId}
                  onChange={(e) => setSelectedNewWeekId(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 mb-4 text-slate-900"
                >
                  {allWeeks.map(week => (
                    <option key={week.id} value={week.id}>
                      Week ending {formatDate(week.end_date)}
                      {week.status === 'active' ? ' (Current)' : ''}
                      {submittedWeekIds.has(week.id) ? ' - Submitted' : ''}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => onEnterWeek(selectedNewWeekId)}
                  disabled={!selectedNewWeekId}
                  className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Open Report
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-700 px-6 py-4">
            <div className="flex items-center gap-3">
              <Edit3 className="w-6 h-6 text-white" />
              <h3 className="text-lg font-semibold text-white">Edit Previous Submission</h3>
            </div>
            <p className="text-slate-300 text-sm mt-1">
              Review and update previously submitted reports
            </p>
          </div>
          <div className="p-6">
            {submittedWeeks.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-slate-500">No submitted reports yet</p>
                <p className="text-sm text-slate-400 mt-1">
                  Submit your first weekly report to see it here
                </p>
              </div>
            ) : (
              <>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Submitted Week
                </label>
                <select
                  value={selectedEditWeekId}
                  onChange={(e) => setSelectedEditWeekId(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 mb-4 text-slate-900"
                >
                  {submittedWeeks.map(week => (
                    <option key={week.id} value={week.id}>
                      Week ending {formatDate(week.end_date)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => onEnterWeek(selectedEditWeekId)}
                  disabled={!selectedEditWeekId}
                  className="w-full bg-slate-700 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Edit Submission
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
