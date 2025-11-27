import { useState, useEffect } from 'react';

// Image assets from assets folder
import imgCopyIcon from "../assets/icons/imgCopyIcon.svg";
import imgOpenIcon from "../assets/icons/imgOpenIcon.svg";
import imgEditIcon from "../assets/icons/imgEditIcon.svg";
import imgFrame from "../assets/icons/imgAddIcon.svg";

import type { SocialProfile } from './types';
import { getIconUrlForPlatform } from './config';
import { AddProfileModal } from './components/AddProfileModal';
import { EditProfileModal } from './components/EditProfileModal';
import { Toast } from './components/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';

const AppContent = () => {
  const { currentUser, signOut } = useAuth();
  const [profiles, setProfiles] = useState<SocialProfile[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<SocialProfile | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ushare_profiles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Restore icons
        const profilesWithIcons = parsed.map((p: Omit<SocialProfile, 'iconUrl'>) => ({
          ...p,
          iconUrl: getIconUrlForPlatform(p.platform)
        }));
        setProfiles(profilesWithIcons);
      } catch (e) {
        console.error('Error loading profiles:', e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    const profilesWithoutIcons = profiles.map(({ iconUrl, ...rest }) => rest);
    localStorage.setItem('ushare_profiles', JSON.stringify(profilesWithoutIcons));
  }, [profiles]);

  const handleCopy = (username: string, id: string) => {
    navigator.clipboard.writeText(username);
    setCopiedId(id);
    setToastMessage('Username copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpen = (url: string) => {
    let targetUrl = url;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }
    window.open(targetUrl, '_blank');
  };

  const handleEdit = (id: string) => {
    const profile = profiles.find(p => p.id === id);
    if (profile) {
      setEditingProfile(profile);
    }
  };

  const handleUpdateProfile = (updatedProfile: SocialProfile) => {
    setProfiles(profiles.map(p => p.id === updatedProfile.id ? updatedProfile : p));
  };

  const handleDeleteProfile = (id: string) => {
    setProfiles(profiles.filter(p => p.id !== id));
  };

  const closeEditModal = () => {
    setEditingProfile(null);
  };

  const openAddModal = () => {
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleAddProfile = (newProfile: SocialProfile) => {
    setProfiles([...profiles, newProfile]);
  };

  if (!currentUser) {
    return <AuthScreen />;
  }

  return (
    <div className="bg-white content-stretch flex flex-col items-center relative size-full min-h-screen font-['Inter_Tight',sans-serif]">
      {/* Header */}
      <div className="bg-[#d9d9d9] box-border content-stretch flex flex-col gap-[112px] items-start p-[12px] relative shrink-0 text-black text-nowrap tracking-[-0.4512px] w-full whitespace-pre">
        <div className="w-full flex justify-between items-start">
          <div>
            <p className="font-['Inter_Tight',sans-serif] font-bold leading-[60px] relative shrink-0 text-[36px]">
              /
            </p>
            <p className="font-['Inter_Tight',sans-serif] font-medium leading-[36px] relative shrink-0 text-[32px]">
              {currentUser.username}
            </p>
          </div>
          <button onClick={signOut} className="text-sm underline opacity-50 hover:opacity-100">
            Sign Out
          </button>
        </div>
      </div>

      {/* Profile List */}
      {profiles.length > 0 && (
        <>
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="border-[0px_0px_1px] border-[rgba(0,0,0,0.2)] border-solid box-border content-stretch flex gap-[12px] items-center px-[12px] py-[24px] relative shrink-0 w-full"
            >
              <div className="overflow-clip relative shrink-0 size-[24px] bg-transparent">
                <img alt={profile.platform} className="block max-w-none size-full" src={profile.iconUrl} style={{ stroke: 'none' }} />
              </div>
              <p className="font-['Inter_Tight',sans-serif] font-normal leading-[40px] relative shrink-0 text-[24px] text-[rgba(0,0,0,0.2)] text-nowrap tracking-[-0.3008px] whitespace-pre">
                /
              </p>
              <p className="basis-0 font-['Inter_Tight',sans-serif] font-medium grow leading-[18px] min-h-px min-w-px relative shrink-0 text-[18px] text-black tracking-[-0.3008px]">
                {profile.username}
              </p>
              <button
                onClick={() => handleCopy(profile.username, profile.id)}
                className={`relative shrink-0 size-[24px] hover:opacity-70 transition-opacity bg-transparent border-none p-0 m-0 ${copiedId === profile.id ? 'opacity-50' : ''}`}
                title="Копіювати нікнейм"
                style={{ stroke: 'none', outline: 'none', padding: 0, margin: 0 }}
              >
                <img alt="Copy" className="block max-w-none size-full p-0 m-0" src={imgCopyIcon} style={{ stroke: 'none', padding: 0, margin: 0 }} />
              </button>
              <button
                onClick={() => handleOpen(profile.url)}
                className="relative shrink-0 size-[24px] hover:opacity-70 transition-opacity bg-transparent border-none p-0 m-0"
                title="Відкрити профіль"
                style={{ stroke: 'none', outline: 'none', padding: 0, margin: 0 }}
              >
                <img alt="Open" className="block max-w-none size-full p-0 m-0" src={imgOpenIcon} style={{ stroke: 'none', padding: 0, margin: 0 }} />
              </button>
              <button
                onClick={() => handleEdit(profile.id)}
                className="relative shrink-0 size-[24px] hover:opacity-70 transition-opacity bg-transparent border-none p-0 m-0"
                title="Редагувати"
                style={{ stroke: 'none', outline: 'none', padding: 0, margin: 0 }}
              >
                <img alt="Edit" className="block max-w-none size-full p-0 m-0" src={imgEditIcon} style={{ stroke: 'none', padding: 0, margin: 0 }} />
              </button>
            </div>
          ))}
          <div className="basis-0 bg-white grow min-h-px min-w-px shrink-0 w-full" />
        </>
      )}

      {/* Add Button */}
      <div className="box-border content-stretch flex flex-col items-start p-[12px] relative shrink-0 w-full">
        <button
          onClick={openAddModal}
          className="bg-[#d9d9d9] box-border content-stretch flex gap-[10px] h-[48px] items-center justify-center p-[10px] relative shrink-0 w-full hover:opacity-90 transition-opacity"
        >
          <div className="relative shrink-0 size-[24px] bg-transparent">
            <img alt="Add" className="block max-w-none size-full" src={imgFrame} style={{ stroke: 'none' }} />
          </div>
          <p className="font-['Inter_Tight',sans-serif] font-medium leading-[18px] relative shrink-0 text-[18px] text-black text-nowrap tracking-[-0.3008px] whitespace-pre">
            Додати профіль
          </p>
        </button>
      </div>

      <AddProfileModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        onAddProfile={handleAddProfile}
      />

      <EditProfileModal
        isOpen={!!editingProfile}
        onClose={closeEditModal}
        profile={editingProfile}
        onUpdate={handleUpdateProfile}
        onDelete={handleDeleteProfile}
      />

      <Toast
        message={toastMessage || ''}
        isVisible={!!toastMessage}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;