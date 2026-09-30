// @ts-nocheck
import React, { useState, useMemo, useRef } from 'react';
import Section from '../common/Section';
import VirtualTable from '../common/VirtualTable';
import { getDashboardLabel } from './dashboardLabels';
import { formatCurrency, sanitizeCurrency } from '../common/format';
import { CheckCircleIcon, ExclamationTriangleIcon } from '../common/Icons';
import RechargeAiInsights from './AiInsights/RechargeAiInsights';
import ErrorBoundary from '../common/ErrorBoundary';
import { useModal } from '../../App';

const RechargeStatusBadge = ({ status, t }) => {
  const successful = status === 'Execution Successful';
  return (
    <span
      title={status}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none ${
        successful
          ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'
          : 'border-rose-400/25 bg-rose-400/10 text-rose-300'
      }`}
    >
      {successful ? <CheckCircleIcon className="h-3.5 w-3.5" /> : <ExclamationTriangleIcon className="h-3.5 w-3.5" />}
      {successful ? t('successful') : t('failed')}
    </span>
  );
};

const formatReceiptDate = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const d = new Date(value);
  return isNaN(d.getTime()) ? String(value) : d.toLocaleString();
};

const getChargeAmount = (recharge, chargeName) => {
  const items = Array.isArray(recharge?.chargeItems) ? recharge.chargeItems : [];
  const found = items.find(i => i && i.chargeItemName === chargeName);
  return found?.chargeAmount;
};
const formatToken = (token) => {
  if (token === null || token === undefined || token === '') return '-';
  const digits = String(token).replace(/[^0-9A-Za-z]/g, '');
  if (!digits) return '-';
  return digits.match(/.{1,4}/g)?.join('-') ?? String(token);
};

const buildReceiptHtml = (contentTitle, contentInnerHtml) => `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${contentTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #000; }
            .print-content { max-width: 800px; margin: 0 auto; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="print-content">
            ${contentInnerHtml}
          </div>
        </body>
      </html>
    `;

const RechargeDetailsModal = ({ isOpen, onClose, recharge, t }) => {
  const printRef = useRef();
  const Modal = useModal();

  const handlePrint = () => {
    try {
      if (!printRef.current) return;

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert(t('popupBlocked'));
        return;
      }

      printWindow.document.write(buildReceiptHtml('Recharge Details', printRef.current.innerHTML));
      printWindow.document.close();

      const doPrint = () => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch (e) {
          console.error('Print failed:', e);
          alert(t('printFailed'));
        }
      };

      // Close only after printing completes — never immediately, or the
      // dialog (and Save-as-PDF download) is destroyed before the user sees it.
      printWindow.onafterprint = () => {
        try { printWindow.close(); } catch (e) { /* noop */ }
      };

      if (printWindow.document.readyState === 'complete') {
        doPrint();
      } else {
        printWindow.onload = doPrint;
        // Fallback in case onload already fired without readyState updating
        setTimeout(() => {
          try {
            if (printWindow.document.readyState === 'complete' && !printWindow.closed) doPrint();
          } catch (e) { /* noop */ }
        }, 500);
      }
    } catch (e) {
      console.error('Print failed:', e);
      alert(t('printFailed'));
    }
  };

  const handleDownload = () => {
    try {
      if (!printRef.current) return;
      const html = buildReceiptHtml('Recharge Details', printRef.current.innerHTML);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const fileName = `recharge-receipt-${recharge?.orderID ?? 'details'}.html`;
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.error('Download failed:', e);
      alert(t('downloadFailed'));
    }
  };

  if (!recharge) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-sm">
      <div className="flex flex-col h-full max-h-[90vh]">
        <ErrorBoundary
          fallback={
            <div className="p-4 text-center text-sm text-slate-300">
              <div className="mb-2 text-lg">⚠️</div>
              <div>{t('receiptRenderError')}</div>
            </div>
          }
        >
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
            <div><span className="inline-block w-28">{t('date')}</span>: {formatReceiptDate(recharge.rechargeDate)}</div>
            <div><span className="inline-block w-28">{t('orderNo')}</span>: {recharge.orderID}</div>
            <div><span className="inline-block w-28">{t('name')}</span>: {recharge.name || '-'}</div>
            <div><span className="inline-block w-28">{t('meterNo')}</span>: {recharge.meterNo}</div>
            <div><span className="inline-block w-28">{t('accountNo')}</span>: {recharge.accountNo}</div>
            <div><span className="inline-block w-28">{t('status')}</span>: {recharge.orderStatus}</div>
            <div><span className="inline-block w-28">{t('operator')}</span>: {recharge.rechargeOperator}</div>
            <div><span className="inline-block w-28">{t('sequence')}</span>: {recharge.sequence ?? '-'}</div>
          </div>

          <div className="my-2 border-b border-dashed border-slate-300 print:border-black" />

          {/* Charges */}
          <div className="mb-2">
            <div className="font-semibold mb-1 text-xs print:text-xs">{t('charges')}</div>
            <div><span className="inline-block w-28">{t('energyCost')}</span>: {formatCurrency(sanitizeCurrency(recharge.energyAmount))}</div>
            <div><span className="inline-block w-28">{t('demandCharge')}</span>: {formatCurrency(sanitizeCurrency(getChargeAmount(recharge, 'Demand Charge')))}</div>
            <div><span className="inline-block w-28">{t('meterRent1P')}</span>: {formatCurrency(sanitizeCurrency(getChargeAmount(recharge, 'Meter Rent 1P')))}</div>
            <div><span className="inline-block w-28">{t('vat5')}</span>: {formatCurrency(sanitizeCurrency(recharge.VAT))}</div>
            <div><span className="inline-block w-28">{t('rebate')}</span>: {formatCurrency(sanitizeCurrency(recharge.rebate))}</div>
            <div className="font-bold mt-1"><span className="inline-block w-28">{t('grossAmount')}</span>: {formatCurrency(sanitizeCurrency(recharge.totalAmount))}</div>
          </div>

          <div className="my-2 border-b border-dashed border-slate-300 print:border-black" />

          {/* Token */}
          <div className="mb-2">
            <div className="font-semibold text-xs mb-1 print:text-xs">{t('token')}</div>
            <div className="border border-slate-300 print:border-black rounded px-2 py-2 text-center font-mono tracking-widest text-lg print:text-base bg-white text-black select-all">
              {formatToken(recharge.token)}
            </div>
          </div>

          <div className="my-2 border-b border-dashed border-slate-300 print:border-black" />

          {/* Footer */}
          <div className="text-center mt-4 text-xs print:text-xs">
            <div>{t('thankYouDesco')}</div>
            <div className="mt-1">{t('forQueries')}</div>
          </div>
        </div>
        </ErrorBoundary>
        <div className="flex justify-end gap-2 p-3 pt-2 border-t border-slate-700 bg-slate-800 sticky bottom-0 print:hidden z-10">
          <button onClick={handleDownload} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm">{t('download')}</button>
          <button onClick={handlePrint} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm">{t('print')}</button>
          <button onClick={onClose} className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1.5 rounded-lg text-sm">{t('close')}</button>
        </div>
      </div>
    </Modal>
  );
};

const RechargeHistorySection = ({
  rechargeHistory,
  rechargeYear,
  isHistoryLoading,
  setRechargeYear,
  banglaEnabled,
  t,
  defaultOpen,
  sectionId,
  showInfoIcon,
  onInfoClick,
  // New props for distributed AI insights
  rechargeAiInsights,
  isAiLoading
}) => {
  const [selectedRecharge, setSelectedRecharge] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleDetails = (item) => {
    setSelectedRecharge(item);
    setModalOpen(true);
  };

  // Memoize table columns to prevent recreation on every render
  const tableColumns = useMemo(() => [
    {
      key: 'action',
      header: t('action'),
      width: '120px',
      render: (item) => (
        <button
          onClick={() => handleDetails(item)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          {t('details')}
        </button>
      )
    },
    {
      key: 'date',
      header: t('dateTime'),
      width: '180px',
      render: (item) => (
        <span className="whitespace-nowrap text-sm">
          {formatReceiptDate(item.rechargeDate)}
        </span>
      )
    },
    {
      key: 'meter',
      header: t('meterNo'),
      width: '120px',
      render: (item) => <span className="text-sm">{item.meterNo}</span>
    },
    {
      key: 'amount',
      header: t('totalAmount'),
      width: '140px',
      render: (item) => (
        <span className="font-medium text-white text-sm">
          {formatCurrency(sanitizeCurrency(item.totalAmount))}
        </span>
      )
    },
    {
      key: 'energy',
      header: t('energyAmount'),
      width: '120px',
      render: (item) => <span className="text-sm">{item.energyAmount}</span>
    },
    {
      key: 'status',
      header: getDashboardLabel('status', banglaEnabled),
      width: '140px',
      render: (item) => (
        <RechargeStatusBadge status={item.orderStatus} t={t} />
      )
    }
  ], [t, banglaEnabled, handleDetails]);

  // Memoize summary stats calculation to prevent unnecessary recalculations
  const summaryStats = useMemo(() => {
    if (!rechargeHistory || rechargeHistory.length === 0) {
      return { avgMonthlyRecharge: 0, avgMonthlyRechargeCount: 0 };
    }

    let monthlyTotals = {};
    let totalRechargeAmount = 0;
    let totalRechargeCount = 0;

    rechargeHistory.forEach(item => {
      const month = new Date(item.rechargeDate).toLocaleString('default', { year: 'numeric', month: 'short' });
      if (!monthlyTotals[month]) monthlyTotals[month] = { amount: 0, count: 0 };
      monthlyTotals[month].amount += Number(item.totalAmount) || 0;
      monthlyTotals[month].count += 1;
      totalRechargeAmount += Number(item.totalAmount) || 0;
      totalRechargeCount += 1;
    });

    const monthsWithRecharges = Object.keys(monthlyTotals).length || 1;
    return {
      avgMonthlyRecharge: totalRechargeAmount / monthsWithRecharges,
      avgMonthlyRechargeCount: totalRechargeCount / monthsWithRecharges
    };
  }, [rechargeHistory]);

  return (
    <Section
      title={getDashboardLabel('rechargeHistory', banglaEnabled) + ' ' + t('last1Year')}
      defaultOpen={defaultOpen}
      sectionId={sectionId}
      showInfoIcon={showInfoIcon}
      onInfoClick={onInfoClick}
      isAiLoading={isAiLoading}
      aiLoadingText={t('analyzingRecharges')}
    >
      {/* AI Insights - First content item */}
      {rechargeAiInsights && (
        <RechargeAiInsights insights={rechargeAiInsights} t={t} />
      )}

      <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-4 mb-4">
        {/* Summary Section */}
        {!isHistoryLoading && rechargeHistory && rechargeHistory.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-slate-700/40 rounded-lg text-slate-200 w-full sm:w-auto">
            <div>
              <span className="font-semibold">{t('averageTotalRechargePerMonth')}</span>: {formatCurrency(summaryStats.avgMonthlyRecharge)}
            </div>
            <div>
              <span className="font-semibold">{t('averageRechargeCountPerMonth')}</span>: {summaryStats.avgMonthlyRechargeCount.toFixed(2)}
            </div>
          </div>
        )}
        <select
          value={rechargeYear}
          onChange={e => setRechargeYear(parseInt(e.target.value))}
          disabled={isHistoryLoading}
          className="bg-slate-700 text-slate-200 px-4 py-2 rounded-lg border border-slate-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition disabled:opacity-50"
        >
          {[...Array(5)].map((_, i) => {
            const year = new Date().getFullYear() - i;
            return <option key={year} value={year}>{year}</option>;
          })}
        </select>
      </div>
      <VirtualTable
        data={rechargeHistory || []}
        columns={tableColumns}
        visibleRows={5}
        itemHeight={60}
        isLoading={isHistoryLoading}
        emptyMessage={t('noRechargeHistory', { year: rechargeYear })}
        className="w-full text-sm text-left text-slate-300"
        headerClassName="text-xs text-slate-400 uppercase bg-slate-700/50"
        rowClassName="border-b border-slate-700 hover:bg-slate-700/50"
        mobileCard={(item) => (
          <article className="rounded-xl border border-slate-700 bg-slate-800/70 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><p className="text-sm font-semibold text-white">{formatCurrency(sanitizeCurrency(item.totalAmount))}</p><p className="mt-1 text-xs text-slate-400">{formatReceiptDate(item.rechargeDate)}</p></div>
              <RechargeStatusBadge status={item.orderStatus} t={t} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-slate-700 pt-3 text-xs"><div><span className="text-slate-500">{t('meterNo')}</span><p className="mt-0.5 break-all text-slate-200">{item.meterNo || '—'}</p></div><div><span className="text-slate-500">{t('energyAmount')}</span><p className="mt-0.5 text-slate-200">{formatCurrency(sanitizeCurrency(item.energyAmount))}</p></div></div>
            <button onClick={() => handleDetails(item)} className="mt-4 w-full rounded-lg border border-indigo-400/30 bg-indigo-500/10 py-2 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-500/20">{t('viewDetails')}</button>
          </article>
        )}
      />

      {/* Details Modal */}
      <RechargeDetailsModal isOpen={modalOpen} onClose={() => setModalOpen(false)} recharge={selectedRecharge} t={t} />
    </Section>
  );
};

export default RechargeHistorySection; 
