// @ts-nocheck
import React, { ReactNode, useState, useEffect, useCallback } from 'react';
import { ChevronDownIcon, ChevronRightIcon, InformationCircleIcon } from './Icons';
import type { ReactNode } from 'react';

interface SectionProps {
    title: string;
    children: ReactNode;
    defaultOpen?: boolean;
    summaryValue?: ReactNode;
    sectionId?: string; // Unique identifier for localStorage persistence
    onToggle?: (isOpen: boolean) => void; // Callback for parent components
    alwaysExpanded?: boolean; // If true, section is always expanded and not managed by preferences
    onInfoClick?: () => void; // Callback for info icon click
    showInfoIcon?: boolean; // Whether to show the info icon
}

const Section: React.FC<SectionProps> = ({ 
    title, 
    children, 
    defaultOpen = true, 
    summaryValue, 
    sectionId,
    onToggle,
    alwaysExpanded = false,
    onInfoClick,
    showInfoIcon = false
}) => {
    // Generate a unique ID if not provided
    const uniqueId = sectionId || `section-${title.toLowerCase().replace(/\s+/g, '-')}`;
    const storageKey = `section-preference-${uniqueId}`;
    
    // Initialize state from localStorage or default
    const [isOpen, setIsOpen] = useState<boolean>(() => {
        // If always expanded, ignore localStorage and always be open
        if (alwaysExpanded) return true;
        
        try {
            const stored = localStorage.getItem(storageKey);
            return stored !== null ? JSON.parse(stored) : defaultOpen;
        } catch (error) {
            console.error('Failed to load section preference from localStorage:', error);
            return defaultOpen;
        }
    });

    // Save preference to localStorage whenever it changes
    const savePreference = useCallback((open: boolean) => {
        // Don't save preferences for always expanded sections
        if (alwaysExpanded) return;
        
        try {
            localStorage.setItem(storageKey, JSON.stringify(open));
        } catch (error) {
            console.error('Failed to save section preference to localStorage:', error);
        }
    }, [storageKey, alwaysExpanded]);

    // Handle toggle with persistence
    const handleToggle = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        // Don't allow toggling for always expanded sections
        if (alwaysExpanded) return;
        
        const newState = !isOpen;
        setIsOpen(newState);
        savePreference(newState);
        onToggle?.(newState);
    }, [isOpen, savePreference, onToggle, alwaysExpanded]);

    // Sync with localStorage on mount
    useEffect(() => {
        savePreference(isOpen);
    }, [isOpen, savePreference]);

    return (
        <div className="bg-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-3 sm:p-4">
                <div className="flex items-center gap-3 flex-1">
                    {!alwaysExpanded && (
                        <button
                            onClick={handleToggle}
                            className="text-slate-400 hover:text-slate-300 transition-colors duration-200 ml-2 p-1 rounded"
                            aria-label={isOpen ? 'Collapse section' : 'Expand section'}
                        >
                            {isOpen ? (
                                <ChevronDownIcon className="w-5 h-5" />
                            ) : (
                                <ChevronRightIcon className="w-5 h-5" />
                            )}
                        </button>
                    )}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleToggle}
                            className={`text-lg font-bold text-slate-100 hover:text-slate-200 transition-colors ${
                                alwaysExpanded ? 'cursor-default' : 'cursor-pointer'
                            }`}
                            disabled={alwaysExpanded}
                        >
                            {title}
                        </button>
                        {showInfoIcon && onInfoClick && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onInfoClick();
                                }}
                                className="p-1 text-slate-400 hover:text-cyan-400 transition-colors duration-200 flex-shrink-0"
                                aria-label="Section information"
                                title="Learn more about this section"
                            >
                                <InformationCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        )}
                    </div>
                </div>
                {summaryValue && (
                    <div className="text-right">
                        {summaryValue}
                    </div>
                )}
            </div>
            <div
                id={`${uniqueId}-content`}
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                <div className="p-4 sm:p-6 border-t border-slate-700">
                    {children}
                </div>
            </div>
        </div>
    );
};

// Reusable DetailItem for label-value pairs
export const DetailItem: React.FC<{ label: string; value?: ReactNode }> = ({ label, value }) => (
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

// Hook for managing section preferences globally
export const useSectionPreferences = () => {
    const resetAllPreferences = useCallback(() => {
        try {
            // Find all section preference keys and remove them
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('section-preference-')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch (error) {
            console.error('Failed to reset section preferences:', error);
        }
    }, []);

    const getSectionPreference = useCallback((sectionId: string, defaultValue: boolean = true) => {
        // Don't get preferences for always expanded sections
        if (sectionId === 'ai-powered-insights') return true;
        
        try {
            const stored = localStorage.getItem(`section-preference-${sectionId}`);
            return stored !== null ? JSON.parse(stored) : defaultValue;
        } catch (error) {
            console.error('Failed to get section preference:', error);
            return defaultValue;
        }
    }, []);

    const setSectionPreference = useCallback((sectionId: string, isOpen: boolean) => {
        // Don't set preferences for always expanded sections
        if (sectionId === 'ai-powered-insights') return;
        
        try {
            localStorage.setItem(`section-preference-${sectionId}`, JSON.stringify(isOpen));
        } catch (error) {
            console.error('Failed to set section preference:', error);
        }
    }, []);

    return {
        resetAllPreferences,
        getSectionPreference,
        setSectionPreference
    };
};

export default Section; 