// @ts-nocheck
import React from 'react';
import { useModal } from '../../App';

const ConfirmationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  icon?: React.ReactNode;
  mobileFullscreen?: boolean;
  closeOnConfirm?: boolean;
  confirmDisabled?: boolean;
}> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonClass = 'bg-red-600 hover:bg-red-700',
  icon,
  mobileFullscreen = false,
  closeOnConfirm = true,
  confirmDisabled = false,
}) => {
  const Modal = useModal();

  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} mobileFullscreen={mobileFullscreen}>
      <div className={`bg-slate-800 text-slate-100 ${mobileFullscreen ? 'flex min-h-full flex-col justify-center px-5 py-10 sm:min-h-0 sm:p-8' : 'relative max-h-[70vh] max-w-md overflow-y-auto rounded-2xl p-8 shadow-2xl'}`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
        <p className="mb-6 text-slate-300" dangerouslySetInnerHTML={{ __html: message }} />
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-600 text-slate-200 font-bold hover:bg-slate-500 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={() => { onConfirm(); if (closeOnConfirm) onClose(); }}
            disabled={confirmDisabled}
            className={`px-4 py-2 rounded-lg text-white font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationDialog; 
