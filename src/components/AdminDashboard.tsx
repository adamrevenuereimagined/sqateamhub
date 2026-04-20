import { useEffect, useState } from 'react';
import { supabase, Week, User, parseNumericFields } from '../lib/supabase';
import { TrendingUp, TrendingDown, Users, Target, Activity, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronRight, Settings, Calendar, DollarSign, XCircle } from 'lucide-react';
import { TargetsManagement } from './TargetsManagement';
import { WeekManagement } from './WeekManagement';
import { MetricsTrendGraph } from './MetricsTrendGraph';
import { formatDate, parseLocalDate } from '../lib/dateUtils';
import { formatCurrency, formatNumber } from '../lib/formatters';

type WeeklySubmission = {
  id: string;
  user_id: string;
  status: string;
  submitted_at: string | null;
  revenue_mtd: number;
  revenue_qtd: number;
  cold_calls: number;
  emails: number;
  li_messages: number;
  videos: number;
  decision_maker_connects: number;
  meetings_booked: number;
  discovery_calls: number;
  opportunities_advanced: number;
  pipeline_coverage_ratio: number;
  deals_won_this_week: number;
  deals_advancing: any[];
  deals_stalling: any[];
  new_deals: any[];
  closing_opportunities: any[];
  f2f_meetings: any[];
  wins: string[];
  whats_working_well: string;
  positive_feedback: string;
  call_review_link: string;
  call_review_focus: string;
  blockers_help: string;
  self_care: string;
  energy_level: string;
  manager_support: string;
};

type AggregatedMetrics = {
  cold_calls: number;
  emails: number;
  li_messages: number;
  videos: number;
  decision_maker_connects: number;
  meetings_booked: number;
  discovery_calls: number;
  opportunities_advanced: number;
  pipeline_coverage_ratio: number;
  weeksCount: number;
};

export function AdminDashboard() {
  const [availableWeeks, setAvailableWeeks] = useState<Week[]>([]);
  const [currentWeek, setCurrentWeek] = useState<Week | null>(null);
  const [reps, setReps] = useState<User[]>([]);
  const [submissions, setSubmissions] = useState<{ [userId: string]: WeeklySubmission }>({});
  const [previousWeekSubmissions, setPreviousWeekSubmissions] = useState<{ [userId: string]: WeeklySubmission }>({});
  const [weeklyGoals, setWeeklyGoals] = useState<{ [userId: string]: Array<{ goal_text: string; status: string; review_notes: string }> }>({});
  const [previousWeekGoals, setPreviousWeekGoals] = useState<{ [userId: string]: Array<{ goal_text: string; status: string; review_notes: string }> }>({});
  const [activityTargets, setActivityTargets] = useState<{ [userId: string]: any }>({});
  const [mtdMetrics, setMtdMetrics] = useState<AggregatedMetrics | null>(null);
  const [qtdMetrics, setQtdMetrics] = useState<AggregatedMetrics | null>(null);
  const [prevMtdMetrics, setPrevMtdMetrics] = useState<AggregatedMetrics | null>(null);
  const [prevQtdMetrics, setPrevQtdMetrics] = useState<AggregatedMetrics | null>(null);
  const [mtdMaxRevenue, setMtdMaxRevenue] = useState<{ [userId: string]: number }>({});
  const [qtdMaxRevenue, setQtdMaxRevenue] = useState<{ [userId: string]: number }>({});
  const [prevMtdMaxRevenue, setPrevMtdMaxRevenue] = useState<{ [userId: string]: number }>({});
  const [prevQtdMaxRevenue, setPrevQtdMaxRevenue] = useState<{ [userId: string]: number }>({});
  const [expandedReps, setExpandedReps] = useState<{ [userId: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [showTargetsModal, setShowTargetsModal] = useState(false);
  const [showWeekManagement, setShowWeekManagement] = useState(false);
  const [weeklyTrendData, setWeeklyTrendData] = useState<Array<{
    weekLabel: string;
    qtdRevenue: number;
    mtdRevenue: number;
    pipeline: number;
    dealsWon: number;
    dealsAdvancing: number;
  }>>([]);
  const [selectedMetric, setSelectedMetric] = useState<'qtd' | 'mtd' | 'pipeline' | 'dealsWon' | 'dealsAdvancing'>('qtd');
  const [showExecutiveSummary, setShowExecutiveSummary] = useState(false);
  const [executiveSummary, setExecutiveSummary] = useState('');

  useEffect(() => {
    loadAvailableWeeks();
  }, []);

  useEffect(() => {
    if (currentWeek) {
      loadDashboardData();
    }
  }, [currentWeek?.id]);

  const loadAvailableWeeks = async () => {
    try {
      const { data: weeksData } = await supabase
        .from('weeks')
        .select('*')
        .order('end_date', { ascending: false });

      if (weeksData && weeksData.length > 0) {
        setAvailableWeeks(weeksData);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const currentWeekByDate = weeksData.find(w => {
          const startDate = parseLocalDate(w.start_date);
          const endDate = parseLocalDate(w.end_date);
          return today >= startDate && today <= endDate;
        });

        const defaultWeek = currentWeekByDate ||
                           weeksData.find(w => w.status === 'active') ||
                           weeksData[0];
        setCurrentWeek(defaultWeek);
      }
    } catch (error) {
      console.error('Error loading weeks:', error);
    }
  };

  const loadDashboardData = async () => {
    if (!currentWeek) return;

    try {
      const { data: repsData } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'rep')
        .eq('is_active', true)
        .order('name');

      if (repsData) {
        setReps(repsData);

        const { data: submissionsData } = await supabase
          .from('weekly_submissions')
          .select('*')
          .eq('week_id', currentWeek.id);

        const submissionsMap: { [userId: string]: WeeklySubmission } = {};
        if (submissionsData) {
          submissionsData.forEach((sub: any) => {
            submissionsMap[sub.user_id] = parseNumericFields(sub, [
              'revenue_mtd', 'revenue_qtd', 'cold_calls', 'emails', 'li_messages',
              'decision_maker_connects', 'meetings_booked', 'discovery_calls',
              'opportunities_advanced', 'pipeline_coverage_ratio', 'average_deal_size',
              'prospecting_activities', 'videos', 'deals_won_this_week'
            ]);
          });
        }
        setSubmissions(submissionsMap);

        const { data: goalsData, error: goalsError } = await supabase
          .from('weekly_goals')
          .select('user_id, goal_text, status, review_notes')
          .eq('week_id', currentWeek.id)
          .order('sort_order');

        if (goalsError) {
          console.error('Error loading goals:', goalsError);
        }

        const goalsMap: { [userId: string]: Array<{ goal_text: string; status: string; review_notes: string }> } = {};
        if (goalsData) {
          console.log('Goals data loaded:', goalsData);
          goalsData.forEach((goal: any) => {
            if (!goalsMap[goal.user_id]) {
              goalsMap[goal.user_id] = [];
            }
            goalsMap[goal.user_id].push({
              goal_text: goal.goal_text,
              status: goal.status || 'pending',
              review_notes: goal.review_notes || '',
            });
          });
        }
        console.log('Goals map:', goalsMap);
        setWeeklyGoals(goalsMap);

        const { data: targetsData, error: targetsError } = await supabase
          .from('weekly_activity_targets')
          .select('*');

        if (targetsError) {
          console.error('Error loading activity targets:', targetsError);
        }

        const targetsMap: { [userId: string]: any } = {};
        if (targetsData) {
          targetsData.forEach((target: any) => {
            targetsMap[target.user_id] = target;
          });
        }
        setActivityTargets(targetsMap);

        const { data: previousWeekData } = await supabase
          .from('weeks')
          .select('*')
          .lt('start_date', currentWeek.start_date)
          .order('start_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (previousWeekData) {
          const { data: previousSubmissionsData } = await supabase
            .from('weekly_submissions')
            .select('*')
            .eq('week_id', previousWeekData.id);

          const previousSubmissionsMap: { [userId: string]: WeeklySubmission } = {};
          if (previousSubmissionsData) {
            previousSubmissionsData.forEach((sub: any) => {
              previousSubmissionsMap[sub.user_id] = parseNumericFields(sub, [
                'revenue_mtd', 'revenue_qtd', 'cold_calls', 'emails', 'li_messages',
                'decision_maker_connects', 'meetings_booked', 'discovery_calls',
                'opportunities_advanced', 'pipeline_coverage_ratio', 'average_deal_size',
                'prospecting_activities', 'videos', 'deals_won_this_week'
              ]);
            });
          }
          setPreviousWeekSubmissions(previousSubmissionsMap);

          const { data: previousGoalsData } = await supabase
            .from('weekly_goals')
            .select('user_id, goal_text, status, review_notes')
            .eq('week_id', previousWeekData.id)
            .order('sort_order');

          const previousGoalsMap: { [userId: string]: Array<{ goal_text: string; status: string; review_notes: string }> } = {};
          if (previousGoalsData) {
            previousGoalsData.forEach((goal: any) => {
              if (!previousGoalsMap[goal.user_id]) {
                previousGoalsMap[goal.user_id] = [];
              }
              previousGoalsMap[goal.user_id].push({
                goal_text: goal.goal_text,
                status: goal.status || 'pending',
                review_notes: goal.review_notes || '',
              });
            });
          }
          setPreviousWeekGoals(previousGoalsMap);
        }

        const currentDate = new Date(currentWeek.end_date);
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const quarter = Math.floor(currentDate.getMonth() / 3);
        const quarterStart = new Date(currentDate.getFullYear(), quarter * 3, 1);

        const previousWeekDate = previousWeekData ? new Date(previousWeekData.end_date) : null;
        const prevMonthStart = previousWeekDate ? new Date(previousWeekDate.getFullYear(), previousWeekDate.getMonth(), 1) : null;
        const prevQuarter = previousWeekDate ? Math.floor(previousWeekDate.getMonth() / 3) : null;
        const prevQuarterStart = previousWeekDate && prevQuarter !== null ? new Date(previousWeekDate.getFullYear(), prevQuarter * 3, 1) : null;

        const { data: allWeeks } = await supabase
          .from('weeks')
          .select('id, start_date, end_date')
          .lte('start_date', currentWeek.end_date)
          .order('start_date', { ascending: true });

        if (allWeeks) {
          const mtdWeekIds = allWeeks
            .filter(w => new Date(w.end_date) >= monthStart)
            .map(w => w.id);

          const qtdWeekIds = allWeeks
            .filter(w => new Date(w.end_date) >= quarterStart)
            .map(w => w.id);

          const prevMtdWeekIds = prevMonthStart ? allWeeks
            .filter(w => {
              const wEnd = new Date(w.end_date);
              return wEnd >= prevMonthStart && wEnd <= (previousWeekDate || new Date());
            })
            .map(w => w.id) : [];

          const prevQtdWeekIds = prevQuarterStart ? allWeeks
            .filter(w => {
              const wEnd = new Date(w.end_date);
              return wEnd >= prevQuarterStart && wEnd <= (previousWeekDate || new Date());
            })
            .map(w => w.id) : [];

          const { data: mtdSubmissions } = await supabase
            .from('weekly_submissions')
            .select('*')
            .in('week_id', mtdWeekIds);

          const { data: qtdSubmissions } = await supabase
            .from('weekly_submissions')
            .select('*')
            .in('week_id', qtdWeekIds);

          const { data: prevMtdSubmissions } = prevMtdWeekIds.length > 0 ? await supabase
            .from('weekly_submissions')
            .select('*')
            .in('week_id', prevMtdWeekIds) : { data: null };

          const { data: prevQtdSubmissions } = prevQtdWeekIds.length > 0 ? await supabase
            .from('weekly_submissions')
            .select('*')
            .in('week_id', prevQtdWeekIds) : { data: null };

          if (mtdSubmissions && mtdSubmissions.length > 0) {
            const parsedMtdSubmissions = mtdSubmissions.map(sub =>
              parseNumericFields(sub, [
                'revenue_mtd', 'revenue_qtd', 'cold_calls', 'emails', 'li_messages',
                'decision_maker_connects', 'meetings_booked', 'discovery_calls',
                'opportunities_advanced', 'pipeline_coverage_ratio', 'average_deal_size',
                'prospecting_activities', 'videos', 'deals_won_this_week'
              ])
            );
            const mtdAgg = aggregateSubmissions(parsedMtdSubmissions);
            setMtdMetrics(mtdAgg);
          }

          if (qtdSubmissions && qtdSubmissions.length > 0) {
            const parsedQtdSubmissions = qtdSubmissions.map(sub =>
              parseNumericFields(sub, [
                'revenue_mtd', 'revenue_qtd', 'cold_calls', 'emails', 'li_messages',
                'decision_maker_connects', 'meetings_booked', 'discovery_calls',
                'opportunities_advanced', 'pipeline_coverage_ratio', 'average_deal_size',
                'prospecting_activities', 'videos', 'deals_won_this_week'
              ])
            );
            const qtdAgg = aggregateSubmissions(parsedQtdSubmissions);
            setQtdMetrics(qtdAgg);
          }

          if (prevMtdSubmissions && prevMtdSubmissions.length > 0) {
            const parsedPrevMtd = prevMtdSubmissions.map(sub =>
              parseNumericFields(sub, [
                'revenue_mtd', 'revenue_qtd', 'cold_calls', 'emails', 'li_messages',
                'decision_maker_connects', 'meetings_booked', 'discovery_calls',
                'opportunities_advanced', 'pipeline_coverage_ratio', 'average_deal_size',
                'prospecting_activities', 'videos', 'deals_won_this_week'
              ])
            );
            setPrevMtdMetrics(aggregateSubmissions(parsedPrevMtd));
          }

          if (prevQtdSubmissions && prevQtdSubmissions.length > 0) {
            const parsedPrevQtd = prevQtdSubmissions.map(sub =>
              parseNumericFields(sub, [
                'revenue_mtd', 'revenue_qtd', 'cold_calls', 'emails', 'li_messages',
                'decision_maker_connects', 'meetings_booked', 'discovery_calls',
                'opportunities_advanced', 'pipeline_coverage_ratio', 'average_deal_size',
                'prospecting_activities', 'videos', 'deals_won_this_week'
              ])
            );
            setPrevQtdMetrics(aggregateSubmissions(parsedPrevQtd));
          }

          const mtdMaxByUser: { [userId: string]: number } = {};
          if (mtdSubmissions) {
            mtdSubmissions.forEach((sub: any) => {
              const revMtd = parseFloat(sub.revenue_mtd) || 0;
              if (!mtdMaxByUser[sub.user_id] || revMtd > mtdMaxByUser[sub.user_id]) {
                mtdMaxByUser[sub.user_id] = revMtd;
              }
            });
          }
          setMtdMaxRevenue(mtdMaxByUser);

          const qtdMaxByUser: { [userId: string]: number } = {};
          if (qtdSubmissions) {
            qtdSubmissions.forEach((sub: any) => {
              const revQtd = parseFloat(sub.revenue_qtd) || 0;
              if (!qtdMaxByUser[sub.user_id] || revQtd > qtdMaxByUser[sub.user_id]) {
                qtdMaxByUser[sub.user_id] = revQtd;
              }
            });
          }
          setQtdMaxRevenue(qtdMaxByUser);

          const prevMtdMaxByUser: { [userId: string]: number } = {};
          if (prevMtdSubmissions) {
            prevMtdSubmissions.forEach((sub: any) => {
              const revMtd = parseFloat(sub.revenue_mtd) || 0;
              if (!prevMtdMaxByUser[sub.user_id] || revMtd > prevMtdMaxByUser[sub.user_id]) {
                prevMtdMaxByUser[sub.user_id] = revMtd;
              }
            });
          }
          setPrevMtdMaxRevenue(prevMtdMaxByUser);

          const prevQtdMaxByUser: { [userId: string]: number } = {};
          if (prevQtdSubmissions) {
            prevQtdSubmissions.forEach((sub: any) => {
              const revQtd = parseFloat(sub.revenue_qtd) || 0;
              if (!prevQtdMaxByUser[sub.user_id] || revQtd > prevQtdMaxByUser[sub.user_id]) {
                prevQtdMaxByUser[sub.user_id] = revQtd;
              }
            });
          }
          setPrevQtdMaxRevenue(prevQtdMaxByUser);

          const quarterWeeks = allWeeks.filter(w => new Date(w.start_date) >= quarterStart);

          const allParsedQtdSubs = (qtdSubmissions || []).map((sub: any) => ({
            ...parseNumericFields(sub, [
              'revenue_mtd', 'revenue_qtd', 'cold_calls', 'emails', 'li_messages',
              'decision_maker_connects', 'meetings_booked', 'discovery_calls',
              'opportunities_advanced', 'pipeline_coverage_ratio', 'average_deal_size',
              'prospecting_activities', 'videos', 'deals_won_this_week'
            ]),
            week_end_date: allWeeks.find(w => w.id === sub.week_id)?.end_date || '',
          }));

          const trendData = quarterWeeks.map(week => {
            const weekEndDate = week.end_date;

            const subsUpToThisWeek = allParsedQtdSubs.filter(
              (s: any) => s.week_end_date && s.week_end_date <= weekEndDate
            );

            const thisWeekSubs = allParsedQtdSubs.filter(
              (s: any) => s.week_id === week.id
            );

            const maxQtdByUser: { [userId: string]: number } = {};
            const maxMtdByUser: { [userId: string]: number } = {};
            subsUpToThisWeek.forEach((sub: any) => {
              const revQtd = parseFloat(sub.revenue_qtd) || 0;
              const revMtd = parseFloat(sub.revenue_mtd) || 0;
              if (!maxQtdByUser[sub.user_id] || revQtd > maxQtdByUser[sub.user_id]) {
                maxQtdByUser[sub.user_id] = revQtd;
              }
              if (!maxMtdByUser[sub.user_id] || revMtd > maxMtdByUser[sub.user_id]) {
                maxMtdByUser[sub.user_id] = revMtd;
              }
            });

            const qtdRevenue = Object.values(maxQtdByUser).reduce((sum, v) => sum + v, 0);
            const mtdRevenue = Object.values(maxMtdByUser).reduce((sum, v) => sum + v, 0);

            const latestPipelineByUser: { [userId: string]: { pipeline: number; weekEnd: string } } = {};
            subsUpToThisWeek.forEach((sub: any) => {
              const pv = parseFloat(sub.pipeline_coverage_ratio) || 0;
              const existing = latestPipelineByUser[sub.user_id];
              if (!existing || sub.week_end_date > existing.weekEnd) {
                latestPipelineByUser[sub.user_id] = { pipeline: pv, weekEnd: sub.week_end_date };
              }
            });
            const pipeline = Object.values(latestPipelineByUser).reduce((sum, v) => sum + v.pipeline, 0);

            const dealsWon = thisWeekSubs.reduce((sum: number, sub: any) => sum + (parseInt(sub.deals_won_this_week) || 0), 0);
            const dealsAdvancing = thisWeekSubs.reduce((sum: number, sub: any) => {
              const advancing = sub.deals_advancing?.length || 0;
              return sum + advancing;
            }, 0);

            const weekStart = new Date(week.start_date);
            const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;

            return {
              weekLabel,
              qtdRevenue,
              mtdRevenue,
              pipeline,
              dealsWon,
              dealsAdvancing,
            };
          });

          setWeeklyTrendData(trendData);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const aggregateSubmissions = (submissions: any[]): AggregatedMetrics => {
    const uniqueWeeks = new Set(submissions.map(s => s.week_id));
    return {
      cold_calls: submissions.reduce((sum, s) => sum + (s.cold_calls || 0), 0),
      emails: submissions.reduce((sum, s) => sum + (s.emails || 0), 0),
      li_messages: submissions.reduce((sum, s) => sum + (s.li_messages || 0), 0),
      videos: submissions.reduce((sum, s) => sum + (s.videos || 0), 0),
      decision_maker_connects: submissions.reduce((sum, s) => sum + (s.decision_maker_connects || 0), 0),
      meetings_booked: submissions.reduce((sum, s) => sum + (s.meetings_booked || 0), 0),
      discovery_calls: submissions.reduce((sum, s) => sum + (s.discovery_calls || 0), 0),
      opportunities_advanced: submissions.reduce((sum, s) => sum + (s.opportunities_advanced || 0), 0),
      pipeline_coverage_ratio: submissions.reduce((sum, s) => sum + (s.pipeline_coverage_ratio || 0), 0) / submissions.length,
      weeksCount: uniqueWeeks.size
    };
  };


  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getTrendIcon = (current: number, previous: number) => {
    const change = calculateChange(current, previous);
    if (Math.abs(change) < 0.5) return <TrendingUp className="w-4 h-4 text-slate-400" style={{ transform: 'rotate(90deg)' }} />;
    return change > 0 ? (
      <TrendingUp className="w-4 h-4 text-emerald-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-600" />
    );
  };

  const getTrendColor = (current: number, previous: number): string => {
    const change = calculateChange(current, previous);
    if (Math.abs(change) < 0.5) return 'text-slate-600';
    return change > 0 ? 'text-emerald-600' : 'text-red-600';
  };

  const calculateTotals = () => {
    const totalQuota = reps.reduce((sum, rep) => sum + rep.quarterly_quota, 0);

    const totalRevenueMTD = reps.reduce((sum, rep) => {
      return sum + (mtdMaxRevenue[rep.id] || 0);
    }, 0);

    const totalRevenueQTD = reps.reduce((sum, rep) => {
      return sum + (qtdMaxRevenue[rep.id] || 0);
    }, 0);

    const totalColdCalls = Object.values(submissions).reduce((sum, sub) => sum + (sub.cold_calls || 0), 0);
    const totalEmails = Object.values(submissions).reduce((sum, sub) => sum + (sub.emails || 0), 0);
    const totalLiMessages = Object.values(submissions).reduce((sum, sub) => sum + (sub.li_messages || 0), 0);
    const totalDMConnects = Object.values(submissions).reduce((sum, sub) => sum + (sub.decision_maker_connects || 0), 0);
    const totalMeetings = Object.values(submissions).reduce((sum, sub) => sum + (sub.meetings_booked || 0), 0);
    const totalDiscovery = Object.values(submissions).reduce((sum, sub) => sum + (sub.discovery_calls || 0), 0);
    const totalOppsAdvanced = Object.values(submissions).reduce((sum, sub) => sum + (sub.opportunities_advanced || 0), 0);

    const totalPipeline = Object.values(submissions).reduce((sum, sub) => sum + (sub.pipeline_coverage_ratio || 0), 0);

    const totalDealsWon = Object.values(submissions).reduce((sum, sub) => sum + (sub.deals_won_this_week || 0), 0);

    const totalDealsAdvancing = Object.values(submissions).reduce((sum, sub) => {
      return sum + (sub.deals_advancing?.length || 0);
    }, 0);

    const percentToQuotaMTD = totalQuota > 0 ? (totalRevenueMTD / (totalQuota / 3)) * 100 : 0;
    const percentToQuotaQTD = totalQuota > 0 ? (totalRevenueQTD / totalQuota) * 100 : 0;

    const prevTotalRevenueMTD = reps.reduce((sum, rep) => {
      return sum + (prevMtdMaxRevenue[rep.id] || 0);
    }, 0);

    const prevTotalRevenueQTD = reps.reduce((sum, rep) => {
      return sum + (prevQtdMaxRevenue[rep.id] || 0);
    }, 0);

    const prevTotalPipeline = Object.values(previousWeekSubmissions).reduce((sum, sub) => sum + (sub.pipeline_coverage_ratio || 0), 0);
    const prevTotalDealsWon = Object.values(previousWeekSubmissions).reduce((sum, sub) => sum + (sub.deals_won_this_week || 0), 0);
    const prevTotalDealsAdvancing = Object.values(previousWeekSubmissions).reduce((sum, sub) => {
      return sum + (sub.deals_advancing?.length || 0);
    }, 0);

    return {
      totalQuota,
      totalRevenueMTD,
      totalRevenueQTD,
      totalColdCalls,
      totalEmails,
      totalLiMessages,
      totalDMConnects,
      totalMeetings,
      totalDiscovery,
      totalOppsAdvanced,
      totalPipeline,
      totalDealsWon,
      totalDealsAdvancing,
      percentToQuotaMTD,
      percentToQuotaQTD,
      prevTotalRevenueMTD,
      prevTotalRevenueQTD,
      prevTotalPipeline,
      prevTotalDealsWon,
      prevTotalDealsAdvancing,
      submittedCount: Object.values(submissions).filter(s => s.status === 'submitted').length,
      inProgressCount: Object.values(submissions).filter(s => s.status === 'in_progress').length,
      notStartedCount: reps.length - Object.keys(submissions).length
    };
  };

  const totals = calculateTotals();

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
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'in_progress':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-red-100 text-red-700 border-red-300 font-bold';
    }
  };

  const toggleRepExpansion = (userId: string) => {
    setExpandedReps(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const generateExecutiveSummary = () => {
    if (!currentWeek) return;

    const totals = calculateTotals();
    const previousTotals = Object.keys(previousWeekSubmissions).length > 0 ? {
      coldCalls: Object.values(previousWeekSubmissions).reduce((sum, s) => sum + (s.cold_calls || 0), 0),
      emails: Object.values(previousWeekSubmissions).reduce((sum, s) => sum + (s.emails || 0), 0),
      liMessages: Object.values(previousWeekSubmissions).reduce((sum, s) => sum + (s.li_messages || 0), 0),
      dmConnects: Object.values(previousWeekSubmissions).reduce((sum, s) => sum + (s.decision_maker_connects || 0), 0),
      meetings: Object.values(previousWeekSubmissions).reduce((sum, s) => sum + (s.meetings_booked || 0), 0),
      discovery: Object.values(previousWeekSubmissions).reduce((sum, s) => sum + (s.discovery_calls || 0), 0),
      opportunities: Object.values(previousWeekSubmissions).reduce((sum, s) => sum + (s.opportunities_advanced || 0), 0),
      dealsWon: Object.values(previousWeekSubmissions).reduce((sum, s) => sum + (s.deals_won_this_week || 0), 0),
    } : null;

    const weekLabel = `${new Date(currentWeek.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(currentWeek.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    const topPerformers = reps
      .filter(rep => submissions[rep.id])
      .map(rep => ({
        name: rep.name,
        qtdRevenue: qtdMaxRevenue[rep.id] || 0,
        mtdRevenue: mtdMaxRevenue[rep.id] || 0,
        meetings: submissions[rep.id]?.meetings_booked || 0,
        dealsWon: submissions[rep.id]?.deals_won_this_week || 0,
        quota: rep.quarterly_quota,
        percentToQuota: rep.quarterly_quota > 0 ? ((qtdMaxRevenue[rep.id] || 0) / rep.quarterly_quota) * 100 : 0,
      }))
      .sort((a, b) => b.percentToQuota - a.percentToQuota);

    const highlights: string[] = [];
    const lowlights: string[] = [];

    if (totals.totalDealsWon > 0) {
      highlights.push(`Team closed ${totals.totalDealsWon} deal${totals.totalDealsWon > 1 ? 's' : ''} this week`);
    }

    if (previousTotals) {
      const meetingsChange = calculateChange(totals.totalMeetings, previousTotals.meetings);
      if (meetingsChange > 10) {
        highlights.push(`Meetings booked increased ${meetingsChange.toFixed(0)}% from last week`);
      } else if (meetingsChange < -10) {
        lowlights.push(`Meetings booked decreased ${Math.abs(meetingsChange).toFixed(0)}% from last week`);
      }

      const callsChange = calculateChange(totals.totalColdCalls, previousTotals.coldCalls);
      if (callsChange > 15) {
        highlights.push(`Cold calling activity up ${callsChange.toFixed(0)}%`);
      } else if (callsChange < -15) {
        lowlights.push(`Cold calling activity down ${Math.abs(callsChange).toFixed(0)}%`);
      }

      const discoveryChange = calculateChange(totals.totalDiscovery, previousTotals.discovery);
      if (discoveryChange > 10) {
        highlights.push(`Discovery calls increased ${discoveryChange.toFixed(0)}%`);
      }
    }

    if (topPerformers.length > 0 && topPerformers[0].percentToQuota >= 80) {
      highlights.push(`${topPerformers[0].name} is at ${topPerformers[0].percentToQuota.toFixed(0)}% of quarterly quota`);
    }

    const submittedCount = reps.filter(rep => submissions[rep.id]?.status === 'submitted').length;
    const notSubmittedCount = reps.length - submittedCount;
    if (notSubmittedCount > 0) {
      lowlights.push(`${notSubmittedCount} rep${notSubmittedCount > 1 ? 's have' : ' has'} not submitted their weekly report`);
    }

    const behindQuota = topPerformers.filter(p => p.percentToQuota < 50).length;
    if (behindQuota > 0) {
      lowlights.push(`${behindQuota} rep${behindQuota > 1 ? 's are' : ' is'} below 50% of quarterly quota`);
    }

    const totalActivities = totals.totalColdCalls + totals.totalEmails + totals.totalLiMessages;
    const avgActivitiesPerRep = totalActivities / reps.length;

    let summary = `Subject: Sales Performance Update - Week of ${weekLabel}\n\n`;
    summary += `Executive Team,\n\n`;
    summary += `Below is the weekly sales performance summary for the week of ${weekLabel}.\n\n`;

    summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    summary += `KEY METRICS\n`;
    summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    summary += `Team Performance:\n`;
    summary += `• Total Revenue MTD: ${formatCurrency(totals.totalRevenueMTD)}\n`;
    summary += `• Total Revenue QTD: ${formatCurrency(totals.totalRevenueQTD)}\n`;
    summary += `• Deals Won This Week: ${totals.totalDealsWon}\n`;
    summary += `• Meetings Booked: ${totals.totalMeetings}${previousTotals ? ` (${calculateChange(totals.totalMeetings, previousTotals.meetings) > 0 ? '+' : ''}${calculateChange(totals.totalMeetings, previousTotals.meetings).toFixed(0)}% vs. last week)` : ''}\n`;
    summary += `• Discovery Calls: ${totals.totalDiscovery}${previousTotals ? ` (${calculateChange(totals.totalDiscovery, previousTotals.discovery) > 0 ? '+' : ''}${calculateChange(totals.totalDiscovery, previousTotals.discovery).toFixed(0)}% vs. last week)` : ''}\n`;
    summary += `• Opportunities Advanced: ${totals.totalOpportunities}\n\n`;

    summary += `Activity Levels:\n`;
    summary += `• Cold Calls: ${totals.totalColdCalls}${previousTotals ? ` (${calculateChange(totals.totalColdCalls, previousTotals.coldCalls) > 0 ? '+' : ''}${calculateChange(totals.totalColdCalls, previousTotals.coldCalls).toFixed(0)}% vs. last week)` : ''}\n`;
    summary += `• Emails: ${totals.totalEmails}\n`;
    summary += `• LinkedIn Messages: ${totals.totalLiMessages}\n`;
    summary += `• Total Prospecting Activities: ${totalActivities}\n`;
    summary += `• Average Activities per Rep: ${avgActivitiesPerRep.toFixed(0)}\n\n`;

    if (highlights.length > 0) {
      summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      summary += `HIGHLIGHTS\n`;
      summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      highlights.forEach(highlight => {
        summary += `✓ ${highlight}\n`;
      });
      summary += `\n`;
    }

    if (lowlights.length > 0) {
      summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      summary += `AREAS FOR ATTENTION\n`;
      summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      lowlights.forEach(lowlight => {
        summary += `⚠ ${lowlight}\n`;
      });
      summary += `\n`;
    }

    summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    summary += `TOP PERFORMERS (BY QUOTA ATTAINMENT)\n`;
    summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    topPerformers.slice(0, 3).forEach((performer, idx) => {
      summary += `${idx + 1}. ${performer.name}\n`;
      summary += `   • QTD Revenue: ${formatCurrency(performer.qtdRevenue)} (${performer.percentToQuota.toFixed(0)}% of quota)\n`;
      summary += `   • Meetings Booked: ${performer.meetings}\n`;
      summary += `   • Deals Won This Week: ${performer.dealsWon}\n\n`;
    });

    summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    summary += `TRENDS & OUTLOOK\n`;
    summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (previousTotals) {
      const overallTrend = (
        calculateChange(totals.totalMeetings, previousTotals.meetings) +
        calculateChange(totals.totalColdCalls, previousTotals.coldCalls) +
        calculateChange(totals.totalDiscovery, previousTotals.discovery)
      ) / 3;

      if (overallTrend > 5) {
        summary += `The team is showing strong momentum with activity levels trending upward across multiple metrics. `;
      } else if (overallTrend < -5) {
        summary += `Activity levels are trending downward and may require management attention to course-correct. `;
      } else {
        summary += `Activity levels are relatively stable week-over-week. `;
      }
    }

    const avgQuotaAttainment = topPerformers.reduce((sum, p) => sum + p.percentToQuota, 0) / topPerformers.length;
    summary += `Team average quota attainment is ${avgQuotaAttainment.toFixed(0)}%.`;

    if (avgQuotaAttainment < 50) {
      summary += ` The team will need to accelerate performance significantly to meet quarterly targets.`;
    } else if (avgQuotaAttainment >= 80) {
      summary += ` The team is well-positioned to meet or exceed quarterly targets.`;
    } else {
      summary += ` The team is making progress but needs sustained effort to hit quarterly targets.`;
    }

    summary += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    summary += `Please let me know if you need any additional details or analysis.\n\n`;
    summary += `Best regards,\n`;
    summary += `Sales Operations`;

    setExecutiveSummary(summary);
    setShowExecutiveSummary(true);
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
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Admin Dashboard
            </h2>
            <p className="text-slate-600">
              BD Weekly Team Performance & Analytics
            </p>
          </div>
        </div>
      </div>

        <div>
          <div className="mb-8 flex items-start justify-between">
            <div></div>

        <div className="flex items-end gap-4">
          <div className="text-right">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Week (Friday End Date)
            </label>
            <select
              value={currentWeek?.id || ''}
              onChange={(e) => {
                const week = availableWeeks.find(w => w.id === e.target.value);
                if (week) setCurrentWeek(week);
              }}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 min-w-[200px]"
            >
              {availableWeeks.map((week) => (
                <option key={week.id} value={week.id}>
                  {formatDate(week.end_date)}
                  {week.status === 'active' ? ' (Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowWeekManagement(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Manage Weeks
            </button>
            <button
              onClick={() => setShowTargetsModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Manage Targets
            </button>
            <button
              onClick={generateExecutiveSummary}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              Create Weekly Summary
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 text-emerald-600" />
            <span className="text-sm font-medium text-slate-600">Team Size</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{reps.length}</p>
          <p className="text-sm text-slate-600 mt-1">
            {totals.submittedCount} submitted
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-8 h-8 text-blue-600" />
            <span className="text-sm font-medium text-slate-600">QTD Revenue (Bookings)</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {formatCurrency(totals.totalRevenueQTD)}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {getTrendIcon(totals.totalRevenueQTD, totals.prevTotalRevenueQTD)}
            <p className={`text-sm font-medium ${getTrendColor(totals.totalRevenueQTD, totals.prevTotalRevenueQTD)}`}>
              {formatCurrency(totals.totalRevenueQTD - totals.prevTotalRevenueQTD, true)} vs last week
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <span className="text-sm font-medium text-slate-600">MTD Revenue (Bookings)</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {formatCurrency(totals.totalRevenueMTD)}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {getTrendIcon(totals.totalRevenueMTD, totals.prevTotalRevenueMTD)}
            <p className={`text-sm font-medium ${getTrendColor(totals.totalRevenueMTD, totals.prevTotalRevenueMTD)}`}>
              {formatCurrency(totals.totalRevenueMTD - totals.prevTotalRevenueMTD, true)} vs last week
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-orange-600" />
            <span className="text-sm font-medium text-slate-600">Team Pipeline</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {formatCurrency(totals.totalPipeline)}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {getTrendIcon(totals.totalPipeline, totals.prevTotalPipeline)}
            <p className={`text-sm font-medium ${getTrendColor(totals.totalPipeline, totals.prevTotalPipeline)}`}>
              {formatCurrency(totals.totalPipeline - totals.prevTotalPipeline, true)} vs last week
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
            <span className="text-sm font-medium text-slate-600">Deals Won</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {totals.totalDealsWon}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {getTrendIcon(totals.totalDealsWon, totals.prevTotalDealsWon)}
            <p className={`text-sm font-medium ${getTrendColor(totals.totalDealsWon, totals.prevTotalDealsWon)}`}>
              {totals.totalDealsWon - totals.prevTotalDealsWon > 0 ? '+' : ''}{totals.totalDealsWon - totals.prevTotalDealsWon} vs last week
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <span className="text-sm font-medium text-slate-600">Deals Advancing</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {totals.totalDealsAdvancing}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {getTrendIcon(totals.totalDealsAdvancing, totals.prevTotalDealsAdvancing)}
            <p className={`text-sm font-medium ${getTrendColor(totals.totalDealsAdvancing, totals.prevTotalDealsAdvancing)}`}>
              {totals.totalDealsAdvancing - totals.prevTotalDealsAdvancing > 0 ? '+' : ''}{totals.totalDealsAdvancing - totals.prevTotalDealsAdvancing} vs last week
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Quarterly Trends</h3>
            <p className="text-sm text-slate-600">Weekly progression of key metrics</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedMetric('qtd')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedMetric === 'qtd'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              QTD Revenue
            </button>
            <button
              onClick={() => setSelectedMetric('mtd')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedMetric === 'mtd'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              MTD Revenue
            </button>
            <button
              onClick={() => setSelectedMetric('pipeline')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedMetric === 'pipeline'
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Pipeline
            </button>
            <button
              onClick={() => setSelectedMetric('dealsWon')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedMetric === 'dealsWon'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Deals Won
            </button>
            <button
              onClick={() => setSelectedMetric('dealsAdvancing')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedMetric === 'dealsAdvancing'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Deals Advancing
            </button>
          </div>
        </div>
        <MetricsTrendGraph trendData={weeklyTrendData} selectedMetric={selectedMetric} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <h3 className="text-xl font-semibold text-slate-900 mb-4">
          Face-to-Face Meetings HELD Last Week
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reps.map((rep) => {
            const submission = submissions[rep.id];
            const meetingsCount = submission?.f2f_meetings_held_last_week?.filter((m: any) => m.clientProspect).length || 0;

            if (meetingsCount === 0) return null;

            return (
              <div key={rep.id} className="border border-slate-200 rounded-lg p-4 bg-gradient-to-br from-emerald-50 to-white">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-slate-900">{rep.name}</p>
                    <p className="text-sm text-slate-600">{rep.email}</p>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white rounded-full text-sm font-bold">
                    <Calendar className="w-4 h-4" />
                    {meetingsCount}
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {submission?.f2f_meetings_held_last_week?.filter((m: any) => m.clientProspect).map((meeting: any, idx: number) => (
                    <div key={idx} className="text-xs text-slate-700 bg-white rounded p-2 border border-slate-100">
                      <p className="font-medium truncate">{meeting.clientProspect}</p>
                      <p className="text-slate-600">{meeting.dates}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {reps.every(rep => {
          const submission = submissions[rep.id];
          const meetingsCount = submission?.f2f_meetings_held_last_week?.filter((m: any) => m.clientProspect).length || 0;
          return meetingsCount === 0;
        }) && (
          <p className="text-slate-500 text-center py-8">No F2F meetings held last week</p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <h3 className="text-xl font-semibold text-slate-900 mb-4">
          Face-to-Face Meetings Next Week
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reps.map((rep) => {
            const submission = submissions[rep.id];
            const meetings = submission?.f2f_meetings?.filter((m: any) => m.clientProspect) || [];
            const meetingsCount = meetings.length;
            const hasNone = meetingsCount === 0;

            return (
              <div key={rep.id} className={`border rounded-lg p-4 ${hasNone ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-gradient-to-br from-blue-50 to-white'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-slate-900">{rep.name}</p>
                    <p className="text-sm text-slate-600">{rep.email}</p>
                  </div>
                  {hasNone ? (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold border border-red-200">
                      NONE
                    </span>
                  ) : (
                    <div className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-bold">
                      <Calendar className="w-4 h-4" />
                      {meetingsCount}
                    </div>
                  )}
                </div>
                {hasNone ? (
                  <p className="text-sm text-red-600 font-medium mt-2">No meetings scheduled</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {meetings.map((meeting: any, idx: number) => (
                      <div key={idx} className="text-xs text-slate-700 bg-white rounded p-2 border border-slate-100">
                        <p className="font-medium truncate">{meeting.clientProspect}</p>
                        <p className="text-slate-600">{meeting.dates}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <h3 className="text-xl font-semibold text-slate-900 mb-4">
          Individual Rep Performance
        </h3>
        <p className="text-sm text-slate-600 mb-6">
          Click on any rep to see their detailed submission
        </p>

        <div className="space-y-2">
          {reps.map((rep) => {
            const submission = submissions[rep.id];
            const prevSubmission = previousWeekSubmissions[rep.id];
            const status = submission?.status || 'not_started';
            const isExpanded = expandedReps[rep.id];

            const repMtdRevenue = mtdMaxRevenue[rep.id] || 0;
            const repQtdRevenue = qtdMaxRevenue[rep.id] || 0;
            const prevRepMtdRevenue = prevMtdMaxRevenue[rep.id] || 0;
            const prevRepQtdRevenue = prevQtdMaxRevenue[rep.id] || 0;

            const percentToQuota = rep.quarterly_quota > 0
              ? (repQtdRevenue / rep.quarterly_quota) * 100
              : 0;

            const mtdChange = calculateChange(repMtdRevenue, prevRepMtdRevenue);
            const qtdChange = calculateChange(repQtdRevenue, prevRepQtdRevenue);

            return (
              <div key={rep.id} className={`border rounded-lg overflow-hidden ${
                status === 'not_started'
                  ? 'border-red-400 bg-red-50'
                  : 'border-slate-200'
              }`}>
                <div
                  onClick={() => toggleRepExpansion(rep.id)}
                  className={`flex items-center justify-between p-4 cursor-pointer ${
                    status === 'not_started'
                      ? 'hover:bg-red-100'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    )}

                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">
                        {rep.name}
                        {status === 'not_started' && (
                          <span className="ml-2 text-xs font-bold text-red-600 bg-red-200 px-2 py-1 rounded">
                            NOT STARTED
                          </span>
                        )}
                      </p>
                      {previousWeekGoals[rep.id] && previousWeekGoals[rep.id].length > 0 && (
                        <div className="mt-2 space-y-1">
                          {previousWeekGoals[rep.id].map((goal: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-2">
                              <p className="text-xs text-slate-600">
                                <span className="font-medium text-slate-700">Goal {idx + 1}:</span> {goal.goal_text}
                              </p>
                              {goal.status !== 'pending' && (
                                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                                  goal.status === 'hit' ? 'bg-emerald-100 text-emerald-700' :
                                  goal.status === 'partial' ? 'bg-amber-100 text-amber-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {goal.status === 'hit' ? '✓ Hit' : goal.status === 'partial' ? '◐ Partial' : '✗ Missed'}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-center min-w-[100px]">
                      <p className="text-sm text-slate-600">Quota</p>
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(rep.quarterly_quota)}
                      </p>
                    </div>

                    <div className="text-center min-w-[100px]">
                      <p className="text-sm text-slate-600">MTD Revenue</p>
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(repMtdRevenue)}
                      </p>
                      <div className="flex items-center justify-center gap-1 mt-0.5">
                        {mtdChange > 0.5 ? <TrendingUp className="w-3 h-3 text-emerald-600" /> : mtdChange < -0.5 ? <TrendingDown className="w-3 h-3 text-red-600" /> : null}
                        <span className={`text-xs font-medium ${mtdChange > 0.5 ? 'text-emerald-600' : mtdChange < -0.5 ? 'text-red-600' : 'text-slate-500'}`}>
                          {mtdChange > 0.5 ? '+' : mtdChange < -0.5 ? '-' : ''}{formatCurrency(Math.abs(repMtdRevenue - prevRepMtdRevenue))} WoW
                        </span>
                      </div>
                    </div>

                    <div className="text-center min-w-[100px]">
                      <p className="text-sm text-slate-600">QTD Revenue</p>
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(repQtdRevenue)}
                      </p>
                      <div className="flex items-center justify-center gap-1 mt-0.5">
                        {qtdChange > 0.5 ? <TrendingUp className="w-3 h-3 text-emerald-600" /> : qtdChange < -0.5 ? <TrendingDown className="w-3 h-3 text-red-600" /> : null}
                        <span className={`text-xs font-medium ${qtdChange > 0.5 ? 'text-emerald-600' : qtdChange < -0.5 ? 'text-red-600' : 'text-slate-500'}`}>
                          {qtdChange > 0.5 ? '+' : qtdChange < -0.5 ? '-' : ''}{formatCurrency(Math.abs(repQtdRevenue - prevRepQtdRevenue))} WoW
                        </span>
                      </div>
                    </div>

                    <div className="text-center min-w-[100px]">
                      <p className="text-sm text-slate-600">% to Quota</p>
                      <p className={`font-semibold ${
                        percentToQuota >= 100 ? 'text-emerald-600' :
                        percentToQuota >= 75 ? 'text-blue-600' :
                        percentToQuota >= 50 ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {percentToQuota.toFixed(1)}%
                      </p>
                    </div>

                    <div className="text-center min-w-[120px]">
                      <p className="text-sm text-slate-600">Pipeline Coverage</p>
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(submission?.pipeline_coverage_ratio || 0)}
                      </p>
                      <div className="flex items-center justify-center gap-1 mt-0.5">
                        {(() => {
                          const currentPipeline = submission?.pipeline_coverage_ratio || 0;
                          const prevPipeline = prevSubmission?.pipeline_coverage_ratio || 0;
                          const pipelineChange = calculateChange(currentPipeline, prevPipeline);
                          return (
                            <>
                              {pipelineChange > 0.5 ? <TrendingUp className="w-3 h-3 text-emerald-600" /> : pipelineChange < -0.5 ? <TrendingDown className="w-3 h-3 text-red-600" /> : null}
                              <span className={`text-xs font-medium ${pipelineChange > 0.5 ? 'text-emerald-600' : pipelineChange < -0.5 ? 'text-red-600' : 'text-slate-500'}`}>
                                {pipelineChange > 0.5 ? '+' : pipelineChange < -0.5 ? '-' : ''}{formatCurrency(Math.abs(currentPipeline - prevPipeline))} WoW
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${getStatusColor(status)}`}>
                        {getStatusIcon(status)}
                        <span className="text-sm font-medium capitalize">
                          {status.replace('_', ' ')}
                        </span>
                      </div>
                      {status === 'submitted' && submission?.submitted_at && (
                        <span className="text-xs text-slate-500">
                          {new Date(submission.submitted_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && submission && (
                  <div className="border-t border-slate-200 bg-slate-50 p-6">
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-3">Activities This Week</h4>
                        <div className="space-y-2">
                          {(() => {
                            const target = activityTargets[rep.id];
                            return (
                              <>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-600">Cold Calls:</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{submission.cold_calls || 0}</span>
                                    {target?.target_cold_calls && (
                                      <span className={`text-xs px-2 py-0.5 rounded ${
                                        (submission.cold_calls || 0) >= target.target_cold_calls
                                          ? 'bg-emerald-100 text-emerald-700'
                                          : 'bg-amber-100 text-amber-700'
                                      }`}>
                                        / {target.target_cold_calls}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-600">Emails:</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{submission.emails || 0}</span>
                                    {target?.target_emails && (
                                      <span className={`text-xs px-2 py-0.5 rounded ${
                                        (submission.emails || 0) >= target.target_emails
                                          ? 'bg-emerald-100 text-emerald-700'
                                          : 'bg-amber-100 text-amber-700'
                                      }`}>
                                        / {target.target_emails}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-600">LI Messages:</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{submission.li_messages || 0}</span>
                                    {target?.target_li_messages && (
                                      <span className={`text-xs px-2 py-0.5 rounded ${
                                        (submission.li_messages || 0) >= target.target_li_messages
                                          ? 'bg-emerald-100 text-emerald-700'
                                          : 'bg-amber-100 text-amber-700'
                                      }`}>
                                        / {target.target_li_messages}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-600">Decision Maker Connects:</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{submission.decision_maker_connects || 0}</span>
                                    {target?.target_dm_connects && (
                                      <span className={`text-xs px-2 py-0.5 rounded ${
                                        (submission.decision_maker_connects || 0) >= target.target_dm_connects
                                          ? 'bg-emerald-100 text-emerald-700'
                                          : 'bg-amber-100 text-amber-700'
                                      }`}>
                                        / {target.target_dm_connects}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-600">Meetings Booked:</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{submission.meetings_booked || 0}</span>
                                    {target?.target_meetings_booked && (
                                      <span className={`text-xs px-2 py-0.5 rounded ${
                                        (submission.meetings_booked || 0) >= target.target_meetings_booked
                                          ? 'bg-emerald-100 text-emerald-700'
                                          : 'bg-amber-100 text-amber-700'
                                      }`}>
                                        / {target.target_meetings_booked}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                          {(() => {
                            const target = activityTargets[rep.id];
                            return (
                              <>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-600">Discovery Calls:</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{submission.discovery_calls || 0}</span>
                                    {target?.target_discovery_calls && (
                                      <span className={`text-xs px-2 py-0.5 rounded ${
                                        (submission.discovery_calls || 0) >= target.target_discovery_calls
                                          ? 'bg-emerald-100 text-emerald-700'
                                          : 'bg-amber-100 text-amber-700'
                                      }`}>
                                        / {target.target_discovery_calls}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-600">Videos:</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{submission.videos || 0}</span>
                                    {target?.target_videos && (
                                      <span className={`text-xs px-2 py-0.5 rounded ${
                                        (submission.videos || 0) >= target.target_videos
                                          ? 'bg-emerald-100 text-emerald-700'
                                          : 'bg-amber-100 text-amber-700'
                                      }`}>
                                        / {target.target_videos}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-600">Opportunities Advanced:</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{submission.opportunities_advanced || 0}</span>
                                    {target?.target_opportunities_advanced && (
                                      <span className={`text-xs px-2 py-0.5 rounded ${
                                        (submission.opportunities_advanced || 0) >= target.target_opportunities_advanced
                                          ? 'bg-emerald-100 text-emerald-700'
                                          : 'bg-amber-100 text-amber-700'
                                      }`}>
                                        / {target.target_opportunities_advanced}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 mb-3">Performance Metrics</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Revenue MTD:</span>
                            <span className="font-medium">{formatCurrency(submission.revenue_mtd || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Revenue QTD:</span>
                            <span className="font-medium">{formatCurrency(submission.revenue_qtd || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Pipeline Amount:</span>
                            <span className="font-medium">{formatCurrency(submission.pipeline_coverage_ratio || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Opps Advanced:</span>
                            <span className="font-medium">{submission.opportunities_advanced || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {submission.wins && submission.wins.length > 0 && submission.wins[0] && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-slate-900 mb-3">Wins This Week</h4>
                        <ul className="space-y-2">
                          {submission.wins.map((win, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                              <span className="text-slate-700">{win}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {submission.deals_advancing && submission.deals_advancing.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-slate-900 mb-3">Deals Advancing</h4>
                        <div className="space-y-2">
                          {submission.deals_advancing.map((deal: any, idx: number) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200">
                              <p className="font-medium text-slate-900">{deal.dealName}</p>
                              <p className="text-sm text-slate-600">
                                Next Stage: {deal.nextStage} | Next Step: {deal.nextStep}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {submission.deals_stalling && submission.deals_stalling.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-slate-900 mb-3">Deals At Risk</h4>
                        <div className="space-y-2">
                          {submission.deals_stalling.map((deal: any, idx: number) => (
                            <div key={idx} className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                              <p className="font-medium text-slate-900">{deal.dealName}</p>
                              <p className="text-sm text-slate-700">Why Stuck: {deal.whyStuck}</p>
                              <p className="text-sm text-slate-700">Plan: {deal.yourPlan}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {submission.closing_opportunities && submission.closing_opportunities.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-slate-900 mb-3">Closing This Week</h4>
                        <div className="space-y-2">
                          {submission.closing_opportunities.map((opp: any, idx: number) => (
                            <div key={idx} className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-slate-900">{opp.companyDeal}</p>
                                  <p className="text-sm text-slate-700">Close Date: {opp.closeDate}</p>
                                </div>
                                <p className="font-bold text-emerald-700">{formatCurrency(opp.value || 0)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(submission.whats_working_well || submission.positive_feedback) && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-slate-900 mb-3">What's Working Well & Positive Feedback</h4>
                        <div className="space-y-3">
                          {submission.whats_working_well && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                              <p className="text-sm font-medium text-slate-700 mb-1">What's Working Well:</p>
                              <p className="text-slate-700">{submission.whats_working_well}</p>
                            </div>
                          )}
                          {submission.positive_feedback && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <p className="text-sm font-medium text-slate-700 mb-1">Positive Feedback from Prospects/Clients:</p>
                              <p className="text-slate-700">{submission.positive_feedback}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mb-6">
                      <h4 className="font-semibold text-slate-900 mb-3">Face-to-Face Meetings Next Week</h4>
                      {(!submission.f2f_meetings || submission.f2f_meetings.length === 0) ? (
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                          <p className="font-bold text-red-600 text-center">NONE</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {submission.f2f_meetings.map((meeting: any, idx: number) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200">
                              <p className="font-medium text-slate-900">{meeting.clientProspect}</p>
                              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                <div>
                                  <span className="text-slate-600">Date(s): </span>
                                  <span className="text-slate-900">{meeting.dates}</span>
                                </div>
                                <div>
                                  <span className="text-slate-600">Where: </span>
                                  <span className="text-slate-900">{meeting.where}</span>
                                </div>
                              </div>
                              {meeting.purposePrep && (
                                <p className="text-sm text-slate-700 mt-2">
                                  <span className="text-slate-600">Meeting Goal/Outcome Desired: </span>
                                  {meeting.purposePrep}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {submission.previous_week_f2f_meetings_outcome && submission.previous_week_f2f_meetings_outcome.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-slate-900 mb-3">Previous Week's F2F Meeting Results</h4>
                        <div className="space-y-3">
                          {submission.previous_week_f2f_meetings_outcome.map((meeting: any, idx: number) => (
                            <div key={idx} className={`p-4 rounded-lg border ${
                              meeting.goalMet === true
                                ? 'bg-emerald-50 border-emerald-200'
                                : meeting.goalMet === false
                                ? 'bg-red-50 border-red-200'
                                : 'bg-slate-50 border-slate-200'
                            }`}>
                              <div className="flex items-start justify-between mb-2">
                                <p className="font-medium text-slate-900">{meeting.clientProspect}</p>
                                {meeting.goalMet === true && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                                    <CheckCircle className="w-3 h-3" />
                                    Goal Met
                                  </span>
                                )}
                                {meeting.goalMet === false && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                                    <XCircle className="w-3 h-3" />
                                    Goal Not Met
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-600 mb-2">
                                {meeting.dates} • {meeting.where}
                              </p>
                              <p className="text-sm text-slate-700 mb-2">
                                <span className="font-medium">Goal: </span>
                                {meeting.goalOutcome}
                              </p>
                              {meeting.notes && (
                                <p className="text-sm text-slate-700 mt-2 pt-2 border-t border-slate-200">
                                  <span className="font-medium">Notes: </span>
                                  {meeting.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(submission.call_review_link || submission.call_review_focus) && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-slate-900 mb-3">Call Review & Skill Development</h4>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                          {submission.call_review_link && (
                            <div>
                              <p className="text-sm font-medium text-slate-700 mb-1">Call to Review:</p>
                              <a
                                href={submission.call_review_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm break-all"
                              >
                                {submission.call_review_link}
                              </a>
                            </div>
                          )}
                          {submission.call_review_focus && (
                            <div>
                              <p className="text-sm font-medium text-slate-700 mb-1">What to Evaluate:</p>
                              <p className="text-slate-700 text-sm">{submission.call_review_focus}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {submission.blockers_help && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-slate-900 mb-3">Blockers & Support Needed</h4>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <p className="text-slate-700">{submission.blockers_help}</p>
                        </div>
                      </div>
                    )}

                    {weeklyGoals[rep.id] && weeklyGoals[rep.id].length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-slate-900 mb-3">Next Week's Goals</h4>
                        <div className="space-y-2">
                          {weeklyGoals[rep.id].map((goal: any, idx: number) => (
                            <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <p className="text-slate-700">
                                <span className="font-medium text-slate-900">#{idx + 1}</span> {goal.goal_text}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(submission.self_care || submission.energy_level || submission.manager_support) && (
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-3">Personal Check-In</h4>
                        <div className="space-y-3">
                          {submission.self_care && (
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                              <p className="text-sm font-medium text-slate-700 mb-1">How They're Taking Care of Themselves:</p>
                              <p className="text-slate-700">{submission.self_care}</p>
                            </div>
                          )}
                          {submission.energy_level && (
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                              <p className="text-sm font-medium text-slate-700 mb-1">Energy Level:</p>
                              <p className={`font-medium capitalize ${
                                submission.energy_level === 'high' ? 'text-emerald-600' :
                                submission.energy_level === 'medium' ? 'text-amber-600' :
                                'text-red-600'
                              }`}>
                                {submission.energy_level}
                              </p>
                            </div>
                          )}
                          {submission.manager_support && (
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                              <p className="text-sm font-medium text-slate-700 mb-1">What They Need from You:</p>
                              <p className="text-slate-700">{submission.manager_support}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <h3 className="text-xl font-semibold text-slate-900 mb-4">
          Team Activity Summary
        </h3>

        <div className="grid md:grid-cols-4 gap-6">
          {(() => {
            const previousTotals = Object.keys(previousWeekSubmissions).length > 0 ? {
              coldCalls: Object.values(previousWeekSubmissions).reduce((sum, s) => sum + (s.cold_calls || 0), 0),
              emails: Object.values(previousWeekSubmissions).reduce((sum, s) => sum + (s.emails || 0), 0),
              liMessages: Object.values(previousWeekSubmissions).reduce((sum, s) => sum + (s.li_messages || 0), 0),
              dmConnects: Object.values(previousWeekSubmissions).reduce((sum, s) => sum + (s.decision_maker_connects || 0), 0),
              meetings: Object.values(previousWeekSubmissions).reduce((sum, s) => sum + (s.meetings_booked || 0), 0),
              discovery: Object.values(previousWeekSubmissions).reduce((sum, s) => sum + (s.discovery_calls || 0), 0),
              oppsAdvanced: Object.values(previousWeekSubmissions).reduce((sum, s) => sum + (s.opportunities_advanced || 0), 0)
            } : null;

            return (
              <>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Cold Calls</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-slate-900">{totals.totalColdCalls}</p>
                    {previousTotals && (
                      <div className="flex items-center gap-1">
                        {getTrendIcon(totals.totalColdCalls, previousTotals.coldCalls)}
                        <span className={`text-xs font-medium ${getTrendColor(totals.totalColdCalls, previousTotals.coldCalls)}`}>
                          {calculateChange(totals.totalColdCalls, previousTotals.coldCalls) > 0 ? '+' : ''}{calculateChange(totals.totalColdCalls, previousTotals.coldCalls).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Emails</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-slate-900">{totals.totalEmails}</p>
                    {previousTotals && (
                      <div className="flex items-center gap-1">
                        {getTrendIcon(totals.totalEmails, previousTotals.emails)}
                        <span className={`text-xs font-medium ${getTrendColor(totals.totalEmails, previousTotals.emails)}`}>
                          {calculateChange(totals.totalEmails, previousTotals.emails) > 0 ? '+' : ''}{calculateChange(totals.totalEmails, previousTotals.emails).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">LI Messages</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-slate-900">{totals.totalLiMessages}</p>
                    {previousTotals && (
                      <div className="flex items-center gap-1">
                        {getTrendIcon(totals.totalLiMessages, previousTotals.liMessages)}
                        <span className={`text-xs font-medium ${getTrendColor(totals.totalLiMessages, previousTotals.liMessages)}`}>
                          {calculateChange(totals.totalLiMessages, previousTotals.liMessages) > 0 ? '+' : ''}{calculateChange(totals.totalLiMessages, previousTotals.liMessages).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Decision Maker Connects</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-slate-900">{totals.totalDMConnects}</p>
                    {previousTotals && (
                      <div className="flex items-center gap-1">
                        {getTrendIcon(totals.totalDMConnects, previousTotals.dmConnects)}
                        <span className={`text-xs font-medium ${getTrendColor(totals.totalDMConnects, previousTotals.dmConnects)}`}>
                          {calculateChange(totals.totalDMConnects, previousTotals.dmConnects) > 0 ? '+' : ''}{calculateChange(totals.totalDMConnects, previousTotals.dmConnects).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Meetings Booked</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-slate-900">{totals.totalMeetings}</p>
                    {previousTotals && (
                      <div className="flex items-center gap-1">
                        {getTrendIcon(totals.totalMeetings, previousTotals.meetings)}
                        <span className={`text-xs font-medium ${getTrendColor(totals.totalMeetings, previousTotals.meetings)}`}>
                          {calculateChange(totals.totalMeetings, previousTotals.meetings) > 0 ? '+' : ''}{calculateChange(totals.totalMeetings, previousTotals.meetings).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Discovery Calls</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-slate-900">{totals.totalDiscovery}</p>
                    {previousTotals && (
                      <div className="flex items-center gap-1">
                        {getTrendIcon(totals.totalDiscovery, previousTotals.discovery)}
                        <span className={`text-xs font-medium ${getTrendColor(totals.totalDiscovery, previousTotals.discovery)}`}>
                          {calculateChange(totals.totalDiscovery, previousTotals.discovery) > 0 ? '+' : ''}{calculateChange(totals.totalDiscovery, previousTotals.discovery).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Opps Advanced</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-slate-900">{totals.totalOppsAdvanced}</p>
                    {previousTotals && (
                      <div className="flex items-center gap-1">
                        {getTrendIcon(totals.totalOppsAdvanced, previousTotals.oppsAdvanced)}
                        <span className={`text-xs font-medium ${getTrendColor(totals.totalOppsAdvanced, previousTotals.oppsAdvanced)}`}>
                          {calculateChange(totals.totalOppsAdvanced, previousTotals.oppsAdvanced) > 0 ? '+' : ''}{calculateChange(totals.totalOppsAdvanced, previousTotals.oppsAdvanced).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Activities</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {totals.totalColdCalls + totals.totalEmails + totals.totalLiMessages}
                  </p>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {(mtdMetrics || qtdMetrics) && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-slate-900">Activity Performance Trends</h3>
          </div>
          <p className="text-sm text-slate-600 mb-6">Cumulative team activity metrics for Month-to-Date and Quarter-to-Date</p>

          <div className="space-y-6">
            {mtdMetrics && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <h4 className="text-md font-semibold text-slate-900">Month-to-Date (MTD)</h4>
                  {prevMtdMetrics && (
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">vs prior week</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-3">Cumulative team totals across {mtdMetrics.weeksCount} week(s) this month</p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {([
                    { label: 'Cold Calls', curr: mtdMetrics.cold_calls, prev: prevMtdMetrics?.cold_calls },
                    { label: 'Emails', curr: mtdMetrics.emails, prev: prevMtdMetrics?.emails },
                    { label: 'LinkedIn Messages', curr: mtdMetrics.li_messages, prev: prevMtdMetrics?.li_messages },
                    { label: 'DM Connects', curr: mtdMetrics.decision_maker_connects, prev: prevMtdMetrics?.decision_maker_connects },
                    { label: 'Meetings Booked', curr: mtdMetrics.meetings_booked, prev: prevMtdMetrics?.meetings_booked },
                    { label: 'Discovery Calls', curr: mtdMetrics.discovery_calls, prev: prevMtdMetrics?.discovery_calls },
                    { label: 'Opps Advanced', curr: mtdMetrics.opportunities_advanced, prev: prevMtdMetrics?.opportunities_advanced },
                  ] as { label: string; curr: number; prev: number | undefined }[]).map(({ label, curr, prev }) => (
                    <div key={label} className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-slate-600 mb-2">{label}</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-slate-900">{curr}</p>
                        {prev !== undefined && (
                          <div className="flex items-center gap-1">
                            {getTrendIcon(curr, prev)}
                            <span className={`text-xs font-medium ${getTrendColor(curr, prev)}`}>
                              {calculateChange(curr, prev) > 0 ? '+' : ''}{calculateChange(curr, prev).toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </div>
                      {prev !== undefined && (
                        <p className="text-xs text-slate-500 mt-1">Prior week: {prev}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {qtdMetrics && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <h4 className="text-md font-semibold text-slate-900">Quarter-to-Date (QTD)</h4>
                  {prevQtdMetrics && (
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">vs prior week</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-3">Cumulative team totals across {qtdMetrics.weeksCount} week(s) this quarter</p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {([
                    { label: 'Cold Calls', curr: qtdMetrics.cold_calls, prev: prevQtdMetrics?.cold_calls },
                    { label: 'Emails', curr: qtdMetrics.emails, prev: prevQtdMetrics?.emails },
                    { label: 'LinkedIn Messages', curr: qtdMetrics.li_messages, prev: prevQtdMetrics?.li_messages },
                    { label: 'DM Connects', curr: qtdMetrics.decision_maker_connects, prev: prevQtdMetrics?.decision_maker_connects },
                    { label: 'Meetings Booked', curr: qtdMetrics.meetings_booked, prev: prevQtdMetrics?.meetings_booked },
                    { label: 'Discovery Calls', curr: qtdMetrics.discovery_calls, prev: prevQtdMetrics?.discovery_calls },
                    { label: 'Opps Advanced', curr: qtdMetrics.opportunities_advanced, prev: prevQtdMetrics?.opportunities_advanced },
                  ] as { label: string; curr: number; prev: number | undefined }[]).map(({ label, curr, prev }) => (
                    <div key={label} className="bg-emerald-50 rounded-lg p-4">
                      <p className="text-sm text-slate-600 mb-2">{label}</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-slate-900">{curr}</p>
                        {prev !== undefined && (
                          <div className="flex items-center gap-1">
                            {getTrendIcon(curr, prev)}
                            <span className={`text-xs font-medium ${getTrendColor(curr, prev)}`}>
                              {calculateChange(curr, prev) > 0 ? '+' : ''}{calculateChange(curr, prev).toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </div>
                      {prev !== undefined && (
                        <p className="text-xs text-slate-500 mt-1">Prior week: {prev}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
        </div>

      {showTargetsModal && (
        <TargetsManagement onClose={() => setShowTargetsModal(false)} />
      )}

      {showWeekManagement && (
        <WeekManagement onClose={() => {
          setShowWeekManagement(false);
          loadAvailableWeeks();
        }} />
      )}

      {showExecutiveSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Executive Summary</h2>
              <button
                onClick={() => setShowExecutiveSummary(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <pre className="whitespace-pre-wrap font-mono text-sm text-slate-800 leading-relaxed">
                {executiveSummary}
              </pre>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(executiveSummary);
                  alert('Summary copied to clipboard!');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setShowExecutiveSummary(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
