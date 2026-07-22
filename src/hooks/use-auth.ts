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
            // Profile doesn't exist, create it from user metadata
            const { data: { user } } = await supabase.auth.getUser();
            const username = user?.user_metadata?.username || 'Gamer';
            const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .upsert({ id: userId, username: username, jump_balance: 0, coin_balance: 0 })
                .select()
                .single();
            if (newProfile) setProfile(newProfile);
        }
    } catch (e) {
        console.error("Auth: Profile fetch error", e);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id);
      } else {
          setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id);
      } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    toast.success("Welcome back!");
  };

  const signUp = async (email: string, pass: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { data: { username } }
    });
    if (error) throw error;

    if (data.user) {
        await supabase.from('profiles').upsert({ id: data.user.id, username, jump_balance: 0, coin_balance: 0 });
        toast.success("Account created!");
    } else {
        toast.error("Check your email!");
    }
  };

  const addJumpPoints = useCallback(async (amount: number) => {
    if (!user || !profile) return;
    const newBalance = (profile.jump_balance || 0) + amount;
    const { error } = await supabase.from('profiles').update({ jump_balance: newBalance }).eq('id', user.id);
    if (!error) setProfile((prev: any) => prev ? { ...prev, jump_balance: newBalance } : null);
  }, [user, profile]);

  const addViralCoins = useCallback(async (amount: number) => {
    if (!user || !profile) return;
    const newBalance = (profile.coin_balance || 0) + amount;
    const { error } = await supabase.from('profiles').update({ coin_balance: newBalance }).eq('id', user.id);
    if (!error) setProfile((prev: any) => prev ? { ...prev, coin_balance: newBalance } : null);
  }, [user, profile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
  };

  return { user, profile, loading, signIn, signUp, addJumpPoints, addViralCoins, signOut, supabase };
}
