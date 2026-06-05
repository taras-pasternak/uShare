import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { platformTemplates } from '../config';
import type { SocialProfile } from '../types';

interface EditProfileModalProps {
    profile: SocialProfile | null;
    onClose: () => void;
    onSave: (platform: string, username: string, url: string) => Promise<boolean>;
    onDelete: (id: string) => void;
}

export const EditProfileModal = ({ profile, onClose, onSave, onDelete }: EditProfileModalProps) => {
    const [platform, setPlatform] = useState(platformTemplates[0].id);
    const [username, setUsername] = useState('');
    const [url, setUrl] = useState('');

    useEffect(() => {
        if (profile) {
            setPlatform(profile.platform);
            setUsername(profile.username);
            setUrl(profile.url);
        }
    }, [profile]);

    useEffect(() => {
        const template = platformTemplates.find((t) => t.id === platform);
        if (template && !template.isCustom) {
            setUrl(template.buildUrl(username));
        }
    }, [platform, username]);

    const handleSave = async () => {
        if (!username.trim()) return;
        const success = await onSave(platform, username.trim(), url);
        if (success) {
            onClose();
        }
    };

    return (
        <Modal visible={!!profile} animationType="slide" transparent>
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <Pressable style={styles.modalContent} onPress={() => {}}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { marginBottom: 0 }]}>Edit Profile</Text>
                        {profile && (
                            <Pressable
                                style={styles.modalDeleteButton}
                                onPress={() => onDelete(profile.id)}
                            >
                                <Text style={styles.modalDeleteButtonText}>Delete</Text>
                            </Pressable>
                        )}
                    </View>

                    <Text style={styles.label}>Platform</Text>
                    <View style={styles.platformPicker}>
                        {platformTemplates.map((t) => (
                            <Pressable
                                key={t.id}
                                style={[
                                    styles.platformChip,
                                    platform === t.id && styles.platformChipActive,
                                ]}
                                onPress={() => setPlatform(t.id)}
                            >
                                <Text
                                    style={[
                                        styles.platformChipText,
                                        platform === t.id && styles.platformChipTextActive,
                                    ]}
                                >
                                    {t.platformDisplay}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    <Text style={styles.label}>Username</Text>
                    <TextInput
                        value={username}
                        onChangeText={setUsername}
                        style={styles.input}
                        placeholder={
                            platformTemplates.find((t) => t.id === platform)?.placeholder
                        }
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <Text style={styles.label}>URL</Text>
                    <TextInput
                        value={url}
                        onChangeText={(newUrl) => {
                            setUrl(newUrl);
                            const template = platformTemplates.find((t) => t.id === platform);
                            if (template?.extractUsername) {
                                const extracted = template.extractUsername(newUrl);
                                if (extracted) {
                                    setUsername(extracted);
                                }
                            }
                        }}
                        style={styles.input}
                        placeholder="https://..."
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <View style={styles.modalActions}>
                        <Pressable style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.saveButton, !username.trim() && styles.buttonDisabled]}
                            onPress={handleSave}
                            disabled={!username.trim()}
                        >
                            <Text style={styles.saveButtonText}>Save</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        paddingBottom: 40,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    modalDeleteButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#fef2f2',
    },
    modalDeleteButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#b91c1c',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
        color: '#333',
    },
    platformPicker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    platformChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    platformChipActive: {
        backgroundColor: '#000',
        borderColor: '#000',
    },
    platformChipText: {
        fontSize: 13,
        color: '#333',
    },
    platformChipTextActive: {
        color: '#fff',
        fontWeight: '600',
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
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    saveButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: '#000',
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});
