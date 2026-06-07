import { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    Pressable,
    View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { SocialProfile } from '../types';
import { getPublicProfileUrl, platformTemplates } from '../config';

// Import components
import { ProfileCard } from '../components/ProfileCard';
import { AddProfileModal } from '../components/AddProfileModal';
import { EditProfileModal } from '../components/EditProfileModal';

const mapRowToProfile = (row: Record<string, unknown>): SocialProfile => ({
    id: String(row.id),
    folderId: row.folder_id ? String(row.folder_id) : undefined,
    platform: String(row.platform),
    username: String(row.username),
    url: String(row.url),
});

export const DashboardScreen = () => {
    const { currentUser, signOut } = useAuth();
    const [profiles, setProfiles] = useState<SocialProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState<SocialProfile | null>(null);

    useEffect(() => {
        if (!currentUser?.id) return;

        const fetchProfiles = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('social_links')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: true });

            if (error) {
                showToast('Failed to load profiles');
            } else if (data) {
                setProfiles(data.map(mapRowToProfile));
            }
            setLoading(false);
        };

        fetchProfiles();
    }, [currentUser?.id]);

    const showToast = (message: string) => {
        setToast(message);
        setTimeout(() => setToast(null), 2000);
    };

    const handleCopy = async (text: string) => {
        await Clipboard.setStringAsync(text);
        showToast('Link copied!');
    };

    const handleOpen = (rawUrl: string) => {
        let targetUrl = rawUrl;
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = `https://${targetUrl}`;
        }
        Linking.openURL(targetUrl);
    };

    const handleShareCopy = async () => {
        if (!currentUser?.username) return;
        await Clipboard.setStringAsync(getPublicProfileUrl(currentUser.username));
        showToast('Public link copied!');
    };

    const handleOpenPublicProfile = () => {
        if (!currentUser?.username) return;
        Linking.openURL(getPublicProfileUrl(currentUser.username));
    };

    const handleAddProfile = async (platform: string, username: string, url: string): Promise<boolean> => {
        if (!currentUser?.id || !username.trim()) return false;

        const template = platformTemplates.find((t) => t.id === platform);
        const finalUrl = template?.isCustom ? url : template?.buildUrl(username.trim()) || url;

        const { data, error } = await supabase
            .from('social_links')
            .insert([
                {
                    user_id: currentUser.id,
                    platform,
                    username: username.trim(),
                    url: finalUrl,
                },
            ])
            .select()
            .single();

        if (error) {
            console.error('Error adding profile:', error);
            showToast('Error adding profile');
            return false;
        }

        if (data) {
            setProfiles([...profiles, mapRowToProfile(data)]);
            showToast('Profile added!');
            return true;
        }
        return false;
    };

    const handleUpdateProfile = async (platform: string, username: string, url: string): Promise<boolean> => {
        if (!editingProfile || !username.trim()) return false;

        const template = platformTemplates.find((t) => t.id === platform);
        const finalUrl = template?.isCustom ? url : template?.buildUrl(username.trim()) || url;

        const { data, error } = await supabase
            .from('social_links')
            .update({
                platform,
                username: username.trim(),
                url: finalUrl,
            })
            .eq('id', editingProfile.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating profile:', error);
            showToast('Error updating profile');
            return false;
        }

        if (data) {
            setProfiles(profiles.map((p) => (p.id === editingProfile.id ? mapRowToProfile(data) : p)));
            showToast('Profile updated!');
            return true;
        }
        return false;
    };

    const handleDeleteProfile = (id: string) => {
        Alert.alert('Delete profile', 'Are you sure you want to delete this link?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    const { error } = await supabase.from('social_links').delete().eq('id', id);
                    if (error) {
                        showToast('Error deleting profile');
                        return;
                    }
                    setProfiles(profiles.filter((p) => p.id !== id));
                    setEditingProfile(null);
                },
            },
        ]);
    };

    const renderProfile = ({ item }: { item: SocialProfile }) => (
        <ProfileCard
            item={item}
            onCopy={handleCopy}
            onOpen={handleOpen}
            onEditPress={setEditingProfile}
        />
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hello,</Text>
                    <Text style={styles.usernameHeader}>@{currentUser?.username}</Text>
                </View>
                <Pressable onPress={signOut}>
                    <Text style={styles.signOut}>Sign out</Text>
                </Pressable>
            </View>

            <View style={styles.toolbar}>
                <Pressable style={styles.shareButton} onPress={handleShareCopy}>
                    <Text style={styles.shareButtonText}>Copy link</Text>
                </Pressable>
                <Pressable style={styles.shareButton} onPress={handleOpenPublicProfile}>
                    <Text style={styles.shareButtonText}>Open profile</Text>
                </Pressable>
                <Pressable style={styles.addButton} onPress={() => setIsAddModalOpen(true)}>
                    <Text style={styles.addButtonText}>+ Add</Text>
                </Pressable>
            </View>

            {loading ? (
                <Text style={styles.emptyText}>Loading...</Text>
            ) : (
                <FlatList
                    data={profiles}
                    keyExtractor={(item) => item.id}
                    renderItem={renderProfile}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyTitle}>No links yet</Text>
                            <Text style={styles.emptyText}>
                                Tap "+ Add" to save your first social profile.
                            </Text>
                        </View>
                    }
                />
            )}

            {toast ? (
                <View style={styles.toast}>
                    <Text style={styles.toastText}>{toast}</Text>
                </View>
            ) : null}

            <AddProfileModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={handleAddProfile}
            />

            <EditProfileModal
                profile={editingProfile}
                onClose={() => setEditingProfile(null)}
                onSave={handleUpdateProfile}
                onDelete={handleDeleteProfile}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    greeting: {
        fontSize: 14,
        color: '#666',
    },
    usernameHeader: {
        fontSize: 22,
        fontWeight: '700',
        color: '#000',
    },
    signOut: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    toolbar: {
        flexDirection: 'row',
        gap: 10,
        padding: 16,
    },
    shareButton: {
        flex: 1,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
    },
    shareButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    addButton: {
        backgroundColor: '#000',
        borderRadius: 10,
        paddingHorizontal: 20,
        paddingVertical: 12,
        justifyContent: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 32,
        flexGrow: 1,
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    toast: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        backgroundColor: '#000',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
    },
    toastText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
});
