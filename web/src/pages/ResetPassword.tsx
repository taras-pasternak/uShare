import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export const ResetPassword = () => {
    const { updatePassword } = useAuth();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isRecoveryMode, setIsRecoveryMode] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);

    useEffect(() => {
        let mounted = true;

        const checkRecoverySession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (mounted && session) {
                setIsRecoveryMode(true);
            }
            if (mounted) setCheckingSession(false);
        };

        checkRecoverySession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (!mounted) return;

            if (event === 'PASSWORD_RECOVERY' || session) {
                setIsRecoveryMode(true);
                setCheckingSession(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const result = await updatePassword(password);
            if (result.success) {
                setMessage('Password updated! You can sign in with your new password.');
                await supabase.auth.signOut();
                setTimeout(() => navigate('/'), 2000);
            } else {
                setError(result.error || 'Failed to update password');
            }
        } catch {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (checkingSession) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white">
                <p className="text-gray-600">Loading...</p>
            </div>
        );
    }

    if (!isRecoveryMode) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white font-['Inter_Tight',sans-serif]">
                <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md border border-gray-200 text-center">
                    <h2 className="text-2xl font-bold mb-4">Invalid or expired link</h2>
                    <p className="text-gray-600 mb-6">
                        Request a new password reset from the sign-in page.
                    </p>
                    <Link
                        to="/"
                        className="text-blue-600 hover:underline font-medium"
                    >
                        Back to Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white font-['Inter_Tight',sans-serif]">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md border border-gray-200">
                <h2 className="text-2xl font-bold mb-6 text-center">Set New Password</h2>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border p-2 rounded"
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full border p-2 rounded"
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black text-white py-2 rounded hover:opacity-90 transition-opacity mt-2 disabled:opacity-50"
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>

                <div className="mt-4 text-center text-sm">
                    <Link to="/" className="text-blue-600 hover:underline font-medium">
                        Back to Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
};
