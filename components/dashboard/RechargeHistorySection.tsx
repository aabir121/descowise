// @ts-nocheck
import React from 'react';
import Section from '../common/Section';
import Spinner from '../common/Spinner';

const RechargeHistorySection = ({ rechargeHistory, rechargeYear, isHistoryLoading, setRechargeYear }) => {
  return (
    <Section title="Recharge History" defaultOpen>
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
              <th scope="col" className="px-6 py-3">Date</th>
              <th scope="col" className="px-6 py-3">Amount (BDT)</th>
              <th scope="col" className="px-6 py-3">Operator</th>
              <th scope="col" className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {isHistoryLoading ? (
              <tr><td colSpan={4} className="text-center py-8"><Spinner/></td></tr>
            ) : rechargeHistory && rechargeHistory.length > 0 ? rechargeHistory.map((item) => (
              <tr key={item.orderID} className="border-b border-slate-700 hover:bg-slate-700/50">
                <td className="px-6 py-4 whitespace-nowrap">{new Date(item.rechargeDate).toLocaleString()}</td>
                <td className="px-6 py-4 font-medium text-white">{item.totalAmount.toLocaleString()}</td>
                <td className="px-6 py-4">{item.rechargeOperator}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.orderStatus === 'Execution Successful' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {item.orderStatus}
                  </span>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={4} className="text-center py-8 text-slate-400">No recharge history found for {rechargeYear}.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Section>
  );
};

export default RechargeHistorySection; 