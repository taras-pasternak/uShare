import { useState, useEffect } from 'react';

// Image assets from assets folder
import imgInstagram from "../../assets/social apps icons/imgInstagramIcon.svg";
import imgCopyIcon from "../../assets/icons/imgCopyIcon.svg";
import imgOpenIcon from "../../assets/icons/imgOpenIcon.svg";
import imgEditIcon from "../../assets/icons/imgEditIcon.svg";
import imgTwitter from "../../assets/social apps icons/imgTwitterIcon.svg";
import imgLinkedIn from "../../assets/social apps icons/imgLinkedInIcon.svg";
import imgYoutube from "../../assets/social apps icons/imgYoutubeIcon.svg";
import imgFrame from "../../assets/icons/imgAddIcon.svg";
import imgAddLink from "../../assets/icons/imgAddIcon.svg";
import imgCloseIcon from "../../assets/icons/imgCloseIcon.svg";

interface SocialProfile {
  id: string;
  platform: string;
  username: string;
  url: string;
  iconUrl: string;
}

interface PlatformTemplate {
  id: string;
  label: string;
  icon: string;
  placeholder?: string;
  buildUrl: (username: string) => string;
  platformDisplay?: string;
  isCustom?: boolean;
}

const getIconUrlForPlatform = (platform: string): string => {
  const platformLower = platform.toLowerCase();
  if (platformLower.includes('instagram')) return imgInstagram;
  if (platformLower.includes('twitter') || platformLower === 'x') return imgTwitter;
  if (platformLower.includes('linkedin')) return imgLinkedIn;
  if (platformLower.includes('youtube')) return imgYoutube;
  return imgInstagram; // default
};

const platformTemplates: PlatformTemplate[] = [
  {
    id: 'instagram',
    label: 'instagram.com',
    icon: imgInstagram,
    placeholder: 'your nickname',
    platformDisplay: 'Instagram',
    buildUrl: (username: string) => `https://instagram.com/${username}`
  },
  {
    id: 'twitter',
    label: 'x.com',
    icon: imgTwitter,
    placeholder: 'your nickname',
    platformDisplay: 'X',
    buildUrl: (username: string) => `https://twitter.com/${username}`
  },
  {
    id: 'linkedin',
    label: 'linkedin.com',
    icon: imgLinkedIn,
    placeholder: 'your nickname',
    platformDisplay: 'LinkedIn',
    buildUrl: (username: string) => `https://linkedin.com/in/${username}`
  },
  {
    id: 'youtube',
    label: 'youtube.com',
    icon: imgYoutube,
    placeholder: 'your nickname',
    platformDisplay: 'YouTube',
    buildUrl: (username: string) => `https://youtube.com/@${username}`
  },
  {
    id: 'custom',
    label: 'custom site',
    icon: imgAddLink,
    placeholder: 'your nickname',
    platformDisplay: 'Custom Site',
    isCustom: true,
    buildUrl: (username: string) => `https://${username}`
  }
];

const App = () => {
  const [profiles, setProfiles] = useState<SocialProfile[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [nicknameInput, setNicknameInput] = useState('');
  const [fullLinkInput, setFullLinkInput] = useState('');
  const [fullLinkTouched, setFullLinkTouched] = useState(false);

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
    if (profiles.length > 0) {
      const profilesWithoutIcons = profiles.map(({ iconUrl, ...rest }) => rest);
      localStorage.setItem('ushare_profiles', JSON.stringify(profilesWithoutIcons));
    }
  }, [profiles]);

  const handleCopy = (username: string, id: string) => {
    navigator.clipboard.writeText(username);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpen = (url: string) => {
    window.open(url, '_blank');
  };

  const handleEdit = (id: string) => {
    const profile = profiles.find(p => p.id === id);
    if (!profile) return;
    
    const platform = prompt('Назва платформи:', profile.platform) || profile.platform;
    const username = prompt('Нікнейм / Username:', profile.username) || profile.username;
    const url = prompt('URL:', profile.url) || profile.url;
    
    setProfiles(profiles.map(p => 
      p.id === id 
        ? { ...p, platform, username, url, iconUrl: getIconUrlForPlatform(platform) }
        : p
    ));
  };

  const normalizeUrl = (value: string) => {
    if (!value) return '';
    return /^https?:\/\//i.test(value) ? value : `https://${value.replace(/^https?:\/\//i, '')}`;
  };

  const deriveUsernameFromUrl = (url: string) => {
    try {
      const parsed = new URL(normalizeUrl(url));
      const path = parsed.pathname.replace(/^\/+/, '');
      return path || parsed.hostname;
    } catch {
      return url;
    }
  };

  const resetModalState = () => {
    setSelectedTemplateId(null);
    setNicknameInput('');
    setFullLinkInput('');
    setFullLinkTouched(false);
  };

  const openAddModal = () => {
    setIsAddModalOpen(true);
    resetModalState();
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    resetModalState();
  };

  const handleTemplateSelect = (templateId: string) => {
    if (selectedTemplateId === templateId) {
      setSelectedTemplateId(null);
      setNicknameInput('');
      setFullLinkInput('');
      setFullLinkTouched(false);
      return;
    }
    const template = platformTemplates.find((tpl) => tpl.id === templateId);
    if (!template) return;

    setSelectedTemplateId(templateId);
    setNicknameInput('');
    setFullLinkInput(template.isCustom ? '' : template.buildUrl(''));
    setFullLinkTouched(false);
  };

  const handleNicknameChange = (value: string) => {
    setNicknameInput(value);
    const template = platformTemplates.find((tpl) => tpl.id === selectedTemplateId);
    if (!template) return;
    if (template.isCustom || fullLinkTouched) {
      return;
    }
    const nextLink = value ? template.buildUrl(value) : '';
    setFullLinkInput(nextLink);
  };

  const handleFullLinkChange = (value: string) => {
    setFullLinkInput(value);
    setFullLinkTouched(true);
  };

  const handleSubmitProfile = () => {
    if (!selectedTemplateId) return;
    const template = platformTemplates.find((tpl) => tpl.id === selectedTemplateId);
    if (!template) return;

    const nickname = template.isCustom ? nicknameInput.trim() : nicknameInput.trim();
    const link = fullLinkInput.trim();

    if (!template.isCustom && !nickname) return;
    if (!link) return;

    const platformName = template.isCustom
      ? template.platformDisplay || template.label
      : template.platformDisplay || template.label;

    const normalizedLink = normalizeUrl(link);

    const username = template.isCustom
      ? deriveUsernameFromUrl(normalizedLink)
      : nickname;

    const newProfile: SocialProfile = {
      id: Date.now().toString(),
      platform: platformName,
      username,
      url: normalizedLink,
      iconUrl: template.icon || getIconUrlForPlatform(platformName)
    };

    setProfiles([...profiles, newProfile]);
    closeAddModal();
  };

  const currentTemplate = selectedTemplateId
    ? platformTemplates.find((tpl) => tpl.id === selectedTemplateId)
    : null;

  const isSubmitDisabled =
    !currentTemplate ||
    !fullLinkInput.trim() ||
    (!currentTemplate.isCustom && !nicknameInput.trim());

  const fullLinkPreview = fullLinkInput ? normalizeUrl(fullLinkInput.trim()) : '';

  return (
    <div className="bg-white content-stretch flex flex-col items-center relative size-full min-h-screen font-['Inter_Tight',sans-serif]">
      {/* Header */}
      <div className="bg-[#d9d9d9] box-border content-stretch flex flex-col gap-[112px] items-start p-[12px] relative shrink-0 text-black text-nowrap tracking-[-0.4512px] w-full whitespace-pre">
        <p className="font-['Inter_Tight',sans-serif] font-bold leading-[60px] relative shrink-0 text-[36px]">
          /
        </p>
        <p className="font-['Inter_Tight',sans-serif] font-medium leading-[36px] relative shrink-0 text-[32px]">
          taras.pasternak
        </p>
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

      {/* Add Profile Modal */}
      <div
        className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-200 ease-out ${
          isAddModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          opacity: isAddModalOpen ? 1 : 0,
          pointerEvents: isAddModalOpen ? 'auto' : 'none',
        }}
        aria-hidden={!isAddModalOpen}
      >
        <div
          className="absolute inset-0 z-0 bg-[rgba(0,0,0,0.5)] pointer-events-auto"
          onClick={closeAddModal}
          aria-hidden="true"
        />
        <div
          className={`relative z-10 ml-auto h-screen w-full max-w-[400px] shadow-[-12px_0_32px_rgba(0,0,0,0.25)] transition-transform duration-300 ease-out ${
            isAddModalOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white content-stretch flex h-full flex-col overflow-hidden">
            <div className="box-border content-stretch flex items-center justify-center px-[12px] py-[24px] border-b border-[#f0f0f0]">
              <p className="font-['Inter_Tight',sans-serif] font-bold uppercase tracking-[2px] text-[16px] leading-[24px] text-[#434343] text-center">
                ADD PROFILE
              </p>
            </div>
            <div className="flex flex-col border-b border-[#cccccc]">
              {platformTemplates.map((template) => {
                const isSelected = selectedTemplateId === template.id;
                return (
                  <div key={template.id} className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => handleTemplateSelect(template.id)}
                      className={`box-border flex items-center gap-[12px] px-[16px] py-[24px] text-left border-b border-[#cccccc] last:border-b-0 ${
                        isSelected ? 'bg-[#f7f7f7]' : 'bg-white'
                      }`}
                    >
                      <div className="overflow-clip relative shrink-0 size-[24px]">
                        <img
                          alt={template.platformDisplay || template.label}
                          className="block max-w-none size-full"
                          src={template.icon}
                        />
                      </div>
                      <p className="font-['Inter_Tight',sans-serif] font-medium text-[18px] leading-[24px] text-black text-nowrap">
                        {template.label}
                      </p>
                      <p className="font-['Inter_Tight',sans-serif] font-medium text-[18px] leading-[24px] text-[#cccccc]">
                        /
                      </p>
                      <p className="basis-0 font-['Inter_Tight',sans-serif] font-medium grow text-[18px] leading-[24px] text-[#cccccc] text-right">
                        {template.placeholder || 'username'}
                      </p>
                      <div className="relative shrink-0 size-[24px]">
                        <img
                          alt={isSelected ? 'Minus' : 'Add'}
                          className={`block max-w-none size-full transition-transform ${
                            isSelected ? 'rotate-45 scale-90' : ''
                          }`}
                          src={imgFrame}
                        />
                      </div>
                    </button>
                    {isSelected && (
                      <div className="flex flex-col gap-[16px] px-[16px] pb-[24px] pt-[12px] bg-[#fafafa] border-b border-[#cccccc]">
                        {!template.isCustom && (
                          <label className="flex flex-col gap-[8px] text-[14px] uppercase tracking-[1px] text-[#434343]">
                            <span>Нікнейм</span>
                            <input
                              value={nicknameInput}
                              onChange={(e) => handleNicknameChange(e.target.value)}
                              placeholder="your nickname"
                              className="border border-[#dcdcdc] rounded-[4px] px-[12px] py-[10px] text-[16px] text-black focus:border-black outline-none transition-colors"
                            />
                          </label>
                        )}
                        <label className="flex flex-col gap-[8px] text-[14px] uppercase tracking-[1px] text-[#434343]">
                          <span>Full link</span>
                          <div className="flex items-center gap-[8px]">
                            <input
                              value={fullLinkInput}
                              onChange={(e) => handleFullLinkChange(e.target.value)}
                              placeholder={
                                template.isCustom ? 'https://your-site.com/username' : template.buildUrl('username')
                              }
                              className="border border-[#dcdcdc] rounded-[4px] px-[12px] py-[10px] text-[16px] text-black focus:border-black outline-none transition-colors flex-1"
                            />
                            {fullLinkPreview && (
                              <a
                                href={fullLinkPreview}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[14px] text-[#1a73e8] underline-offset-2 hover:underline"
                              >
                                Відкрити
                              </a>
                            )}
                          </div>
                        </label>
                        <button
                          type="button"
                          onClick={handleSubmitProfile}
                          disabled={isSubmitDisabled}
                          className={`h-[48px] rounded-[6px] text-[16px] font-medium uppercase tracking-[2px] ${
                            isSubmitDisabled
                              ? 'bg-[#e0e0e0] text-[#9e9e9e] cursor-not-allowed'
                              : 'bg-black text-white hover:opacity-90'
                          }`}
                        >
                          Додати
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              onClick={closeAddModal}
              className="bg-[#cccccc] flex items-center justify-center gap-[12px] h-[56px] w-full text-black font-['Inter_Tight',sans-serif] text-[18px] leading-[24px]"
            >
              <div className="relative shrink-0 size-[24px]">
                <img alt="Close" className="block max-w-none size-full" src={imgCloseIcon} />
              </div>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;