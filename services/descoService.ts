import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AccountInfo, BalanceData, CustomerLocation, MonthlyConsumption, RechargeHistoryItem, DailyConsumption, AiSummary } from '../types';

// Helper to format a date as YYYY-MM-DD
const formatDate = (date: Date): string => date.toISOString().split('T')[0];

// Helper to format a date as YYYY-MM
const formatMonth = (date: Date): string => date.toISOString().substring(0, 7);

// Helper to process recharge history into monthly format
const processRechargeHistoryToMonthly = (rechargeHistory: RechargeHistoryItem[]): Array<{month: string, rechargeAmount: number, rechargeCount: number}> => {
    const monthlyRecharge: Record<string, {amount: number, count: number}> = {};
    
    rechargeHistory.forEach(item => {
        const month = item.rechargeDate.substring(0, 7); // Extract YYYY-MM
        if (!monthlyRecharge[month]) {
            monthlyRecharge[month] = { amount: 0, count: 0 };
        }
        monthlyRecharge[month].amount += item.totalAmount;
        monthlyRecharge[month].count += 1;
    });
    
    return Object.entries(monthlyRecharge).map(([month, data]) => ({
        month,
        rechargeAmount: data.amount,
        rechargeCount: data.count
    })).sort((a, b) => a.month.localeCompare(b.month));
};

// This service now calls the real DESCO API.
// NOTE: This may be blocked by the browser's CORS policy. 
// A backend proxy is the standard solution for production applications.
export const verifyAccount = async (accountNo: string): Promise<{ success: true; data: AccountInfo } | { success: false; message: string }> => {
    if (!accountNo || !/^\d+$/.test(accountNo) || accountNo.length < 5) {
        return { success: false, message: 'Invalid account number. Please enter only digits and ensure it is a valid length.' };
    }

    try {
        const response = await fetch(`https://prepaid.desco.org.bd/api/unified/customer/getCustomerInfo?accountNo=${accountNo}`);

        if (!response.ok) {
            let errorMessage = `Error: Account not found or API unavailable (status: ${response.status}).`;
            try {
                const errorJson = await response.json();
                if(errorJson.message) {
                    errorMessage = errorJson.message;
                }
            } catch (e) {
                // Body was not JSON or empty, use the generic message.
            }
            return { success: false, message: errorMessage };
        }

        const result = await response.json();

        if (result.code === 200 && result.data) {
            return { success: true, data: result.data };
        } else {
            return { success: false, message: result.message || 'Account not found or an unknown error occurred.' };
        }
    } catch (error) {
        console.error('Failed to verify account:', error);
        return { success: false, message: 'A network error occurred. This could be due to your connection or a CORS policy blocking the request.' };
    }
};

export const getAccountBalance = async (accountNo: string): Promise<{ success: true; data: BalanceData } | { success: false; message: string }> => {
    try {
        const response = await fetch(`https://prepaid.desco.org.bd/api/unified/customer/getBalance?accountNo=${accountNo}`);
        if (!response.ok) {
            return { success: false, message: `API error fetching balance (status: ${response.status})` };
        }
        
        const result: { code: number; desc: string; data: BalanceData | null; message?: string } = await response.json();

        if (result.code === 200 && result.data) {
            return { success: true, data: result.data };
        }
        
        return { success: false, message: result.message || 'Could not fetch balance from API response.' };
    } catch (error) {
        console.error(`Failed to fetch balance for account ${accountNo}:`, error);
        return { success: false, message: 'A network error occurred while fetching balance.' };
    }
};

export const getAiDashboardSummary = async (
    monthlyConsumption: MonthlyConsumption[], 
    rechargeHistory: RechargeHistoryItem[], 
    currentBalance: number, 
    currentMonth: string,
    recentDailyConsumption: DailyConsumption[] // NEW PARAM
): Promise<AiSummary> => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        throw new Error("Gemini API key not configured. Please set GEMINI_API_KEY in your Vercel environment variables.");
    }
    const ai = new GoogleGenAI({ apiKey });

    // --- Model and temperature config ---
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-preview-04-17';
    let temperature = 0.5;
    if (process.env.GEMINI_TEMPERATURE) {
        const parsed = parseFloat(process.env.GEMINI_TEMPERATURE);
        if (!isNaN(parsed)) temperature = parsed;
    }

    // Process recharge history into monthly format
    const monthlyRechargeData = processRechargeHistoryToMonthly(rechargeHistory);

    const prompt = `
You are an expert electricity bill and recharge analyst for residential customers, providing strategic advice to optimize their energy usage and financial management. Your goal is to offer actionable, data-driven recommendations.

Analyze the following historical electricity consumption and recharge data, along with the customer's current balance, the current month, and recent daily consumption.

**Historical Electricity Consumption Data (24 months, JSON array, sorted by month):**
- 'month': year-month (e.g., "2024-01")
- 'consumedUnit': electricity consumption in kWh
- 'consumedTaka': cost of consumption in BDT

${JSON.stringify(monthlyConsumption)}

**Historical Electricity Recharge Data (24 months, JSON array, sorted by month):**
- 'month': year-month (e.g., "2024-01")
- 'rechargeAmount': total BDT recharged for that month (sum of all recharges)
- 'rechargeCount': number of individual recharges made in that month

${JSON.stringify(monthlyRechargeData)}

**Recent Daily Consumption (last 14 days, JSON array):**
- 'date': YYYY-MM-DD
- 'consumedUnit': kWh
- 'consumedTaka': BDT

${JSON.stringify(recentDailyConsumption)}

**Current Customer Information:**
- Current Meter Balance: ${currentBalance} BDT
- Current Month (YYYY-MM): ${currentMonth}

Based on this comprehensive data and insights from historical trends (especially seasonal patterns for the current month), provide a concise and highly actionable analysis in a JSON object format. The JSON object must have the following structure:

{
  "title": "An encouraging and personalized title for the analysis (e.g., 'Your Energy & Recharge Insights: Smart Habits!', 'Optimizing Your Electricity Budget')",
  "overallSummary": "A 2-3 sentence summary of the customer's overall consumption, cost, and recharge patterns. Include average monthly consumption (kWh) and average monthly recharge (BDT). Highlight general trends (e.g., 'consistent usage, balanced recharges', 'variable consumption, frequent small recharges').",
  "anomaly": {
    "detected": true or false,
    "details": "If a significant anomaly is detected in either consumption or recharge (e.g., consumption >50% higher than 6-month average, or exceptionally high/low recharge relative to typical patterns). Describe it in one concise sentence, including month and type of anomaly. Example: 'A significant spike in consumption was observed in January 2025, consuming X% more than average, not fully covered by recharges.' If no anomaly, this string should be empty."
  },
  "seasonalTrend": {
    "observed": true or false,
    "details": "If a noticeable seasonal trend is observed in consumption or recharges (e.g., 'Consumption and recharges typically peak during the summer months due to AC usage.'). If no clear seasonal trend, this string should be empty."
  },
  "rechargePatternInsight": "Analyze the customer's historical recharge frequency and total amount relative to consumption. Is there a clear pattern (e.g., 'consistent monthly recharges', 'multiple small recharges, especially when balance is low')? Provide a brief insight into their financial management of electricity.",
  "balanceStatusAndAdvice": {
    "status": "low", "normal", or "good", // Assess current balance: 'low', 'normal', 'good'
    "details": "Based on historical consumption for the current month (${currentMonth}) and the user's current balance, assess if the balance is low. Explain why (e.g., 'Your current balance of ${currentBalance} BDT is considered low given your typical consumption of X kWh in ${currentMonth} and average cost of Y BDT for this month historically.'). If not low, state why it's normal/good."
  },
  "suggestedRechargeAmount": {
    "amountBDT": null, // Suggested amount in BDT, or null if no specific suggestion
    "justification": "Based on average consumption for the current month (${currentMonth}) from historical data, your typical monthly cost for this month is X BDT. A recharge of [suggested amount] BDT is recommended to cover a full month's usage, potentially with a small buffer. If no specific suggestion, state 'N/A'."
  },
  "rechargeTimingInsight": "Analyze the customer's recharge timing patterns from history and provide specific recommendations on WHEN to perform the suggested recharge amount. Consider: their typical balance thresholds when they recharge, historical consumption leading to recharges, seasonal patterns, and optimal timing to avoid low balance situations or frequent top-ups. Examples: 'You typically recharge when your balance drops below 300 BDT. To maintain a healthy buffer, consider topping up at the start of each month.' or 'Your pattern of recharging on the 15th of each month works well with your consumption cycle; continue this trend.' or 'During summer months, consider splitting your recharge into two mid-month payments due to higher AC usage and cost.'",
  "actionableTip": "Provide one brief, overarching actionable tip that combines insights from consumption, recharge patterns, and future needs. For example: 'To avoid future low balance situations, consider topping up [suggested amount] BDT at the beginning of each [month type, e.g., summer] month based on your historical peak usage.', or 'Your stable consumption and healthy balance suggest you're managing your electricity effectively. Keep up the good work!'",

  // --- New advanced forecasting fields ---
  "balanceDepletionForecast": {
    "daysRemaining": number, // Predicted number of days until balance runs out, based on recent daily consumption and seasonality
    "expectedDepletionDate": "YYYY-MM-DD", // Date when balance is expected to reach zero
    "details": "Explain the reasoning, e.g., 'Based on your average daily consumption of X kWh (Y BDT) over the last 14 days and your current balance, your balance is expected to last Z days, until [date].'"
  },
  "currentMonthBillForecast": {
    "estimatedTotal": number, // Predicted total bill for the current month
    "details": "Explain the calculation, e.g., 'Based on your consumption so far this month and historical patterns for the remaining days, your estimated bill for ${currentMonth} is X BDT.'"
  },
  "futureConsumptionForecast": [
    { "month": "YYYY-MM", "estimatedConsumption": number, "estimatedBill": number },
    { "month": "YYYY-MM", "estimatedConsumption": number, "estimatedBill": number },
    { "month": "YYYY-MM", "estimatedConsumption": number, "estimatedBill": number }
  ]
}

Ensure the language is simple, encouraging, and directly useful for a typical homeowner. Do not include any text or explanations outside the JSON object.
`;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            temperature
        }
    });

    let jsonStr = response.text?.trim() || '';
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    try {
        return JSON.parse(jsonStr) as AiSummary;
    } catch (e) {
        console.error("Failed to parse AI response:", jsonStr, e);
        throw new Error("Failed to get a valid analysis from the AI.");
    }
};


// --- New Dashboard APIs ---

export const getCustomerLocation = async (accountNo: string): Promise<CustomerLocation> => {
    const response = await fetch(`https://prepaid.desco.org.bd/api/common/getCustomerLocation?accountNo=${accountNo}`);
    if (!response.ok) throw new Error('Failed to fetch customer location');
    const result = await response.json();
    if (result.code !== 200 || !result.data) throw new Error(result.message || 'Invalid data for customer location');
    return result.data;
};

export const getCustomerDailyConsumption = async (accountNo: string, meterNo: string, days: number = 30): Promise<DailyConsumption[]> => {
    const today = new Date();
    const fromDate = new Date();
    fromDate.setDate(today.getDate() - (days - 1));
    
    const url = `https://prepaid.desco.org.bd/api/unified/customer/getCustomerDailyConsumption?accountNo=${accountNo}&meterNo=${meterNo}&dateFrom=${formatDate(fromDate)}&dateTo=${formatDate(today)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch daily consumption');
    const result = await response.json();
    if (result.code !== 200 || !result.data) throw new Error(result.message || 'Invalid data for daily consumption');
    return result.data;
};


export const getRechargeHistory = async (accountNo: string, meterNo: string, year: number): Promise<RechargeHistoryItem[]> => {
    const fromDate = new Date(year, 0, 1); // January 1st of the selected year
    const toDate = new Date(year, 11, 31); // December 31st of the selected year

    const url = `https://prepaid.desco.org.bd/api/unified/customer/getRechargeHistory?accountNo=${accountNo}&meterNo=${meterNo}&dateFrom=${formatDate(fromDate)}&dateTo=${formatDate(toDate)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch recharge history for ${year}`);
    const result = await response.json();
    if (result.code !== 200 || !result.data) return []; // Return empty array if no data
    return result.data;
};

export const getCustomerMonthlyConsumption = async (accountNo: string, meterNo: string, months: number = 24): Promise<MonthlyConsumption[]> => {
    const today = new Date();
    const toMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const fromMonth = new Date();
    fromMonth.setMonth(toMonth.getMonth() - (months - 1));

    const url = `https://prepaid.desco.org.bd/api/unified/customer/getCustomerMonthlyConsumption?accountNo=${accountNo}&meterNo=${meterNo}&monthFrom=${formatMonth(fromMonth)}&monthTo=${formatMonth(toMonth)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch monthly consumption');
    const result = await response.json();
    if (result.code !== 200 || !result.data) throw new Error(result.message || 'Invalid data for monthly consumption');
    return result.data;
};