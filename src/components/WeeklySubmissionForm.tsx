import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Save, Send, Plus, Trash2, ArrowLeft, Edit2 } from 'lucide-react';

type Week = {
  id: string;
  week_number: number;
  year: number;
  start_date: string;
  end_date: string;
  status: string;
};

type WeeklySubmission = {
  id: string;
  status: 'not_started' | 'in_progress' | 'submitted';
  wins?: string[];
  whats_working_well?: string;
  positive_feedback?: string;
  prospecting_activities?: number;
  cold_calls?: number;
  emails?: number;
  li_messages?: number;
  videos?: number;
  decision_maker_connects?: number;
  meetings_booked?: number;
  discovery_calls?: number;
  opportunities_advanced?: number;
  pipeline_coverage_ratio?: number;
  revenue_mtd?: number;
  revenue_qtd?: number;
  average_deal_size?: number;
  deals_advancing?: any[];
  deals_stalling?: any[];
  new_deals?: any[];
  closing_opportunities?: any[];
  f2f_meetings?: any[];
  call_review_link?: string;
  call_review_focus?: string;
  blockers_help?: string;
  deal_blockers?: string[];
  support_needed?: string[];
  this_week_goal?: string;
  last_week_goal_text?: string;
  last_week_goal_achieved?: 'yes' | 'partial' | 'no';
  last_week_goal_notes?: string;
  self_care?: string;
  energy_level?: 'high' | 'medium' | 'low';
  manager_support?: string;
};

type Commitment = {
  id?: string;
  commitment_text: string;
  deadline: string;
  success_metric: string;
  status?: string;
  notes?: string;
};

type Props = {
  onBack: () => void;
};

export function WeeklySubmissionForm({ onBack }: Props) {
  const { user } = useAuth();
  const [availableWeeks, setAvailableWeeks] = useState<Week[]>([]);
  const [currentWeek, setCurrentWeek] = useState<Week | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'not_started' | 'in_progress' | 'submitted'>('not_started');

  const [wins, setWins] = useState<string[]>(['']);
  const [whatsWorking, setWhatsWorking] = useState('');
  const [positiveFeedback, setPositiveFeedback] = useState('');

  const [coldCalls, setColdCalls] = useState(0);
  const [emails, setEmails] = useState(0);
  const [liMessages, setLiMessages] = useState(0);
  const [videos, setVideos] = useState(0);
  const [dmConnects, setDmConnects] = useState(0);
  const [meetingsBooked, setMeetingsBooked] = useState(0);
  const [discoveryCalls, setDiscoveryCalls] = useState(0);
  const [opportunitiesAdvanced, setOpportunitiesAdvanced] = useState(0);

  const [pipelineCoverage, setPipelineCoverage] = useState(0);
  const [revenueMtd, setRevenueMtd] = useState(0);
  const [revenueQtd, setRevenueQtd] = useState(0);
  const [avgDealSize, setAvgDealSize] = useState(0);

  const [dealsAdvancing, setDealsAdvancing] = useState<Array<{
    dealName: string;
    nextStage: string;
    nextStep: string;
  }>>([{ dealName: '', nextStage: '', nextStep: '' }]);

  const [dealsStalling, setDealsStalling] = useState<Array<{
    dealName: string;
    whyStuck: string;
    yourPlan: string;
    helpNeeded: string;
  }>>([{ dealName: '', whyStuck: '', yourPlan: '', helpNeeded: '' }]);

  const [newDeals, setNewDeals] = useState<Array<{
    companyName: string;
    dealSource: string;
    dealPotential: string;
  }>>([{ companyName: '', dealSource: '', dealPotential: '' }]);

  const [closingOpps, setClosingOpps] = useState<Array<{
    companyDeal: string;
    value: number;
    closeDate: string;
    confidenceBlockers: string;
  }>>([{ companyDeal: '', value: 0, closeDate: '', confidenceBlockers: '' }]);

  const [f2fMeetings, setF2fMeetings] = useState<Array<{
    clientProspect: string;
    dates: string;
    where: string;
    purposePrep: string;
  }>>([{ clientProspect: '', dates: '', where: '', purposePrep: '' }]);

  const [callReviewLink, setCallReviewLink] = useState('');
  const [callReviewFocus, setCallReviewFocus] = useState('');

  const [blockersHelp, setBlockersHelp] = useState('');
  const [dealBlockers, setDealBlockers] = useState<string[]>(['']);
  const [supportNeeded, setSupportNeeded] = useState<string[]>(['']);

  const [thisWeekGoal, setThisWeekGoal] = useState('');
  const [lastWeekGoal, setLastWeekGoal] = useState<{
    goalText: string;
    achieved?: 'yes' | 'partial' | 'no';
    notes: string;
  } | null>(null);

  const [selfCare, setSelfCare] = useState('');
  const [energyLevel, setEnergyLevel] = useState<'high' | 'medium' | 'low'>('medium');
  const [managerSupport, setManagerSupport] = useState('');

  const [commitments, setCommitments] = useState<Array<{
    text: string;
    deadline: string;
    successMetric: string;
  }>>([
    { text: '', deadline: '', successMetric: '' },
    { text: '', deadline: '', successMetric: '' },
    { text: '', deadline: '', successMetric: '' }
  ]);

  const [lastCommitments, setLastCommitments] = useState<Commitment[]>([]);
  const [targets, setTargets] = useState<{
    target_cold_calls: number;
    target_emails: number;
    target_li_messages: number;
    target_videos: number;
    target_dm_connects: number;
    target_meetings_booked: number;
    target_discovery_calls: number;
    target_opportunities_advanced: number;
    target_pipeline_coverage: number;
  } | null>(null);

  useEffect(() => {
    loadAvailableWeeks();
    loadTargets();
  }, [user?.id]);

  useEffect(() => {
    if (currentWeek) {
      loadFormData(currentWeek.id);
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

  const loadTargets = async () => {
    if (!user) return;

    try {
      const { data: targetsData } = await supabase
        .from('weekly_activity_targets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (targetsData) {
        setTargets(targetsData);
      }
    } catch (error) {
      console.error('Error loading targets:', error);
    }
  };

  const loadFormData = async (weekId: string) => {
    if (!user) return;

    try {
      const { data: submission } = await supabase
        .from('weekly_submissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_id', weekId)
        .maybeSingle();

      if (submission) {
        setSubmissionId(submission.id);
        setStatus(submission.status);
        populateFormFromSubmission(submission);

        const { data: commitmentsData } = await supabase
          .from('submission_commitments')
          .select('*')
          .eq('submission_id', submission.id);

        if (commitmentsData && commitmentsData.length > 0) {
          setCommitments(commitmentsData.map(c => ({
            text: c.commitment_text,
            deadline: c.deadline,
            successMetric: c.success_metric
          })));
        }
      } else {
        resetForm();
        await loadPreviousWeekData(weekId);
      }
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  };

  const resetForm = () => {
    setSubmissionId(null);
    setStatus('not_started');
    setWins(['']);
    setWhatsWorking('');
    setPositiveFeedback('');
    setColdCalls(0);
    setEmails(0);
    setLiMessages(0);
    setVideos(0);
    setDmConnects(0);
    setMeetingsBooked(0);
    setDiscoveryCalls(0);
    setOpportunitiesAdvanced(0);
    setPipelineCoverage(0);
    setRevenueMtd(0);
    setRevenueQtd(0);
    setAvgDealSize(0);
    setDealsAdvancing([{ dealName: '', nextStage: '', nextStep: '' }]);
    setDealsStalling([{ dealName: '', whyStuck: '', yourPlan: '', helpNeeded: '' }]);
    setNewDeals([{ companyName: '', dealSource: '', dealPotential: '' }]);
    setClosingOpps([{ companyDeal: '', value: 0, closeDate: '', confidenceBlockers: '' }]);
    setF2fMeetings([{ clientProspect: '', dates: '', where: '', purposePrep: '' }]);
    setCallReviewLink('');
    setCallReviewFocus('');
    setBlockersHelp('');
    setDealBlockers(['']);
    setSupportNeeded(['']);
    setThisWeekGoal('');
    setSelfCare('');
    setEnergyLevel('medium');
    setManagerSupport('');
    setCommitments([
      { text: '', deadline: '', successMetric: '' },
      { text: '', deadline: '', successMetric: '' },
      { text: '', deadline: '', successMetric: '' }
    ]);
  };

  const loadPreviousWeekData = async (currentWeekId: string) => {
    if (!user) return;

    try {
      const { data: prevWeek } = await supabase
        .from('weeks')
        .select('*')
        .neq('id', currentWeekId)
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (prevWeek) {
        const { data: prevSubmission } = await supabase
          .from('weekly_submissions')
          .select('*')
          .eq('user_id', user.id)
          .eq('week_id', prevWeek.id)
          .maybeSingle();

        if (prevSubmission) {
          if (prevSubmission.this_week_goal) {
            setLastWeekGoal({
              goalText: prevSubmission.this_week_goal,
              achieved: undefined,
              notes: ''
            });
          }

          const { data: prevCommitments } = await supabase
            .from('submission_commitments')
            .select('*')
            .eq('submission_id', prevSubmission.id);

          if (prevCommitments) {
            setLastCommitments(prevCommitments as Commitment[]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading previous week data:', error);
    }
  };

  const populateFormFromSubmission = (submission: WeeklySubmission) => {
    setWins(submission.wins || ['']);
    setWhatsWorking(submission.whats_working_well || '');
    setPositiveFeedback(submission.positive_feedback || '');
    setColdCalls(submission.cold_calls || 0);
    setEmails(submission.emails || 0);
    setLiMessages(submission.li_messages || 0);
    setVideos(submission.videos || 0);
    setDmConnects(submission.decision_maker_connects || 0);
    setMeetingsBooked(submission.meetings_booked || 0);
    setDiscoveryCalls(submission.discovery_calls || 0);
    setOpportunitiesAdvanced(submission.opportunities_advanced || 0);
    setPipelineCoverage(submission.pipeline_coverage_ratio || 0);
    setRevenueMtd(submission.revenue_mtd || 0);
    setRevenueQtd(submission.revenue_qtd || 0);
    setAvgDealSize(submission.average_deal_size || 0);
    setDealsAdvancing(submission.deals_advancing || [{ dealName: '', nextStage: '', nextStep: '' }]);
    setDealsStalling(submission.deals_stalling || [{ dealName: '', whyStuck: '', yourPlan: '', helpNeeded: '' }]);
    setNewDeals(submission.new_deals || [{ companyName: '', dealSource: '', dealPotential: '' }]);
    setClosingOpps(submission.closing_opportunities || [{ companyDeal: '', value: 0, closeDate: '', confidenceBlockers: '' }]);
    setF2fMeetings(submission.f2f_meetings || [{ clientProspect: '', dates: '', where: '', purposePrep: '' }]);
    setCallReviewLink(submission.call_review_link || '');
    setCallReviewFocus(submission.call_review_focus || '');
    setBlockersHelp(submission.blockers_help || '');
    setDealBlockers(submission.deal_blockers || ['']);
    setSupportNeeded(submission.support_needed || ['']);
    setThisWeekGoal(submission.this_week_goal || '');
    if (submission.last_week_goal_text) {
      setLastWeekGoal({
        goalText: submission.last_week_goal_text,
        achieved: submission.last_week_goal_achieved,
        notes: submission.last_week_goal_notes || ''
      });
    }
    setSelfCare(submission.self_care || '');
    setEnergyLevel(submission.energy_level || 'medium');
    setManagerSupport(submission.manager_support || '');
  };

  const handleReopenForEditing = () => {
    setStatus('in_progress');
  };

  const handleSave = async (submitNow: boolean = false) => {
    if (!user || !currentWeek) return;

    setSaving(true);

    try {
      const submissionData = {
        user_id: user.id,
        week_id: currentWeek.id,
        wins: wins.filter(w => w.trim()),
        whats_working_well: whatsWorking,
        positive_feedback: positiveFeedback,
        prospecting_activities: coldCalls + emails + liMessages,
        cold_calls: coldCalls,
        emails: emails,
        li_messages: liMessages,
        videos: videos,
        decision_maker_connects: dmConnects,
        meetings_booked: meetingsBooked,
        discovery_calls: discoveryCalls,
        opportunities_advanced: opportunitiesAdvanced,
        pipeline_coverage_ratio: pipelineCoverage,
        revenue_mtd: revenueMtd,
        revenue_qtd: revenueQtd,
        average_deal_size: avgDealSize,
        deals_advancing: dealsAdvancing.filter(d => d.dealName),
        deals_stalling: dealsStalling.filter(d => d.dealName),
        new_deals: newDeals.filter(d => d.companyName),
        closing_opportunities: closingOpps.filter(o => o.companyDeal),
        f2f_meetings: f2fMeetings.filter(m => m.clientProspect),
        call_review_link: callReviewLink,
        call_review_focus: callReviewFocus,
        blockers_help: blockersHelp,
        deal_blockers: dealBlockers.filter(b => b.trim()),
        support_needed: supportNeeded.filter(s => s.trim()),
        this_week_goal: thisWeekGoal,
        last_week_goal_text: lastWeekGoal?.goalText,
        last_week_goal_achieved: lastWeekGoal?.achieved,
        last_week_goal_notes: lastWeekGoal?.notes,
        self_care: selfCare,
        energy_level: energyLevel,
        manager_support: managerSupport,
        status: submitNow ? 'submitted' : 'in_progress',
        submitted_at: submitNow ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };

      let finalSubmissionId = submissionId;

      if (submissionId) {
        await supabase
          .from('weekly_submissions')
          .update(submissionData)
          .eq('id', submissionId);
      } else {
        const { data, error } = await supabase
          .from('weekly_submissions')
          .insert(submissionData)
          .select()
          .single();

        if (error) throw error;
        finalSubmissionId = data.id;
        setSubmissionId(data.id);
      }

      if (finalSubmissionId) {
        await supabase
          .from('submission_commitments')
          .delete()
          .eq('submission_id', finalSubmissionId);

        const validCommitments = commitments.filter(c => c.text.trim());
        if (validCommitments.length > 0) {
          await supabase
            .from('submission_commitments')
            .insert(validCommitments.map(c => ({
              submission_id: finalSubmissionId,
              commitment_text: c.text,
              deadline: c.deadline,
              success_metric: c.successMetric,
              status: 'in_progress'
            })));
        }
      }

      setStatus(submitNow ? 'submitted' : 'in_progress');
      alert(submitNow ? 'Submitted successfully!' : 'Saved as draft');

      if (submitNow) {
        onBack();
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateCommitmentStatus = async (commitmentId: string, newStatus: string, notes: string) => {
    await supabase
      .from('submission_commitments')
      .update({ status: newStatus, notes })
      .eq('id', commitmentId);
  };

  if (!currentWeek) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>

        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Weekly Submission</h1>
            <p className="text-sm text-slate-500">
              {user?.name} | Q Quota: ${user?.quarterly_quota.toLocaleString()} | Due: Thursday 5:00 PM PT
            </p>
          </div>

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
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <p className="text-slate-700">
            <span className="font-semibold">Week of:</span>{' '}
            {new Date(currentWeek.start_date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric'
            })}{' '}
            -{' '}
            {new Date(currentWeek.end_date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {lastCommitments.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Last Week's Commitments
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Review and update status of your commitments from last week
            </p>

            <div className="space-y-4">
              {lastCommitments.map((commitment) => (
                <div key={commitment.id} className="border border-slate-200 rounded-lg p-4">
                  <p className="font-medium text-slate-900 mb-2">{commitment.commitment_text}</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Status
                      </label>
                      <select
                        defaultValue={commitment.status}
                        onChange={(e) => updateCommitmentStatus(commitment.id!, e.target.value, commitment.notes || '')}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="accomplished">Accomplished</option>
                        <option value="in_progress">In Progress</option>
                        <option value="not_started">Not Started</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Notes
                      </label>
                      <input
                        type="text"
                        defaultValue={commitment.notes}
                        onBlur={(e) => updateCommitmentStatus(commitment.id!, commitment.status || 'in_progress', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        placeholder="Any notes..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {lastWeekGoal && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Last Week's Goal Accountability
            </h2>

            <div className="border border-slate-200 rounded-lg p-4">
              <p className="font-medium text-slate-900 mb-3">Last Week's Goal:</p>
              <p className="text-slate-700 mb-4">{lastWeekGoal.goalText}</p>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Achieved?
                  </label>
                  <select
                    value={lastWeekGoal.achieved || ''}
                    onChange={(e) => setLastWeekGoal({
                      ...lastWeekGoal,
                      achieved: e.target.value as 'yes' | 'partial' | 'no'
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select...</option>
                    <option value="yes">Yes</option>
                    <option value="partial">Partial</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={lastWeekGoal.notes}
                    onChange={(e) => setLastWeekGoal({
                      ...lastWeekGoal,
                      notes: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Wins & Momentum
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Biggest Wins This Week (up to 5)
              </label>
              {wins.map((win, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={win}
                    onChange={(e) => {
                      const newWins = [...wins];
                      newWins[index] = e.target.value;
                      setWins(newWins);
                    }}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder={`Win #${index + 1}`}
                  />
                  {wins.length > 1 && (
                    <button
                      onClick={() => setWins(wins.filter((_, i) => i !== index))}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              {wins.length < 5 && (
                <button
                  onClick={() => setWins([...wins, ''])}
                  className="flex items-center text-emerald-600 hover:text-emerald-700 text-sm font-medium mt-2"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Win
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                What's Working Well
              </label>
              <textarea
                value={whatsWorking}
                onChange={(e) => setWhatsWorking(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="Share what strategies or approaches are working..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Positive Feedback from Prospects/Clients
              </label>
              <textarea
                value={positiveFeedback}
                onChange={(e) => setPositiveFeedback(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="Any positive feedback you've received..."
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Activity & Performance Metrics
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Cold Calls
                {targets && (
                  <span className="ml-2 text-xs text-blue-600 font-normal">
                    (Target: {targets.target_cold_calls})
                  </span>
                )}
              </label>
              <input
                type="number"
                value={coldCalls}
                onChange={(e) => setColdCalls(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Emails
                {targets && (
                  <span className="ml-2 text-xs text-blue-600 font-normal">
                    (Target: {targets.target_emails})
                  </span>
                )}
              </label>
              <input
                type="number"
                value={emails}
                onChange={(e) => setEmails(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                LI Messages
                {targets && (
                  <span className="ml-2 text-xs text-blue-600 font-normal">
                    (Target: {targets.target_li_messages})
                  </span>
                )}
              </label>
              <input
                type="number"
                value={liMessages}
                onChange={(e) => setLiMessages(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Videos
                {targets && (
                  <span className="ml-2 text-xs text-blue-600 font-normal">
                    (Target: {targets.target_videos})
                  </span>
                )}
              </label>
              <input
                type="number"
                value={videos}
                onChange={(e) => setVideos(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Decision Maker Connects
                {targets && (
                  <span className="ml-2 text-xs text-blue-600 font-normal">
                    (Target: {targets.target_dm_connects})
                  </span>
                )}
              </label>
              <input
                type="number"
                value={dmConnects}
                onChange={(e) => setDmConnects(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Meetings Booked
                {targets && (
                  <span className="ml-2 text-xs text-blue-600 font-normal">
                    (Target: {targets.target_meetings_booked})
                  </span>
                )}
              </label>
              <input
                type="number"
                value={meetingsBooked}
                onChange={(e) => setMeetingsBooked(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Discovery Calls
                {targets && (
                  <span className="ml-2 text-xs text-blue-600 font-normal">
                    (Target: {targets.target_discovery_calls})
                  </span>
                )}
              </label>
              <input
                type="number"
                value={discoveryCalls}
                onChange={(e) => setDiscoveryCalls(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Opportunities Advanced
                {targets && (
                  <span className="ml-2 text-xs text-blue-600 font-normal">
                    (Target: {targets.target_opportunities_advanced})
                  </span>
                )}
              </label>
              <input
                type="number"
                value={opportunitiesAdvanced}
                onChange={(e) => setOpportunitiesAdvanced(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Pipeline Coverage
                {targets && (
                  <span className="ml-2 text-xs text-blue-600 font-normal">
                    (Target: {targets.target_pipeline_coverage}x)
                  </span>
                )}
              </label>
              <input
                type="number"
                step="0.1"
                value={pipelineCoverage}
                onChange={(e) => setPipelineCoverage(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Revenue MTD ($)
              </label>
              <input
                type="number"
                value={revenueMtd}
                onChange={(e) => setRevenueMtd(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Revenue QTD ($)
              </label>
              <input
                type="number"
                value={revenueQtd}
                onChange={(e) => setRevenueQtd(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Average Deal Size ($)
              </label>
              <input
                type="number"
                value={avgDealSize}
                onChange={(e) => setAvgDealSize(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Pipeline Movement
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Deals Advancing This Week
              </h3>
              {dealsAdvancing.map((deal, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4 mb-3">
                  <div className="grid md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Deal Name"
                      value={deal.dealName}
                      onChange={(e) => {
                        const newDeals = [...dealsAdvancing];
                        newDeals[index].dealName = e.target.value;
                        setDealsAdvancing(newDeals);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="Next Stage"
                      value={deal.nextStage}
                      onChange={(e) => {
                        const newDeals = [...dealsAdvancing];
                        newDeals[index].nextStage = e.target.value;
                        setDealsAdvancing(newDeals);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="Next Step"
                      value={deal.nextStep}
                      onChange={(e) => {
                        const newDeals = [...dealsAdvancing];
                        newDeals[index].nextStep = e.target.value;
                        setDealsAdvancing(newDeals);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={() => setDealsAdvancing([...dealsAdvancing, { dealName: '', nextStage: '', nextStep: '' }])}
                className="flex items-center text-emerald-600 hover:text-emerald-700 text-sm font-medium"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Deal
              </button>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Deals Stalling/At Risk
              </h3>
              {dealsStalling.map((deal, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4 mb-3">
                  <input
                    type="text"
                    placeholder="Deal Name"
                    value={deal.dealName}
                    onChange={(e) => {
                      const newDeals = [...dealsStalling];
                      newDeals[index].dealName = e.target.value;
                      setDealsStalling(newDeals);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 mb-3"
                  />
                  <div className="grid md:grid-cols-3 gap-3">
                    <textarea
                      placeholder="Why Stuck"
                      value={deal.whyStuck}
                      onChange={(e) => {
                        const newDeals = [...dealsStalling];
                        newDeals[index].whyStuck = e.target.value;
                        setDealsStalling(newDeals);
                      }}
                      rows={2}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                    <textarea
                      placeholder="Your Plan"
                      value={deal.yourPlan}
                      onChange={(e) => {
                        const newDeals = [...dealsStalling];
                        newDeals[index].yourPlan = e.target.value;
                        setDealsStalling(newDeals);
                      }}
                      rows={2}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                    <textarea
                      placeholder="Help Needed"
                      value={deal.helpNeeded}
                      onChange={(e) => {
                        const newDeals = [...dealsStalling];
                        newDeals[index].helpNeeded = e.target.value;
                        setDealsStalling(newDeals);
                      }}
                      rows={2}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={() => setDealsStalling([...dealsStalling, { dealName: '', whyStuck: '', yourPlan: '', helpNeeded: '' }])}
                className="flex items-center text-emerald-600 hover:text-emerald-700 text-sm font-medium"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Deal
              </button>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Net New Deals Created This Week
              </h3>
              {newDeals.map((deal, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4 mb-3">
                  <div className="grid md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={deal.companyName}
                      onChange={(e) => {
                        const newDealsList = [...newDeals];
                        newDealsList[index].companyName = e.target.value;
                        setNewDeals(newDealsList);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="Deal Source"
                      value={deal.dealSource}
                      onChange={(e) => {
                        const newDealsList = [...newDeals];
                        newDealsList[index].dealSource = e.target.value;
                        setNewDeals(newDealsList);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="Deal Potential"
                      value={deal.dealPotential}
                      onChange={(e) => {
                        const newDealsList = [...newDeals];
                        newDealsList[index].dealPotential = e.target.value;
                        setNewDeals(newDealsList);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={() => setNewDeals([...newDeals, { companyName: '', dealSource: '', dealPotential: '' }])}
                className="flex items-center text-emerald-600 hover:text-emerald-700 text-sm font-medium"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Deal
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Closing Opportunities This Week
          </h2>

          <div className="space-y-3">
            {closingOpps.map((opp, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-4">
                <div className="grid md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Company/Deal"
                    value={opp.companyDeal}
                    onChange={(e) => {
                      const newOpps = [...closingOpps];
                      newOpps[index].companyDeal = e.target.value;
                      setClosingOpps(newOpps);
                    }}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="number"
                    placeholder="Value ($)"
                    value={opp.value || ''}
                    onChange={(e) => {
                      const newOpps = [...closingOpps];
                      newOpps[index].value = Number(e.target.value);
                      setClosingOpps(newOpps);
                    }}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="date"
                    placeholder="Close Date"
                    value={opp.closeDate}
                    onChange={(e) => {
                      const newOpps = [...closingOpps];
                      newOpps[index].closeDate = e.target.value;
                      setClosingOpps(newOpps);
                    }}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Confidence / Blockers"
                    value={opp.confidenceBlockers}
                    onChange={(e) => {
                      const newOpps = [...closingOpps];
                      newOpps[index].confidenceBlockers = e.target.value;
                      setClosingOpps(newOpps);
                    }}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            ))}
            <button
              onClick={() => setClosingOpps([...closingOpps, { companyDeal: '', value: 0, closeDate: '', confidenceBlockers: '' }])}
              className="flex items-center text-emerald-600 hover:text-emerald-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Opportunity
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Face-to-Face Meetings Next Week
          </h2>

          <div className="space-y-3">
            {f2fMeetings.map((meeting, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-4">
                <div className="grid md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Client/Prospect"
                    value={meeting.clientProspect}
                    onChange={(e) => {
                      const newMeetings = [...f2fMeetings];
                      newMeetings[index].clientProspect = e.target.value;
                      setF2fMeetings(newMeetings);
                    }}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Date(s)"
                    value={meeting.dates}
                    onChange={(e) => {
                      const newMeetings = [...f2fMeetings];
                      newMeetings[index].dates = e.target.value;
                      setF2fMeetings(newMeetings);
                    }}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Where"
                    value={meeting.where}
                    onChange={(e) => {
                      const newMeetings = [...f2fMeetings];
                      newMeetings[index].where = e.target.value;
                      setF2fMeetings(newMeetings);
                    }}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Purpose/Prep Needed"
                    value={meeting.purposePrep}
                    onChange={(e) => {
                      const newMeetings = [...f2fMeetings];
                      newMeetings[index].purposePrep = e.target.value;
                      setF2fMeetings(newMeetings);
                    }}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            ))}
            <button
              onClick={() => setF2fMeetings([...f2fMeetings, { clientProspect: '', dates: '', where: '', purposePrep: '' }])}
              className="flex items-center text-emerald-600 hover:text-emerald-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Meeting
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Call Review & Skill Development
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Call to Review (Attention.tech Link)
              </label>
              <input
                type="url"
                value={callReviewLink}
                onChange={(e) => setCallReviewLink(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                What You Want Me to Evaluate
              </label>
              <textarea
                value={callReviewFocus}
                onChange={(e) => setCallReviewFocus(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="What specific aspects should I focus on?"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Blockers & Support Needed
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                What's in Your Way / How Can I Help
              </label>
              <textarea
                value={blockersHelp}
                onChange={(e) => setBlockersHelp(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="Share any obstacles or challenges..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                What's Blocking Deals from Advancing (up to 5)
              </label>
              {dealBlockers.map((blocker, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={blocker}
                    onChange={(e) => {
                      const newBlockers = [...dealBlockers];
                      newBlockers[index] = e.target.value;
                      setDealBlockers(newBlockers);
                    }}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder={`Blocker #${index + 1}`}
                  />
                  {dealBlockers.length > 1 && (
                    <button
                      onClick={() => setDealBlockers(dealBlockers.filter((_, i) => i !== index))}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              {dealBlockers.length < 5 && (
                <button
                  onClick={() => setDealBlockers([...dealBlockers, ''])}
                  className="flex items-center text-emerald-600 hover:text-emerald-700 text-sm font-medium mt-2"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Blocker
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Support I Need from You This Week (up to 5)
              </label>
              {supportNeeded.map((support, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={support}
                    onChange={(e) => {
                      const newSupport = [...supportNeeded];
                      newSupport[index] = e.target.value;
                      setSupportNeeded(newSupport);
                    }}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder={`Support need #${index + 1}`}
                  />
                  {supportNeeded.length > 1 && (
                    <button
                      onClick={() => setSupportNeeded(supportNeeded.filter((_, i) => i !== index))}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              {supportNeeded.length < 5 && (
                <button
                  onClick={() => setSupportNeeded([...supportNeeded, ''])}
                  className="flex items-center text-emerald-600 hover:text-emerald-700 text-sm font-medium mt-2"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Support Need
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Commitments & Action Items
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            These will automatically carry forward to next week's review
          </p>

          <div className="space-y-4">
            {commitments.map((commitment, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Commitment #{index + 1}
                </label>
                <textarea
                  value={commitment.text}
                  onChange={(e) => {
                    const newCommitments = [...commitments];
                    newCommitments[index].text = e.target.value;
                    setCommitments(newCommitments);
                  }}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 mb-3"
                  placeholder="Specific and measurable commitment..."
                />
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Deadline</label>
                    <input
                      type="text"
                      value={commitment.deadline}
                      onChange={(e) => {
                        const newCommitments = [...commitments];
                        newCommitments[index].deadline = e.target.value;
                        setCommitments(newCommitments);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      placeholder="When..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Success Metric</label>
                    <input
                      type="text"
                      value={commitment.successMetric}
                      onChange={(e) => {
                        const newCommitments = [...commitments];
                        newCommitments[index].successMetric = e.target.value;
                        setCommitments(newCommitments);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      placeholder="How to measure..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Next Week's Goal
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            Set a clear, measurable goal for next week (will carry forward for accountability)
          </p>

          <textarea
            value={thisWeekGoal}
            onChange={(e) => setThisWeekGoal(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            placeholder="Enter your goal for next week..."
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Personal Check-In
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                How I'm Taking Care of Myself This Week
              </label>
              <textarea
                value={selfCare}
                onChange={(e) => setSelfCare(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="Share how you're maintaining work-life balance..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Energy Level
              </label>
              <div className="flex gap-4">
                {(['high', 'medium', 'low'] as const).map((level) => (
                  <label key={level} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="energy"
                      value={level}
                      checked={energyLevel === level}
                      onChange={(e) => setEnergyLevel(e.target.value as 'high' | 'medium' | 'low')}
                      className="w-4 h-4 text-emerald-600"
                    />
                    <span className="text-sm capitalize">{level}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                What I Need from You as My Manager
              </label>
              <textarea
                value={managerSupport}
                onChange={(e) => setManagerSupport(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="Any support or resources you need..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-white border-t border-slate-200 py-4 mt-8 -mx-4 px-4">
        <div className="max-w-4xl mx-auto flex gap-3 justify-end">
          {status === 'submitted' ? (
            <>
              <div className="flex items-center gap-2 text-emerald-600 font-medium">
                <Send className="w-5 h-5" />
                Submitted Successfully
              </div>
              <button
                onClick={handleReopenForEditing}
                className="flex items-center px-6 py-2.5 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Submission
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="flex items-center px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Draft'}
              </button>

              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="flex items-center px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4 mr-2" />
                {saving ? 'Submitting...' : 'Submit'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
