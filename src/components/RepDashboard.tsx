import { useEffect, useState } from 'react';
import { supabase, Week, WeeklyActivityTargets } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FileText, CheckCircle, Clock, AlertCircle, Target, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';

type WeeklySubmission = {
  status: string;
  revenue_mtd: number;
  revenue_qtd: number;
  cold_calls: number;
  li_messages: number;
  videos: number;
  decision_maker_connects: number;
  meetings_booked: number;
  discovery_calls: number;
  opportunities_advanced: number;
  pipeline_coverage_ratio: number;
};

type AggregatedMetrics = {
  cold_calls: number;
  li_messages: number;
  videos: number;
  decision_maker_connects: number;
  meetings_booked: number;
  discovery_calls: number;
  opportunities_advanced: number;
  pipeline_coverage_ratio: number;
  weeksCount: number;
};

export function RepDashboard({ onNavigate }: { onNavigate: (view: 'weekly' | 'history') => void }) {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState<Week | null>(null);
  const [submission, setSubmission] = useState<WeeklySubmission | null>(null);
  const [previousSubmission, setPreviousSubmission] = useState<WeeklySubmission | null>(null);
  const [mtdMetrics, setMtdMetrics] = useState<AggregatedMetrics | null>(null);
  const [qtdMetrics, setQtdMetrics] = useState<AggregatedMetrics | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<'not_started' | 'in_progress' | 'submitted'>('not_started');
  const [targets, setTargets] = useState<WeeklyActivityTargets | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user?.id]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const [weekResult, targetsResult] = await Promise.all([
        supabase
          .from('weeks')
          .select('*')
          .eq('status', 'active')
          .order('start_date', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('weekly_activity_targets')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
      ]);

      if (targetsResult.data) {
        setTargets(targetsResult.data);
      }

      const weekData = weekResult.data;
      if (!weekData) {
        setLoading(false);
        return;
      }

      setCurrentWeek(weekData);

      const currentDate = new Date(weekData.end_date);
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const quarter = Math.floor(currentDate.getMonth() / 3);
      const quarterStart = new Date(currentDate.getFullYear(), quarter * 3, 1);

      const [submissionResult, previousWeekResult, allWeeksResult] = await Promise.all([
        supabase
          .from('weekly_submissions')
          .select('*')
          .eq('user_id', user.id)
          .eq('week_id', weekData.id)
          .maybeSingle(),
        supabase
          .from('weeks')
          .select('*')
          .lt('start_date', weekData.start_date)
          .order('start_date', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('weeks')
          .select('id, start_date, end_date')
          .lte('start_date', weekData.end_date)
          .order('start_date', { ascending: true })
      ]);

      if (submissionResult.data) {
        setSubmission(submissionResult.data);
        setSubmissionStatus(submissionResult.data.status);
      }

      const previousWeekData = previousWeekResult.data;
      const allWeeks = allWeeksResult.data;

      const queries = [];

      if (previousWeekData) {
        queries.push(
          supabase
            .from('weekly_submissions')
            .select('*')
            .eq('user_id', user.id)
            .eq('week_id', previousWeekData.id)
            .maybeSingle()
        );
      }

      if (allWeeks && allWeeks.length > 0) {
        const mtdWeekIds = allWeeks
          .filter(w => new Date(w.start_date) >= monthStart)
          .map(w => w.id);

        const qtdWeekIds = allWeeks
          .filter(w => new Date(w.start_date) >= quarterStart)
          .map(w => w.id);

        if (mtdWeekIds.length > 0) {
          queries.push(
            supabase
              .from('weekly_submissions')
              .select('*')
              .eq('user_id', user.id)
              .in('week_id', mtdWeekIds)
          );
        }

        if (qtdWeekIds.length > 0) {
          queries.push(
            supabase
              .from('weekly_submissions')
              .select('*')
              .eq('user_id', user.id)
              .in('week_id', qtdWeekIds)
          );
        }
      }

      if (queries.length > 0) {
        const results = await Promise.all(queries);

        let resultIndex = 0;
        if (previousWeekData) {
          const previousSubmissionData = results[resultIndex]?.data;
          if (previousSubmissionData) {
            setPreviousSubmission(previousSubmissionData);
          }
          resultIndex++;
        }

        if (allWeeks && allWeeks.length > 0) {
          const mtdWeekIds = allWeeks
            .filter(w => new Date(w.start_date) >= monthStart)
            .map(w => w.id);

          if (mtdWeekIds.length > 0) {
            const mtdSubmissions = results[resultIndex]?.data;
            if (mtdSubmissions && mtdSubmissions.length > 0) {
              const mtdAgg = aggregateSubmissions(mtdSubmissions);
              setMtdMetrics(mtdAgg);
            }
            resultIndex++;
          }

          const qtdWeekIds = allWeeks
            .filter(w => new Date(w.start_date) >= quarterStart)
            .map(w => w.id);

          if (qtdWeekIds.length > 0) {
            const qtdSubmissions = results[resultIndex]?.data;
            if (qtdSubmissions && qtdSubmissions.length > 0) {
              const qtdAgg = aggregateSubmissions(qtdSubmissions);
              setQtdMetrics(qtdAgg);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const aggregateSubmissions = (submissions: any[]): AggregatedMetrics => {
    return {
      cold_calls: submissions.reduce((sum, s) => sum + (s.cold_calls || 0), 0),
      li_messages: submissions.reduce((sum, s) => sum + (s.li_messages || 0), 0),
      videos: submissions.reduce((sum, s) => sum + (s.videos || 0), 0),
      decision_maker_connects: submissions.reduce((sum, s) => sum + (s.decision_maker_connects || 0), 0),
      meetings_booked: submissions.reduce((sum, s) => sum + (s.meetings_booked || 0), 0),
      discovery_calls: submissions.reduce((sum, s) => sum + (s.discovery_calls || 0), 0),
      opportunities_advanced: submissions.reduce((sum, s) => sum + (s.opportunities_advanced || 0), 0),
      pipeline_coverage_ratio: submissions.reduce((sum, s) => sum + (s.pipeline_coverage_ratio || 0), 0) / submissions.length,
      weeksCount: submissions.length
    };
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

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  };

  const getTrendIcon = (current: number, previous: number) => {
    const change = current - previous;
    if (change > 0) return <TrendingUp className="w-4 h-4 text-emerald-600" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const getTrendColor = (current: number, previous: number) => {
    const change = current - previous;
    if (change > 0) return 'text-emerald-600';
    if (change < 0) return 'text-red-600';
    return 'text-slate-500';
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          Welcome back, {user?.name}
        </h2>
        {currentWeek ? (
          <p className="text-slate-600">
            Week of {new Date(currentWeek.start_date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        ) : (
          <p className="text-amber-600 font-medium">No active week available</p>
        )}
      </div>

      {!currentWeek ? (
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-amber-50 border border-amber-200 rounded-xl shadow-sm p-8 text-center">
            <Calendar className="w-16 h-16 text-amber-600 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-slate-900 mb-2">No Active Week</h3>
            <p className="text-slate-600">
              There's no active week set up yet. Please contact your admin to create weeks for this quarter.
            </p>
          </div>
        </div>
      ) : (
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
      )}

      {currentWeek && (
        <>
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
            <p className="text-sm text-slate-600 mb-1">MTD Revenue</p>
            <p className="text-2xl font-bold text-slate-900">
              ${(submission?.revenue_mtd || 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">QTD Revenue</p>
            <p className="text-2xl font-bold text-slate-900">
              ${(submission?.revenue_qtd || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {submission && (previousSubmission || mtdMetrics || qtdMetrics) && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Performance Trends</h3>
          </div>
          <p className="text-sm text-slate-600 mb-4">Track your progress with Week-over-Week, Month-to-Date, and Quarter-to-Date metrics</p>

          <div className="space-y-6">
            {previousSubmission && (
              <div>
                <h4 className="text-md font-semibold text-slate-900 mb-3">Week-over-Week (WoW)</h4>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-2">Cold Calls</p>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-slate-900">{submission.cold_calls}</p>
                  <p className="text-sm text-slate-500">vs {previousSubmission.cold_calls}</p>
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(submission.cold_calls, previousSubmission.cold_calls)}
                  <span className={`text-sm font-medium ${getTrendColor(submission.cold_calls, previousSubmission.cold_calls)}`}>
                    {Math.abs(calculateChange(submission.cold_calls, previousSubmission.cold_calls)).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-2">Emails</p>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-slate-900">{submission.emails}</p>
                  <p className="text-sm text-slate-500">vs {previousSubmission.emails}</p>
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(submission.emails, previousSubmission.emails)}
                  <span className={`text-sm font-medium ${getTrendColor(submission.emails, previousSubmission.emails)}`}>
                    {Math.abs(calculateChange(submission.emails, previousSubmission.emails)).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-2">LinkedIn Messages</p>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-slate-900">{submission.li_messages}</p>
                  <p className="text-sm text-slate-500">vs {previousSubmission.li_messages}</p>
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(submission.li_messages, previousSubmission.li_messages)}
                  <span className={`text-sm font-medium ${getTrendColor(submission.li_messages, previousSubmission.li_messages)}`}>
                    {Math.abs(calculateChange(submission.li_messages, previousSubmission.li_messages)).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-2">Videos</p>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-slate-900">{submission.videos}</p>
                  <p className="text-sm text-slate-500">vs {previousSubmission.videos}</p>
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(submission.videos, previousSubmission.videos)}
                  <span className={`text-sm font-medium ${getTrendColor(submission.videos, previousSubmission.videos)}`}>
                    {Math.abs(calculateChange(submission.videos, previousSubmission.videos)).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-2">DM Connects</p>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-slate-900">{submission.decision_maker_connects}</p>
                  <p className="text-sm text-slate-500">vs {previousSubmission.decision_maker_connects}</p>
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(submission.decision_maker_connects, previousSubmission.decision_maker_connects)}
                  <span className={`text-sm font-medium ${getTrendColor(submission.decision_maker_connects, previousSubmission.decision_maker_connects)}`}>
                    {Math.abs(calculateChange(submission.decision_maker_connects, previousSubmission.decision_maker_connects)).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-2">Meetings Booked</p>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-slate-900">{submission.meetings_booked}</p>
                  <p className="text-sm text-slate-500">vs {previousSubmission.meetings_booked}</p>
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(submission.meetings_booked, previousSubmission.meetings_booked)}
                  <span className={`text-sm font-medium ${getTrendColor(submission.meetings_booked, previousSubmission.meetings_booked)}`}>
                    {Math.abs(calculateChange(submission.meetings_booked, previousSubmission.meetings_booked)).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-2">Discovery Calls</p>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-slate-900">{submission.discovery_calls}</p>
                  <p className="text-sm text-slate-500">vs {previousSubmission.discovery_calls}</p>
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(submission.discovery_calls, previousSubmission.discovery_calls)}
                  <span className={`text-sm font-medium ${getTrendColor(submission.discovery_calls, previousSubmission.discovery_calls)}`}>
                    {Math.abs(calculateChange(submission.discovery_calls, previousSubmission.discovery_calls)).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-2">Opportunities Advanced</p>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-slate-900">{submission.opportunities_advanced}</p>
                  <p className="text-sm text-slate-500">vs {previousSubmission.opportunities_advanced}</p>
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(submission.opportunities_advanced, previousSubmission.opportunities_advanced)}
                  <span className={`text-sm font-medium ${getTrendColor(submission.opportunities_advanced, previousSubmission.opportunities_advanced)}`}>
                    {Math.abs(calculateChange(submission.opportunities_advanced, previousSubmission.opportunities_advanced)).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-2">Pipeline Coverage</p>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-slate-900">{submission.pipeline_coverage_ratio.toFixed(1)}x</p>
                  <p className="text-sm text-slate-500">vs {previousSubmission.pipeline_coverage_ratio.toFixed(1)}x</p>
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(submission.pipeline_coverage_ratio, previousSubmission.pipeline_coverage_ratio)}
                  <span className={`text-sm font-medium ${getTrendColor(submission.pipeline_coverage_ratio, previousSubmission.pipeline_coverage_ratio)}`}>
                    {Math.abs(calculateChange(submission.pipeline_coverage_ratio, previousSubmission.pipeline_coverage_ratio)).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
                </div>
              </div>
            )}

            {mtdMetrics && (
              <div>
                <h4 className="text-md font-semibold text-slate-900 mb-3">Month-to-Date (MTD)</h4>
                <p className="text-xs text-slate-500 mb-3">Cumulative totals across {mtdMetrics.weeksCount} week(s) this month</p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600 mb-2">Cold Calls</p>
                    <p className="text-2xl font-bold text-slate-900">{mtdMetrics.cold_calls}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600 mb-2">Emails</p>
                    <p className="text-2xl font-bold text-slate-900">{mtdMetrics.emails}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600 mb-2">LinkedIn Messages</p>
                    <p className="text-2xl font-bold text-slate-900">{mtdMetrics.li_messages}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600 mb-2">Videos</p>
                    <p className="text-2xl font-bold text-slate-900">{mtdMetrics.videos}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600 mb-2">DM Connects</p>
                    <p className="text-2xl font-bold text-slate-900">{mtdMetrics.decision_maker_connects}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600 mb-2">Meetings Booked</p>
                    <p className="text-2xl font-bold text-slate-900">{mtdMetrics.meetings_booked}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600 mb-2">Discovery Calls</p>
                    <p className="text-2xl font-bold text-slate-900">{mtdMetrics.discovery_calls}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600 mb-2">Opportunities Advanced</p>
                    <p className="text-2xl font-bold text-slate-900">{mtdMetrics.opportunities_advanced}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600 mb-2">Pipeline Coverage</p>
                    <p className="text-2xl font-bold text-slate-900">{mtdMetrics.pipeline_coverage_ratio.toFixed(1)}x</p>
                  </div>
                </div>
              </div>
            )}

            {qtdMetrics && (
              <div>
                <h4 className="text-md font-semibold text-slate-900 mb-3">Quarter-to-Date (QTD)</h4>
                <p className="text-xs text-slate-500 mb-3">Cumulative totals across {qtdMetrics.weeksCount} week(s) this quarter</p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600 mb-2">Cold Calls</p>
                    <p className="text-2xl font-bold text-slate-900">{qtdMetrics.cold_calls}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600 mb-2">LinkedIn Messages</p>
                    <p className="text-2xl font-bold text-slate-900">{qtdMetrics.li_messages}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600 mb-2">Videos</p>
                    <p className="text-2xl font-bold text-slate-900">{qtdMetrics.videos}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600 mb-2">DM Connects</p>
                    <p className="text-2xl font-bold text-slate-900">{qtdMetrics.decision_maker_connects}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600 mb-2">Meetings Booked</p>
                    <p className="text-2xl font-bold text-slate-900">{qtdMetrics.meetings_booked}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600 mb-2">Discovery Calls</p>
                    <p className="text-2xl font-bold text-slate-900">{qtdMetrics.discovery_calls}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600 mb-2">Opportunities Advanced</p>
                    <p className="text-2xl font-bold text-slate-900">{qtdMetrics.opportunities_advanced}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600 mb-2">Pipeline Coverage</p>
                    <p className="text-2xl font-bold text-slate-900">{qtdMetrics.pipeline_coverage_ratio.toFixed(1)}x</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
        </>
      )}
    </div>
  );
}
