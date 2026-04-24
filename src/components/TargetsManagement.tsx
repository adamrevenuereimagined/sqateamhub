import { useEffect, useState } from 'react';
import { supabase, User } from '../lib/supabase';
import { Target, Save, X, DollarSign, Users, UserCog } from 'lucide-react';
import { CurrencyInput } from './CurrencyInput';

type Props = {
  onClose: () => void;
};

type TargetFields = {
  target_cold_calls: number;
  target_li_messages: number;
  target_videos: number;
  target_dm_connects: number;
  target_meetings_booked: number;
  target_discovery_calls: number;
  target_opportunities_advanced: number;
  target_pipeline_value: number;
};

const DEFAULT_TARGETS: TargetFields = {
  target_cold_calls: 50,
  target_li_messages: 50,
  target_videos: 10,
  target_dm_connects: 15,
  target_meetings_booked: 5,
  target_discovery_calls: 3,
  target_opportunities_advanced: 2,
  target_pipeline_value: 0,
};

const ACTIVITY_FIELDS: { key: keyof TargetFields; label: string }[] = [
  { key: 'target_cold_calls', label: 'Cold Calls' },
  { key: 'target_li_messages', label: 'LinkedIn Messages' },
  { key: 'target_videos', label: 'Videos' },
  { key: 'target_dm_connects', label: 'Decision Maker Connects' },
  { key: 'target_meetings_booked', label: 'Meetings Booked' },
  { key: 'target_discovery_calls', label: 'Discovery Calls' },
  { key: 'target_opportunities_advanced', label: 'Opportunities Advanced' },
];

export function TargetsManagement({ onClose }: Props) {
  const [mode, setMode] = useState<'all' | 'individual'>('all');
  const [reps, setReps] = useState<User[]>([]);
  const [targets, setTargets] = useState<{ [userId: string]: TargetFields }>({});
  const [quotas, setQuotas] = useState<{ [userId: string]: number }>({});
  const [allTargets, setAllTargets] = useState<TargetFields>({ ...DEFAULT_TARGETS });
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
        .in('role', ['rep', 'bdr'])
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

        const targetsMap: { [userId: string]: TargetFields } = {};
        if (targetsData) {
          targetsData.forEach((target: any) => {
            targetsMap[target.user_id] = {
              target_cold_calls: target.target_cold_calls,
              target_li_messages: target.target_li_messages,
              target_videos: target.target_videos,
              target_dm_connects: target.target_dm_connects,
              target_meetings_booked: target.target_meetings_booked,
              target_discovery_calls: target.target_discovery_calls,
              target_opportunities_advanced: target.target_opportunities_advanced,
              target_pipeline_value: target.target_pipeline_value,
            };
          });
        }

        repsData.forEach(rep => {
          if (!targetsMap[rep.id]) {
            targetsMap[rep.id] = {
              ...DEFAULT_TARGETS,
              target_pipeline_value: rep.quarterly_quota * 3,
            };
          }
        });

        setTargets(targetsMap);

        if (targetsData && targetsData.length > 0) {
          const first = targetsData[0];
          setAllTargets({
            target_cold_calls: first.target_cold_calls,
            target_li_messages: first.target_li_messages,
            target_videos: first.target_videos,
            target_dm_connects: first.target_dm_connects,
            target_meetings_booked: first.target_meetings_booked,
            target_discovery_calls: first.target_discovery_calls,
            target_opportunities_advanced: first.target_opportunities_advanced,
            target_pipeline_value: 0,
          });
        }
      }
    } catch (error) {
      console.error('Error loading targets:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAllTarget = (field: keyof TargetFields, value: number) => {
    setAllTargets(prev => ({ ...prev, [field]: value }));
  };

  const updateIndividualTarget = (userId: string, field: keyof TargetFields, value: number) => {
    setTargets(prev => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: value },
    }));
  };

  const updateQuota = (userId: string, value: number) => {
    setQuotas(prev => ({ ...prev, [userId]: value }));
  };

  const saveTargets = async () => {
    setSaving(true);
    try {
      for (const rep of reps) {
        const targetValues = mode === 'all'
          ? {
              ...allTargets,
              target_pipeline_value: quotas[rep.id] * 3,
            }
          : targets[rep.id];

        const { error } = await supabase
          .from('weekly_activity_targets')
          .upsert({
            user_id: rep.id,
            target_cold_calls: targetValues.target_cold_calls,
            target_li_messages: targetValues.target_li_messages,
            target_videos: targetValues.target_videos,
            target_dm_connects: targetValues.target_dm_connects,
            target_meetings_booked: targetValues.target_meetings_booked,
            target_discovery_calls: targetValues.target_discovery_calls,
            target_opportunities_advanced: targetValues.target_opportunities_advanced,
            target_pipeline_value: targetValues.target_pipeline_value,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

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

        <div className="px-6 pt-4">
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
            <button
              onClick={() => setMode('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                mode === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              Set All Team Members
            </button>
            <button
              onClick={() => setMode('individual')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                mode === 'individual'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCog className="w-4 h-4" />
              Set Individually
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {mode === 'all' ? (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  Activity Targets
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  These values will apply to all team members
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  {ACTIVITY_FIELDS.map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {label}
                      </label>
                      <input
                        type="number"
                        value={allTargets[key]}
                        onChange={(e) => updateAllTarget(key, parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  Quarterly Quotas & Pipeline Targets
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  Pipeline Value auto-calculates as 3x each rep's quarterly quota
                </p>

                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Rep</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Quarterly Quota</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Pipeline Value Target</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reps.map((rep) => (
                        <tr key={rep.id} className="border-b border-slate-100 last:border-0">
                          <td className="py-3 px-4">
                            <p className="font-medium text-slate-900">{rep.name}</p>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-end">
                              <CurrencyInput
                                value={quotas[rep.id] || 0}
                                onChange={(val) => updateQuota(rep.id, val)}
                                className="w-40 px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900 text-right"
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-semibold text-slate-700">
                              ${((quotas[rep.id] || 0) * 3).toLocaleString()}
                            </span>
                            <span className="text-xs text-slate-400 ml-1">(3x quota)</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-slate-600">
                Set weekly activity targets for each rep individually. Pipeline Value defaults to 3x their quarterly quota.
              </p>

              {reps.map((rep) => {
                const repTargets = targets[rep.id] || {
                  ...DEFAULT_TARGETS,
                  target_pipeline_value: (quotas[rep.id] || 0) * 3,
                };

                return (
                  <div key={rep.id} className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{rep.name}</h3>
                      </div>
                      <div className="text-right">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          <DollarSign className="w-4 h-4 inline" />
                          Quarterly Quota
                        </label>
                        <CurrencyInput
                          value={quotas[rep.id] || rep.quarterly_quota}
                          onChange={(val) => updateQuota(rep.id, val)}
                          className="w-40 px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
                        />
                      </div>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Weekly Activity Targets</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      {ACTIVITY_FIELDS.map(({ key, label }) => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            {label}
                          </label>
                          <input
                            type="number"
                            value={repTargets[key]}
                            onChange={(e) => updateIndividualTarget(rep.id, key, parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      ))}

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Pipeline Value
                          <span className="text-xs text-slate-400 ml-1 font-normal">
                            (default: 3x quota = ${((quotas[rep.id] || 0) * 3).toLocaleString()})
                          </span>
                        </label>
                        <CurrencyInput
                          value={repTargets.target_pipeline_value}
                          onChange={(val) => updateIndividualTarget(rep.id, 'target_pipeline_value', val)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
