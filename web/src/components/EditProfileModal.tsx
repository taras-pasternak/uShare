import React, { useState, useEffect } from 'react';
import type { SocialProfile } from '../types';
import { getIconUrlForPlatform, platformTemplates } from '../config';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: SocialProfile | null;
    onUpdate: (updatedProfile: SocialProfile) => void;
    onDelete: (id: string) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, profile, onUpdate, onDelete }) => {
    const [platform, setPlatform] = useState('');
    const [username, setUsername] = useState('');
    const [url, setUrl] = useState('');

    useEffect(() => {
        if (profile) {
            setPlatform(profile.platform);
            setUsername(profile.username);
            setUrl(profile.url);
        }
    }, [profile]);

    useEffect(() => {
        const template = platformTemplates.find(t => t.id === platform);
        if (template && !template.isCustom) {
            setUrl(template.buildUrl(username));
        }
    }, [platform, username]);

    if (!isOpen || !profile) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const updatedProfile: SocialProfile = {
            ...profile,
            platform,
            username,
            url,
            iconUrl: getIconUrlForPlatform(platform)
        };
        onUpdate(updatedProfile);
        onClose();
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this profile?')) {
            onDelete(profile.id);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Platform</label>
                        <select
                            value={platform}
                            onChange={(e) => setPlatform(e.target.value)}
                            className="w-full border p-2 rounded"
                        >
                            {platformTemplates.map(t => (
                                <option key={t.id} value={t.id}>{t.platformDisplay}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full border p-2 rounded"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">URL</label>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => {
                                const newUrl = e.target.value;
                                setUrl(newUrl);
                                const template = platformTemplates.find(t => t.id === platform);
                                if (template?.extractUsername) {
                                    const extracted = template.extractUsername(newUrl);
                                    if (extracted) {
                                        setUsername(extracted);
                                    }
                                }
                            }}
                            className="w-full border p-2 rounded"
                            required
                        />
                    </div>
                    <div className="flex justify-between mt-4">
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                            Delete Profile
                        </button>
                        <div className="flex gap-2">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-black text-white rounded">Save</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
