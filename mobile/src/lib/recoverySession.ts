import { isPasswordResetUrl } from './authRedirect';
import { supabase } from './supabase';

const getParamsFromUrl = (url: string): Record<string, string> => {
    const hashIndex = url.indexOf('#');
    const queryIndex = url.indexOf('?');

    let paramString = '';
    if (hashIndex !== -1) {
        paramString = url.substring(hashIndex + 1);
    } else if (queryIndex !== -1) {
        paramString = url.substring(queryIndex + 1);
    }

    if (!paramString) return {};

    return Object.fromEntries(new URLSearchParams(paramString));
};

export const createSessionFromResetUrl = async (url: string): Promise<boolean> => {
    if (!isPasswordResetUrl(url)) return false;

    const params = getParamsFromUrl(url);
    const access_token = params.access_token;
    const refresh_token = params.refresh_token;

    if (!access_token || !refresh_token) return false;

    const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
    });

    return !error;
};
