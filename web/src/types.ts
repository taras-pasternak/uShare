export interface SocialProfile {
    id: string;
    folderId?: string; // Optional for backward compatibility/during transition
    platform: string;
    username: string;
    url: string;
    iconUrl: string;
}

export interface Folder {
    id: string;
    name: string;
    color?: string;
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
    name?: string;
    username: string;
    email: string;
    password?: string;
}
