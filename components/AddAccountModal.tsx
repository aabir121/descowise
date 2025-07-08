import React from 'react';
import { Account } from '../types';
import { CloseIcon } from './common/Icons';
import Modal from './common/Modal';

interface AddAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAccountAdded: (account: Account) => void;
    existingAccounts: Account[];
}

const AddAccountModal: React.FC<AddAccountModalProps> = ({ isOpen, onClose, onAccountAdded, existingAccounts }) => {
    // TODO: Implement useAddAccount or provide fallback logic here
    const step = 'form';
    const isLoading = false;
    const message = null;
    const accountNumber = '';
    const setAccountNumber = () => {};
    const displayName = '';
    const setDisplayName = () => {};
    const verifiedData = null;
    const handleVerify = () => {};
    const handleConfirmAdd = () => {};
    const resetState = () => {};
    const clearError = () => {};

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6 sm:p-8">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold text-white">{step === 'form' ? 'Add New Account' : 'Confirm Account'}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-300">
                        <CloseIcon />
                    </button>
                </div>

                {/* Message display removed because message is always null in fallback. */}
                {/* AccountNumberForm and AccountDetailsReview are missing. Replace with placeholder. */}
                <div className="text-center text-red-400 bg-red-900/20 p-4 rounded-lg">
                  Account form components are missing. Please restore AccountNumberForm and AccountDetailsReview.
                </div>
            </div>
        </Modal>
    );
};

export default AddAccountModal;