import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Account } from '../../types';
import { CloseIcon, ShareIcon, CopyIcon, CheckIcon, BoltIcon } from './Icons';
import Modal from './Modal';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, account }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'simple' | 'detailed'>('detailed');

  // Generate different types of share URLs with enhanced parameters
  const accountName = encodeURIComponent(account.displayName || account.customerName || 'DESCO Account');
  const shareId = Math.random().toString(36).substring(2, 8); // Generate a short random ID

  const shareFormats = {
    simple: {
      url: `${window.location.origin}/dashboard/${account.accountNo}?shared=1&ref=simple&sid=${shareId}`,
      title: `Check out my DESCO electricity account`,
      description: `View my electricity usage dashboard for account ${account.accountNo}`
    },
    detailed: {
      url: `${window.location.origin}/dashboard/${account.accountNo}?shared=1&ref=detailed&name=${accountName}&sid=${shareId}&utm_source=descowise&utm_medium=share&utm_campaign=dashboard_share`,
      title: `🔌 ${account.displayName || account.customerName || 'My DESCO Account'} - Electricity Dashboard`,
      description: `📊 View real-time electricity usage, balance, and AI-powered insights for DESCO account ${account.accountNo}.

⚡ Features:
• Real-time balance monitoring
• AI-powered consumption analysis
• Smart recharge recommendations
• Historical usage trends

🔗 Powered by DescoWise - Your smart electricity companion`
    }
  };

  const currentFormat = shareFormats[selectedFormat];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentFormat.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleCopyWithText = async () => {
    const shareText = `${currentFormat.title}\n\n${currentFormat.description}\n\n🔗 ${currentFormat.url}`;
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentFormat.title,
          text: currentFormat.description,
          url: currentFormat.url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copy
      handleCopyWithText();
    }
  };

  // Reset copied state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="flex flex-col h-full">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <ShareIcon className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t('shareDashboard')}</h2>
              <p className="text-sm text-slate-400">{t('shareAccountDashboard')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-slate-700 transition-colors"
            aria-label={t('closeModal')}
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 px-6 pt-4 pb-6">

        {/* Account Preview */}
        <div className="bg-slate-700/50 rounded-lg p-4 mb-6 border border-slate-600">
          <div className="flex items-center gap-3 mb-2">
            <BoltIcon className="w-5 h-5 text-cyan-400" />
            <span className="font-semibold text-slate-200">
              {account.displayName || account.customerName || `Account ${account.accountNo}`}
            </span>
          </div>
          <div className="text-sm text-slate-400 space-y-1">
            <div>Account: {account.accountNo}</div>
            {account.customerName && <div>Customer: {account.customerName}</div>}
            {account.installationAddress && (
              <div className="truncate">Address: {account.installationAddress}</div>
            )}
          </div>
        </div>

        {/* Share Format Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-3">
            {t('shareFormat')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedFormat('simple')}
              className={`p-3 rounded-lg border text-left transition-colors ${
                selectedFormat === 'simple'
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                  : 'border-slate-600 bg-slate-700/30 text-slate-300 hover:border-slate-500'
              }`}
            >
              <div className="font-medium text-sm">{t('simpleShare')}</div>
              <div className="text-xs text-slate-400 mt-1">{t('simpleShareDesc')}</div>
            </button>
            <button
              onClick={() => setSelectedFormat('detailed')}
              className={`p-3 rounded-lg border text-left transition-colors ${
                selectedFormat === 'detailed'
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                  : 'border-slate-600 bg-slate-700/30 text-slate-300 hover:border-slate-500'
              }`}
            >
              <div className="font-medium text-sm">{t('detailedShare')}</div>
              <div className="text-xs text-slate-400 mt-1">{t('detailedShareDesc')}</div>
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {t('sharePreview')}
          </label>
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
            <div className="font-medium text-slate-200 mb-1">{currentFormat.title}</div>
            <div className="text-sm text-slate-400 mb-3">{currentFormat.description}</div>
            <div className="text-xs text-cyan-400 font-mono break-all">{currentFormat.url}</div>
          </div>
        </div>

        {/* Share Actions */}
        <div className="space-y-3">
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] shadow-lg"
          >
            {copied ? (
              <>
                <CheckIcon className="w-5 h-5" />
                {t('linkCopied')}
              </>
            ) : (
              <>
                <CopyIcon className="w-5 h-5" />
                {t('copyLink')}
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCopyWithText}
              className="flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-500 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              <ShareIcon className="w-4 h-4" />
              <span className="text-sm">{t('copyWithDescription')}</span>
            </button>

            {navigator.share && (
              <button
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                <ShareIcon className="w-4 h-4" />
                <span className="text-sm">{t('shareViaSystem')}</span>
              </button>
            )}
          </div>

          {/* Quick Social Share Options */}
          <div className="pt-2 border-t border-slate-600">
            <div className="text-xs text-slate-400 mb-2">{t('quickShare')}</div>
            <div className="flex gap-2">
              <button
                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(currentFormat.title + '\n\n' + currentFormat.description + '\n\n' + currentFormat.url)}`, '_blank')}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-xs font-medium transition-colors"
              >
                WhatsApp
              </button>
              <button
                onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(currentFormat.url)}&text=${encodeURIComponent(currentFormat.title)}`, '_blank')}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded text-xs font-medium transition-colors"
              >
                Telegram
              </button>
              <button
                onClick={() => window.open(`mailto:?subject=${encodeURIComponent(currentFormat.title)}&body=${encodeURIComponent(currentFormat.description + '\n\n' + currentFormat.url)}`, '_blank')}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded text-xs font-medium transition-colors"
              >
                Email
              </button>
            </div>
          </div>
        </div>

          {/* Tips */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="text-sm text-blue-300">
              <div className="font-medium mb-1">💡 {t('sharingTips')}</div>
              <ul className="text-xs text-blue-200 space-y-1">
                <li>• {t('sharingTip1')}</li>
                <li>• {t('sharingTip2')}</li>
                <li>• {t('sharingTip3')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ShareModal;
