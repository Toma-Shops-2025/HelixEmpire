import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { type User } from '@supabase/supabase-js';
import { toast } from 'sonner';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
          fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
        setProfile(data);
    } else if (error && error.code === 'PGRST116') {
        setTimeout(() => fetchProfile(userId), 1500);
    }
    setLoading(false);
  }

  async function signIn(email: string, pass: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    toast.success("Welcome back!");
  }

  async function signUp(email: string, pass: string, username: string) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
            data: { username }
        }
    });

    if (error) throw error;

    if (!data.session) {
        toast.error("Check your email or disable 'Confirm Email' in Supabase!");
    } else {
        toast.success("Account created!");
    }
  }

  async function addJumpPoints(amount: number) {
    if (!user || !profile) return;
    const newBalance = (profile.jump_balance || 0) + amount;
    const { error } = await supabase.from('profiles').update({ jump_balance: newBalance }).eq('id', user.id);
    if (!error) setProfile({ ...profile, jump_balance: newBalance });
  }

  async function addViralCoins(amount: number) {
    if (!user || !profile) return;
    const newBalance = (profile.coin_balance || 0) + amount;
    const { error } = await supabase.from('profiles').update({ coin_balance: newBalance }).eq('id', user.id);
    if (!error) setProfile({ ...profile, coin_balance: newBalance });
  }

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
  }

  return { user, profile, loading, signIn, signUp, addJumpPoints, addViralCoins, signOut, supabase };
}
