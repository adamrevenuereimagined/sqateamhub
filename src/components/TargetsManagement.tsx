import { useEffect, useState } from 'react';
import { supabase, User } from '../lib/supabase';
import { Save, DollarSign, Users, UserCog } from 'lucide-react';
import { CurrencyInput } from './CurrencyInput';
import { Button, Modal, useToast } from './ui';

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

const numberInputClass =
  'w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 transition-colors hover:border-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 tabular-nums';

const currencyInputClass =
  'w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 transition-colors hover:border-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 tabular-nums font-medium';

export function TargetsManagement({ onClose }: Props) {
  const toast = useToast();
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
          ? { ...allTargets, target_pipeline_value: quotas[rep.id] * 3 }
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

      toast.success('Targets saved');
      onClose();
    } catch (error) {
      console.error('Error saving targets:', error);
      toast.error('Failed to save targets', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Weekly Activity Targets"
      description="Set targets for the team or for individual reps"
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            loading={saving}
            onClick={saveTargets}
            leadingIcon={<Save className="w-4 h-4" />}
          >
            Save targets
          </Button>
        </>
      }
    >
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
            <ModeTab active={mode === 'all'} onClick={() => setMode('all')} icon={<Users className="w-4 h-4" />}>
              Set for All
            </ModeTab>
            <ModeTab active={mode === 'individual'} onClick={() => setMode('individual')} icon={<UserCog className="w-4 h-4" />}>
              Set Individually
            </ModeTab>
          </div>

          {mode === 'all' ? (
            <div className="space-y-6">
              <Section title="Activity targets" description="These values will apply to every team member">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ACTIVITY_FIELDS.map(({ key, label }) => (
                    <FieldInput
                      key={key}
                      label={label}
                      value={allTargets[key]}
                      onChange={(v) => updateAllTarget(key, v)}
                    />
                  ))}
                </div>
              </Section>

              <Section
                title="Quarterly quotas & pipeline targets"
                description="Pipeline value auto-calculates as 3× each rep's quarterly quota"
              >
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Rep</th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Quarterly Quota</th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Pipeline Target</th>
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
                                className={`${currencyInputClass} w-44 text-right`}
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums">
                            <span className="font-medium text-slate-700">
                              ${((quotas[rep.id] || 0) * 3).toLocaleString()}
                            </span>
                            <span className="text-xs text-slate-400 ml-1">(3× quota)</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Set weekly activity targets for each team member individually. Pipeline Value defaults to 3× their quarterly quota.
              </p>

              {reps.map((rep) => {
                const repTargets = targets[rep.id] || {
                  ...DEFAULT_TARGETS,
                  target_pipeline_value: (quotas[rep.id] || 0) * 3,
                };

                return (
                  <div key={rep.id} className="border border-slate-200 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">{rep.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{rep.email}</p>
                      </div>
                      <div className="w-44">
                        <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          Quarterly Quota
                        </label>
                        <CurrencyInput
                          value={quotas[rep.id] || rep.quarterly_quota}
                          onChange={(val) => updateQuota(rep.id, val)}
                          className={currencyInputClass}
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {ACTIVITY_FIELDS.map(({ key, label }) => (
                        <FieldInput
                          key={key}
                          label={label}
                          value={repTargets[key]}
                          onChange={(v) => updateIndividualTarget(rep.id, key, v)}
                        />
                      ))}

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Pipeline Value
                          <span className="text-slate-400 ml-1 font-normal">
                            (default: 3× quota = ${((quotas[rep.id] || 0) * 3).toLocaleString()})
                          </span>
                        </label>
                        <CurrencyInput
                          value={repTargets.target_pipeline_value}
                          onChange={(val) => updateIndividualTarget(rep.id, 'target_pipeline_value', val)}
                          className={currencyInputClass}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {description && <p className="text-xs text-slate-500 mt-0.5 mb-3">{description}</p>}
      {!description && <div className="mb-3" />}
      {children}
    </section>
  );
}

function FieldInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className={numberInputClass}
      />
    </div>
  );
}

function ModeTab({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3.5 h-9 rounded-md text-sm font-medium transition-all ${
        active ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
