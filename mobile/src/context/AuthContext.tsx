import React, { createContext, useContext, useEffect, useState } from 'react';
import { getPasswordResetRedirectUrl } from '../lib/authRedirect';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface AuthResponse {
    success: boolean;
    error?: string;
}

interface AuthContextType {
    currentUser: User | null;
    signUp: (user: User) => Promise<AuthResponse>;
    signIn: (email: string, password: string) => Promise<AuthResponse>;
    signOut: () => Promise<void>;
    requestPasswordReset: (email: string) => Promise<AuthResponse>;
    updatePassword: (password: string) => Promise<AuthResponse>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const ensureProfileExists = async (userId: string, username: string) => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('id', userId)
                    .single();

                if (error || !data) {
                    await supabase
                        .from('profiles')
                        .insert({ id: userId, username });
                }
            } catch (err) {
                console.error('Error ensuring profile exists:', err);
            }
        };

        const timeoutId = setTimeout(() => {
            if (mounted && loading) {
                console.warn('Auth check timed out, forcing application load');
                setLoading(false);
            }
        }, 3000);

        supabase.auth
            .getSession()
            .then(({ data: { session }, error }) => {
                if (!mounted) return;

                if (error) {
                    console.error('Error checking session:', error);
                }

                if (session?.user) {
                    const username =
                        session.user.user_metadata.username ||
                        session.user.email?.split('@')[0] ||
                        'User';
                    setCurrentUser({
                        username,
                        email: session.user.email || '',
                        id: session.user.id,
                    });
                    ensureProfileExists(session.user.id, username);
                }
                setLoading(false);
                clearTimeout(timeoutId);
            })
            .catch((err) => {
                console.error('Unexpected error during auth check:', err);
                if (mounted) setLoading(false);
            });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!mounted) return;

            if (session?.user) {
                const username =
                    session.user.user_metadata.username ||
                    session.user.email?.split('@')[0] ||
                    'User';
                setCurrentUser({
                    username,
                    email: session.user.email || '',
                    id: session.user.id,
                });
                ensureProfileExists(session.user.id, username);
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, []);

    const signUp = async (user: User): Promise<AuthResponse> => {
        try {
            const { error } = await supabase.auth.signUp({
                email: user.email,
                password: user.password || '',
                options: {
                    data: {
                        username: user.username,
                    },
                },
            });

            if (error) throw error;

            return { success: true };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Sign up failed';
            return { success: false, error: message };
        }
    };

    const signIn = async (email: string, password: string): Promise<AuthResponse> => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            return { success: true };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Sign in failed';
            return { success: false, error: message };
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const requestPasswordReset = async (email: string): Promise<AuthResponse> => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: getPasswordResetRedirectUrl(),
            });

            if (error) throw error;

            return { success: true };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to send reset email';
            return { success: false, error: message };
        }
    };

    const updatePassword = async (password: string): Promise<AuthResponse> => {
        try {
            const { error } = await supabase.auth.updateUser({ password });

            if (error) throw error;

            return { success: true };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to update password';
            return { success: false, error: message };
        }
    };

    return (
        <AuthContext.Provider
            value={{
                currentUser,
                signUp,
                signIn,
                signOut,
                requestPasswordReset,
                updatePassword,
                loading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
