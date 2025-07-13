import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const FloatingCoffeeButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <>
      <button
        className="floating-coffee-btn group"
        title={t('supportDeveloper')}
        onClick={() => setOpen((v) => !v)}
        aria-label={t('supportDeveloperAria')}
        style={{ fontSize: 28 }}
      >
        <span role="img" aria-label="coffee">☕</span>
      </button>
      {open && (
        <div className="coffee-popover" ref={popoverRef}>
          <div className="font-semibold text-lg mb-2">{t('enjoyingApp')}</div>
          <div className="mb-3 text-slate-300 text-sm">{t('supportOrConnect')}</div>
          <div className="flex flex-col gap-2 mb-2">
            <a href="https://aabir121.github.io" target="_blank" rel="noopener noreferrer">{t('portfolio')}</a>
            <a href="https://www.linkedin.com/in/aabir-hassan/" target="_blank" rel="noopener noreferrer">{t('linkedin')}</a>
            <a href="https://aabir-hassan.medium.com/" target="_blank" rel="noopener noreferrer">{t('medium')}</a>
            <a href="https://coff.ee/aabir.hassan" target="_blank" rel="noopener noreferrer">{t('buyMeCoffee')}</a>
          </div>
          <div className="text-xs text-slate-500 mt-1">{t('thankYouSupport')}</div>
        </div>
      )}
    </>
  );
};

export default FloatingCoffeeButton; 