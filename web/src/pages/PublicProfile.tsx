import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { SocialProfile } from '../types';
import { supabase } from '../lib/supabase';
import { getIconUrlForPlatform } from '../config';
import { useAuth } from '../context/AuthContext';
import imgCopyIcon from "../../assets/icons/imgCopyIcon.svg";
import imgOpenIcon from "../../assets/icons/imgOpenIcon.svg";
import imgAddIcon from "../../assets/icons/imgAddIcon.svg";
import { Toast } from '../components/Toast';

export const PublicProfile = () => {
    const { username } = useParams<{ username: string }>();
    const { currentUser } = useAuth();
    const [profiles, setProfiles] = useState<SocialProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isFriend, setIsFriend] = useState(false);
    const [friendshipLoading, setFriendshipLoading] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!username) return;

            setLoading(true);
            setError(null);

            try {
                // 1. Get user ID from username
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('username', username)
                    .single();

                if (profileError || !profileData) {
                    throw new Error('User not found');
                }

                // Check friendship status if logged in
                if (currentUser && currentUser.id !== profileData.id) {
                    const { data: friendData } = await supabase
                        .from('friends')
                        .select('*')
                        .eq('user_id', currentUser.id)
                        .eq('friend_id', profileData.id)
                        .single();

                    setIsFriend(!!friendData);
                }

                // 2. Get social links
                const { data: linksData, error: linksError } = await supabase
                    .from('social_links')
                    .select('*')
                    .eq('user_id', profileData.id)
                    .order('created_at', { ascending: true });

                if (linksError) {
                    throw linksError;
                }

                if (linksData) {
                    const profilesWithIcons = linksData.map((p: any) => ({
                        ...p,
                        iconUrl: getIconUrlForPlatform(p.platform)
                    }));
                    setProfiles(profilesWithIcons);
                }
            } catch (err: any) {
                console.error('Error fetching public profile:', err);
                setError(err.message || 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [username, currentUser]);

    const handleAddFriend = async () => {
        if (!currentUser || !username) return;

        setFriendshipLoading(true);
        try {
            // Get profile ID again (could optimize by storing it in state)
            const { data: profileData } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', username)
                .single();

            if (!profileData) throw new Error('User not found');

            if (isFriend) {
                // Remove friend
                const { error } = await supabase
                    .from('friends')
                    .delete()
                    .eq('user_id', currentUser.id)
                    .eq('friend_id', profileData.id);

                if (error) throw error;
                setIsFriend(false);
                setToastMessage('Removed from friends');
            } else {
                // Add friend
                const { error } = await supabase
                    .from('friends')
                    .insert({
                        user_id: currentUser.id,
                        friend_id: profileData.id
                    });

                if (error) throw error;
                setIsFriend(true);
                setToastMessage('Added to friends');
            }
        } catch (error) {
            console.error('Error updating friend status:', error);
            setToastMessage('Error updating friend status');
        } finally {
            setFriendshipLoading(false);
        }
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setToastMessage('Copied!');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleOpen = (url: string) => {
        let targetUrl = url;
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = `https://${targetUrl}`;
        }
        window.open(targetUrl, '_blank');
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (error) {
        return <div className="flex items-center justify-center min-h-screen text-red-500">{error}</div>;
    }

    return (
        <div className="bg-white content-stretch flex flex-col items-center relative size-full min-h-screen font-['Inter_Tight',sans-serif]">
            {/* Header */}
            <div className="bg-[#d9d9d9] box-border content-stretch flex flex-col gap-[112px] items-start p-[12px] relative shrink-0 text-black text-nowrap tracking-[-0.4512px] w-full whitespace-pre">
                <div className="w-full flex justify-between items-start">
                    <div>
                        <Link to="/" className="font-['Inter_Tight',sans-serif] font-bold leading-[60px] relative shrink-0 text-[36px] hover:opacity-70 transition-opacity text-black no-underline">
                            /
                        </Link>
                        <p className="font-['Inter_Tight',sans-serif] font-medium leading-[36px] relative shrink-0 text-[32px]">
                            {username}
                        </p>
                    </div>

                    {currentUser && currentUser.username !== username && (
                        <div className="self-end">
                            <button
                                onClick={handleAddFriend}
                                disabled={friendshipLoading}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${isFriend
                                    ? 'bg-black text-white hover:bg-black/80'
                                    : 'bg-white text-black hover:bg-white/80'
                                    }`}
                            >
                                {isFriend ? (
                                    <span>Saved</span>
                                ) : (
                                    <>
                                        <img src={imgAddIcon} alt="Add" width={20} height={20} />
                                        <span>Add to friends</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Profile List */}
            {
                profiles.length > 0 ? (
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
                                    title="Copy"
                                    style={{ stroke: 'none', outline: 'none', padding: 0, margin: 0 }}
                                >
                                    <img alt="Copy" className="block max-w-none size-full p-0 m-0" src={imgCopyIcon} style={{ stroke: 'none', padding: 0, margin: 0 }} />
                                </button>
                                <button
                                    onClick={() => handleOpen(profile.url)}
                                    className="relative shrink-0 size-[24px] hover:opacity-70 transition-opacity bg-transparent border-none p-0 m-0"
                                    title="Open"
                                    style={{ stroke: 'none', outline: 'none', padding: 0, margin: 0 }}
                                >
                                    <img alt="Open" className="block max-w-none size-full p-0 m-0" src={imgOpenIcon} style={{ stroke: 'none', padding: 0, margin: 0 }} />
                                </button>
                            </div>
                        ))}
                        <div className="basis-0 bg-white grow min-h-px min-w-px shrink-0 w-full" />
                    </>
                ) : (
                    <div className="flex items-center justify-center grow w-full text-gray-500">
                        No profiles found.
                    </div>
                )
            }

            <Toast
                message={toastMessage || ''}
                isVisible={!!toastMessage}
                onClose={() => setToastMessage(null)}
            />
        </div >
    );
};
