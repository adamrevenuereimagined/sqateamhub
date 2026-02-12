import { useEffect, useState } from 'react';
import { supabase, Week, OneOnOneSubmission, Commitment } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Save, Send, Plus, Trash2, ArrowLeft } from 'lucide-react';

type Props = {
  onBack: () => void;
};

export function OneOnOneForm({ onBack }: Props) {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState<Week | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [isOneOnOneWeek, setIsOneOnOneWeek] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'not_started' | 'in_progress' | 'submitted'>('not_started');

  // Section 1: Last 1:1 Review (auto-populated)
  const [lastCommitments, setLastCommitments] = useState<Commitment[]>([]);

  // Section 2: Wins & Momentum
  const [wins, setWins] = useState<string[]>(['']);
  const [whatsWorking, setWhatsWorking] = useState('');
  const [positiveFeedback, setPositiveFeedback] = useState('');

  // Section 3: Performance Snapshot
  const [prospectingActivities, setProspectingActivities] = useState(0);
  const [dmConnects, setDmConnects] = useState(0);
  const [discoveryCalls, setDiscoveryCalls] = useState(0);
  const [opportunitiesAdvanced, setOpportunitiesAdvanced] = useState(0);
  const [pipelineCoverage, setPipelineCoverage] = useState(0);
  const [revenueMtd, setRevenueMtd] = useState(0);
  const [revenueQtd, setRevenueQtd] = useState(0);
  const [avgDealSize, setAvgDealSize] = useState(0);

  // Section 4B: Deals Moved Forward
  const [dealsMovedForward, setDealsMovedForward] = useState<Array<{
    dealName: string;
    newStage: string;
    whyAdvanced: string;
    whatYouDid: string;
  }>>([{ dealName: '', newStage: '', whyAdvanced: '', whatYouDid: '' }]);

  // Section 4C: Deals At Risk
  const [dealsAtRisk, setDealsAtRisk] = useState<Array<{
    dealName: string;
    whyStuck: string;
    yourPlan: string;
    helpNeeded: string;
  }>>([{ dealName: '', whyStuck: '', yourPlan: '', helpNeeded: '' }]);

  // Section 4A: Top Deals (conditional)
  const [topDeals, setTopDeals] = useState<Array<{
    dealName: string;
    stage: string;
    value: number;
    closeDate: string;
    confidence: number;
    whatsNeeded: string;
  }>>([{ dealName: '', stage: '', value: 0, closeDate: '', confidence: 0, whatsNeeded: '' }]);

  // Section 5: Call Review
  const [callReviewLink, setCallReviewLink] = useState('');
  const [callReviewFocus, setCallReviewFocus] = useState('');

  // Section 6: Blockers & Support
  const [blockersHelp, setBlockersHelp] = useState('');
  const [dealBlockers, setDealBlockers] = useState<string[]>(['']);
  const [supportNeeded, setSupportNeeded] = useState<string[]>(['']);

  // Section 7: Commitments (will carry forward)
  const [commitments, setCommitments] = useState<Array<{
    text: string;
    deadline: string;
    successMetric: string;
  }>>([{ text: '', deadline: '', successMetric: '' }, { text: '', deadline: '', successMetric: '' }, { text: '', deadline: '', successMetric: '' }]);

  // Section 8: Personal Check-In
  const [selfCare, setSelfCare] = useState('');
  const [energyLevel, setEnergyLevel] = useState<'high' | 'medium' | 'low'>('medium');
  const [managerSupport, setManagerSupport] = useState('');

  // Section 9: Deal Coaching (conditional)
  const [dealSelectedLink, setDealSelectedLink] = useState('');
  const [spicedSituation, setSpicedSituation] = useState('');
  const [spicedPain, setSpicedPain] = useState('');
  const [spicedImpact, setSpicedImpact] = useState('');
  const [spicedCriticalEvent, setSpicedCriticalEvent] = useState('');
  const [spicedDecision, setSpicedDecision] = useState('');
  const [spicedDecisionProcess, setSpicedDecisionProcess] = useState('');

  useEffect(() => {
    loadFormData();
  }, [user?.id]);

  const loadFormData = async () => {
    if (!user) return;

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

        const { data: submission } = await supabase
          .from('one_on_one_submissions')
          .select('*')
          .eq('user_id', user.id)
          .eq('week_id', weekData.id)
          .maybeSingle();

        if (submission) {
          setSubmissionId(submission.id);
          setStatus(submission.status);
          setIsOneOnOneWeek(submission.is_one_on_one_week);
          populateFormFromSubmission(submission);

          const { data: commitmentsData } = await supabase
            .from('commitments')
            .select('*')
            .eq('one_on_one_id', submission.id);

          if (commitmentsData && commitmentsData.length > 0) {
            setCommitments(commitmentsData.map(c => ({
              text: c.commitment_text,
              deadline: c.deadline,
              successMetric: c.success_metric
            })));
          }
        } else {
          await loadPreviousCommitments(weekData.id);
        }
      }
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  };

  const loadPreviousCommitments = async (currentWeekId: string) => {
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
          .from('one_on_one_submissions')
          .select('*')
          .eq('user_id', user.id)
          .eq('week_id', prevWeek.id)
          .maybeSingle();

        if (prevSubmission) {
          const { data: prevCommitments } = await supabase
            .from('commitments')
            .select('*')
            .eq('one_on_one_id', prevSubmission.id);

          if (prevCommitments) {
            setLastCommitments(prevCommitments as Commitment[]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading previous commitments:', error);
    }
  };

  const populateFormFromSubmission = (submission: OneOnOneSubmission) => {
    setWins(submission.wins || ['']);
    setWhatsWorking(submission.whats_working_well || '');
    setPositiveFeedback(submission.positive_feedback || '');
    setProspectingActivities(submission.prospecting_activities || 0);
    setDmConnects(submission.decision_maker_connects || 0);
    setDiscoveryCalls(submission.discovery_calls || 0);
    setOpportunitiesAdvanced(submission.opportunities_advanced || 0);
    setPipelineCoverage(submission.pipeline_coverage_ratio || 0);
    setRevenueMtd(submission.revenue_mtd || 0);
    setRevenueQtd(submission.revenue_qtd || 0);
    setAvgDealSize(submission.average_deal_size || 0);
    setDealsMovedForward(submission.deals_moved_forward || [{ dealName: '', newStage: '', whyAdvanced: '', whatYouDid: '' }]);
    setDealsAtRisk(submission.deals_at_risk || [{ dealName: '', whyStuck: '', yourPlan: '', helpNeeded: '' }]);
    setTopDeals(submission.top_deals || [{ dealName: '', stage: '', value: 0, closeDate: '', confidence: 0, whatsNeeded: '' }]);
    setCallReviewLink(submission.call_review_link || '');
    setCallReviewFocus(submission.call_review_focus || '');
    setBlockersHelp(submission.blockers_help || '');
    setDealBlockers(submission.deal_blockers || ['']);
    setSupportNeeded(submission.support_needed || ['']);
    setSelfCare(submission.self_care || '');
    setEnergyLevel(submission.energy_level || 'medium');
    setManagerSupport(submission.manager_support || '');
    setDealSelectedLink(submission.deal_selected_link || '');
    setSpicedSituation(submission.spiced_situation || '');
    setSpicedPain(submission.spiced_pain || '');
    setSpicedImpact(submission.spiced_impact || '');
    setSpicedCriticalEvent(submission.spiced_critical_event || '');
    setSpicedDecision(submission.spiced_decision || '');
    setSpicedDecisionProcess(submission.spiced_decision_process || '');
  };

  const handleSave = async (submitNow: boolean = false) => {
    if (!user || !currentWeek) return;

    setSaving(true);

    try {
      const submissionData = {
        user_id: user.id,
        week_id: currentWeek.id,
        is_one_on_one_week: isOneOnOneWeek,
        wins: wins.filter(w => w.trim()),
        whats_working_well: whatsWorking,
        positive_feedback: positiveFeedback,
        prospecting_activities: prospectingActivities,
        decision_maker_connects: dmConnects,
        discovery_calls: discoveryCalls,
        opportunities_advanced: opportunitiesAdvanced,
        pipeline_coverage_ratio: pipelineCoverage,
        revenue_mtd: revenueMtd,
        revenue_qtd: revenueQtd,
        average_deal_size: avgDealSize,
        deals_moved_forward: dealsMovedForward.filter(d => d.dealName),
        deals_at_risk: dealsAtRisk.filter(d => d.dealName),
        top_deals: topDeals.filter(d => d.dealName),
        call_review_link: callReviewLink,
        call_review_focus: callReviewFocus,
        blockers_help: blockersHelp,
        deal_blockers: dealBlockers.filter(b => b.trim()),
        support_needed: supportNeeded.filter(s => s.trim()),
        self_care: selfCare,
        energy_level: energyLevel,
        manager_support: managerSupport,
        deal_selected_link: dealSelectedLink,
        spiced_situation: spicedSituation,
        spiced_pain: spicedPain,
        spiced_impact: spicedImpact,
        spiced_critical_event: spicedCriticalEvent,
        spiced_decision: spicedDecision,
        spiced_decision_process: spicedDecisionProcess,
        status: submitNow ? 'submitted' : 'in_progress',
        submitted_at: submitNow ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };

      let finalSubmissionId = submissionId;

      if (submissionId) {
        await supabase
          .from('one_on_one_submissions')
          .update(submissionData)
          .eq('id', submissionId);
      } else {
        const { data, error } = await supabase
          .from('one_on_one_submissions')
          .insert(submissionData)
          .select()
          .single();

        if (error) throw error;
        finalSubmissionId = data.id;
        setSubmissionId(data.id);
      }

      if (finalSubmissionId) {
        await supabase
          .from('commitments')
          .delete()
          .eq('one_on_one_id', finalSubmissionId);

        const validCommitments = commitments.filter(c => c.text.trim());
        if (validCommitments.length > 0) {
          await supabase
            .from('commitments')
            .insert(validCommitments.map(c => ({
              one_on_one_id: finalSubmissionId,
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

  const updateCommitmentStatus = async (commitmentId: string, status: string, notes: string) => {
    await supabase
      .from('commitments')
      .update({ status, notes })
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

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Weekly 1:1 Tracker</h1>
            <p className="text-slate-600">
              Week of {new Date(currentWeek.start_date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {user?.name} | Q Quota: ${user?.quarterly_quota.toLocaleString()}
            </p>
          </div>

          <label className="flex items-center space-x-3 bg-blue-50 px-4 py-2 rounded-lg">
            <input
              type="checkbox"
              checked={isOneOnOneWeek}
              onChange={(e) => setIsOneOnOneWeek(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-blue-900">This is a 1:1 week</span>
          </label>
        </div>
      </div>

      <div className="space-y-6">
        {lastCommitments.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Section 1: Last 1:1 Review
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Review commitments from your previous 1:1 meeting
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
                        onChange={(e) => updateCommitmentStatus(commitment.id, e.target.value, commitment.notes)}
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
                        Notes / What Got in the Way
                      </label>
                      <input
                        type="text"
                        defaultValue={commitment.notes}
                        onBlur={(e) => updateCommitmentStatus(commitment.id, commitment.status, e.target.value)}
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

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Section 2: Wins & Momentum
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Biggest Wins Since Last Week (up to 5)
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
            Section 3: Performance Snapshot
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Prospecting Activities Since Last Week
              </label>
              <input
                type="number"
                value={prospectingActivities}
                onChange={(e) => setProspectingActivities(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Decision Maker Connects
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
                Discovery Calls Completed
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
                Pipeline Coverage Ratio (Target: 3x)
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
                Revenue Bookings MTD ($)
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
                Revenue Bookings QTD ($)
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

        {isOneOnOneWeek && (
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Section 4A: Top Deals to Discuss
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              (Only required on 1:1 weeks)
            </p>

            <div className="space-y-4">
              {topDeals.map((deal, index) => (
                <div key={index} className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="grid md:grid-cols-2 gap-4 mb-3">
                    <input
                      type="text"
                      placeholder="Deal Name"
                      value={deal.dealName}
                      onChange={(e) => {
                        const newDeals = [...topDeals];
                        newDeals[index].dealName = e.target.value;
                        setTopDeals(newDeals);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Stage"
                      value={deal.stage}
                      onChange={(e) => {
                        const newDeals = [...topDeals];
                        newDeals[index].stage = e.target.value;
                        setTopDeals(newDeals);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Value ($)"
                      value={deal.value || ''}
                      onChange={(e) => {
                        const newDeals = [...topDeals];
                        newDeals[index].value = Number(e.target.value);
                        setTopDeals(newDeals);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="date"
                      placeholder="Close Date"
                      value={deal.closeDate}
                      onChange={(e) => {
                        const newDeals = [...topDeals];
                        newDeals[index].closeDate = e.target.value;
                        setTopDeals(newDeals);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Confidence (%)"
                      value={deal.confidence || ''}
                      onChange={(e) => {
                        const newDeals = [...topDeals];
                        newDeals[index].confidence = Number(e.target.value);
                        setTopDeals(newDeals);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="What's Needed"
                      value={deal.whatsNeeded}
                      onChange={(e) => {
                        const newDeals = [...topDeals];
                        newDeals[index].whatsNeeded = e.target.value;
                        setTopDeals(newDeals);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {topDeals.length > 1 && (
                    <button
                      onClick={() => setTopDeals(topDeals.filter((_, i) => i !== index))}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove Deal
                    </button>
                  )}
                </div>
              ))}
              {topDeals.length < 5 && (
                <button
                  onClick={() => setTopDeals([...topDeals, { dealName: '', stage: '', value: 0, closeDate: '', confidence: 0, whatsNeeded: '' }])}
                  className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Deal
                </button>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Section 4B: Deals Moved Forward Since Last Week
          </h2>

          <div className="space-y-4">
            {dealsMovedForward.map((deal, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-4">
                <div className="grid md:grid-cols-2 gap-4 mb-3">
                  <input
                    type="text"
                    placeholder="Deal Name"
                    value={deal.dealName}
                    onChange={(e) => {
                      const newDeals = [...dealsMovedForward];
                      newDeals[index].dealName = e.target.value;
                      setDealsMovedForward(newDeals);
                    }}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="New Stage"
                    value={deal.newStage}
                    onChange={(e) => {
                      const newDeals = [...dealsMovedForward];
                      newDeals[index].newStage = e.target.value;
                      setDealsMovedForward(newDeals);
                    }}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <textarea
                    placeholder="Why Advanced"
                    value={deal.whyAdvanced}
                    onChange={(e) => {
                      const newDeals = [...dealsMovedForward];
                      newDeals[index].whyAdvanced = e.target.value;
                      setDealsMovedForward(newDeals);
                    }}
                    rows={2}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                  <textarea
                    placeholder="What Did You Do to Make It Happen"
                    value={deal.whatYouDid}
                    onChange={(e) => {
                      const newDeals = [...dealsMovedForward];
                      newDeals[index].whatYouDid = e.target.value;
                      setDealsMovedForward(newDeals);
                    }}
                    rows={2}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            ))}
            <button
              onClick={() => setDealsMovedForward([...dealsMovedForward, { dealName: '', newStage: '', whyAdvanced: '', whatYouDid: '' }])}
              className="flex items-center text-emerald-600 hover:text-emerald-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Deal
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Section 4C: Deals Stalling/At Risk
          </h2>

          <div className="space-y-4">
            {dealsAtRisk.map((deal, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-4">
                <input
                  type="text"
                  placeholder="Deal Name"
                  value={deal.dealName}
                  onChange={(e) => {
                    const newDeals = [...dealsAtRisk];
                    newDeals[index].dealName = e.target.value;
                    setDealsAtRisk(newDeals);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 mb-3"
                />
                <div className="grid md:grid-cols-3 gap-4">
                  <textarea
                    placeholder="Why Stuck"
                    value={deal.whyStuck}
                    onChange={(e) => {
                      const newDeals = [...dealsAtRisk];
                      newDeals[index].whyStuck = e.target.value;
                      setDealsAtRisk(newDeals);
                    }}
                    rows={2}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                  <textarea
                    placeholder="Your Plan"
                    value={deal.yourPlan}
                    onChange={(e) => {
                      const newDeals = [...dealsAtRisk];
                      newDeals[index].yourPlan = e.target.value;
                      setDealsAtRisk(newDeals);
                    }}
                    rows={2}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                  <textarea
                    placeholder="What Help Do You Need"
                    value={deal.helpNeeded}
                    onChange={(e) => {
                      const newDeals = [...dealsAtRisk];
                      newDeals[index].helpNeeded = e.target.value;
                      setDealsAtRisk(newDeals);
                    }}
                    rows={2}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            ))}
            <button
              onClick={() => setDealsAtRisk([...dealsAtRisk, { dealName: '', whyStuck: '', yourPlan: '', helpNeeded: '' }])}
              className="flex items-center text-emerald-600 hover:text-emerald-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Deal
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Section 5: Call Review & Skill Development
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
            Section 6: Blockers & Support Needed
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
            Section 7: Commitments & Action Items
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
            Section 8: Personal Check-In
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

        {isOneOnOneWeek && (
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Section 9: Deal Coaching Focus (SPICED Analysis)
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              (Only required on 1:1 weeks)
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Deal Selected (HubSpot Link)
                </label>
                <input
                  type="url"
                  value={dealSelectedLink}
                  onChange={(e) => setDealSelectedLink(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Situation
                  </label>
                  <textarea
                    value={spicedSituation}
                    onChange={(e) => setSpicedSituation(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Pain
                  </label>
                  <textarea
                    value={spicedPain}
                    onChange={(e) => setSpicedPain(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Impact
                  </label>
                  <textarea
                    value={spicedImpact}
                    onChange={(e) => setSpicedImpact(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Critical Event
                  </label>
                  <textarea
                    value={spicedCriticalEvent}
                    onChange={(e) => setSpicedCriticalEvent(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Decision
                  </label>
                  <textarea
                    value={spicedDecision}
                    onChange={(e) => setSpicedDecision(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Decision Process
                  </label>
                  <textarea
                    value={spicedDecisionProcess}
                    onChange={(e) => setSpicedDecisionProcess(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-white border-t border-slate-200 py-4 mt-8 -mx-4 px-4">
        <div className="max-w-4xl mx-auto flex gap-3 justify-end">
          <button
            onClick={() => handleSave(false)}
            disabled={saving || status === 'submitted'}
            className="flex items-center px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {status === 'submitted' ? 'Already Submitted' : 'Save Draft'}
          </button>

          <button
            onClick={() => handleSave(true)}
            disabled={saving || status === 'submitted'}
            className="flex items-center px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4 mr-2" />
            {status === 'submitted' ? 'Submitted' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
