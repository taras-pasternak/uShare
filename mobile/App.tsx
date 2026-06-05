import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { supabase } from './src/lib/supabase';
import { createSessionFromResetUrl } from './src/lib/recoverySession';
import { AuthScreen } from './src/screens/AuthScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ResetPasswordScreen } from './src/screens/ResetPasswordScreen';

const AppContent = () => {
    const { currentUser, loading } = useAuth();
    const [recoveryMode, setRecoveryMode] = useState(false);
    const [handlingDeepLink, setHandlingDeepLink] = useState(true);

    const handleRecoveryUrl = async (url: string | null) => {
        if (!url) return false;

        const success = await createSessionFromResetUrl(url);
        if (success) {
            setRecoveryMode(true);
            return true;
        }
        return false;
    };

    useEffect(() => {
        let mounted = true;

        const initDeepLink = async () => {
            const initialUrl = await Linking.getInitialURL();
            if (mounted && initialUrl) {
                await handleRecoveryUrl(initialUrl);
            }
            if (mounted) setHandlingDeepLink(false);
        };

        initDeepLink();

        const subscription = Linking.addEventListener('url', async ({ url }) => {
            await handleRecoveryUrl(url);
        });

        const {
            data: { subscription: authSubscription },
        } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setRecoveryMode(true);
            }
        });

        return () => {
            mounted = false;
            subscription.remove();
            authSubscription.unsubscribe();
        };
    }, []);

    const exitRecoveryMode = () => {
        setRecoveryMode(false);
    };

    if (loading || handlingDeepLink) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    if (recoveryMode) {
        return <ResetPasswordScreen onComplete={exitRecoveryMode} />;
    }

    return currentUser ? <DashboardScreen /> : <AuthScreen />;
};

export default function App() {
    return (
        <AuthProvider>
            <StatusBar style="dark" />
            <AppContent />
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
});
