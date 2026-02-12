import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Calendar, Edit, Save, X } from 'lucide-react';

type Week = {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
};

type Submission = {
  id: string;
  week_id: string;
  cold_calls: number;
  emails: number;
  li_messages: number;
  videos: number;
  decision_maker_connects: number;
  meetings_booked: number;
  discovery_calls: number;
  opportunities_advanced: number;
  pipeline_coverage_ratio: number;
  revenue_mtd: number;
  revenue_qtd: number;
  status: string;
};

type WeekWithSubmission = {
  week: Week;
  submission: Submission | null;
};

export function PastSubmissions({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [weeksWithSubmissions, setWeeksWithSubmissions] = useState<WeekWithSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Submission>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, [user?.id]);

  const loadSubmissions = async () => {
    if (!user) return;

    try {
      const { data: weeks } = await supabase
        .from('weeks')
        .select('*')
        .order('start_date', { ascending: false });

      if (weeks) {
        const { data: submissions } = await supabase
          .from('weekly_submissions')
          .select('*')
          .eq('user_id', user.id);

        const submissionsMap: { [weekId: string]: Submission } = {};
        if (submissions) {
          submissions.forEach((sub: any) => {
            submissionsMap[sub.week_id] = sub;
          });
        }

        const weeksData: WeekWithSubmission[] = weeks.map(week => ({
          week,
          submission: submissionsMap[week.id] || null
        }));

        setWeeksWithSubmissions(weeksData);
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (submission: Submission) => {
    setEditingId(submission.id);
    setEditForm(submission);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveSubmission = async () => {
    if (!editingId || !editForm) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('weekly_submissions')
        .update({
          cold_calls: editForm.cold_calls,
          emails: editForm.emails,
          li_messages: editForm.li_messages,
          videos: editForm.videos,
          decision_maker_connects: editForm.decision_maker_connects,
          meetings_booked: editForm.meetings_booked,
          discovery_calls: editForm.discovery_calls,
          opportunities_advanced: editForm.opportunities_advanced,
          pipeline_coverage_ratio: editForm.pipeline_coverage_ratio,
          revenue_mtd: editForm.revenue_mtd,
          revenue_qtd: editForm.revenue_qtd,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId);

      if (error) throw error;

      await loadSubmissions();
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error('Error saving submission:', error);
      alert('Failed to save submission. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateEditForm = (field: keyof Submission, value: number) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
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
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          My Submission History
        </h2>
        <p className="text-slate-600">
          View and edit your past weekly submissions
        </p>
      </div>

      <div className="space-y-4">
        {weeksWithSubmissions.map(({ week, submission }) => (
          <div
            key={week.id}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-slate-400" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Week ending {new Date(week.end_date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {new Date(week.start_date).toLocaleDateString()} - {new Date(week.end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {submission && editingId !== submission.id && (
                <button
                  onClick={() => startEditing(submission)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              )}

              {submission && editingId === submission.id && (
                <div className="flex gap-2">
                  <button
                    onClick={saveSubmission}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={cancelEditing}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {!submission && (
              <p className="text-slate-500 italic">No submission for this week</p>
            )}

            {submission && editingId === submission.id && (
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Cold Calls
                  </label>
                  <input
                    type="number"
                    value={editForm.cold_calls || 0}
                    onChange={(e) => updateEditForm('cold_calls', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Emails
                  </label>
                  <input
                    type="number"
                    value={editForm.emails || 0}
                    onChange={(e) => updateEditForm('emails', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    LinkedIn Messages
                  </label>
                  <input
                    type="number"
                    value={editForm.li_messages || 0}
                    onChange={(e) => updateEditForm('li_messages', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Videos
                  </label>
                  <input
                    type="number"
                    value={editForm.videos || 0}
                    onChange={(e) => updateEditForm('videos', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Decision Maker Connects
                  </label>
                  <input
                    type="number"
                    value={editForm.decision_maker_connects || 0}
                    onChange={(e) => updateEditForm('decision_maker_connects', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Meetings Booked
                  </label>
                  <input
                    type="number"
                    value={editForm.meetings_booked || 0}
                    onChange={(e) => updateEditForm('meetings_booked', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Discovery Calls
                  </label>
                  <input
                    type="number"
                    value={editForm.discovery_calls || 0}
                    onChange={(e) => updateEditForm('discovery_calls', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Opportunities Advanced
                  </label>
                  <input
                    type="number"
                    value={editForm.opportunities_advanced || 0}
                    onChange={(e) => updateEditForm('opportunities_advanced', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Pipeline Coverage Ratio
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editForm.pipeline_coverage_ratio || 0}
                    onChange={(e) => updateEditForm('pipeline_coverage_ratio', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Revenue MTD ($)
                  </label>
                  <input
                    type="number"
                    value={editForm.revenue_mtd || 0}
                    onChange={(e) => updateEditForm('revenue_mtd', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Revenue QTD ($)
                  </label>
                  <input
                    type="number"
                    value={editForm.revenue_qtd || 0}
                    onChange={(e) => updateEditForm('revenue_qtd', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {submission && editingId !== submission.id && (
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Cold Calls</p>
                  <p className="text-xl font-semibold text-slate-900">{submission.cold_calls}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Emails</p>
                  <p className="text-xl font-semibold text-slate-900">{submission.emails}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">LI Messages</p>
                  <p className="text-xl font-semibold text-slate-900">{submission.li_messages}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Videos</p>
                  <p className="text-xl font-semibold text-slate-900">{submission.videos}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">DM Connects</p>
                  <p className="text-xl font-semibold text-slate-900">{submission.decision_maker_connects}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Meetings</p>
                  <p className="text-xl font-semibold text-slate-900">{submission.meetings_booked}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Discovery Calls</p>
                  <p className="text-xl font-semibold text-slate-900">{submission.discovery_calls}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Opps Advanced</p>
                  <p className="text-xl font-semibold text-slate-900">{submission.opportunities_advanced}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Pipeline Coverage</p>
                  <p className="text-xl font-semibold text-slate-900">{submission.pipeline_coverage_ratio.toFixed(1)}x</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Revenue MTD</p>
                  <p className="text-xl font-semibold text-slate-900">${(submission.revenue_mtd / 1000).toFixed(0)}K</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Revenue QTD</p>
                  <p className="text-xl font-semibold text-slate-900">${(submission.revenue_qtd / 1000).toFixed(0)}K</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
