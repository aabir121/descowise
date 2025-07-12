import React from 'react';
import Modal from './Modal';
import { InformationCircleIcon } from './Icons';

interface BalanceInfoWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BalanceInfoWarningModal: React.FC<BalanceInfoWarningModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={handleModalClick}>
      <div className="flex flex-col max-h-[70vh] w-full max-w-sm bg-slate-800 rounded-lg shadow-2xl my-4">
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <InformationCircleIcon className="w-5 h-5 text-yellow-400" />
            <h3 className="text-base font-semibold text-slate-100">Balance Info Unavailable</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-700 transition-colors"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="text-slate-300 text-xs space-y-2">
            <p>
              Balance info is currently unavailable. Possible reasons:
            </p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>Service maintenance</li>
              <li>Account status change</li>
              <li>Network issue</li>
              <li>Recent meter update</li>
            </ul>
            <div className="bg-slate-700/50 p-2 rounded mt-2">
              <p className="font-semibold text-slate-200 mb-1">What you can do:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2 text-slate-300">
                <li>Check your meter directly</li>
                <li>Call DESCO: <span className="text-cyan-400">16260</span> or <span className="text-cyan-400">02-955-9555</span></li>
                <li>Visit DESCO portal</li>
                <li>Wait for auto update</li>
              </ul>
            </div>
            <p className="text-slate-400 text-[10px] mt-2">
              Info will update automatically when available.
            </p>
          </div>
        </div>
        {/* Fixed Footer */}
        <div className="flex justify-end px-4 py-3 border-t border-slate-700 flex-shrink-0">
          <button
            onClick={handleClose}
            className="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-slate-100 rounded-lg text-xs transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default BalanceInfoWarningModal; 