// import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AccountInfo, BalanceData, CustomerLocation, MonthlyConsumption, RechargeHistoryItem, DailyConsumption, AiSummary } from '../types';

// Helper to format a date as YYYY-MM-DD
const formatDate = (date: Date): string => date.toISOString().split('T')[0];

// Helper to format a date as YYYY-MM
const formatMonth = (date: Date): string => date.toISOString().substring(0, 7);

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

// export const getAiDashboardSummary = async (monthlyConsumption: MonthlyConsumption[]): Promise<AiSummary> => {
//     if (!process.env.API_KEY) {
//         throw new Error("API_KEY environment variable not set.");
//     }
//     const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

//     const prompt = `
//       You are an expert electricity bill analyst. Analyze the following 24 months of electricity consumption data for a residential customer.
//       The data is provided as a JSON array where 'month' is the year-month, 'consumedUnit' is the consumption in kWh, and 'consumedTaka' is the cost in BDT.

//       Data:
//       ${JSON.stringify(monthlyConsumption)}

//       Based on this data, provide a concise analysis in a JSON object format. The JSON object must have the following structure:
//       {
//         "title": "A brief, encouraging title for the summary (e.g., 'Steady Consumption Trend')",
//         "summary": "A 2-3 sentence summary of the user's overall consumption pattern. Mention the average monthly consumption in kWh.",
//         "anomaly": {
//           "detected": true or false,
//           "details": "If an anomaly is detected (e.g., a month with consumption >50% higher than the 6-month average), describe it here in one sentence. For example: 'A significant spike was detected in January 2025.' If no anomaly is detected, this string should be empty."
//         }
//       }

//       Be insightful but keep the language simple and easy to understand. Do not include any text outside the JSON object.
//     `;

//     const response: GenerateContentResponse = await ai.models.generateContent({
//         model: 'gemini-2.5-flash-preview-04-17',
//         contents: prompt,
//         config: {
//             responseMimeType: "application/json",
//             temperature: 0.5
//         }
//     });

//     let jsonStr = response.text.trim();
//     const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
//     const match = jsonStr.match(fenceRegex);
//     if (match && match[2]) {
//       jsonStr = match[2].trim();
//     }
    
//     try {
//         return JSON.parse(jsonStr) as AiSummary;
//     } catch (e) {
//         console.error("Failed to parse AI response:", jsonStr, e);
//         throw new Error("Failed to get a valid analysis from the AI.");
//     }
// };


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