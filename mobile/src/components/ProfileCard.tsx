import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getPlatformDisplayName } from '../config';
import type { SocialProfile } from '../types';

interface ProfileCardProps {
    item: SocialProfile;
    onCopy: (url: string) => void;
    onOpen: (url: string) => void;
    onEditPress: (item: SocialProfile) => void;
}

export const ProfileCard = ({ item, onCopy, onOpen, onEditPress }: ProfileCardProps) => {
    return (
        <View style={styles.profileCard}>
            <Pressable style={styles.profileInfo} onPress={() => onEditPress(item)}>
                <Text style={styles.platformName}>{getPlatformDisplayName(item.platform)}</Text>
                <Text style={styles.username}>@{item.username}</Text>
            </Pressable>
            <View style={styles.profileActions}>
                <Pressable style={styles.actionButton} onPress={() => onCopy(item.url)}>
                    <Text style={styles.actionText}>Copy</Text>
                </Pressable>
                <Pressable style={styles.actionButton} onPress={() => onOpen(item.url)}>
                    <Text style={styles.actionText}>Open</Text>
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    profileCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#eee',
    },
    profileInfo: {
        marginBottom: 12,
    },
    platformName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    username: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    profileActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
    },
    actionText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
    },
});
