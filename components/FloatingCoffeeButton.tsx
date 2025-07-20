import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon } from './common/Icons';

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
    <div className="floating-coffee-btn group">
      <button
        title={t('supportDeveloper')}
        onClick={() => setOpen((v) => !v)}
        aria-label={t('supportDeveloperAria')}
        style={{ fontSize: 28, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <span role="img" aria-label="coffee">☕</span>
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: 'transparent' }}
            onClick={e => {
              e.stopPropagation();
              setOpen(false);
            }}
          />
          <div
            className="coffee-popover z-50"
            ref={popoverRef}
            style={{ maxWidth: 320, minWidth: 220, position: 'absolute', bottom: 'calc(100% + 8px)', right: 0 }}
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-slate-400 hover:text-slate-100 focus:outline-none rounded-full p-1 transition-colors"
              aria-label={t('close')}
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'absolute', top: 8, right: 8 }}
              tabIndex={0}
            >
              <CloseIcon className="w-6 h-6" />
            </button>
            <div className="font-semibold text-lg mb-2" style={{ paddingRight: 24 }}>{t('enjoyingApp')}</div>
            <div className="mb-3 text-slate-300 text-sm">{t('supportOrConnect')}</div>
            <div className="flex flex-col gap-2 mb-2">
              <a href="https://aabir121.github.io" target="_blank" rel="noopener noreferrer">{t('portfolio')}</a>
              <a href="https://www.linkedin.com/in/aabir-hassan/" target="_blank" rel="noopener noreferrer">{t('linkedin')}</a>
              <a href="https://aabir-hassan.medium.com/" target="_blank" rel="noopener noreferrer">{t('medium')}</a>
              <a href="https://coff.ee/aabir.hassan" target="_blank" rel="noopener noreferrer">{t('buyMeCoffee')}</a>
            </div>
            <div className="text-xs text-slate-500 mt-1 break-words">{t('thankYouSupport')}</div>
          </div>
        </>
      )}
    </div>
  );
};

export default FloatingCoffeeButton;