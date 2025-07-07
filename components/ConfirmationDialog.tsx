import React from 'react';
import { CloseIcon } from './Icons';

interface ConfirmationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    confirmButtonClass?: string;
    icon?: React.ReactNode;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText,
    confirmButtonClass = "bg-red-600 hover:bg-red-700",
    icon
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 flex" onClick={onClose}>
            <div className="relative bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md text-slate-100 m-auto transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            {icon && <div className="text-red-400">{icon}</div>}
                            <h2 className="text-xl font-bold text-white">{title}</h2>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-300">
                            <CloseIcon />
                        </button>
                    </div>

                    <div className="mb-6">
                        <p className="text-slate-300 leading-relaxed">{message}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                            onClick={onClose} 
                            className="w-full bg-slate-600 text-slate-200 font-bold py-3 px-4 rounded-lg hover:bg-slate-500 transition"
                        >
                            {cancelText}
                        </button>
                        <button 
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }} 
                            className={`w-full text-white font-bold py-3 px-4 rounded-lg hover:shadow-lg transition-transform transform hover:-translate-y-0.5 ${confirmButtonClass}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationDialog; 