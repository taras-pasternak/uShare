import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FontAwesome, Feather } from '@expo/vector-icons';
import type { SocialProfile } from '../types';

interface ProfileCardProps {
    item: SocialProfile;
    onCopy: (url: string) => void;
    onOpen: (url: string) => void;
    onEditPress: (item: SocialProfile) => void;
}

const getPlatformIcon = (platform: string) => {
    const platformLower = platform.toLowerCase();
    switch (platformLower) {
        case 'instagram':
            return <FontAwesome name="instagram" size={24} color="#000" />;
        case 'twitter':
        case 'x':
            return <FontAwesome name="twitter" size={24} color="#000" />;
        case 'linkedin':
            return <FontAwesome name="linkedin" size={24} color="#000" />;
        case 'youtube':
            return <FontAwesome name="youtube-play" size={24} color="#000" />;
        case 'behance':
            return <FontAwesome name="behance" size={24} color="#000" />;
        case 'dribbble':
            return <FontAwesome name="dribbble" size={24} color="#000" />;
        default:
            return <FontAwesome name="globe" size={24} color="#000" />;
    }
};

export const ProfileCard = ({ item, onCopy, onOpen, onEditPress }: ProfileCardProps) => {
    const isCustom = item.platform === 'custom';
    const displayName = item.username;
    const cleanedUrl = isCustom ? item.url.replace(/^(https?:\/\/)?(www\.)?/i, '') : '';

    return (
        <View style={styles.profileCard}>
            <Pressable style={styles.profileInfo} onPress={() => onEditPress(item)}>
                <View style={styles.iconContainer}>
                    {getPlatformIcon(item.platform)}
                </View>
                <Text style={styles.slash}>/</Text>
                <View style={styles.textContainer}>
                    <Text style={styles.displayName}>{displayName}</Text>
                    {isCustom && <Text style={styles.subtitle}>{cleanedUrl}</Text>}
                </View>
            </Pressable>
            <View style={styles.profileActions}>
                <Pressable style={styles.actionIconButton} onPress={() => onCopy(item.url)}>
                    <Feather name="copy" size={20} color="#000" />
                </Pressable>
                <Pressable style={styles.actionIconButton} onPress={() => onOpen(item.url)}>
                    <Feather name="external-link" size={20} color="#000" />
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 20,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
        backgroundColor: '#fff',
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    iconContainer: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    slash: {
        fontSize: 24,
        fontWeight: '300',
        color: 'rgba(0,0,0,0.2)',
        marginHorizontal: 12,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    displayName: {
        fontSize: 18,
        fontWeight: '500',
        color: '#000',
    },
    subtitle: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    profileActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionIconButton: {
        padding: 6,
    },
});
