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

export default Section; 