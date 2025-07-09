export interface BalanceData {
  accountNo: string;
  meterNo: string;
  balance: number;
  currentMonthConsumption: number;
  readingTime: string;
}

export interface AccountInfo {
  accountNo: string;
  customerName: string;
  contactNo: string;
  feederName: string;
  installationAddress: string;
  meterNo: string;
  tariffSolution: string;
  sanctionLoad: string;
  balance?: string | number;
  readingTime?: string;
  currentMonthConsumption?: number;
}

export interface Account extends AccountInfo {
  displayName?: string | null;
  dateAdded: string;
  aiInsightsEnabled: boolean;
}

// --- New Dashboard Types ---

export interface AiSummary {
    title: string;
    overallSummary: string;
    anomaly: {
        detected: boolean;
        details: string;
    };
    seasonalTrend: {
        observed: boolean;
        details: string;
    };
    rechargePatternInsight: string;
    balanceStatusAndAdvice: {
        status: 'low' | 'normal' | 'good';
        details: string;
    };
    rechargeRecommendation: {
        recommendedAmountBDT: number | null;
        justification: string;
    };
    rechargeTimingInsight: string;
    actionableTip: string;
    balanceDepletionForecast: {
        daysRemaining: number;
        expectedDepletionDate: string;
        details: string;
    };
    currentMonthBillForecast: {
        estimatedTotal: number;
        details: string;
    };
    futureConsumptionForecast: Array<{
        month: string; // "YYYY-MM"
        estimatedConsumption: number;
        estimatedBill: number;
    }>;
}

export interface CustomerLocation {
    accountNo: number;
    zone: string;
    block: string;
    route: string;
}

export interface DailyConsumption {
    accountNo: string;
    consumedTaka: number;
    consumedUnit: number;
    date: string; // "YYYY-MM-DD"
}

export interface ChargeItem {
    chargeItemName: string;
    chargeAmount: number;
}

export interface RechargeHistoryItem {
    orderID: string;
    accountNo: string;
    meterNo: string;
    totalAmount: number;
    energyAmount: number;
    rechargeDate: string; // "YYYY-MM-DD HH:mm:ss.S"
    rechargeOperator: string;
    orderStatus: string;
    chargeItems: ChargeItem[];
    VAT: number;
}

export interface MonthlyConsumption {
    accountNo: string;
    consumedTaka: number;
    consumedUnit: number | null;
    month: string; // "YYYY-MM"
    maximumDemand: number;
}