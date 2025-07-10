// @ts-nocheck
import React from 'react';
import Section from '../common/Section';
import Spinner from '../common/Spinner';
import Modal from '../common/Modal';
import { useState } from 'react';
import { useRef } from 'react';
import { getDashboardLabel } from './dashboardLabels';
import { formatCurrency, sanitizeCurrency } from '../common/format';

const RechargeDetailsModal = ({ isOpen, onClose, recharge }) => {
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
            <div className="font-bold text-lg print:text-base">Dhaka Electric Supply Company Ltd</div>
            <div className="text-xs font-semibold text-slate-500 print:text-black">DESCO</div>
            <div className="mt-1 mb-2 border-b border-dashed border-slate-300 print:border-black" />
          </div>

          {/* General Info */}
          <div className="mb-2">
            <div><span className="inline-block w-28">Date</span>: {new Date(recharge.rechargeDate).toLocaleString()}</div>
            <div><span className="inline-block w-28">Order No</span>: {recharge.orderID}</div>
            <div><span className="inline-block w-28">Name</span>: {recharge.name || '-'}</div>
            <div><span className="inline-block w-28">Meter No</span>: {recharge.meterNo}</div>
            <div><span className="inline-block w-28">Account No</span>: {recharge.accountNo}</div>
            <div><span className="inline-block w-28">Status</span>: {recharge.orderStatus}</div>
            <div><span className="inline-block w-28">Operator</span>: {recharge.rechargeOperator}</div>
            <div><span className="inline-block w-28">Sequence</span>: {recharge.sequence}</div>
          </div>

          <div className="my-2 border-b border-dashed border-slate-300 print:border-black" />

          {/* Charges */}
          <div className="mb-2">
            <div className="font-semibold mb-1 text-xs print:text-xs">Charges</div>
            <div><span className="inline-block w-28">Energy Cost</span>: {formatCurrency(sanitizeCurrency(recharge.energyAmount))}</div>
            <div><span className="inline-block w-28">Demand Charge</span>: {formatCurrency(sanitizeCurrency(recharge.chargeItems?.find(i => i.chargeItemName === 'Demand Charge')?.chargeAmount))}</div>
            <div><span className="inline-block w-28">Meter Rent 1P</span>: {formatCurrency(sanitizeCurrency(recharge.chargeItems?.find(i => i.chargeItemName === 'Meter Rent 1P')?.chargeAmount))}</div>
            <div><span className="inline-block w-28">VAT (5%)</span>: {formatCurrency(sanitizeCurrency(recharge.VAT))}</div>
            <div><span className="inline-block w-28">Rebate</span>: {formatCurrency(sanitizeCurrency(recharge.rebate))}</div>
            <div className="font-bold mt-1"><span className="inline-block w-28">Gross Amount</span>: {formatCurrency(sanitizeCurrency(recharge.totalAmount))}</div>
          </div>

          <div className="my-2 border-b border-dashed border-slate-300 print:border-black" />

          {/* Token */}
          <div className="mb-2">
            <div className="font-semibold text-xs mb-1 print:text-xs">Token</div>
            <div className="border border-slate-300 print:border-black rounded px-2 py-2 text-center font-mono tracking-widest text-lg print:text-base bg-white text-black select-all">
              {recharge.token.match(/.{1,4}/g)?.join('-')}
            </div>
          </div>

          <div className="my-2 border-b border-dashed border-slate-300 print:border-black" />

          {/* Footer */}
          <div className="text-center mt-4 text-xs print:text-xs">
            <div>Thank you for using DESCO!</div>
            <div className="mt-1">For queries, call 16262</div>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-3 pt-2 border-t border-slate-700 bg-slate-800 sticky bottom-0 print:hidden z-10">
          <button onClick={handlePrint} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm">Print</button>
          <button onClick={onClose} className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1.5 rounded-lg text-sm">Close</button>
        </div>
      </div>
    </Modal>
  );
};

const RechargeHistorySection = ({ rechargeHistory, rechargeYear, isHistoryLoading, setRechargeYear, banglaEnabled }) => {
  const [selectedRecharge, setSelectedRecharge] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleDetails = (item) => {
    setSelectedRecharge(item);
    setModalOpen(true);
  };

  return (
    <Section title={getDashboardLabel('rechargeHistory', banglaEnabled) + (banglaEnabled ? ' (গত ১ বছর)' : ' (Last 1 year)')} defaultOpen>
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
              <th className="px-4 py-3">{banglaEnabled ? 'বিস্তারিত' : 'Action'}</th>
              <th className="px-4 py-3">{banglaEnabled ? 'তারিখ ও সময়' : 'Date & Time'}</th>
              <th className="px-4 py-3">{banglaEnabled ? 'মিটার নম্বর' : 'Meter No'}</th>
              <th className="px-4 py-3">{banglaEnabled ? 'মোট পরিমাণ' : 'Total Amount'}</th>
              <th className="px-4 py-3">{banglaEnabled ? 'এনার্জি পরিমাণ' : 'Energy Amount'}</th>
              <th className="px-4 py-3">{getDashboardLabel('status', banglaEnabled)}</th>
            </tr>
          </thead>
          <tbody>
            {isHistoryLoading ? (
              <tr><td colSpan={6} className="text-center py-8"><Spinner/></td></tr>
            ) : rechargeHistory && rechargeHistory.length > 0 ? rechargeHistory.map((item) => (
              <tr key={item.orderID} className="border-b border-slate-700 hover:bg-slate-700/50">
                <td className="px-4 py-3"><button onClick={() => handleDetails(item)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg">{banglaEnabled ? 'বিস্তারিত' : 'Details'}</button></td>
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
              <tr><td colSpan={6} className="text-center py-8 text-slate-400">{banglaEnabled ? `${rechargeYear} সালের জন্য কোনো রিচার্জ ইতিহাস পাওয়া যায়নি।` : `No recharge history found for ${rechargeYear}.`}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <RechargeDetailsModal isOpen={modalOpen} onClose={() => setModalOpen(false)} recharge={selectedRecharge} />
    </Section>
  );
};

export default RechargeHistorySection; 