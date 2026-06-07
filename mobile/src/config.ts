import type { PlatformTemplate } from './types';

export const platformTemplates: PlatformTemplate[] = [
    {
        id: 'instagram',
        label: 'instagram.com',
        placeholder: 'your nickname',
        platformDisplay: 'Instagram',
        buildUrl: (username: string) => `https://www.instagram.com/${username}`,
        extractUsername: (url: string) => {
            const match = url.match(/(?:instagram\.com\/)([^/?#]+)/);
            return match ? match[1] : null;
        },
    },
    {
        id: 'twitter',
        label: 'x.com',
        placeholder: 'your nickname',
        platformDisplay: 'X',
        buildUrl: (username: string) => `https://x.com/${username.replace(/^@/, '')}`,
        extractUsername: (url: string) => {
            const match = url.match(/(?:x\.com\/|twitter\.com\/)([^/?#]+)/);
            return match ? match[1] : null;
        },
    },
    {
        id: 'linkedin',
        label: 'linkedin.com',
        placeholder: 'your nickname',
        platformDisplay: 'LinkedIn',
        buildUrl: (username: string) => `https://www.linkedin.com/in/${username}`,
        extractUsername: (url: string) => {
            const match = url.match(/(?:linkedin\.com\/in\/)([^/?#]+)/);
            return match ? match[1] : null;
        },
    },
    {
        id: 'youtube',
        label: 'youtube.com',
        placeholder: 'your nickname',
        platformDisplay: 'YouTube',
        buildUrl: (username: string) =>
            `https://www.youtube.com/${username.startsWith('@') ? username : '@' + username}`,
        extractUsername: (url: string) => {
            const match = url.match(/(?:youtube\.com\/)(@?[^/?#]+)/);
            return match ? match[1] : null;
        },
    },
    {
        id: 'behance',
        label: 'behance.net',
        placeholder: 'your nickname',
        platformDisplay: 'Behance',
        buildUrl: (username: string) => `https://www.behance.net/${username}`,
        extractUsername: (url: string) => {
            const match = url.match(/(?:behance\.net\/)([^/?#]+)/);
            return match ? match[1] : null;
        },
    },
    {
        id: 'dribbble',
        label: 'dribbble.com',
        placeholder: 'your nickname',
        platformDisplay: 'Dribbble',
        buildUrl: (username: string) => `https://dribbble.com/${username}`,
        extractUsername: (url: string) => {
            const match = url.match(/(?:dribbble\.com\/)([^/?#]+)/);
            return match ? match[1] : null;
        },
    },
    {
        id: 'custom',
        label: 'custom site',
        placeholder: 'My Website',
        platformDisplay: 'Custom Site',
        isCustom: true,
        buildUrl: (username: string) => `https://${username}`,
    },
];

export const getPlatformDisplayName = (platform: string): string => {
    const template = platformTemplates.find((t) => t.id === platform);
    if (template?.platformDisplay) return template.platformDisplay;

    const platformLower = platform.toLowerCase();
    if (platformLower.includes('instagram')) return 'Instagram';
    if (platformLower.includes('twitter') || platformLower === 'x') return 'X';
    if (platformLower.includes('linkedin')) return 'LinkedIn';
    if (platformLower.includes('youtube')) return 'YouTube';
    if (platformLower.includes('behance')) return 'Behance';
    if (platformLower.includes('dribbble')) return 'Dribbble';
    return platform;
};

export const getPublicProfileUrl = (username: string): string => {
    const baseUrl = process.env.EXPO_PUBLIC_WEB_APP_URL?.replace(/\/$/, '') || 'https://ushare.app';
    return `${baseUrl}/u/${username}`;
};
