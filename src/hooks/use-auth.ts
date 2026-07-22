import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { type User } from '@supabase/supabase-js';
import { toast } from 'sonner';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (data) {
            setProfile(data);
        } else {
            const { data: { user } } = await supabase.auth.getUser();
            const username = user?.user_metadata?.username || 'Gamer';
            const { data: newP } = await supabase.from('profiles').upsert({ id: userId, username, jump_balance: 0, coin_balance: 0 }).select().single();
            if (newP) setProfile(newP);
        }
    } catch (e) {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setUser(session.user); fetchProfile(session.user.id); }
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) { setUser(session.user); fetchProfile(session.user.id); }
      else { setUser(null); setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  };

  const signUp = async (email: string, pass: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password: pass, options: { data: { username } } });
    if (error) throw error;
    if (data.user) await supabase.from('profiles').upsert({ id: data.user.id, username, jump_balance: 0, coin_balance: 0 });
  };

  const addJumpPoints = useCallback(async (amount: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { data: curr } = await supabase.from('profiles').select('jump_balance').eq('id', session.user.id).single();
    const total = (curr?.jump_balance || 0) + amount;
    await supabase.from('profiles').update({ jump_balance: total }).eq('id', session.user.id);
    setProfile((prev: any) => prev ? { ...prev, jump_balance: total } : null);
  }, []);

  const addViralCoins = useCallback(async (amount: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { data: curr } = await supabase.from('profiles').select('coin_balance').eq('id', session.user.id).single();
    const total = (curr?.coin_balance || 0) + amount;
    await supabase.from('profiles').update({ coin_balance: total }).eq('id', session.user.id);
    setProfile((prev: any) => prev ? { ...prev, coin_balance: total } : null);
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); };

  return { user, profile, loading, signIn, signUp, addJumpPoints, addViralCoins, signOut, supabase, fetchProfile };
}
