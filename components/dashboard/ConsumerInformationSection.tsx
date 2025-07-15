import React from 'react';
import { Account, CustomerLocation } from '../../types';
import Section from '../common/Section';
import { DetailItem } from '../common/Section';
import { UserIcon, MapPinIcon, BuildingOfficeIcon, HomeIcon, CopyIcon } from '../common/Icons';

interface ConsumerInformationSectionProps {
    account: Account;
    locationData?: CustomerLocation;
    banglaEnabled: boolean;
    t: (key: string, options?: any) => string;
    showNotification: (message: string, type?: 'info' | 'warning' | 'error') => void;
    defaultOpen?: boolean;
    sectionId?: string;
    showInfoIcon?: boolean;
    onInfoClick?: () => void;
}

const ConsumerInformationSection: React.FC<ConsumerInformationSectionProps> = ({ 
    account, 
    locationData, 
    banglaEnabled,
    t,
    showNotification,
    defaultOpen,
    sectionId,
    showInfoIcon,
    onInfoClick
}) => {
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString(banglaEnabled ? 'bn-BD' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    return (
        <Section 
            title={t('consumerInfo')} 
            defaultOpen={defaultOpen}
            sectionId={sectionId}
            showInfoIcon={showInfoIcon}
            onInfoClick={onInfoClick}
        >
            <div className="space-y-3">
                {/* Main Account & Service Info */}
                <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1">
                        <DetailItem label={t('accountNumber')} value={<span className="flex items-center gap-1">{account.accountNo}
                            <button
                                onClick={async () => {
                                    try {
                                        await navigator.clipboard.writeText(account.accountNo);
                                        showNotification(
                                            t('accountNumberCopied', { accountNo: account.accountNo }),
                                            'info'
                                        );
                                    } catch (err) {
                                        showNotification(
                                            t('failedToCopyAccountNumber'),
                                            'error'
                                        );
                                    }
                                }}
                                className="ml-1 p-0.5 hover:bg-cyan-700 rounded transition-colors"
                                title={t('copyAccountNumber')}
                            >
                                <CopyIcon className="w-4 h-4 text-cyan-400" />
                            </button>
                        </span>} />
                        <DetailItem label={t('customerName')} value={account.customerName} />
                        <DetailItem label={t('contactNumber')} value={<span className="flex items-center gap-1">{account.contactNo}
                            <button
                                onClick={async () => {
                                    try {
                                        await navigator.clipboard.writeText(account.contactNo);
                                        showNotification(
                                            t('contactNumberCopied', { contactNo: account.contactNo }),
                                            'info'
                                        );
                                    } catch (err) {
                                        showNotification(
                                            t('failedToCopyContactNumber'),
                                            'error'
                                        );
                                    }
                                }}
                                className="ml-1 p-0.5 hover:bg-cyan-700 rounded transition-colors"
                                title={t('copyContactNumber')}
                            >
                                <CopyIcon className="w-4 h-4 text-cyan-400" />
                            </button>
                        </span>} />
                        <DetailItem label={t('meterNumber')} value={<span className="flex items-center gap-1">{account.meterNo}
                            <button
                                onClick={async () => {
                                    try {
                                        await navigator.clipboard.writeText(account.meterNo);
                                        showNotification(
                                            t('meterNumberCopied', { meterNo: account.meterNo }),
                                            'info'
                                        );
                                    } catch (err) {
                                        showNotification(
                                            t('failedToCopyMeterNumber'),
                                            'error'
                                        );
                                    }
                                }}
                                className="ml-1 p-0.5 hover:bg-cyan-700 rounded transition-colors"
                                title={t('copyMeterNumber')}
                            >
                                <CopyIcon className="w-4 h-4 text-cyan-400" />
                            </button>
                        </span>} />
                        <DetailItem label={t('feederName')} value={account.feederName} />
                        <DetailItem label={t('tariffSolution')} value={account.tariffSolution} />
                        {account.displayName && (
                            <DetailItem label={t('displayName')} value={account.displayName} />
                        )}
                        <DetailItem label={t('sanctionLoad')} value={account.sanctionLoad} />
                        <DetailItem label={t('dateAdded')} value={formatDate(account.dateAdded)} />
                    </div>
                </div>

                {/* Installation Address */}
                <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <HomeIcon className="w-4 h-4 text-cyan-400" />
                        <h3 className="font-semibold text-slate-100 text-sm">{t('installationAddress')}</h3>
                    </div>
                    <div className="bg-slate-600/50 rounded p-2">
                        <p className="text-slate-100 text-sm">
                            {account.installationAddress || t('addressNotAvailable')}
                        </p>
                    </div>
                </div>

                {/* Location Information (if available) */}
                {locationData && (
                    <div className="bg-slate-700/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <MapPinIcon className="w-4 h-4 text-cyan-400" />
                            <h3 className="font-semibold text-slate-100 text-sm">{t('locationInfo')}</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1">
                            <DetailItem label={t('zone')} value={locationData.zone} />
                            <DetailItem label={t('block')} value={locationData.block} />
                            <DetailItem label={t('route')} value={locationData.route} />
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                {/* removed Quick Actions section */}
            </div>
        </Section>
    );
};

export default ConsumerInformationSection; 