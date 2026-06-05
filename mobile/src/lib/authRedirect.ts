import * as Linking from 'expo-linking';

export const getPasswordResetRedirectUrl = (): string => {
    return Linking.createURL('reset-password');
};

export const isPasswordResetUrl = (url: string): boolean => {
    const parsed = Linking.parse(url);
    const path = parsed.path?.replace(/^\//, '') ?? '';
    return path === 'reset-password' || url.includes('reset-password');
};
