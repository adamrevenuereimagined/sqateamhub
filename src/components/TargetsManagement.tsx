import { useEffect, useState } from 'react';
import { supabase, User, WeeklyActivityTargets } from '../lib/supabase';
import { Target, Save, X, DollarSign } from 'lucide-react';

type Props = {
  onClose: () => void;
};

export function TargetsManagement({ onClose }: Props) {
  const [reps, setReps] = useState<User[]>([]);
  const [targets, setTargets] = useState<{ [userId: string]: WeeklyActivityTargets }>({});
  const [quotas, setQuotas] = useState<{ [userId: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRepsAndTargets();
  }, []);

  const loadRepsAndTargets = async () => {
    try {
      const { data: repsData } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'rep')
        .eq('is_active', true)
        .order('name');

      if (repsData) {
        setReps(repsData);

        const quotasMap: { [userId: string]: number } = {};
        repsData.forEach(rep => {
          quotasMap[rep.id] = rep.quarterly_quota;
        });
        setQuotas(quotasMap);

        const { data: targetsData } = await supabase
          .from('weekly_activity_targets')
          .select('*');

        const targetsMap: { [userId: string]: WeeklyActivityTargets } = {};
        if (targetsData) {
          targetsData.forEach((target: any) => {
            targetsMap[target.user_id] = target;
          });
        }
        setTargets(targetsMap);
      }
    } catch (error) {
      console.error('Error loading targets:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTarget = (userId: string, field: keyof WeeklyActivityTargets, value: number) => {
    setTargets(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value
      }
    }));
  };

  const updateQuota = (userId: string, value: number) => {
    setQuotas(prev => ({
      ...prev,
      [userId]: value
    }));
  };

  const saveTargets = async () => {
    setSaving(true);
    try {
      for (const [userId, target] of Object.entries(targets)) {
        const { error } = await supabase
          .from('weekly_activity_targets')
          .upsert({
            user_id: userId,
            target_cold_calls: target.target_cold_calls,
            target_emails: target.target_emails,
            target_li_messages: target.target_li_messages,
            target_videos: target.target_videos,
            target_dm_connects: target.target_dm_connects,
            target_meetings_booked: target.target_meetings_booked,
            target_discovery_calls: target.target_discovery_calls,
            target_opportunities_advanced: target.target_opportunities_advanced,
            target_pipeline_coverage: target.target_pipeline_coverage,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (error) throw error;
      }

      for (const [userId, quota] of Object.entries(quotas)) {
        const { error } = await supabase
          .from('users')
          .update({ quarterly_quota: quota })
          .eq('id', userId);

        if (error) throw error;
      }

      onClose();
    } catch (error) {
      console.error('Error saving targets:', error);
      alert('Failed to save targets and quotas. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-emerald-600" />
            <h2 className="text-2xl font-bold text-slate-900">Manage Weekly Activity Targets</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-slate-600 mb-6">
            Set weekly activity targets for each rep. These targets will be displayed to reps when they enter their actuals.
          </p>

          <div className="space-y-6">
            {reps.map((rep) => {
              const repTargets = targets[rep.id] || {
                target_cold_calls: 50,
                target_emails: 100,
                target_li_messages: 50,
                target_videos: 10,
                target_dm_connects: 15,
                target_meetings_booked: 5,
                target_discovery_calls: 3,
                target_opportunities_advanced: 2,
                target_pipeline_coverage: 3.0
              } as WeeklyActivityTargets;

              return (
                <div key={rep.id} className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{rep.name}</h3>
                      <p className="text-sm text-slate-600">{rep.email}</p>
                    </div>
                    <div className="text-right">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        <DollarSign className="w-4 h-4 inline" />
                        Quarterly Quota
                      </label>
                      <input
                        type="number"
                        value={quotas[rep.id] || rep.quarterly_quota}
                        onChange={(e) => updateQuota(rep.id, parseInt(e.target.value) || 0)}
                        className="w-40 px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
                      />
                    </div>
                  </div>

                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Weekly Activity Targets</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Cold Calls
                      </label>
                      <input
                        type="number"
                        value={repTargets.target_cold_calls}
                        onChange={(e) => updateTarget(rep.id, 'target_cold_calls', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Emails
                      </label>
                      <input
                        type="number"
                        value={repTargets.target_emails}
                        onChange={(e) => updateTarget(rep.id, 'target_emails', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        LinkedIn Messages
                      </label>
                      <input
                        type="number"
                        value={repTargets.target_li_messages}
                        onChange={(e) => updateTarget(rep.id, 'target_li_messages', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Videos
                      </label>
                      <input
                        type="number"
                        value={repTargets.target_videos}
                        onChange={(e) => updateTarget(rep.id, 'target_videos', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        DM Connects
                      </label>
                      <input
                        type="number"
                        value={repTargets.target_dm_connects}
                        onChange={(e) => updateTarget(rep.id, 'target_dm_connects', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Meetings Booked
                      </label>
                      <input
                        type="number"
                        value={repTargets.target_meetings_booked}
                        onChange={(e) => updateTarget(rep.id, 'target_meetings_booked', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Discovery Calls
                      </label>
                      <input
                        type="number"
                        value={repTargets.target_discovery_calls}
                        onChange={(e) => updateTarget(rep.id, 'target_discovery_calls', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Opportunities Advanced
                      </label>
                      <input
                        type="number"
                        value={repTargets.target_opportunities_advanced}
                        onChange={(e) => updateTarget(rep.id, 'target_opportunities_advanced', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Pipeline Coverage
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={repTargets.target_pipeline_coverage}
                        onChange={(e) => updateTarget(rep.id, 'target_pipeline_coverage', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveTargets}
            disabled={saving}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Targets'}
          </button>
        </div>
      </div>
    </div>
  );
}
