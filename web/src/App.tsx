import React, { useState, useEffect } from 'react';
import { Share2, Copy, ExternalLink, Plus, X, Edit2, Check } from 'lucide-react';

interface SocialProfile {
  id: string;
  platform: string;
  username: string;
  url: string;
  icon: string;
}

const popularPlatforms = [
  { name: 'Instagram', icon: '📷', urlPattern: 'https://instagram.com/' },
  { name: 'Telegram', icon: '✈️', urlPattern: 'https://t.me/' },
  { name: 'LinkedIn', icon: '💼', urlPattern: 'https://linkedin.com/in/' },
  { name: 'Twitter/X', icon: '🐦', urlPattern: 'https://twitter.com/' },
  { name: 'TikTok', icon: '🎵', urlPattern: 'https://tiktok.com/@' },
  { name: 'Facebook', icon: '👤', urlPattern: 'https://facebook.com/' },
  { name: 'GitHub', icon: '💻', urlPattern: 'https://github.com/' },
  { name: 'Behance', icon: '🎨', urlPattern: 'https://behance.net/' },
];

function App() {
  const [profiles, setProfiles] = useState<SocialProfile[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newProfile, setNewProfile] = useState({
    platform: '',
    username: '',
    url: '',
    icon: '🔗'
  });

  // Load profiles from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('socialProfiles');
    if (saved) {
      setProfiles(JSON.parse(saved));
    }
  }, []);

  // Save profiles to localStorage
  useEffect(() => {
    if (profiles.length > 0) {
      localStorage.setItem('socialProfiles', JSON.stringify(profiles));
    }
  }, [profiles]);

  const addProfile = () => {
    if (!newProfile.platform || !newProfile.username) return;

    const profile: SocialProfile = {
      id: Date.now().toString(),
      platform: newProfile.platform,
      username: newProfile.username,
      url: newProfile.url || `https://${newProfile.platform.toLowerCase()}.com/${newProfile.username}`,
      icon: newProfile.icon
    };

    setProfiles([...profiles, profile]);
    setNewProfile({ platform: '', username: '', url: '', icon: '🔗' });
    setIsAdding(false);
  };

  const deleteProfile = (id: string) => {
    setProfiles(profiles.filter(p => p.id !== id));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You can add a toast notification here
  };

  const selectPlatform = (platform: typeof popularPlatforms[0]) => {
    setNewProfile({
      ...newProfile,
      platform: platform.name,
      icon: platform.icon,
      url: platform.urlPattern
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🔗 uShare
          </h1>
          <p className="text-gray-600">Твій гаманець соціальних профілів</p>
        </div>

        {/* Profiles List */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          {profiles.length === 0 ? (
            <div className="text-center py-12">
              <Share2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">Ще немає профілів</p>
              <button
                onClick={() => setIsAdding(true)}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Додати перший профіль
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <span className="text-2xl">{profile.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{profile.platform}</h3>
                      <p className="text-sm text-gray-600">{profile.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => copyToClipboard(profile.url)}
                      className="p-2 hover:bg-white rounded-lg transition-colors"
                      title="Копіювати посилання"
                    >
                      <Copy className="h-5 w-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => window.open(profile.url, '_blank')}
                      className="p-2 hover:bg-white rounded-lg transition-colors"
                      title="Відкрити"
                    >
                      <ExternalLink className="h-5 w-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => deleteProfile(profile.id)}
                      className="p-2 hover:bg-white rounded-lg transition-colors"
                      title="Видалити"
                    >
                      <X className="h-5 w-5 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {profiles.length > 0 && !isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
            >
              <Plus className="inline h-5 w-5 mr-2" />
              Додати профіль
            </button>
          )}
        </div>

        {/* Add Profile Form */}
        {isAdding && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Додати профіль</h2>
            
            {/* Popular Platforms */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Популярні платформи
              </label>
              <div className="grid grid-cols-4 gap-2">
                {popularPlatforms.map((platform) => (
                  <button
                    key={platform.name}
                    onClick={() => selectPlatform(platform)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      newProfile.platform === platform.name
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{platform.icon}</div>
                    <div className="text-xs text-gray-600">{platform.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Platform Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Назва платформи
              </label>
              <input
                type="text"
                value={newProfile.platform}
                onChange={(e) => setNewProfile({ ...newProfile, platform: e.target.value })}
                placeholder="Instagram"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Username */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Нікнейм / Username
              </label>
              <input
                type="text"
                value={newProfile.username}
                onChange={(e) => setNewProfile({ ...newProfile, username: e.target.value })}
                placeholder="your.username"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* URL (optional) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Повне посилання (опціонально)
              </label>
              <input
                type="url"
                value={newProfile.url}
                onChange={(e) => setNewProfile({ ...newProfile, url: e.target.value })}
                placeholder="https://instagram.com/your.username"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={addProfile}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                <Check className="inline h-5 w-5 mr-2" />
                Додати
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewProfile({ platform: '', username: '', url: '', icon: '🔗' });
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Скасувати
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>Зроблено з ❤️ в Україні 🇺🇦</p>
        </div>
      </div>
    </div>
  );
}

export default App;