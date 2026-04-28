import { useEffect, useState } from 'react';
import { supabase, Week, User, parseNumericFields } from '../lib/supabase';
import { TrendingUp, TrendingDown, Target, Calendar, BarChart3, Minus } from 'lucide-react';
import { Card } from './ui';

type WeeklySubmission = {
  id: string;
  user_id: string;
  week_id: string;
  cold_calls: number;
  li_messages: number;
  videos: number;
  decision_maker_connects: number;
  meetings_booked: number;
  discovery_calls: number;
  opportunities_advanced: number;
  pipeline_coverage_ratio: number;
  revenue_mtd: number;
  revenue_qtd: number;
};

type ActivityTarget = {
  user_id: string;
  target_cold_calls: number;
  target_li_messages: number;
  target_videos: number;
  target_dm_connects: number;
  target_meetings_booked: number;
  target_discovery_calls: number;
  target_opportunities_advanced: number;
  target_pipeline_value: number;
};

type WeekData = {
  week: Week;
  submission: WeeklySubmission | null;
};

export function AnalyticsDashboard() {
  const [reps, setReps] = useState<User[]>([]);
  const [selectedRep, setSelectedRep] = useState<User | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeekData[]>([]);
  const [targets, setTargets] = useState<{ [userId: string]: ActivityTarget }>({});
  const [loading, setLoading] = useState(true);
  const [weeksToShow, setWeeksToShow] = useState(8);

  useEffect(() => {
    loadData();
  }, [weeksToShow]);

  useEffect(() => {
    if (selectedRep) {
      loadRepWeeklyData(selectedRep.id);
    }
  }, [selectedRep]);

  const loadData = async () => {
    try {
      const { data: repsData } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'rep')
        .eq('is_active', true)
        .order('name');

      if (repsData && repsData.length > 0) {
        setReps(repsData);
        if (!selectedRep) {
          setSelectedRep(repsData[0]);
        }

        const { data: targetsData } = await supabase
          .from('weekly_activity_targets')
          .select('*');

        if (targetsData) {
          const targetsMap: { [userId: string]: ActivityTarget } = {};
          targetsData.forEach((t: any) => {
            targetsMap[t.user_id] = t;
          });
          setTargets(targetsMap);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRepWeeklyData = async (userId: string) => {
    try {
      const { data: weeksData } = await supabase
        .from('weeks')
        .select('*')
        .order('start_date', { ascending: false })
        .limit(weeksToShow);

      if (weeksData) {
        const { data: submissionsData } = await supabase
          .from('weekly_submissions')
          .select('*')
          .eq('user_id', userId)
          .in('week_id', weeksData.map(w => w.id));

        const submissionsMap: { [weekId: string]: WeeklySubmission } = {};
        if (submissionsData) {
          submissionsData.forEach((sub: any) => {
            submissionsMap[sub.week_id] = parseNumericFields(sub, [
              'revenue_mtd', 'revenue_qtd', 'cold_calls', 'emails', 'li_messages',
              'decision_maker_connects', 'meetings_booked', 'discovery_calls',
              'opportunities_advanced', 'pipeline_coverage_ratio', 'average_deal_size',
              'prospecting_activities', 'videos'
            ]);
          });
        }

        const weekDataArray: WeekData[] = weeksData.map(week => ({
          week,
          submission: submissionsMap[week.id] || null
        }));

        setWeeklyData(weekDataArray);
      }
    } catch (error) {
      console.error('Error loading rep weekly data:', error);
    }
  };

  const calculateAchievement = (actual: number, target: number): number => {
    if (target === 0) return 0;
    return (actual / target) * 100;
  };

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, direction: 'flat' as const };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      direction: change > 0 ? ('up' as const) : change < 0 ? ('down' as const) : ('flat' as const),
    };
  };

  const getAchievementStyle = (percentage: number): { pill: string; bar: string } => {
    if (percentage >= 100)
      return { pill: 'text-accent-700 bg-accent-50 border-accent-200', bar: 'bg-accent-500' };
    if (percentage >= 80)
      return { pill: 'text-brand-700 bg-brand-50 border-brand-200', bar: 'bg-brand-500' };
    if (percentage >= 60)
      return { pill: 'text-amber-700 bg-amber-50 border-amber-200', bar: 'bg-amber-500' };
    return { pill: 'text-red-700 bg-red-50 border-red-200', bar: 'bg-red-500' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-10 w-10 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    );
  }

  if (!selectedRep) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">No reps found</p>
      </div>
    );
  }

  const repTargets = targets[selectedRep.id];
  const currentWeekData = weeklyData[0];
  const previousWeekData = weeklyData[1];

  return (
    <div className="animate-fade-in">
      <header className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">
            Week-over-Week Analytics
          </h2>
          <p className="text-slate-500">
            Performance trends and target achievement tracking
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <FilterSelect
            label="Rep"
            value={selectedRep.id}
            onChange={(v) => {
              const rep = reps.find(r => r.id === v);
              if (rep) setSelectedRep(rep);
            }}
            minWidth="200px"
          >
            {reps.map((rep) => (
              <option key={rep.id} value={rep.id}>{rep.name}</option>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Range"
            value={String(weeksToShow)}
            onChange={(v) => setWeeksToShow(Number(v))}
          >
            <option value={4}>4 weeks</option>
            <option value={8}>8 weeks</option>
            <option value={12}>12 weeks</option>
          </FilterSelect>
        </div>
      </header>

      {currentWeekData?.submission && previousWeekData?.submission && (
        <Card padding="md" className="mb-6">
          <div className="flex items-start gap-3 mb-5">
            <div className="h-9 w-9 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Week-over-Week Change</h3>
              <p className="text-sm text-slate-500 mt-0.5">Latest week vs previous week</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Cold Calls', current: currentWeekData.submission.cold_calls, previous: previousWeekData.submission.cold_calls },
              { label: 'LI Messages', current: currentWeekData.submission.li_messages, previous: previousWeekData.submission.li_messages },
              { label: 'DM Connects', current: currentWeekData.submission.decision_maker_connects, previous: previousWeekData.submission.decision_maker_connects },
              { label: 'Meetings', current: currentWeekData.submission.meetings_booked, previous: previousWeekData.submission.meetings_booked },
              { label: 'Discovery Calls', current: currentWeekData.submission.discovery_calls, previous: previousWeekData.submission.discovery_calls },
              { label: 'Opps Advanced', current: currentWeekData.submission.opportunities_advanced, previous: previousWeekData.submission.opportunities_advanced },
              { label: 'Pipeline Value', current: currentWeekData.submission.pipeline_coverage_ratio, previous: previousWeekData.submission.pipeline_coverage_ratio },
            ].map((metric) => {
              const trend = calculateTrend(metric.current, metric.previous);
              return (
                <div key={metric.label} className="bg-slate-50 rounded-lg p-3.5 border border-slate-200">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{metric.label}</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold text-slate-900 leading-none">{metric.current}</p>
                      <p className="text-[11px] text-slate-400 mt-1">was {metric.previous}</p>
                    </div>
                    <TrendBadge trend={trend} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {repTargets && currentWeekData?.submission && (
        <Card padding="md" className="mb-6">
          <div className="flex items-start gap-3 mb-5">
            <div className="h-9 w-9 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center flex-shrink-0">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Target Achievement — Current Week</h3>
              <p className="text-sm text-slate-500 mt-0.5">Tracking against weekly activity targets</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              { label: 'Cold Calls', actual: currentWeekData.submission.cold_calls, target: repTargets.target_cold_calls },
              { label: 'LI Messages', actual: currentWeekData.submission.li_messages, target: repTargets.target_li_messages },
              { label: 'Videos', actual: currentWeekData.submission.videos, target: repTargets.target_videos },
              { label: 'Decision Maker Connects', actual: currentWeekData.submission.decision_maker_connects, target: repTargets.target_dm_connects },
              { label: 'Meetings Booked', actual: currentWeekData.submission.meetings_booked, target: repTargets.target_meetings_booked },
              { label: 'Discovery Calls', actual: currentWeekData.submission.discovery_calls, target: repTargets.target_discovery_calls },
              { label: 'Opps Advanced', actual: currentWeekData.submission.opportunities_advanced, target: repTargets.target_opportunities_advanced },
            ].map((metric) => {
              const achievement = calculateAchievement(metric.actual, metric.target);
              const style = getAchievementStyle(achievement);
              const barWidth = Math.min(achievement, 100);
              return (
                <div key={metric.label} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{metric.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Target: {metric.target}</p>
                    </div>
                    <div className={`px-2 py-0.5 rounded border font-semibold text-xs ${style.pill}`}>
                      {achievement.toFixed(0)}%
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <p className="text-base font-semibold text-slate-900 min-w-[3ch] text-right">
                      {metric.actual}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card padding="md">
        <div className="flex items-start gap-3 mb-5">
          <div className="h-9 w-9 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center flex-shrink-0">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Historical Trends</h3>
            <p className="text-sm text-slate-500 mt-0.5">Performance over the last {weeksToShow} weeks</p>
          </div>
        </div>

        <div className="overflow-x-auto -mx-6 scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left bg-slate-50/60">
                <th className="py-2.5 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wide">Week Ending</th>
                <th className="py-2.5 px-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Calls</th>
                <th className="py-2.5 px-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">LI Msgs</th>
                <th className="py-2.5 px-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">DM Connects</th>
                <th className="py-2.5 px-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Meetings</th>
                <th className="py-2.5 px-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Discovery</th>
                <th className="py-2.5 px-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Opps</th>
                <th className="py-2.5 px-6 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Revenue QTD</th>
              </tr>
            </thead>
            <tbody>
              {weeklyData.map((weekData, idx) => {
                const submission = weekData.submission;
                const isCurrentWeek = idx === 0;
                return (
                  <tr key={weekData.week.id} className={`border-b border-slate-100 hover:bg-slate-50/60 transition-colors ${isCurrentWeek ? 'bg-brand-50/30' : ''}`}>
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <span className="font-medium text-slate-900 whitespace-nowrap">
                          {new Date(weekData.week.end_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        {isCurrentWeek && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 bg-brand-700 text-white rounded">Current</span>
                        )}
                      </div>
                    </td>
                    <DataCell value={submission?.cold_calls} />
                    <DataCell value={submission?.li_messages} />
                    <DataCell value={submission?.decision_maker_connects} />
                    <DataCell value={submission?.meetings_booked} />
                    <DataCell value={submission?.discovery_calls} />
                    <DataCell value={submission?.opportunities_advanced} />
                    <td className="py-3 px-6 text-right font-medium text-slate-900 whitespace-nowrap">
                      {submission?.revenue_qtd ? `$${(submission.revenue_qtd / 1000).toFixed(0)}K` : <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function DataCell({ value }: { value: number | undefined }) {
  return (
    <td className="py-3 px-3 text-right font-medium text-slate-900 tabular-nums">
      {value || value === 0 ? value : <span className="text-slate-300">—</span>}
    </td>
  );
}

function TrendBadge({ trend }: { trend: { value: number; direction: 'up' | 'down' | 'flat' } }) {
  if (trend.direction === 'flat') {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-slate-400">
        <Minus className="h-3 w-3" />
      </span>
    );
  }
  const isUp = trend.direction === 'up';
  const Icon = isUp ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${isUp ? 'text-accent-600' : 'text-red-600'}`}>
      <Icon className="h-3 w-3" />
      {trend.value.toFixed(0)}%
    </span>
  );
}

type FilterSelectProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  minWidth?: string;
};

function FilterSelect({ label, value, onChange, children, minWidth }: FilterSelectProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={minWidth ? { minWidth } : undefined}
        className="h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 transition-colors hover:border-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
      >
        {children}
      </select>
    </div>
  );
}
