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
    extractUsername?: (url: string) => string | null;
    platformDisplay?: string;
    isCustom?: boolean;
}

export interface User {
    id?: string;
    username: string;
    email: string;
    password?: string;
}
