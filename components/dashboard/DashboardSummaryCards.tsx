import React, { useMemo } from 'react';
import { formatCurrency, sanitizeCurrency } from '../common/format';

type DashboardSummaryCardsProps = {
  data: any;
  t: (key: string, options?: any) => string;
};

const DashboardSummaryCards: React.FC<DashboardSummaryCardsProps> = ({ data, t }) => {
  const summary = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentYear = String(now.getFullYear());
    const history = Array.isArray(data?.rechargeHistory) ? data.rechargeHistory : [];
    const latestRecharge = [...history].sort((a, b) =>
      String(b?.rechargeDate || '').localeCompare(String(a?.rechargeDate || ''))
    )[0];
    const currentMonthData = Array.isArray(data?.monthlyConsumption)
      ? data.monthlyConsumption.find(item => item?.month === currentMonth)
      : null;
    const yearlyRecharge = history
      .filter(item => String(item?.rechargeDate || '').startsWith(currentYear))
      .reduce((sum, item) => sum + (Number(item?.totalAmount) || 0), 0);

    return [
      {
        label: t('remainingBalance', 'Remaining balance'),
        value: data?.balance?.balance == null ? '—' : formatCurrency(sanitizeCurrency(data.balance.balance)),
        meta: data?.balance?.readingTime ? `${t('asOf', 'As of')} ${new Date(data.balance.readingTime).toLocaleDateString()}` : t('notAvailable', 'Not available'),
        tone: 'text-cyan-300',
      },
      {
        label: t('lastRecharge', 'Last recharge'),
        value: latestRecharge ? formatCurrency(sanitizeCurrency(latestRecharge.totalAmount)) : '—',
        meta: latestRecharge?.rechargeDate ? new Date(latestRecharge.rechargeDate).toLocaleDateString() : t('notAvailable', 'Not available'),
        tone: 'text-emerald-300',
      },
      {
        label: t('currentMonthConsumption', 'This month usage'),
        value: currentMonthData?.consumedUnit == null && data?.balance?.currentMonthConsumption == null
          ? '—'
          : `${currentMonthData?.consumedUnit ?? data.balance.currentMonthConsumption} kWh`,
        meta: currentMonthData?.consumedTaka == null ? t('notAvailable', 'Not available') : formatCurrency(sanitizeCurrency(currentMonthData.consumedTaka)),
        tone: 'text-orange-300',
      },
      {
        label: t('rechargedThisYear', 'Recharged this year'),
        value: yearlyRecharge ? formatCurrency(yearlyRecharge) : '—',
        meta: history.length ? `${history.length} ${t('transactions', 'transactions')}` : t('notAvailable', 'Not available'),
        tone: 'text-violet-300',
      },
    ];
  }, [data, t]);

  return (
    <section aria-label={t('accountSummary', 'Account summary')} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {summary.map(card => (
        <div key={card.label} className="rounded-xl border border-slate-700 bg-slate-800/90 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{card.label}</p>
          <p className={`mt-2 text-2xl font-bold ${card.tone}`}>{card.value}</p>
          <p className="mt-1 text-xs text-slate-500">{card.meta}</p>
        </div>
      ))}
    </section>
  );
};

export default DashboardSummaryCards;
