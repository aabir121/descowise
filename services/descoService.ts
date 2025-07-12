import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AccountInfo, BalanceData, BalanceResponse, CustomerLocation, MonthlyConsumption, RechargeHistoryItem, DailyConsumption, AiSummary } from '../types';
import { sanitizeCurrency, formatDate, formatMonth } from '../utils/dataSanitization';
import { fetchJsonWithHandling } from '../utils/api';
import { generateAiDashboardPrompt } from '../ai/promptGenerators';

// Helper to process recharge history into monthly format
const processRechargeHistoryToMonthly = (rechargeHistory: RechargeHistoryItem[]): Array<{month: string, rechargeAmount: number, rechargeCount: number}> => {
    const monthlyRecharge: Record<string, {amount: number, count: number}> = {};
    rechargeHistory.forEach(item => {
        const month = item.rechargeDate.substring(0, 7); // Extract YYYY-MM
        if (!monthlyRecharge[month]) {
            monthlyRecharge[month] = { amount: 0, count: 0 };
        }
        monthlyRecharge[month].amount += sanitizeCurrency(item.totalAmount);
        monthlyRecharge[month].count += 1;
    });
    return Object.entries(monthlyRecharge).map(([month, data]) => ({
        month,
        rechargeAmount: sanitizeCurrency(data.amount),
        rechargeCount: data.count
    })).sort((a, b) => a.month.localeCompare(b.month));
};

export const verifyAccount = async (accountNo: string) => {
    if (!accountNo || !/^\d+$/.test(accountNo) || accountNo.length < 5) {
        return { success: false, message: 'Invalid account number. Please enter only digits and ensure it is a valid length.' };
    }
    try {
        const url = `https://prepaid.desco.org.bd/api/unified/customer/getCustomerInfo?accountNo=${accountNo}`;
        const result = await fetchJsonWithHandling(url);
        if (result.code === 200 && result.data) {
            return { success: true, data: result.data };
        } else {
            return { success: false, message: result.message || 'Account not found or an unknown error occurred.' };
        }
    } catch (error: any) {
        return { success: false, message: error.message || 'A network error occurred.' };
    }
};

export const getAccountBalance = async (accountNo: string): Promise<BalanceResponse> => {
    try {
        const url = `https://prepaid.desco.org.bd/api/unified/customer/getBalance?accountNo=${accountNo}`;
        const result = await fetchJsonWithHandling(url);
        if (result.code === 200 && result.data) {
            const sanitizedData = { ...result.data };
            const hasNullValues = sanitizedData.balance === null || sanitizedData.balance === undefined || 
                                sanitizedData.currentMonthConsumption === null || sanitizedData.currentMonthConsumption === undefined;
            
            // Only sanitize if values are not null/undefined
            if ('balance' in sanitizedData && sanitizedData.balance !== null && sanitizedData.balance !== undefined) {
                sanitizedData.balance = sanitizeCurrency(sanitizedData.balance);
            }
            if ('emergencyBalance' in sanitizedData && sanitizedData.emergencyBalance !== null && sanitizedData.emergencyBalance !== undefined) {
                sanitizedData.emergencyBalance = sanitizeCurrency(sanitizedData.emergencyBalance);
            }
            
            return { 
                success: true, 
                data: sanitizedData,
                hasNullValues: hasNullValues,
                nullValueMessage: hasNullValues ? 'Balance information temporarily unavailable' : undefined
            };
        }
        return { success: false, message: result.message || 'Could not fetch balance from API response.' };
    } catch (error: any) {
        return { success: false, message: error.message || 'A network error occurred while fetching balance.' };
    }
};

export const getAiDashboardSummary = async (
    monthlyConsumption: MonthlyConsumption[], 
    rechargeHistory: RechargeHistoryItem[], 
    balanceData: BalanceData | null, 
    currentMonth: string,
    recentDailyConsumption: DailyConsumption[],
    banglaEnabled: boolean = false
): Promise<AiSummary> => {
    const sanitizedMonthlyConsumption = monthlyConsumption.map(item => ({
        ...item,
        consumedTaka: sanitizeCurrency(item.consumedTaka)
    }));
    const sanitizedRechargeHistory = rechargeHistory.map(item => ({
        ...item,
        totalAmount: sanitizeCurrency(item.totalAmount)
    }));
    const sanitizedRecentDailyConsumption = recentDailyConsumption.map(item => ({
        ...item,
        consumedTaka: sanitizeCurrency(item.consumedTaka)
    }));
    const sanitizedCurrentBalance = balanceData?.balance !== null && balanceData?.balance !== undefined ? sanitizeCurrency(balanceData.balance) : 0;
    const currentMonthConsumption = balanceData?.currentMonthConsumption !== null && balanceData?.currentMonthConsumption !== undefined ? sanitizeCurrency(balanceData.currentMonthConsumption) : null;
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        throw new Error("Gemini API key not configured. Please set GEMINI_API_KEY in your Vercel environment variables.");
    }
    const ai = new GoogleGenAI({ apiKey });
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-preview-04-17';
    let temperature = 0.3;
    if (process.env.GEMINI_TEMPERATURE) {
        const parsed = parseFloat(process.env.GEMINI_TEMPERATURE);
        if (!isNaN(parsed)) temperature = parsed;
    }
    const monthlyRechargeData = processRechargeHistoryToMonthly(sanitizedRechargeHistory);
    const prompt = generateAiDashboardPrompt(sanitizedMonthlyConsumption, monthlyRechargeData, sanitizedRecentDailyConsumption, sanitizedCurrentBalance, currentMonth, balanceData?.readingTime, currentMonthConsumption, banglaEnabled ? 'bn' : 'en');
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

export async function askGeminiAboutAccount(
    question: string,
    data: any,
    processedData: any,
    banglaEnabled: boolean = false
): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        throw new Error("Gemini API key not configured. Please set GEMINI_API_KEY in your Vercel environment variables.");
    }
    const ai = new GoogleGenAI({ apiKey });
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-preview-04-17';
    let temperature = 0.3;
    if (process.env.GEMINI_TEMPERATURE) {
        const parsed = parseFloat(process.env.GEMINI_TEMPERATURE);
        if (!isNaN(parsed)) temperature = parsed;
    }
    let prompt = '';
    if (banglaEnabled) {
        prompt = `আপনি একজন বিদ্যুৎ বিল ও রিচার্জ বিশ্লেষক, যিনি সাধারণ মানুষের জন্য সহজ ভাষায়, বন্ধুর মতো বোঝান।\n\nনিচে গ্রাহকের বিদ্যুৎ সংক্রান্ত তথ্য ও ব্যবহারকারীর প্রশ্ন দেয়া হলো।\n\n*গ্রাহকের তথ্য (JSON):*\n${JSON.stringify(data, null, 2)}\n\n*প্রসেসড ড্যাশবোর্ড ডেটা (JSON):*\n${JSON.stringify(processedData, null, 2)}\n\n*প্রশ্ন:*\n${question}\n\nসহজ, গল্পের মতো, বন্ধুর মতো উত্তর দিন। কঠিন শব্দ বা জটিলতা এড়িয়ে চলুন।`; 
    } else {
        prompt = `You are an expert electricity bill and recharge analyst for residential customers.\n\nBelow is the user's account data and their question.\n\n*Account Data (JSON):*\n${JSON.stringify(data, null, 2)}\n\n*Processed Dashboard Data (JSON):*\n${JSON.stringify(processedData, null, 2)}\n\n*User's Question:*\n${question}\n\nAnswer in a friendly, conversational, and encouraging tone. Use simple language and examples if helpful.`;
    }
    const response: GenerateContentResponse = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "text/plain",
            temperature
        }
    });
    return response.text?.trim() || 'Sorry, I could not get an answer.';
}

export const getCustomerLocation = async (accountNo: string): Promise<CustomerLocation> => {
    const url = `https://prepaid.desco.org.bd/api/common/getCustomerLocation?accountNo=${accountNo}`;
    const result = await fetchJsonWithHandling(url);
    if (result.code !== 200 || !result.data) throw new Error(result.message || 'Invalid data for customer location');
    return result.data;
};

export const getCustomerDailyConsumption = async (accountNo: string, meterNo: string, days: number = 30): Promise<DailyConsumption[]> => {
    const today = new Date();
    const fromDate = new Date();
    fromDate.setDate(today.getDate() - (days - 1));
    const url = `https://prepaid.desco.org.bd/api/unified/customer/getCustomerDailyConsumption?accountNo=${accountNo}&meterNo=${meterNo}&dateFrom=${formatDate(fromDate)}&dateTo=${formatDate(today)}`;
    const result = await fetchJsonWithHandling(url);
    if (result.code !== 200 || !result.data) throw new Error(result.message || 'Invalid data for daily consumption');
    
    // Sort data by date to ensure proper calculation
    const sortedData = result.data.sort((a: DailyConsumption, b: DailyConsumption) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Calculate daily consumption by subtracting previous day's accumulated value
    return sortedData.map((item: DailyConsumption, index: number) => {
        const currentAccumulatedTaka = sanitizeCurrency(item.consumedTaka);
        const currentAccumulatedUnit = item.consumedUnit || 0;
        
        let dailyTaka = currentAccumulatedTaka;
        let dailyUnit = currentAccumulatedUnit;
        
        // If not the first item, calculate daily difference
        if (index > 0) {
            const previousItem = sortedData[index - 1];
            const previousAccumulatedTaka = sanitizeCurrency(previousItem.consumedTaka);
            const previousAccumulatedUnit = previousItem.consumedUnit || 0;
            
            dailyTaka = currentAccumulatedTaka - previousAccumulatedTaka;
            dailyUnit = currentAccumulatedUnit - previousAccumulatedUnit;
            
            // Ensure non-negative values (in case of data inconsistencies)
            dailyTaka = Math.max(0, dailyTaka);
            dailyUnit = Math.max(0, dailyUnit);
        }
        
        return {
            ...item,
            consumedTaka: dailyTaka,
            consumedUnit: dailyUnit
        };
    });
};

export const getRechargeHistory = async (accountNo: string, meterNo: string, year: number): Promise<RechargeHistoryItem[]> => {
    const fromDate = new Date(year, 0, 1); // January 1st
    const toDate = new Date(year, 11, 31); // December 31st
    const url = `https://prepaid.desco.org.bd/api/unified/customer/getRechargeHistory?accountNo=${accountNo}&meterNo=${meterNo}&dateFrom=${formatDate(fromDate)}&dateTo=${formatDate(toDate)}`;
    const result = await fetchJsonWithHandling(url);
    if (result.code !== 200 || !result.data) return [];
    return result.data.map((item: RechargeHistoryItem) => ({
        ...item,
        totalAmount: sanitizeCurrency(item.totalAmount)
    }));
};

export const getCustomerMonthlyConsumption = async (accountNo: string, meterNo: string, months: number = 24): Promise<MonthlyConsumption[]> => {
    const today = new Date();
    const toMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const fromMonth = new Date();
    fromMonth.setMonth(toMonth.getMonth() - (months - 1));
    const url = `https://prepaid.desco.org.bd/api/unified/customer/getCustomerMonthlyConsumption?accountNo=${accountNo}&meterNo=${meterNo}&monthFrom=${formatMonth(fromMonth)}&monthTo=${formatMonth(toMonth)}`;
    const result = await fetchJsonWithHandling(url);
    if (result.code !== 200 || !result.data) throw new Error(result.message || 'Invalid data for monthly consumption');
    return result.data.map((item: MonthlyConsumption) => ({
        ...item,
        consumedTaka: sanitizeCurrency(item.consumedTaka)
    }));
};