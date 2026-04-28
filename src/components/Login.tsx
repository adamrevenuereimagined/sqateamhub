import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, User } from '../lib/supabase';
import { AlertCircle, LogIn } from 'lucide-react';
import { Button } from './ui';

export function Login() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { signIn } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('is_active', true)
        .order('role', { ascending: false })
        .order('name');

      if (dbError) throw dbError;
      setUsers(data as User[]);
      setError(null);
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError('Unable to connect to the database. It may be paused or unavailable. Please try again in a few moments.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setFormError(null);
    if (!selectedUserId) {
      setFormError('Please select a user.');
      return;
    }
    const selectedUser = users.find(u => u.id === selectedUserId);
    if (selectedUser?.role === 'admin') {
      if (!password) {
        setFormError('Password required for Executive login.');
        return;
      }
      if (password !== 'SQAExec2!') {
        setFormError('Incorrect password.');
        return;
      }
    }
    setSubmitting(true);
    try {
      await signIn(selectedUserId);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-brand-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin mb-4" />
          <p className="text-sm text-slate-600">Connecting to database…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-brand-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-card-hover border border-slate-200 p-8">
            <div className="mx-auto mb-5 h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold text-center text-slate-900 mb-2">
              Database Connection Error
            </h2>
            <p className="text-center text-sm text-slate-600 mb-6 text-balance">
              {error}
            </p>
            <Button
              fullWidth
              onClick={() => {
                setLoading(true);
                setError(null);
                loadUsers();
              }}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-brand-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <img src="/sqa-logo.svg" alt="SQA" className="h-20 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            BD Team Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Weekly tracking & reporting
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-card-hover border border-slate-200 p-7">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Who's signing in?
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => { setSelectedUserId(e.target.value); setFormError(null); }}
                className="w-full h-11 px-3.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm transition-colors hover:border-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">Select your name…</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedUser && (
              <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 animate-fade-in">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">Signing in as</p>
                    <p className="text-sm font-semibold text-slate-900 truncate">{selectedUser.name}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                    selectedUser.role === 'admin'
                      ? 'bg-brand-100 text-brand-700'
                      : selectedUser.role === 'bdr'
                      ? 'bg-accent-100 text-accent-700'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {selectedUser.role === 'admin' ? 'Executive' : selectedUser.role === 'bdr' ? 'BDR' : 'Sales Rep'}
                  </span>
                </div>
                {selectedUser.role === 'rep' && (
                  <p className="text-xs text-slate-500 mt-2">
                    Quarterly quota: <span className="font-medium text-slate-700">${selectedUser.quarterly_quota.toLocaleString()}</span>
                  </p>
                )}
              </div>
            )}

            {selectedUser?.role === 'admin' && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Executive Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFormError(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full h-11 px-3.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm transition-colors hover:border-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  placeholder="Enter password"
                />
              </div>
            )}

            {formError && (
              <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 animate-fade-in">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <Button
              fullWidth
              size="lg"
              loading={submitting}
              onClick={handleLogin}
              disabled={!selectedUserId}
              leadingIcon={<LogIn className="h-4 w-4" />}
            >
              Log In
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          SQA BD Team Hub · Internal use only
        </p>
      </div>
    </div>
  );
}
