import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, User } from '../lib/supabase';

type AuthContextType = {
  session: any;
  user: User | null;
  loading: boolean;
  signIn: (userId: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isRep: boolean;
  isBdr: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const signIn = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setUser(data as User);
      localStorage.setItem('selectedUserId', userId);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('selectedUserId');
  };

  useEffect(() => {
    localStorage.removeItem('selectedUserId');
  }, []);

  const isAdmin = user?.role === 'admin';
  const isRep = user?.role === 'rep';
  const isBdr = user?.role === 'bdr';

  return (
    <AuthContext.Provider value={{ session: user ? {} : null, user, loading, signIn, signOut, isAdmin, isRep, isBdr }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
