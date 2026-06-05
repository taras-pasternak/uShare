import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

type AuthMode = 'signIn' | 'signUp' | 'forgotPassword';

export const AuthScreen = () => {
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

    const handleSubmit = async () => {
        setError('');
        setMessage('');
        setLoading(true);

        try {
            if (mode === 'forgotPassword') {
                const result = await requestPasswordReset(email);
                if (result.success) {
                    setMessage(
                        'Check your email for a reset link. It will open the app or web to set a new password.'
                    );
                } else {
                    setError(result.error || 'Failed to send reset email');
                }
            } else if (mode === 'signUp') {
                if (!username.trim()) {
                    setError('Username is required');
                    return;
                }
                const result = await signUp({ email, password, username: username.trim() });
                if (result.success) {
                    setMessage('Account created! Check your email to confirm your account.');
                    switchMode('signIn');
                } else {
                    setError(result.error || 'Failed to create account');
                }
            } else {
                const result = await signIn(email, password);
                if (!result.success) {
                    setError(result.error || 'Invalid email or password');
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
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <Text style={styles.logo}>uShare</Text>
                    <Text style={styles.subtitle}>Your social links wallet</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.title}>{title}</Text>

                    {mode === 'forgotPassword' ? (
                        <Text style={styles.hint}>
                            Enter your email and we&apos;ll send you a link to reset your password.
                        </Text>
                    ) : null}

                    {error ? (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    {message ? (
                        <View style={styles.successBox}>
                            <Text style={styles.successText}>{message}</Text>
                        </View>
                    ) : null}

                    {mode === 'signUp' ? (
                        <View style={styles.field}>
                            <Text style={styles.label}>Username</Text>
                            <TextInput
                                value={username}
                                onChangeText={setUsername}
                                style={styles.input}
                                placeholder="e.g. taras.pasternak"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>
                    ) : null}

                    <View style={styles.field}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            style={styles.input}
                            placeholder="name@example.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    {mode !== 'forgotPassword' ? (
                        <View style={styles.field}>
                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                value={password}
                                onChangeText={setPassword}
                                style={styles.input}
                                placeholder="••••••••"
                                secureTextEntry
                            />
                        </View>
                    ) : null}

                    {mode === 'signIn' ? (
                        <Pressable
                            onPress={() => switchMode('forgotPassword')}
                            style={styles.forgotLink}
                        >
                            <Text style={styles.switchTextBold}>Forgot password?</Text>
                        </Pressable>
                    ) : null}

                    <Pressable
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>{submitLabel}</Text>
                        )}
                    </Pressable>

                    {mode === 'forgotPassword' ? (
                        <Pressable
                            onPress={() => switchMode('signIn')}
                            style={styles.switchLink}
                        >
                            <Text style={styles.switchTextBold}>Back to Sign In</Text>
                        </Pressable>
                    ) : mode === 'signUp' ? (
                        <Pressable
                            onPress={() => switchMode('signIn')}
                            style={styles.switchLink}
                        >
                            <Text style={styles.switchText}>
                                Already have an account?{' '}
                                <Text style={styles.switchTextBold}>Sign In</Text>
                            </Text>
                        </Pressable>
                    ) : (
                        <Pressable
                            onPress={() => switchMode('signUp')}
                            style={styles.switchLink}
                        >
                            <Text style={styles.switchText}>
                                Don&apos;t have an account?{' '}
                                <Text style={styles.switchTextBold}>Sign Up</Text>
                            </Text>
                        </Pressable>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logo: {
        fontSize: 36,
        fontWeight: '700',
        color: '#000',
    },
    subtitle: {
        marginTop: 8,
        fontSize: 16,
        color: '#666',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: '#e5e5e5',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 20,
        textAlign: 'center',
    },
    hint: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 16,
        marginTop: -8,
    },
    field: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 6,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#fafafa',
    },
    forgotLink: {
        alignItems: 'flex-end',
        marginTop: -8,
        marginBottom: 8,
    },
    button: {
        backgroundColor: '#000',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    switchLink: {
        marginTop: 20,
        alignItems: 'center',
    },
    switchText: {
        fontSize: 14,
        color: '#666',
    },
    switchTextBold: {
        color: '#2563eb',
        fontWeight: '600',
    },
    errorBox: {
        backgroundColor: '#fef2f2',
        borderColor: '#fecaca',
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
    },
    errorText: {
        color: '#b91c1c',
        fontSize: 14,
    },
    successBox: {
        backgroundColor: '#f0fdf4',
        borderColor: '#bbf7d0',
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
    },
    successText: {
        color: '#15803d',
        fontSize: 14,
    },
});
