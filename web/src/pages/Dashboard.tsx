import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';


// Image assets
import imgCopyIcon from "../../assets/icons/imgCopyIcon.svg";
import imgOpenIcon from "../../assets/icons/imgOpenIcon.svg";
import imgEditIcon from "../../assets/icons/imgEditIcon.svg";
import imgFrame from "../../assets/icons/imgAddIcon.svg";
import imgShareIcon from "../../assets/icons/imgShareicon.svg";


import type { SocialProfile } from '../types';
import { getIconUrlForPlatform } from '../config';
import { AddProfileModal } from '../components/AddProfileModal';
import { EditProfileModal } from '../components/EditProfileModal';
import { Toast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { AuthScreen } from '../components/AuthScreen';
import { SearchBox } from '../components/SearchBox';

export const Dashboard = () => {
    const { currentUser, signOut } = useAuth();
    const [profiles, setProfiles] = useState<SocialProfile[]>([]);
    const [friends, setFriends] = useState<any[]>([]);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState<SocialProfile | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'profile' | 'friends'>('profile');



    // Load from Supabase
    useEffect(() => {
        if (!currentUser?.id) return;

        const fetchProfiles = async () => {
            const { data, error } = await supabase
                .from('social_links')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching profiles:', error);
                return;
            }

            if (data) {
                const profilesWithIcons = data.map((p: any) => ({
                    ...p,
                    iconUrl: getIconUrlForPlatform(p.platform)
                }));
                setProfiles(profilesWithIcons);
            }
        };

        fetchProfiles();
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser?.id || activeTab !== 'friends') return;

        const fetchFriends = async () => {
            // First, get all friend relationships
            const { data: friendData, error: friendError } = await supabase
                .from('friends')
                .select('id, friend_id')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false });

            if (friendError) {
                console.error('Error fetching friends:', friendError);
                return;
            }

            if (!friendData || friendData.length === 0) {
                setFriends([]);
                return;
            }

            // Then, get the profile data for each friend
            const friendIds = friendData.map(f => f.friend_id);
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, username')
                .in('id', friendIds);

            if (profilesError) {
                console.error('Error fetching friend profiles:', profilesError);
                return;
            }

            if (profilesData) {
                // Combine the data
                const friendsList = friendData.map(f => {
                    const profile = profilesData.find(p => p.id === f.friend_id);
                    return {
                        id: f.id,
                        username: profile?.username || 'Unknown',
                        friendId: f.friend_id
                    };
                });
                setFriends(friendsList);
            }
        };

        fetchFriends();
    }, [currentUser, activeTab]);



    const handleCopy = (username: string, id: string) => {
        navigator.clipboard.writeText(username);
        setCopiedId(id);
        setToastMessage('Username copied!');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleOpen = (url: string) => {
        let targetUrl = url;
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = `https://${targetUrl}`;
        }
        window.open(targetUrl, '_blank');
    };

    const handleEdit = (id: string) => {
        const profile = profiles.find(p => p.id === id);
        if (profile) {
            setEditingProfile(profile);
        }
    };

    const handleUpdateProfile = async (updatedProfile: SocialProfile) => {
        const { error } = await supabase
            .from('social_links')
            .update({
                platform: updatedProfile.platform,
                username: updatedProfile.username,
                url: updatedProfile.url
            })
            .eq('id', updatedProfile.id);

        if (error) {
            console.error('Error updating profile:', error);
            setToastMessage('Error updating profile');
            return;
        }

        setProfiles(profiles.map(p => p.id === updatedProfile.id ? updatedProfile : p));
    };

    const handleDeleteProfile = async (id: string) => {
        const { error } = await supabase
            .from('social_links')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting profile:', error);
            setToastMessage('Error deleting profile');
            return;
        }

        setProfiles(profiles.filter(p => p.id !== id));
    };

    const closeEditModal = () => {
        setEditingProfile(null);
    };

    const openAddModal = () => {
        setIsAddModalOpen(true);
    };

    const closeAddModal = () => {
        setIsAddModalOpen(false);
    };

    const handleAddProfile = async (newProfile: SocialProfile) => {
        if (!currentUser?.id) return;

        const { data, error } = await supabase
            .from('social_links')
            .insert([{
                user_id: currentUser.id,
                platform: newProfile.platform,
                username: newProfile.username,
                url: newProfile.url
            }])
            .select()
            .single();

        if (error) {
            console.error('Error adding profile:', error);
            setToastMessage('Error adding profile');
            return;
        }

        if (data) {
            const profileWithIcon = {
                ...data,
                iconUrl: getIconUrlForPlatform(data.platform)
            };
            setProfiles([...profiles, profileWithIcon]);
        }
    };

    const handleShareCopy = () => {
        if (currentUser?.username) {
            const url = `${window.location.origin}/u/${currentUser.username}`;
            navigator.clipboard.writeText(url);
            setToastMessage('Public link copied!');
        }
    };



    if (!currentUser) {
        return <AuthScreen />;
    }

    return (
        <div className="bg-white content-stretch flex flex-col items-center relative size-full min-h-screen font-['Inter_Tight',sans-serif]">
            {/* Header */}
            <div className="bg-[#d9d9d9] box-border content-stretch flex flex-col gap-[112px] items-start p-[12px] relative shrink-0 text-black text-nowrap tracking-[-0.4512px] w-full whitespace-pre">
                <div className="w-full flex justify-between items-stretch relative">
                    <div>
                        <Link to="/" className="font-['Inter_Tight',sans-serif] font-bold leading-[60px] relative shrink-0 text-[36px] hover:opacity-70 transition-opacity text-black no-underline">
                            /
                        </Link>
                        <div className="flex items-center gap-2 relative">
                            <p className="font-['Inter_Tight',sans-serif] font-medium leading-[36px] relative shrink-0 text-[32px]">
                                {currentUser.username}
                            </p>
                            <div className="relative">
                                <button
                                    onClick={handleShareCopy}
                                    className="p-1 hover:bg-black/10 rounded-full transition-colors"
                                    title="Copy Public Link"
                                >
                                    <img src={imgShareIcon} alt="Share" width={20} height={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Search Box */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 z-50">
                        <SearchBox />
                    </div>

                    <div className="flex flex-col items-end justify-between">
                        <button onClick={signOut} className="text-sm underline opacity-50 hover:opacity-100">
                            Sign Out
                        </button>
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`font-['Inter_Tight',sans-serif] text-[18px] tracking-[-0.3008px] transition-colors ${activeTab === 'profile'
                                    ? 'font-bold text-black'
                                    : 'font-medium text-black/40 hover:text-black/70'
                                    }`}
                            >
                                My profile
                            </button>
                            <button
                                onClick={() => setActiveTab('friends')}
                                className={`font-['Inter_Tight',sans-serif] text-[18px] tracking-[-0.3008px] transition-colors ${activeTab === 'friends'
                                    ? 'font-bold text-black'
                                    : 'font-medium text-black/40 hover:text-black/70'
                                    }`}
                            >
                                Friends
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile List */}
            {activeTab === 'profile' && (
                <>
                    {profiles.length > 0 && (
                        <>
                            {profiles.map((profile) => (
                                <div
                                    key={profile.id}
                                    className="border-[0px_0px_1px] border-[rgba(0,0,0,0.2)] border-solid box-border content-stretch flex gap-[12px] items-center px-[12px] py-[24px] relative shrink-0 w-full"
                                >
                                    <div className="overflow-clip relative shrink-0 size-[24px] bg-transparent">
                                        <img alt={profile.platform} className="block max-w-none size-full" src={profile.iconUrl} style={{ stroke: 'none' }} />
                                    </div>
                                    <p className="font-['Inter_Tight',sans-serif] font-normal leading-[40px] relative shrink-0 text-[24px] text-[rgba(0,0,0,0.2)] text-nowrap tracking-[-0.3008px] whitespace-pre">
                                        /
                                    </p>
                                    <p className="basis-0 font-['Inter_Tight',sans-serif] font-medium grow leading-[18px] min-h-px min-w-px relative shrink-0 text-[18px] text-black tracking-[-0.3008px]">
                                        {profile.username}
                                    </p>
                                    <button
                                        onClick={() => handleCopy(profile.username, profile.id)}
                                        className={`relative shrink-0 size-[24px] hover:opacity-70 transition-opacity bg-transparent border-none p-0 m-0 ${copiedId === profile.id ? 'opacity-50' : ''}`}
                                        title="Копіювати нікнейм"
                                        style={{ stroke: 'none', outline: 'none', padding: 0, margin: 0 }}
                                    >
                                        <img alt="Copy" className="block max-w-none size-full p-0 m-0" src={imgCopyIcon} style={{ stroke: 'none', padding: 0, margin: 0 }} />
                                    </button>
                                    <button
                                        onClick={() => handleOpen(profile.url)}
                                        className="relative shrink-0 size-[24px] hover:opacity-70 transition-opacity bg-transparent border-none p-0 m-0"
                                        title="Відкрити профіль"
                                        style={{ stroke: 'none', outline: 'none', padding: 0, margin: 0 }}
                                    >
                                        <img alt="Open" className="block max-w-none size-full p-0 m-0" src={imgOpenIcon} style={{ stroke: 'none', padding: 0, margin: 0 }} />
                                    </button>
                                    <button
                                        onClick={() => handleEdit(profile.id)}
                                        className="relative shrink-0 size-[24px] hover:opacity-70 transition-opacity bg-transparent border-none p-0 m-0"
                                        title="Редагувати"
                                        style={{ stroke: 'none', outline: 'none', padding: 0, margin: 0 }}
                                    >
                                        <img alt="Edit" className="block max-w-none size-full p-0 m-0" src={imgEditIcon} style={{ stroke: 'none', padding: 0, margin: 0 }} />
                                    </button>
                                </div>
                            ))}
                            <div className="basis-0 bg-white grow min-h-px min-w-px shrink-0 w-full" />
                        </>
                    )}

                    {/* Add Button */}
                    <div className="box-border content-stretch flex flex-col items-start p-[12px] relative shrink-0 w-full">
                        <button
                            onClick={openAddModal}
                            className="bg-[#d9d9d9] box-border content-stretch flex gap-[10px] h-[48px] items-center justify-center p-[10px] relative shrink-0 w-full hover:opacity-90 transition-opacity"
                        >
                            <div className="relative shrink-0 size-[24px] bg-transparent">
                                <img alt="Add" className="block max-w-none size-full" src={imgFrame} style={{ stroke: 'none' }} />
                            </div>
                            <p className="font-['Inter_Tight',sans-serif] font-medium leading-[18px] relative shrink-0 text-[18px] text-black text-nowrap tracking-[-0.3008px] whitespace-pre">
                                Додати профіль
                            </p>
                        </button>
                    </div>
                </>
            )}

            {activeTab === 'friends' && (
                <>
                    {friends.length > 0 ? (
                        <>
                            {friends.map((friend) => (
                                <div
                                    key={friend.id}
                                    className="border-[0px_0px_1px] border-[rgba(0,0,0,0.2)] border-solid box-border content-stretch flex gap-[12px] items-center px-[12px] py-[24px] relative shrink-0 w-full"
                                >
                                    <div className="overflow-clip relative shrink-0 size-[24px] bg-gray-200 rounded-full flex items-center justify-center">
                                        <span className="text-xs font-bold text-gray-500">{friend.username.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <p className="font-['Inter_Tight',sans-serif] font-normal leading-[40px] relative shrink-0 text-[24px] text-[rgba(0,0,0,0.2)] text-nowrap tracking-[-0.3008px] whitespace-pre">
                                        /
                                    </p>
                                    <p className="basis-0 font-['Inter_Tight',sans-serif] font-medium grow leading-[18px] min-h-px min-w-px relative shrink-0 text-[18px] text-black tracking-[-0.3008px]">
                                        {friend.username}
                                    </p>
                                    <button
                                        onClick={() => handleCopy(friend.username, friend.id)}
                                        className={`relative shrink-0 size-[24px] hover:opacity-70 transition-opacity bg-transparent border-none p-0 m-0 ${copiedId === friend.id ? 'opacity-50' : ''}`}
                                        title="Copy Username"
                                        style={{ stroke: 'none', outline: 'none', padding: 0, margin: 0 }}
                                    >
                                        <img alt="Copy" className="block max-w-none size-full p-0 m-0" src={imgCopyIcon} style={{ stroke: 'none', padding: 0, margin: 0 }} />
                                    </button>
                                    <button
                                        onClick={() => window.open(`/u/${friend.username}`, '_blank')}
                                        className="relative shrink-0 size-[24px] hover:opacity-70 transition-opacity bg-transparent border-none p-0 m-0"
                                        title="Open Profile"
                                        style={{ stroke: 'none', outline: 'none', padding: 0, margin: 0 }}
                                    >
                                        <img alt="Open" className="block max-w-none size-full p-0 m-0" src={imgOpenIcon} style={{ stroke: 'none', padding: 0, margin: 0 }} />
                                    </button>
                                </div>
                            ))}
                            <div className="basis-0 bg-white grow min-h-px min-w-px shrink-0 w-full" />
                        </>
                    ) : (
                        <div className="flex items-center justify-center grow w-full text-gray-500 p-8">
                            No friends added yet. Search for users to add them!
                        </div>
                    )}
                </>
            )}

            <AddProfileModal
                isOpen={isAddModalOpen}
                onClose={closeAddModal}
                onAddProfile={handleAddProfile}
            />

            <EditProfileModal
                isOpen={!!editingProfile}
                onClose={closeEditModal}
                profile={editingProfile}
                onUpdate={handleUpdateProfile}
                onDelete={handleDeleteProfile}
            />

            <Toast
                message={toastMessage || ''}
                isVisible={!!toastMessage}
                onClose={() => setToastMessage(null)}
            />
        </div>
    );
};
