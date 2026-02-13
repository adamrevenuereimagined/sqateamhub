import { useEffect, useState } from 'react';
import { supabase, Week, User } from '../lib/supabase';
import { TrendingUp, TrendingDown, Target, Calendar, BarChart3, ArrowRight } from 'lucide-react';

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
            submissionsMap[sub.week_id] = sub;
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

  const calculateTrend = (current: number, previous: number): { value: number; direction: 'up' | 'down' | 'flat' } => {
    if (previous === 0) return { value: 0, direction: 'flat' };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat'
    };
  };

  const getAchievementColor = (percentage: number): string => {
    if (percentage >= 100) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (percentage >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (percentage >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getBarHeight = (actual: number, target: number): number => {
    if (target === 0) return 0;
    return Math.min((actual / target) * 100, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
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
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Week-over-Week Analytics
          </h2>
          <p className="text-slate-600">
            Performance trends and target achievement tracking
          </p>
        </div>

        <div className="flex items-end gap-4">
          <div className="text-right">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Rep
            </label>
            <select
              value={selectedRep.id}
              onChange={(e) => {
                const rep = reps.find(r => r.id === e.target.value);
                if (rep) setSelectedRep(rep);
              }}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 min-w-[200px]"
            >
              {reps.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-right">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Weeks to Display
            </label>
            <select
              value={weeksToShow}
              onChange={(e) => setWeeksToShow(Number(e.target.value))}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value={4}>4 weeks</option>
              <option value={8}>8 weeks</option>
              <option value={12}>12 weeks</option>
            </select>
          </div>
        </div>
      </div>

      {currentWeekData?.submission && previousWeekData?.submission && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            Week-over-Week Change
          </h3>
          <p className="text-sm text-slate-600 mb-6">
            Comparing latest week vs previous week
          </p>

          <div className="grid md:grid-cols-4 gap-4">
            {[
              { label: 'Cold Calls', current: currentWeekData.submission.cold_calls, previous: previousWeekData.submission.cold_calls },
              { label: 'LI Messages', current: currentWeekData.submission.li_messages, previous: previousWeekData.submission.li_messages },
              { label: 'Decision Maker Connects', current: currentWeekData.submission.decision_maker_connects, previous: previousWeekData.submission.decision_maker_connects },
              { label: 'Meetings', current: currentWeekData.submission.meetings_booked, previous: previousWeekData.submission.meetings_booked },
              { label: 'Discovery Calls', current: currentWeekData.submission.discovery_calls, previous: previousWeekData.submission.discovery_calls },
              { label: 'Opps Advanced', current: currentWeekData.submission.opportunities_advanced, previous: previousWeekData.submission.opportunities_advanced },
              { label: 'Pipeline Value', current: currentWeekData.submission.pipeline_coverage_ratio, previous: previousWeekData.submission.pipeline_coverage_ratio }
            ].map((metric) => {
              const trend = calculateTrend(metric.current, metric.previous);
              return (
                <div key={metric.label} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-600 mb-2">{metric.label}</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{metric.current}</p>
                      <p className="text-xs text-slate-500">was {metric.previous}</p>
                    </div>
                    {trend.direction !== 'flat' && (
                      <div className={`flex items-center gap-1 ${trend.direction === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {trend.direction === 'up' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">{trend.value.toFixed(0)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {repTargets && currentWeekData?.submission && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600" />
            Target Achievement - Current Week
          </h3>
          <p className="text-sm text-slate-600 mb-6">
            How is this rep tracking against their weekly targets?
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { label: 'Cold Calls', actual: currentWeekData.submission.cold_calls, target: repTargets.target_cold_calls },
              { label: 'LI Messages', actual: currentWeekData.submission.li_messages, target: repTargets.target_li_messages },
              { label: 'Videos', actual: currentWeekData.submission.videos, target: repTargets.target_videos },
              { label: 'Decision Maker Connects', actual: currentWeekData.submission.decision_maker_connects, target: repTargets.target_dm_connects },
              { label: 'Meetings Booked', actual: currentWeekData.submission.meetings_booked, target: repTargets.target_meetings_booked },
              { label: 'Discovery Calls', actual: currentWeekData.submission.discovery_calls, target: repTargets.target_discovery_calls },
              { label: 'Opps Advanced', actual: currentWeekData.submission.opportunities_advanced, target: repTargets.target_opportunities_advanced }
            ].map((metric) => {
              const achievement = calculateAchievement(metric.actual, metric.target);
              return (
                <div key={metric.label} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-slate-900">{metric.label}</p>
                      <p className="text-sm text-slate-600">Target: {metric.target}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-lg border font-semibold text-sm ${getAchievementColor(achievement)}`}>
                      {achievement.toFixed(0)}%
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          achievement >= 100 ? 'bg-emerald-500' :
                          achievement >= 80 ? 'bg-blue-500' :
                          achievement >= 60 ? 'bg-amber-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${getBarHeight(metric.actual, metric.target)}%` }}
                      />
                    </div>
                    <div className="text-right min-w-[60px]">
                      <p className="text-lg font-bold text-slate-900">{metric.actual}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-orange-600" />
          Historical Trends
        </h3>
        <p className="text-sm text-slate-600 mb-6">
          Performance over the last {weeksToShow} weeks
        </p>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Week Ending</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Cold Calls</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">LI Msgs</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Decision Maker Connects</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Meetings</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Discovery</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Opps</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Revenue QTD</th>
              </tr>
            </thead>
            <tbody>
              {weeklyData.map((weekData, idx) => {
                const submission = weekData.submission;
                const isCurrentWeek = idx === 0;
                return (
                  <tr key={weekData.week.id} className={`border-b border-slate-100 hover:bg-slate-50 ${isCurrentWeek ? 'bg-blue-50' : ''}`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-900">
                          {new Date(weekData.week.end_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        {isCurrentWeek && (
                          <span className="text-xs px-2 py-0.5 bg-blue-600 text-white rounded-full">Current</span>
                        )}
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 font-medium text-slate-900">
                      {submission?.cold_calls || '-'}
                    </td>
                    <td className="text-right py-3 px-4 font-medium text-slate-900">
                      {submission?.li_messages || '-'}
                    </td>
                    <td className="text-right py-3 px-4 font-medium text-slate-900">
                      {submission?.decision_maker_connects || '-'}
                    </td>
                    <td className="text-right py-3 px-4 font-medium text-slate-900">
                      {submission?.meetings_booked || '-'}
                    </td>
                    <td className="text-right py-3 px-4 font-medium text-slate-900">
                      {submission?.discovery_calls || '-'}
                    </td>
                    <td className="text-right py-3 px-4 font-medium text-slate-900">
                      {submission?.opportunities_advanced || '-'}
                    </td>
                    <td className="text-right py-3 px-4 font-medium text-slate-900">
                      {submission?.revenue_qtd ? `$${(submission.revenue_qtd / 1000).toFixed(0)}K` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
