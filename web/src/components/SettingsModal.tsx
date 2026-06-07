import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { X, User, Key, LogOut, Check, Loader2 } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { currentUser, signOut, requestPasswordReset } = useAuth();
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [saving, setSaving] = useState(false);
    const [sendingReset, setSendingReset] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && currentUser) {
            setName(currentUser.name || '');
            setUsername(currentUser.username || '');
            setError(null);
            setSuccess(null);
        }
    }, [isOpen, currentUser]);

    if (!isOpen || !currentUser) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        const cleanUsername = username.trim().toLowerCase();
        const cleanName = name.trim();

        if (!cleanUsername) {
            setError('Нікнейм не може бути порожнім');
            return;
        }

        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(cleanUsername)) {
            setError('Нікнейм може містити лише латинські літери, цифри та символ підкреслення');
            return;
        }

        setSaving(true);
        try {
            // 1. If username changed, update public.profiles
            if (cleanUsername !== currentUser.username) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({ username: cleanUsername })
                    .eq('id', currentUser.id);

                if (profileError) {
                    if (profileError.code === '23505') {
                        setError('Цей нікнейм вже зайнятий. Будь ласка, оберіть інший.');
                    } else {
                        setError(`Не вдалося оновити нікнейм: ${profileError.message}`);
                    }
                    setSaving(false);
                    return;
                }
            }

            // 2. Update auth user metadata
            const { error: authError } = await supabase.auth.updateUser({
                data: {
                    name: cleanName,
                    username: cleanUsername
                }
            });

            if (authError) {
                setError(`Не вдалося оновити дані: ${authError.message}`);
                setSaving(false);
                return;
            }

            setSuccess('Профіль успішно оновлено!');
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (err: any) {
            setError(err.message || 'Сталася помилка при збереженні');
        } finally {
            setSaving(false);
        }
    };

    const handleResetPassword = async () => {
        if (!currentUser.email) return;
        setError(null);
        setSuccess(null);
        setSendingReset(true);
        try {
            const res = await requestPasswordReset(currentUser.email);
            if (res.success) {
                setSuccess('Посилання для зміни паролю надіслано на вашу пошту.');
            } else {
                setError(res.error || 'Не вдалося надіслати лист');
            }
        } catch (err: any) {
            setError(err.message || 'Сталася помилка при надсиланні листа');
        } finally {
            setSendingReset(false);
        }
    };

    const handleSignOut = async () => {
        if (confirm('Ви впевнені, що хочете вийти з акаунту?')) {
            onClose();
            await signOut();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden border border-black/10 shadow-2xl flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="font-['Inter_Tight',sans-serif] text-xl font-bold tracking-tight text-gray-900">
                        Налаштування
                    </h2>
                    <button 
                        onClick={onClose} 
                        className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm border border-green-100 flex items-center gap-2">
                            <Check className="size-4" />
                            {success}
                        </div>
                    )}

                    {/* Personal Info */}
                    <form onSubmit={handleSave} className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                            Особиста інформація
                        </h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ім'я</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ваше ім'я"
                                    className="w-full border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none p-2.5 pl-10 rounded-xl transition-all text-sm"
                                />
                                <User className="size-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Нікнейм</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="nickname"
                                    className="w-full border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none p-2.5 pl-10 rounded-xl transition-all text-sm"
                                    required
                                />
                                <span className="text-sm font-semibold text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 font-mono">/</span>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-2.5 bg-black hover:bg-gray-800 text-white rounded-xl font-semibold transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    <span>Збереження...</span>
                                </>
                            ) : (
                                <span>Зберегти зміни</span>
                            )}
                        </button>
                    </form>

                    <div className="border-t border-gray-100" />

                    {/* Security */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                            Безпека
                        </h3>
                        <button
                            type="button"
                            onClick={handleResetPassword}
                            disabled={sendingReset}
                            className="w-full py-2.5 border border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl font-semibold transition-all text-sm flex items-center justify-center gap-2 cursor-pointer bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            {sendingReset ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    <span>Надсилання...</span>
                                </>
                            ) : (
                                <>
                                    <Key className="size-4" />
                                    <span>Скинути пароль</span>
                                </>
                            )}
                        </button>
                    </div>

                    <div className="border-t border-gray-100" />

                    {/* Logout */}
                    <div>
                        <button
                            type="button"
                            onClick={handleSignOut}
                            className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-semibold transition-all text-sm flex items-center justify-center gap-2 cursor-pointer border border-red-100"
                        >
                            <LogOut className="size-4" />
                            <span>Вийти з акаунту</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
