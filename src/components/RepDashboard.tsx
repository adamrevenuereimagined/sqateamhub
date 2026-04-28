import { useEffect, useState, ReactNode } from 'react';
import { supabase, Week, parseNumericFields } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ClipboardList, CreditCard as Edit3, DollarSign, Target, TrendingUp, Briefcase, ChevronRight, LineChart } from 'lucide-react';
import { formatDate, parseLocalDate } from '../lib/dateUtils';
import { formatCurrency } from '../lib/formatters';
import { MetricsTrendGraph } from './MetricsTrendGraph';
import { Button, Card } from './ui';

type SubmissionBrief = {
  week_id: string;
  status: string;
  revenue_mtd: number;
  revenue_qtd: number;
  pipeline_coverage_ratio: number;
  deals_won_this_week?: number;
  deals_advancing_this_week?: number;
  sales_accepted_opps_mtd?: number;
  sales_accepted_opps_qtd?: number;
  opps_created_this_week?: number;
  pipeline_created_this_week?: number;
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

type MetricKey = 'qtd' | 'mtd' | 'pipeline' | 'dealsWon' | 'dealsAdvancing';
const METRIC_OPTIONS: { key: MetricKey; label: string }[] = [
  { key: 'qtd', label: 'QTD Revenue' },
  { key: 'mtd', label: 'MTD Revenue' },
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'dealsWon', label: 'Deals Won' },
  { key: 'dealsAdvancing', label: 'Deals Advancing' },
];

export function RepDashboard({ onEnterWeek }: Props) {
  const { user, isBdr } = useAuth();
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
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('qtd');
  const [latestSaoMtd, setLatestSaoMtd] = useState(0);
  const [latestSaoQtd, setLatestSaoQtd] = useState(0);
  const [latestOppsCreated, setLatestOppsCreated] = useState(0);
  const [latestPipelineCreated, setLatestPipelineCreated] = useState(0);

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
        parseNumericFields(sub, [
          'revenue_mtd', 'revenue_qtd', 'pipeline_coverage_ratio', 'deals_won_this_week',
          'sales_accepted_opps_mtd', 'sales_accepted_opps_qtd', 'opps_created_this_week', 'pipeline_created_this_week'
        ])
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

        const latestBdrSub = submissions.length > 0
          ? submissions.reduce((latest, s) => {
              const latestWeek = weekMap.get(latest.week_id);
              const currentWeekData = weekMap.get(s.week_id);
              if (!latestWeek || !currentWeekData) return latest;
              return new Date(currentWeekData.end_date) > new Date(latestWeek.end_date) ? s : latest;
            })
          : null;
        if (latestBdrSub) {
          setLatestSaoMtd((latestBdrSub as any).sales_accepted_opps_mtd || 0);
          setLatestSaoQtd((latestBdrSub as any).sales_accepted_opps_qtd || 0);
          setLatestOppsCreated((latestBdrSub as any).opps_created_this_week || 0);
          setLatestPipelineCreated((latestBdrSub as any).pipeline_created_this_week || 0);
        }

        for (const week of weeks) {
          const sub = submissionMap.get(week.id);
          if (sub && sub.pipeline_coverage_ratio > 0) {
            setLatestPipeline(sub.pipeline_coverage_ratio);
            break;
          }
        }

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
        <div className="h-10 w-10 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    );
  }

  const quota = user?.quarterly_quota || 0;
  const qtdProgress = quota > 0 ? Math.min((cumulativeQTD / quota) * 100, 100) : 0;

  return (
    <div className="animate-fade-in">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">
          Welcome back, {user?.name?.split(' ')[0]}
        </h2>
        <p className="text-slate-500">
          Track your progress and submit your weekly reports.
        </p>
      </header>

      {isBdr ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard
            label="SAOs MTD"
            icon={<Target className="h-4 w-4" />}
            value={hasSubmissions ? latestSaoMtd : '—'}
            empty={!hasSubmissions}
          />
          <KpiCard
            label="SAOs QTD"
            icon={<TrendingUp className="h-4 w-4" />}
            value={hasSubmissions ? latestSaoQtd : '—'}
            empty={!hasSubmissions}
          />
          <KpiCard
            label="Opps Created"
            sub="this week"
            icon={<Briefcase className="h-4 w-4" />}
            value={hasSubmissions ? latestOppsCreated : '—'}
            empty={!hasSubmissions}
          />
          <KpiCard
            label="Pipeline Created"
            sub="this week"
            icon={<DollarSign className="h-4 w-4" />}
            value={hasSubmissions ? formatCurrency(latestPipelineCreated) : '—'}
            empty={!hasSubmissions}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <KpiCard
            label="Quarterly Quota"
            icon={<Target className="h-4 w-4" />}
            value={formatCurrency(quota)}
          />
          <KpiCard
            label="MTD Revenue"
            icon={<DollarSign className="h-4 w-4" />}
            value={hasSubmissions ? formatCurrency(cumulativeMTD) : '—'}
            empty={!hasSubmissions}
          />
          <KpiCard
            label="QTD Revenue"
            icon={<TrendingUp className="h-4 w-4" />}
            value={hasSubmissions ? formatCurrency(cumulativeQTD) : '—'}
            empty={!hasSubmissions}
          />
          <KpiCard
            label="QTD % to Quota"
            icon={<TrendingUp className="h-4 w-4" />}
            value={hasSubmissions ? `${qtdProgress.toFixed(1)}%` : '—'}
            empty={!hasSubmissions}
            footer={hasSubmissions ? <ProgressBar progress={qtdProgress} /> : undefined}
          />
          <KpiCard
            label="Pipeline"
            icon={<Briefcase className="h-4 w-4" />}
            value={hasSubmissions && latestPipeline > 0 ? formatCurrency(latestPipeline) : '—'}
            empty={!hasSubmissions || latestPipeline === 0}
            footer={
              hasSubmissions && latestPipeline > 0 && quota > 0 ? (
                <p className="text-xs text-slate-500">
                  {(latestPipeline / quota).toFixed(1)}× quota coverage
                </p>
              ) : undefined
            }
          />
        </div>
      )}

      {trendData.length > 0 && (
        <Card padding="md" className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center flex-shrink-0">
                <LineChart className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Performance Trends</h3>
                <p className="text-sm text-slate-500 mt-0.5">Track your metrics throughout the quarter</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-lg w-fit">
              {METRIC_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSelectedMetric(key)}
                  className={`px-3 h-8 rounded-md text-sm font-medium transition-colors ${
                    selectedMetric === key
                      ? 'bg-white text-brand-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <MetricsTrendGraph trendData={trendData} selectedMetric={selectedMetric} />
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <ActionCard
          tone="primary"
          icon={<ClipboardList className="h-5 w-5" />}
          title="Enter Weekly Report"
          description="Submit your weekly metrics and updates"
          empty={allWeeks.length === 0}
          emptyTitle="No weeks available yet"
          emptyDescription="Contact your admin to set up weeks for this quarter."
        >
          <SelectField
            label="Select Week"
            value={selectedNewWeekId}
            onChange={setSelectedNewWeekId}
          >
            {allWeeks.map(week => (
              <option key={week.id} value={week.id}>
                Week ending {formatDate(week.end_date)}
                {week.status === 'active' ? ' · Current' : ''}
                {submittedWeekIds.has(week.id) ? ' · Submitted' : ''}
              </option>
            ))}
          </SelectField>
          <Button
            fullWidth
            onClick={() => onEnterWeek(selectedNewWeekId)}
            disabled={!selectedNewWeekId}
            trailingIcon={<ChevronRight className="h-4 w-4" />}
          >
            Open Report
          </Button>
        </ActionCard>

        <ActionCard
          tone="secondary"
          icon={<Edit3 className="h-5 w-5" />}
          title="Edit Previous Submission"
          description="Review and update previously submitted reports"
          empty={submittedWeeks.length === 0}
          emptyTitle="No submitted reports yet"
          emptyDescription="Submit your first weekly report to see it here."
        >
          <SelectField
            label="Select Submitted Week"
            value={selectedEditWeekId}
            onChange={setSelectedEditWeekId}
          >
            {submittedWeeks.map(week => (
              <option key={week.id} value={week.id}>
                Week ending {formatDate(week.end_date)}
              </option>
            ))}
          </SelectField>
          <Button
            fullWidth
            variant="secondary"
            onClick={() => onEnterWeek(selectedEditWeekId)}
            disabled={!selectedEditWeekId}
            trailingIcon={<ChevronRight className="h-4 w-4" />}
          >
            Edit Submission
          </Button>
        </ActionCard>
      </div>
    </div>
  );
}

type KpiCardProps = {
  label: string;
  sub?: string;
  icon: ReactNode;
  value: ReactNode;
  empty?: boolean;
  footer?: ReactNode;
};

function KpiCard({ label, sub, icon, value, empty, footer }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 transition-shadow hover:shadow-card-hover">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-7 w-7 rounded-md bg-brand-50 text-brand-700 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
          {label}
          {sub && <span className="ml-1 text-slate-400 normal-case tracking-normal">({sub})</span>}
        </span>
      </div>
      <p className={`text-2xl font-bold tracking-tight ${empty ? 'text-slate-300' : 'text-slate-900'}`}>
        {value}
      </p>
      {footer && <div className="mt-2">{footer}</div>}
      {empty && !footer && (
        <p className="text-xs text-slate-400 mt-1">Submit a report to track</p>
      )}
    </div>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  const color =
    progress >= 100
      ? 'bg-accent-500'
      : progress >= 75
      ? 'bg-brand-500'
      : progress >= 50
      ? 'bg-amber-500'
      : 'bg-red-400';
  return (
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

type ActionCardProps = {
  tone: 'primary' | 'secondary';
  icon: ReactNode;
  title: string;
  description: string;
  empty: boolean;
  emptyTitle: string;
  emptyDescription: string;
  children: ReactNode;
};

function ActionCard({ tone, icon, title, description, empty, emptyTitle, emptyDescription, children }: ActionCardProps) {
  const accent = tone === 'primary'
    ? 'bg-brand-50 text-brand-700'
    : 'bg-slate-100 text-slate-700';
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden flex flex-col">
      <div className="p-6 pb-5 flex items-start gap-3 border-b border-slate-100">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${accent}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col">
        {empty ? (
          <div className="text-center py-8">
            <p className="text-sm font-medium text-slate-700">{emptyTitle}</p>
            <p className="text-xs text-slate-500 mt-1">{emptyDescription}</p>
          </div>
        ) : (
          <div className="space-y-4">{children}</div>
        )}
      </div>
    </div>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
};

function SelectField({ label, value, onChange, children }: SelectFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 px-3.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 transition-colors hover:border-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
      >
        {children}
      </select>
    </div>
  );
}
