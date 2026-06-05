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
import { supabase } from '../lib/supabase';

interface ResetPasswordScreenProps {
    onComplete: () => void;
}

export const ResetPasswordScreen = ({ onComplete }: ResetPasswordScreenProps) => {
    const { updatePassword } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
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
                setMessage('Password updated! Sign in with your new password.');
                await supabase.auth.signOut();
                setTimeout(onComplete, 2000);
            } else {
                setError(result.error || 'Failed to update password');
            }
        } catch {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

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
                    <Text style={styles.subtitle}>Set your new password</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.title}>New Password</Text>

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

                    <View style={styles.field}>
                        <Text style={styles.label}>New Password</Text>
                        <TextInput
                            value={password}
                            onChangeText={setPassword}
                            style={styles.input}
                            placeholder="••••••••"
                            secureTextEntry
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Confirm Password</Text>
                        <TextInput
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            style={styles.input}
                            placeholder="••••••••"
                            secureTextEntry
                        />
                    </View>

                    <Pressable
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Update Password</Text>
                        )}
                    </Pressable>

                    <Pressable onPress={onComplete} style={styles.switchLink}>
                        <Text style={styles.switchTextBold}>Back to Sign In</Text>
                    </Pressable>
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
    switchTextBold: {
        color: '#2563eb',
        fontWeight: '600',
        fontSize: 14,
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
