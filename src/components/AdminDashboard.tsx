import { useEffect, useState } from 'react';
import { supabase, Week, User } from '../lib/supabase';
import { TrendingUp, TrendingDown, Users, Target, Activity, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronRight, Settings, BarChart3, Calendar } from 'lucide-react';
import { TargetsManagement } from './TargetsManagement';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { WeekManagement } from './WeekManagement';

type WeeklySubmission = {
  id: string;
  user_id: string;
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
  deals_advancing: any[];
  deals_stalling: any[];
  new_deals: any[];
  closing_opportunities: any[];
  wins: string[];
  blockers_help: string;
  this_week_goal: string;
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

export function AdminDashboard() {
  const [availableWeeks, setAvailableWeeks] = useState<Week[]>([]);
  const [currentWeek, setCurrentWeek] = useState<Week | null>(null);
  const [reps, setReps] = useState<User[]>([]);
  const [submissions, setSubmissions] = useState<{ [userId: string]: WeeklySubmission }>({});
  const [previousWeekSubmissions, setPreviousWeekSubmissions] = useState<{ [userId: string]: WeeklySubmission }>({});
  const [mtdMetrics, setMtdMetrics] = useState<AggregatedMetrics | null>(null);
  const [qtdMetrics, setQtdMetrics] = useState<AggregatedMetrics | null>(null);
  const [expandedReps, setExpandedReps] = useState<{ [userId: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [showTargetsModal, setShowTargetsModal] = useState(false);
  const [showWeekManagement, setShowWeekManagement] = useState(false);
  const [activeTab, setActiveTab] = useState<'team' | 'analytics'>('team');

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
        .order('start_date', { ascending: false })
        .limit(10);

      if (weeksData && weeksData.length > 0) {
        setAvailableWeeks(weeksData);
        const activeWeek = weeksData.find(w => w.status === 'active') || weeksData[0];
        setCurrentWeek(activeWeek);
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
            submissionsMap[sub.user_id] = sub;
          });
        }
        setSubmissions(submissionsMap);

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
              previousSubmissionsMap[sub.user_id] = sub;
            });
          }
          setPreviousWeekSubmissions(previousSubmissionsMap);
        }

        const currentDate = new Date(currentWeek.end_date);
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const quarter = Math.floor(currentDate.getMonth() / 3);
        const quarterStart = new Date(currentDate.getFullYear(), quarter * 3, 1);

        const { data: allWeeks } = await supabase
          .from('weeks')
          .select('id, start_date, end_date')
          .lte('start_date', currentWeek.end_date)
          .order('start_date', { ascending: true });

        if (allWeeks) {
          const mtdWeekIds = allWeeks
            .filter(w => new Date(w.start_date) >= monthStart)
            .map(w => w.id);

          const qtdWeekIds = allWeeks
            .filter(w => new Date(w.start_date) >= quarterStart)
            .map(w => w.id);

          const { data: mtdSubmissions } = await supabase
            .from('weekly_submissions')
            .select('*')
            .in('week_id', mtdWeekIds);

          const { data: qtdSubmissions } = await supabase
            .from('weekly_submissions')
            .select('*')
            .in('week_id', qtdWeekIds);

          if (mtdSubmissions && mtdSubmissions.length > 0) {
            const mtdAgg = aggregateSubmissions(mtdSubmissions);
            setMtdMetrics(mtdAgg);
          }

          if (qtdSubmissions && qtdSubmissions.length > 0) {
            const qtdAgg = aggregateSubmissions(qtdSubmissions);
            setQtdMetrics(qtdAgg);
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
    const uniqueWeeks = new Set(submissions.map(s => s.week_id));
    return {
      cold_calls: submissions.reduce((sum, s) => sum + (s.cold_calls || 0), 0),
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

  const formatRevenue = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
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
    const totalRevenueMTD = Object.values(submissions).reduce((sum, sub) => sum + (sub.revenue_mtd || 0), 0);
    const totalRevenueQTD = Object.values(submissions).reduce((sum, sub) => sum + (sub.revenue_qtd || 0), 0);
    const totalColdCalls = Object.values(submissions).reduce((sum, sub) => sum + (sub.cold_calls || 0), 0);
    const totalEmails = Object.values(submissions).reduce((sum, sub) => sum + (sub.emails || 0), 0);
    const totalLiMessages = Object.values(submissions).reduce((sum, sub) => sum + (sub.li_messages || 0), 0);
    const totalDMConnects = Object.values(submissions).reduce((sum, sub) => sum + (sub.decision_maker_connects || 0), 0);
    const totalMeetings = Object.values(submissions).reduce((sum, sub) => sum + (sub.meetings_booked || 0), 0);
    const totalDiscovery = Object.values(submissions).reduce((sum, sub) => sum + (sub.discovery_calls || 0), 0);
    const totalOppsAdvanced = Object.values(submissions).reduce((sum, sub) => sum + (sub.opportunities_advanced || 0), 0);

    const avgPipelineCoverage = Object.values(submissions).length > 0
      ? Object.values(submissions).reduce((sum, sub) => sum + (sub.pipeline_coverage_ratio || 0), 0) / Object.values(submissions).length
      : 0;

    const percentToQuotaMTD = totalQuota > 0 ? (totalRevenueMTD / (totalQuota / 3)) * 100 : 0;
    const percentToQuotaQTD = totalQuota > 0 ? (totalRevenueQTD / totalQuota) * 100 : 0;

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
      avgPipelineCoverage,
      percentToQuotaMTD,
      percentToQuotaQTD,
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
        return <AlertCircle className="w-5 h-5 text-slate-400" />;
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

  const toggleRepExpansion = (userId: string) => {
    setExpandedReps(prev => ({ ...prev, [userId]: !prev[userId] }));
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

        <div className="flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('team')}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === 'team'
                ? 'text-emerald-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Dashboard
            </div>
            {activeTab === 'team' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === 'analytics'
                ? 'text-emerald-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Week-over-Week Analytics
            </div>
            {activeTab === 'analytics' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"></div>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'analytics' ? (
        <AnalyticsDashboard />
      ) : (
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
                  {new Date(week.end_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
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
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
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
            <span className="text-sm font-medium text-slate-600">QTD Revenue</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {formatRevenue(totals.totalRevenueQTD)}
          </p>
          <p className="text-sm text-slate-600 mt-1">
            {totals.percentToQuotaQTD.toFixed(1)}% to quota
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <span className="text-sm font-medium text-slate-600">MTD Revenue</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {formatRevenue(totals.totalRevenueMTD)}
          </p>
          <p className="text-sm text-slate-600 mt-1">
            {totals.percentToQuotaMTD.toFixed(1)}% to monthly
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-8 h-8 text-orange-600" />
            <span className="text-sm font-medium text-slate-600">Pipeline</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {totals.avgPipelineCoverage.toFixed(1)}x
          </p>
          <p className="text-sm text-slate-600 mt-1">
            Avg coverage
          </p>
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
            const status = submission?.status || 'not_started';
            const isExpanded = expandedReps[rep.id];
            const percentToQuota = rep.quarterly_quota > 0
              ? ((submission?.revenue_qtd || 0) / rep.quarterly_quota) * 100
              : 0;

            return (
              <div key={rep.id} className="border border-slate-200 rounded-lg overflow-hidden">
                <div
                  onClick={() => toggleRepExpansion(rep.id)}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    )}

                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{rep.name}</p>
                      <p className="text-sm text-slate-500">{rep.email}</p>
                    </div>

                    <div className="text-center min-w-[100px]">
                      <p className="text-sm text-slate-600">Quota</p>
                      <p className="font-semibold text-slate-900">
                        ${rep.quarterly_quota.toLocaleString()}
                      </p>
                    </div>

                    <div className="text-center min-w-[100px]">
                      <p className="text-sm text-slate-600">QTD Revenue</p>
                      <p className="font-semibold text-slate-900">
                        {formatRevenue(submission?.revenue_qtd || 0)}
                      </p>
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

                    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${getStatusColor(status)}`}>
                      {getStatusIcon(status)}
                      <span className="text-sm font-medium capitalize">
                        {status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {isExpanded && submission && (
                  <div className="border-t border-slate-200 bg-slate-50 p-6">
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-3">Activities This Week</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Cold Calls:</span>
                            <span className="font-medium">{submission.cold_calls || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Emails:</span>
                            <span className="font-medium">{submission.emails || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">LI Messages:</span>
                            <span className="font-medium">{submission.li_messages || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">DM Connects:</span>
                            <span className="font-medium">{submission.decision_maker_connects || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Meetings Booked:</span>
                            <span className="font-medium">{submission.meetings_booked || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Discovery Calls:</span>
                            <span className="font-medium">{submission.discovery_calls || 0}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 mb-3">Performance Metrics</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Revenue MTD:</span>
                            <span className="font-medium">{formatRevenue(submission.revenue_mtd || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Revenue QTD:</span>
                            <span className="font-medium">{formatRevenue(submission.revenue_qtd || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Pipeline Amount:</span>
                            <span className="font-medium">{submission.pipeline_coverage_ratio || 0}x</span>
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
                                <p className="font-bold text-emerald-700">${opp.value?.toLocaleString()}</p>
                              </div>
                            </div>
                          ))}
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

                    {submission.this_week_goal && (
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-3">Next Week's Goal</h4>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-slate-700">{submission.this_week_goal}</p>
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
                          {Math.abs(calculateChange(totals.totalColdCalls, previousTotals.coldCalls)).toFixed(0)}%
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
                          {Math.abs(calculateChange(totals.totalEmails, previousTotals.emails)).toFixed(0)}%
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
                          {Math.abs(calculateChange(totals.totalLiMessages, previousTotals.liMessages)).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">DM Connects</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-slate-900">{totals.totalDMConnects}</p>
                    {previousTotals && (
                      <div className="flex items-center gap-1">
                        {getTrendIcon(totals.totalDMConnects, previousTotals.dmConnects)}
                        <span className={`text-xs font-medium ${getTrendColor(totals.totalDMConnects, previousTotals.dmConnects)}`}>
                          {Math.abs(calculateChange(totals.totalDMConnects, previousTotals.dmConnects)).toFixed(0)}%
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
                          {Math.abs(calculateChange(totals.totalMeetings, previousTotals.meetings)).toFixed(0)}%
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
                          {Math.abs(calculateChange(totals.totalDiscovery, previousTotals.discovery)).toFixed(0)}%
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
                          {Math.abs(calculateChange(totals.totalOppsAdvanced, previousTotals.oppsAdvanced)).toFixed(0)}%
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
                <h4 className="text-md font-semibold text-slate-900 mb-3">Month-to-Date (MTD)</h4>
                <p className="text-xs text-slate-500 mb-3">Cumulative team totals across {mtdMetrics.weeksCount} week(s) this month</p>
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
                    <p className="text-sm text-slate-600 mb-2">Opps Advanced</p>
                    <p className="text-2xl font-bold text-slate-900">{mtdMetrics.opportunities_advanced}</p>
                  </div>
                </div>
              </div>
            )}

            {qtdMetrics && (
              <div>
                <h4 className="text-md font-semibold text-slate-900 mb-3">Quarter-to-Date (QTD)</h4>
                <p className="text-xs text-slate-500 mb-3">Cumulative team totals across {qtdMetrics.weeksCount} week(s) this quarter</p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600 mb-2">Cold Calls</p>
                    <p className="text-2xl font-bold text-slate-900">{qtdMetrics.cold_calls}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600 mb-2">Emails</p>
                    <p className="text-2xl font-bold text-slate-900">{qtdMetrics.emails}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600 mb-2">LinkedIn Messages</p>
                    <p className="text-2xl font-bold text-slate-900">{qtdMetrics.li_messages}</p>
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
                    <p className="text-sm text-slate-600 mb-2">Opps Advanced</p>
                    <p className="text-2xl font-bold text-slate-900">{qtdMetrics.opportunities_advanced}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
        </div>
      )}

      {showTargetsModal && (
        <TargetsManagement onClose={() => setShowTargetsModal(false)} />
      )}

      {showWeekManagement && (
        <WeekManagement onClose={() => {
          setShowWeekManagement(false);
          loadAvailableWeeks();
        }} />
      )}
    </div>
  );
}
