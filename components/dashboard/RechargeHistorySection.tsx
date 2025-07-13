// @ts-nocheck
import React from 'react';
import Section from '../common/Section';
import Spinner from '../common/Spinner';
import Modal from '../common/Modal';
import { useState } from 'react';
import { useRef } from 'react';
import { getDashboardLabel } from './dashboardLabels';
import { formatCurrency, sanitizeCurrency } from '../common/format';

const RechargeDetailsModal = ({ isOpen, onClose, recharge, t }) => {
  const printRef = useRef();

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); // reload to restore event handlers
  };

  if (!recharge) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-sm">
      <div className="flex flex-col h-full max-h-[90vh]">
        <div
          ref={printRef}
          className="p-4 pb-2 overflow-y-auto print:bg-white print:text-black flex-1 font-mono text-[15px] print:text-xs print:font-mono"
        >
          {/* Header */}
          <div className="text-center mb-2">
            <div className="font-bold text-lg print:text-base">{t('descoCompany')}</div>
            <div className="text-xs font-semibold text-slate-500 print:text-black">{t('desco')}</div>
            <div className="mt-1 mb-2 border-b border-dashed border-slate-300 print:border-black" />
          </div>

          {/* General Info */}
          <div className="mb-2">
            <div><span className="inline-block w-28">{t('date')}</span>: {new Date(recharge.rechargeDate).toLocaleString()}</div>
            <div><span className="inline-block w-28">{t('orderNo')}</span>: {recharge.orderID}</div>
            <div><span className="inline-block w-28">{t('name')}</span>: {recharge.name || '-'}</div>
            <div><span className="inline-block w-28">{t('meterNo')}</span>: {recharge.meterNo}</div>
            <div><span className="inline-block w-28">{t('accountNo')}</span>: {recharge.accountNo}</div>
            <div><span className="inline-block w-28">{t('status')}</span>: {recharge.orderStatus}</div>
            <div><span className="inline-block w-28">{t('operator')}</span>: {recharge.rechargeOperator}</div>
            <div><span className="inline-block w-28">{t('sequence')}</span>: {recharge.sequence}</div>
          </div>

          <div className="my-2 border-b border-dashed border-slate-300 print:border-black" />

          {/* Charges */}
          <div className="mb-2">
            <div className="font-semibold mb-1 text-xs print:text-xs">{t('charges')}</div>
            <div><span className="inline-block w-28">{t('energyCost')}</span>: {formatCurrency(sanitizeCurrency(recharge.energyAmount))}</div>
            <div><span className="inline-block w-28">{t('demandCharge')}</span>: {formatCurrency(sanitizeCurrency(recharge.chargeItems?.find(i => i.chargeItemName === 'Demand Charge')?.chargeAmount))}</div>
            <div><span className="inline-block w-28">{t('meterRent1P')}</span>: {formatCurrency(sanitizeCurrency(recharge.chargeItems?.find(i => i.chargeItemName === 'Meter Rent 1P')?.chargeAmount))}</div>
            <div><span className="inline-block w-28">{t('vat5')}</span>: {formatCurrency(sanitizeCurrency(recharge.VAT))}</div>
            <div><span className="inline-block w-28">{t('rebate')}</span>: {formatCurrency(sanitizeCurrency(recharge.rebate))}</div>
            <div className="font-bold mt-1"><span className="inline-block w-28">{t('grossAmount')}</span>: {formatCurrency(sanitizeCurrency(recharge.totalAmount))}</div>
          </div>

          <div className="my-2 border-b border-dashed border-slate-300 print:border-black" />

          {/* Token */}
          <div className="mb-2">
            <div className="font-semibold text-xs mb-1 print:text-xs">{t('token')}</div>
            <div className="border border-slate-300 print:border-black rounded px-2 py-2 text-center font-mono tracking-widest text-lg print:text-base bg-white text-black select-all">
              {recharge.token.match(/.{1,4}/g)?.join('-')}
            </div>
          </div>

          <div className="my-2 border-b border-dashed border-slate-300 print:border-black" />

          {/* Footer */}
          <div className="text-center mt-4 text-xs print:text-xs">
            <div>{t('thankYouDesco')}</div>
            <div className="mt-1">{t('forQueries')}</div>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-3 pt-2 border-t border-slate-700 bg-slate-800 sticky bottom-0 print:hidden z-10">
          <button onClick={handlePrint} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm">{t('print')}</button>
          <button onClick={onClose} className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1.5 rounded-lg text-sm">{t('close')}</button>
        </div>
      </div>
    </Modal>
  );
};

const RechargeHistorySection = ({ rechargeHistory, rechargeYear, isHistoryLoading, setRechargeYear, banglaEnabled, t, defaultOpen, sectionId, showInfoIcon, onInfoClick }) => {
  const [selectedRecharge, setSelectedRecharge] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleDetails = (item) => {
    setSelectedRecharge(item);
    setModalOpen(true);
  };

  // Calculate pagination
  const totalPages = rechargeHistory ? Math.ceil(rechargeHistory.length / itemsPerPage) : 0;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = rechargeHistory ? rechargeHistory.slice(startIndex, endIndex) : [];

  // Reset to first page when year changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [rechargeYear]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <Section 
      title={getDashboardLabel('rechargeHistory', banglaEnabled) + ' ' + t('last1Year')} 
      defaultOpen={defaultOpen}
      sectionId={sectionId}
      showInfoIcon={showInfoIcon}
      onInfoClick={onInfoClick}
    >
      <div className="flex flex-wrap justify-end items-center gap-4 mb-4">
        <select
          value={rechargeYear}
          onChange={e => setRechargeYear(parseInt(e.target.value))}
          disabled={isHistoryLoading}
          className="bg-slate-700 text-slate-200 px-4 py-2 rounded-lg border border-slate-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition disabled:opacity-50"
        >
          {[...Array(5)].map((_, i) => <option key={i} value={new Date().getFullYear() - i}>{new Date().getFullYear() - i}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="text-xs text-slate-400 uppercase bg-slate-700/50">
            <tr>
              <th className="px-4 py-3">{t('action')}</th>
              <th className="px-4 py-3">{t('dateTime')}</th>
              <th className="px-4 py-3">{t('meterNo')}</th>
              <th className="px-4 py-3">{t('totalAmount')}</th>
              <th className="px-4 py-3">{t('energyAmount')}</th>
              <th className="px-4 py-3">{getDashboardLabel('status', banglaEnabled)}</th>
            </tr>
          </thead>
          <tbody>
            {isHistoryLoading ? (
              <tr><td colSpan={6} className="text-center py-8"><Spinner/></td></tr>
            ) : currentItems && currentItems.length > 0 ? currentItems.map((item) => (
              <tr key={item.orderID} className="border-b border-slate-700 hover:bg-slate-700/50">
                <td className="px-4 py-3"><button onClick={() => handleDetails(item)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg">{t('details')}</button></td>
                <td className="px-4 py-3 whitespace-nowrap">{new Date(item.rechargeDate).toLocaleString()}</td>
                <td className="px-4 py-3">{item.meterNo}</td>
                <td className="px-4 py-3 font-medium text-white">{formatCurrency(sanitizeCurrency(item.totalAmount))}</td>
                <td className="px-4 py-3">{item.energyAmount}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.orderStatus === 'Execution Successful' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {item.orderStatus}
                  </span>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="text-center py-8 text-slate-400">{t('noRechargeHistory', { year: rechargeYear })}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isHistoryLoading && rechargeHistory && rechargeHistory.length > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 px-2 py-2 bg-slate-700/30 rounded-lg w-full gap-2">
          <div className="text-xs sm:text-sm text-slate-300 mb-2 sm:mb-0">
            {t('pageOf', { currentPage, totalPages, totalItems: rechargeHistory.length })}
          </div>
          <div className="flex gap-1 sm:gap-2 overflow-x-auto w-full sm:w-auto pb-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:text-slate-500 text-slate-200 rounded-lg text-xs sm:text-sm transition whitespace-nowrap"
            >
              {t('previous')}
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => handlePageChange(i + 1)}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm transition whitespace-nowrap ${
                  currentPage === i + 1
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-600 hover:bg-slate-500 text-slate-200'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:text-slate-500 text-slate-200 rounded-lg text-xs sm:text-sm transition whitespace-nowrap"
            >
              {t('next')}
            </button>
          </div>
        </div>
      )}

      {/* Details Modal */}
      <RechargeDetailsModal isOpen={modalOpen} onClose={() => setModalOpen(false)} recharge={selectedRecharge} t={t} />
    </Section>
  );
};

export default RechargeHistorySection; 