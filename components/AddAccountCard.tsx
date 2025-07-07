import React from 'react';
import { PlusIcon } from './common/Icons';

interface AddAccountCardProps {
    onClick: () => void;
}

const AddAccountCard: React.FC<AddAccountCardProps> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="w-full h-full min-h-[210px] bg-slate-800/50 hover:bg-slate-800 border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-2xl p-6 transition-all duration-300 ease-in-out text-slate-400 hover:text-cyan-400 flex flex-col items-center justify-center text-center group"
        >
            <div className="w-16 h-16 border-2 border-dashed border-slate-600 group-hover:border-cyan-500 rounded-full flex items-center justify-center mb-4 transition-colors">
                <PlusIcon className="w-8 h-8"/>
            </div>
            <h3 className="font-bold text-xl text-slate-300 group-hover:text-cyan-400 mb-1 transition-colors">Add New Account</h3>
            <p className="text-sm">Click to add a new DESCO account</p>
        </button>
    );
};

export default AddAccountCard;