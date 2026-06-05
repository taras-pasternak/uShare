export const getPasswordResetRedirectUrl = (): string => {
    const base =
        import.meta.env.VITE_APP_URL?.replace(/\/$/, '') || window.location.origin;
    return `${base}/reset-password`;
};
