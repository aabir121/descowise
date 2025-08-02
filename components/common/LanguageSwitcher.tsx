import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GlobeAltIcon } from './Icons';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const currentLanguage = i18n.language;
  const isEnglish = currentLanguage === 'en';

  const toggleLanguage = () => {
    const newLanguage = isEnglish ? 'bn' : 'en';
    i18n.changeLanguage(newLanguage);
    setIsOpen(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Small delay to prevent immediate closing on mobile
    setTimeout(() => {
      if (!isHovered) {
        setIsOpen(false);
      }
    }, 100);
  };

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main button - improved mobile touch target */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/70 transition-colors text-slate-200 hover:text-white border border-slate-600/50 hover:border-slate-500/70 min-h-[2rem] sm:min-h-[2.25rem]"
        aria-label="Switch language"
      >
        <GlobeAltIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
        <span className="text-xs sm:text-sm font-medium">
          {isEnglish ? 'EN' : 'বাং'}
        </span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-32 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50 py-1">
          <button
            onClick={() => {
              i18n.changeLanguage('en');
              setIsOpen(false);
            }}
            className={`w-full px-3 py-2 text-left text-sm transition-colors ${
              isEnglish 
                ? 'bg-cyan-600/20 text-cyan-400' 
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>English</span>
              {isEnglish && <span className="text-cyan-400">✓</span>}
            </div>
          </button>
          <button
            onClick={() => {
              i18n.changeLanguage('bn');
              setIsOpen(false);
            }}
            className={`w-full px-3 py-2 text-left text-sm transition-colors ${
              !isEnglish 
                ? 'bg-cyan-600/20 text-cyan-400' 
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>বাংলা</span>
              {!isEnglish && <span className="text-cyan-400">✓</span>}
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher; 