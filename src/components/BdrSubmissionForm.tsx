import { useEffect, useState } from 'react';
import { supabase, parseNumericFields } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Save, Send, Plus, Trash2, ArrowLeft, CreditCard as Edit2, CheckCircle2, XCircle, MinusCircle, Info } from 'lucide-react';
import { formatDateShort } from '../lib/dateUtils';
import { CurrencyInput } from './CurrencyInput';
import { formatCurrency } from '../lib/formatters';

type Week = {
  id: string;
  week_number: number;
  year: number;
  start_date: string;
  end_date: string;
  status: string;
};

type Props = {
  weekId: string;
  onBack: () => void;
};

export function BdrSubmissionForm({ weekId, onBack }: Props) {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState<Week | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'not_started' | 'in_progress' | 'submitted'>('not_started');

  // Wins & Momentum
  const [wins, setWins] = useState<string[]>(['']);
  const [whatsWorking, setWhatsWorking] = useState('');
  const [positiveFeedback, setPositiveFeedback] = useState('');

  // BDR Performance Metrics
  const [salesAcceptedOppsMtd, setSalesAcceptedOppsMtd] = useState(0);
  const [salesAcceptedOppsQtd, setSalesAcceptedOppsQtd] = useState(0);
  const [oppsCreatedThisWeek, setOppsCreatedThisWeek] = useState(0);
  const [pipelineCreatedThisWeek, setPipelineCreatedThisWeek] = useState(0);

  // Activity Metrics
  const [coldCalls, setColdCalls] = useState(0);
  const [emails, setEmails] = useState(0);
  const [liMessages, setLiMessages] = useState(0);
  const [videos, setVideos] = useState(0);
  const [dmConnects, setDmConnects] = useState(0);
  const [meetingsBooked, setMeetingsBooked] = useState(0);
  const [discoveryCalls, setDiscoveryCalls] = useState(0);

  // Call Review
  const [callReviewLink, setCallReviewLink] = useState('');
  const [callReviewFocus, setCallReviewFocus] = useState('');

  // Blockers
  const [blockersHelp, setBlockersHelp] = useState('');
  const [dealBlockers, setDealBlockers] = useState<string[]>(['']);
  const [supportNeeded, setSupportNeeded] = useState<string[]>(['']);

  // Goals
  const [previousGoals, setPreviousGoals] = useState<Array<{
    id: string;
    goal_text: string;
    status: string;
    review_notes: string;
  }>>([]);
  const [nextWeekGoals, setNextWeekGoals] = useState<string[]>(['']);

  // Personal Check-In
  const [selfCare, setSelfCare] = useState('');
  const [energyLevel, setEnergyLevel] = useState<'high' | 'medium' | 'low'>('medium');
  const [managerSupport, setManagerSupport] = useState('');

  const [targets, setTargets] = useState<{
    target_cold_calls: number;
    target_li_messages: number;
    target_videos: number;
    target_dm_connects: number;
    target_meetings_booked: number;
    target_discovery_calls: number;
    target_opportunities_advanced: number;
    target_pipeline_value: number;
  } | null>(null);

  useEffect(() => {
    loadWeek();
    loadTargets();
  }, [weekId, user?.id]);

  const loadWeek = async () => {
    try {
      const { data } = await supabase
        .from('weeks')
        .select('*')
        .eq('id', weekId)
        .maybeSingle();

      if (data) {
        setCurrentWeek(data);
        loadFormData(data.id, data.start_date);
      }
    } catch (error) {
      console.error('Error loading week:', error);
    }
  };

  const loadTargets = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('weekly_activity_targets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setTargets(data);
    } catch (error) {
      console.error('Error loading targets:', error);
    }
  };

  const loadFormData = async (wId: string, startDate: string) => {
    if (!user) return;
    try {
      const { data: rawSubmission } = await supabase
        .from('weekly_submissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_id', wId)
        .maybeSingle();

      if (rawSubmission) {
        const submission = parseNumericFields(rawSubmission, [
          'cold_calls', 'emails', 'li_messages', 'videos', 'decision_maker_connects',
          'meetings_booked', 'discovery_calls', 'sales_accepted_opps_mtd',
          'sales_accepted_opps_qtd', 'opps_created_this_week', 'pipeline_created_this_week'
        ]);
        setSubmissionId(submission.id);
        setStatus(submission.status);
        setWins(submission.wins || ['']);
        setWhatsWorking(submission.whats_working_well || '');
        setPositiveFeedback(submission.positive_feedback || '');
        setSalesAcceptedOppsMtd(submission.sales_accepted_opps_mtd || 0);
        setSalesAcceptedOppsQtd(submission.sales_accepted_opps_qtd || 0);
        setOppsCreatedThisWeek(submission.opps_created_this_week || 0);
        setPipelineCreatedThisWeek(submission.pipeline_created_this_week || 0);
        setColdCalls(submission.cold_calls || 0);
        setEmails(submission.emails || 0);
        setLiMessages(submission.li_messages || 0);
        setVideos(submission.videos || 0);
        setDmConnects(submission.decision_maker_connects || 0);
        setMeetingsBooked(submission.meetings_booked || 0);
        setDiscoveryCalls(submission.discovery_calls || 0);
        setCallReviewLink(submission.call_review_link || '');
        setCallReviewFocus(submission.call_review_focus || '');
        setBlockersHelp(submission.blockers_help || '');
        setDealBlockers(submission.deal_blockers || ['']);
        setSupportNeeded(submission.support_needed || ['']);
        setSelfCare(submission.self_care || '');
        setEnergyLevel(submission.energy_level || 'medium');
        setManagerSupport(submission.manager_support || '');
      }

      await loadPreviousGoals(startDate, wId);
      await loadGoalsForCurrentWeek(wId);
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  };

  const loadGoalsForCurrentWeek = async (wId: string) => {
    if (!user) return;
    const { data } = await supabase
      .from('weekly_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_id', wId)
      .order('sort_order');
    if (data && data.length > 0) setNextWeekGoals(data.map(g => g.goal_text));
  };

  const loadPreviousGoals = async (currentStartDate: string, currentWeekId: string) => {
    if (!user) return;
    const { data: prevWeek } = await supabase
      .from('weeks')
      .select('*')
      .lt('start_date', currentStartDate)
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (prevWeek) {
      const { data: prevGoals } = await supabase
        .from('weekly_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_id', prevWeek.id)
        .order('sort_order');

      if (prevGoals && prevGoals.length > 0) {
        setPreviousGoals(prevGoals.map(g => ({
          id: g.id,
          goal_text: g.goal_text,
          status: g.status || 'pending',
          review_notes: g.review_notes || '',
        })));
      }
    }
  };

  const handleSave = async (submitNow: boolean = false) => {
    if (!user || !currentWeek) return;

    if (submitNow) {
      const validGoals = nextWeekGoals.filter(g => g.trim());
      if (validGoals.length === 0) {
        alert('Please add at least one goal for next week before submitting.');
        return;
      }
      if (previousGoals.length > 0) {
        const allReviewed = previousGoals.every(g => g.status !== 'pending');
        if (!allReviewed) {
          alert('Please review all previous week goals before submitting.');
          return;
        }
      }
    }

    setSaving(true);
    try {
      const submissionData = {
        user_id: user.id,
        week_id: currentWeek.id,
        wins: wins.filter(w => w.trim()),
        whats_working_well: whatsWorking,
        positive_feedback: positiveFeedback,
        sales_accepted_opps_mtd: salesAcceptedOppsMtd,
        sales_accepted_opps_qtd: salesAcceptedOppsQtd,
        opps_created_this_week: oppsCreatedThisWeek,
        pipeline_created_this_week: pipelineCreatedThisWeek,
        prospecting_activities: coldCalls + emails + liMessages,
        cold_calls: coldCalls,
        emails: emails,
        li_messages: liMessages,
        videos: videos,
        decision_maker_connects: dmConnects,
        meetings_booked: meetingsBooked,
        discovery_calls: discoveryCalls,
        call_review_link: callReviewLink,
        call_review_focus: callReviewFocus,
        blockers_help: blockersHelp,
        deal_blockers: dealBlockers.filter(b => b.trim()),
        support_needed: supportNeeded.filter(s => s.trim()),
        self_care: selfCare,
        energy_level: energyLevel,
        manager_support: managerSupport,
        status: submitNow ? 'submitted' : 'in_progress',
        submitted_at: submitNow ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };

      if (submissionId) {
        const { error } = await supabase.from('weekly_submissions').update(submissionData).eq('id', submissionId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('weekly_submissions').insert(submissionData).select().single();
        if (error) throw error;
        setSubmissionId(data.id);
      }

      await supabase.from('weekly_goals').delete().eq('user_id', user.id).eq('week_id', currentWeek.id);

      const validGoals = nextWeekGoals.filter(g => g.trim());
      if (validGoals.length > 0) {
        const { error } = await supabase.from('weekly_goals').insert(
          validGoals.map((g, i) => ({ user_id: user.id, week_id: currentWeek.id, goal_text: g, sort_order: i }))
        );
        if (error) throw error;
      }

      for (const goal of previousGoals) {
        if (goal.status !== 'pending' || goal.review_notes) {
          await supabase.from('weekly_goals').update({
            status: goal.status,
            review_notes: goal.review_notes,
            updated_at: new Date().toISOString(),
          }).eq('id', goal.id);
        }
      }

      setStatus(submitNow ? 'submitted' : 'in_progress');
      alert(submitNow ? 'Submitted successfully!' : 'Saved as draft');
      onBack();
    } catch (error: any) {
      console.error('Error saving:', error);
      alert(`Failed to save: ${error?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (!currentWeek) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="mb-4">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Weekly Submission</h1>
          <p className="text-sm text-slate-500">
            {user?.name} | BDR | Due: Thursday 5:00 PM PT
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <p className="text-slate-700">
            <span className="font-semibold">Week of:</span>{' '}
            {formatDateShort(currentWeek.start_date)}{' '}
            -{' '}
            {formatDateShort(currentWeek.end_date)}, {currentWeek.year}
          </p>
        </div>
      </div>

      <div className="space-y-6">

        {/* Previous Goals Review */}
        {previousGoals.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-2 flex items-center gap-2">
              Previous Week's Goals Review
              <span className="text-red-500 text-sm">*Required</span>
            </h2>
            <p className="text-sm text-slate-600 mb-4">How did you do on last week's goals?</p>
            <div className="space-y-3">
              {previousGoals.map((goal, index) => {
                const statusConfig: Record<string, { color: string; bg: string; border: string }> = {
                  hit: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                  partial: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
                  missed: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
                  pending: { color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200' },
                };
                const config = statusConfig[goal.status] || statusConfig.pending;
                return (
                  <div key={goal.id} className={`border rounded-lg p-4 ${config.border} ${config.bg}`}>
                    <p className="font-medium text-slate-900 mb-3">
                      <span className="text-slate-400 mr-2">#{index + 1}</span>
                      {goal.goal_text}
                      {goal.status === 'pending' && <span className="ml-2 text-xs text-red-500 font-normal">- Please select status</span>}
                    </p>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status <span className="text-red-500">*</span></label>
                        <div className="flex gap-2">
                          {[
                            { value: 'hit', label: 'Hit', color: 'emerald' },
                            { value: 'partial', label: 'Partial', color: 'amber' },
                            { value: 'missed', label: 'Missed', color: 'red' },
                          ].map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                const updated = [...previousGoals];
                                updated[index] = { ...updated[index], status: opt.value };
                                setPreviousGoals(updated);
                              }}
                              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                                goal.status === opt.value
                                  ? opt.color === 'emerald' ? 'bg-emerald-600 text-white border-emerald-600'
                                    : opt.color === 'amber' ? 'bg-amber-500 text-white border-amber-500'
                                    : 'bg-red-600 text-white border-red-600'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                        <input
                          type="text"
                          value={goal.review_notes}
                          onChange={(e) => {
                            const updated = [...previousGoals];
                            updated[index] = { ...updated[index], review_notes: e.target.value };
                            setPreviousGoals(updated);
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                          placeholder="What happened? Any lessons learned?"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Wins & Momentum */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Wins & Momentum</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Biggest Wins This Week (up to 5)</label>
              {wins.map((win, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={win}
                    onChange={(e) => { const n = [...wins]; n[index] = e.target.value; setWins(n); }}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder={`Win #${index + 1}`}
                  />
                  {wins.length > 1 && (
                    <button onClick={() => setWins(wins.filter((_, i) => i !== index))} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              {wins.length < 5 && (
                <button onClick={() => setWins([...wins, ''])} className="flex items-center text-emerald-600 hover:text-emerald-700 text-sm font-medium mt-2">
                  <Plus className="w-4 h-4 mr-1" /> Add Win
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">What's Working Well</label>
              <textarea value={whatsWorking} onChange={(e) => setWhatsWorking(e.target.value)} rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="Share what strategies or approaches are working..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Positive Feedback from Prospects/Clients</label>
              <textarea value={positiveFeedback} onChange={(e) => setPositiveFeedback(e.target.value)} rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="Any positive feedback you've received..." />
            </div>
          </div>
        </div>

        {/* BDR Performance Metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Performance Metrics</h2>
            <div className="group relative">
              <Info className="w-5 h-5 text-slate-400 hover:text-slate-600 cursor-help" />
              <div className="absolute left-0 top-6 hidden group-hover:block bg-slate-900 text-white text-sm rounded-lg p-3 w-80 z-10 shadow-lg">
                Sales Accepted Opportunities are opps that have been accepted by the sales team. Pipeline Created This Week is the total dollar value of new opportunities created.
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sales Accepted Opps MTD</label>
              <input type="number" value={salesAcceptedOppsMtd} onChange={(e) => setSalesAcceptedOppsMtd(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sales Accepted Opps QTD</label>
              <input type="number" value={salesAcceptedOppsQtd} onChange={(e) => setSalesAcceptedOppsQtd(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Opportunities Created This Week</label>
              <input type="number" value={oppsCreatedThisWeek} onChange={(e) => setOppsCreatedThisWeek(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pipeline Created This Week ($)</label>
              <CurrencyInput value={pipelineCreatedThisWeek} onChange={setPipelineCreatedThisWeek}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
        </div>

        {/* Activity Metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Activity Metrics</h2>
            <a href="https://app-na2.hubspot.com/advanced-builder/242661058/report/229162336" target="_blank" rel="noopener noreferrer" className="group relative" title="View report in HubSpot">
              <Info className="w-5 h-5 text-blue-500 hover:text-blue-700 cursor-pointer" />
              <div className="absolute left-0 top-6 hidden group-hover:block bg-slate-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-10 shadow-lg">
                Click to view report in HubSpot
              </div>
            </a>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { label: 'Cold Calls', value: coldCalls, setter: setColdCalls, targetKey: 'target_cold_calls' },
              { label: 'Emails', value: emails, setter: setEmails, targetKey: 'target_emails' },
              { label: 'LI Messages', value: liMessages, setter: setLiMessages, targetKey: 'target_li_messages' },
              { label: 'Videos', value: videos, setter: setVideos, targetKey: 'target_videos' },
              { label: 'Decision Maker Connects', value: dmConnects, setter: setDmConnects, targetKey: 'target_dm_connects' },
              { label: 'Meetings Booked', value: meetingsBooked, setter: setMeetingsBooked, targetKey: 'target_meetings_booked' },
              { label: 'Discovery Calls', value: discoveryCalls, setter: setDiscoveryCalls, targetKey: 'target_discovery_calls' },
            ].map(({ label, value, setter, targetKey }) => (
              <div key={label}>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {label}
                  {targets && (targets as any)[targetKey] && (
                    <span className="ml-2 text-xs text-slate-500 font-normal">(Goal: {(targets as any)[targetKey]})</span>
                  )}
                </label>
                <input type="number" value={value} onChange={(e) => setter(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" min="0" />
              </div>
            ))}
          </div>
        </div>

        {/* Call Review */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Call Review & Skill Development</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Call to Review (Attention.tech Link)</label>
              <input type="url" value={callReviewLink} onChange={(e) => setCallReviewLink(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">What You Want Me to Evaluate</label>
              <textarea value={callReviewFocus} onChange={(e) => setCallReviewFocus(e.target.value)} rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="What specific aspects should I focus on?" />
            </div>
          </div>
        </div>

        {/* Blockers */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Blockers & Support Needed</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">What's Blocking You (up to 5)</label>
              {dealBlockers.map((blocker, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input type="text" value={blocker}
                    onChange={(e) => { const n = [...dealBlockers]; n[index] = e.target.value; setDealBlockers(n); }}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder={`Blocker #${index + 1}`} />
                  {dealBlockers.length > 1 && (
                    <button onClick={() => setDealBlockers(dealBlockers.filter((_, i) => i !== index))} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              {dealBlockers.length < 5 && (
                <button onClick={() => setDealBlockers([...dealBlockers, ''])} className="flex items-center text-emerald-600 hover:text-emerald-700 text-sm font-medium mt-2">
                  <Plus className="w-4 h-4 mr-1" /> Add Blocker
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Support I Need from You This Week (up to 5)</label>
              {supportNeeded.map((support, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input type="text" value={support}
                    onChange={(e) => { const n = [...supportNeeded]; n[index] = e.target.value; setSupportNeeded(n); }}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder={`Support need #${index + 1}`} />
                  {supportNeeded.length > 1 && (
                    <button onClick={() => setSupportNeeded(supportNeeded.filter((_, i) => i !== index))} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              {supportNeeded.length < 5 && (
                <button onClick={() => setSupportNeeded([...supportNeeded, ''])} className="flex items-center text-emerald-600 hover:text-emerald-700 text-sm font-medium mt-2">
                  <Plus className="w-4 h-4 mr-1" /> Add Support Need
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Next Week's Goals */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-2 flex items-center gap-2">
            Next Week's Goals
            <span className="text-red-500 text-sm">*Required</span>
          </h2>
          <p className="text-sm text-slate-600 mb-4">Set clear, measurable goals for next week.</p>
          <div className="space-y-3">
            {nextWeekGoals.map((goal, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex items-center justify-center w-8 h-10 text-sm font-semibold text-slate-400">{index + 1}.</div>
                <input type="text" value={goal}
                  onChange={(e) => { const updated = [...nextWeekGoals]; updated[index] = e.target.value; setNextWeekGoals(updated); }}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder={`Goal #${index + 1} - be specific and measurable...`} />
                {nextWeekGoals.length > 1 && (
                  <button onClick={() => setNextWeekGoals(nextWeekGoals.filter((_, i) => i !== index))} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            {nextWeekGoals.length < 5 && (
              <button onClick={() => setNextWeekGoals([...nextWeekGoals, ''])} className="flex items-center text-emerald-600 hover:text-emerald-700 text-sm font-medium ml-10">
                <Plus className="w-4 h-4 mr-1" /> Add Goal
              </button>
            )}
          </div>
        </div>

        {/* Personal Check-In */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Personal Check-In</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">How I'm Taking Care of Myself This Week</label>
              <textarea value={selfCare} onChange={(e) => setSelfCare(e.target.value)} rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="Share how you're maintaining work-life balance..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Energy Level</label>
              <div className="flex gap-4">
                {(['high', 'medium', 'low'] as const).map((level) => (
                  <label key={level} className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="energy" value={level} checked={energyLevel === level}
                      onChange={(e) => setEnergyLevel(e.target.value as 'high' | 'medium' | 'low')}
                      className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm capitalize">{level}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">What I Need from You as My Executive</label>
              <textarea value={managerSupport} onChange={(e) => setManagerSupport(e.target.value)} rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="Any support or resources you need..." />
            </div>
          </div>
        </div>

      </div>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 py-4 mt-8 -mx-4 px-4">
        <div className="max-w-4xl mx-auto flex gap-3 justify-end">
          {status === 'submitted' ? (
            <>
              <div className="flex items-center gap-2 text-emerald-600 font-medium">
                <Send className="w-5 h-5" />
                Submitted Successfully
              </div>
              <button
                onClick={() => setStatus('in_progress')}
                className="flex items-center px-6 py-2.5 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Submission
              </button>
            </>
          ) : (
            <>
              <button onClick={() => handleSave(false)} disabled={saving}
                className="flex items-center px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50">
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button onClick={() => handleSave(true)} disabled={saving}
                className="flex items-center px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50">
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
