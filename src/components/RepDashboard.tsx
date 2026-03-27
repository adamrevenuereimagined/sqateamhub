import { useEffect, useState } from 'react';
import { supabase, Week, parseNumericFields } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ClipboardList, CreditCard as Edit3, DollarSign, Target, TrendingUp, Briefcase, ChevronRight } from 'lucide-react';
import { formatDate, parseLocalDate } from '../lib/dateUtils';
import { formatCurrency, formatNumber } from '../lib/formatters';
import { MetricsTrendGraph } from './MetricsTrendGraph';

type SubmissionBrief = {
  week_id: string;
  status: string;
  revenue_mtd: number;
  revenue_qtd: number;
  pipeline_coverage_ratio: number;
  deals_won_this_week?: number;
  deals_advancing_this_week?: number;
};

type TrendDataPoint = {
  weekLabel: string;
  qtdRevenue: number;
  mtdRevenue: number;
  pipeline: number;
  dealsWon: number;
  dealsAdvancing: number;
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
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'qtd' | 'mtd' | 'pipeline' | 'dealsWon' | 'dealsAdvancing'>('qtd');

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [weeksResult, submissionsResult] = await Promise.all([
        supabase.from('weeks').select('*').order('start_date', { ascending: true }),
        supabase.from('weekly_submissions')
          .select('week_id, status, revenue_mtd, revenue_qtd, pipeline_coverage_ratio, deals_won_this_week, deals_advancing')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      const weeks = weeksResult.data || [];
      const rawSubmissions = submissionsResult.data || [];
      const submissions = rawSubmissions.map(sub =>
        parseNumericFields(sub, ['revenue_mtd', 'revenue_qtd', 'pipeline_coverage_ratio', 'deals_won_this_week'])
      );

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

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const currentWeekByDate = weeks.find(w => {
        const startDate = parseLocalDate(w.start_date);
        const endDate = parseLocalDate(w.end_date);
        return today >= startDate && today <= endDate;
      });

      const defaultWeek = currentWeekByDate || activeWeek || weeks[0];
      setSelectedNewWeekId(defaultWeek?.id || '');

      const refWeek = currentWeekByDate || activeWeek || weeks[0];
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

        const weekMap = new Map(weeks.map(w => [w.id, w]));

        const mtdSubmissions = submissions.filter(s => monthWeekIds.has(s.week_id));
        const latestMtdSubmission = mtdSubmissions.length > 0
          ? mtdSubmissions.reduce((latest, s) => {
              const latestWeek = weekMap.get(latest.week_id);
              const currentWeek = weekMap.get(s.week_id);
              if (!latestWeek || !currentWeek) return latest;
              return new Date(currentWeek.end_date) > new Date(latestWeek.end_date) ? s : latest;
            })
          : null;
        setCumulativeMTD(latestMtdSubmission?.revenue_mtd || 0);

        const qtdSubmissions = submissions.filter(s => quarterWeekIds.has(s.week_id));
        const latestQtdSubmission = qtdSubmissions.length > 0
          ? qtdSubmissions.reduce((latest, s) => {
              const latestWeek = weekMap.get(latest.week_id);
              const currentWeek = weekMap.get(s.week_id);
              if (!latestWeek || !currentWeek) return latest;
              return new Date(currentWeek.end_date) > new Date(latestWeek.end_date) ? s : latest;
            })
          : null;
        setCumulativeQTD(latestQtdSubmission?.revenue_qtd || 0);

        for (const week of weeks) {
          const sub = submissionMap.get(week.id);
          if (sub && sub.pipeline_coverage_ratio > 0) {
            setLatestPipeline(sub.pipeline_coverage_ratio);
            break;
          }
        }

        // Build trend data for the current quarter
        const quarterWeeks = weeks.filter(w => quarterWeekIds.has(w.id));
        const trend: TrendDataPoint[] = quarterWeeks
          .filter(w => submissionMap.has(w.id))
          .map(w => {
            const sub = submissionMap.get(w.id)!;
            const endDate = parseLocalDate(w.end_date);
            const weekLabel = `${endDate.getMonth() + 1}/${endDate.getDate()}`;
            return {
              weekLabel,
              qtdRevenue: sub.revenue_qtd || 0,
              mtdRevenue: sub.revenue_mtd || 0,
              pipeline: sub.pipeline_coverage_ratio || 0,
              dealsWon: sub.deals_won_this_week || 0,
              dealsAdvancing: sub.deals_advancing_this_week || 0,
            };
          });
        setTrendData(trend);
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
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(quota)}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">MTD Revenue</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {hasSubmissions ? formatCurrency(cumulativeMTD) : '--'}
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
            {hasSubmissions ? formatCurrency(cumulativeQTD) : '--'}
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
            {hasSubmissions && latestPipeline > 0 ? formatCurrency(latestPipeline) : '--'}
          </p>
          {hasSubmissions && latestPipeline > 0 && quota > 0 && (
            <p className="text-xs text-slate-500 mt-1">
              {(latestPipeline / quota).toFixed(1)}x quota coverage
            </p>
          )}
        </div>
      </div>

      {trendData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Performance Trends</h3>
              <p className="text-sm text-slate-600 mt-1">Track your metrics throughout the quarter</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedMetric('qtd')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === 'qtd'
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                QTD Revenue
              </button>
              <button
                onClick={() => setSelectedMetric('mtd')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === 'mtd'
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                MTD Revenue
              </button>
              <button
                onClick={() => setSelectedMetric('pipeline')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === 'pipeline'
                    ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Pipeline
              </button>
              <button
                onClick={() => setSelectedMetric('dealsWon')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === 'dealsWon'
                    ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Deals Won
              </button>
              <button
                onClick={() => setSelectedMetric('dealsAdvancing')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === 'dealsAdvancing'
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Deals Advancing
              </button>
            </div>
          </div>
          <MetricsTrendGraph trendData={trendData} selectedMetric={selectedMetric} />
        </div>
      )}

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
