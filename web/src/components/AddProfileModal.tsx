import React, { useState, useEffect } from 'react';
import type { SocialProfile } from '../types';
import { getIconUrlForPlatform, platformTemplates } from '../config';

interface AddProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddProfile: (profile: SocialProfile) => void;
}

export const AddProfileModal: React.FC<AddProfileModalProps> = ({ isOpen, onClose, onAddProfile }) => {
    const [platform, setPlatform] = useState(platformTemplates[0].id);
    const [username, setUsername] = useState('');
    const [url, setUrl] = useState('');

    useEffect(() => {
        const template = platformTemplates.find(t => t.id === platform);
        if (template && !template.isCustom) {
            setUrl(template.buildUrl(username));
        }
    }, [platform, username]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newProfile: SocialProfile = {
            id: Date.now().toString(),
            platform,
            username,
            url,
            iconUrl: getIconUrlForPlatform(platform)
        };
        onAddProfile(newProfile);
        onClose();
        // Reset form
        setPlatform(platformTemplates[0].id);
        setUsername('');
        setUrl('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Add Profile</h2>
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
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full border p-2 rounded"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-black text-white rounded">Add</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
