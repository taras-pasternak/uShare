export interface SocialProfile {
    id: string;
    platform: string;
    username: string;
    url: string;
    iconUrl: string;
}

export interface PlatformTemplate {
    id: string;
    label: string;
    icon: string;
    placeholder?: string;
    buildUrl: (username: string) => string;
    platformDisplay?: string;
    isCustom?: boolean;
}
