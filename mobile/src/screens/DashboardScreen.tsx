import { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    Pressable,
    TextInput,
    View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { FontAwesome, Feather } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { SocialProfile } from '../types';
import { getPublicProfileUrl, platformTemplates } from '../config';

// Import components
import { ProfileCard } from '../components/ProfileCard';
import { AddProfileModal } from '../components/AddProfileModal';
import { EditProfileModal } from '../components/EditProfileModal';
import { SettingsModal } from '../components/SettingsModal';
import { theme } from '../theme';

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
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Web-alignment states
    const [activeTab, setActiveTab] = useState<'profile' | 'friends'>('profile');
    const [folders, setFolders] = useState<{ id: string; name: string }[]>([]);
    const [activeFolderId, setActiveFolderId] = useState<string>('personal');
    const [friends, setFriends] = useState<{ id: string; username: string; friendId: string }[]>([]);
    const [friendsLoading, setFriendsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ id: string; username: string }[]>([]);

    // Folder editing states
    const [isAddingFolder, setIsAddingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [isEditingFolders, setIsEditingFolders] = useState(false);

    // Fetch Folders and Profiles
    useEffect(() => {
        if (!currentUser?.id) return;

        const fetchData = async () => {
            setLoading(true);

            // 1. Fetch Folders
            const { data: folderData, error: folderError } = await supabase
                .from('folders')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: true });

            let currentFolders: { id: string; name: string }[] = [];
            if (folderData && folderData.length > 0) {
                currentFolders = folderData.map((f) => ({ id: String(f.id), name: String(f.name) }));
            } else if (!folderError) {
                // Auto-create "Personal" folder if 0 folders exist, matching web
                const { data: newFolder } = await supabase
                    .from('folders')
                    .insert({ user_id: currentUser.id, name: 'Personal', color: 'blue' })
                    .select()
                    .single();

                if (newFolder) {
                    currentFolders = [{ id: String(newFolder.id), name: String(newFolder.name) }];
                }
            }
            setFolders(currentFolders);
            if (currentFolders.length > 0) {
                setActiveFolderId(currentFolders[0].id);
            }

            // 2. Fetch Profiles
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

        fetchData();
    }, [currentUser?.id]);

    // Fetch Friends
    useEffect(() => {
        if (!currentUser?.id || activeTab !== 'friends') return;

        const fetchFriends = async () => {
            setFriendsLoading(true);
            const { data: friendData, error: friendError } = await supabase
                .from('friends')
                .select('id, friend_id')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false });

            if (friendError) {
                console.error('Error fetching friends:', friendError);
                setFriendsLoading(false);
                return;
            }

            if (!friendData || friendData.length === 0) {
                setFriends([]);
                setFriendsLoading(false);
                return;
            }

            const friendIds = friendData.map((f) => f.friend_id);
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, username')
                .in('id', friendIds);

            if (profilesData) {
                const friendsList = friendData.map((f) => {
                    const profile = profilesData.find((p) => p.id === f.friend_id);
                    return {
                        id: String(f.id),
                        username: String(profile?.username || 'Unknown'),
                        friendId: String(f.friend_id),
                    };
                });
                setFriends(friendsList);
            }
            setFriendsLoading(false);
        };

        fetchFriends();
    }, [currentUser?.id, activeTab]);

    // Search profiles/users
    useEffect(() => {
        if (searchQuery.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        const delayDebounce = setTimeout(async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username')
                .ilike('username', `%${searchQuery}%`)
                .limit(5);

            if (!error && data) {
                setSearchResults(data.map((p) => ({ id: String(p.id), username: String(p.username) })));
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery]);

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

    const handleOpenPublicProfile = async () => {
        if (!currentUser?.username) return;
        const url = getPublicProfileUrl(currentUser.username);
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Error', `Cannot open URL: ${url}`);
            }
        } catch (error) {
            console.error('Failed to open public profile URL:', error);
            Alert.alert('Error', 'Failed to open profile in browser');
        }
    };

    const handleAddFolder = async () => {
        if (!newFolderName.trim() || !currentUser?.id) return;

        const { data, error } = await supabase
            .from('folders')
            .insert({
                user_id: currentUser.id,
                name: newFolderName.trim(),
            })
            .select()
            .single();

        if (error) {
            console.error('Error adding folder:', error);
            showToast('Error adding tab');
            return;
        }

        if (data) {
            const newTab = { id: String(data.id), name: String(data.name) };
            setFolders([...folders, newTab]);
            setNewFolderName('');
            setIsAddingFolder(false);
            setActiveFolderId(newTab.id);
            showToast('Tab created!');
        }
    };

    const handleDeleteFolder = async (folderId: string) => {
        Alert.alert(
            'Delete Tab',
            'Are you sure you want to delete this tab? This will not delete the social links inside it.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await supabase
                            .from('folders')
                            .delete()
                            .eq('id', folderId);

                        if (error) {
                            console.error('Error deleting folder:', error);
                            showToast('Error deleting tab');
                            return;
                        }

                        // Remove from state
                        const remainingFolders = folders.filter((f) => f.id !== folderId);
                        setFolders(remainingFolders);

                        // Switch active folder
                        if (activeFolderId === folderId && remainingFolders.length > 0) {
                            setActiveFolderId(remainingFolders[0].id);
                        } else if (remainingFolders.length === 0) {
                            setActiveFolderId('personal');
                        }
                        showToast('Tab deleted');
                    },
                },
            ]
        );
    };

    const handleAddProfile = async (platform: string, username: string, url: string): Promise<boolean> => {
        if (!currentUser?.id || !username.trim()) return false;

        const template = platformTemplates.find((t) => t.id === platform);
        const finalUrl = template?.isCustom ? url : template?.buildUrl(username.trim()) || url;
        const folderId = activeFolderId !== 'personal' ? activeFolderId : (folders.length > 0 ? folders[0].id : null);

        const { data, error } = await supabase
            .from('social_links')
            .insert([
                {
                    user_id: currentUser.id,
                    platform,
                    username: username.trim(),
                    url: finalUrl,
                    folder_id: folderId,
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

    const filteredProfiles = profiles.filter((p) => {
        if (folders.length === 0) return true;
        return p.folderId === activeFolderId || (!p.folderId && activeFolderId === folders[0]?.id);
    });

    const renderProfile = ({ item }: { item: SocialProfile }) => (
        <ProfileCard
            item={item}
            onCopy={handleCopy}
            onOpen={handleOpen}
            onEditPress={setEditingProfile}
        />
    );

    const renderFriendRow = ({ item }: { item: { id: string; username: string; friendId: string } }) => (
        <View style={styles.friendRow}>
            <View style={styles.friendLeft}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {item.username.charAt(0).toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.slash}>/</Text>
                <Text style={styles.friendName}>{item.username}</Text>
            </View>
            <View style={styles.friendActions}>
                <Pressable style={styles.actionIconButton} onPress={() => handleCopy(getPublicProfileUrl(item.username))}>
                    <Feather name="copy" size={20} color="#000" />
                </Pressable>
                <Pressable style={styles.actionIconButton} onPress={() => handleOpen(getPublicProfileUrl(item.username))}>
                    <Feather name="external-link" size={20} color="#000" />
                </Pressable>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header Redesigned to match Web App */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.logo}>/</Text>
                        <View style={styles.usernameContainer}>
                            <Text style={styles.usernameHeader}>{currentUser?.username}</Text>
                            <Pressable onPress={handleShareCopy} style={styles.shareIconBtn}>
                                <Feather name="share-2" size={18} color="#000" />
                            </Pressable>
                            <Pressable onPress={handleOpenPublicProfile} style={styles.shareIconBtn}>
                                <Feather name="external-link" size={18} color="#000" />
                            </Pressable>
                        </View>
                    </View>
                    <Pressable onPress={() => setIsSettingsOpen(true)} style={styles.settingsHeaderBtn}>
                        <Feather name="settings" size={24} color="#000" />
                    </Pressable>
                </View>
                <View style={styles.headerTabs}>
                    <Pressable
                        onPress={() => setActiveTab('profile')}
                        style={styles.tabButton}
                    >
                        <Text style={[styles.tabButtonText, activeTab === 'profile' && styles.tabButtonTextActive]}>
                            My profile
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={() => setActiveTab('friends')}
                        style={styles.tabButton}
                    >
                        <Text style={[styles.tabButtonText, activeTab === 'friends' && styles.tabButtonTextActive]}>
                            Friends
                        </Text>
                    </Pressable>
                </View>
            </View>

            {/* Content Body */}
            {activeTab === 'profile' ? (
                <View style={styles.tabContent}>
                    {/* Folders List */}
                    {folders.length > 0 && (
                        <View style={styles.foldersContainer}>
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                data={folders}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <Pressable
                                        onPress={() => {
                                            if (!isEditingFolders) {
                                                setActiveFolderId(item.id);
                                            }
                                        }}
                                        style={[
                                            styles.folderChip,
                                            activeFolderId === item.id && styles.folderChipActive,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.folderChipText,
                                                activeFolderId === item.id && styles.folderChipTextActive,
                                            ]}
                                        >
                                            {item.name}
                                        </Text>
                                        {isEditingFolders && (
                                            <Pressable
                                                onPress={() => handleDeleteFolder(item.id)}
                                                style={styles.deleteFolderBtn}
                                            >
                                                <Feather name="x-circle" size={14} color={activeFolderId === item.id ? '#fff' : '#b91c1c'} />
                                            </Pressable>
                                        )}
                                    </Pressable>
                                )}
                                contentContainerStyle={styles.foldersListContent}
                                ListFooterComponent={
                                    <View style={styles.folderActionsRow}>
                                        {isAddingFolder ? (
                                            <View style={styles.inlineAddFolder}>
                                                <TextInput
                                                    style={styles.inlineFolderInput}
                                                    placeholder="New tab..."
                                                    value={newFolderName}
                                                    onChangeText={setNewFolderName}
                                                    autoFocus
                                                    onSubmitEditing={handleAddFolder}
                                                />
                                                <Pressable onPress={handleAddFolder} style={styles.inlineAddBtn}>
                                                    <Feather name="check" size={16} color="green" />
                                                </Pressable>
                                                <Pressable onPress={() => setIsAddingFolder(false)} style={styles.inlineAddBtn}>
                                                    <Feather name="x" size={16} color="red" />
                                                </Pressable>
                                            </View>
                                        ) : (
                                            <Pressable style={styles.addFolderChip} onPress={() => setIsAddingFolder(true)}>
                                                <Feather name="plus" size={16} color="#000" />
                                            </Pressable>
                                        )}
                                        
                                        <Pressable 
                                            style={[styles.addFolderChip, isEditingFolders && styles.editFolderChipActive]} 
                                            onPress={() => setIsEditingFolders(!isEditingFolders)}
                                        >
                                            <Feather name="edit-2" size={14} color={isEditingFolders ? '#fff' : '#000'} />
                                        </Pressable>
                                    </View>
                                }
                            />
                        </View>
                    )}

                    {loading ? (
                        <Text style={styles.loadingText}>Loading...</Text>
                    ) : (
                        <FlatList
                            data={filteredProfiles}
                            keyExtractor={(item) => item.id}
                            renderItem={renderProfile}
                            contentContainerStyle={styles.listContent}
                            ListFooterComponent={
                                <Pressable style={styles.addProfileButton} onPress={() => setIsAddModalOpen(true)}>
                                    <Feather name="plus" size={20} color="#000" />
                                    <Text style={styles.addProfileButtonText}>Додати профіль</Text>
                                </Pressable>
                            }
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyTitle}>No links yet</Text>
                                    <Text style={styles.emptyText}>
                                        Tap "Додати профіль" below to save your first social profile.
                                    </Text>
                                </View>
                            }
                        />
                    )}
                </View>
            ) : (
                /* Friends Tab Redesigned */
                <View style={styles.tabContent}>
                    <View style={styles.searchContainer}>
                        <Feather name="search" size={18} color="#666" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search users..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    {searchQuery.trim().length >= 2 ? (
                        searchResults.length > 0 ? (
                            <FlatList
                                data={searchResults}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <View style={styles.friendRow}>
                                        <View style={styles.friendLeft}>
                                            <View style={styles.avatar}>
                                                <Text style={styles.avatarText}>
                                                    {item.username.charAt(0).toUpperCase()}
                                                </Text>
                                            </View>
                                            <Text style={styles.slash}>/</Text>
                                            <Text style={styles.friendName}>{item.username}</Text>
                                        </View>
                                        <View style={styles.friendActions}>
                                            <Pressable
                                                style={styles.actionIconButton}
                                                onPress={() => handleOpen(getPublicProfileUrl(item.username))}
                                            >
                                                <Feather name="external-link" size={20} color="#000" />
                                            </Pressable>
                                        </View>
                                    </View>
                                )}
                                contentContainerStyle={styles.listContent}
                            />
                        ) : (
                            <Text style={styles.loadingText}>No users found</Text>
                        )
                    ) : friendsLoading ? (
                        <Text style={styles.loadingText}>Loading friends...</Text>
                    ) : (
                        <FlatList
                            data={friends}
                            keyExtractor={(item) => item.id}
                            renderItem={renderFriendRow}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyTitle}>No friends added yet</Text>
                                    <Text style={styles.emptyText}>
                                        Search for users to view and add them.
                                    </Text>
                                </View>
                            }
                        />
                    )}
                </View>
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

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 12,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    headerLeft: {
        flexDirection: 'column',
    },
    logo: {
        fontSize: 36,
        fontWeight: '700',
        color: '#000',
        lineHeight: 44,
        marginBottom: 4,
    },
    usernameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    usernameHeader: {
        fontSize: 28,
        fontWeight: '600',
        color: '#000',
        lineHeight: 34,
    },
    shareIconBtn: {
        padding: 4,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    settingsHeaderBtn: {
        padding: 6,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginTop: 6,
    },
    headerTabs: {
        flexDirection: 'row',
        gap: 24,
        marginTop: 8,
    },
    tabButton: {
        paddingVertical: 6,
    },
    tabButtonText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#000',
        opacity: 0.4,
    },
    tabButtonTextActive: {
        fontWeight: '700',
        opacity: 1,
    },
    tabContent: {
        flex: 1,
        backgroundColor: '#fff',
    },
    foldersContainer: {
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    foldersListContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    folderChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    folderChipActive: {
        backgroundColor: '#000',
        borderColor: '#000',
    },
    folderChipText: {
        fontSize: 14,
        color: '#000',
        fontWeight: '500',
    },
    folderChipTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    folderActionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginLeft: 8,
    },
    addFolderChip: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editFolderChipActive: {
        backgroundColor: '#000',
        borderColor: '#000',
    },
    inlineAddFolder: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 20,
        paddingLeft: 12,
        paddingRight: 4,
        height: 36,
    },
    inlineFolderInput: {
        width: 80,
        fontSize: 13,
        color: '#000',
        paddingVertical: 0,
    },
    inlineAddBtn: {
        padding: 6,
    },
    deleteFolderBtn: {
        marginLeft: 6,
        padding: 2,
    },
    listContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    loadingText: {
        textAlign: 'center',
        marginTop: 40,
        color: '#666',
        fontSize: 14,
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
        color: '#000',
    },
    emptyText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
    addProfileButton: {
        backgroundColor: theme.colors.primary,
        height: 48,
        marginHorizontal: 16,
        marginTop: 20,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },

    addProfileButtonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: '500',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        marginHorizontal: 16,
        marginVertical: 14,
        borderRadius: 20,
        paddingHorizontal: 12,
        height: 40,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#000',
    },
    friendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 20,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
        backgroundColor: '#fff',
    },
    friendLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    slash: {
        fontSize: 24,
        fontWeight: '300',
        color: 'rgba(0,0,0,0.2)',
        marginHorizontal: 12,
    },
    friendName: {
        fontSize: 18,
        fontWeight: '500',
        color: '#000',
    },
    friendActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionIconButton: {
        padding: 6,
    },
    toast: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        backgroundColor: '#000',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        zIndex: 999,
    },
    toastText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
});
