import React from 'react';
import { Account, CustomerLocation } from '../../types';
import Section from '../common/Section';
import { DetailItem } from '../common/Section';
import { UserIcon, MapPinIcon, PhoneIcon, BuildingOfficeIcon, BoltIcon, HomeIcon } from '../common/Icons';

interface ConsumerInformationSectionProps {
    account: Account;
    locationData?: CustomerLocation;
    banglaEnabled: boolean;
    showNotification: (message: string, type?: 'info' | 'warning' | 'error') => void;
}

const ConsumerInformationSection: React.FC<ConsumerInformationSectionProps> = ({ 
    account, 
    locationData, 
    banglaEnabled,
    showNotification
}) => {
    const labels = {
        accountInfo: banglaEnabled ? 'অ্যাকাউন্ট তথ্য' : 'Account Information',
        locationInfo: banglaEnabled ? 'অবস্থান তথ্য' : 'Location Information',
        serviceInfo: banglaEnabled ? 'সেবা তথ্য' : 'Service Information',
        accountNumber: banglaEnabled ? 'অ্যাকাউন্ট নম্বর' : 'Account Number',
        customerName: banglaEnabled ? 'গ্রাহকের নাম' : 'Customer Name',
        contactNumber: banglaEnabled ? 'যোগাযোগের নম্বর' : 'Contact Number',
        meterNumber: banglaEnabled ? 'মিটার নম্বর' : 'Meter Number',
        installationAddress: banglaEnabled ? 'ইনস্টলেশন ঠিকানা' : 'Installation Address',
        feederName: banglaEnabled ? 'ফিডার নাম' : 'Feeder Name',
        tariffSolution: banglaEnabled ? 'ট্যারিফ সমাধান' : 'Tariff Solution',
        sanctionLoad: banglaEnabled ? 'অনুমোদিত লোড' : 'Sanction Load',
        zone: banglaEnabled ? 'জোন' : 'Zone',
        block: banglaEnabled ? 'ব্লক' : 'Block',
        route: banglaEnabled ? 'রুট' : 'Route',
        dateAdded: banglaEnabled ? 'যোগ করার তারিখ' : 'Date Added',
        displayName: banglaEnabled ? 'প্রদর্শন নাম' : 'Display Name'
    };

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
            title={banglaEnabled ? 'গ্রাহক তথ্য' : 'Consumer Information'} 
            defaultOpen={false}
        >
            <div className="space-y-3">
                {/* Main Account & Service Info */}
                <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1">
                        <DetailItem label={labels.accountNumber} value={account.accountNo} />
                        <DetailItem label={labels.customerName} value={account.customerName} />
                        <DetailItem label={labels.contactNumber} value={account.contactNo} />
                        <DetailItem label={labels.meterNumber} value={account.meterNo} />
                        <DetailItem label={labels.feederName} value={account.feederName} />
                        <DetailItem label={labels.tariffSolution} value={account.tariffSolution} />
                        {account.displayName && (
                            <DetailItem label={labels.displayName} value={account.displayName} />
                        )}
                        <DetailItem label={labels.sanctionLoad} value={account.sanctionLoad} />
                        <DetailItem label={labels.dateAdded} value={formatDate(account.dateAdded)} />
                    </div>
                </div>

                {/* Installation Address */}
                <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <HomeIcon className="w-4 h-4 text-cyan-400" />
                        <h3 className="font-semibold text-slate-100 text-sm">{labels.installationAddress}</h3>
                    </div>
                    <div className="bg-slate-600/50 rounded p-2">
                        <p className="text-slate-100 text-sm">
                            {account.installationAddress || (banglaEnabled ? 'ঠিকানা পাওয়া যায়নি' : 'Address not available')}
                        </p>
                    </div>
                </div>

                {/* Location Information (if available) */}
                {locationData && (
                    <div className="bg-slate-700/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <MapPinIcon className="w-4 h-4 text-cyan-400" />
                            <h3 className="font-semibold text-slate-100 text-sm">{labels.locationInfo}</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1">
                            <DetailItem label={labels.zone} value={locationData.zone} />
                            <DetailItem label={labels.block} value={locationData.block} />
                            <DetailItem label={labels.route} value={locationData.route} />
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <BuildingOfficeIcon className="w-4 h-4 text-cyan-400" />
                        <h3 className="font-semibold text-slate-100 text-sm">
                            {banglaEnabled ? 'দ্রুত কর্ম' : 'Quick Actions'}
                        </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={async () => {
                                try {
                                    await navigator.clipboard.writeText(account.accountNo);
                                    showNotification(
                                        banglaEnabled 
                                            ? `অ্যাকাউন্ট নম্বর "${account.accountNo}" কপি করা হয়েছে!`
                                            : `Account number "${account.accountNo}" copied to clipboard!`,
                                        'info'
                                    );
                                } catch (err) {
                                    showNotification(
                                        banglaEnabled 
                                            ? 'অ্যাকাউন্ট নম্বর কপি করতে ব্যর্থ হয়েছে'
                                            : 'Failed to copy account number',
                                        'error'
                                    );
                                }
                            }}
                            className="px-2 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs rounded transition-colors flex items-center gap-1.5"
                        >
                            <PhoneIcon className="w-3 h-3" />
                            {banglaEnabled ? 'অ্যাকাউন্ট নম্বর' : 'Account No'}
                        </button>
                        <button
                            onClick={async () => {
                                try {
                                    await navigator.clipboard.writeText(account.contactNo);
                                    showNotification(
                                        banglaEnabled 
                                            ? `যোগাযোগের নম্বর "${account.contactNo}" কপি করা হয়েছে!`
                                            : `Contact number "${account.contactNo}" copied to clipboard!`,
                                        'info'
                                    );
                                } catch (err) {
                                    showNotification(
                                        banglaEnabled 
                                            ? 'যোগাযোগের নম্বর কপি করতে ব্যর্থ হয়েছে'
                                            : 'Failed to copy contact number',
                                        'error'
                                    );
                                }
                            }}
                            className="px-2 py-1.5 bg-slate-600 hover:bg-slate-700 text-white text-xs rounded transition-colors flex items-center gap-1.5"
                        >
                            <PhoneIcon className="w-3 h-3" />
                            {banglaEnabled ? 'যোগাযোগের নম্বর' : 'Contact No'}
                        </button>
                        <button
                            onClick={async () => {
                                try {
                                    await navigator.clipboard.writeText(account.meterNo);
                                    showNotification(
                                        banglaEnabled 
                                            ? `মিটার নম্বর "${account.meterNo}" কপি করা হয়েছে!`
                                            : `Meter number "${account.meterNo}" copied to clipboard!`,
                                        'info'
                                    );
                                } catch (err) {
                                    showNotification(
                                        banglaEnabled 
                                            ? 'মিটার নম্বর কপি করতে ব্যর্থ হয়েছে'
                                            : 'Failed to copy meter number',
                                        'error'
                                    );
                                }
                            }}
                            className="px-2 py-1.5 bg-slate-600 hover:bg-slate-700 text-white text-xs rounded transition-colors flex items-center gap-1.5"
                        >
                            <BoltIcon className="w-3 h-3" />
                            {banglaEnabled ? 'মিটার নম্বর' : 'Meter No'}
                        </button>
                    </div>
                </div>
            </div>
        </Section>
    );
};

export default ConsumerInformationSection; 