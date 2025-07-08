// @ts-nocheck
import React, { ReactNode } from 'react';

interface SectionProps {
    title: string;
    children: ReactNode;
    defaultOpen?: boolean;
}

const Section: React.FC<SectionProps> = ({ title, children, defaultOpen }) => (
    <details className="bg-slate-800 rounded-xl overflow-hidden" open={defaultOpen}>
        <summary className="p-4 sm:p-6 text-lg font-bold text-slate-100 cursor-pointer hover:bg-slate-700/50 transition-colors">
            {title}
        </summary>
        <div className="p-4 sm:p-6 border-t border-slate-700">
            {children}
        </div>
    </details>
);

// Reusable DetailItem for label-value pairs
export const DetailItem: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
    <div className="py-2">
        <span className="text-sm font-medium text-slate-400">{label}</span>
        <p className="text-base font-semibold text-slate-100">{value || 'N/A'}</p>
    </div>
);

// Reusable DeleteButton for delete actions
export const DeleteButton: React.FC<{
    onClick: (e: React.MouseEvent) => void;
    title?: string;
    className?: string;
    children: React.ReactNode;
    noPadding?: boolean;
}> = ({ onClick, title = 'Delete', className = '', children, noPadding = false }) => (
    <button
        onClick={onClick}
        title={title}
        className={`${noPadding ? '' : 'p-2 '}text-slate-500 hover:text-white hover:bg-red-500/80 rounded-full transition-colors duration-200 z-10 ${className}`.trim()}
    >
        {children}
    </button>
);

export default Section; 