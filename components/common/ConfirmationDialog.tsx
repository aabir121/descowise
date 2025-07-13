// @ts-nocheck
import React from 'react';
import Modal from './Modal';

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
}) => {
  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-8 text-slate-100 relative" onClick={e => e.stopPropagation()}>
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
            onClick={() => { onConfirm(); onClose(); }}
            className={`px-4 py-2 rounded-lg text-white font-bold transition ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationDialog; 