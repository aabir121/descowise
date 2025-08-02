import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AccountInfo, BalanceData, BalanceResponse, CustomerLocation, MonthlyConsumption, RechargeHistoryItem, DailyConsumption, AiSummary, AiError, AiSummaryResponse } from '../types';
import { sanitizeCurrency, formatDate, formatMonth } from '../utils/dataSanitization';
import { fetchJsonWithHandling } from '../utils/api';
import { generateAiDashboardPrompt } from '../ai/promptGenerators';
import { getApiKeyForRequest } from '../utils/deploymentConfig';
import { getUserApiKey, setApiKeyValidationStatus } from '../utils/apiKeyStorage';

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
            // Only balance being null/undefined is considered a problem
            const hasNullValues = sanitizedData.balance === null || sanitizedData.balance === undefined;
            
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
): Promise<AiSummaryResponse> => {
    try {
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
        
        const userApiKey = getUserApiKey();
        const apiKey = getApiKeyForRequest(userApiKey);

        if (!apiKey || apiKey === 'your_gemini_api_key_here') {
            return {
                success: false,
                error: {
                    type: 'api_key',
                    message: 'Gemini API key not configured',
                    details: 'Please configure your Gemini API key to enable AI insights.',
                    retryable: false
                }
            };
        }

        const ai = new GoogleGenAI({ apiKey });
        const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
        let temperature = 0.3;
        if (process.env.GEMINI_TEMPERATURE) {
            const parsed = parseFloat(process.env.GEMINI_TEMPERATURE);
        if (!isNaN(parsed)) temperature = parsed;
        }

        const monthlyRechargeData = processRechargeHistoryToMonthly(sanitizedRechargeHistory);
        const prompt = generateAiDashboardPrompt(sanitizedMonthlyConsumption, monthlyRechargeData, sanitizedRecentDailyConsumption, sanitizedCurrentBalance, currentMonth, balanceData?.readingTime, currentMonthConsumption, banglaEnabled ? 'bn' : 'en');

        // Check prompt length for token limit
        const estimatedTokens = Math.ceil(prompt.length / 4); // Rough estimation
        if (estimatedTokens > 30000) { // Conservative limit
            return {
                success: false,
                error: {
                    type: 'token_limit',
                    message: 'Input data too large for AI analysis',
                    details: `Estimated tokens: ${estimatedTokens.toLocaleString()}. Please try with less historical data.`,
                    retryable: true
                }
            };
        }

        const response: GenerateContentResponse = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature
            }
        });

        // Check for safety blocks in the response
        if (response?.promptFeedback?.blockReason) {
            return {
                success: false,
                error: {
                    type: 'safety_block',
                    message: 'AI analysis blocked due to safety concerns',
                    details: `Prompt blocked: ${response.promptFeedback.blockReason}`,
                    retryable: true
                }
            };
        }

        if (response.candidates && response.candidates.length > 0) {
            const firstCandidate = response.candidates[0];
            if (firstCandidate.finishReason === 'SAFETY') {
                return {
                    success: false,
                    error: {
                        type: 'safety_block',
                        message: 'AI response blocked due to safety concerns',
                        details: 'The generated content was blocked due to safety filters.',
                        retryable: true
                    }
                };
            }
        }

        let jsonStr = response.text?.trim() || '';
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }

        try {
            const aiSummary = JSON.parse(jsonStr) as AiSummary;
            return {
                success: true,
                data: aiSummary
            };
        } catch (e) {
            console.error("Failed to parse AI response:", jsonStr, e);
            return {
                success: false,
                error: {
                    type: 'parsing',
                    message: 'Failed to parse AI response',
                    details: 'The AI generated invalid JSON format. Please try again.',
                    retryable: true
                }
            };
        }
    } catch (error: any) {
        console.error("AI Service Error:", error);
        
        // Handle specific error types
        if (error.message?.includes('API key')) {
            // Mark API key as invalid
            setApiKeyValidationStatus(false);
            return {
                success: false,
                error: {
                    type: 'api_key',
                    message: 'Invalid API key',
                    details: 'Please check your Gemini API key configuration.',
                    retryable: false
                }
            };
        }
        
        if (error.message?.includes('rate limit') || error.message?.includes('429')) {
            return {
                success: false,
                error: {
                    type: 'rate_limit',
                    message: 'Rate limit exceeded',
                    details: 'Too many requests. Please wait a moment and try again.',
                    retryable: true,
                    statusCode: 429
                }
            };
        }
        
        if (error.message?.includes('timeout') || error.message?.includes('504')) {
            return {
                success: false,
                error: {
                    type: 'timeout',
                    message: 'Request timed out',
                    details: 'The AI analysis took too long. Please try again.',
                    retryable: true,
                    statusCode: 504
                }
            };
        }
        
        if (error.message?.includes('network') || error.message?.includes('fetch')) {
            return {
                success: false,
                error: {
                    type: 'network',
                    message: 'Network error',
                    details: 'Please check your internet connection and try again.',
                    retryable: true
                }
            };
        }
        
        // Default error
        return {
            success: false,
            error: {
                type: 'unknown',
                message: 'AI analysis failed',
                details: error.message || 'An unexpected error occurred.',
                retryable: true
            }
        };
    }
};

// Gemini-powered AI balance estimation for BalanceDisplay
export const getAiBalanceEstimate = async (
    monthlyConsumption: MonthlyConsumption[],
    rechargeHistory: RechargeHistoryItem[],
    balanceData: BalanceData | null,
    currentMonth: string,
    recentDailyConsumption: DailyConsumption[],
    banglaEnabled: boolean = false
): Promise<{ estimate: number | null, insight: string, estimatedDaysRemaining?: number | null, error?: string }> => {
    try {
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
        const readingTime = balanceData?.readingTime;

        const userApiKey = getUserApiKey();
        const apiKey = getApiKeyForRequest(userApiKey);

        if (!apiKey || apiKey === 'your_gemini_api_key_here') {
            return {
                estimate: null,
                insight: '',
                estimatedDaysRemaining: null,
                error: 'Gemini API key not configured'
            };
        }

        const ai = new GoogleGenAI({ apiKey });
        const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
        let temperature = 0.3;
        if (process.env.GEMINI_TEMPERATURE) {
            const parsed = parseFloat(process.env.GEMINI_TEMPERATURE);
            if (!isNaN(parsed)) temperature = parsed;
        }

        // Focused prompt for balance estimation with days remaining
        const prompt = `You are an electricity usage analyst. Given the following data, estimate the user's current true balance (in BDT), provide a short, friendly insight about their balance trend, and estimate the number of days remaining before the balance runs out. Respond in JSON: { "estimate": number, "insight": string, "estimatedDaysRemaining": number }\n\nCurrent Balance: ${sanitizedCurrentBalance}\nCurrent Month Consumption: ${currentMonthConsumption}\nReading Time: ${readingTime}\nCurrent Month: ${currentMonth}\n\nRecent Daily Consumption (last 14 days): ${JSON.stringify(sanitizedRecentDailyConsumption)}\n\nMonthly Consumption (24 months): ${JSON.stringify(sanitizedMonthlyConsumption)}\n\nRecharge History (24 months): ${JSON.stringify(sanitizedRechargeHistory)}\n\nRespond in ${banglaEnabled ? 'Bengali' : 'English'} with a conversational tone.`;

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
            const aiResult = JSON.parse(jsonStr);
            return {
                estimate: typeof aiResult.estimate === 'number' ? aiResult.estimate : null,
                insight: typeof aiResult.insight === 'string' ? aiResult.insight : '',
                estimatedDaysRemaining: typeof aiResult.estimatedDaysRemaining === 'number' ? aiResult.estimatedDaysRemaining : null,
            };
        } catch (e) {
            return {
                estimate: null,
                insight: '',
                estimatedDaysRemaining: null,
                error: 'Failed to parse AI response'
            };
        }
    } catch (error: any) {
        return {
            estimate: null,
            insight: '',
            estimatedDaysRemaining: null,
            error: error.message || 'AI analysis failed'
        };
    }
};

/**
 * Validate a Gemini API key by making a simple test request
 */
export const validateApiKey = async (apiKey: string): Promise<{ isValid: boolean; error?: string }> => {
    try {
        if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
            return { isValid: false, error: 'API key is required' };
        }

        const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
        const model = 'gemini-2.5-flash';

        // Make a simple test request
        const response = await ai.models.generateContent({
            model,
            contents: 'Say "API key is valid" in JSON format: {"status": "valid"}',
            config: {
                responseMimeType: "application/json",
                temperature: 0
            }
        });

        if (response?.text) {
            // Mark as valid and store validation status
            setApiKeyValidationStatus(true);
            return { isValid: true };
        } else {
            setApiKeyValidationStatus(false);
            return { isValid: false, error: 'Invalid response from API' };
        }
    } catch (error: any) {
        setApiKeyValidationStatus(false);

        if (error.message?.includes('API key')) {
            return { isValid: false, error: 'Invalid API key' };
        } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
            return { isValid: false, error: 'API quota exceeded' };
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
            return { isValid: false, error: 'Network error - please check your connection' };
        } else {
            return { isValid: false, error: 'API key validation failed' };
        }
    }
};

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