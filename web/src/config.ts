import imgInstagram from "../assets/social apps icons/imgInstagramIcon.svg";
import imgTwitter from "../assets/social apps icons/imgTwitterIcon.svg";
import imgLinkedIn from "../assets/social apps icons/imgLinkedInIcon.svg";
import imgYoutube from "../assets/social apps icons/imgYoutubeIcon.svg";
import imgAddLink from "../assets/icons/imgAddIcon.svg";
import type { PlatformTemplate } from "./types";

export const getIconUrlForPlatform = (platform: string): string => {
    const platformLower = platform.toLowerCase();
    if (platformLower.includes('instagram')) return imgInstagram;
    if (platformLower.includes('twitter') || platformLower === 'x') return imgTwitter;
    if (platformLower.includes('linkedin')) return imgLinkedIn;
    if (platformLower.includes('youtube')) return imgYoutube;
    return imgInstagram; // default
};

export const platformTemplates: PlatformTemplate[] = [
    {
        id: 'instagram',
        label: 'instagram.com',
        icon: imgInstagram,
        placeholder: 'your nickname',
        platformDisplay: 'Instagram',
        buildUrl: (username: string) => `https://www.instagram.com/${username}`
    },
    {
        id: 'twitter',
        label: 'x.com',
        icon: imgTwitter,
        placeholder: 'your nickname',
        platformDisplay: 'X',
        buildUrl: (username: string) => `https://x.com/${username.replace(/^@/, '')}`
    },
    {
        id: 'linkedin',
        label: 'linkedin.com',
        icon: imgLinkedIn,
        placeholder: 'your nickname',
        platformDisplay: 'LinkedIn',
        buildUrl: (username: string) => `https://www.linkedin.com/in/${username}`
    },
    {
        id: 'youtube',
        label: 'youtube.com',
        icon: imgYoutube,
        placeholder: 'your nickname',
        platformDisplay: 'YouTube',
        buildUrl: (username: string) => `https://www.youtube.com/${username.startsWith('@') ? username : '@' + username}`
    },
    {
        id: 'custom',
        label: 'custom site',
        icon: imgAddLink,
        placeholder: 'your nickname',
        platformDisplay: 'Custom Site',
        isCustom: true,
        buildUrl: (username: string) => `https://${username}`
    }
];
