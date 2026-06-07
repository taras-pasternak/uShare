import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { theme } from '../theme';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
    const { currentUser, signOut, requestPasswordReset } = useAuth();
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [saving, setSaving] = useState(false);
    const [sendingReset, setSendingReset] = useState(false);

    // Load initial values from currentUser
    useEffect(() => {
        if (isOpen && currentUser) {
            setName(currentUser.name || '');
            setUsername(currentUser.username || '');
        }
    }, [isOpen, currentUser]);

    const handleSave = async () => {
        if (!currentUser) return;

        const cleanUsername = username.trim().toLowerCase();
        const cleanName = name.trim();

        if (!cleanUsername) {
            Alert.alert('Помилка', 'Нікнейм не може бути порожнім');
            return;
        }

        // Validate username format (only alphanumeric and underscores, e.g. web-compatible)
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(cleanUsername)) {
            Alert.alert(
                'Помилка',
                'Нікнейм може містити лише латинські літери, цифри та символ підкреслення'
            );
            return;
        }

        setSaving(true);

        try {
            // 1. If username changed, update it in public.profiles first
            if (cleanUsername !== currentUser.username) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({ username: cleanUsername })
                    .eq('id', currentUser.id);

                if (profileError) {
                    if (profileError.code === '23505') {
                        Alert.alert('Помилка', 'Цей нікнейм вже зайнятий. Будь ласка, оберіть інший.');
                    } else {
                        Alert.alert('Помилка', `Не вдалося оновити нікнейм: ${profileError.message}`);
                    }
                    setSaving(false);
                    return;
                }
            }

            // 2. Update auth user metadata (both name and username)
            const { error: authError } = await supabase.auth.updateUser({
                data: {
                    name: cleanName,
                    username: cleanUsername,
                },
            });

            if (authError) {
                Alert.alert('Помилка', `Не вдалося оновити метадані: ${authError.message}`);
                setSaving(false);
                return;
            }

            Alert.alert('Успіх', 'Профіль успішно оновлено');
            onClose();
        } catch (err: any) {
            Alert.alert('Помилка', err.message || 'Сталася помилка при збереженні');
        } finally {
            setSaving(false);
        }
    };

    const handleResetPassword = async () => {
        if (!currentUser?.email) return;

        Alert.alert(
            'Скинути пароль',
            'Надіслати листа для скидання паролю на вашу електронну адресу?',
            [
                { text: 'Скасувати', style: 'cancel' },
                {
                    text: 'Надіслати',
                    onPress: async () => {
                        setSendingReset(true);
                        const res = await requestPasswordReset(currentUser.email);
                        setSendingReset(false);
                        if (res.success) {
                            Alert.alert(
                                'Успіх',
                                'Посилання для зміни паролю надіслано на вашу електронну пошту.'
                            );
                        } else {
                            Alert.alert('Помилка', res.error || 'Не вдалося надіслати лист');
                        }
                    },
                },
            ]
        );
    };

    const handleSignOut = () => {
        Alert.alert('Вихід', 'Ви впевнені, що хочете вийти з акаунту?', [
            { text: 'Скасувати', style: 'cancel' },
            {
                text: 'Вийти',
                style: 'destructive',
                onPress: async () => {
                    onClose();
                    await signOut();
                },
            },
        ]);
    };

    return (
        <Modal visible={isOpen} animationType="slide" transparent>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <Pressable style={styles.modalOverlay} onPress={onClose}>
                    <Pressable style={styles.modalContent} onPress={() => {}}>
                        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                            <Text style={styles.modalTitle}>Налаштування</Text>

                            <Text style={styles.sectionTitle}>Особиста інформація</Text>

                            <Text style={styles.label}>Ім'я</Text>
                            <TextInput
                                value={name}
                                onChangeText={setName}
                                style={styles.input}
                                placeholder="Ваше ім'я"
                                autoCorrect={false}
                            />

                            <Text style={styles.label}>Нікнейм</Text>
                            <TextInput
                                value={username}
                                onChangeText={setUsername}
                                style={styles.input}
                                placeholder="nickname"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />

                            <Pressable
                                style={styles.saveButton}
                                onPress={handleSave}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Зберегти зміни</Text>
                                )}
                            </Pressable>

                            <View style={styles.divider} />

                            <Text style={styles.sectionTitle}>Безпека</Text>
                            <Pressable
                                style={styles.resetButton}
                                onPress={handleResetPassword}
                                disabled={sendingReset}
                            >
                                {sendingReset ? (
                                    <ActivityIndicator size="small" color="#000" />
                                ) : (
                                    <Text style={styles.resetButtonText}>Скинути пароль</Text>
                                )}
                            </Pressable>

                            <View style={styles.divider} />

                            <Pressable style={styles.signOutButton} onPress={handleSignOut}>
                                <Text style={styles.signOutButtonText}>Вийти з акаунту</Text>
                            </Pressable>

                            <Pressable style={styles.closeButton} onPress={onClose}>
                                <Text style={styles.closeButtonText}>Закрити</Text>
                            </Pressable>
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    keyboardView: {
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#000',
        marginBottom: 24,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
        marginBottom: 16,
        marginTop: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 16,
        backgroundColor: '#fafafa',
        color: '#000',
    },
    saveButton: {
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: '#000',
        alignItems: 'center',
        marginTop: 8,
        height: 50,
        justifyContent: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    resetButton: {
        paddingVertical: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
        height: 50,
        justifyContent: 'center',
    },
    resetButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 20,
    },
    signOutButton: {
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: '#fee2e2',
        alignItems: 'center',
        marginBottom: 12,
        height: 50,
        justifyContent: 'center',
    },
    signOutButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ef4444',
    },
    closeButton: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#666',
    },
});
