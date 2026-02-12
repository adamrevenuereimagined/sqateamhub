import { useEffect, useState } from 'react';
import { supabase, Week, BDWeeklyRepData, WeeklyGoal } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Save, Send, Plus, Trash2, ArrowLeft } from 'lucide-react';

type Props = {
  onBack: () => void;
};

export function BDWeeklyForm({ onBack }: Props) {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState<Week | null>(null);
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [repDataId, setRepDataId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Section 3: Activity & Outcomes Review
  const [coldCalls, setColdCalls] = useState(0);
  const [emails, setEmails] = useState(0);
  const [liMessages, setLiMessages] = useState(0);
  const [videos, setVideos] = useState(0);
  const [dmConnects, setDmConnects] = useState(0);
  const [meetingsBooked, setMeetingsBooked] = useState(0);
  const [dealsAdvanced, setDealsAdvanced] = useState(0);

  // Section 4: Pipeline Movement
  const [dealsAdvancing, setDealsAdvancing] = useState<Array<{
    dealName: string;
    nextStage: string;
    nextStep: string;
    notes: string;
  }>>([{ dealName: '', nextStage: '', nextStep: '', notes: '' }]);

  const [dealsStalling, setDealsStalling] = useState<Array<{
    dealName: string;
    whyStuck: string;
    nextStep: string;
    notes: string;
  }>>([{ dealName: '', whyStuck: '', nextStep: '', notes: '' }]);

  const [newDeals, setNewDeals] = useState<Array<{
    companyName: string;
    dealSource: string;
    dealPotential: string;
    notes: string;
  }>>([{ companyName: '', dealSource: '', dealPotential: '', notes: '' }]);

  // Section 5: Closing Opportunities
  const [closingOpps, setClosingOpps] = useState<Array<{
    companyDeal: string;
    value: number;
    closeDate: string;
    confidenceBlockers: string;
  }>>([{ companyDeal: '', value: 0, closeDate: '', confidenceBlockers: '' }]);

  // Section 7: Face-to-Face Meetings
  const [f2fMeetings, setF2fMeetings] = useState<Array<{
    clientProspect: string;
    dates: string;
    where: string;
    purposePrep: string;
  }>>([{ clientProspect: '', dates: '', where: '', purposePrep: '' }]);

  // Section 11: This Week's Goals
  const [weeklyGoal, setWeeklyGoal] = useState('');

  // Section 12: Last Week's Goal (auto-populated)
  const [lastWeekGoal, setLastWeekGoal] = useState<{
    goalText: string;
    achieved?: 'yes' | 'partial' | 'no';
    notes: string;
  } | null>(null);

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

        const { data: meeting } = await supabase
          .from('bd_weekly_meetings')
          .select('*')
          .eq('week_id', weekData.id)
          .maybeSingle();

        if (meeting) {
          setMeetingId(meeting.id);

          const { data: repData } = await supabase
            .from('bd_weekly_rep_data')
            .select('*')
            .eq('meeting_id', meeting.id)
            .eq('user_id', user.id)
            .maybeSingle();

          if (repData) {
            setRepDataId(repData.id);
            populateFormFromRepData(repData);
          }

          const { data: goalData } = await supabase
            .from('weekly_goals')
            .select('*')
            .eq('meeting_id', meeting.id)
            .eq('user_id', user.id)
            .maybeSingle();

          if (goalData) {
            setWeeklyGoal(goalData.goal_text);
            if (goalData.achieved) {
              setSubmitted(true);
            }
          }
        } else {
          const { data: newMeeting } = await supabase
            .from('bd_weekly_meetings')
            .insert({ week_id: weekData.id })
            .select()
            .single();

          if (newMeeting) {
            setMeetingId(newMeeting.id);
          }
        }

        await loadPreviousGoal(weekData.id);
      }
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  };

  const loadPreviousGoal = async (currentWeekId: string) => {
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
        const { data: prevMeeting } = await supabase
          .from('bd_weekly_meetings')
          .select('*')
          .eq('week_id', prevWeek.id)
          .maybeSingle();

        if (prevMeeting) {
          const { data: prevGoal } = await supabase
            .from('weekly_goals')
            .select('*')
            .eq('meeting_id', prevMeeting.id)
            .eq('user_id', user.id)
            .maybeSingle();

          if (prevGoal) {
            setLastWeekGoal({
              goalText: prevGoal.goal_text,
              achieved: undefined,
              notes: ''
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading previous goal:', error);
    }
  };

  const populateFormFromRepData = (data: BDWeeklyRepData) => {
    setColdCalls(data.cold_calls || 0);
    setEmails(data.emails || 0);
    setLiMessages(data.li_messages || 0);
    setVideos(data.videos || 0);
    setDmConnects(data.dm_connects || 0);
    setMeetingsBooked(data.meetings_booked || 0);
    setDealsAdvanced(data.deals_advanced || 0);
    setDealsAdvancing(data.deals_advancing || [{ dealName: '', nextStage: '', nextStep: '', notes: '' }]);
    setDealsStalling(data.deals_stalling || [{ dealName: '', whyStuck: '', nextStep: '', notes: '' }]);
    setNewDeals(data.new_deals || [{ companyName: '', dealSource: '', dealPotential: '', notes: '' }]);
    setClosingOpps(data.closing_opportunities || [{ companyDeal: '', value: 0, closeDate: '', confidenceBlockers: '' }]);
    setF2fMeetings(data.f2f_meetings || [{ clientProspect: '', dates: '', where: '', purposePrep: '' }]);
  };

  const handleSave = async (submitNow: boolean = false) => {
    if (!user || !currentWeek || !meetingId) return;

    setSaving(true);

    try {
      const repData = {
        meeting_id: meetingId,
        user_id: user.id,
        cold_calls: coldCalls,
        emails: emails,
        li_messages: liMessages,
        videos: videos,
        dm_connects: dmConnects,
        meetings_booked: meetingsBooked,
        deals_advanced: dealsAdvanced,
        deals_advancing: dealsAdvancing.filter(d => d.dealName),
        deals_stalling: dealsStalling.filter(d => d.dealName),
        new_deals: newDeals.filter(d => d.companyName),
        closing_opportunities: closingOpps.filter(o => o.companyDeal),
        f2f_meetings: f2fMeetings.filter(m => m.clientProspect)
      };

      if (repDataId) {
        await supabase
          .from('bd_weekly_rep_data')
          .update(repData)
          .eq('id', repDataId);
      } else {
        const { data } = await supabase
          .from('bd_weekly_rep_data')
          .insert(repData)
          .select()
          .single();

        if (data) {
          setRepDataId(data.id);
        }
      }

      await supabase
        .from('weekly_goals')
        .delete()
        .eq('meeting_id', meetingId)
        .eq('user_id', user.id);

      const goalData: any = {
        meeting_id: meetingId,
        user_id: user.id,
        goal_text: weeklyGoal
      };

      if (lastWeekGoal && submitNow) {
        goalData.achieved = lastWeekGoal.achieved;
        goalData.notes = lastWeekGoal.notes;
      }

      await supabase
        .from('weekly_goals')
        .insert(goalData);

      if (submitNow) {
        setSubmitted(true);
      }

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

        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">BD Weekly Team Meeting</h1>
          <p className="text-slate-600">
            Week of {new Date(currentWeek.start_date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Due: Thursday 5:00 PM PT | Team Meeting: Friday
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {lastWeekGoal && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Section 12: Last Week Accountability
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Review your goal from last week
            </p>

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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Section 3: Activity & Outcomes Review
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            Your activity counts for this week
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Cold Calls
              </label>
              <input
                type="number"
                value={coldCalls}
                onChange={(e) => setColdCalls(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Emails
              </label>
              <input
                type="number"
                value={emails}
                onChange={(e) => setEmails(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                LI Messages
              </label>
              <input
                type="number"
                value={liMessages}
                onChange={(e) => setLiMessages(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Videos
              </label>
              <input
                type="number"
                value={videos}
                onChange={(e) => setVideos(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                DM Connects
              </label>
              <input
                type="number"
                value={dmConnects}
                onChange={(e) => setDmConnects(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Meetings Booked
              </label>
              <input
                type="number"
                value={meetingsBooked}
                onChange={(e) => setMeetingsBooked(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Deals Advanced
              </label>
              <input
                type="number"
                value={dealsAdvanced}
                onChange={(e) => setDealsAdvanced(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Section 4: Pipeline Movement
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Deals Advancing This Week
              </h3>
              {dealsAdvancing.map((deal, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4 mb-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Deal Name"
                      value={deal.dealName}
                      onChange={(e) => {
                        const newDeals = [...dealsAdvancing];
                        newDeals[index].dealName = e.target.value;
                        setDealsAdvancing(newDeals);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Notes"
                      value={deal.notes}
                      onChange={(e) => {
                        const newDeals = [...dealsAdvancing];
                        newDeals[index].notes = e.target.value;
                        setDealsAdvancing(newDeals);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={() => setDealsAdvancing([...dealsAdvancing, { dealName: '', nextStage: '', nextStep: '', notes: '' }])}
                className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Deal
              </button>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Deals Stalling/Stuck
              </h3>
              {dealsStalling.map((deal, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4 mb-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Deal Name"
                      value={deal.dealName}
                      onChange={(e) => {
                        const newDeals = [...dealsStalling];
                        newDeals[index].dealName = e.target.value;
                        setDealsStalling(newDeals);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Why Stuck"
                      value={deal.whyStuck}
                      onChange={(e) => {
                        const newDeals = [...dealsStalling];
                        newDeals[index].whyStuck = e.target.value;
                        setDealsStalling(newDeals);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Next Step"
                      value={deal.nextStep}
                      onChange={(e) => {
                        const newDeals = [...dealsStalling];
                        newDeals[index].nextStep = e.target.value;
                        setDealsStalling(newDeals);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Notes"
                      value={deal.notes}
                      onChange={(e) => {
                        const newDeals = [...dealsStalling];
                        newDeals[index].notes = e.target.value;
                        setDealsStalling(newDeals);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={() => setDealsStalling([...dealsStalling, { dealName: '', whyStuck: '', nextStep: '', notes: '' }])}
                className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
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
                  <div className="grid md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={deal.companyName}
                      onChange={(e) => {
                        const newDealsList = [...newDeals];
                        newDealsList[index].companyName = e.target.value;
                        setNewDeals(newDealsList);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Notes"
                      value={deal.notes}
                      onChange={(e) => {
                        const newDealsList = [...newDeals];
                        newDealsList[index].notes = e.target.value;
                        setNewDeals(newDealsList);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={() => setNewDeals([...newDeals, { companyName: '', dealSource: '', dealPotential: '', notes: '' }])}
                className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Deal
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Section 5: Closing Opportunities This Week
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
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
            <button
              onClick={() => setClosingOpps([...closingOpps, { companyDeal: '', value: 0, closeDate: '', confidenceBlockers: '' }])}
              className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Opportunity
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Section 7: Face-to-Face Meetings Next Week
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
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
            <button
              onClick={() => setF2fMeetings([...f2fMeetings, { clientProspect: '', dates: '', where: '', purposePrep: '' }])}
              className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Meeting
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Section 11: This Week's Goals
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            Set a clear, measurable goal for next week (will carry forward for accountability)
          </p>

          <textarea
            value={weeklyGoal}
            onChange={(e) => setWeeklyGoal(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your goal for next week..."
          />
        </div>
      </div>

      <div className="sticky bottom-0 bg-white border-t border-slate-200 py-4 mt-8 -mx-4 px-4">
        <div className="max-w-4xl mx-auto flex gap-3 justify-end">
          <button
            onClick={() => handleSave(false)}
            disabled={saving || submitted}
            className="flex items-center px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {submitted ? 'Already Submitted' : 'Save Draft'}
          </button>

          <button
            onClick={() => handleSave(true)}
            disabled={saving || submitted}
            className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4 mr-2" />
            {submitted ? 'Submitted' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
