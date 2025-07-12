// @ts-nocheck
import React, { useState } from 'react';
import Section from '../common/Section';
import { getDashboardLabel } from './dashboardLabels';
import { formatCurrency, sanitizeCurrency } from '../common/format';
import { InformationCircleIcon } from '../common/Icons';
import Modal from '../common/Modal';

const AccountBalanceSection = ({ gaugeData, banglaEnabled, balanceUnavailable }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <Section title={getDashboardLabel('balance', banglaEnabled) + ' ' + getDashboardLabel('status', banglaEnabled)} defaultOpen>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col items-center justify-center p-6 bg-slate-700/50 rounded-xl">
          {balanceUnavailable ? (
            <>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 flex items-center justify-center gap-2">
                  N/A
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="p-1 rounded hover:bg-slate-700 focus:outline-none"
                    aria-label="More information about unavailable balance"
                  >
                    <InformationCircleIcon className="w-6 h-6 text-yellow-400 hover:text-yellow-300" />
                  </button>
                </div>
                <div className="text-sm text-yellow-400 mt-2">Balance information temporarily unavailable</div>
              </div>
              <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <InformationCircleIcon className="w-6 h-6 text-yellow-400" />
                    <h3 className="text-lg font-semibold text-slate-100">Balance Information Unavailable</h3>
                  </div>
                  <div className="text-slate-300 text-sm space-y-3">
                    <p>
                      We're unable to display your current balance at this time. This could be due to:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Temporary service maintenance</li>
                      <li>Account status changes</li>
                      <li>Network connectivity issues</li>
                      <li>Recent meter reading updates</li>
                    </ul>
                    <p className="text-slate-400 text-xs mt-4">
                      Your balance information will be updated automatically once available. You can also check your balance directly through the official DESCO portal.
                    </p>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-slate-100 rounded-lg transition-colors"
                    >
                      Got it
                    </button>
                  </div>
                </div>
              </Modal>
            </>
          ) : (
            <>
              <div className="relative w-32 h-32 mb-4">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    stroke="#374151"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    stroke={gaugeData.percentage > 50 ? "#22c55e" : gaugeData.percentage > 25 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 54}`}
                    strokeDashoffset={`${2 * Math.PI * 54 * (1 - gaugeData.percentage / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{gaugeData.percentage.toFixed(0)}%</div>
                    <div className="text-xs text-slate-400">{banglaEnabled ? 'মাসিক গড়ের' : 'of monthly avg'}</div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400">
                  {formatCurrency(sanitizeCurrency(gaugeData.currentBalance))}
                </div>
                <div className="text-sm text-slate-400">{getDashboardLabel('balance', banglaEnabled)}</div>
              </div>
            </>
          )}
        </div>
        <div className="space-y-4">
          <div className="bg-slate-700/30 p-4 rounded-lg">
            <h5 className="text-sm font-semibold text-slate-300 mb-2">{getDashboardLabel('monthlyCostTrend', banglaEnabled)}</h5>
            <div className="text-xl font-bold text-orange-400">
              {gaugeData ? formatCurrency(sanitizeCurrency(gaugeData.averageMonthlyCost)) : '—'}
            </div>
          </div>
          <div className="bg-slate-700/30 p-4 rounded-lg">
            <h5 className="text-sm font-semibold text-slate-300 mb-2">{banglaEnabled ? 'আনুমানিক বাকি দিন' : 'Estimated Days Remaining'}</h5>
            <div className="text-xl font-bold text-green-400">{gaugeData && !balanceUnavailable ? gaugeData.daysRemaining : '—'} {banglaEnabled ? 'দিন' : 'days'}</div>
          </div>
          <div className="bg-slate-700/30 p-4 rounded-lg">
            <h5 className="text-sm font-semibold text-slate-300 mb-2">{getDashboardLabel('status', banglaEnabled)}</h5>
            <div className={`text-sm font-semibold px-3 py-1 rounded-full inline-block ${
              gaugeData && !balanceUnavailable ? (
                gaugeData.percentage > 50 ? 'bg-green-500/20 text-green-300' :
                gaugeData.percentage > 25 ? 'bg-yellow-500/20 text-yellow-300' :
                'bg-red-500/20 text-red-300'
              ) : 'bg-yellow-500/20 text-yellow-300'
            }`}>
              {gaugeData && !balanceUnavailable ? (
                gaugeData.percentage > 50 ? (banglaEnabled ? 'ভালো' : 'Good') : 
                  gaugeData.percentage > 25 ? (banglaEnabled ? 'সতর্কতা' : 'Warning') : (banglaEnabled ? 'কম' : 'Low')
              ) : (banglaEnabled ? 'অজানা' : 'Unknown')}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default AccountBalanceSection; 