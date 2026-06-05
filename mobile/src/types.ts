export interface SocialProfile {
    id: string;
    folderId?: string;
    platform: string;
    username: string;
    url: string;
}

export interface PlatformTemplate {
    id: string;
    label: string;
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
