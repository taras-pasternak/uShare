import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

type AuthMode = 'signIn' | 'signUp' | 'forgotPassword';

export const AuthScreen: React.FC = () => {
    const [mode, setMode] = useState<AuthMode>('signIn');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn, signUp, requestPasswordReset } = useAuth();

    const resetMessages = () => {
        setError('');
        setMessage('');
    };

    const switchMode = (nextMode: AuthMode) => {
        setMode(nextMode);
        resetMessages();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            if (mode === 'forgotPassword') {
                const { success, error } = await requestPasswordReset(email);
                if (success) {
                    setMessage('Check your email for a password reset link.');
                } else {
                    setError(error || 'Failed to send reset email');
                }
            } else if (mode === 'signUp') {
                if (!username) {
                    setError('Username is required');
                    setLoading(false);
                    return;
                }
                const { success, error } = await signUp({ email, password, username });
                if (success) {
                    setMessage('Account created! Please check your email to confirm your account.');
                    switchMode('signIn');
                } else {
                    setError(error || 'Failed to create account');
                }
            } else {
                const { success, error } = await signIn(email, password);
                if (!success) {
                    setError(error || 'Invalid email or password');
                }
            }
        } catch {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const title =
        mode === 'signUp'
            ? 'Create Account'
            : mode === 'forgotPassword'
              ? 'Reset Password'
              : 'Sign In';

    const submitLabel =
        mode === 'signUp'
            ? 'Sign Up'
            : mode === 'forgotPassword'
              ? 'Send Reset Link'
              : 'Sign In';

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white font-['Inter_Tight',sans-serif]">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md border border-gray-200">
                <h2 className="text-2xl font-bold mb-6 text-center">{title}</h2>

                {mode === 'forgotPassword' && (
                    <p className="text-sm text-gray-600 mb-4 text-center">
                        Enter your email and we&apos;ll send you a link to reset your password.
                    </p>
                )}

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
                    {mode === 'signUp' && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full border p-2 rounded"
                                placeholder="e.g. taras.pasternak"
                                required={mode === 'signUp'}
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border p-2 rounded"
                            placeholder="name@example.com"
                            required
                        />
                    </div>

                    {mode !== 'forgotPassword' && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full border p-2 rounded"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    )}

                    {mode === 'signIn' && (
                        <div className="text-right -mt-2">
                            <button
                                type="button"
                                onClick={() => switchMode('forgotPassword')}
                                className="text-sm text-blue-600 hover:underline font-medium"
                            >
                                Forgot password?
                            </button>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black text-white py-2 rounded hover:opacity-90 transition-opacity mt-2 disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : submitLabel}
                    </button>
                </form>

                <div className="mt-4 text-center text-sm">
                    {mode === 'forgotPassword' ? (
                        <button
                            type="button"
                            onClick={() => switchMode('signIn')}
                            className="text-blue-600 hover:underline font-medium"
                        >
                            Back to Sign In
                        </button>
                    ) : mode === 'signUp' ? (
                        <>
                            Already have an account?{' '}
                            <button
                                type="button"
                                onClick={() => switchMode('signIn')}
                                className="text-blue-600 hover:underline font-medium"
                            >
                                Sign In
                            </button>
                        </>
                    ) : (
                        <>
                            Don&apos;t have an account?{' '}
                            <button
                                type="button"
                                onClick={() => switchMode('signUp')}
                                className="text-blue-600 hover:underline font-medium"
                            >
                                Sign Up
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
