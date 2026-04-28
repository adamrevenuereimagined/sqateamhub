import { useState, useEffect } from 'react';
import { supabase, Week } from '../lib/supabase';
import { Plus, CheckCircle, Archive } from 'lucide-react';
import { formatDate } from '../lib/dateUtils';
import { Button, Modal, useToast, useConfirm } from './ui';

export function WeekManagement({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWeekStart, setNewWeekStart] = useState('');
  const [newWeekEnd, setNewWeekEnd] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWeeks();
  }, []);

  const loadWeeks = async () => {
    try {
      const { data } = await supabase
        .from('weeks')
        .select('*')
        .order('start_date', { ascending: false })
        .limit(20);
      if (data) setWeeks(data);
    } catch (err) {
      console.error('Error loading weeks:', err);
    } finally {
      setLoading(false);
    }
  };

  const createWeek = async () => {
    setError(null);
    if (!newWeekStart || !newWeekEnd) {
      setError('Please select both start and end dates');
      return;
    }
    const endDateParts = newWeekEnd.split('-');
    const endDate = new Date(parseInt(endDateParts[0]), parseInt(endDateParts[1]) - 1, parseInt(endDateParts[2]));
    if (endDate.getDay() !== 5) {
      setError('Week ending date must be a Friday');
      return;
    }
    setCreating(true);
    try {
      const { error: dbError } = await supabase
        .from('weeks')
        .insert([{ start_date: newWeekStart, end_date: newWeekEnd, status: 'active' }]);
      if (dbError) throw dbError;
      toast.success('Week created');
      setNewWeekStart('');
      setNewWeekEnd('');
      await loadWeeks();
    } catch (err) {
      console.error('Error creating week:', err);
      toast.error('Failed to create week');
    } finally {
      setCreating(false);
    }
  };

  const setWeekActive = async (weekId: string) => {
    try {
      await supabase.from('weeks').update({ status: 'inactive' }).neq('id', weekId);
      const { error: dbError } = await supabase.from('weeks').update({ status: 'active' }).eq('id', weekId);
      if (dbError) throw dbError;
      toast.success('Week activated');
      await loadWeeks();
    } catch (err) {
      console.error('Error activating week:', err);
      toast.error('Failed to activate week');
    }
  };

  const closeWeek = async (weekId: string) => {
    const ok = await confirm({
      title: 'Close this week?',
      body: 'This action cannot be undone. Reps will no longer be able to submit reports for this week.',
      confirmLabel: 'Close week',
      danger: true,
    });
    if (!ok) return;
    try {
      const { error: dbError } = await supabase.from('weeks').update({ status: 'closed' }).eq('id', weekId);
      if (dbError) throw dbError;
      toast.success('Week closed');
      await loadWeeks();
    } catch (err) {
      console.error('Error closing week:', err);
      toast.error('Failed to close week');
    }
  };

  const quickCreateNextWeek = () => {
    const today = new Date();
    const nextFriday = new Date(today);
    const daysUntilFriday = (5 - today.getDay() + 7) % 7;
    if (daysUntilFriday === 0) {
      nextFriday.setDate(today.getDate() + 7);
    } else {
      nextFriday.setDate(today.getDate() + daysUntilFriday);
    }
    const monday = new Date(nextFriday);
    monday.setDate(nextFriday.getDate() - 4);
    setNewWeekStart(monday.toISOString().split('T')[0]);
    setNewWeekEnd(nextFriday.toISOString().split('T')[0]);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Week Management"
      description="Create new weeks and manage week status"
      size="lg"
    >
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          <section className="bg-brand-50/50 border border-brand-100 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Create New Week</h3>
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <Field label="Start date">
                <input
                  type="date"
                  value={newWeekStart}
                  onChange={(e) => { setNewWeekStart(e.target.value); setError(null); }}
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </Field>
              <Field label="End date (Friday)">
                <input
                  type="date"
                  value={newWeekEnd}
                  onChange={(e) => { setNewWeekEnd(e.target.value); setError(null); }}
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </Field>
            </div>
            {error && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-3">
                {error}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={quickCreateNextWeek}>
                Auto-fill next Mon–Fri
              </Button>
              <Button
                size="sm"
                loading={creating}
                onClick={createWeek}
                leadingIcon={<Plus className="w-4 h-4" />}
              >
                Create week
              </Button>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Recent Weeks</h3>
            {weeks.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
                <p className="text-sm text-slate-500">No weeks created yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {weeks.map((week) => (
                  <div
                    key={week.id}
                    className="flex items-center justify-between gap-4 p-4 border border-slate-200 rounded-lg bg-white hover:border-slate-300 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-medium text-slate-900 text-sm">
                          {formatDate(week.start_date)} – {formatDate(week.end_date)}
                        </p>
                        <StatusPill status={week.status} />
                      </div>
                      <p className="text-xs text-slate-500">
                        Created {new Date(week.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {week.status !== 'active' && week.status !== 'closed' && (
                        <Button
                          size="sm"
                          variant="success"
                          leadingIcon={<CheckCircle className="w-4 h-4" />}
                          onClick={() => setWeekActive(week.id)}
                        >
                          Activate
                        </Button>
                      )}
                      {week.status === 'active' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          leadingIcon={<Archive className="w-4 h-4" />}
                          onClick={() => closeWeek(week.id)}
                        >
                          Close
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-accent-100 text-accent-700 border-accent-200',
    closed: 'bg-slate-200 text-slate-700 border-slate-300',
    inactive: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <span className={`text-[10px] uppercase font-semibold tracking-wide px-1.5 py-0.5 rounded border ${styles[status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {status}
    </span>
  );
}
