import { useState, useEffect } from 'react';
import { supabase, Week } from '../lib/supabase';
import { Calendar, Plus, X, CheckCircle, Archive } from 'lucide-react';

export function WeekManagement({ onClose }: { onClose: () => void }) {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWeekStart, setNewWeekStart] = useState('');
  const [newWeekEnd, setNewWeekEnd] = useState('');
  const [creating, setCreating] = useState(false);

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

      if (data) {
        setWeeks(data);
      }
    } catch (error) {
      console.error('Error loading weeks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWeek = async () => {
    if (!newWeekStart || !newWeekEnd) {
      alert('Please select both start and end dates');
      return;
    }

    const endDate = new Date(newWeekEnd);
    if (endDate.getDay() !== 5) {
      alert('Week ending date must be a Friday');
      return;
    }

    setCreating(true);
    try {
      const { error } = await supabase
        .from('weeks')
        .insert([
          {
            start_date: newWeekStart,
            end_date: newWeekEnd,
            status: 'active'
          }
        ]);

      if (error) throw error;

      alert('Week created successfully!');
      setNewWeekStart('');
      setNewWeekEnd('');
      await loadWeeks();
    } catch (error) {
      console.error('Error creating week:', error);
      alert('Failed to create week');
    } finally {
      setCreating(false);
    }
  };

  const setWeekActive = async (weekId: string) => {
    try {
      await supabase
        .from('weeks')
        .update({ status: 'inactive' })
        .neq('id', weekId);

      const { error } = await supabase
        .from('weeks')
        .update({ status: 'active' })
        .eq('id', weekId);

      if (error) throw error;

      alert('Week activated successfully!');
      await loadWeeks();
    } catch (error) {
      console.error('Error activating week:', error);
      alert('Failed to activate week');
    }
  };

  const closeWeek = async (weekId: string) => {
    if (!confirm('Are you sure you want to close this week? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('weeks')
        .update({ status: 'closed' })
        .eq('id', weekId);

      if (error) throw error;

      alert('Week closed successfully!');
      await loadWeeks();
    } catch (error) {
      console.error('Error closing week:', error);
      alert('Failed to close week');
    }
  };

  const quickCreateNextWeek = () => {
    const today = new Date();
    let nextFriday = new Date(today);

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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-900">Week Management</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-slate-900 mb-3">Create New Week</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={newWeekStart}
                  onChange={(e) => setNewWeekStart(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={newWeekEnd}
                  onChange={(e) => setNewWeekEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={quickCreateNextWeek}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium"
              >
                Quick Fill (Next Mon-Fri)
              </button>
              <button
                onClick={createWeek}
                disabled={creating}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {creating ? 'Creating...' : 'Create Week'}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900">All Weeks</h3>
            {weeks.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No weeks created yet</p>
            ) : (
              weeks.map((week) => (
                <div
                  key={week.id}
                  className={`border rounded-lg p-4 ${
                    week.status === 'active'
                      ? 'border-emerald-500 bg-emerald-50'
                      : week.status === 'closed'
                      ? 'border-slate-300 bg-slate-50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-900">
                          {new Date(week.start_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}{' '}
                          -{' '}
                          {new Date(week.end_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        {week.status === 'active' && (
                          <span className="px-2 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-full">
                            ACTIVE
                          </span>
                        )}
                        {week.status === 'closed' && (
                          <span className="px-2 py-1 bg-slate-600 text-white text-xs font-semibold rounded-full">
                            CLOSED
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">
                        Created: {new Date(week.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {week.status !== 'active' && week.status !== 'closed' && (
                        <button
                          onClick={() => setWeekActive(week.id)}
                          className="flex items-center gap-1 px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Set Active
                        </button>
                      )}
                      {week.status === 'active' && (
                        <button
                          onClick={() => closeWeek(week.id)}
                          className="flex items-center gap-1 px-3 py-2 bg-slate-600 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors"
                        >
                          <Archive className="w-4 h-4" />
                          Close Week
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
