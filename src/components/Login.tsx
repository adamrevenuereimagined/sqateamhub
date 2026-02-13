import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, User } from '../lib/supabase';
import { Users, LogIn } from 'lucide-react';

export function Login() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      setError('Unable to connect to database. The database may be paused or unavailable. Please try again in a few moments.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!selectedUserId) {
      alert('Please select a user');
      return;
    }

    const selectedUser = users.find(u => u.id === selectedUserId);
    if (selectedUser?.role === 'admin') {
      if (!password) {
        alert('Password required for Executive login');
        return;
      }
      if (password !== 'SQAExec2!') {
        alert('Incorrect password');
        return;
      }
    }

    await signIn(selectedUserId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Connecting to database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-red-100 p-3 rounded-xl">
                <Users className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-center text-slate-900 mb-3">
              Database Connection Error
            </h2>
            <p className="text-center text-slate-600 mb-6">
              {error}
            </p>
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                loadUsers();
              }}
              className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-center mb-8">
            <img src="/sqa-logo.svg" alt="SQA Logo" className="h-16" />
          </div>

          <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">
            SQA BD Team Hub
          </h1>
          <p className="text-center text-slate-600 mb-8">
            Select your name to continue
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select User
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
              >
                <option value="">Choose your name...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedUser && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-sm text-slate-600 mb-1">Logging in as:</p>
                <p className="font-semibold text-slate-900">{selectedUser.name}</p>
                {selectedUser.role === 'rep' && (
                  <p className="text-sm text-slate-600 mt-2">
                    Quarterly Quota: ${selectedUser.quarterly_quota.toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {selectedUser?.role === 'admin' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Executive Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
                  placeholder="Enter password"
                />
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={!selectedUserId}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogIn className="w-5 h-5" />
              Log In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
