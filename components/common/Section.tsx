// @ts-nocheck
import React, { ReactNode, useState, useEffect, useCallback } from 'react';
import { ChevronDownIcon, ChevronRightIcon, InformationCircleIcon } from './Icons';
import Spinner from './Spinner';
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
    isAiLoading?: boolean; // Whether AI analysis is in progress for this section
    aiLoadingText?: string; // Optional text to show next to loading spinner
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
    showInfoIcon = false,
    isAiLoading = false,
    aiLoadingText
}) => {
    // Generate a unique ID if not provided
    const uniqueId = sectionId || `section-${title.toLowerCase().replace(/\s+/g, '-')}`;
    const { getSectionPreference, setSectionPreference } = useSectionPreferences();

    // Initialize state from localStorage or default
    const [isOpen, setIsOpen] = useState<boolean>(() => {
        // If always expanded, ignore localStorage and always be open
        if (alwaysExpanded) return true;

        return getSectionPreference(uniqueId, defaultOpen);
    });



    // Handle toggle with persistence
    const handleToggle = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        // Don't allow toggling for always expanded sections
        if (alwaysExpanded) return;

        const newState = !isOpen;
        setIsOpen(newState);
        // savePreference is now handled by useEffect
        onToggle?.(newState);
    }, [isOpen, onToggle, alwaysExpanded]);

    // Sync with localStorage only when isOpen changes
    useEffect(() => {
        if (alwaysExpanded) return;

        setSectionPreference(uniqueId, isOpen);
    }, [isOpen, uniqueId, alwaysExpanded, setSectionPreference]);

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
                        {isAiLoading && (
                            <div className="flex items-center gap-2 text-purple-400">
                                <Spinner size="w-4 h-4" color="border-purple-400" />
                                {aiLoadingText && (
                                    <span className="text-xs hidden sm:inline">{aiLoadingText}</span>
                                )}
                            </div>
                        )}
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

// Hook for managing section preferences globally using a single localStorage object
export const useSectionPreferences = () => {
    const STORAGE_KEY = 'section-preferences';

    // Helper function to get all preferences from localStorage
    const getAllPreferences = useCallback(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Failed to get section preferences:', error);
            return {};
        }
    }, []);

    // Helper function to save all preferences to localStorage
    const saveAllPreferences = useCallback((preferences: Record<string, boolean>) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
        } catch (error) {
            console.error('Failed to save section preferences:', error);
        }
    }, []);

    const resetAllPreferences = useCallback(() => {
        try {
            // Remove the new single object
            localStorage.removeItem(STORAGE_KEY);

            // Also clean up any old individual keys for migration
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
            const preferences = getAllPreferences();

            // Migration: Check for old individual keys if not found in new format
            if (!(sectionId in preferences)) {
                const oldKey = `section-preference-${sectionId}`;
                const oldStored = localStorage.getItem(oldKey);
                if (oldStored !== null) {
                    const oldValue = JSON.parse(oldStored);
                    // Migrate to new format
                    preferences[sectionId] = oldValue;
                    saveAllPreferences(preferences);
                    // Clean up old key
                    localStorage.removeItem(oldKey);
                    return oldValue;
                }
            }

            return preferences[sectionId] ?? defaultValue;
        } catch (error) {
            console.error('Failed to get section preference:', error);
            return defaultValue;
        }
    }, [getAllPreferences, saveAllPreferences]);

    const setSectionPreference = useCallback((sectionId: string, isOpen: boolean) => {
        // Don't set preferences for always expanded sections
        if (sectionId === 'ai-powered-insights') return;

        try {
            const preferences = getAllPreferences();
            preferences[sectionId] = isOpen;
            saveAllPreferences(preferences);
        } catch (error) {
            console.error('Failed to set section preference:', error);
        }
    }, [getAllPreferences, saveAllPreferences]);

    return {
        resetAllPreferences,
        getSectionPreference,
        setSectionPreference
    };
};

export default Section; 