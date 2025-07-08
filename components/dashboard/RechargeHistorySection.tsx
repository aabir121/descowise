// @ts-nocheck
import React from 'react';
import Section from '../common/Section';
import Spinner from '../common/Spinner';
import Modal from '../common/Modal';
import { useState } from 'react';
import { useRef } from 'react';

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
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="flex flex-col h-full max-h-[90vh]">
        <div ref={printRef} className="p-6 pb-4 overflow-y-auto print:bg-white print:text-black flex-1">
          <div className="text-xl font-bold mb-2 text-center">Recharge Information</div>
          <div className="text-center font-semibold mb-4">Dhaka Electric Supply Company Ltd<br/>DESCO</div>
          <div className="mb-2 text-sm">Date: {new Date(recharge.rechargeDate).toLocaleString()}</div>
          <div className="mb-2 text-sm">Order No: {recharge.orderID}</div>
          <div className="mb-2 text-sm"><span className="font-semibold">Name:</span> {recharge.name || '-'}</div>
          <div className="mb-2 text-sm"><span className="font-semibold">Meter No:</span> {recharge.meterNo}</div>
          <div className="mb-2 text-sm"><span className="font-semibold">Account No:</span> {recharge.accountNo}</div>
          <div className="mb-2 text-sm"><span className="font-semibold">Status:</span> {recharge.orderStatus}</div>
          <div className="mb-2 text-sm"><span className="font-semibold">Recharge Operator:</span> {recharge.rechargeOperator}</div>
          <div className="mb-2 text-sm"><span className="font-semibold">Sequence:</span> {recharge.sequence}</div>
          <hr className="my-3" />
          <div className="mb-2 text-sm"><span className="font-semibold">Energy Cost:</span> {recharge.energyAmount}</div>
          <div className="mb-2 text-sm"><span className="font-semibold">Demand Charge:</span> {recharge.chargeItems?.find(i => i.chargeItemName === 'Demand Charge')?.chargeAmount ?? '-'}</div>
          <div className="mb-2 text-sm"><span className="font-semibold">Meter Rent 1P:</span> {recharge.chargeItems?.find(i => i.chargeItemName === 'Meter Rent 1P')?.chargeAmount ?? '-'}</div>
          <div className="mb-2 text-sm"><span className="font-semibold">VAT (5%):</span> {recharge.VAT}</div>
          <div className="mb-2 text-sm"><span className="font-semibold">Rebate:</span> {recharge.rebate}</div>
          <div className="mb-2 text-sm"><span className="font-semibold">Gross Amount:</span> {recharge.totalAmount}</div>
          <hr className="my-3" />
          <div className="mb-2 text-sm"><span className="font-semibold">Token</span><br/>{recharge.token.match(/.{1,4}/g)?.join('-')}</div>
        </div>
        <div className="flex justify-end gap-2 p-4 pt-2 border-t border-slate-700 bg-slate-800 sticky bottom-0 print:hidden z-10">
          <button onClick={handlePrint} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">Print</button>
          <button onClick={onClose} className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg">Close</button>
        </div>
      </div>
    </Modal>
  );
};

const RechargeHistorySection = ({ rechargeHistory, rechargeYear, isHistoryLoading, setRechargeYear }) => {
  const [selectedRecharge, setSelectedRecharge] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleDetails = (item) => {
    setSelectedRecharge(item);
    setModalOpen(true);
  };

  return (
    <Section title="Recharge History (Last 1 year)" defaultOpen>
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
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Date & Time</th>
              <th className="px-4 py-3">Meter No</th>
              <th className="px-4 py-3">Total Amount</th>
              <th className="px-4 py-3">Energy Amount</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {isHistoryLoading ? (
              <tr><td colSpan={6} className="text-center py-8"><Spinner/></td></tr>
            ) : rechargeHistory && rechargeHistory.length > 0 ? rechargeHistory.map((item) => (
              <tr key={item.orderID} className="border-b border-slate-700 hover:bg-slate-700/50">
                <td className="px-4 py-3"><button onClick={() => handleDetails(item)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg">Details</button></td>
                <td className="px-4 py-3 whitespace-nowrap">{new Date(item.rechargeDate).toLocaleString()}</td>
                <td className="px-4 py-3">{item.meterNo}</td>
                <td className="px-4 py-3 font-medium text-white">{item.totalAmount.toLocaleString()}</td>
                <td className="px-4 py-3">{item.energyAmount}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.orderStatus === 'Execution Successful' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {item.orderStatus}
                  </span>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="text-center py-8 text-slate-400">No recharge history found for {rechargeYear}.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <RechargeDetailsModal isOpen={modalOpen} onClose={() => setModalOpen(false)} recharge={selectedRecharge} />
    </Section>
  );
};

export default RechargeHistorySection; 